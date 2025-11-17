
// Per-member attacks and equipped sets
const PARTY_ATTACKS = {
  'ONE': { ATTACK_INVENTORY: [], ATTACK_EQUIPPED: new Set() },
  'TWO': { ATTACK_INVENTORY: [], ATTACK_EQUIPPED: new Set() },
  'THREE': { ATTACK_INVENTORY: [], ATTACK_EQUIPPED: new Set() },
  'FOUR': { ATTACK_INVENTORY: [], ATTACK_EQUIPPED: new Set() },
  'FIVE': { ATTACK_INVENTORY: [], ATTACK_EQUIPPED: new Set() },
};

// Track which member is currently selected in the UI
let SELECTED_MEMBER = 'ONE';

let attackCounter = 1; // A simple counter to generate unique IDs
const map = document.getElementById("map");
const mapContainer = document.getElementById("map-container");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");

const rows = 20;
const cols = 20;
let pathLength = 100; // Default for normal mode
let currentGameMode = 'normal'; // Track current game mode
let tileData = {};

// Initialize game mode from URL or localStorage
function initializeGameMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    if (modeParam) {
        currentGameMode = modeParam;
        localStorage.setItem('selectedGameMode', modeParam);
    } else {
        currentGameMode = localStorage.getItem('selectedGameMode') || 'normal';
    }
    
    // Set pathLength based on mode
    if (currentGameMode === 'hard') {
        pathLength = 50; // Hard mode is levels 100-150, so 50 tiles
    } else {
        pathLength = 100; // Normal mode is levels 1-100
    }
    
    return currentGameMode;
}

// Make it globally accessible
window.initializeGameMode = initializeGameMode;
window.getCurrentGameMode = function() { return currentGameMode; };

// --- Dungeon Progression Functions (global - accessible on all pages) ---
function loadDungeonProgression() {
  try {
    const mode = currentGameMode || 'normal';
    const saved = localStorage.getItem(`dungeonProgressionData_${mode}`);
    return saved ? JSON.parse(saved) : { clearedLevels: [], unlockedUpToLevel: 1 };
  } catch (e) {
    return { clearedLevels: [], unlockedUpToLevel: 1 };
  }
}

function saveDungeonProgression(progression) {
  try {
    const mode = currentGameMode || 'normal';
    localStorage.setItem(`dungeonProgressionData_${mode}`, JSON.stringify(progression));
  } catch (e) {
    console.error('Failed to save dungeon progression', e);
  }
}

// Mark a level as cleared and unlock the next one
function clearLevelAndUnlock(level) {
  console.log('clearLevelAndUnlock called for level:', level);
  const progression = loadDungeonProgression();
  console.log('Current progression before update:', progression);
  
  // Mark this level as cleared if not already
  if (!progression.clearedLevels.includes(level)) {
    progression.clearedLevels.push(level);
  }
  
  // Unlock the next level if this is a new highest cleared
  if (level >= progression.unlockedUpToLevel) {
    progression.unlockedUpToLevel = level + 1;
  }
  
  console.log('Updated progression:', progression);
  saveDungeonProgression(progression);
  
  // Update tileData if it exists (it will on map.html)
  if (typeof tileData !== 'undefined' && Object.keys(tileData).length > 0) {
    for (const key in tileData) {
      if (tileData[key].level === level) {
        tileData[key].cleared = true;
      }
      // Enable access to all levels up to unlocked level
      if (tileData[key].level <= progression.unlockedUpToLevel) {
        tileData[key].status = true;
      }
    }
    const mode = currentGameMode || 'normal';
    localStorage.setItem(`dungeonTileData_${mode}`, JSON.stringify(tileData));
    console.log('Updated tileData in localStorage for mode:', mode);
  } else {
    console.log('tileData not available, progression saved for map reload');
  }
  
  console.log(`Level ${level} cleared! Unlocked up to level ${progression.unlockedUpToLevel}`);
}

// Make globally accessible for battle.html
window.clearLevelAndUnlock = clearLevelAndUnlock;
window.loadDungeonProgression = loadDungeonProgression;
window.saveDungeonProgression = saveDungeonProgression;

if (map){
  console.log("Map found, initializing...");

// Function to generate the dungeon using recursive backtracking and save to local storage
function generateAndSaveDungeon() {
  tileData = {}; // Clear existing tile data
  let dungeonPath = [];
  let visited = new Set();
  let success = false;
  let attempts = 0;
  const maxAttempts = 50;
  
  // Reset dungeon progression: only level 1 is playable initially
  localStorage.removeItem('dungeonProgressionData');
  
  // A helper function to find unvisited neighbors
  function getUnvisitedNeighbors(row, col) {
    const neighbors = [
      { r: row + 1, c: col },
      { r: row - 1, c: col },
      { r: row, c: col + 1 },
      { r: row, c: col - 1 }
    ];
    return neighbors.filter(neighbor => {
      return neighbor.r >= 0 && neighbor.r < rows && neighbor.c >= 0 && neighbor.c < cols && !visited.has(`${neighbor.r},${neighbor.c}`);
    });
  }

  // The recursive backtracking function
  function findPath(row, col) {
    const currentKey = `${row},${col}`;
    if (dungeonPath.length >= pathLength) {
      return true;
    }
    
    visited.add(currentKey);
    dungeonPath.push({ row, col });

    const neighbors = getUnvisitedNeighbors(row, col);
    // Shuffle the neighbors to ensure a random path
    neighbors.sort(() => Math.random() - 0.5);

    for (const neighbor of neighbors) {
      if (!visited.has(`${neighbor.r},${neighbor.c}`)) {
        if (findPath(neighbor.r, neighbor.c)) {
          return true;
        }
      }
    }
    
    // Backtrack: remove current tile and visited marker
    dungeonPath.pop();
    visited.delete(currentKey);
    return false;
  }

  // Try multiple times to generate a valid path
  while (!success && attempts < maxAttempts) {
    dungeonPath = [];
    visited = new Set();
    // Ensure level 1 starts within the initial visible 10x10 area
    const startRow = Math.floor(Math.random() * Math.min(10, rows));
    const startCol = Math.floor(Math.random() * Math.min(10, cols));
    success = findPath(startRow, startCol);
    attempts++;
    if (!success) {
      console.log(`Attempt ${attempts} failed, retrying...`);
    }
  }
  
  if (!success) {
    console.error('Failed to generate dungeon after', maxAttempts, 'attempts');
    return;
  }
  
  console.log(`Successfully generated ${dungeonPath.length}-tile dungeon in ${attempts} attempt(s)`);

  // Helper: collect enemies by tier
  function getEnemiesByTier(tier){
    const list = [];
    for (const key in ENEMY_BASE_STATS) {
      const e = ENEMY_BASE_STATS[key];
      if (e && Number(e.tier) === Number(tier) && e.image) list.push(e.image);
    }
    return list;
  }

  function levelToTier(level){
    const lvl = Number(level)||1;
    // Boss levels: 25, 50, 75, 100
    if (lvl === 100) return 6; // Divine King (tier 6)
    if (lvl === 75 || lvl === 50 || lvl === 25) return 5; // Boss tier 5
    // Regular tiers based on level ranges
    if (lvl <= 20) return 1;
    if (lvl <= 40) return 2;
    if (lvl <= 60) return 3;
    if (lvl <= 80) return 4;
    return 4; // 81-99 stay at tier 4
  }

  // Populate tileData from the generated path
  dungeonPath.forEach((coords, index) => {
    const key = `${coords.row},${coords.col}`;
    
    // Calculate actual level based on game mode
    const tileIndex = index + 1;
    const level = currentGameMode === 'hard' ? (100 + tileIndex) : tileIndex;
    
    const tile = { level };

    // Hard Mode specific logic
    if (currentGameMode === 'hard') {
      if (tileIndex === 1) {
        // First tile of hard mode (level 101)
        tile.title = "Hard Mode - Start";
        tile.description = "The true challenge begins here.";
        tile.cleared = false;
        tile.status = true; // accessible
        const pool = getEnemiesByTier(4);
        tile.enemyOne = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyTwo = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyThree = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyFour = null;
        tile.enemyFive = null;
      } else if (level === 150) {
        // Final boss of hard mode: Lightning Shark
        tile.title = "Hard Mode Final Boss";
        tile.description = "The Lightning Shark awaits your challenge.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        tile.enemyOne = "Enemies/lightningShark.png";
        tile.enemyTwo = null;
        tile.enemyThree = null;
        tile.enemyFour = null;
        tile.enemyFive = null;
      } else if ((level - 100) % 5 === 0) {
        // Boss stages every 5 levels (105, 110, 115, etc.)
        tile.title = "Hard Mode Boss";
        tile.description = "Double boss encounter with enhanced stats.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        const pool = getEnemiesByTier(5);
        tile.enemyOne = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyTwo = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyThree = null;
        tile.enemyFour = null;
        tile.enemyFive = null;
      } else {
        // Regular hard mode tiles: up to 5 enemies
        tile.title = "Hard Mode";
        tile.description = "Face enhanced enemies in this brutal challenge.";
        tile.cleared = false;
        tile.status = false;
        
        // Mix of tier 4-5 enemies
        let pool = getEnemiesByTier(4).concat(getEnemiesByTier(5));
        const count = 3 + Math.floor(Math.random() * 3); // 3-5 enemies
        const picks = [];
        for (let i = 0; i < count; i++) {
          if (!pool.length) break;
          const img = pool[Math.floor(Math.random() * pool.length)];
          picks.push(img);
        }
        tile.enemyOne = picks[0] || null;
        tile.enemyTwo = picks[1] || null;
        tile.enemyThree = picks[2] || null;
        tile.enemyFour = picks[3] || null;
        tile.enemyFive = picks[4] || null;
      }
    }
    // Normal Mode logic
    else {
      if (level === 1) {
        tile.title = "Start Tile";
        tile.description = "This is the beginning of the map.";
        tile.cleared = false;
        tile.status = true;
        const pool = getEnemiesByTier(1);
        tile.enemyOne = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else if (level === 100) {
        // Final boss: Divine King (tier 6)
        tile.title = "Divine King";
        tile.description = "The ultimate challenge awaits.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        tile.enemyOne = "Enemies/divineKing.png";
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else if (level === 75 || level === 50 || level === 25) {
        // Boss levels: tier 5
        tile.title = "Boss";
        tile.description = "A powerful boss blocks your path.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        const pool = getEnemiesByTier(5);
        tile.enemyOne = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else {
        // Regular tiles: choose tier by level bands
        tile.title = "Basic";
        tile.description = `A path leads you deeper into the dungeon.`;
        tile.cleared = false;
        tile.status = false;
        
        // After level 10, mix enemies from different tiers
        let pool = [];
        if (level <= 10) {
          const tier = levelToTier(level);
          pool = getEnemiesByTier(tier);
        } else {
          const baseTier = levelToTier(level);
          const tierRange = [];
          if (baseTier > 1) tierRange.push(baseTier - 1);
          tierRange.push(baseTier);
          if (baseTier < 5) tierRange.push(baseTier + 1);
          
          tierRange.forEach(t => {
            pool = pool.concat(getEnemiesByTier(t));
          });
        }
        
        const count = (function enemiesCountForLevel(level){
          const lvl = Number(level)||1;
          if (lvl === 1) return 1;
          if (lvl <= 10) return 1 + Math.floor(Math.random()*2);
          if (lvl <= 25) return 2;
          if (lvl <= 50) return 2 + Math.floor(Math.random()*2);
          if (lvl <= 75) return 3;
          if (lvl < 100) return 3 + Math.floor(Math.random()*2);
          return 1;
        })(level);
        const picks = [];
        for (let i=0; i<count; i++) {
          if (!pool.length) break;
          const img = pool[Math.floor(Math.random()*pool.length)];
          picks.push(img);
        }
        tile.enemyOne = picks[0] || null;
        tile.enemyTwo = picks[1] || null;
        tile.enemyThree = picks[2] || null;
      }
    }

    tileData[key] = tile;
  });

  const mode = currentGameMode || 'normal';
  localStorage.setItem(`dungeonTileData_${mode}`, JSON.stringify(tileData));
}

// Function to render the grid based on tileData
function renderGrid() {
  map.innerHTML = ''; // Clear the grid first
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      const key = `${row},${col}`;
      const data = tileData[key];

      if (data) {
        cell.style.visibility = "visible";
        cell.style.opacity = data.status ? 1 : 0.5;
        cell.style.borderColor = data.cleared ? "green" : "black";
        cell.textContent = `Lvl ${data.level}`;
        // Boss marker styling for levels 25, 50, 75, 100
        if (data.level === 25 || data.level === 50 || data.level === 75 || data.level === 100) {
          cell.classList.add('boss-cell');
        } else {
          cell.classList.remove('boss-cell');
        }
      } else {
        cell.style.visibility = "hidden";
      }
      map.appendChild(cell);
    }
  }
}

// Event listener for the entire map container
map.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent body click listener from firing
  const cell = e.target.closest('.grid-cell');
  if (cell) {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const key = `${row},${col}`;
    const data = tileData[key];

    if (data) {
      const enemies = [
        data.enemyOne,
        data.enemyTwo,
        data.enemyThree
      ].filter(enemy => enemy);

      const enemiesHTML = enemies.map(enemy =>
        `<img src="${enemy}" alt="${data.title}" style="width:${100 / enemies.length}%"/>`
      ).join('');

      // Determine if this level is accessible (cleared or one above highest cleared)
      const highestCleared = getHighestClearedLevel();
      const isAccessible = data.cleared || data.level === highestCleared + 1;
      
      // Determine if this is a boss tile
      const isBossTile = data.level === 25 || data.level === 50 || data.level === 75 || data.level === 100;
      
      let battleButtonHTML = '';
      if (isAccessible) {
        battleButtonHTML = `<button onclick="startBattle('${data.title}', ${data.level}, '${enemies.join(',')}', ${isBossTile})" class="battle-btn">Battle</button>`;
      }

      const html = `
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <p>Level: ${data.level}</p>
        <div>${enemiesHTML}</div>
        <div style="margin-top: 1rem;">
          ${battleButtonHTML}
          <button onclick="closePopup()" class="close-btn">Close</button>
        </div>
      `;
      openPopup(html, cell);
    }
  }
});

// Function to get the highest cleared level
function getHighestClearedLevel() {
  let highest = 0;
  if (typeof tileData !== 'undefined' && tileData) {
    for (const key in tileData) {
      if (tileData[key].cleared && tileData[key].level > highest) {
        highest = tileData[key].level;
      }
    }
  }
  return highest;
}

// Function to get highest unlocked level
function getHighestUnlockedLevel() {
  const progression = loadDungeonProgression();
  return progression.unlockedUpToLevel;
}

// Function to open the popup
function openPopup(htmlContent, anchorEl) {
    popupContent.innerHTML = htmlContent;

    // Ensure popup is child of map (not map-container) for proper absolute positioning
    try {
      if (map && popup.parentElement !== map.parentElement) {
        map.parentElement.appendChild(popup);
      }
    } catch(e) {}

    let top = 20, left = 20;
    if (anchorEl && map) {
      // Get position of the cell relative to the map element
      const mapRect = map.getBoundingClientRect();
      const cellRect = anchorEl.getBoundingClientRect();
      // Position relative to map's coordinate space
      top = (cellRect.top - mapRect.top) + cellRect.height + 8;
      left = (cellRect.left - mapRect.left) + 8;
    }

    popup.style.position = 'absolute';
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    // Adjust if overflowing the map bounds
    try {
      const popupW = popup.offsetWidth;
      const popupH = popup.offsetHeight;
      const mapW = map ? map.offsetWidth : 1000;
      const mapH = map ? map.offsetHeight : 1000;

      // If overflowing right edge, shift left
      if (left + popupW > mapW - 8) {
        left = Math.max(8, mapW - popupW - 8);
      }
      // If overflowing bottom edge, shift up
      if (top + popupH > mapH - 8) {
        top = Math.max(8, mapH - popupH - 8);
      }
    } catch(e) {}

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.visibility = 'visible';
}

// Function to close the popup
function closePopup() {
    popup.style.display = "none";
}

// Function to start a battle with the selected enemies
function startBattle(stageName, level, enemyImages, isBossTile) {
    // Store battle data in sessionStorage for use in battle.html
    const battleData = {
        stageName: stageName,
        level: level,
        enemies: enemyImages.split(','),
        isBossTile: isBossTile || false
    };
    sessionStorage.setItem('battleData', JSON.stringify(battleData));
    
    // Navigate to battle.html
    window.location.href = 'battle.html';
}

// Event listener for the entire map container (REMOVED - duplicate listener)
// map.addEventListener("click", (e) => { ... });  <- This duplicate has been removed

// Close popup if clicking outside it
document.body.addEventListener("click", (e) => {
    // Only close if clicking outside the popup itself
    if (!popup.contains(e.target) && popup.style.display !== "none") {
        closePopup();
    }
});

// Initial setup on page load
function initialize() {
  // Initialize game mode first
  initializeGameMode();
  
  const mode = currentGameMode || 'normal';
  const savedData = localStorage.getItem(`dungeonTileData_${mode}`);
  if (savedData) {
    tileData = JSON.parse(savedData);
    // Apply saved progression to tile status
    const progression = loadDungeonProgression();
    console.log('Loading progression for mode', mode, ':', progression);
    for (const key in tileData) {
      const level = tileData[key].level;
      // Mark cleared levels
      if (progression.clearedLevels.includes(level)) {
        tileData[key].cleared = true;
      }
      // Enable levels up to highest unlocked (but keep 1 and 2 always accessible)
      if (level <= progression.unlockedUpToLevel) {
        tileData[key].status = true;
      }
    }
    // Save the updated tileData back to localStorage
    localStorage.setItem(`dungeonTileData_${mode}`, JSON.stringify(tileData));
  } else {
    generateAndSaveDungeon();
  }
  renderGrid();
}

// The button click function to regenerate the dungeon
function dungeonClick() {
  if (!confirm('Regenerate the dungeon? This will reset progression to the initial state.')) return;
  generateAndSaveDungeon();
  renderGrid();
}

// Run the initialization function when the page is loaded
window.onload = initialize;
}

// --- Dungeon Progression Functions (global - accessible on all pages) ---
function loadDungeonProgression() {
  try {
    const saved = localStorage.getItem('dungeonProgression');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load dungeon progression', e);
  }
  // Default: only level 1 unlocked
  return { clearedLevels: [], unlockedUpToLevel: 1 };
}

function saveDungeonProgression(progression) {
  try {
    localStorage.setItem('dungeonProgression', JSON.stringify(progression));
  } catch (e) {
    console.error('Failed to save dungeon progression', e);
  }
}

// Mark a level as cleared and unlock the next one
function clearLevelAndUnlock(level) {
  console.log('clearLevelAndUnlock called for level:', level);
  const progression = loadDungeonProgression();
  console.log('Current progression before update:', progression);
  
  // Mark this level as cleared if not already
  if (!progression.clearedLevels.includes(level)) {
    progression.clearedLevels.push(level);
  }
  
  // Unlock the next level if this is a new highest cleared
  if (level >= progression.unlockedUpToLevel) {
    progression.unlockedUpToLevel = level + 1;
  }
  
  console.log('Updated progression:', progression);
  saveDungeonProgression(progression);
  
  // Update tileData if it exists (it will on map.html)
  if (typeof tileData !== 'undefined' && Object.keys(tileData).length > 0) {
    for (const key in tileData) {
      if (tileData[key].level === level) {
        tileData[key].cleared = true;
      }
      // Enable access to all levels up to unlocked level
      if (tileData[key].level <= progression.unlockedUpToLevel) {
        tileData[key].status = true;
      }
    }
    localStorage.setItem('dungeonTileData', JSON.stringify(tileData));
    console.log('Updated tileData in localStorage');
  } else {
    console.log('tileData not available, progression saved for map reload');
  }
  
  console.log(`Level ${level} cleared! Unlocked up to level ${progression.unlockedUpToLevel}`);
}

// Make clearLevelAndUnlock globally accessible for battle.html
window.clearLevelAndUnlock = clearLevelAndUnlock;

function getHighestClearedLevel() {
  let highest = 0;
  if (typeof tileData !== 'undefined') {
    for (const key in tileData) {
      if (tileData[key].cleared && tileData[key].level > highest) {
        highest = tileData[key].level;
      }
    }
  }
  return highest;
}

function getHighestUnlockedLevel() {
  const progression = loadDungeonProgression();
  return progression.unlockedUpToLevel;
}

// Make these globally accessible too
window.getHighestClearedLevel = getHighestClearedLevel;
window.getHighestUnlockedLevel = getHighestUnlockedLevel;

// --- Global game data accessible on all pages ---
const INVENTORY = []; // Holds all inventory items globally

// Rarity color mapping
function getRarityColor(rarity) {
  const colors = {
    'Base': '#9d9d9d',
    'Common': '#ffffff',
    'Uncommon': '#1eff00',
    'Rare': '#0070dd',
    'Epic': '#a335ee',
    'Legendary': '#ff8000',
    'Mythical': '#ff5353ff',
    'Artifact': '#e0b83fff'
  };
  return colors[rarity] || '#ffffff';
}
window.getRarityColor = getRarityColor;

const ITEM_TABLE = {
  "Wooden Sword": {
    slot: "Weapon",
    rarity: "Common",
    strength: 4,
    speed: 1,
    magic: 0,
    defense: 2,
    health: 5,
    attack: "stap",
    ability: 1,
    image: "Items/woodenSword.png",
  },
  "Stick": {
    slot: "Weapon",
    rarity: "Base",
    strength: 2,
    speed: 1,
    magic: 2,
    defense: 0,
    health: 0,
    attack: "poke",
    ability: 0,
    image: "Items/stick.png",
  },
  "Grass Staff": {
    slot: "Weapon",
    rarity: "Common",
    strength: 1,
    speed: 1,
    magic: 4,
    defense: 2,
    health: 5,
    attack: "leaf impale",
    ability: 1,
    image: "Items/grassStaff.png",
  },
  "Coral Dagger": {
    slot: "Weapon",
    rarity: "Uncommon",
    strength: 5,
    speed: 2,
    magic: 2,
    defense: 1,
    health: 6,
    attack: "coral leech",
    ability: 2,
    image: "Items/coralDagger.png",
  },
  "Spell Shield": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 1,
    speed: 0,
    magic: 2,
    defense: 12,
    health: 7,
    attack: "reflection",
    ability: 3,
    image: "Items/spellShield.png",
  },
  "Sea Crystal": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 1,
    speed: 1,
    magic: 5,
    defense: 3,
    health: 7,
    attack: "sea shield",
    ability: 2,
    image: "Items/seaCrystal.png",
  },
  "Shell": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 3,
    speed: 0,
    magic: 0,
    defense: 16,
    health: 8,
    attack: "none",
    ability: 0,
    image: "Items/shell.png",
  },
  "Iron Helmet": {
    slot: "Helmet",
    rarity: "Uncommon",
    strength: 1,
    speed: 0,
    magic: 0,
    defense: 6,
    health: 8,
    attack: "none",
    ability: 0,
    image: "Items/ironHelmet.png",
  },
  "Iron Chestplate": {
    slot: "Chest",
    rarity: "Uncommon",
    strength: 1,
    speed: 0,
    magic: 0,
    defense: 12,
    health: 12,
    attack: "none",
    ability: 0,
    image: "Items/ironChest.png",
  },
  "Iron Legging": {
    slot: "Leg",
    rarity: "Uncommon",
    strength: 1,
    speed: 1,
    magic: 0,
    defense: 8,
    health: 6,
    attack: "none",
    ability: 0,
    image: "Items/ironPants.png",
  },
  "Iron Boots": {
    slot: "Boot",
    rarity: "Uncommon",
    strength: 1,
    speed: 2,
    magic: 0,
    defense: 4,
    health: 4,
    attack: "none",
    ability: 0,
    image: "Items/ironBoots.png",
  },
  "Spiked Shield": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 7,
    speed: 1,
    magic: 1,
    defense: 18,
    health: 12,
    attack: "Charge",
    ability: 4,
    image: "Items/spikedShield.png",
  },
  "Grimore": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 2,
    speed: 2,
    magic: 7,
    defense: 2,
    health: 8,
    attack: "Plasma Blast",
    ability: 5,
    image: "Items/grimoire.png",
  },
  "Forest Crown": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 2,
    speed: 3,
    magic: 3,
    defense: 8,
    health: 15,
    attack: "Tree People",
    ability: 6,
    image: "Items/forestCrown.png",
  },
  "Frosted Helmet": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 1,
    speed: 1,
    magic: 2,
    defense: 9,
    health: 14,
    attack: "none",
    ability: 0,
    image: "Items/frostHelmet.png",
  },
  "Frosted Chest": {
    slot: "Chest",
    rarity: "Rare",
    strength: 2,
    speed: 0,
    magic: 3,
    defense: 16,
    health: 18,
    attack: "none",
    ability: 0,
    image: "Items/frostChest.png",
  },
  "Frosted Leg": {
    slot: "Leg",
    rarity: "Rare",
    strength: 1,
    speed: 1,
    magic: 2,
    defense: 12,
    health: 10,
    attack: "none",
    ability: 0,
    image: "Items/frostPants.png",
  },
  "Frosted Boots": {
    slot: "Boot",
    rarity: "Rare",
    strength: 1,
    speed: 3,
    magic: 2,
    defense: 6,
    health: 8,
    attack: "none",
    ability: 0,
    image: "Items/frostBoots.png",
  },
  "Ice Spear": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 8,
    speed: 2,
    magic: 2,
    defense: 2,
    health: 8,
    attack: "plunge",
    ability: 1,
    image: "Items/iceSpear.png",
  },
  "Shadow Staff": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 3,
    speed: 2,
    magic: 10,
    defense: 3,
    health: 10,
    attack: "shadow vortex",
    ability: 7,
    image: "Items/shadowStaff.png",
  },
  "Blaze Blade": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 10,
    speed: 3,
    magic: 4,
    defense: 4,
    health: 10,
    attack: "Incenerate",
    ability: 8,
    image: "Items/blazeBlade.png",
  },
  "Gem Helmet": {
    slot: "Helmet",
    rarity: "Epic",
    strength: 3,
    speed: 1,
    magic: 3,
    defense: 14,
    health: 20,
    attack: "none",
    ability: 3,
    image: "Items/gemHelmet.png",
  },
  "Gem Chest": {
    slot: "Chest",
    rarity: "Epic",
    strength: 4,
    speed: 1,
    magic: 4,
    defense: 22,
    health: 26,
    attack: "none",
    ability: 0,
    image: "Items/gemChest.png",
  },
  "Gem Legs": {
    slot: "Leg",
    rarity: "Epic",
    strength: 3,
    speed: 2,
    magic: 3,
    defense: 16,
    health: 16,
    attack: "none",
    ability: 0,
    image: "Items/gemLegs.png",
  },
  "Gem Boots": {
    slot: "Boots",
    rarity: "Epic",
    strength: 2,
    speed: 4,
    magic: 2,
    defense: 10,
    health: 12,
    attack: "none",
    ability: 3,
    image: "Items/gemBoots.png",
  },
  "Water Skaters": {
    slot: "Boots",
    rarity: "Epic",
    strength: 2,
    speed: 4,
    magic: 2,
    defense: 12,
    health: 14,
    attack: "skater slice",
    ability: 9,
    image: "Items/waterSkaters.png",
  },
  "Energy Saber": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 12,
    speed: 3,
    magic: 5,
    defense: 8,
    health: 14,
    attack: "force strike",
    ability: 10,
    image: "Items/energySaber.png",
  },
  "Demon Sythe": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 14,
    speed: 3,
    magic: 3,
    defense: 5,
    health: 12,
    attack: "Grim slice",
    ability: 10,
    image: "Items/demonSythe.png",
  },
  "Lightning Spear": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 10,
    speed: 5,
    magic: 5,
    defense: 8,
    health: 14,
    attack: "Thunder",
    ability: 12,
    image: "Items/lightningSpear.png",
  },
  "Pixel Sword": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 13,
    speed: 4,
    magic: 3,
    defense: 6,
    health: 14,
    attack: "Combo",
    ability: 13,
    image: "Items/pixelSword.png",
  },
  "Ice Cream Gun": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 4,
    speed: 3,
    magic: 12,
    defense: 5,
    health: 12,
    attack: "Chilled Cream",
    ability: 14,
    image: "Items/iceCreamGun.png",
  },
  "Running Spikes": {
    slot: "Boots",
    rarity: "Mythical",
    strength: 4,
    speed: 8,
    magic: 4,
    defense: 14,
    health: 18,
    attack: "none",
    ability: 15,
    image: "Items/runningSpikes.png",
  },
  "Rulers Hand": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 10,
    speed: 4,
    magic: 5,
    defense: 12,
    health: 20,
    attack: "Arise",
    ability: 16,
    image: "Items/rulersHand.png",
  },
  "Muramasa": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 16,
    speed: 5,
    magic: 4,
    defense: 6,
    health: 16,
    attack: "Pure skill",
    ability: 17,
    image: "Items/muramasa.png",
  },
  "Spell Blade": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 6,
    speed: 4,
    magic: 15,
    defense: 7,
    health: 16,
    attack: "spell infused",
    ability: 18,
    image: "Items/spellBlade.png",
  },
  "Enhanced Stick": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 8,
    speed: 3,
    magic: 7,
    defense: 7,
    health: 14,
    attack: "enhance",
    ability: 19,
    image: "Items/enhancedStick.png",
  },
  "Divine Crown": {
    slot: "Helmet",
    rarity: "Artifact",
    strength: 6,
    speed: 5,
    magic: 6,
    defense: 18,
    health: 30,
    attack: "Rulers Authority",
    ability: 20,
    image: "Items/divineCrown.png",
  },
};

//------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------

//Battle Logic

// Persistence: save/load/reset game data (inventory, party stats, attacks)
const SAVE_KEY = 'game_save_v1';

function saveGameData() {
  try {
    const payload = {
      inventory: INVENTORY,
      partyStats: typeof PARTY_STATS !== 'undefined' ? PARTY_STATS : null,
      partyAttacks: typeof PARTY_ATTACKS !== 'undefined' ? {
        ONE: { ATTACK_INVENTORY: PARTY_ATTACKS.ONE.ATTACK_INVENTORY || [], ATTACK_EQUIPPED: Array.from(PARTY_ATTACKS.ONE.ATTACK_EQUIPPED || []) },
        TWO: { ATTACK_INVENTORY: PARTY_ATTACKS.TWO.ATTACK_INVENTORY || [], ATTACK_EQUIPPED: Array.from(PARTY_ATTACKS.TWO.ATTACK_EQUIPPED || []) },
        THREE: { ATTACK_INVENTORY: PARTY_ATTACKS.THREE.ATTACK_INVENTORY || [], ATTACK_EQUIPPED: Array.from(PARTY_ATTACKS.THREE.ATTACK_EQUIPPED || []) },
        FOUR: { ATTACK_INVENTORY: PARTY_ATTACKS.FOUR.ATTACK_INVENTORY || [], ATTACK_EQUIPPED: Array.from(PARTY_ATTACKS.FOUR.ATTACK_EQUIPPED || []) },
        FIVE: { ATTACK_INVENTORY: PARTY_ATTACKS.FIVE.ATTACK_INVENTORY || [], ATTACK_EQUIPPED: Array.from(PARTY_ATTACKS.FIVE.ATTACK_EQUIPPED || []) },
      } : null,
      attackCounter: typeof attackCounter !== 'undefined' ? attackCounter : 1,
      enchantmentInventory: typeof ENCHANTMENT_INVENTORY !== 'undefined' ? ENCHANTMENT_INVENTORY : {},
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    //console.log('Saved game data');
  } catch (e) {
    console.error('Failed to save game data', e);
  }
}

function loadGameData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (payload) {
      if (Array.isArray(payload.inventory)) {
        // Replace contents of INVENTORY in-place so references remain valid
        INVENTORY.length = 0;
        payload.inventory.forEach(it => {
          // Sync item stats with ITEM_TABLE to get updated ability values
          if (it.name && ITEM_TABLE[it.name]) {
            const template = ITEM_TABLE[it.name];
            // Update ability field if it changed in ITEM_TABLE
            if (template.ability !== undefined) {
              it.ability = template.ability;
            }
          }
          INVENTORY.push(it);
        });
      }
      if (payload.partyStats && typeof PARTY_STATS !== 'undefined') {
        // Overwrite PARTY_STATS keys but preserve object reference
        for (const k in payload.partyStats) {
          if (!PARTY_STATS[k]) PARTY_STATS[k] = payload.partyStats[k];
          else Object.assign(PARTY_STATS[k], payload.partyStats[k]);
        }
      }
      if (payload.partyAttacks && typeof PARTY_ATTACKS !== 'undefined') {
        for (const k of ['ONE','TWO','THREE','FOUR','FIVE']) {
          if (payload.partyAttacks[k]) {
            PARTY_ATTACKS[k].ATTACK_INVENTORY = payload.partyAttacks[k].ATTACK_INVENTORY || [];
            PARTY_ATTACKS[k].ATTACK_EQUIPPED = new Set(payload.partyAttacks[k].ATTACK_EQUIPPED || []);
          }
        }
      }
      if (typeof payload.attackCounter === 'number') {
        attackCounter = payload.attackCounter;
      } else {
        // Ensure attackCounter is at least max existing id + 1
        try {
          let maxId = 0;
          for (const k of ['ONE','TWO','THREE','FOUR','FIVE']) {
            const arr = PARTY_ATTACKS[k] && PARTY_ATTACKS[k].ATTACK_INVENTORY ? PARTY_ATTACKS[k].ATTACK_INVENTORY : [];
            for (const a of arr) if (a && a.id && a.id > maxId) maxId = a.id;
          }
          attackCounter = maxId + 1;
        } catch (e) { attackCounter = attackCounter || 1; }
      }
      
      // Load enchantment inventory
      if (payload.enchantmentInventory) {
        window.ENCHANTMENT_INVENTORY = payload.enchantmentInventory;
      } else {
        window.ENCHANTMENT_INVENTORY = {};
      }
    }
    //console.log('Loaded game data');
  } catch (e) {
    console.error('Failed to load game data', e);
  }
}

function resetInventory() {
  if (!confirm('Reset inventory and equipped items? This cannot be undone.')) return;
  try {
    localStorage.removeItem(SAVE_KEY);
    // Clear arrays/objects in-place
    if (Array.isArray(INVENTORY)) INVENTORY.length = 0;
    if (typeof PARTY_STATS !== 'undefined') {
      for (const k in PARTY_STATS) {
        if (!PARTY_STATS[k]) continue;
        PARTY_STATS[k].HELMET = null; PARTY_STATS[k].CHEST = null; PARTY_STATS[k].LEGS = null; PARTY_STATS[k].BOOTS = null;
        PARTY_STATS[k].MAINHAND = null; PARTY_STATS[k].OFFHAND = null;
        PARTY_STATS[k].LEVEL = 1; // Reset to level 1
        PARTY_STATS[k].HEALTH = null; // Will be recalculated by updateStats
      }
    }
    if (typeof PARTY_ATTACKS !== 'undefined') {
      for (const k in PARTY_ATTACKS) {
        if (!PARTY_ATTACKS[k]) continue;
        PARTY_ATTACKS[k].ATTACK_INVENTORY = [];
        PARTY_ATTACKS[k].ATTACK_EQUIPPED = new Set();
        
        // Give everyone the base "punch" attack
        const punchAttack = {
          id: attackCounter++,
          sourceUid: null, // No item source - it's a base attack
          name: 'punch',
          itemName: null,
          strMultiplier: 0.5,
          magicMultiplier: 0,
          status: 'none',
        };
        PARTY_ATTACKS[k].ATTACK_INVENTORY.push(punchAttack);
        PARTY_ATTACKS[k].ATTACK_EQUIPPED.add(punchAttack.id);
      }
    }
    
    // Give a level 3 stick as starter item
    const starterStick = generateRandomItem(3, 'Base'); // This will create a stick at level 3
    // Force it to be a Stick specifically
    const stickTemplate = ITEM_TABLE['Stick'];
    if (stickTemplate) {
      const level3Scale = Math.pow(3, 0.8);
      starterStick.name = 'Stick';
      starterStick.slot = stickTemplate.slot;
      starterStick.rarity = stickTemplate.rarity;
      starterStick.strength = Math.round(stickTemplate.strength * level3Scale);
      starterStick.speed = Math.round(stickTemplate.speed * level3Scale);
      starterStick.magic = Math.round(stickTemplate.magic * level3Scale);
      starterStick.defense = Math.round(stickTemplate.defense * level3Scale);
      starterStick.health = Math.round(stickTemplate.health * level3Scale);
      starterStick.attack = stickTemplate.attack; // "poke"
      starterStick.ability = stickTemplate.ability;
      starterStick.image = stickTemplate.image;
      starterStick.level = 3;
    }
    
    // Update stats for all party members
    if (typeof updateStats === 'function') updateStats();
    
    // Persist cleared state with starter stick
    saveGameData();
    // Re-render inventory if the page has it
    if (typeof renderInventory === 'function') renderInventory();
    
    alert('Inventory reset! You have been given a Level 3 Stick to start your journey.');
  } catch (e) {
    console.error('Failed to reset inventory', e);
  }
}

// NOTE: loadGameData() will be called after core structures (PARTY_STATS, PARTY_ATTACKS) are defined


const ENEMY_BASE_STATS = {
  //Unknown Type Enemy Stats
  'skull': {
    health:8,
    strength:2,
    magic:0,
    speed:2,
    defense:0,
    hBars:1,
    image:"Enemies/skull.png",
    tier:1,
  },
  'slime': {
    health:12,
    strength:2.5,
    magic:0,
    speed:1.5,
    defense:1,
    hBars:1,
    image:"Enemies/slime.png",
    tier:2,
  },
  'alien': {
    health:10,
    strength:0,
    magic:4,
    speed:2.5,
    defense:0,
    hBars:1,
    image:"Enemies/alien.png",
    tier:3,
    specialEffect: "Alien Fire: Applies burn status on attack"
  },
  'cursedKnight': {
    health:15,
    strength:4,
    magic:0,
    speed:3,
    defense:5,
    hBars:1,
    image:"Enemies/cursedKnight.png",
    tier:4,
    specialEffect: "Cursed Blade: Applies grim status on attack (2% max HP damage per turn)"
  },
  'Shadow': {
    health:18,
    strength:3,
    magic:2,
    speed:6,
    defense:0,
    hBars:1,
    image:"Enemies/shadow.png",
    tier:5,
  },
  //Zombie Type Enemy Stats
  'corspe': {
    health:9,
    strength:2.5,
    magic:0,
    speed:1.5,
    defense:0,
    hBars:1,
    image:"Enemies/corspe.png",
    tier:1,
    specialEffect: "Undead: Slow shambling corpse"
  },
  'crawler': {
    health:13,
    strength:3.5,
    magic:0,
    speed:1,
    defense:2,
    hBars:2,
    image:"Enemies/crawler.png",
    tier:2,
    specialEffect: "Venomous Bite: Applies bleed status on attack + Two Lives (slow/tanky then fast/fragile)",
    secondForm: {
      health:4,
      strength:3.5,
      magic:0,
      speed:5,
      defense:0
    }
  },
  'frozenCorspe': {
    health:11,
    strength:2,
    magic:3,
    speed:1.5,
    defense:1,
    hBars:1,
    image:"Enemies/frozenCorspe.png",
    tier:3,
    specialEffect: "Frozen Touch: Applies chill status on attack",
    attackStatus: "chill"
  },
  'necromancer': {
    health:14,
    strength:0,
    magic:5.5,
    speed:2,
    defense:3,
    hBars:1,
    image:"Enemies/necromancer.png",
    tier:4,
    specialEffect: "Resurrection: While alive, dead allies resurrect as zombies"
  },
  //Forest Type Enemy Stats
  'Sapling': {
    health:10,
    strength:0,
    magic:2.5,
    speed:1,
    defense:0,
    hBars:1,
    image:"Enemies/sapling.png",
    tier:1,
  },
  'vineLasher': {
    health:12,
    strength:3,
    magic:0,
    speed:2,
    defense:1,
    hBars:1,
    image:"Enemies/vineLasher.png",
    tier:2,
    specialEffect: "Draining Vines: Applies leech status on attack (drains HP over time)"
  },
  'Treant': {
    health:14,
    strength:3.5,
    magic:0,
    speed:1.5,
    defense:4,
    hBars:1,
    image:"Enemies/treant.png",
    tier:3,
    specialEffect: "Rooted Defender: High defense, slow but steady"
  },
  'elderEnt': {
    health:16,
    strength:0,
    magic:5,
    speed:2,
    defense:6,
    hBars:1,
    image:"Enemies/elderEnt.png",
    tier:4,
    specialEffect: "Ancient Growth: Gains 10% bonus magic each turn (compounds) + high defense"
  },
  'Worldroot': {
    health:25,
    strength:2,
    magic:6,
    speed:3,
    defense:4,
    hBars:1,
    image:"Enemies/worldroot.png",
    tier:5,
    specialEffect: "BOSS: Nature's Call - Summons Vine Lasher (15 lvls lower) every attack"
  },
  //Army Enemy Stats
  'Knight': {
    health:11,
    strength:3,
    magic:0,
    speed:1.5,
    defense:2,
    hBars:1,
    image:"Enemies/knight.png",
    tier:1,
  },
  'Archer': {
    health:9,
    strength:3,
    magic:0,
    speed:2.5,
    defense:0.5,
    hBars:1,
    image:"Enemies/archer.png",
    tier:2,
  },
  'Mage': {
    health:10,
    strength:0,
    magic:4,
    speed:2.5,
    defense:0,
    hBars:1,
    image:"Enemies/mage.png",
    tier:3,
    specialEffect: "Arcane Curse: Applies random status effect (burn/bleed/chill) on attack"
  },
  'kingsGuard': {
    health:16,
    strength:4.5,
    magic:0,
    speed:2.5,
    defense:5,
    hBars:1,
    image:"Enemies/kingsGuard.png",
    tier:4,
    specialEffect: "Royal Protector: Balanced high-tier warrior"
  },
  'King': {
    health:25,
    strength:4,
    magic:4,
    speed:2,
    defense:5.5,
    hBars:1,
    image:"Enemies/king.png",
    tier:5,
    specialEffect: "BOSS: Royal Command - Summons King's Guard (15 lvls lower) + gains 10% stats per guard alive"
  },
  //Final Boss Enemy Stats
  'divineKing': {
    health:350,
    strength:18,
    magic:18,
    speed:4,
    defense:25,
    hBars:1,
    image:"Enemies/divineKing.png",
    tier:6,
    specialEffect: "FINAL BOSS Phase 1: Divine power incarnate"
  },
  'demonKing': {
    health:600,
    strength:25,
    magic:25,
    speed:5,
    defense:30,
    hBars:1,
    image:"Enemies/demonKing.png",
    tier:6,
    specialEffect: "FINAL BOSS Phase 2: Demonic transformation - ultimate power"
  },
  'lightning_shark': {
    health:400,
    strength:20,
    magic:20,
    speed:6,
    defense:15,
    hBars:1,
    image:"Enemies/lightningShark.png",
    tier:6,
    specialEffect: "LEGENDARY BOSS: Lightning Shock - Gives player lightning status (ignores next attack, 2 turn cooldown)"
  }
};

// attack stats multipliers and status effects

const ATTACK_STATS = {
  "punch":           { strMultiplier: 0.5,  magicMultiplier: 0,    status: "none" },
  "poke":            { strMultiplier: 0.5,  magicMultiplier: 0.5,  status: "none" },
  "stap":            { strMultiplier: 1,    magicMultiplier: 0,    status: "none" },
  "slap":            { strMultiplier: 0.45, magicMultiplier: 0.45, status: "none" },
  "leaf impale":     { strMultiplier: 0,    magicMultiplier: 1,    status: "none" },
  "coral leech":     { strMultiplier: 1.1,  magicMultiplier: 0,    status: "leech" },
  "reflection":      { strMultiplier: 0,    magicMultiplier: 1.2,  status: "none" },
  "sea shield":      { strMultiplier: 0,    magicMultiplier: 1,    status: "none" },
  "Charge":          { strMultiplier: 1.4,  magicMultiplier: 0,    status: "none" },
  "Plasma Blast":    { strMultiplier: 0,    magicMultiplier: 1.4,  status: "none" },
  "Tree People":     { strMultiplier: 0.4,  magicMultiplier: 0.9,  status: "leech" },
  "plunge":          { strMultiplier: 1.5,  magicMultiplier: 0,    status: "bleed" },
  "shadow vortex":   { strMultiplier: 0,    magicMultiplier: 1.7,  status: "none" },
  "Incenerate":      { strMultiplier: 1.4,  magicMultiplier: 1,    status: "burn" },
  "skater slice":    { strMultiplier: 1.6,  magicMultiplier: 0.4,  status: "bleed" },
  "force strike":    { strMultiplier: 2.2,  magicMultiplier: 1.3,  status: "none" },
  "Grim slice":      { strMultiplier: 3,    magicMultiplier: 0,    status: "grim" },
  "Thunder":         { strMultiplier: 1.8,  magicMultiplier: 1.8,  status: "burn" },
  "Combo":           { strMultiplier: 2.3,  magicMultiplier: 0,    status: "none" },
  "Chilled Cream":   { strMultiplier: 0,    magicMultiplier: 0,    status: "chill" },
  "Arise":           { strMultiplier: 0,    magicMultiplier: 2,    status: "none" },
  "Pure skill":      { strMultiplier: 3.4,  magicMultiplier: 0,    status: "bleed" },
  "spell infused":   { strMultiplier: 2,    magicMultiplier: 2.5,  status: "random" },
  "enhance":         { strMultiplier: 0,    magicMultiplier: 0,    status: "player buff" },
  "Rulers Authority":{ strMultiplier: 0,    magicMultiplier: 4,    status: "player buff" }
};


//party member stats
const PARTY_STATS = {
  'ONE': {
    NAME: 'Kaden',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: 1,
    HEALTH: null,
  },
  'TWO': {
    NAME: 'Member 2',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: 1,
    HEALTH: null,
  },
  'THREE': {
    NAME: 'Member 3',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: 1,
    HEALTH: null,
  },
  'FOUR': {
    NAME: 'Member 4',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: 1,
    HEALTH: null,
  },
  'FIVE': {
    NAME: 'Member 5',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: 1,
    HEALTH: null
  },
};


function updateStats(){
  // Loop through each party member in the PARTY_STATS object
  for (const memberKey in PARTY_STATS) {
    const member = PARTY_STATS[memberKey];

    // Only process members who have a defined level
    if (member.LEVEL === null) {
      continue;
    }

    const level = member.LEVEL;
    // Use level^1.2 for base stat scaling
    const levelScale = Math.pow(level, 1.2);

    const baseHealth = Math.round(levelScale * 3);
    const baseStrength = Math.round(levelScale);
    const baseMagic = Math.round(levelScale);
    const baseSpeed = Math.round(levelScale * 0.5);
    
    const baseDefense = 0;

    //Initialize equipped stat bonuses to zero
    let equippedStrength = 0;
    let equippedSpeed = 0;
    let equippedMagic = 0;
    let equippedDefense = 0;
    let equippedHealth = 0;

    //Iterate through all equipment slots and add stat bonuses from equipped items
    const equipmentSlots = ['HELMET', 'CHEST', 'LEGS', 'BOOTS', 'MAINHAND', 'OFFHAND'];
    for (const slot of equipmentSlots) {
  const itemName = member[slot];
  if (itemName !== null) {
    // Find the item in the INVENTORY array by name; prefer the one marked equipped (handles duplicates)
    const item = INVENTORY.find(i => i.name === itemName && i.equipped) || INVENTORY.find(i => i.name === itemName);
    if (item) {
      equippedStrength += item.strength;
      equippedSpeed += item.speed;
      equippedMagic += item.magic;
      equippedDefense += item.defense;
      equippedHealth += item.health;
    }
  }
}

    // 4. Calculate total stats by combining base stats and equipped item bonuses
    const totalStrength = baseStrength + equippedStrength;
    const totalSpeed = baseSpeed + equippedSpeed;
    const totalMagic = baseMagic + equippedMagic;
    const totalDefense = baseDefense + equippedDefense;
    const totalMaxHealth = baseHealth + equippedHealth;

    // 5. Update the party member's stats with the new totals
    member.MAX_HEALTH = totalMaxHealth;
    member.STRENGTH = totalStrength;
    member.SPEED = totalSpeed;
    member.MAGIC = totalMagic;
    member.DEFENSE = totalDefense;
    
    // Set the current HEALTH to MAX_HEALTH if it's currently null
    if (member.HEALTH === null) {
      member.HEALTH = totalMaxHealth;
    }

  }
}

function getEnemyStats(enemyName) {
  return ENEMY_BASE_STATS[enemyName]||null;
}

function updateHealth(amount, member) {
  if (PARTY_STATS[member] && typeof PARTY_STATS[member].HEALTH === 'number'){
    PARTY_STATS[member].data.HEALTH-=amount;
  }
}

// ...existing code...

/**
 * Generates a random item scaled to the given level, applies stat scaling, and adds it to the inventory.
 * @param {number} level - The level to scale the item to.
 * @returns {object} The generated item object.
 */
function generateRandomItem(level, forceRarity = null) {
  // Determine allowed rarities and weights based on level
  const lvl = Math.max(1, Number(level) || 1);
  const R = {
    Base: 'Base',
    Common: 'Common',
    Uncommon: 'Uncommon',
    Rare: 'Rare',
    Epic: 'Epic',
    Legendary: 'Legendary',
    Mythical: 'Mythical',
    Artifact: 'Artifact', // treat as Divine-equivalent in this project
  };

  // If forceRarity is specified (e.g., 'mythic' or 'Mythical'), use it directly
  let chosenRarity = null;
  if (forceRarity) {
    // Normalize the input (handle 'mythic' -> 'Mythical')
    const normalized = forceRarity.charAt(0).toUpperCase() + forceRarity.slice(1).toLowerCase();
    if (normalized === 'Mythic') {
      chosenRarity = R.Mythical;
    } else if (R[normalized]) {
      chosenRarity = R[normalized];
    }
  }

  // If no forced rarity, use normal weighted random selection
  if (!chosenRarity) {
    // Build a weight map per bucket; gradually shift from common to legendary as level increases
    // Legendaries are possible from level 1 but rare, becoming common by level 90
    let weights = {};
    
    // Calculate progression factor (0 at level 1, 1 at level 90)
    const progressionFactor = Math.min(1, Math.max(0, (lvl - 1) / 89));
    
    // Dynamic weights that shift based on level
    // At level 1: Common 50%, Uncommon 25%, Rare 15%, Epic 7%, Legendary 3%
    // At level 90: Common 5%, Uncommon 10%, Rare 15%, Epic 30%, Legendary 40%
    
    const commonWeight = Math.max(5, 50 - (45 * progressionFactor));
    const uncommonWeight = Math.max(10, 25 - (15 * progressionFactor));
    const rareWeight = 15; // Stays constant
    const epicWeight = 7 + (23 * progressionFactor);
    const legendaryWeight = 3 + (37 * progressionFactor);
    
    weights = {
      [R.Common]: commonWeight,
      [R.Uncommon]: uncommonWeight,
      [R.Rare]: rareWeight,
      [R.Epic]: epicWeight,
      [R.Legendary]: legendaryWeight
    };
    
    // Exclude Base items to improve early game gear quality
    // Exclude Mythical and Artifact from random drops at all levels
    delete weights[R.Base];
    delete weights[R.Mythical];
    delete weights[R.Artifact];

    // Pick a rarity by weighted random among available items
    function pickWeighted(weightsMap) {
      // Filter out rarities that have zero available items
      const entries = Object.entries(weightsMap).filter(([rar, w]) => {
        if (!w) return false;
        // Confirm at least one item of this rarity exists
        for (const name in ITEM_TABLE) if (ITEM_TABLE[name] && ITEM_TABLE[name].rarity === rar) return true;
        return false;
      });
      if (entries.length === 0) return null;
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * total;
      for (const [rar, w] of entries) { r -= w; if (r <= 0) return rar; }
      return entries[entries.length - 1][0];
    }

    chosenRarity = pickWeighted(weights);
    if (!chosenRarity) {
      // Fallback: allow any rarity up to Legendary
      chosenRarity = R.Common;
    }
  }

  // Collect items of chosen rarity (fallback to lower rarities if none)
  function itemsOfRarity(rar) {
    return Object.keys(ITEM_TABLE).filter(n => ITEM_TABLE[n] && ITEM_TABLE[n].rarity === rar);
  }

  let candidates = itemsOfRarity(chosenRarity);
  if (candidates.length === 0) {
    // Fallback ladder from higher to lower within cap
    const ladder = [R.Legendary, R.Epic, R.Rare, R.Uncommon, R.Common, R.Base];
    for (const rar of ladder) {
      if (rar === R.Mythical || rar === R.Artifact) continue;
      const arr = itemsOfRarity(rar);
      if (arr.length) { candidates = arr; chosenRarity = rar; break; }
    }
  }

  // If still empty, pick any item as absolute fallback
  if (candidates.length === 0) candidates = Object.keys(ITEM_TABLE);

  const randomName = candidates[Math.floor(Math.random() * candidates.length)];
  const baseItem = ITEM_TABLE[randomName];
  const item = JSON.parse(JSON.stringify(baseItem));
  item.name = randomName;

  // Scale stats based on level (keep negative as percent flags)
  // Using level^0.8 for stronger scaling than sqrt (level^0.5)
  const scale = Math.pow(lvl, 0.8);
  function scaleStat(stat, baseValue) {
    if (!baseValue) return 0;
    if (baseValue > 0) return Math.round(baseValue * scale);
    return Math.round(baseValue);
  }
  item.strength = scaleStat('strength', item.strength);
  item.speed = scaleStat('speed', item.speed);
  item.magic = scaleStat('magic', item.magic);
  item.defense = scaleStat('defense', item.defense);
  item.health = scaleStat('health', item.health);
  item.level = lvl;

  INVENTORY.push(item);
  
  // Register item in collection index
  if (typeof registerItemCollected === 'function') {
    registerItemCollected(randomName);
  }
  
  return item;
}


// Example usage: generateRandomItem(5);
// The item will be added to INVENTORY

/**
 * Adds an attack from a newly equipped item to the ATTACK_INVENTORY for the selected member.
 * @param {object} item - The equipped item object.
 * @param {string} memberKey - The party member key (e.g., 'ONE').
 */
function addAttackFromItem(item, memberKey = SELECTED_MEMBER) {
  if (!item.attack || item.attack === 'none') return;
  if (!item._uid) item._uid = Date.now() + Math.floor(Math.random() * 1000000);
  const attackStats = ATTACK_STATS[item.attack];
  if (!attackStats) return;
  const newAttack = {
    id: attackCounter++,
    sourceUid: item._uid,
    name: item.attack,
    itemName: item.name,
    strMultiplier: attackStats.strMultiplier,
    magicMultiplier: attackStats.magicMultiplier,
    status: attackStats.status,
  };
  const attacks = PARTY_ATTACKS[memberKey].ATTACK_INVENTORY;
  const equipped = PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED;
  attacks.push(newAttack);
  if (equipped.size < 5) {
    equipped.add(newAttack.id);
  }
  if (typeof saveGameData === 'function') saveGameData();
}

/**
 * Removes all attacks associated with a specific item (by its unique ID) for the selected member.
 * @param {number} uid - The unique ID of the item that granted the attack.
 * @param {string} memberKey - The party member key (e.g., 'ONE').
 */
function removeAttackBySourceUid(uid, memberKey = SELECTED_MEMBER) {
  const attacks = PARTY_ATTACKS[memberKey].ATTACK_INVENTORY;
  const equipped = PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED;
  const attacksToRemove = attacks.filter(a => a.sourceUid === uid);
  attacksToRemove.forEach(a => equipped.delete(a.id));
  const remaining = attacks.filter(a => a.sourceUid !== uid);
  attacks.length = 0;
  attacks.push(...remaining);
  if (typeof saveGameData === 'function') saveGameData();
}

/**
 * Removes all attacks associated with a specific item name for the selected member.
 * @param {string} itemName - The name of the item that granted the attack.
 * @param {string} memberKey - The party member key (e.g., 'ONE').
 */
function removeAttackByItemName(itemName, memberKey = SELECTED_MEMBER) {
  const attacks = PARTY_ATTACKS[memberKey].ATTACK_INVENTORY;
  const equipped = PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED;
  const attacksToRemove = attacks.filter(a => a.itemName === itemName);
  attacksToRemove.forEach(a => equipped.delete(a.id));
  const remaining = attacks.filter(a => a.itemName !== itemName);
  attacks.length = 0;
  attacks.push(...remaining);
  if (typeof saveGameData === 'function') saveGameData();
}
window.removeAttackByItemName = removeAttackByItemName;

// --- Functions for managing equipped attacks (called from renderAttacks in inventory.js) ---

/**
 * Equips an attack by adding its ID to the ATTACK_EQUIPPED set for the selected member.
 * @param {number} id - The unique ID of the attack to equip.
 * @param {string} memberKey - The party member key (e.g., 'ONE').
 */
function equipAttackById(id, memberKey = SELECTED_MEMBER) {
  const equipped = PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED;
  if (equipped.size < 5) {
    equipped.add(parseInt(id, 10));
    if (typeof saveGameData === 'function') saveGameData();
  } else {
    console.warn("Cannot equip attack: Maximum of 5 attacks already equipped.");
  }
}

/**
 * Unequips an attack by removing its ID from the ATTACK_EQUIPPED set for the selected member.
 * @param {number} id - The unique ID of the attack to unequip.
 * @param {string} memberKey - The party member key (e.g., 'ONE').
 */
function unequipAttackById(id, memberKey = SELECTED_MEMBER) {
  PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED.delete(parseInt(id, 10));
  if (typeof saveGameData === 'function') saveGameData();
}

// Now that core structures (PARTY_STATS, PARTY_ATTACKS, INVENTORY) are defined, load persisted data
if (typeof loadGameData === 'function') loadGameData();

// Ensure all party members have the base "punch" attack
function ensureBaseAttacks() {
  if (typeof PARTY_ATTACKS === 'undefined') return;
  
  for (const k of ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']) {
    if (!PARTY_ATTACKS[k]) continue;
    
    // Check if this member already has punch
    const hasPunch = PARTY_ATTACKS[k].ATTACK_INVENTORY.some(a => a && a.name === 'punch');
    
    if (!hasPunch) {
      const punchAttack = {
        id: attackCounter++,
        sourceUid: null, // No item source - it's a base attack
        name: 'punch',
        itemName: null,
        strMultiplier: 0.5,
        magicMultiplier: 0,
        status: 'none',
      };
      PARTY_ATTACKS[k].ATTACK_INVENTORY.push(punchAttack);
      PARTY_ATTACKS[k].ATTACK_EQUIPPED.add(punchAttack.id);
    }
  }
  
  // Save the updated data
  if (typeof saveGameData === 'function') saveGameData();
}

// Call this after loading to ensure everyone has punch
ensureBaseAttacks();