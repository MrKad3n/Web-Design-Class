
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
let GEMS = 0; // Currency for purchasing special attacks

// Special Purchasable Attacks
const SPECIAL_ATTACKS = {
  "Flame Burst": {
    name: "Flame Burst",
    description: "Blast all enemies with fire, applying burn status",
    cost: 50,
    strMultiplier: 0.4,
    magicMultiplier: 0.65,
    aoe: true,
    statusEffect: "burn",
    icon: "🔥"
  },
  "Frost Nova": {
    name: "Frost Nova",
    description: "Freeze all enemies, reducing their damage by 25%",
    cost: 75,
    strMultiplier: 0.3,
    magicMultiplier: 0.55,
    aoe: true,
    statusEffect: "chill",
    icon: "❄️"
  },
  "Shadow Strike": {
    name: "Shadow Strike",
    description: "Deal massive damage and apply bleed to target",
    cost: 60,
    strMultiplier: 2.0,
    magicMultiplier: 0.5,
    aoe: false,
    statusEffect: "bleed",
    icon: "🗡️"
  },
  "Thunder Clap": {
    name: "Thunder Clap",
    description: "AOE lightning damage with high magic scaling",
    cost: 100,
    strMultiplier: 0.15,
    magicMultiplier: 0.9,
    aoe: true,
    statusEffect: null,
    icon: "⚡"
  },
  "Life Drain": {
    name: "Life Drain",
    description: "Drain life from target, applying leech",
    cost: 80,
    strMultiplier: 0.5,
    magicMultiplier: 1.5,
    aoe: false,
    statusEffect: "leech",
    icon: "🩸"
  },
  "Plague Strike": {
    name: "Plague Strike",
    description: "Deals bonus damage based on active status effects on target",
    cost: 90,
    strMultiplier: 1.0,
    magicMultiplier: 1.0,
    aoe: false,
    statusEffect: null,
    statusBonus: true, // Special flag for status effect bonus damage
    icon: "☠️"
  },
  "Chaos Burst": {
    name: "Chaos Burst",
    description: "Randomly applies 2-4 different status effects to all enemies",
    cost: 120,
    strMultiplier: 0.35,
    magicMultiplier: 0.4,
    aoe: true,
    statusEffect: "chaos", // Special chaos effect
    icon: "🌀"
  },
  "Soul Reaper": {
    name: "Soul Reaper",
    description: "Massive damage that increases for each dead party member",
    cost: 100,
    strMultiplier: 1.5,
    magicMultiplier: 1.5,
    aoe: false,
    statusEffect: "grim",
    deadAllyBonus: true, // Special flag for dead ally scaling
    icon: "💀"
  },
  "Venomous Barrage": {
    name: "Venomous Barrage",
    description: "Multi-hit attack that stacks bleed with each hit",
    cost: 85,
    strMultiplier: 0.6,
    magicMultiplier: 0.4,
    aoe: false,
    statusEffect: "bleed",
    multiHit: 3, // Hits 3 times
    icon: "🐍"
  },
  "Prismatic Shield": {
    name: "Prismatic Shield",
    description: "Low damage but grants random buff based on damage type",
    cost: 70,
    strMultiplier: 0.4,
    magicMultiplier: 0.6,
    aoe: false,
    statusEffect: null,
    selfBuff: true, // Applies buff to caster
    icon: "🛡️"
  }
};

const map = document.getElementById("map");
const mapContainer = document.getElementById("map-container");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");

const rows = 20;
const cols = 20;
let pathLength = 100; // Default path length
let currentGameMode = 'main'; // Track current game mode
let tileData = {};

// Initialize game mode from URL or localStorage
function initializeGameMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    if (modeParam) {
        // Map 'normal' to 'main' for internal consistency
        currentGameMode = (modeParam === 'normal') ? 'main' : modeParam;
        localStorage.setItem('selectedGameMode', currentGameMode);
    } else {
        const savedMode = localStorage.getItem('selectedGameMode');
        currentGameMode = (savedMode === 'normal') ? 'main' : (savedMode || 'main');
    }
    
    // Set pathLength and add portal tiles based on mode
    if (currentGameMode === 'main') {
        pathLength = 100; // Main path: levels 1-100
    } else if (currentGameMode === 'undead') {
        pathLength = 11; // Dimension has 11 levels (10-20)
    } else if (currentGameMode === 'nature') {
        pathLength = 11; // 25-35
    } else if (currentGameMode === 'elemental') {
        pathLength = 11; // 40-50
    } else if (currentGameMode === 'beast') {
        pathLength = 11; // 55-65
    } else if (currentGameMode === 'aquatic') {
        pathLength = 11; // 70-80
    } else if (currentGameMode === 'construct') {
        pathLength = 11; // 85-95
    } else if (currentGameMode === 'aberration') {
        pathLength = 11; // 90-100
    } else if (currentGameMode === 'chaos') {
        pathLength = 50; // Chaos Realm: levels 101-150
    }
    
    return currentGameMode;
}

// Make it globally accessible
window.initializeGameMode = initializeGameMode;
window.getCurrentGameMode = function() { return currentGameMode; };

// Initialize game mode immediately when script loads (for all pages)
initializeGameMode();

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
  
  // Special: If level 100 (Divine King) is defeated, mark chaos portal as unlocked and set it as level 101
  if (level === 100 && currentGameMode === 'main') {
    progression.chaosPortalUnlocked = true;
    progression.unlockedUpToLevel = 101; // Unlock level 101 (chaos portal)
    console.log('Chaos portal unlocked as level 101! Map will create it on next load.');
  }
  // Unlock the next level if this is a new highest cleared
  else if (level >= progression.unlockedUpToLevel) {
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
    
    // Create chaos portal if unlocked and not already present
    if (progression.chaosPortalUnlocked && currentGameMode === 'main') {
      let chaosPortalExists = false;
      for (const key in tileData) {
        if (tileData[key].level === 101 && tileData[key].isPortal) {
          chaosPortalExists = true;
          break;
        }
      }
      
      if (!chaosPortalExists) {
        // Find level 100 position
        let level100Key = null;
        for (const key in tileData) {
          if (tileData[key].level === 100) {
            level100Key = key;
            break;
          }
        }
        
        if (level100Key) {
          const [row100, col100] = level100Key.split(',').map(Number);
          
          // Try to find an adjacent empty cell
          const adjacentCells = [
            [row100 - 1, col100], [row100 + 1, col100],
            [row100, col100 - 1], [row100, col100 + 1]
          ];
          
          let portalPlaced = false;
          for (const [r, c] of adjacentCells) {
            const adjacentKey = `${r},${c}`;
            if (r >= 0 && r < 20 && c >= 0 && c < 20 && !tileData[adjacentKey]) {
              // Create the chaos portal here
              tileData[adjacentKey] = {
                level: 101,
                title: "🌀 Chaos Realm Portal",
                description: "Enter the Chaos Realm - Reality itself bends here.",
                cleared: false,
                status: true, // Unlocked immediately
                isPortal: true,
                portalMode: 'chaos',
                portalName: 'Chaos Realm',
                portalIcon: '🌀',
                enemyOne: null,
                enemyTwo: null,
                enemyThree: null
              };
              portalPlaced = true;
              console.log('Chaos portal created at level 101, position:', adjacentKey);
              break;
            }
          }
          
          // If no adjacent cells available, try to find any empty cell
          if (!portalPlaced) {
            for (let r = 0; r < 20; r++) {
              for (let c = 0; c < 20; c++) {
                const key = `${r},${c}`;
                if (!tileData[key]) {
                  tileData[key] = {
                    level: 101,
                    title: "🌀 Chaos Realm Portal",
                    description: "Enter the Chaos Realm - Reality itself bends here.",
                    cleared: false,
                    status: true,
                    isPortal: true,
                    portalMode: 'chaos',
                    portalName: 'Chaos Realm',
                    portalIcon: '🌀',
                    enemyOne: null,
                    enemyTwo: null,
                    enemyThree: null
                  };
                  portalPlaced = true;
                  console.log('Chaos portal created at level 101, position:', key);
                  break;
                }
              }
              if (portalPlaced) break;
            }
          }
        }
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
  
  // Initialize dungeon progression if it doesn't exist, otherwise keep existing
  const mode = currentGameMode || 'main';
  let progression = loadDungeonProgression();
  if (!progression || !progression.hasOwnProperty('unlockedUpToLevel')) {
    progression = { clearedLevels: [], unlockedUpToLevel: 1 };
    saveDungeonProgression(progression);
  }
  
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
    // Ensure level 1 starts within the initial visible area
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
      if (!e || !e.image) continue;
      
      // Handle both numeric tiers and string tiers (like 'Chaos')
      const tierMatch = (typeof tier === 'string' && tier === 'Chaos') 
        ? e.tier === 'Chaos'
        : Number(e.tier) === Number(tier);
      
      if (tierMatch) {
        list.push(e.image);
      }
    }
    return list;
  }

  // Helper: collect enemies by type
  function getEnemiesByType(type){
    const list = [];
    for (const key in ENEMY_BASE_STATS) {
      const e = ENEMY_BASE_STATS[key];
      if (!e || !e.image || !e.type) continue;
      if (e.type === type) {
        list.push(e.image);
      }
    }
    return list;
  }

  // Helper: get tier based on level
  function levelToTier(level){
    const lvl = Number(level)||1;
    if (lvl <= 10) return 1;
    if (lvl <= 25) return 2;
    if (lvl <= 50) return 3;
    if (lvl <= 75) return 4;
    return 5;
  }

  // Helper: get mini-boss for a specific type
  function getBossForType(type){
    // Map types to their tier 5 boss enemies
    const typeBosses = {
      'Undead': ['Enemies/mutant.png', 'Enemies/ancientLich.png'],
      'Nature': ['Enemies/worldroot.png'],
      'Army': ['Enemies/king.png'],
      'Rogue': ['Enemies/king.png'],
      'Mage Guild': ['Enemies/king.png'],
      'Mercenary': ['Enemies/king.png'],
      'Cultist': ['Enemies/king.png'],
      'Paladin': ['Enemies/king.png'],
      'Assassin': ['Enemies/king.png'],
      'Royal Guard': ['Enemies/king.png'],
      'Elemental': ['Enemies/stormElemental.png'],
      'Beast': ['Enemies/dragon.png', 'Enemies/frostWyrm.png'],
      'Aquatic': ['Enemies/lightningShark.png'],
      'Construct': ['Enemies/crystalBehemoth.png'],
      'Aberration': ['Enemies/Shadow.png']
    };
    const bossList = typeBosses[type] || [];
    return bossList.length ? bossList[Math.floor(Math.random() * bossList.length)] : null;
  }

  // Populate tileData from the generated path
  dungeonPath.forEach((coords, index) => {
    const key = `${coords.row},${coords.col}`;
    let level = index + 1;
    
    // Adjust level based on game mode
    if (currentGameMode === 'chaos') {
      level = 100 + level; // Chaos realm is levels 101-150
    } else if (currentGameMode === 'undead') {
      level = 9 + level; // Levels 10-20
    } else if (currentGameMode === 'nature') {
      level = 24 + level; // Levels 25-35
    } else if (currentGameMode === 'elemental') {
      level = 39 + level; // Levels 40-50
    } else if (currentGameMode === 'beast') {
      level = 54 + level; // Levels 55-65
    } else if (currentGameMode === 'aberration') {
      level = 69 + level; // Levels 70-80
    } else if (currentGameMode === 'construct') {
      level = 84 + level; // Levels 85-95
    } else if (currentGameMode === 'aquatic') {
      level = 89 + level; // Levels 90-100
    }
    
    const tile = { level };

    // Mode-based tile generation
    if (currentGameMode === 'main') {
      // MAIN PATH (Levels 1-100)
      if (level === 1) {
        tile.title = "Journey Begins";
        tile.description = "The first step of your adventure.";
        tile.cleared = false;
        tile.status = true;
        const pool = getEnemiesByTier(1);
        tile.enemyOne = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else if (level === 10 || level === 25 || level === 40 || level === 55 || level === 70 || level === 85 || level === 90) {
        // Portal tiles - separate from regular levels, transition to dimension
        const portalMap = {
          10: { mode: 'undead', name: 'Graveyard Dimension', icon: '💀' },
          25: { mode: 'nature', name: 'Verdant Dimension', icon: '🌿' },
          40: { mode: 'elemental', name: 'Elemental Plane', icon: '🔥' },
          55: { mode: 'beast', name: 'Primal Wilds', icon: '🦁' },
          70: { mode: 'aberration', name: 'Void Realm', icon: '👁️' },
          85: { mode: 'construct', name: 'Forge of Titans', icon: '🗿' },
          90: { mode: 'aquatic', name: 'Abyssal Depths', icon: '🌊' }
        };
        const portal = portalMap[level];
        tile.title = `🌀 ${portal.name}`;
        tile.description = `Enter the ${portal.name}`;
        tile.cleared = false;
        tile.status = false;
        tile.isPortal = true;
        tile.portalMode = portal.mode;
        tile.portalName = portal.name;
        tile.portalIcon = portal.icon;
        // No enemies on portal tile itself
        tile.enemyOne = null;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else if (level === 9 || level === 24 || level === 39 || level === 54 || level === 69 || level === 84 || level === 89) {
        // Mini-boss tiles right before portals - Use tier 4 for early, tier 5 for later
        let humanoidType = 'Army';
        let branchName = 'Army';
        let specificEnemy = null;
        
        if (level === 9) {
          humanoidType = 'Army';
          branchName = 'Army';
          specificEnemy = 'Enemies/royalKnight.png'; // Tier 4
        } else if (level === 24) {
          humanoidType = 'Rogue';
          branchName = 'Rogue';
          specificEnemy = 'Enemies/masterThief.png'; // Tier 4
        } else if (level === 39) {
          humanoidType = 'Mage Guild';
          branchName = 'Mage Guild';
          specificEnemy = 'Enemies/archMage.png'; // Tier 5
        } else if (level === 54) {
          humanoidType = 'Mercenary';
          branchName = 'Mercenary';
          specificEnemy = 'Enemies/warlord.png'; // Tier 5
        } else if (level === 69) {
          humanoidType = 'Cultist';
          branchName = 'Cultist';
          specificEnemy = 'Enemies/voidCaller.png'; // Tier 5
        } else if (level === 84) {
          humanoidType = 'Paladin';
          branchName = 'Paladin';
          specificEnemy = 'Enemies/grandTemplar.png'; // Tier 5
        } else if (level === 89) {
          humanoidType = 'Assassin';
          branchName = 'Assassin';
          specificEnemy = 'Enemies/shadowMaster.png'; // Tier 5
        }
        
        tile.title = `⚔️ ${branchName} Elite`;
        tile.description = `A powerful ${branchName.toLowerCase()} elite blocks your path. Beyond lies a portal.`;
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        // Only levels 9 and 24 are elite tiles; 39,54,69,84,89 are mini-boss tiles only
        tile.isEliteTile = (level === 9 || level === 24);
        
        // Use specific tier 4 or tier 5 enemy for each branch
        tile.enemyOne = specificEnemy;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else if (level === 100) {
        // Divine King - Final boss of main path
        tile.title = "⚔️ Divine King";
        tile.description = "Defeat the Divine King to unlock the Chaos Realm.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        tile.enemyOne = "Enemies/divineKing.png";
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else {
        // Regular humanoid levels - tier-based spawning with branch types by level range
        // Determine humanoid branch type based on level
        let humanoidType = 'Army';
        let branchName = 'Army';
        let allowedTypes = []; // Types that can spawn on this level
        
        if (level >= 1 && level <= 9) {
          humanoidType = 'Army';
          branchName = 'Army';
          allowedTypes = ['Army'];
        } else if (level >= 11 && level <= 24) {
          humanoidType = 'Rogue';
          branchName = 'Rogue';
          allowedTypes = ['Rogue'];
        } else if (level >= 26 && level <= 39) {
          humanoidType = 'Mage Guild';
          branchName = 'Mage Guild';
          allowedTypes = ['Mage Guild'];
        } else if (level >= 41 && level <= 54) {
          humanoidType = 'Mercenary';
          branchName = 'Mercenary';
          allowedTypes = ['Mercenary'];
        } else if (level >= 56 && level <= 69) {
          humanoidType = 'Cultist';
          branchName = 'Cultist';
          // Mage Guild can spawn on Cultist levels (lower tier on higher)
          allowedTypes = ['Cultist', 'Mage Guild'];
        } else if (level >= 71 && level <= 84) {
          humanoidType = 'Paladin';
          branchName = 'Paladin';
          // Army can spawn on Paladin levels (lower tier on higher)
          allowedTypes = ['Paladin', 'Army'];
        } else if (level >= 86 && level <= 100) {
          humanoidType = 'Assassin';
          branchName = 'Assassin';
          // Rogue can spawn on Assassin levels (lower tier on higher)
          allowedTypes = ['Assassin', 'Rogue'];
        }
        
        // Special handling for final gauntlet (levels 95-99): mixed types, 3 tier 4 + 1 tier 5 boss
        if (level >= 95 && level <= 99) {
          tile.title = `⚔️ Final Gauntlet`;
          tile.description = `Elite warriors from all factions converge. Victory is near.`;
          tile.cleared = false;
          tile.status = false;
          tile.isEliteTile = true;
          
          // All humanoid types can spawn here
          allowedTypes = ['Army', 'Rogue', 'Mage Guild', 'Mercenary', 'Cultist', 'Paladin', 'Assassin'];
          
          // Get tier 4 enemies
          const tier4Pool = getEnemiesByTier(4).filter(img => {
            for (const key in ENEMY_BASE_STATS) {
              if (ENEMY_BASE_STATS[key].image === img) {
                const enemyType = ENEMY_BASE_STATS[key].type;
                return allowedTypes.includes(enemyType);
              }
            }
            return false;
          });
          
          // Get tier 5 enemies (bosses)
          const tier5Pool = getEnemiesByTier(5).filter(img => {
            for (const key in ENEMY_BASE_STATS) {
              if (ENEMY_BASE_STATS[key].image === img) {
                const enemyType = ENEMY_BASE_STATS[key].type;
                return allowedTypes.includes(enemyType);
              }
            }
            return false;
          });
          
          // Pick 3 tier 4 enemies
          const picks = [];
          for (let i = 0; i < 3; i++) {
            if (!tier4Pool.length) break;
            picks.push(tier4Pool[Math.floor(Math.random() * tier4Pool.length)]);
          }
          
          // Add 1 tier 5 boss
          if (tier5Pool.length) {
            picks.push(tier5Pool[Math.floor(Math.random() * tier5Pool.length)]);
          }
          
          tile.enemyOne = picks[0] || null;
          tile.enemyTwo = picks[1] || null;
          tile.enemyThree = picks[2] || null;
          tile.enemyFour = picks[3] || null;
        } else {
          tile.title = `${branchName} Territory`;
          tile.description = `${branchName} warriors defend their realm.`;
          tile.cleared = false;
          tile.status = false;
          // Regular territory tiles don't have elite markers
          
          const tier = levelToTier(level);
          // Expand tier variety: include current tier, tier-1, and tier+1 (when available)
          let tierPool = getEnemiesByTier(tier);
          if (tier > 1) {
            tierPool = tierPool.concat(getEnemiesByTier(tier - 1));
          }
          // Add higher tier for variety (including tier 5 when appropriate)
          if (tier < 5) {
            tierPool = tierPool.concat(getEnemiesByTier(tier + 1));
          }
          // For level 91-99, cap at tier 4
          if (level >= 91 && level <= 99) {
            tierPool = tierPool.filter(img => {
              for (const key in ENEMY_BASE_STATS) {
                if (ENEMY_BASE_STATS[key].image === img) {
                  return ENEMY_BASE_STATS[key].tier <= 4;
                }
              }
              return false;
            });
          }
          
          // Build humanoid pool from all allowed types
          const humanoidPool = tierPool.filter(img => {
            for (const key in ENEMY_BASE_STATS) {
              if (ENEMY_BASE_STATS[key].image === img) {
                // Check if this enemy's type is in the allowed types for this level
                const enemyType = ENEMY_BASE_STATS[key].type;
                return allowedTypes.includes(enemyType);
              }
            }
            return false;
          });
          
          // Determine enemy count: early game 1-2, later 2-3
          const count = level <= 10 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
          const picks = [];
          for (let i = 0; i < count; i++) {
            if (!humanoidPool.length) break;
            picks.push(humanoidPool[Math.floor(Math.random() * humanoidPool.length)]);
          }
          tile.enemyOne = picks[0] || null;
          tile.enemyTwo = picks[1] || null;
          tile.enemyThree = picks[2] || null;
        }
      }
    } else if (currentGameMode === 'chaos') {
      // CHAOS REALM (Levels 101-150)
      if (level === 150) {
        // The Overseer - Final Boss
        tile.title = "👁️‍🗨️ The Overseer";
        tile.description = "The Ancient One awaits.";
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        tile.enemyOne = "Enemies/overseer.png";
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else {
        // Regular chaos levels
        tile.title = `🌀 Chaos Realm`;
        tile.description = "Reality bends around chaotic entities.";
        tile.cleared = false;
        tile.status = (level === 101); // Only first level accessible initially
        
        const chaosPool = getEnemiesByTier('Chaos');
        const count = 2 + Math.floor(Math.random() * 3);
        const picks = [];
        for (let i = 0; i < count; i++) {
          if (!chaosPool.length) break;
          picks.push(chaosPool[Math.floor(Math.random() * chaosPool.length)]);
        }
        tile.enemyOne = picks[0] || null;
        tile.enemyTwo = picks[1] || null;
        tile.enemyThree = picks[2] || null;
        tile.enemyFour = picks[3] || null;
      }
    } else {
      // DIMENSIONAL PORTALS (10 levels each)
      const dimensionTypes = {
        'undead': { type: 'Undead', name: 'Graveyard', icon: '💀' },
        'nature': { type: 'Nature', name: 'Verdant', icon: '🌿' },
        'elemental': { type: 'Elemental', name: 'Elemental', icon: '🔥' },
        'beast': { type: 'Beast', name: 'Primal', icon: '🦁' },
        'aquatic': { type: 'Aquatic', name: 'Abyssal', icon: '🌊' },
        'construct': { type: 'Construct', name: 'Forge', icon: '🗿' },
        'aberration': { type: 'Aberration', name: 'Void', icon: '👁️' }
      };
      
      const dimInfo = dimensionTypes[currentGameMode];
      
      // Determine if this is the boss level (last level of dimension)
      const dimensionStartLevels = {
        'undead': 10,
        'nature': 25,
        'elemental': 40,
        'beast': 55,
        'aberration': 70,
        'construct': 85,
        'aquatic': 90
      };
      const startLevel = dimensionStartLevels[currentGameMode] || 1;
      const isBossLevel = (level === startLevel + 10); // Boss at +10 from start
      
      if (isBossLevel) {
        // Dimensional boss
        tile.title = `${dimInfo.icon} ${dimInfo.type} Overlord`;
        tile.description = `The ruler of this dimension awaits.`;
        tile.cleared = false;
        tile.status = false;
        tile.isBossTile = true;
        tile.isDimensionalBoss = true;
        const bossImage = getBossForType(dimInfo.type);
        tile.enemyOne = bossImage || null;
        tile.enemyTwo = null;
        tile.enemyThree = null;
      } else {
        // Regular dimension level
        tile.title = `${dimInfo.icon} ${dimInfo.name} Dimension`;
        tile.description = `Face ${dimInfo.type} enemies.`;
        tile.cleared = false;
        tile.status = false; // Status will be updated based on saved progression
        
        // Get enemies of this type, but exclude tier 5, 6, and chaos enemies
        const typePool = getEnemiesByType(dimInfo.type).filter(img => {
          for (const key in ENEMY_BASE_STATS) {
            if (ENEMY_BASE_STATS[key].image === img) {
              const tier = ENEMY_BASE_STATS[key].tier;
              // Only include tiers 1-4
              return tier >= 1 && tier <= 4;
            }
          }
          return false;
        });
        
        const count = 2 + Math.floor(Math.random() * 2);
        const picks = [];
        for (let i = 0; i < count; i++) {
          if (!typePool.length) break;
          picks.push(typePool[Math.floor(Math.random() * typePool.length)]);
        }
        tile.enemyOne = picks[0] || null;
        tile.enemyTwo = picks[1] || null;
        tile.enemyThree = picks[2] || null;
      }
    }

    tileData[key] = tile;
  });

  localStorage.setItem(`dungeonTileData_${currentGameMode}`, JSON.stringify(tileData));
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
        
        if (data.level === 10) {
          console.log(`[RENDER] Level 10 tile - status: ${data.status}, opacity: ${data.status ? 1 : 0.5}, cleared: ${data.cleared}`);
        }
        
        // Get current unlocked level for highlighting
        const progression = loadDungeonProgression();
        const currentUnlockedLevel = progression.unlockedUpToLevel;
        
        // Highlight the current unlocked level with green glow
        if (data.level === currentUnlockedLevel && !data.cleared) {
          cell.classList.add('current-level');
          cell.style.boxShadow = '0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00';
          cell.style.borderColor = '#00ff00';
          cell.style.animation = 'pulse-glow 2s ease-in-out infinite';
          // Store reference for scrolling
          cell.dataset.currentLevel = 'true';
        } else {
          cell.classList.remove('current-level');
          cell.style.animation = '';
          delete cell.dataset.currentLevel;
        }
        
        // Display level number or special icon
        if (data.isPortal) {
          cell.textContent = `🌀 ${data.level}`;
        } else if (data.isDimensionalBoss) {
          cell.textContent = `${data.dimensionType === 'Undead' ? '💀' : data.dimensionType === 'Nature' ? '🌿' : data.dimensionType === 'Elemental' ? '🔥' : data.dimensionType === 'Beast' ? '🦁' : data.dimensionType === 'Aquatic' ? '🌊' : data.dimensionType === 'Construct' ? '🗿' : '👁️'} ${data.level}`;
        } else {
          cell.textContent = `Lvl ${data.level}`;
        }
        
        // Define boss and elite levels in new system
        const dimensionalBossLevels = [20, 35, 50, 65, 80, 95, 100]; // 10 levels after each portal opens
        const isFinalBoss = data.level === 100 || data.level === 150;
        const isHumanoidBoss = data.isBossTile || false; // Use isBossTile property for mini-boss tiles
        const isDimensionalBoss = data.isDimensionalBoss || false;
        const isPortal = data.isPortal || false;
        const isElite = data.isEliteTile || false;
        
        // Apply appropriate class
        if (isFinalBoss) {
          cell.classList.add('final-boss-cell');
          cell.classList.remove('mini-boss-cell', 'mid-boss-cell', 'portal-cell', 'elite-cell');
        } else if (isPortal) {
          cell.classList.add('portal-cell');
          cell.classList.remove('final-boss-cell', 'mini-boss-cell', 'mid-boss-cell', 'elite-cell');
        } else if (isDimensionalBoss || isHumanoidBoss) {
          cell.classList.add('mini-boss-cell');
          cell.classList.remove('final-boss-cell', 'mid-boss-cell', 'portal-cell', 'elite-cell');
        } else if (isElite) {
          cell.classList.add('elite-cell');
          cell.classList.remove('mini-boss-cell', 'final-boss-cell', 'mid-boss-cell', 'portal-cell');
        } else {
          cell.classList.remove('mini-boss-cell', 'final-boss-cell', 'mid-boss-cell', 'portal-cell', 'elite-cell');
        }
      } else {
        cell.style.visibility = "hidden";
      }
      map.appendChild(cell);
    }
  }
}

// Helper function to check if a tile has tier 5 enemies
function checkForTier5Enemies(tileData) {
  if (!tileData) return false;
  
  const enemyImages = [
    tileData.enemyOne,
    tileData.enemyTwo,
    tileData.enemyThree,
    tileData.enemyFour,
    tileData.enemyFive
  ].filter(e => e);
  
  // Check each enemy image against ENEMY_BASE_STATS
  for (const enemyImg of enemyImages) {
    for (const key in ENEMY_BASE_STATS) {
      const enemy = ENEMY_BASE_STATS[key];
      if (enemy && enemy.image === enemyImg && enemy.tier === 5) {
        return true;
      }
    }
  }
  return false;
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
      // Determine if this level is accessible based on status
      const isAccessible = data.status;
      
      // Handle portal tiles differently
      if (data.isPortal) {
        let portalButtonHTML = '';
        if (isAccessible) {
          portalButtonHTML = `<button onclick="enterPortal('${data.portalMode}')" class="battle-btn">Enter Portal</button>`;
        }
        
        const html = `
          <h3>${data.title}</h3>
          <p>${data.description}</p>
          <p>Level: ${data.level}</p>
          <p style="font-size: 3em; margin: 10px 0;">${data.portalIcon}</p>
          <div style="margin-top: 1rem;">
            ${portalButtonHTML}
            <button onclick="closePopup()" class="close-btn">Close</button>
          </div>
        `;
        openPopup(html, cell);
        return;
      }

      const enemies = [
        data.enemyOne,
        data.enemyTwo,
        data.enemyThree,
        data.enemyFour,
        data.enemyFive,
        data.enemySix,
        data.enemySeven
      ].filter(enemy => enemy);

      const enemiesHTML = enemies.length > 0 ? enemies.map(enemy =>
        `<img src="${enemy}" alt="${data.title}" style="width:${100 / enemies.length}%"/>`
      ).join('') : '';
      
      // Determine if this is a boss tile
      const isBossTile = data.isBossTile || data.isDimensionalBoss || false;
      
      let battleButtonHTML = '';
      if (isAccessible && enemies.length > 0) {
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

// Function to enter a dimensional portal
function enterPortal(portalMode) {
  closePopup();
  
  // Get the starting level for this dimension (the portal level itself)
  const dimensionStartLevels = {
    'undead': 10,
    'nature': 25,
    'elemental': 40,
    'beast': 55,
    'aberration': 70,
    'construct': 85,
    'aquatic': 90
  };
  
  const firstLevel = dimensionStartLevels[portalMode] || 1;
  
  // Directly save progression for the portal mode
  try {
    const saved = localStorage.getItem(`dungeonProgressionData_${portalMode}`);
    const progression = saved ? JSON.parse(saved) : { clearedLevels: [], unlockedUpToLevel: 1 };
    progression.unlockedUpToLevel = firstLevel;
    progression.clearedLevels = progression.clearedLevels || [];
    localStorage.setItem(`dungeonProgressionData_${portalMode}`, JSON.stringify(progression));
    console.log(`Entering ${portalMode} portal, unlocking level ${firstLevel}`, progression);
  } catch (e) {
    console.error('Failed to save portal progression', e);
  }
  
  // Also unlock the next level on the main path (level after the portal)
  try {
    const mainSaved = localStorage.getItem(`dungeonProgressionData_main`);
    const mainProgression = mainSaved ? JSON.parse(mainSaved) : { clearedLevels: [], unlockedUpToLevel: 1 };
    const levelAfterPortal = firstLevel + 1;
    if (mainProgression.unlockedUpToLevel <= firstLevel) {
      mainProgression.unlockedUpToLevel = levelAfterPortal;
      localStorage.setItem(`dungeonProgressionData_main`, JSON.stringify(mainProgression));
      console.log(`Unlocked level ${levelAfterPortal} on main path after entering portal`);
    }
  } catch (e) {
    console.error('Failed to update main path progression', e);
  }
  
  // Reload map with the portal's mode
  window.location.href = `map.html?mode=${portalMode}`;
}

// Make it globally accessible
window.enterPortal = enterPortal;

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

// Function to return to main path
function returnToMainPath() {
  window.location.href = 'map.html?mode=main';
}

// Make it globally accessible
window.returnToMainPath = returnToMainPath;

// Initial setup on page load
function initialize() {
  // Initialize game mode first
  initializeGameMode();
  
  // Show/hide return button based on mode
  const returnBtn = document.getElementById('returnToMain');
  if (returnBtn) {
    if (currentGameMode !== 'main') {
      returnBtn.style.display = 'inline-block';
    } else {
      returnBtn.style.display = 'none';
    }
  }
  
  const savedData = localStorage.getItem(`dungeonTileData_${currentGameMode}`);
  console.log('[MAP INIT] Current game mode:', currentGameMode);
  console.log('[MAP INIT] Saved dungeon data exists:', !!savedData);
  
  if (savedData) {
    tileData = JSON.parse(savedData);
    console.log('[MAP INIT] Loaded tileData from storage, tile count:', Object.keys(tileData).length);
  } else {
    console.log('[MAP INIT] No saved data, generating new dungeon');
    generateAndSaveDungeon();
    console.log('[MAP INIT] Generated tileData, tile count:', Object.keys(tileData).length);
  }
  
  // Apply saved progression to tile status (whether loaded or newly generated)
  let progression = loadDungeonProgression();
  console.log('[MAP INIT] Loading progression for mode', currentGameMode, ':', progression);
  
  // Ensure first level is always unlocked for dimensions
  if (progression.unlockedUpToLevel < 1) {
    console.log('[MAP INIT] Progression unlocked level < 1, setting to 1');
    progression.unlockedUpToLevel = 1;
    saveDungeonProgression(progression);
  }
  
  console.log('[MAP INIT] Updating tile status based on progression...');
  let unlockedCount = 0;
  const tileLevels = [];
  for (const key in tileData) {
    const level = tileData[key].level;
    tileLevels.push(level);
    const wasUnlocked = tileData[key].status;
    
    // Mark cleared levels
    if (progression.clearedLevels.includes(level)) {
      tileData[key].cleared = true;
    }
    // Enable levels up to highest unlocked
    if (level <= progression.unlockedUpToLevel) {
      tileData[key].status = true;
      if (!wasUnlocked) unlockedCount++;
      console.log(`[MAP INIT] Unlocking level ${level} (tile at ${key})`);
    }
  }
  console.log('[MAP INIT] Tile levels in dungeon:', tileLevels.sort((a,b) => a-b));
  console.log('[MAP INIT] Unlocked', unlockedCount, 'tiles based on progression.unlockedUpToLevel =', progression.unlockedUpToLevel);
  
  // Create chaos portal if unlocked and in main mode
  if (progression.chaosPortalUnlocked && currentGameMode === 'main') {
    console.log('[MAP INIT] Chaos portal unlocked, checking if it exists...');
    let chaosPortalExists = false;
    for (const key in tileData) {
      if (tileData[key].level === 101 && tileData[key].isPortal) {
        chaosPortalExists = true;
        console.log('[MAP INIT] Chaos portal already exists at', key);
        break;
      }
    }
    
    if (!chaosPortalExists) {
      console.log('[MAP INIT] Creating chaos portal at level 101...');
      // Find level 100 position
      let level100Key = null;
      for (const key in tileData) {
        if (tileData[key].level === 100) {
          level100Key = key;
          break;
        }
      }
      
      if (level100Key) {
        const [row100, col100] = level100Key.split(',').map(Number);
        
        // Try to find an adjacent empty cell
        const adjacentCells = [
          [row100 - 1, col100], [row100 + 1, col100],
          [row100, col100 - 1], [row100, col100 + 1]
        ];
        
        let portalPlaced = false;
        for (const [r, c] of adjacentCells) {
          const adjacentKey = `${r},${c}`;
          if (r >= 0 && r < 20 && c >= 0 && c < 20 && !tileData[adjacentKey]) {
            // Create the chaos portal here
            tileData[adjacentKey] = {
              level: 101,
              title: "🌀 Chaos Realm Portal",
              description: "Enter the Chaos Realm - Reality itself bends here.",
              cleared: false,
              status: true, // Unlocked immediately
              isPortal: true,
              portalMode: 'chaos',
              portalName: 'Chaos Realm',
              portalIcon: '🌀',
              enemyOne: null,
              enemyTwo: null,
              enemyThree: null
            };
            portalPlaced = true;
            console.log('[MAP INIT] Chaos portal created at level 101, position:', adjacentKey);
            break;
          }
        }
        
        // If no adjacent cells available, try to find any empty cell
        if (!portalPlaced) {
          for (let r = 0; r < 20; r++) {
            for (let c = 0; c < 20; c++) {
              const key = `${r},${c}`;
              if (!tileData[key]) {
                tileData[key] = {
                  level: 101,
                  title: "🌀 Chaos Realm Portal",
                  description: "Enter the Chaos Realm - Reality itself bends here.",
                  cleared: false,
                  status: true,
                  isPortal: true,
                  portalMode: 'chaos',
                  portalName: 'Chaos Realm',
                  portalIcon: '🌀',
                  enemyOne: null,
                  enemyTwo: null,
                  enemyThree: null
                };
                portalPlaced = true;
                console.log('[MAP INIT] Chaos portal created at level 101, position:', key);
                break;
              }
            }
            if (portalPlaced) break;
          }
        }
      } else {
        console.warn('[MAP INIT] Could not find level 100 tile to place chaos portal near');
      }
    }
  }
  
  // Save the updated tileData back to localStorage
  localStorage.setItem(`dungeonTileData_${currentGameMode}`, JSON.stringify(tileData));
  console.log('[MAP INIT] Saved updated tileData to storage');
  renderGrid();
  
  // Scroll to current unlocked level after a short delay to ensure rendering is complete
  setTimeout(() => {
    const currentLevelCell = document.querySelector('[data-current-level="true"]');
    if (currentLevelCell) {
      currentLevelCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, 100);
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
// NOTE: These are DUPLICATE functions - the real ones are at lines ~179-196
// Keeping these for backward compatibility but they now redirect to mode-specific versions
function loadDungeonProgression() {
  try {
    const mode = currentGameMode || 'main';
    const saved = localStorage.getItem(`dungeonProgressionData_${mode}`);
    return saved ? JSON.parse(saved) : { clearedLevels: [], unlockedUpToLevel: 1 };
  } catch (e) {
    console.error('Failed to load dungeon progression', e);
    return { clearedLevels: [], unlockedUpToLevel: 1 };
  }
}

function saveDungeonProgression(progression) {
  try {
    const mode = currentGameMode || 'main';
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
    let nextLevel = level + 1;
    
    // Portal levels on main path - skip over them and unlock the level after
    const portalLevels = [10, 25, 40, 55, 70, 85, 90];
    
    // If the next level is a portal, skip it and unlock the level after the portal
    if (currentGameMode === 'main' && portalLevels.includes(nextLevel)) {
      progression.unlockedUpToLevel = nextLevel + 1;
    } else {
      progression.unlockedUpToLevel = nextLevel;
    }
  }
  
  // Give iron armor set on first level completion
  if (level === 1 && !localStorage.getItem('firstLevelReward')) {
    giveIronArmorSet();
    localStorage.setItem('firstLevelReward', 'true');
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
    const mode = currentGameMode || 'main';
    localStorage.setItem(`dungeonTileData_${mode}`, JSON.stringify(tileData));
    console.log('Updated tileData in localStorage for mode:', mode);
  } else {
    console.log('tileData not available, progression saved for map reload');
  }
  
  console.log(`Level ${level} cleared! Unlocked up to level ${progression.unlockedUpToLevel}`);
}

// Give each party member a full iron armor set (level 1)
function giveIronArmorSet() {
  const armorPieces = [
    { name: 'Iron Helmet', slot: 'HELMET' },
    { name: 'Iron Chestplate', slot: 'CHEST' },
    { name: 'Iron Legging', slot: 'LEGS' },
    { name: 'Iron Boots', slot: 'BOOTS' }
  ];
  
  const memberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
  
  memberKeys.forEach(memberKey => {
    armorPieces.forEach(({ name, slot }) => {
      const template = ITEM_TABLE[name];
      if (!template) return;
      
      const armorItem = generateRandomItem(1, 'Common');
      const level1Scale = Math.pow(1, 0.8);
      
      armorItem.name = name;
      armorItem.slot = template.slot;
      armorItem.rarity = template.rarity;
      armorItem.strength = Math.round(template.strength * level1Scale);
      armorItem.speed = Math.round(template.speed * level1Scale);
      armorItem.magic = Math.round(template.magic * level1Scale);
      armorItem.defense = Math.round(template.defense * level1Scale);
      armorItem.health = Math.round(template.health * level1Scale);
      armorItem.attack = template.attack;
      armorItem.ability = template.ability;
      armorItem.image = template.image;
      armorItem.level = 1;
      armorItem.equipped = false;
      armorItem._uid = `iron_${slot}_${memberKey}_${Date.now()}`;
      
      INVENTORY.push(armorItem);
      
      // Auto-equip to this party member
      if (PARTY_STATS[memberKey]) {
        PARTY_STATS[memberKey][slot] = armorItem.name;
        armorItem.equipped = true;
      }
    });
  });
  
  // Update stats and save
  if (typeof updateStats === 'function') updateStats();
  saveGameData();
  
  console.log('Gave iron armor sets to all party members!');
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
  // ========================================
  // SET 1 ITEMS - Rebalanced for Specialists
  // ========================================
  
  // BASE
  "Stick": {
    slot: "Weapon",
    rarity: "Base",
    strength: 1,
    speed: 1,
    magic: 1,
    defense: 0,
    health: 0,
    mana: 5,
    attack: "poke",
    ability: 0,
    image: "Items/stick.png",
    role: "Beginner weapon - Balanced stats for early game exploration and learning combat mechanics.",
  },
  
  // COMMON - Early balanced items
  "Wooden Sword": {//this 
    slot: "Weapon",
    rarity: "Common",
    strength: 4,
    speed: 1,
    magic: 0,
    defense: 0,
    health: 2,
    mana: 0,
    attack: "stap",
    ability: 1,
    image: "Items/woodenSword.png",
    role: "Physical damage starter - Good for learning strength-based combat with bleed status effects.",
  },
  "Grass Staff": {//this 
    slot: "Weapon",
    rarity: "Common",
    strength: 0,
    speed: 1,
    magic: 4,
    defense: 0,
    health: 2,
    mana: 10,
    attack: "leaf impale",
    ability: 1,
    image: "Items/grassStaff.png",
    role: "Magic damage starter - Introduces spell-based combat with mana management and status effects.",
  },
  "Iron Helmet": {//this 
    slot: "Helmet",
    rarity: "Common",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 2,
    health: 2,
    mana: 0,
    attack: "none",
    ability: 0,
    image: "Items/ironHelmet.png",
    role: "Basic defense - Early game survival, protects against physical damage in the first dungeons.",
  },
  "Iron Chestplate": {//this 
    slot: "Chest",
    rarity: "Common",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 2,
    health: 2,
    mana: 0,
    attack: "none",
    ability: 0,
    image: "Items/ironChest.png",
    role: "Tanking core - Essential for building defensive characters who can absorb enemy attacks.",
  },
  "Iron Legging": {//this 
    slot: "Leg",
    rarity: "Common",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 2,
    health: 2,
    mana: 0,
    attack: "none",
    ability: 0,
    image: "Items/ironLegging.png",
    role: "Defensive foundation - Complements tanky builds focusing on survival over damage.",
  },
  "Iron Boots": {//this 
    slot: "Boot",
    rarity: "Common",
    strength: 0,
    speed: 2,
    magic: 0,
    defense: 1,
    health: 1,
    mana: 0,
    attack: "none",
    ability: 0,
    image: "Items/ironBoots.png",
    role: "Balanced mobility - Adds speed for turn advantage while maintaining defensive capabilities.",
  },
  
  // UNCOMMON - Specialization begins
  "Coral Dagger": {//this 
    slot: "Weapon",
    rarity: "Uncommon",
    strength: 5,
    speed: 3,
    magic: 0,
    defense: 0,
    health: 2,
    mana: 0,
    attack: "coral leech",
    ability: null,
    image: "Items/coralDagger.png",
    role: "Sustained DPS - Rewards consistent attacking with stacking damage bonuses, best for aggressive fighters.",
  },
  "Sea Crystal": {//this 
    slot: "Offhand",
    rarity: "Rare",
    strength: 0,
    speed: 2,
    magic: 7,
    defense: 2,
    health: 4,
    mana: 25,
    attack: "sea shield",
    ability: 21, // Sea Shield: Immune to leech, burn, and chill status effects
    image: "Items/seaCrystal.png",
    role: "Status immunity - Perfect for magic users who want protection from debilitating status effects.",
  },
  "Shell": {//this 
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 7,
    health: 3,
    mana: 0,
    attack: "none",
    ability: 0,
    image: "Items/shell.png",
    role: "Pure tank - Maximum defense for players who prioritize survival and protecting teammates.",
  },
  "Water Skaters": {//this 
    slot: "Boots",
    rarity: "Uncommon",
    strength: 0,
    speed: 4,
    magic: 0,
    defense: 2,
    health: 2,
    mana: 0,
    attack: null,
    ability: null,
    image: "Items/waterSkaters.png",
    role: "Speed demon - Turn advantage specialist, ensures you attack first in most encounters.",
  },
  
  // RARE - Strong specialization
  "Spiked Shield": {//this 
    slot: "Weapon",
    rarity: "Rare",
    strength: 6,
    speed: 0,
    magic: 0,
    defense: 7,
    health: 5,
    attack: "Charge",
    ability: 4,
    image: "Items/spikedShield.png",
    role: "Counter-attacker - Tank who fights back, dealing damage while absorbing hits with high defense.",
  },
  "Grimore": {//this 
    slot: "Weapon",
    rarity: "Rare",
    strength: 0,
    speed: 2,
    magic: 7,
    defense: 0,
    health: 2,
    attack: "Plasma Blast",
    ability: 5,
    image: "Items/grimore.png",
    role: "Burst mage - High magic damage with multi-target potential through random status effects.",
  },
  "Ice Spear": {//this 
    slot: "Weapon",
    rarity: "Rare",
    strength: 7,
    speed: 3,
    magic: 0,
    defense: 0,
    health: 2,
    attack: "plunge",
    ability: 1,
    image: "Items/iceSpear.png",
    role: "Physical DPS - High strength and speed for rapid single-target elimination with bleed stacking.",
  },
  "Forest Crown": {//this 
    slot: "Helmet",
    rarity: "Rare",
    strength: 0,
    speed: 3,
    magic: 2,
    defense: 2,
    health: 5,
    attack: "Tree People",
    ability: 0,
    image: "Items/forestCrown.png",
    role: "Support utility - Balanced stats with moderate speed for players who assist teammates.",
  },
  "Frosted Helmet": {//this 
    slot: "Helmet",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 2,
    defense: 4,
    health: 5,
    attack: "none",
    ability: 0,
    image: "Items/frostHelmet.png",
    role: "Magic tank - Combines magical damage with defensive capabilities for spell-based tanks.",
  },
  "Frosted Chest": {//this 
    slot: "Chest",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 3,
    defense: 6,
    health: 6,
    attack: "none",
    ability: 0,
    image: "Items/frostChest.png",
    role: "Magic defense - Core armor for mages who need survivability without sacrificing magical power.",
  },
  "Frosted Leg": {//this 
    slot: "Leg",
    rarity: "Rare",
    strength: 0,
    speed: 1,
    magic: 2,
    defense: 5,
    health: 3,
    attack: "none",
    ability: 0,
    image: "Items/frostLegs.png",
    role: "Balanced caster - Moderate defense and magic for mages who want some protection.",
  },
  "Frosted Boots": {//this 
    slot: "Boot",
    rarity: "Rare",
    strength: 0,
    speed: 4,
    magic: 1,
    defense: 2,
    health: 2,
    attack: "none",
    ability: 0,
    image: "Items/frostBoots.png",
    role: "Spellcaster mobility - Speed boost for mages to cast before enemies can react.",
  },
  
  // EPIC - Heavy specialization
  "Shadow Staff": {//this 
    slot: "Weapon",
    rarity: "Epic",
    strength: 0,
    speed: 2,
    magic: 9,
    defense: 0,
    health: 3,
    attack: "shadow vortex",
    ability: 7,
    image: "Items/shadowStaff.png",
    role: "High-risk mage - Massive magic damage with recoil mechanic, rewards skilled play with consecutive attacks.",
  },
  "Blaze Blade": {//this 
    slot: "Weapon",
    rarity: "Epic",
    strength: 9,
    speed: 4,
    magic: 0,
    defense: 1,
    health: 3,
    attack: "Incenerate",
    ability: 8,
    image: "Items/blazeBlade.png",
    role: "Aggressive DPS - Speed and strength synergy with fire status for players who go all-in on offense.",
  },
  "Spell Shield": {//this 
    slot: "Offhand",
    rarity: "Epic",
    strength: 0,
    speed: 0,
    magic: 7,
    defense: 7,
    health: 5,
    attack: null,
    ability: 20,
    image: "Items/spellShield.png",
    role: "Hybrid defender - Combines magic power with defense, perfect for battle-mages who need protection.",
  },
  "Gem Helmet": {//this 
    slot: "Helmet",
    rarity: "Epic",
    strength: 1,
    speed: 0,
    magic: 3,
    defense: 6,
    health: 6,
    attack: "none",
    ability: 3,
    image: "Items/gemHelmet.png",
    role: "Magic tank hybrid - Magi Reflect ability counters magic enemies while providing solid defense.",
  },
  "Gem Chest": {//this 
    slot: "Chest",
    rarity: "Epic",
    strength: 2,
    speed: 0,
    magic: 4,
    defense: 7,
    health: 7,
    attack: "none",
    ability: 0,
    image: "Items/gemChest.png",
    role: "Versatile defense - Strong armor with balanced stats for various build types.",
  },
  "Gem Legs": {//this 
    slot: "Leg",
    rarity: "Epic",
    strength: 1,
    speed: 1,
    magic: 3,
    defense: 6,
    health: 5,
    attack: "none",
    ability: 0,
    image: "Items/gemLegs.png",
    role: "Hybrid protection - Mixed stats for characters balancing physical and magical approaches.",
  },
  "Gem Boots": {//this 
    slot: "Boots",
    rarity: "Epic",
    strength: 0,
    speed: 5,
    magic: 2,
    defense: 3,
    health: 4,
    attack: "none",
    ability: 3,
    image: "Items/gemBoots.png",
    role: "Fast hybrid - High speed with Magi Reflect for mobile casters who counter magic damage.",
  },
  
  // LEGENDARY - Extreme specialization with some versatility
  "Energy Saber": {//this 
    slot: "Weapon",
    rarity: "Legendary",
    strength: 10,
    speed: 5,
    magic: 1,
    defense: 2,
    health: 5,
    attack: "force strike",
    ability: 10,
    image: "Items/energySaber.png",
    role: "Double striker - Attack twice per turn, ideal for builds maximizing attack count and on-hit effects.",
  },
  "Demon Sythe": {//this 
    slot: "Weapon",
    rarity: "Legendary",
    strength: 11,
    speed: 4,
    magic: 0,
    defense: 2,
    health: 4,
    attack: "Grim slice",
    ability: 10,
    image: "Items/demonSythe.png",
    role: "Grim reaper - Massive strength with grim status, devastating for players who capitalize on dead allies.",
  },
  "Lightning Spear": {//this 
    slot: "Offhand",
    rarity: "Legendary",
    strength: 8,
    speed: 6,
    magic: 2,
    defense: 2,
    health: 5,
    attack: "Thunder",
    ability: 12,
    image: "Items/lightningSpear.png",
    role: "Speed striker - Combines high speed with After Shock defense, perfect for hit-and-run tactics.",
  },
  "Pixel Sword": {//this 
    slot: "Weapon",
    rarity: "Legendary",
    strength: 11,
    speed: 6,
    magic: 0,
    defense: 2,
    health: 5,
    attack: "Combo",
    ability: 13,
    image: "Items/pixelSword.png",
    role: "Combo master - Rewards skillful play with mini-game mechanics, scaling damage through perfect timing.",
  },
  "Ice Cream Gun": {//this 
    slot: "Weapon",
    rarity: "Legendary",
    strength: 0,
    speed: 4,
    magic: 10,
    skill: 11,
    defense: 2,
    health: 4,
    attack: "Chilled Cream",
    ability: 14,
    image: "Items/iceCreamGun.png",
    role: "Crowd control mage - Freeze enemies with chill status while dealing consistent magic damage.",
  },
  
  // MYTHICAL - Peak specialization, balanced generalist option exists
  "Running Spikes": {//this 
    slot: "Boots",
    rarity: "Mythical",
    strength: 1,
    speed: 9,
    magic: 1,
    defense: 4,
    health: 6,
    attack: "none",
    ability: 15,
    image: "Items/runningSpikes.png",
    role: "Maximum speed - Ensures turn priority in almost every fight, critical for speed-based strategies.",
  },
  "Rulers Hand": {//this 
    slot: "Weapon",
    rarity: "Mythical",
    strength: 9,
    speed: 5,
    magic: 1,
    defense: 3,
    health: 7,
    attack: "Arise",
    ability: 16,
    image: "Items/rulersHand.png",
    role: "Summoner - Arise ability for characters who want minion support and high physical damage.",
  },
  "Muramasa": {//this 
    slot: "Weapon",
    rarity: "Mythical",
    strength: 13,
    speed: 7,
    magic: 0,
    skill: 15,
    defense: 2,
    health: 5,
    attack: "Pure skill",
    ability: 17,
    image: "Items/muramasa.png",
    role: "Critical striker - Extreme strength with critical hit chance, best for all-or-nothing damage dealers.",
  },
  "Spell Blade": {//this 
    slot: "Weapon",
    rarity: "Mythical",
    strength: 5,
    speed: 5,
    magic: 11,
    defense: 2,
    health: 5,
    attack: "spell infused",
    ability: 18,
    image: "Items/spellBlade.png",
    role: "Hybrid DPS - Balanced magic and strength for versatile damage dealers who use both stats.",
  },
  "Enhanced Stick": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 6,
    speed: 4,
    magic: 6,
    defense: 2,
    health: 5,
    attack: "enhance",
    ability: 19,
    image: "Items/enhancedStick.png",
    role: "Stat booster - Continuously stacking stats through the Enhance ability, rewards sustained combat.",
  },
  
  // ARTIFACT
  "Divine Crown": {//this 
    slot: "Helmet",
    rarity: "Artifact",
    strength: 4,
    speed: 4,
    magic: 4,
    defense: 6,
    health: 8,
    attack: "Rulers Authority",
    ability: 20,
    image: "Items/divineCrown.png",
    role: "Supreme tank - Spell Shield ability with balanced stats, the ultimate defensive headpiece.",
  },
  
  // ========================================
  // SET 2 ITEMS - Unique Specialist Items
  // ========================================
  
  // COMMON SET 2
  "Training Weights": {//this 
    slot: "Leg",
    rarity: "Common",
    strength: 3,
    speed: 0,
    magic: 0,
    defense: 1,
    health: 2,
    attack: "none",
    ability: 22, // Fury: Deal +10% damage per 10% HP missing
    image: "Items/trainingWeights.png",
    role: "Low HP berserker - Fury ability rewards staying at low health for massive damage scaling.",
  },
  "Apprentice Robes": {//this 
    slot: "Chest",
    rarity: "Common",
    strength: 0,
    speed: 1,
    magic: 3,
    defense: 1,
    health: 2,
    attack: "none",
    ability: 33, // Arcane Surge: Casting magic restores 10% of mana cost
    image: "Items/apprenticeRobes.png",
    role: "Mana sustain - Arcane Surge keeps spell-casters in the fight with mana regeneration.",
  },
  "Swift Gloves": {//this 
    slot: "Offhand",
    rarity: "Common",
    strength: 0,
    speed: 3,
    magic: 0,
    defense: 1,
    health: 2,
    attack: "Quick Jab",
    ability: 0,
    image: "Items/swiftGloves.png",
    role: "Fast attacker - Speed-focused offhand for quick consecutive strikes and turn advantage.",
  },
  
  // UNCOMMON SET 2
  "Berserker Axe": {//this 
    slot: "Weapon",
    rarity: "Uncommon",
    strength: 6,
    speed: 0,
    magic: 0,
    defense: 0,
    health: 4,
    attack: "Reckless Swing",
    ability: 32, // Berserker: Gain +5% damage per consecutive attack (max +50%)
    image: "Items/berserkerAxe.png",
    role: "Rampage fighter - Stacking damage through consecutive attacks, devastating in prolonged fights.",
  },
  "Arcane Focus": {//this 
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 0,
    magic: 6,
    defense: 1,
    health: 2,
    attack: "Arcane Bolt",
    ability: 25, // Meteor Strike: 20% chance to deal 200% AOE damage
    image: "Items/arcaneFocus.png",
    role: "AOE nuker - Meteor Strike ability for mages who want explosive multi-target damage.",
  },
  "Assassin's Boots": {//this 
    slot: "Boot",
    rarity: "Uncommon",
    strength: 2,
    speed: 5,
    magic: 0,
    defense: 0,
    health: 1,
    attack: "none",
    ability: 30, // Ethereal: 25% chance to dodge all damage
    image: "Items/assassinBoots.png",
    role: "Dodge tank - Ethereal ability for evasion-based defense rather than raw stats.",
  },
  "Healer's Vestment": {//this 
    slot: "Chest",
    rarity: "Uncommon",
    strength: 0,
    speed: 1,
    magic: 5,
    defense: 3,
    health: 5,
    mana: 20,
    attack: "none",
    ability: 53, // Regeneration: Restore 3% max HP to both players per turn
    image: "Items/healerVestment.png",
    role: "Team support - Regeneration keeps both players alive, essential for dual-player content.",
  },
  
  // RARE SET 2
  "Blood Reaver": {//this 
    slot: "Weapon",
    rarity: "Rare",
    strength: 8,
    speed: 2,
    magic: 0,
    defense: 0,
    health: 3,
    attack: "Drain Strike",
    ability: 31, // Life Drain: Heal 20% of damage dealt
    image: "Items/bloodReaver.png",
    role: "Vampire fighter - Life Drain sustains aggressive fighters who convert damage into healing.",
  },
  "Oracle's Vision": {//this 
    slot: "Helmet",
    rarity: "Rare",
    strength: 1,
    speed: 3,
    magic: 6,
    defense: 2,
    health: 4,
    mana: 25,
    attack: "Foresight",
    ability: 52, // Precognition: Grant ally +10% damage and +10% defense
    image: "Items/oracleVision.png",
    role: "Team buffer - Precognition boosts ally performance, perfect for support-focused players.",
  },
  "Titan Gauntlets": {//this 
    slot: "Offhand",
    rarity: "Rare",
    strength: 7,
    speed: -1,
    magic: 0,
    defense: 4,
    health: 7,
    attack: "Ground Slam",
    ability: 44, // Reaper: Deal bonus damage equal to 5% of enemy max HP
    image: "Items/titanGauntlets.png",
    role: "Boss killer - Reaper ability deals percentage-based damage, shreds high-HP enemies.",
  },
  "Sage's Codex": { //this
    slot: "Offhand",
    rarity: "Rare",
    strength: 0,
    speed: 1,
    magic: 7,
    defense: 2,
    health: 3,
    mana: 25,
    attack: "Wisdom Beam",
    ability: 47, // Sage's Wisdom: Restore 5% max mana to both players per turn
    image: "Items/sageCodex.png",
    role: "Mana battery - Restores team mana for sustained magical combat in long battles.",
  },
  
  // EPIC SET 2
  "Executioner's Edge": { //this
    slot: "Weapon",
    rarity: "Epic",
    strength: 11,
    speed: 3,
    magic: 0,
    defense: 1,
    health: 4,
    attack: "Decapitate",
    ability: 24, // Execute: Deal 300% damage to enemies below 25% HP
    image: "Items/executionerEdge.png",
    role: "Finisher - Execute ability delivers massive damage to low-HP enemies for quick eliminations.",
  },
  "Void Catalyst": { //this
    slot: "Weapon",
    rarity: "Epic",
    strength: 0,
    speed: 3,
    magic: 11,
    defense: 1,
    health: 3,
    attack: "Void Surge",
    ability: 29, // Corruption: Deal +50% damage to enemies with status effects
    image: "Items/voidCatalyst.png",
    role: "Status synergy - Corruption amplifies damage against debuffed enemies, pairs with status attack builds.",
  },
  "Guardian's Embrace": {
    slot: "Chest",
    rarity: "Epic",
    strength: 2,
    speed: 0,
    magic: 4,
    defense: 6,
    health: 8,
    mana: 20,
    attack: "none",
    ability: 48, // Protective Aura: Allies (dual-player) take 15% less damage
    image: "Items/guardianEmbrace.png",
    role: "Team protector - Protective Aura reduces party damage, essential for defensive team compositions.",
  },
  "Versatile Grimoire": {
    slot: "Offhand",
    rarity: "Epic",
    strength: 3,
    speed: 2,
    magic: 8,
    defense: 3,
    health: 5,
    mana: 30,
    attack: "Adaptive Spell",
    ability: 49, // Versatility: Share 15% of your highest stat with ally
    image: "Items/versatileGrimoire.png",
    role: "Stat sharer - Versatility ability spreads your strengths to allies for balanced team power.",
  },
  "Dragon Scale Armor": {
    slot: "Chest",
    rarity: "Epic",
    strength: 3,
    speed: -1,
    magic: 2,
    defense: 8,
    health: 6,
    attack: "none",
    ability: 34, // Phoenix: Revive once per battle at 30% HP when killed
    image: "Items/dragonScaleArmor.png",
    role: "Phoenix tank - Revive ability gives a second chance, perfect for risky aggressive tanks.",
  },
  
  // LEGENDARY SET 2
  "Godslayer Blade": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 13,
    speed: 6,
    magic: 1,
    defense: 2,
    health: 6,
    mana: 15,
    attack: "Divine Rend",
    ability: 50, // Godslayer: Heal to full HP on kill
    image: "Items/godslayerBlade.png",
    role: "Nutrition fighter - Godslayer ability provides full heal on kills, sustains aggressive single-target attackers through consecutive battles.",
  },
  "Cosmic Orb": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 1,
    speed: 5,
    magic: 12,
    defense: 2,
    health: 5,
    mana: 35,
    attack: "Supernova",
    ability: 35, // Frozen Heart: 40% chance to freeze enemies hit for 1 turn
    image: "Items/cosmicOrb.png",
    role: "Freeze mage - Frozen Heart locks down enemies while dealing massive magic damage.",
  },
  "Quicksilver Daggers": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 9,
    speed: 8,
    magic: 0,
    skill: 13,
    defense: 1,
    health: 4,
    attack: "Blur",
    ability: 43, // Elemental Chaos: Attacks randomly deal fire, ice, or lightning damage (+30%)
    image: "Items/quicksilverDaggers.png",
    role: "Elemental assassin - High speed with random elemental damage for unpredictable burst offense.",
  },
  "Harmony Treads": {
    slot: "Boots",
    rarity: "Legendary",
    strength: 4,
    speed: 8,
    magic: 4,
    defense: 2,
    health: 6,
    mana: 20,
    attack: "none",
    ability: 51, // Balance: Grant both players +20% speed when fighting together
    image: "Items/harmonyTreads.png",
    role: "Team speedster - Balance ability boosts dual-player speed for synchronized fast attacks.",
  },
  
  // MYTHICAL SET 2
  "Aegis Shield": {
    slot: "Offhand",
    rarity: "Mythical",
    strength: 3,
    speed: 1,
    magic: 5,
    defense: 11,
    health: 10,
    mana: 25,
    attack: "Shield Bash",
    ability: 45, // Divine Intervention: Survive lethal damage once per battle at 1 HP
    image: "Items/aegisShield.png",
    role: "Last stand - Divine Intervention prevents death, the ultimate defensive tool for risky strategies.",
  },
  "Soul Reaper": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 12,
    speed: 6,
    magic: 4,
    defense: 2,
    health: 6,
    attack: "Soul Harvest",
    ability: 26, // Death's Touch: Attacks instantly kill enemies below 15% HP
    image: "Items/soulReaper.png",
    role: "Execution specialist - Deaths Touch instantly kills low-HP enemies, perfect for finishing blows.",
  },
  "Archmage Vestments": {
    slot: "Chest",
    rarity: "Mythical",
    strength: 1,
    speed: 3,
    magic: 13,
    defense: 5,
    health: 6,
    attack: "none",
    ability: 36, // Thunder God: Lightning attacks chain to 2 random enemies for 50% damage
    image: "Items/archmageVestments.png",
    role: "Lightning mage - Thunder God chains damage across multiple enemies for devastating AOE.",
  },
  "Celestial Treads": {
    slot: "Boots",
    rarity: "Mythical",
    strength: 2,
    speed: 10,
    magic: 3,
    defense: 4,
    health: 6,
    attack: "none",
    ability: 39, // Mana Burn: Physical attacks drain 20% of enemy max mana
    image: "Items/celestialTreads.png",
    role: "Mana drainer - Disrupts enemy casters by depleting their mana with physical attacks.",
  },
  
  // ARTIFACT SET 2
  "World Ender": {
    slot: "Weapon",
    rarity: "Artifact",
    strength: 15,
    speed: 6,
    magic: 6,
    defense: 3,
    health: 8,
    attack: "Apocalypse",
    ability: 46, // Apocalypse: Deal 150% damage to all enemies when HP drops below 20%
    image: "Items/worldEnder.png",
    role: "Last resort - Apocalypse activates at low HP for desperate comebacks, high-risk high-reward.",
  },

  // ========================================
  // SET 3 ITEMS - Expanded Content
  // ========================================

  // NEW ITEMS BATCH 1 (Items 1-15)
  "Stormcaller Staff": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 0,
    speed: 3,
    magic: 8,
    defense: 1,
    health: 3,
    mana: 30,
    attack: "Chain Lightning",
    ability: 36,
    image: "Items/stormcallerStaff.png",
    role: "AOE specialist - Chain lightning that bounces between enemies, ideal for clearing groups of weaker foes.",
  },
  "Reaper's Cowl": {
    slot: "Helmet",
    rarity: "Epic",
    strength: 4,
    speed: 3,
    magic: 2,
    defense: 4,
    health: 5,
    mana: 15,
    attack: "Death Mark",
    ability: 26,
    image: "Items/reaperCowl.png",
    role: "Execute specialist - Pairs with finisher builds, increases damage against wounded enemies for consistent kills.",
  },
  "Crystalline Gauntlets": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 3,
    speed: 0,
    magic: 6,
    defense: 9,
    health: 7,
    mana: 20,
    attack: "Crystal Barrier",
    ability: 38,
    image: "Items/crystallineGauntlets.png",
    role: "Reflect tank - Counters both physical and magical attacks, perfect for defensive players who punish aggression.",
  },
  "Windwalker Cloak": {
    slot: "Chest",
    rarity: "Uncommon",
    strength: 0,
    speed: 4,
    magic: 1,
    defense: 2,
    health: 3,
    mana: 10,
    attack: "none",
    ability: 30,
    image: "Items/windwalkerCloak.png",
    role: "Evasion support - Moderate dodge chance with speed boost, affordable defensive option for agile builds.",
  },
  "Abyssal Greaves": {
    slot: "Leg",
    rarity: "Mythical",
    strength: 3,
    speed: 2,
    magic: 4,
    defense: 7,
    health: 6,
    mana: 25,
    attack: "none",
    ability: 39,
    image: "Items/abyssalGreaves.png",
    role: "Mana disruptor - Shuts down enemy spellcasters while providing excellent defense for anti-mage strategies.",
  },
  "Phoenix Feather": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 1,
    speed: 3,
    magic: 5,
    defense: 2,
    health: 4,
    mana: 25,
    attack: "Flame Rebirth",
    ability: 34,
    image: "Items/phoenixFeather.png",
    role: "Resurrection insurance - Cheaper alternative to Phoenix-based armor, provides safety net for risky players.",
  },
  "Berserker's Mantle": {
    slot: "Chest",
    rarity: "Epic",
    strength: 5,
    speed: 1,
    magic: 0,
    defense: 5,
    health: 4,
    mana: 0,
    attack: "none",
    ability: 22,
    image: "Items/berserkerMantle.png",
    role: "Fury amplifier - Synergizes with low-HP damage builds, combines defense with offensive scaling for all-in fighters.",
  },
  "Chrono Bracers": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 2,
    speed: 7,
    magic: 5,
    defense: 3,
    health: 5,
    mana: 30,
    attack: "Time Warp",
    ability: 23,
    image: "Items/chronoBracers.png",
    role: "Turn manipulator - Temporal Shift provides extra actions, game-changing for combo-based strategies.",
  },
  "Lifetap Dagger": {
    slot: "Weapon",
    rarity: "Common",
    strength: 3,
    speed: 2,
    magic: 0,
    defense: 0,
    health: 3,
    mana: 0,
    attack: "Vampiric Stab",
    ability: 31,
    image: "Items/lifetapDagger.png",
    role: "Beginner sustain - Early game lifesteal weapon, teaches players about self-healing combat strategies.",
  },
  "Titan's Crown": {
    slot: "Helmet",
    rarity: "Mythical",
    strength: 6,
    speed: 1,
    magic: 2,
    defense: 8,
    health: 9,
    mana: 15,
    attack: "Giant's Wrath",
    ability: 44,
    image: "Items/titanCrown.png",
    role: "Boss destroyer - Reaper ability on headpiece for maximum HP damage, dominates high-health encounters.",
  },
  "Frostbite Pendant": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 2,
    magic: 5,
    defense: 1,
    health: 2,
    mana: 20,
    attack: "Ice Shard",
    ability: 35,
    image: "Items/frostbitePendant.png",
    role: "Chill applicator - Affordable freeze utility, enables crowd control for budget mage builds.",
  },
  "Warmage Robes": {
    slot: "Chest",
    rarity: "Rare",
    strength: 1,
    speed: 2,
    magic: 6,
    defense: 4,
    health: 4,
    mana: 35,
    attack: "none",
    ability: 20,
    image: "Items/warmageRobes.png",
    role: "Battle mage core - Balanced magic and defense for spellcasters in close combat, versatile caster armor.",
  },
  "Shadowstep Sandals": {
    slot: "Boots",
    rarity: "Epic",
    strength: 2,
    speed: 9,
    magic: 1,
    defense: 2,
    health: 3,
    mana: 15,
    attack: "none",
    ability: 30,
    image: "Items/shadowstepSandals.png",
    role: "Stealth speedster - Maximum mobility with ethereal dodge, perfect for hit-and-run assassin playstyles.",
  },
  "Soulbound Grimoire": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 0,
    speed: 4,
    magic: 12,
    defense: 2,
    health: 4,
    mana: 40,
    attack: "Soul Spell",
    ability: 33,
    image: "Items/soulboundGrimoire.png",
    role: "Mana regeneration carry - Arcane Surge on weapon for sustained spell-slinging, enables infinite casting strategies.",
  },
  "Colossus Plating": {
    slot: "Chest",
    rarity: "Artifact",
    strength: 5,
    speed: -2,
    magic: 3,
    defense: 12,
    health: 12,
    mana: 20,
    attack: "none",
    ability: 48,
    image: "Items/colossusPlating.png",
    role: "Ultimate tank - Maximum defense with protective aura, the pinnacle of team-defensive armor for dual-player content.",
  },

  // NEW ITEMS BATCH 2 (Items 16-30 with new abilities)
  "Provoke Banner": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 2,
    speed: 0,
    magic: 0,
    defense: 6,
    health: 8,
    mana: 0,
    attack: "Challenge",
    ability: 54,
    image: "Items/provokeBanner.png",
    role: "Taunt tank - Forces enemies to target you, essential for protecting fragile teammates in dual-player battles.",
  },
  "Vanguard's Oath": {
    slot: "Chest",
    rarity: "Epic",
    strength: 3,
    speed: -1,
    magic: 1,
    defense: 9,
    health: 10,
    mana: 10,
    attack: "none",
    ability: 54,
    image: "Items/vanguardOath.png",
    role: "Aggro protector - Combines high defense with taunt, the ultimate tank armor for drawing fire.",
  },
  "Crescendo Blade": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 8,
    speed: 5,
    magic: 0,
    defense: 2,
    health: 4,
    mana: 10,
    attack: "Rising Power",
    ability: 27,
    image: "Items/crescendoBlade.png",
    role: "Scaling striker - Gains permanent stat bonuses per kill, becomes unstoppable in long campaigns.",
  },
  "Rallying Horn": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 1,
    speed: 2,
    magic: 4,
    defense: 3,
    health: 5,
    mana: 25,
    attack: "Inspiring Call",
    ability: 55,
    image: "Items/rallyingHorn.png",
    role: "Team buffer - Boosts all ally stats temporarily, perfect support tool for coordinated dual-player strategies.",
  },
  "Adaptive Circlet": {
    slot: "Helmet",
    rarity: "Mythical",
    strength: 4,
    speed: 4,
    magic: 4,
    defense: 6,
    health: 7,
    mana: 30,
    attack: "Adaptation",
    ability: 56,
    image: "Items/adaptiveCirclet.png",
    role: "Dynamic scaling - Stats change based on enemy composition, ultimate versatility for unpredictable encounters.",
  },
  "Bonecrusher Maul": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 10,
    speed: 1,
    magic: 0,
    defense: 3,
    health: 6,
    mana: 0,
    attack: "Shatter Guard",
    ability: 57,
    image: "Items/bonecrusherMaul.png",
    role: "Armor breaker - Reduces enemy defense permanently, enables team to shred tanky enemies.",
  },
  "Martyr's Resolve": {
    slot: "Chest",
    rarity: "Rare",
    strength: 1,
    speed: 0,
    magic: 2,
    defense: 7,
    health: 9,
    mana: 15,
    attack: "none",
    ability: 58,
    image: "Items/martyrResolve.png",
    role: "Sacrifice support - Redirects ally damage to you, extreme team protection for dedicated tanks.",
  },
  "Momentum Greaves": {
    slot: "Leg",
    rarity: "Legendary",
    strength: 3,
    speed: 6,
    magic: 2,
    defense: 4,
    health: 5,
    mana: 15,
    attack: "none",
    ability: 59,
    image: "Items/momentumGreaves.png",
    role: "Speed scaler - Speed increases each turn in combat, dominates longer battles with escalating power.",
  },
  "Warden's Sigil": {
    slot: "Offhand",
    rarity: "Epic",
    strength: 0,
    speed: 2,
    magic: 5,
    defense: 6,
    health: 6,
    mana: 30,
    attack: "Purification",
    ability: 60,
    image: "Items/wardenSigil.png",
    role: "Debuff immunity - Protects team from status effects, critical for facing debuff-heavy enemies.",
  },
  "Champion's Greatsword": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 11,
    speed: 4,
    magic: 1,
    defense: 4,
    health: 7,
    mana: 15,
    attack: "Last Stand",
    ability: 61,
    image: "Items/championGreatsword.png",
    role: "Solo carry - Stronger when allies are down, clutch weapon for turning desperate situations into victories.",
  },
  "Lifebond Amulet": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 1,
    magic: 3,
    defense: 2,
    health: 6,
    mana: 20,
    attack: "Shared Fate",
    ability: 62,
    image: "Items/lifebondAmulet.png",
    role: "HP sharing - Links health pools with ally, spreads damage for balanced survival.",
  },
  "Tactician's Visor": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 1,
    speed: 3,
    magic: 5,
    defense: 3,
    health: 4,
    mana: 25,
    attack: "Analyze",
    ability: 63,
    image: "Items/tacticianVisor.png",
    role: "Strategic support - Reveals enemy stats and grants team coordination bonus for informed combat decisions.",
  },
  "Worldshaper Staff": {
    slot: "Weapon",
    rarity: "Artifact",
    strength: 2,
    speed: 3,
    magic: 13,
    defense: 5,
    health: 6,
    mana: 50,
    attack: "Terraform",
    ability: 64,
    image: "Items/worldshaperStaff.png",
    role: "Environmental control - Alters battlefield conditions favoring your team, ultimate support weapon.",
  },
  "Berserker's Tooth": {
    slot: "Offhand",
    rarity: "Common",
    strength: 3,
    speed: 1,
    magic: 0,
    defense: 0,
    health: 2,
    mana: 0,
    attack: "Savage Bite",
    ability: 22,
    image: "Items/berserkerTooth.png",
    role: "Budget fury - Cheap low-HP damage boost, teaches players risk-reward mechanics early.",
  },
  "Unity Mantle": {
    slot: "Chest",
    rarity: "Legendary",
    strength: 4,
    speed: 3,
    magic: 4,
    defense: 7,
    health: 8,
    mana: 30,
    attack: "none",
    ability: 65,
    image: "Items/unityMantle.png",
    role: "Team scaler - Gets stronger with more active allies, ultimate dual-player cooperative armor.",
  },

  // ========================================
  // SET 4 ITEMS - Advanced Mechanics
  // ========================================

  "Combo Gauntlet": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 4,
    speed: 5,
    magic: 1,
    defense: 2,
    health: 3,
    mana: 15,
    attack: "Strike Chain",
    ability: 66,
    image: "Items/comboGauntlet.png",
    role: "Combo builder - Each consecutive hit increases damage exponentially, rewards aggressive sustained combat.",
  },
  "Siphon Dagger": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 7,
    speed: 6,
    magic: 2,
    defense: 1,
    health: 3,
    mana: 20,
    attack: "Stat Steal",
    ability: 67,
    image: "Items/siphonDagger.png",
    role: "Stat thief - Steals enemy stats on hit, weakening foes while empowering yourself for strategic advantage.",
  },
  "Resurrection Tome": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 1,
    speed: 2,
    magic: 11,
    defense: 3,
    health: 5,
    mana: 45,
    attack: "Revive Ally",
    ability: 68,
    image: "Items/resurrectionTome.png",
    role: "Ally revival - Brings fallen teammates back to life, ultimate support weapon for desperate situations.",
  },
  "Mirror Plate": {
    slot: "Chest",
    rarity: "Mythical",
    strength: 2,
    speed: 0,
    magic: 6,
    defense: 10,
    health: 8,
    mana: 25,
    attack: "none",
    ability: 69,
    image: "Items/mirrorPlate.png",
    role: "Damage mirror - Reflects a percentage of all damage taken back to attackers, passive retaliation tank.",
  },
  "Critical Edge": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 8,
    speed: 5,
    magic: 0,
    skill: 10,
    defense: 1,
    health: 3,
    mana: 10,
    attack: "Precision Cut",
    ability: 70,
    image: "Items/criticalEdge.png",
    role: "Crit scaler - Critical hits increase crit chance, snowballs into guaranteed crits with sustained offense.",
  },
  "Hasty Boots": {
    slot: "Boots",
    rarity: "Uncommon",
    strength: 1,
    speed: 6,
    magic: 1,
    defense: 1,
    health: 2,
    mana: 10,
    attack: "none",
    ability: 71,
    image: "Items/hastyBoots.png",
    role: "Cooldown reducer - Reduces ability cooldowns with each action, enables rapid skill spam strategies.",
  },
  "Elemental Orb": {
    slot: "Offhand",
    rarity: "Epic",
    strength: 1,
    speed: 3,
    magic: 9,
    defense: 3,
    health: 4,
    mana: 35,
    attack: "Tri-Element",
    ability: 72,
    image: "Items/elementalOrb.png",
    role: "Multi-element caster - Attacks deal fire, ice, and lightning simultaneously, triple status application.",
  },
  "Blood Price": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 12,
    speed: 5,
    magic: 3,
    defense: 0,
    health: 2,
    mana: 20,
    attack: "Sacrifice Strike",
    ability: 73,
    image: "Items/bloodPrice.png",
    role: "HP sacrifice - Converts your HP into devastating damage, high-risk extreme burst for clutch moments.",
  },
  "Guardian Angel": {
    slot: "Chest",
    rarity: "Artifact",
    strength: 3,
    speed: 2,
    magic: 7,
    defense: 9,
    health: 10,
    mana: 30,
    attack: "none",
    ability: 74,
    image: "Items/guardianAngel.png",
    role: "Auto-revive - Automatically resurrects you and heals allies on death, ultimate safety net for team survival.",
  },
  "Poison Fang": {
    slot: "Weapon",
    rarity: "Common",
    strength: 3,
    speed: 3,
    magic: 1,
    defense: 0,
    health: 2,
    mana: 8,
    attack: "Venom Bite",
    ability: 75,
    image: "Items/poisonFang.png",
    role: "DoT starter - Applies stacking poison damage, affordable damage-over-time for early game grinding.",
  },
  "Overcharge Core": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 2,
    speed: 4,
    magic: 10,
    defense: 2,
    health: 4,
    mana: 40,
    attack: "Power Surge",
    ability: 76,
    image: "Items/overchargeCore.png",
    role: "Mana converter - Excess mana converts to damage, rewards high mana builds with explosive power.",
  },
  "Cursed Armor": {
    slot: "Chest",
    rarity: "Epic",
    strength: 6,
    speed: -1,
    magic: 4,
    defense: 8,
    health: 7,
    mana: 15,
    attack: "none",
    ability: 77,
    image: "Items/cursedArmor.png",
    role: "Curse transfer - Transfers your debuffs to enemies on hit, turns weaknesses into offensive weapons.",
  },
  "Sniper Scope": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 5,
    speed: 4,
    magic: 2,
    skill: 11,
    defense: 2,
    health: 3,
    mana: 15,
    attack: "Headshot",
    ability: 78,
    image: "Items/sniperScope.png",
    role: "Precision striker - Ignores enemy defense on crits, perfect for bursting through tanky targets.",
  },
  "Summoner Staff": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 2,
    speed: 3,
    magic: 12,
    defense: 3,
    health: 5,
    mana: 50,
    attack: "Conjure Ally",
    ability: 79,
    image: "Items/summonerStaff.png",
    role: "Pet summoner - Creates temporary minions to fight alongside you, army-building spellcaster weapon.",
  },
  "Leech Crown": {
    slot: "Helmet",
    rarity: "Uncommon",
    strength: 1,
    speed: 2,
    magic: 4,
    defense: 3,
    health: 4,
    mana: 20,
    attack: "Drain Aura",
    ability: 80,
    image: "Items/leechCrown.png",
    role: "Passive leech - Constantly drains small amounts from all enemies, sustained healing for patient players.",
  },
  "Berserker Ring": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 7,
    speed: 2,
    magic: 0,
    defense: 0,
    health: 3,
    mana: 5,
    attack: "Rage Strike",
    ability: 81,
    image: "Items/berserkerRing.png",
    role: "Missing HP scaler - Damage scales with missing HP exponentially, extreme glass cannon for last stands.",
  },
  "Temporal Blade": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 9,
    speed: 7,
    magic: 3,
    defense: 2,
    health: 4,
    mana: 25,
    attack: "Rewind Strike",
    ability: 82,
    image: "Items/temporalBlade.png",
    role: "Turn rewind - Undoes enemy turns on crit, time manipulation for controlling battlefield momentum.",
  },
  "Fortified Boots": {
    slot: "Boots",
    rarity: "Common",
    strength: 1,
    speed: 3,
    magic: 0,
    defense: 3,
    health: 4,
    mana: 0,
    attack: "none",
    ability: 83,
    image: "Items/fortifiedBoots.png",
    role: "Defense scaler - Defense increases with each hit taken, grows tankier throughout extended battles.",
  },
  "Soul Shackles": {
    slot: "Leg",
    rarity: "Epic",
    strength: 4,
    speed: 1,
    magic: 7,
    defense: 5,
    health: 6,
    mana: 30,
    attack: "none",
    ability: 84,
    image: "Items/soulShackles.png",
    role: "Enemy bind - Prevents enemy abilities and reduces their stats, control-focused debuffer equipment.",
  },
  "Dual Revolvers": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 10,
    speed: 8,
    magic: 1,
    skill: 14,
    defense: 1,
    health: 3,
    mana: 15,
    attack: "Double Shot",
    ability: 85,
    image: "Items/dualRevolvers.png",
    role: "Multi-strike - Attacks hit twice with decreasing damage, speed-based DPS weapon for rapid attackers.",
  },
  "Lifesteal Mask": {
    slot: "Helmet",
    rarity: "Epic",
    strength: 5,
    speed: 3,
    magic: 3,
    defense: 4,
    health: 5,
    mana: 20,
    attack: "Blood Drain",
    ability: 86,
    image: "Items/lifestealMask.png",
    role: "Overheal converter - Excess healing converts to shields, maximizes sustain value for lifesteal builds.",
  },
  "Mana Shield": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 0,
    speed: 2,
    magic: 6,
    defense: 5,
    health: 4,
    mana: 35,
    attack: "Arcane Ward",
    ability: 87,
    image: "Items/manaShield.png",
    role: "Mana tank - Uses mana as HP buffer, protects health for mages with deep mana pools.",
  },
  "Gravity Hammer": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 13,
    speed: 2,
    magic: 2,
    defense: 4,
    health: 7,
    mana: 20,
    attack: "Singularity Slam",
    ability: 88,
    image: "Items/gravityHammer.png",
    role: "AOE pull - Pulls all enemies together then hits them all, devastating group damage with crowd control.",
  },
  "Lucky Charm": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 2,
    speed: 3,
    magic: 2,
    defense: 1,
    health: 3,
    mana: 15,
    attack: "Fortune Strike",
    ability: 89,
    image: "Items/luckyCharm.png",
    role: "Luck amplifier - Increases all proc chances and crit rates, enhances RNG-based builds significantly.",
  },
  "Void Greaves": {
    slot: "Leg",
    rarity: "Legendary",
    strength: 3,
    speed: 5,
    magic: 6,
    defense: 6,
    health: 5,
    mana: 25,
    attack: "none",
    ability: 90,
    image: "Items/voidGreaves.png",
    role: "Enemy debuff - Enemies near you lose stats passively, zone control for dominating small areas.",
  },
  "Revenge Blade": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 9,
    speed: 4,
    magic: 1,
    defense: 2,
    health: 4,
    mana: 15,
    attack: "Retribution",
    ability: 91,
    image: "Items/revengeBlade.png",
    role: "Counter attacker - Stores damage taken and releases it, tactical weapon for absorbing then returning hits.",
  },
  "Harmony Amulet": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 3,
    speed: 3,
    magic: 3,
    defense: 3,
    health: 5,
    mana: 25,
    attack: "Balance",
    ability: 92,
    image: "Items/harmonyAmulet.png",
    role: "Stat equalizer - Balances your stats for consistent performance, removes weaknesses at cost of peaks.",
  },
  "Plague Doctor Mask": {
    slot: "Helmet",
    rarity: "Mythical",
    strength: 2,
    speed: 3,
    magic: 9,
    defense: 6,
    health: 7,
    mana: 35,
    attack: "Epidemic",
    ability: 93,
    image: "Items/plagueDoctorMask.png",
    role: "Status spreader - Your status effects spread to nearby enemies, turns single-target debuffs into AOE.",
  },
  "Titan Fist": {
    slot: "Weapon",
    rarity: "Artifact",
    strength: 14,
    speed: 3,
    magic: 4,
    defense: 6,
    health: 10,
    mana: 25,
    attack: "Earthshaker",
    ability: 94,
    image: "Items/titanFist.png",
    role: "True damage - Deals pure HP damage ignoring all defenses, ultimate anti-tank weapon for boss fights.",
  },
  "Speed Force Boots": {
    slot: "Boots",
    rarity: "Artifact",
    strength: 3,
    speed: 12,
    magic: 3,
    defense: 4,
    health: 6,
    mana: 30,
    attack: "none",
    ability: 95,
    image: "Items/speedForceBoots.png",
    role: "Multi-action - Gain extra attacks based on speed stat, transforms speed into overwhelming action economy.",
  },

  // ========================================
  // SKILL-BASED RANGED WEAPONS
  // ========================================

  "Longbow": {
    slot: "Weapon",
    rarity: "Uncommon",
    strength: 2,
    speed: 3,
    magic: 0,
    skill: 8,
    defense: 0,
    health: 2,
    mana: 8,
    attack: "Arrow Shot",
    ability: 0,
    image: "Items/longbow.png",
    role: "Ranged starter - Basic bow with skill scaling, affordable entry into precision archery builds.",
  },
  "Marksman Rifle": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 3,
    speed: 4,
    magic: 1,
    skill: 12,
    defense: 1,
    health: 3,
    mana: 12,
    attack: "Rifle Shot",
    ability: 0,
    image: "Items/marksmanRifle.png",
    role: "Sharpshooter - High skill scaling rifle for consistent ranged damage output.",
  },
  "Compound Bow": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 4,
    speed: 5,
    magic: 0,
    skill: 15,
    defense: 1,
    health: 3,
    mana: 15,
    attack: "Power Shot",
    ability: 96,
    image: "Items/compoundBow.png",
    role: "Penetrator - Arrows pierce through enemy defenses, skill-based anti-tank archer weapon.",
  },
  "Hand Cannon": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 6,
    speed: 3,
    magic: 2,
    skill: 17,
    defense: 2,
    health: 4,
    mana: 18,
    attack: "Explosive Round",
    ability: 97,
    image: "Items/handCannon.png",
    role: "Heavy gunner - Massive damage per shot with knockback, slow but devastating firepower.",
  },
  "Assassin Crossbow": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 3,
    speed: 6,
    magic: 1,
    skill: 14,
    defense: 1,
    health: 3,
    mana: 14,
    attack: "Silent Bolt",
    ability: 98,
    image: "Items/assassinCrossbow.png",
    role: "Stealth striker - Critical hits from stealth deal massive bonus damage, assassin's ranged tool.",
  },
  "Ranger's Quiver": {
    slot: "Offhand",
    rarity: "Rare",
    strength: 1,
    speed: 4,
    magic: 0,
    skill: 10,
    defense: 2,
    health: 3,
    mana: 10,
    attack: "none",
    ability: 99,
    image: "Items/rangersQuiver.png",
    role: "Ammo supplier - Grants bonus attacks per turn based on skill, sustained DPS for archers.",
  },
  "Eagle Eye Goggles": {
    slot: "Helmet",
    rarity: "Epic",
    strength: 2,
    speed: 5,
    magic: 2,
    skill: 14,
    defense: 2,
    health: 4,
    mana: 16,
    attack: "none",
    ability: 100,
    image: "Items/eagleEyeGoggles.png",
    role: "Vision enhancer - Increases crit chance and reveals enemy weakpoints, ultimate precision headgear.",
  },
  "Phantom Bow": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 5,
    speed: 7,
    magic: 4,
    skill: 20,
    defense: 2,
    health: 5,
    mana: 25,
    attack: "Ghost Arrow",
    ability: 101,
    image: "Items/phantomBow.png",
    role: "Ethereal archer - Arrows phase through enemies hitting multiple targets, supernatural ranged weapon.",
  },
  "Sniper's Cloak": {
    slot: "Chest",
    rarity: "Legendary",
    strength: 2,
    speed: 6,
    magic: 3,
    skill: 13,
    defense: 5,
    health: 6,
    mana: 20,
    attack: "none",
    ability: 102,
    image: "Items/snipersCloak.png",
    role: "Stealth armor - First attack from full HP deals triple damage, ultimate ambush equipment.",
  },
  "Arcane Pistol": {
    slot: "Offhand",
    rarity: "Mythical",
    strength: 3,
    speed: 5,
    magic: 8,
    skill: 16,
    defense: 2,
    health: 4,
    mana: 30,
    attack: "Mana Bullet",
    ability: 103,
    image: "Items/arcanePistol.png",
    role: "Spellslinger - Converts mana into skill damage, hybrid magic-ranged offensive tool.",
  },
  
  // ========================================
  // RELICS - Special equipment from Horde Mode
  // ========================================
  "Heart of the Phoenix": {
    slot: "Relic",
    rarity: "Legendary",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 0,
    health: 15,
    mana: 0,
    attack: "none",
    ability: 104,
    image: "Items/phoenixHeart.png",
    role: "RELIC: Once per battle, automatically revive at 50% HP when defeated. Grants +15 max HP.",
    relicEffect: "reviveOnDeath",
  },
  "Bloodthirsty Fang": {
    slot: "Relic",
    rarity: "Epic",
    strength: 8,
    speed: 0,
    magic: 0,
    defense: 0,
    health: 0,
    mana: 0,
    attack: "none",
    ability: 105,
    image: "Items/bloodFang.png",
    role: "RELIC: Heal for 15% of damage dealt. Grants +8 Strength for aggressive sustain.",
    relicEffect: "lifesteal15",
  },
  "Amulet of Haste": {
    slot: "Relic",
    rarity: "Epic",
    strength: 0,
    speed: 12,
    magic: 0,
    defense: 0,
    health: 0,
    mana: 0,
    attack: "none",
    ability: 106,
    image: "Items/hasteAmulet.png",
    role: "RELIC: 20% chance to take an extra turn immediately. Grants +12 Speed for turn manipulation.",
    relicEffect: "extraTurnChance20",
  },
  "Mana Crystal": {
    slot: "Relic",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 6,
    defense: 0,
    health: 0,
    mana: 50,
    attack: "none",
    ability: 107,
    image: "Items/manaCrystal.png",
    role: "RELIC: Regenerate 10 mana at the start of each turn. Grants +6 Magic and +50 max mana.",
    relicEffect: "manaRegen10",
  },
  "Titan's Bulwark": {
    slot: "Relic",
    rarity: "Legendary",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 15,
    health: 10,
    mana: 0,
    attack: "none",
    ability: 108,
    image: "Items/titanBulwark.png",
    role: "RELIC: Reduce all incoming damage by 20%. Grants +15 Defense and +10 HP for ultimate tankiness.",
    relicEffect: "damageReduction20",
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
      gems: typeof GEMS !== 'undefined' ? GEMS : 0,
    };
    console.log('[SAVE] Saving game data. INVENTORY items:', payload.inventory.length);
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    console.log('[SAVE] Game data saved successfully');
  } catch (e) {
    console.error('Failed to save game data', e);
  }
}

function loadGameData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    
    // Check if we need to give starter sticks after a complete reset
    const needsStarters = localStorage.getItem('needsStarterSticks');
    if (needsStarters === 'true') {
      localStorage.removeItem('needsStarterSticks');
      
      // Give each party member a level 3 stick
      const memberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
      memberKeys.forEach(memberKey => {
        const starterStick = generateRandomItem(3, 'Base');
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
          starterStick.attack = stickTemplate.attack;
          starterStick.ability = stickTemplate.ability;
          starterStick.image = stickTemplate.image;
          starterStick.level = 3;
          starterStick.equipped = false;
          starterStick._uid = `starter_stick_${memberKey}_${Date.now()}`;
        }
        
        INVENTORY.push(starterStick);
        
        // Equip it to this party member
        if (PARTY_STATS[memberKey]) {
          PARTY_STATS[memberKey].MAINHAND = starterStick.name;
          starterStick.equipped = true;
          
          // Add the attack from the stick
          if (starterStick.attack && PARTY_ATTACKS[memberKey]) {
            const attackData = ATTACK_STATS[starterStick.attack];
            if (attackData) {
              const attackObj = {
                id: attackCounter++,
                sourceUid: starterStick._uid,
                name: starterStick.attack,
                itemName: starterStick.name,
                strMultiplier: attackData.strMultiplier || 0,
                magicMultiplier: attackData.magicMultiplier || 0,
                sklMultiplier: attackData.skillMultiplier || 0,
                status: attackData.status || 'none',
                manaCost: attackData.manaCost || 0,
                cooldown: attackData.cooldown || 0,
                requiresAmmo: attackData.requiresAmmo || false,
              };
              PARTY_ATTACKS[memberKey].ATTACK_INVENTORY.push(attackObj);
              PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED.add(attackObj.id);
            }
          }
        }
      });
      
      // Update stats and save
      if (typeof updateStats === 'function') updateStats();
      saveGameData();
      console.log('Gave starter sticks after complete reset');
      return; // Don't load old data
    }
    
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
      
      // Load gems
      if (typeof payload.gems === 'number') {
        GEMS = payload.gems;
      } else {
        GEMS = 0;
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
          sklMultiplier: 0,
          status: 'none',
          manaCost: 0, // Free basic attack
        };
        PARTY_ATTACKS[k].ATTACK_INVENTORY.push(punchAttack);
        PARTY_ATTACKS[k].ATTACK_EQUIPPED.add(punchAttack.id);
        
        // Give everyone the "Rest" attack to restore mana
        const restAttack = {
          id: attackCounter++,
          sourceUid: null,
          name: 'Rest',
          itemName: 'Rest',
          strMultiplier: 0,
          magicMultiplier: 0,
          sklMultiplier: 0,
          status: 'none',
          manaCost: 0,
          isRest: true, // Special flag for rest action
        };
        PARTY_ATTACKS[k].ATTACK_INVENTORY.push(restAttack);
        PARTY_ATTACKS[k].ATTACK_EQUIPPED.add(restAttack.id);
      }
    }
    
    // Give a level 3 stick as starter item to each party member
    const memberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
    memberKeys.forEach(memberKey => {
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
        starterStick.equipped = false; // Will be equipped below
        starterStick._uid = `starter_stick_${memberKey}_${Date.now()}`;
      }
      
      // Add to inventory
      INVENTORY.push(starterStick);
      
      // Equip it to this party member
      if (PARTY_STATS[memberKey]) {
        PARTY_STATS[memberKey].MAINHAND = starterStick.name;
        starterStick.equipped = true;
        
        // Add the attack from the stick
        if (starterStick.attack && PARTY_ATTACKS[memberKey]) {
          const attackData = ATTACK_STATS[starterStick.attack];
          if (attackData) {
            const attackObj = {
              id: attackCounter++,
              sourceUid: starterStick._uid,
              name: starterStick.attack,
              itemName: starterStick.name,
              strMultiplier: attackData.strMultiplier || 0,
              magicMultiplier: attackData.magicMultiplier || 0,
              sklMultiplier: attackData.skillMultiplier || 0,
              status: attackData.status || 'none',
              manaCost: attackData.manaCost || 0,
              cooldown: attackData.cooldown || 0,
              requiresAmmo: attackData.requiresAmmo || false,
            };
            PARTY_ATTACKS[memberKey].ATTACK_INVENTORY.push(attackObj);
            PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED.add(attackObj.id);
          }
        }
      }
    });
    
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
  'skull': {
    health: 15,
    strength:2,
    magic:0,
    speed:3,
    defense: 1.3,
    mana:100,
    hBars:1,
    image:"Enemies/skull.png",
    tier:1,
    type: "Undead",
    role: "Early threat - Low health but decent speed, teaches players basic combat mechanics and attack timing.",
    attacks: ['Bone Toss', 'Rattling Strike', 'Death Rattle']
  },
  'slime': {
    health: 22,
    strength:2.3,
    magic:0,
    speed:2,
    defense: 1.6,
    mana:100,
    hBars:1,
    image:"Enemies/slime.png",
    tier:2,
    type: "Aberration",
    role: "Tanky starter - Higher HP and defense than skulls, introduces the need for sustained damage.",
    attacks: ['Acid Splash', 'Engulf', 'Split Attack']
  },
  'alien': {
    health: 19,
    strength:0,
    magic:3.9,
    speed:3.5,
    defense: 2,
    mana:180,
    hBars:1,
    image:"Enemies/alien.png",
    tier:3,
    type: "Aberration",
    specialEffect: "Alien Fire: Applies burn status on attack",
    attacks: ['Laser Beam', 'Alien Fire', 'Plasma Overload', 'Energy Shield']
  },
  'cursedKnight': {
    health: 29,
    strength:3.9,
    magic:0,
    speed:4,
    defense: 5.9,
    mana:120,
    hBars:1,
    image:"Enemies/cursedKnight.png",
    tier:4,
    type: "Undead",
    specialEffect: "Cursed Blade: Applies grim status on attack (2% max HP damage per turn)",
    attacks: ['Dark Slash', 'Cursed Blade', 'Shadow Strike']
  },
  'Shadow': {
    health: 33,
    strength:2.6,
    magic:2,
    speed:12,
    defense: 3.9,
    mana:150,
    hBars:1,
    image:"Enemies/shadow.png",
    tier:5,
    type: "Aberration",
    role: "Speed demon - Extremely fast enemy that attacks frequently, tests player defense and speed builds.",
    attacks: ['Shadow Strike Boss', 'Void Step', 'Dark Pulse', 'Shadow Clone', 'Umbral Assault']
  },
  'dragon': {
    health: 45,
    strength:3.9,
    magic:4.6,
    speed:5,
    defense: 5.9,
    mana:220,
    hBars:1,
    image:"Enemies/dragon.png",
    tier:5,
    type: "Beast",
    specialEffect: "BOSS: Dragon's Inferno - All attacks apply burn status (3% max HP damage per turn)",
    attackStatus: "burn",
    attacks: ['Claw Swipe', 'Dragon\'s Inferno', 'Flame Breath', 'Draconic Fury', 'Scales of Fire', 'Inferno Nova']
  },
  'corspe': {
    health: 17,
    strength:2.3,
    magic:0,
    speed:2,
    defense: 1,
    mana:100,
    hBars:1,
    image:"Enemies/corspe.png",
    tier:1,
    type: "Undead",
    specialEffect: "Undead: Slow shambling corpse",
    attacks: ['Shambling Swipe', 'Infected Bite']
  },
  'crawler': {
    health: 24,
    strength:3.3,
    magic:0,
    speed:1.5,
    defense: 2.6,
    mana:110,
    hBars:1,
    image:"Enemies/crawler.png",
    tier:2,
    type: "Undead",
    specialEffect: "Venomous Bite: Applies bleed status on attack + Two Lives (slow/tanky then fast/fragile)",
    secondForm: {
      health: 8,
      strength:3.3,
      magic:0,
      speed:12,
      defense: 0.7
    },
    attacks: ['Frenzy Slash', 'Venomous Bite', 'Death Throes']
  },
  'frozenCorspe': {
    health: 25,
    strength:2,
    magic:2.6,
    speed:2,
    defense: 1.6,
    mana:160,
    hBars:1,
    image:"Enemies/frozenCorspe.png",
    tier:3,
    type: "Undead",
    specialEffect: "Frozen Touch: Applies chill status on attack",
    attackStatus: "chill",
    attacks: ['Frozen Touch', 'Ice Spike', 'Frostbite', 'Permafrost']
  },
  'necromancer': {
    health: 27,
    strength:0,
    magic:5.2,
    speed:3,
    defense: 4.2,
    mana:240,
    hBars:1,
    image:"Enemies/necromancer.png",
    tier:4,
    type: "Mage Guild",
    specialEffect: "Resurrection: While alive, dead allies resurrect as zombies",
    attacks: ['Death Bolt', 'Resurrection', 'Life Drain', 'Curse of Undeath', 'Bone Shield']
  },
  'mutant': {
    health: 44,
    strength:4.6,
    magic:1,
    speed:7,
    defense: 3.3,
    mana:180,
    hBars:1,
    image:"Enemies/mutant.png",
    tier:5,
    type: "Undead",
    specialEffect: "BOSS: Mutated Strength - Fast and powerful zombie with high strength and speed",
    attacks: ['Mutated Strike', 'Toxic Bite', 'Regenerative Flesh', 'Berserk Mode', 'Plague Slam', 'Adaptive Evolution']
  },
  'Sapling': {
    health: 19,
    strength:0,
    magic:2.3,
    speed:1.5,
    defense: 1.3,
    mana:140,
    hBars:1,
    image:"Enemies/sapling.png",
    tier:1,
    type: "Nature",
    role: "Magic seedling - Low HP forest caster, introduces nature-themed enemies.",
    attacks: ['Thorn Shot', 'Photosynthesis', 'Root Whip']
  },
  'vineLasher': {
    health: 22,
    strength:3.3,
    magic:0,
    speed:4,
    defense: 1,
    mana:100,
    hBars:1,
    image:"Enemies/vineLasher.png",
    tier:2,
    type: "Nature",
    specialEffect: "Draining Vines: Applies leech status on attack (drains HP over time)",
    attacks: ['Vine Whip', 'Draining Thorns', 'Entangle']
  },
  'Treant': {
    health: 26,
    strength:3.3,
    magic:0,
    speed:2,
    defense: 3.9,
    mana:110,
    hBars:1,
    image:"Enemies/treant.png",
    tier:3,
    type: "Nature",
    specialEffect: "Rooted Defender: High defense, slow but steady",
    attacks: ['Root Smash', 'Bark Armor', 'Nature\'s Wrath', 'Regeneration']
  },
  'elderEnt': {
    health: 30,
    strength:0,
    magic:4.6,
    speed:3,
    defense: 2.9,
    mana:220,
    hBars:1,
    image:"Enemies/elderEnt.png",
    tier:4,
    type: "Nature",
    specialEffect: "Ancient Growth: Gains 10% bonus magic each turn (compounds) + high defense",
    attacks: ['Ancient Roots', 'Ancient Growth', 'Overgrowth', 'Forest\'s Blessing', 'Petrify']
  },
  'Worldroot': {
    health: 46,
    strength:2,
    magic:5.2,
    speed:6,
    defense: 5.2,
    mana:260,
    hBars:1,
    image:"Enemies/worldroot.png",
    tier:5,
    type: "Nature",
    specialEffect: "BOSS: Nature's Call - Summons Vine Lasher (15 lvls lower) every attack",
    attacks: ['Root Strike Boss', 'Nature\'s Call', 'Photosynthesis Boss', 'Worldroot Crush', 'Verdant Shield', 'Gaia\'s Wrath']
  },
  'Knight': {
    health: 20,
    strength:2.6,
    magic:0,
    speed:2,
    defense: 1.6,
    mana:100,
    hBars:1,
    image:"Enemies/knight.png",
    tier:1,
    type: "Army",
    attacks: ['Sword Slash', 'Shield Fortify', 'Overhead Chop']
  },
  'Archer': {
    health: 17,
    strength:2.6,
    magic:0,
    speed:3.5,
    defense: 1.3,
    mana:100,
    hBars:1,
    image:"Enemies/archer.png",
    tier:2,
    type: "Rogue",
    attacks: ['Piercing Shot', 'Rapid Fire', 'Quick Bite']
  },
  'Mage': {
    health: 19,
    strength:0,
    magic:3.9,
    speed:3.5,
    defense: 2,
    mana:200,
    hBars:1,
    image:"Enemies/mage.png",
    tier:3,
    type: "Mage Guild",
    specialEffect: "Arcane Curse: Applies random status effect (burn/bleed/chill) on attack",
    attacks: ['Magic Missile', 'Arcane Curse', 'Mana Shield', 'Spell Burst']
  },
  'kingsGuard': {
    health: 30,
    strength:3.9,
    magic:0,
    speed:3.5,
    defense: 3.6,
    mana:140,
    hBars:1,
    image:"Enemies/kingsGuard.png",
    tier:4,
    type: "Royal Guard",
    specialEffect: "Royal Protector: Balanced high-tier warrior",
    attacks: ['Royal Strike', 'Defensive Stance', 'Punish', 'Honor Bound']
  },
  'King': {
    health: 46,
    strength:5.2,
    magic:5.2,
    speed:3,
    defense: 5.2,
    mana:240,
    hBars:1,
    image:"Enemies/king.png",
    tier:5,
    type: "Royal Guard",
    specialEffect: "BOSS: Royal Command - Summons King's Guard (15 lvls lower) + gains 10% stats per guard alive",
    attacks: ['Royal Decree', 'Royal Command', 'Sovereign\'s Might', 'Execute', 'King\'s Blessing', 'Throne Shaker']
  },
  // ===== ARMY BRANCH ENEMIES =====
  'footman': {
    health: 18,
    strength:2.3,
    magic:0,
    speed:2,
    defense: 1.9,
    mana:100,
    hBars:1,
    image:"Enemies/footman.png",
    tier:1,
    type: "Army",
    role: "Basic infantry - Slightly tougher than knights, forms the backbone of the army.",
    attacks: ['Spear Thrust', 'Shield Wall', 'Formation Strike']
  },
  'swordsman': {
    health: 21,
    strength:3,
    magic:0,
    speed:2.5,
    defense: 1.6,
    mana:100,
    hBars:1,
    image:"Enemies/swordsman.png",
    tier:2,
    type: "Army",
    specialEffect: "Dual Wield: Attacks twice but with reduced damage on second hit",
    attacks: ['Double Slash', 'Whirlwind Strike', 'Blade Dance', 'Parry']
  },
  'captain': {
    health: 26,
    strength:3.9,
    magic:0,
    speed:3,
    defense: 2.9,
    mana:120,
    hBars:1,
    image:"Enemies/captain.png",
    tier:3,
    type: "Army",
    specialEffect: "Rally: Increases all ally attack damage by 10% while alive",
    attacks: ['Commanding Strike', 'Rally', 'Tactical Assault', 'Inspiring Presence', 'Battle Cry']
  },
  'royalKnight': {
    health: 29,
    strength:4.2,
    magic:0,
    speed:3,
    defense: 3.9,
    mana:130,
    hBars:1,
    image:"Enemies/royalKnight.png",
    tier:4,
    type: "Army",
    specialEffect: "Heavy Armor: Takes 20% reduced damage from physical attacks",
    attacks: ['Charging Strike', 'Shield Bash', 'Heavy Slam', 'Fortified Defense', 'Lance Rush', 'Noble Guard']
  },
  // ===== ROGUE BRANCH ENEMIES =====
  'bandit': {
    health: 16,
    strength:2.9,
    magic:0,
    speed:4,
    defense: 1.3,
    mana:100,
    hBars:1,
    image:"Enemies/bandit.png",
    tier:2,
    type: "Rogue",
    specialEffect: "First Strike: Guaranteed critical on first attack if faster than target",
    attacks: ['Quick Stab', 'Steal', 'Dirty Trick', 'Ambush']
  },
  'shadowBlade': {
    health: 22,
    strength:3.6,
    magic:1.6,
    speed:5,
    defense: 1.9,
    mana:150,
    hBars:1,
    image:"Enemies/shadowBlade.png",
    tier:3,
    type: "Rogue",
    specialEffect: "Shadow Step: 25% chance to dodge attacks and counter",
    attacks: ['Shadow Strike', 'Poison Blade', 'Vanish', 'Backstab', 'Smoke Bomb']
  },
  'masterThief': {
    health: 27,
    strength:4.2,
    magic:0,
    speed:6,
    defense: 2.3,
    mana:140,
    hBars:1,
    image:"Enemies/masterThief.png",
    tier:4,
    type: "Rogue",
    specialEffect: "Evasion Master: 30% dodge chance, steals player mana on hit",
    attacks: ['Precision Strike', 'Mana Siphon', 'Acrobatic Dodge', 'Vital Strike', 'Smoke Screen', 'Crippling Blow']
  },
  // ===== MAGE GUILD BRANCH ENEMIES =====
  'apprentice': {
    health: 17,
    strength:0,
    magic:3.6,
    speed:3,
    defense: 1.6,
    mana:180,
    hBars:1,
    image:"Enemies/apprentice.png",
    tier:3,
    type: "Mage Guild",
    specialEffect: "Mana Burn: Magic attacks cost enemy 5% less mana each turn",
    attacks: ['Arcane Bolt', 'Mana Shield', 'Fireball', 'Ice Shard', 'Lightning Spark']
  },
  'warlock': {
    health: 25,
    strength:0,
    magic:4.9,
    speed:3.5,
    defense: 2.6,
    mana:250,
    hBars:1,
    image:"Enemies/warlock.png",
    tier:4,
    type: "Mage Guild",
    specialEffect: "Dark Pact: Sacrifices 10% HP to deal 150% magic damage",
    attacks: ['Shadow Bolt', 'Dark Pact', 'Corruption Wave', 'Soul Leech', 'Curse of Weakness', 'Demonic Shield']
  },
  'archMage': {
    health: 33,
    strength:0,
    magic:6.5,
    speed:4,
    defense: 3.3,
    mana:300,
    hBars:1,
    image:"Enemies/archMage.png",
    tier:5,
    type: "Mage Guild",
    specialEffect: "BOSS: Spell Mastery - Can cast two spells per turn, immune to silence",
    attacks: ['Meteor Storm', 'Arcane Explosion', 'Time Warp', 'Mana Nova', 'Spell Reflect', 'Elemental Chaos', 'Arcane Ascension']
  },
  // ===== MERCENARY BRANCH ENEMIES =====
  'sellsword': {
    health: 24,
    strength:3.9,
    magic:0,
    speed:3.5,
    defense: 2.3,
    mana:110,
    hBars:1,
    image:"Enemies/sellsword.png",
    tier:3,
    type: "Mercenary",
    specialEffect: "Battle Scarred: Gains 5% strength for each attack taken",
    attacks: ['Mercenary Strike', 'Reckless Assault', 'Combat Experience', 'Veteran\'s Might', 'Paid in Blood']
  },
  'bountyHunter': {
    health: 28,
    strength:4.6,
    magic:0,
    speed:4.5,
    defense: 2.9,
    mana:130,
    hBars:1,
    image:"Enemies/bountyHunter.png",
    tier:4,
    type: "Mercenary",
    specialEffect: "Mark for Death: Applies vulnerable status (increases damage taken by 25%)",
    attacks: ['Crossbow Shot', 'Mark for Death', 'Chain Strike', 'Execution', 'Hunter\'s Mark', 'Trophy Claim']
  },
  'warlord': {
    health: 40,
    strength:5.9,
    magic:0,
    speed:3.5,
    defense: 4.6,
    mana:160,
    hBars:1,
    image:"Enemies/warlord.png",
    tier:5,
    type: "Mercenary",
    specialEffect: "BOSS: Blood Money - Heals for 15% of damage dealt, summons Sellswords",
    attacks: ['Warlord\'s Fury', 'Hired Blades', 'Devastating Blow', 'War Cry', 'Mercenary Command', 'Savage Cleave', 'Bloodlust']
  },
  // ===== CULTIST BRANCH ENEMIES =====
  'cultist': {
    health: 22,
    strength:1.6,
    magic:4.2,
    speed:3,
    defense: 2,
    mana:200,
    hBars:1,
    image:"Enemies/cultist.png",
    tier:3,
    type: "Cultist",
    specialEffect: "Dark Ritual: On death, heals all allies for 20% max HP",
    attacks: ['Void Bolt', 'Dark Ritual', 'Sacrificial Blade', 'Curse', 'Unholy Chant']
  },
  'darkPriest': {
    health: 26,
    strength:0,
    magic:5.2,
    speed:3.5,
    defense: 2.9,
    mana:260,
    hBars:1,
    image:"Enemies/darkPriest.png",
    tier:4,
    type: "Cultist",
    specialEffect: "Forbidden Knowledge: Applies random debuff each turn to player",
    attacks: ['Shadow Plague', 'Forbidden Knowledge', 'Pain Amplifier', 'Void Heal', 'Dark Blessing', 'Insanity']
  },
  'voidCaller': {
    health: 38,
    strength:2.6,
    magic:6.5,
    speed:4,
    defense: 3.9,
    mana:320,
    hBars:1,
    image:"Enemies/voidCaller.png",
    tier:5,
    type: "Cultist",
    specialEffect: "BOSS: Void Summon - Summons Void Touched minions, applies corruption",
    attacks: ['Void Tear', 'Summon Void', 'Reality Break', 'Corruption Burst', 'Eldritch Blast', 'Madness Wave', 'Dark Apotheosis']
  },
  // ===== PALADIN BRANCH ENEMIES =====
  'holyKnight': {
    health: 27,
    strength:4.2,
    magic:1.9,
    speed:2.5,
    defense: 3.6,
    mana:160,
    hBars:1,
    image:"Enemies/holyKnight.png",
    tier:3,
    type: "Paladin",
    specialEffect: "Divine Shield: 20% chance to block attacks completely",
    attacks: ['Holy Strike', 'Divine Shield', 'Smite', 'Righteous Fury', 'Blessing of Might']
  },
  'crusader': {
    health: 31,
    strength:4.9,
    magic:2.6,
    speed:3,
    defense: 4.2,
    mana:190,
    hBars:1,
    image:"Enemies/crusader.png",
    tier:4,
    type: "Paladin",
    specialEffect: "Zealous: Deals 30% more damage when below 50% HP",
    attacks: ['Crusader Strike', 'Holy Wrath', 'Divine Protection', 'Judgment', 'Consecration', 'Avenging Light']
  },
  'grandTemplar': {
    health: 42,
    strength:5.9,
    magic:4.2,
    speed:3.5,
    defense: 5.9,
    mana:240,
    hBars:1,
    image:"Enemies/grandTemplar.png",
    tier:5,
    type: "Paladin",
    specialEffect: "BOSS: Divine Aegis - Immune to status effects, heals allies each turn",
    attacks: ['Templar\'s Judgment', 'Divine Aegis', 'Holy Nova', 'Radiant Burst', 'Blessing of Light', 'Sanctified Ground', 'Divine Intervention']
  },
  // ===== ASSASSIN BRANCH ENEMIES =====
  'nightblade': {
    health: 23,
    strength:4.2,
    magic:1.3,
    speed:6,
    defense: 1.9,
    mana:140,
    hBars:1,
    image:"Enemies/nightblade.png",
    tier:3,
    type: "Assassin",
    specialEffect: "Bleed Master: All attacks apply bleed status (3% max HP per turn)",
    attackStatus: "bleed",
    attacks: ['Bleeding Edge', 'Shadow Meld', 'Arterial Strike', 'Silent Kill', 'Crimson Dance']
  },
  'deathMark': {
    health: 28,
    strength:5.2,
    magic:0,
    speed:7,
    defense: 2.3,
    mana:150,
    hBars:1,
    image:"Enemies/deathMark.png",
    tier:4,
    type: "Assassin",
    specialEffect: "Lethal Strike: Critical hits deal 200% damage and reduce healing by 50%",
    attacks: ['Death Mark', 'Assassinate', 'Throat Slit', 'Shadow Dance', 'Poison Vial', 'Garrote']
  },
  'shadowMaster': {
    health: 36,
    strength:6.5,
    magic:2,
    speed:8,
    defense: 3.3,
    mana:180,
    hBars:1,
    image:"Enemies/shadowMaster.png",
    tier:5,
    type: "Assassin",
    specialEffect: "BOSS: Perfect Assassination - First attack always crits, creates shadow clones",
    attacks: ['Fatal Strike', 'Shadow Clone', 'Dimensional Step', 'Execute Order', 'Phantom Blades', 'Death Sentence', 'Vanishing Act']
  },
  'wisp': {
    health: 14,
    strength:0,
    magic:2.6,
    speed:5,
    defense: 0.7,
    mana:150,
    hBars:1,
    image:"Enemies/wisp.png",
    tier:1,
    type: "Elemental",
    role: "Fast mage - Fragile magical spirit, high speed and magic damage.",
    attacks: ['Spirit Bolt', 'Flicker', 'Ethereal Dodge']
  },
  'ooze': {
    health: 26,
    strength:2.6,
    magic:1.3,
    speed:1.5,
    defense: 2.3,
    mana:140,
    hBars:1,
    image:"Enemies/ooze.png",
    tier:2,
    type: "Aberration",
    specialEffect: "Corrosive Body: Attacks reduce enemy defense temporarily",
    attacks: ['Acidic Strike', 'Dissolve', 'Split Form', 'Toxic Absorption']
  },
  'livingArmor': {
    health: 25,
    strength:3.6,
    magic:0,
    speed:2,
    defense: 3.9,
    mana:110,
    hBars:1,
    image:"Enemies/livingArmor.png",
    tier:2,
    type: "Construct",
    specialEffect: "Hollow Shell: Counter-attacks when blocking",
    attacks: ['Shield Slam', 'Counter Strike', 'Armored Defense', 'Reversal']
  },
  'swampBeast': {
    health: 23,
    strength:3.3,
    magic:1.6,
    speed:2.5,
    defense: 2,
    mana:150,
    hBars:1,
    image:"Enemies/swampBeast.png",
    tier:2,
    type: "Beast",
    role: "Marsh lurker - Poison-based attacks and regeneration.",
    attacks: ['Bog Bite', 'Swamp Gas', 'Murky Regeneration', 'Marsh Grasp']
  },
  'runeSentinel': {
    health: 28,
    strength:2.6,
    magic:4.2,
    speed:3,
    defense: 3.6,
    mana:220,
    hBars:1,
    image:"Enemies/runeSentinel.png",
    tier:3,
    type: "Construct",
    specialEffect: "Runic Power: Magic attacks empower next physical strike",
    attacks: ['Rune Strike', 'Ancient Script', 'Magic Amplify', 'Glyph Burst', 'Power Rune']
  },
  'spectralKnight': {
    health: 24,
    strength:3.6,
    magic:2.6,
    speed:4.5,
    defense: 2.3,
    mana:180,
    hBars:1,
    image:"Enemies/spectralKnight.png",
    tier:3,
    type: "Undead",
    specialEffect: "Phantom Form: Has chance to phase through attacks",
    attacks: ['Ghost Blade', 'Spectral Charge', 'Phase Shift', 'Haunting Strike', 'Spirit Guard']
  },
  'magmaBeast': {
    health: 30,
    strength:4.2,
    magic:2,
    speed:2.5,
    defense: 3.9,
    mana:160,
    hBars:1,
    image:"Enemies/magmaBeast.png",
    tier:3,
    type: "Elemental",
    specialEffect: "Molten Core: All attacks inflict burn, reflects damage when hit",
    attackStatus: "burn",
    attacks: ['Lava Claw', 'Eruption', 'Magma Shield', 'Volcanic Rage', 'Molten Skin']
  },
  'shadowReaper': {
    health: 29,
    strength:4.6,
    magic:3.3,
    speed:5,
    defense: 2.9,
    mana:200,
    hBars:1,
    image:"Enemies/shadowReaper.png",
    tier:4,
    type: "Undead",
    specialEffect: "Soul Harvest: Grows stronger with each enemy defeated in battle",
    attacks: ['Reaper Scythe', 'Dark Harvest', 'Soul Steal', 'Death\'s Door', 'Shadow Veil', 'Grim Presence']
  },
  'crystalBehemoth': {
    health: 36,
    strength:5.2,
    magic:2.6,
    speed:2,
    defense: 6.5,
    mana:170,
    hBars:1,
    image:"Enemies/crystalBehemoth.png",
    tier:4,
    type: "Construct",
    specialEffect: "Crystal Armor: Extremely high defense, magic attacks shatter and deal AoE damage",
    attacks: ['Crystal Slam', 'Gem Barrage', 'Diamond Skin', 'Prism Shatter', 'Refract', 'Hardened Core']
  },
  'timeLord': {
    health: 44,
    strength:4.6,
    magic:6.5,
    speed:7,
    defense: 5.2,
    mana:340,
    hBars:1,
    image:"Enemies/timeLord.png",
    tier:6,
    type: "Demi-God",
    specialEffect: "BOSS: Time Manipulation - Can rewind time to undo damage, manipulates turn order",
    attacks: ['Temporal Strike', 'Rewind', 'Time Stop', 'Chronos Blast', 'Future Sight', 'Paradox', 'Infinity Loop']
  },
  'gargoyle': {
    health: 18,
    strength:2.9,
    magic:0,
    speed:2.5,
    defense: 2,
    mana:100,
    hBars:1,
    image:"Enemies/gargoyle.png",
    tier:1,
    type: "Construct",
    role: "Stone guardian - High defense for tier 1, teaches defense breaking.",
    attacks: ['Stone Claw', 'Harden', 'Dive Bomb']
  },
  'mimic': {
    health: 21,
    strength:3,
    magic:0,
    speed:3,
    defense: 1.6,
    mana:100,
    hBars:1,
    image:"Enemies/mimic.png",
    tier:2,
    type: "Aberration",
    specialEffect: "Treasure Curse: Counter-attacks when hit, mimics player's last attack type",
    attacks: ['Snap Bite', 'Coin Toss', 'False Treasure', 'Mimic']
  },
  'banshee': {
    health: 20,
    strength:0,
    magic:4.2,
    speed:5.5,
    defense: 1.6,
    mana:200,
    hBars:1,
    image:"Enemies/banshee.png",
    tier:2,
    type: "Undead",
    specialEffect: "Wailing Curse: Magic attacks reduce enemy magic temporarily",
    attacks: ['Wail', 'Soul Scream', 'Death Mark', 'Haunting Cry']
  },
  'voidTouched': {
    health: 25,
    strength:3.6,
    magic:2.3,
    speed:4,
    defense: 2.6,
    mana:170,
    hBars:1,
    image:"Enemies/voidTouched.png",
    tier:2,
    type: "Aberration",
    role: "Corrupted warrior - Void-infused soldier with chaotic abilities.",
    attacks: ['Void Slash', 'Corruption', 'Dark Pulse', 'Unstable Form']
  },
  'stormElemental': {
    health: 26,
    strength:0,
    magic:4.6,
    speed:5,
    defense: 2.3,
    mana:230,
    hBars:1,
    image:"Enemies/stormElemental.png",
    tier:3,
    type: "Elemental",
    specialEffect: "Lightning Charged: Attacks have chance to stun, increases speed each turn",
    attacks: ['Lightning Bolt', 'Thunder Clap', 'Chain Lightning', 'Storm Surge', 'Static Shield']
  },
  'bloodGolem': {
    health: 32,
    strength:4.6,
    magic:0,
    speed:1.5,
    defense: 4.2,
    mana:120,
    hBars:1,
    image:"Enemies/bloodGolem.png",
    tier:3,
    type: "Construct",
    specialEffect: "Blood Absorption: Heals when dealing damage, grows stronger from bleeding enemies",
    attacks: ['Blood Strike', 'Crimson Drain', 'Coagulate', 'Hemorrhage', 'Blood Armor']
  },
  'frostWyrm': {
    health: 28,
    strength:4.2,
    magic:3.9,
    speed:4,
    defense: 3.6,
    mana:200,
    hBars:1,
    image:"Enemies/frostWyrm.png",
    tier:3,
    type: "Beast",
    specialEffect: "Frost Aura: All attacks apply chill, reduces enemy speed",
    attackStatus: "chill",
    attacks: ['Frost Bite', 'Ice Breath', 'Glacial Armor', 'Blizzard', 'Frozen Domain']
  },
  'plagueBringer': {
    health: 27,
    strength:3.3,
    magic:4.6,
    speed:3,
    defense: 3.3,
    mana:220,
    hBars:1,
    image:"Enemies/plagueBringer.png",
    tier:4,
    type: "Undead",
    specialEffect: "Pestilence: Applies multiple status effects, spreads debuffs to all enemies",
    attacks: ['Plague Strike', 'Disease Cloud', 'Festering Wound', 'Epidemic', 'Rot', 'Contagion']
  },
  'voidKraken': {
    health: 34,
    strength:5.2,
    magic:3.9,
    speed:3.5,
    defense: 4.6,
    mana:210,
    hBars:1,
    image:"Enemies/voidKraken.png",
    tier:4,
    type: "Aquatic",
    specialEffect: "Tentacle Fury: Attacks twice per turn, can grab and restrict player actions",
    attacks: ['Tentacle Slam', 'Ink Cloud', 'Crushing Grip', 'Void Pull', 'Deep Terror', 'Maelstrom']
  },
  'ancientLich': {
    health: 40,
    strength:2,
    magic:6.5,
    speed:4,
    defense: 4.6,
    mana:300,
    hBars:1,
    image:"Enemies/ancientLich.png",
    tier:5,
    type: "Undead",
    specialEffect: "BOSS: Phylactery - Resurrects once per battle, summons skeleton minions",
    attacks: ['Death Coil', 'Necromantic Power', 'Soul Shackle', 'Lich Form', 'Army of the Dead', 'Eternal Curse', 'Phylactery Shield']
  },
  'piranha': {
    health: 19,
    strength:3.9,
    magic:0,
    speed:4,
    defense: 1.3,
    mana:100,
    hBars:1,
    image:"Enemies/piranha.png",
    tier:2,
    type: "Aquatic",
    specialEffect: "Death Bite: Fast first strike, performs one final attack when defeated",
    attacks: ['Quick Bite', 'Feeding Frenzy', 'Death Bite']
  },
  'coralMonster': {
    health: 24,
    strength:3.9,
    magic:1,
    speed:2,
    defense: 3.6,
    mana:120,
    hBars:1,
    image:"Enemies/coralMonster.png",
    tier:3,
    type: "Aquatic",
    specialEffect: "Coral Armor: Big tanky enemy with high defense and coral-enhanced durability",
    attacks: ['Coral Punch', 'Calcified Shell', 'Reef Slam', 'Coral Growth']
  },
  'shark': {
    health: 28,
    strength:4.6,
    magic:0,
    speed:5,
    defense: 3.3,
    mana:140,
    hBars:1,
    image:"Enemies/shark.png",
    tier:4,
    type: "Aquatic",
    specialEffect: "Blood Frenzy: Gains 15% strength for each bleeding enemy + all attacks apply bleed",
    attacks: ['Bite', 'Blood Frenzy', 'Savage Maul', 'Feeding Time', 'Bloodthirst']
  },
  'divineKing': {
    health: 287,
    strength:11.7,
    magic:11.7,
    speed:4,
    defense: 9.8,
    mana:500,
    hBars:1,
    image:"Enemies/divineKing.png",
    tier:6,
    type: "Royal Guard",
    specialEffect: "FINAL BOSS Phase 1: Divine power incarnate",
    attacks: ['Divine Smite', 'Holy Judgment', 'Divine Protection', 'Celestial Storm', 'Righteous Fury', 'Resurrection Divine', 'Heaven\'s Light', 'God\'s Wrath']
  },
  'demonKing': {
    health: 492,
    strength:16.3,
    magic:16.3,
    speed:5,
    defense: 10.4,
    mana:600,
    hBars:1,
    image:"Enemies/demonKing.png",
    tier:6,
    type: "Royal Guard",
    specialEffect: "FINAL BOSS Phase 2: Demonic transformation - ultimate power",
    attacks: ['Demon Claw', 'Hellfire', 'Demonic Rage', 'Apocalypse Boss', 'Soul Rend', 'Infernal Shield', 'Damnation']
  },
  'lightning_shark': {
    health: 328,
    strength:13,
    magic:13,
    speed:6,
    defense: 7.8,
    mana:450,
    hBars:1,
    image:"Enemies/lightningShark.png",
    tier:6,
    type: "Aquatic",
    specialEffect: "LEGENDARY BOSS: Lightning Shock - Gives player lightning status (ignores next attack, 2 turn cooldown)",
    attacks: ['Electric Bite', 'Lightning Shock', 'Thunder Storm', 'Blood Hunt', 'Voltaic Shield', 'Feeding Frenzy Boss', 'Lightning Speed', 'Megavolt']
  },
  'dino': {
    health: 74,
    strength:7.8,
    magic:3.3,
    speed:8,
    defense: 10.4,
    mana:180,
    hBars:1,
    image:"Enemies/dino.png",
    tier:'Chaos',
    type: "Beast",
    specialEffect: "CHAOS: Prehistoric Rampage - High defense and strength, charges with devastating force",
    attacks: ['Savage Maul', 'Bite', 'Blood Frenzy']
  },
  'flamelingSmall': {
    health: 48,
    strength:5.2,
    magic:7.8,
    speed:10,
    defense: 4.6,
    mana:250,
    hBars:1,
    image:"Enemies/flamelingSmall.png",
    tier:'Chaos',
    type: "Elemental",
    specialEffect: "CHAOS: Ember Spark - Fast and agile, applies burn on every attack",
    attacks: ['Thorn Shot', 'Photosynthesis']
  },
  'flamelingMedium': {
    health: 61,
    strength:6.5,
    magic:9.1,
    speed:7,
    defense: 6.5,
    mana:280,
    hBars:1,
    image:"Enemies/flamelingMedium.png",
    tier:'Chaos',
    type: "Elemental",
    specialEffect: "CHAOS: Flame Burst - Balanced fire elemental, burn damage scales with magic",
    attacks: ['Alien Fire', 'Laser Beam', 'Energy Shield']
  },
  'flamelingBig': {
    health: 84,
    strength:9.1,
    magic:11.7,
    speed:6,
    defense: 9.8,
    mana:320,
    hBars:2,
    image:"Enemies/flamelingBig.png",
    tier:'Chaos',
    type: "Elemental",
    specialEffect: "CHAOS: Inferno Titan - Massive flameling with two health bars, devastating fire magic",
    attacks: ['Alien Fire', 'Plasma Overload', 'Inferno Nova']
  },
  'sotrak': {
    health: 68,
    strength:9.8,
    magic:7.2,
    speed:11,
    defense: 7.2,
    mana:240,
    hBars:1,
    image:"Enemies/sotrak.png",
    tier:'Chaos',
    type: "Aberration",
    specialEffect: "CHAOS: Void Walker - Teleports and strikes with void energy, applies random status effects",
    attacks: ['Reality Warp', 'Void Step', 'Dark Pulse']
  },
  'monstruousFish': {
    health: 89,
    strength:10.4,
    magic:7.8,
    speed:10,
    defense: 11.1,
    mana:280,
    hBars:2,
    image:"Enemies/monstruousFish.png",
    tier:'Chaos',
    type: "Aquatic",
    specialEffect: "CHAOS: Abyssal Terror - Deadly ocean predator, gains power from bleeding enemies",
    attacks: ['Electric Bite', 'Savage Maul', 'Feeding Frenzy Boss', 'Megavolt']
  },
  'overseer': {
    health: 656,
    strength:19.5,
    magic:19.5,
    speed:8,
    defense: 21.5,
    mana:800,
    hBars:3,
    image:"Enemies/overseer.png",
    tier:7,
    type: "Demi-God",
    specialEffect: "ANCIENT BOSS: Omniscient Watcher - 3 phases with different attacks",
    attacks: ['Reality Warp', 'Omniscient Strike', 'Existence Erasure']
  }
};

// attack stats multipliers and status effects

const ATTACK_STATS = {
  // ==================== STRENGTH ATTACKS ====================
  // Pure strength attacks have NO mana cost but have cooldowns based on multiplier
  // Cooldown formula: 0 turns (≤1.0x), 1 turn (1.1-2.0x), 2 turns (2.1-3.0x), 3 turns (3.1-4.0x), 4 turns (4.0x+)
  
  "punch":           { strMultiplier: 0.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength" },
  "stap":            { strMultiplier: 1,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength" },
  "coral leech":     { strMultiplier: 1.1,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 1, group: "strength" },
  "Charge":          { strMultiplier:  1.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength" },
  "plunge":          { strMultiplier: 1.5,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength" },
  "Combo":           { strMultiplier: 2.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Grim slice":      { strMultiplier: 3,    magicMultiplier: 0,    status: "grim", manaCost: 0, cooldown: 3, group: "strength", guaranteedProc: true },
  "Quick Jab":       { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength" },
  "Reckless Swing":  { strMultiplier: 2.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength" },
  "Drain Strike":    { strMultiplier: 1.6,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 1, group: "strength" },
  "Ground Slam":     { strMultiplier: 2.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Decapitate":      { strMultiplier: 2.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 3, group: "strength" },
  "Blur":            { strMultiplier: 2.4,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength" },
  "Vampiric Stab":   { strMultiplier: 1.3,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 1, group: "strength" },
  "Giant's Wrath":   { strMultiplier: 2.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Challenge":       { strMultiplier: 1.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength" },
  "Rising Power":    { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Shatter Guard":   { strMultiplier: 2.4,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength" },
  "Savage Bite":     { strMultiplier: 1.4,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength" },
  "Strike Chain":    { strMultiplier: 1.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength" },
  "Sacrifice Strike":{ strMultiplier: 3.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength" },
  "Rage Strike":     { strMultiplier: 2.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Singularity Slam":{ strMultiplier: 3.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength" },
  "Retribution":     { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength" },
  "Earthshaker":     { strMultiplier: 4.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "strength" },
  "Last Stand":      { strMultiplier: 2.8,  magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 3, group: "strength" },
  "Divine Rend":     { strMultiplier: 3.2,  magicMultiplier: 0.5,  status: "bleed", manaCost: 5, cooldown: 3, group: "strength", guaranteedProc: true },
  
  // ==================== MAGIC ATTACKS ====================
  // Pure magic attacks cost mana based on multiplier (multiplier × 10)
  // No cooldowns for pure magic attacks
  
  "leaf impale":     { strMultiplier: 0,    magicMultiplier: 1,    status: "none", manaCost: 10, cooldown: 0, group: "magic" },
  "reflection":      { strMultiplier: 0,    magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 0, group: "magic" },
  "sea shield":      { strMultiplier: 0,    magicMultiplier: 1,    status: "none", manaCost: 10, cooldown: 0, group: "magic" },
  "Plasma Blast":    { strMultiplier: 0,    magicMultiplier: 1.4,  status: "none", manaCost: 14, cooldown: 0, group: "magic" },
  "shadow vortex":   { strMultiplier: 0,    magicMultiplier: 1.7,  status: "none", manaCost: 17, cooldown: 0, group: "magic" },
  "Arise":           { strMultiplier: 0,    magicMultiplier: 2,    status: "none", manaCost: 20, cooldown: 0, group: "magic" },
  "Rulers Authority":{ strMultiplier: 0,    magicMultiplier: 4,    status: "player buff", manaCost: 40, cooldown: 0, group: "magic" },
  "Arcane Bolt":     { strMultiplier: 0,    magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 0, group: "magic" },
  "Time Warp":       { strMultiplier: 0,    magicMultiplier: 1.8,  status: "chill", manaCost: 18, cooldown: 0, group: "magic" },
  "Psychic Blast":   { strMultiplier: 0,    magicMultiplier: 1.7,  status: "none", manaCost: 17, cooldown: 0, group: "magic" },
  "Void Surge":      { strMultiplier: 0,    magicMultiplier: 2.5,  status: "grim", manaCost: 25, cooldown: 0, group: "magic", guaranteedProc: true },
  "Supernova":       { strMultiplier: 0.5,  magicMultiplier: 3.0,  status: "burn", manaCost: 30, cooldown: 1, group: "magic", guaranteedProc: true },
  "Wisdom Beam":     { strMultiplier: 0,    magicMultiplier: 1.6,  status: "none", manaCost: 16, cooldown: 0, group: "magic" },
  "Chain Lightning": { strMultiplier: 0,    magicMultiplier: 1.8,  status: "burn", manaCost: 18, cooldown: 0, group: "magic" },
  "Ice Shard":       { strMultiplier: 0,    magicMultiplier: 1.4,  status: "chill", manaCost: 14, cooldown: 0, group: "magic" },
  "Soul Spell":      { strMultiplier: 0,    magicMultiplier: 2.2,  status: "random", manaCost: 22, cooldown: 0, group: "magic" },
  "Purification":    { strMultiplier: 0,    magicMultiplier: 1.3,  status: "none", manaCost: 13, cooldown: 0, group: "magic" },
  "Terraform":       { strMultiplier: 1.0,  magicMultiplier: 3.0,  status: "player buff", manaCost: 30, cooldown: 0, group: "magic" },
  "Revive Ally":     { strMultiplier: 0,    magicMultiplier: 2.5,  status: "player buff", manaCost: 25, cooldown: 0, group: "magic" },
  "Power Surge":     { strMultiplier: 0,    magicMultiplier: 2.8,  status: "none", manaCost: 28, cooldown: 0, group: "magic" },
  "Conjure Ally":    { strMultiplier: 0.5,  magicMultiplier: 1.8,  status: "player buff", manaCost: 18, cooldown: 1, group: "magic" },
  "Arcane Ward":     { strMultiplier: 0,    magicMultiplier: 1.2,  status: "player buff", manaCost: 12, cooldown: 0, group: "magic" },
  "Epidemic":        { strMultiplier: 0.6,  magicMultiplier: 2.3,  status: "poison", manaCost: 23, cooldown: 1, group: "magic", guaranteedProc: true },
  "Apocalypse":      { strMultiplier: 2.0,  magicMultiplier: 2.0,  status: "burn", manaCost: 60, cooldown: 2, aoe: true, group: "magic", guaranteedProc: true }, // AOE: 3 enemies × 2.0 mag = 6.0 effective
  
  // ==================== HYBRID ATTACKS (Strength + Magic) ====================
  // Attacks with both strength and magic have BOTH cooldown AND mana cost
  
  "poke":            { strMultiplier: 0.5,  magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 0, group: "hybrid" },
  "slap":            { strMultiplier: 0.45, magicMultiplier: 0.45, status: "none", manaCost: 5, cooldown: 0, group: "hybrid" },
  "Tree People":     { strMultiplier: 0.3,  magicMultiplier: 0.5,  status: "leech", manaCost: 5, cooldown: 0, group: "hybrid" },
  "Incenerate":      { strMultiplier: 1.4,  magicMultiplier: 1,    status: "burn", manaCost: 10, cooldown: 1, group: "hybrid", guaranteedProc: true },
  "skater slice":    { strMultiplier: 1.6,  magicMultiplier: 0.4,  status: "bleed", manaCost: 4, cooldown: 1, group: "hybrid" },
  "force strike":    { strMultiplier: 2.2,  magicMultiplier: 1.3,  status: "none", manaCost: 13, cooldown: 2, group: "hybrid" },
  "Thunder":         { strMultiplier: 1.8,  magicMultiplier: 1.8,  status: "burn", manaCost: 18, cooldown: 2, group: "hybrid", guaranteedProc: true },
  "spell infused":   { strMultiplier: 2,    magicMultiplier: 2.5,  status: "random", manaCost: 25, cooldown: 2, group: "hybrid" },
  "Shield Bash":     { strMultiplier: 1.3,  magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 1, group: "hybrid" },
  "Tidal Crash":     { strMultiplier: 1.2,  magicMultiplier: 1.8,  status: "chill", manaCost: 18, cooldown: 1, group: "hybrid" },
  "Reality Stone":   { strMultiplier: 1.5,  magicMultiplier: 2.2,  status: "random", manaCost: 22, cooldown: 2, group: "hybrid" },
  "Soul Harvest":    { strMultiplier: 2.6,  magicMultiplier: 1.0,  status: "grim", manaCost: 10, cooldown: 2, group: "hybrid" },
  "Adaptive Spell":  { strMultiplier: 1.0,  magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 0, group: "hybrid" },
  "Foresight":       { strMultiplier: 0.5,  magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 0, group: "hybrid" },
  "Death Mark":      { strMultiplier: 1.5,  magicMultiplier: 0.5,  status: "grim", manaCost: 5, cooldown: 1, group: "hybrid" },
  "Crystal Barrier": { strMultiplier: 0.8,  magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 0, group: "hybrid" },
  "Flame Rebirth":   { strMultiplier: 0.5,  magicMultiplier: 1.5,  status: "burn", manaCost: 15, cooldown: 0, group: "hybrid" },
  "Inspiring Call":  { strMultiplier: 0.5,  magicMultiplier: 1.0,  status: "player buff", manaCost: 10, cooldown: 0, group: "hybrid" },
  "Adaptation":      { strMultiplier: 1.2,  magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 1, group: "hybrid" },
  "Shared Fate":     { strMultiplier: 0.7,  magicMultiplier: 0.7,  status: "none", manaCost: 7, cooldown: 0, group: "hybrid" },
  "Analyze":         { strMultiplier: 0.5,  magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 0, group: "hybrid" },
  "Stat Steal":      { strMultiplier: 1.6,  magicMultiplier: 0.4,  status: "none", manaCost: 4, cooldown: 1, group: "hybrid" },
  "Tri-Element":     { strMultiplier: 0.3,  magicMultiplier: 2.0,  status: "random", manaCost: 20, cooldown: 0, group: "hybrid" },
  "Venom Bite":      { strMultiplier: 0.8,  magicMultiplier: 0.2,  status: "poison", manaCost: 2, cooldown: 0, group: "hybrid" },
  "Drain Aura":      { strMultiplier: 0.4,  magicMultiplier: 1.0,  status: "none", manaCost: 10, cooldown: 0, group: "hybrid" },
  "Rewind Strike":   { strMultiplier: 2.0,  magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 2, group: "hybrid" },
  "Blood Drain":     { strMultiplier: 1.3,  magicMultiplier: 0.7,  status: "none", manaCost: 7, cooldown: 1, group: "hybrid" },
  "Fortune Strike":  { strMultiplier: 1.1,  magicMultiplier: 0.6,  status: "none", manaCost: 6, cooldown: 1, group: "hybrid" },
  "Balance":         { strMultiplier: 1.0,  magicMultiplier: 1.0,  status: "none", manaCost: 10, cooldown: 0, group: "hybrid" },
  "Explosive Round": { strMultiplier: 1.0,  magicMultiplier: 0.3,  skillMultiplier: 0.15, status: "none", manaCost: 3, cooldown: 1, group: "skill", requiresAmmo: true },
  "Ghost Arrow":     { strMultiplier: 0.8,  magicMultiplier: 0.5,  skillMultiplier: 0.15, status: "none", manaCost: 5, cooldown: 1, group: "skill", requiresAmmo: true },
  "Mana Bullet":     { strMultiplier: 0.3,  magicMultiplier: 1.0,  skillMultiplier: 0.15, status: "none", manaCost: 12, cooldown: 0, group: "skill", requiresAmmo: true },
  
  // ==================== SKILL ATTACKS ====================
  // Skill attacks use MULTIPLICATIVE scaling: (STR×strMult + MAG×magMult) × (1 + SKILL×sklMult)
  // Flat multipliers capped at 1.5x max, skill provides multiplicative bonus
  // All skill attacks can crit, guns/bows require ammo
  
  "Chilled Cream":   { strMultiplier: 0,    magicMultiplier: 0.8,  skillMultiplier: 0.15, status: "chill", manaCost: 0, cooldown: 0, group: "skill", requiresAmmo: false },
  "Pure skill":      { strMultiplier: 1.2,  magicMultiplier: 0,    skillMultiplier: 0.15, status: "bleed", manaCost: 0, cooldown: 3, group: "skill", requiresAmmo: false },
  "Arrow Shot":      { strMultiplier: 0.6,  magicMultiplier: 0,    skillMultiplier: 0.15, status: "none", manaCost: 0, cooldown: 0, group: "skill", requiresAmmo: true },
  "Rifle Shot":      { strMultiplier: 0.7,  magicMultiplier: 0,    skillMultiplier: 0.17, status: "none", manaCost: 0, cooldown: 0, group: "skill", requiresAmmo: true },
  "Power Shot":      { strMultiplier: 0.8,  magicMultiplier: 0,    skillMultiplier: 0.15, status: "none", manaCost: 0, cooldown: 1, group: "skill", requiresAmmo: true },
  "Silent Bolt":     { strMultiplier: 0.5,  magicMultiplier: 0,    skillMultiplier: 0.18, status: "none", manaCost: 0, cooldown: 0, group: "skill", requiresAmmo: true },
  "Precision Cut":   { strMultiplier: 1.0,  magicMultiplier: 0,    skillMultiplier: 0.14, status: "none", manaCost: 0, cooldown: 2, group: "skill", requiresAmmo: false },
  "Headshot":        { strMultiplier: 0.8,  magicMultiplier: 0,    skillMultiplier: 0.15, status: "none", manaCost: 0, cooldown: 2, group: "skill", requiresAmmo: true },
  "Double Shot":     { strMultiplier: 0.9,  magicMultiplier: 0,    skillMultiplier: 0.15, status: "none", manaCost: 0, cooldown: 1, group: "skill", requiresAmmo: true },
  
  // ==================== UTILITY ATTACKS ====================
  // Utility attacks have minimal/no damage multipliers, no mana cost or cooldown
  // Used for buffs, healing, resting, etc.
  
  "enhance":         { strMultiplier: 0,    magicMultiplier: 0,    status: "player buff", manaCost: 0, cooldown: 0, group: "utility" },
  "Rest":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, isRest: true, group: "utility" },
  
  // ==================== ENEMY ATTACKS ====================
  // Tier 1 Enemy Attacks
  "Bone Toss":              { strMultiplier: 0.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🦴" },
  "Rattling Strike":        { strMultiplier: 1.2,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 1, group: "strength", emoji: "💀" },
  "Death Rattle":           { strMultiplier: 2.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", emoji: "☠️" },
  "Shambling Swipe":        { strMultiplier: 0.7,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🧟" },
  "Infected Bite":          { strMultiplier: 1.1,  magicMultiplier: 0,    status: "corruption", manaCost: 0, cooldown: 1, group: "strength", emoji: "🦠" },
  "Undead Grasp":           { strMultiplier: 1.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", heals: 0.25, emoji: "🫲" },
  "Thorn Shot":             { strMultiplier: 0,    magicMultiplier: 1.0,  status: "none", manaCost: 10, cooldown: 0, group: "magic", emoji: "🌵" },
  "Photosynthesis":         { strMultiplier: 0,    magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 0, group: "magic", heals: 1.0, emoji: "🌞" },
  "Root Whip":              { strMultiplier: 0.6,  magicMultiplier: 0.6,  status: "vulnerable", manaCost: 6, cooldown: 0, group: "hybrid", emoji: "🌿" },
  "Sword Slash":            { strMultiplier: 1.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "⚔️" },
  "Shield Fortify":         { strMultiplier: 1.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", fortifySelf: 0.2, emoji: "🛡️" },
  "Overhead Chop":          { strMultiplier: 1.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", emoji: "🪓" },
  
  // Tier 2 Enemy Attacks
  "Acid Splash":            { strMultiplier: 0,    magicMultiplier: 0.9,  status: "vulnerable", manaCost: 9, cooldown: 0, group: "magic", emoji: "🧪" },
  "Engulf":                 { strMultiplier: 0.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", heals: 0.15, emoji: "👅" },
  "Split Attack":           { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", fortifySelf: 0.2, emoji: "〰️" },
  "Venomous Bite":          { strMultiplier: 1.1,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "🦂" },
  "Leech Life":             { strMultiplier: 0.9,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 0, group: "strength", emoji: "🩸" },
  "Molt":                   { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", isTransform: true, emoji: "🦎" },
  "Frenzy Slash":           { strMultiplier: 1.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "😡" },
  "Death Throes":           { strMultiplier: 2.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", isOnDeath: true, emoji: "💥" },
  "Vine Whip":              { strMultiplier: 0.9,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🌱" },
  "Draining Thorns":        { strMultiplier: 1.2,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 1, group: "strength", emoji: "🥀" },
  "Entangle":               { strMultiplier: 1.5,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", applyLeech: true, emoji: "🪢" },
  "Piercing Shot":          { strMultiplier: 0,    magicMultiplier: 0,    skillMultiplier: 0.25, status: "vulnerable", manaCost: 0, cooldown: 1, group: "skill", requiresAmmo: true, emoji: "🏹" },
  "Rapid Fire":             { strMultiplier: 0,    magicMultiplier: 0,    skillMultiplier: 0.12, status: "none", manaCost: 0, cooldown: 2, group: "skill", requiresAmmo: true, hits: 3, emoji: "🎯" },
  "Quick Bite":             { strMultiplier: 1.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🦷" },
  "Feeding Frenzy":         { strMultiplier: 1.7,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", bleedBonus: 0.2, emoji: "🩸" },
  "Death Bite":             { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", isOnDeath: true, emoji: "💀" },
  
  // Tier 3 Enemy Attacks  
  "Laser Beam":             { strMultiplier: 0,    magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 0, group: "magic", emoji: "🔴" },
  "Alien Fire":             { strMultiplier: 0,    magicMultiplier: 1.5,  status: "burn", manaCost: 15, cooldown: 0, group: "magic", emoji: "👽" },
  "Plasma Overload":        { strMultiplier: 0,    magicMultiplier: 2.3,  status: "burn", manaCost: 23, cooldown: 1, group: "magic", applyVulnerable: true, emoji: "⚡" },
  "Energy Shield":          { strMultiplier: 0,    magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 0, group: "magic", fortifySelf: 0.5, emoji: "🛡️" },
  "Frozen Touch":           { strMultiplier: 0.8,  magicMultiplier: 0.8,  status: "chill", manaCost: 8, cooldown: 0, group: "hybrid", emoji: "❄️" },
  "Ice Spike":              { strMultiplier: 0,    magicMultiplier: 1.4,  status: "chill", manaCost: 14, cooldown: 0, group: "magic", emoji: "❄️" },
  "Frostbite":              { strMultiplier: 0,    magicMultiplier: 1.8,  status: "chill", manaCost: 18, cooldown: 1, group: "magic", applyVulnerable: true, emoji: "🧊" },
  "Permafrost":             { strMultiplier: 0,    magicMultiplier: 1.0,  status: "none", manaCost: 10, cooldown: 0, group: "magic", barrierSelf: true, emoji: "❄️" },
  "Root Smash":             { strMultiplier: 1.1,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🌳" },
  "Bark Armor":             { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", fortifySelf: 50, isPassive: true, emoji: "🛡️", description: "Passive: Gains 50 Fortify at the start of each turn" },
  "Nature's Wrath":         { strMultiplier: 1.8,  magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 2, group: "hybrid", emoji: "🍃" },
  "Regeneration":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", healPercent: 0.05, isPassive: true, emoji: "💚", description: "Passive: Heals 5% of max HP at the start of each turn" },
  "Magic Missile":          { strMultiplier: 0,    magicMultiplier: 1.3,  status: "none", manaCost: 13, cooldown: 0, group: "magic", emoji: "✨" },
  "Arcane Curse":           { strMultiplier: 0,    magicMultiplier: 1.6,  status: "random", manaCost: 16, cooldown: 0, group: "magic", emoji: "🔮" },
  "Mana Shield":            { strMultiplier: 0,    magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 0, group: "magic", fortifySelf: 0.4, emoji: "🚪" },
  "Spell Burst":            { strMultiplier: 0,    magicMultiplier: 2.4,  status: "vulnerable", manaCost: 24, cooldown: 1, group: "magic", emoji: "💥" },
  "Coral Punch":            { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🪨" },
  "Calcified Shell":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", fortifySelf: 75, isPassive: true, emoji: "🐚", description: "Passive: Gains 75 Fortify at the start of each turn" },
  "Reef Slam":              { strMultiplier: 1.9,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", stunIfShielded: true, emoji: "💥" },
  "Coral Growth":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healPercent: 0.1, fortifySelf: 20, emoji: "🌺" },
  
  // Tier 4 Enemy Attacks
  "Dark Slash":             { strMultiplier: 1.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "⚔️" },
  "Cursed Blade":           { strMultiplier: 1.8,  magicMultiplier: 0,    status: "grim", manaCost: 0, cooldown: 2, group: "strength", emoji: "🔪" },
  "Shadow Strike":          { strMultiplier: 2.2,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", applyGrim: true, emoji: "🌑" },
  "Death Bolt":             { strMultiplier: 0,    magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 0, group: "magic", emoji: "💀" },
  "Resurrection":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", isRevive: true, isPassive: true, emoji: "⚰️", description: "Passive: Revives with 50% HP when defeated (3 turn cooldown)" },
  "Life Drain":             { strMultiplier: 0,    magicMultiplier: 1.8,  status: "leech", manaCost: 18, cooldown: 0, group: "magic", heals: 1.0, emoji: "🧛" },
  "Curse of Undeath":       { strMultiplier: 0,    magicMultiplier: 2.0,  status: "corruption", manaCost: 20, cooldown: 2, group: "magic", applyGrim: true, emoji: "🖤" },
  "Bone Shield":            { strMultiplier: 0,    magicMultiplier: 0.6,  status: "none", manaCost: 6, cooldown: 0, group: "magic", barrierAlly: true, emoji: "🛡️" },
  "Ancient Roots":          { strMultiplier: 0,    magicMultiplier: 1.4,  status: "vulnerable", manaCost: 14, cooldown: 0, group: "magic", emoji: "🌲" },
  "Ancient Growth":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", magicGrowth: 0.1, isPassive: true, emoji: "🌱", description: "Passive: Gains +10% Magic stat at the start of each turn" },
  "Overgrowth":             { strMultiplier: 0,    magicMultiplier: 2.0,  status: "none", manaCost: 20, cooldown: 1, group: "magic", scalesWithStacks: true, emoji: "🌿" },
  "Forest's Blessing":      { strMultiplier: 0,    magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 0, group: "magic", heals: 2.0, emoji: "🍂" },
  "Petrify":                { strMultiplier: 0,    magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 0, group: "magic", fortifySelf: 60, emoji: "🗿" },
  "Royal Strike":           { strMultiplier: 1.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "👑" },
  "Defensive Stance":       { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", fortifySelf: 80, barrierSelf: true, emoji: "🛡️" },
  "Punish":                 { strMultiplier: 2.1,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", counterBonus: 0.5, emoji: "⚔️" },
  "Honor Bound":            { strMultiplier: 2.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", resolveAlly: true, emoji: "⚡" },
  "Bite":                   { strMultiplier: 1.6,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "🦷" },
  "Blood Frenzy":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", bleedStrBonus: 0.15, isPassive: true, emoji: "🩸", description: "Passive: Gains +15% Strength for each bleeding enemy" },
  "Savage Maul":            { strMultiplier: 2.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", bleedBonus: 1.0, emoji: "🤝" },
  "Feeding Time":           { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", heals: 0.5, requiresBleed: true, emoji: "🍴" },
  "Bloodthirst":            { strMultiplier: 0,    magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 0, group: "utility", isPassive: true, allAttacksBleed: true, emoji: "🩸", description: "Passive: All attacks inflict Bleed status" },
  
  // Tier 5 Boss Attacks
  "Shadow Strike Boss":     { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🌑" },
  "Void Step":              { strMultiplier: 2.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", extraTurn: true, emoji: "🌀" },
  "Dark Pulse":             { strMultiplier: 0,    magicMultiplier: 1.5,  status: "vulnerable", manaCost: 15, cooldown: 0, group: "magic", emoji: "🖤" },
  "Shadow Clone":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", dodgeChance: 0.25, isPassive: true, emoji: "👥", description: "Passive: 25% chance to dodge incoming attacks" },
  "Umbral Assault":         { strMultiplier: 2.8,  magicMultiplier: 1.0,  status: "bleed", manaCost: 10, cooldown: 2, group: "hybrid", applyCorruption: true, emoji: "⚔️" },
  "Claw Swipe":             { strMultiplier: 1.7,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🐉" },
  "Dragon's Inferno":       { strMultiplier: 0,    magicMultiplier: 2.0,  status: "burn", manaCost: 20, cooldown: 0, group: "magic", emoji: "🔥" },
  "Flame Breath":           { strMultiplier: 0,    magicMultiplier: 2.5,  status: "burn", manaCost: 25, cooldown: 0, group: "magic", isAOE: true, emoji: "🔥" },
  "Draconic Fury":          { strMultiplier: 2.2,  magicMultiplier: 1.5,  status: "burn", manaCost: 15, cooldown: 2, group: "hybrid", applyVulnerable: true, emoji: "😤" },
  "Scales of Fire":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", damageReduction: 0.3, burnReflect: true, isPassive: true, emoji: "🔥", description: "Passive: Reduces damage taken by 30% and reflects Burn status to attackers" },
  "Inferno Nova":           { strMultiplier: 0,    magicMultiplier: 3.5,  status: "burn", manaCost: 35, cooldown: 3, group: "magic", applyCorruption: true, emoji: "💥" },
  "Mutated Strike":         { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🧬" },
  "Toxic Bite":             { strMultiplier: 1.8,  magicMultiplier: 0,    status: "corruption", manaCost: 0, cooldown: 1, group: "strength", applyBleed: true, emoji: "☠️" },
  "Regenerative Flesh":     { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", healPercent: 0.15, emoji: "💚" },
  "Berserk Mode":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", lowHpBonus: 0.5, isPassive: true, emoji: "😡", description: "Passive: Gains +50% damage when below 30% HP" },
  "Plague Slam":            { strMultiplier: 2.8,  magicMultiplier: 0,    status: "corruption", manaCost: 0, cooldown: 2, group: "strength", applyVulnerable: true, applyGrim: true, emoji: "🦠" },
  "Adaptive Evolution":     { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", fortifySelf: 100, barrierSelf: 2, emoji: "🧬" },
  "Root Strike Boss":       { strMultiplier: 1.5,  magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 1, group: "hybrid", emoji: "🌳" },
  "Nature's Call":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", summonAlly: "vineLasher", isPassive: true, emoji: "🌿", description: "Passive: Summons a Vine Lasher ally at the start of battle" },
  "Photosynthesis Boss":    { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healPercent: 0.2, restoreMana: 10, emoji: "☀️" },
  "Worldroot Crush":        { strMultiplier: 2.5,  magicMultiplier: 1.0,  status: "vulnerable", manaCost: 10, cooldown: 2, group: "hybrid", applyLeech: true, emoji: "🌲" },
  "Verdant Shield":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", fortifySelf: 150, fortifyAllies: true, emoji: "🛡️" },
  "Gaia's Wrath":           { strMultiplier: 0,    magicMultiplier: 3.2,  status: "vulnerable", manaCost: 32, cooldown: 3, group: "magic", isAOE: true, applyCorruption: true, emoji: "🌎" },
  "Royal Decree":           { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "👑" },
  "Royal Command":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", summonAlly: "kingsGuard", isPassive: true, emoji: "👥", description: "Passive: Summons a King's Guard ally (4 turn cooldown)" },
  "Sovereign's Might":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", allyStatBonus: 0.1, isPassive: true, emoji: "⭐", description: "Passive: All allied enemies gain +10% to all stats" },
  "Execute":                { strMultiplier: 3.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", lowHpTargetBonus: 1.0, emoji: "☠️" },
  "King's Blessing":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healPercent: 0.15, barrierAll: true, emoji: "✨" },
  "Throne Shaker":          { strMultiplier: 2.2,  magicMultiplier: 2.2,  status: "vulnerable", manaCost: 22, cooldown: 3, group: "hybrid", isAOE: true, applyGrim: true, emoji: "💥" },
  
  // NEW HUMANOID BRANCH ATTACKS
  // Army Branch
  "Spear Thrust":           { strMultiplier: 1.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🔱" },
  "Shield Wall":            { strMultiplier: 0.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", fortifySelf: 0.25, emoji: "🛡️" },
  "Formation Strike":       { strMultiplier: 1.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", allyBonus: 0.2, emoji: "⚔️" },
  "Double Slash":           { strMultiplier: 1.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", hits: 2, emoji: "⚔️" },
  "Whirlwind Strike":       { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", isAOE: true, emoji: "🌪️" },
  "Blade Dance":            { strMultiplier: 1.2,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "💃" },
  "Parry":                  { strMultiplier: 0.6,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", counterDamage: 0.4, emoji: "🛡️" },
  "Commanding Strike":      { strMultiplier: 1.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "👊" },
  "Rally":                  { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", allyDamageBonus: 0.1, isPassive: true, emoji: "📢", description: "Passive: All allies deal +10% damage" },
  "Tactical Assault":       { strMultiplier: 1.9,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", emoji: "🎯" },
  "Inspiring Presence":     { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healAlliesPercent: 0.08, emoji: "✨" },
  "Battle Cry":             { strMultiplier: 1.3,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", buffAllies: true, emoji: "📣" },
  "Charging Strike":        { strMultiplier: 2.1,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", emoji: "🏇" },
  "Heavy Slam":             { strMultiplier: 2.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", emoji: "💥" },
  "Fortified Defense":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", fortifySelf: 70, emoji: "🛡️" },
  "Lance Rush":             { strMultiplier: 2.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", emoji: "🏹" },
  "Noble Guard":            { strMultiplier: 1.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", fortifySelf: 0.3, emoji: "👑" },
  
  // Rogue Branch
  "Quick Stab":             { strMultiplier: 1.1,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🗡️" },
  "Steal":                  { strMultiplier: 0.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", stealMana: 15, emoji: "💰" },
  "Dirty Trick":            { strMultiplier: 1.3,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 1, group: "strength", emoji: "😈" },
  "Shadow Meld":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", dodgeBonus: 0.5, emoji: "🌑" },
  "Backstab":               { strMultiplier: 2.2,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", critBonus: 0.5, emoji: "🗡️" },
  "Smoke Bomb":             { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", dodgeNext: true, emoji: "💨" },
  "Precision Strike":       { strMultiplier: 1.9,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", alwaysCrits: true, emoji: "🎯" },
  "Mana Siphon":            { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", stealMana: 25, emoji: "💙" },
  "Acrobatic Dodge":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", dodgeChance: 0.3, isPassive: true, emoji: "🤸", description: "Passive: 30% chance to dodge attacks" },
  "Vital Strike":           { strMultiplier: 2.5,  magicMultiplier: 0,    status: "grim", manaCost: 0, cooldown: 2, group: "strength", emoji: "💔" },
  "Smoke Screen":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", blindEnemies: true, emoji: "🌫️" },
  "Crippling Blow":         { strMultiplier: 1.8,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", reduceSpeed: 0.3, emoji: "🦵" },
  
  // Mage Guild Branch
  "Arcane Bolt":            { strMultiplier: 0,    magicMultiplier: 1.5,  status: "none", manaCost: 15, cooldown: 0, group: "magic", emoji: "✨" },
  "Fireball":               { strMultiplier: 0,    magicMultiplier: 1.7,  status: "burn", manaCost: 17, cooldown: 0, group: "magic", emoji: "🔥" },
  "Lightning Spark":        { strMultiplier: 0,    magicMultiplier: 1.3,  status: "none", manaCost: 13, cooldown: 0, group: "magic", emoji: "⚡" },
  "Shadow Bolt":            { strMultiplier: 0,    magicMultiplier: 1.8,  status: "none", manaCost: 18, cooldown: 0, group: "magic", emoji: "🌑" },
  "Dark Pact":              { strMultiplier: 0,    magicMultiplier: 2.4,  status: "none", manaCost: 24, cooldown: 2, group: "magic", selfDamage: 0.1, damageBonus: 0.5, emoji: "🩸" },
  "Corruption Wave":        { strMultiplier: 0,    magicMultiplier: 2.0,  status: "corruption", manaCost: 20, cooldown: 1, group: "magic", emoji: "🌀" },
  "Soul Leech":             { strMultiplier: 0,    magicMultiplier: 1.6,  status: "leech", manaCost: 16, cooldown: 0, group: "magic", heals: 0.5, emoji: "👻" },
  "Curse of Weakness":      { strMultiplier: 0,    magicMultiplier: 1.4,  status: "vulnerable", manaCost: 14, cooldown: 1, group: "magic", reduceStr: 0.2, emoji: "💀" },
  "Demonic Shield":         { strMultiplier: 0,    magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 2, group: "magic", fortifySelf: 50, emoji: "🛡️" },
  "Meteor Storm":           { strMultiplier: 0,    magicMultiplier: 3.2,  status: "burn", manaCost: 32, cooldown: 2, group: "magic", isAOE: true, emoji: "☄️" },
  "Arcane Explosion":       { strMultiplier: 0,    magicMultiplier: 2.8,  status: "none", manaCost: 28, cooldown: 2, group: "magic", isAOE: true, emoji: "💥" },
  "Mana Nova":              { strMultiplier: 0,    magicMultiplier: 2.4,  status: "none", manaCost: 24, cooldown: 1, group: "magic", drainMana: 20, emoji: "💙" },
  "Spell Reflect":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", reflectSpells: true, emoji: "🔮" },
  "Elemental Chaos":        { strMultiplier: 0,    magicMultiplier: 3.0,  status: "random", manaCost: 30, cooldown: 2, group: "magic", randomStatusCount: 3, emoji: "🌈" },
  "Arcane Ascension":       { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", magicGrowth: 0.15, isPassive: true, emoji: "⬆️", description: "Passive: Gains +15% magic per turn" },
  
  // Mercenary Branch  
  "Mercenary Strike":       { strMultiplier: 1.6,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "⚔️" },
  "Reckless Assault":       { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", selfDamage: 0.05, emoji: "😤" },
  "Combat Experience":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", damageGrowth: 0.05, isPassive: true, emoji: "💪", description: "Passive: Gains +5% strength per attack received" },
  "Veteran's Might":        { strMultiplier: 2.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", stackBonus: true, emoji: "💥" },
  "Paid in Blood":          { strMultiplier: 1.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", heals: 0.2, emoji: "🩸" },
  "Crossbow Shot":          { strMultiplier: 0,    magicMultiplier: 0,    skillMultiplier: 0.2, status: "none", manaCost: 0, cooldown: 0, group: "skill", requiresAmmo: true, emoji: "🏹" },
  "Chain Strike":           { strMultiplier: 1.9,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", hits: 3, emoji: "⛓️" },
  "Execution":              { strMultiplier: 3.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", lowHpBonus: 1.5, emoji: "☠️" },
  "Hunter's Mark":          { strMultiplier: 1.3,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 1, group: "strength", emoji: "🎯" },
  "Trophy Claim":           { strMultiplier: 2.1,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", killBonus: true, emoji: "🏆" },
  "Warlord's Fury":         { strMultiplier: 2.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", emoji: "😡" },
  "Hired Blades":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", summonAlly: "sellsword", emoji: "💰" },
  "Devastating Blow":       { strMultiplier: 3.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", emoji: "💥" },
  "War Cry":                { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", buffAllStr: 0.15, emoji: "📢" },
  "Mercenary Command":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", allyDamageBonus: 0.12, isPassive: true, emoji: "👥", description: "Passive: All allies deal +12% damage" },
  "Savage Cleave":          { strMultiplier: 2.6,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", isAOE: true, emoji: "🪓" },
  "Bloodlust":              { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", lifesteal: 0.15, isPassive: true, emoji: "🩸", description: "Passive: Heals for 15% of damage dealt" },
  
  // Cultist Branch
  "Void Bolt":              { strMultiplier: 0,    magicMultiplier: 1.8,  status: "none", manaCost: 18, cooldown: 0, group: "magic", emoji: "🌀" },
  "Sacrificial Blade":      { strMultiplier: 1.4,  magicMultiplier: 0.8,  status: "corruption", manaCost: 8, cooldown: 1, group: "hybrid", emoji: "🗡️" },
  "Curse":                  { strMultiplier: 0,    magicMultiplier: 1.5,  status: "random", manaCost: 15, cooldown: 1, group: "magic", emoji: "😈" },
  "Unholy Chant":           { strMultiplier: 0,    magicMultiplier: 1.6,  status: "vulnerable", manaCost: 16, cooldown: 1, group: "magic", emoji: "📿" },
  "Shadow Plague":          { strMultiplier: 0,    magicMultiplier: 2.2,  status: "corruption", manaCost: 22, cooldown: 1, group: "magic", spreadDebuff: true, emoji: "🦠" },
  "Forbidden Knowledge":    { strMultiplier: 0,    magicMultiplier: 0,    status: "random", manaCost: 0, cooldown: 0, group: "utility", debuffPerTurn: true, isPassive: true, emoji: "📖", description: "Passive: Applies random debuff each turn" },
  "Pain Amplifier":         { strMultiplier: 0,    magicMultiplier: 2.4,  status: "vulnerable", manaCost: 24, cooldown: 2, group: "magic", doubleStatus: true, emoji: "💢" },
  "Void Heal":              { strMultiplier: 0,    magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 2, group: "magic", healPercent: 0.2, emoji: "🖤" },
  "Dark Blessing":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", fortifyAll: 40, emoji: "✨" },
  "Insanity":               { strMultiplier: 0,    magicMultiplier: 2.6,  status: "random", manaCost: 26, cooldown: 2, group: "magic", confuse: true, emoji: "🌀" },
  "Void Tear":              { strMultiplier: 1.5,  magicMultiplier: 2.5,  status: "corruption", manaCost: 25, cooldown: 2, group: "hybrid", emoji: "💔" },
  "Summon Void":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", summonAlly: "voidTouched", emoji: "👁️" },
  "Reality Break":          { strMultiplier: 0,    magicMultiplier: 3.0,  status: "none", manaCost: 30, cooldown: 3, group: "magic", ignoreDefense: 0.5, emoji: "💥" },
  "Corruption Burst":       { strMultiplier: 0,    magicMultiplier: 2.8,  status: "corruption", manaCost: 28, cooldown: 2, group: "magic", isAOE: true, emoji: "☠️" },
  "Eldritch Blast":         { strMultiplier: 0,    magicMultiplier: 3.2,  status: "grim", manaCost: 32, cooldown: 2, group: "magic", applyLeech: true, emoji: "👁️" },
  "Madness Wave":           { strMultiplier: 0,    magicMultiplier: 2.6,  status: "random", manaCost: 26, cooldown: 1, group: "magic", randomStatusCount: 2, emoji: "🌪️" },
  "Dark Apotheosis":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 5, group: "utility", transformPowerup: true, emoji: "👿" },
  
  // Paladin Branch
  "Holy Strike":            { strMultiplier: 1.7,  magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 1, group: "hybrid", emoji: "✨" },
  "Smite":                  { strMultiplier: 2.0,  magicMultiplier: 1.0,  status: "burn", manaCost: 10, cooldown: 2, group: "hybrid", emoji: "⚡" },
  "Blessing of Might":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", buffStr: 0.2, emoji: "💪" },
  "Crusader Strike":        { strMultiplier: 2.1,  magicMultiplier: 1.2,  status: "none", manaCost: 12, cooldown: 2, group: "hybrid", emoji: "⚔️" },
  "Holy Wrath":             { strMultiplier: 0,    magicMultiplier: 2.4,  status: "burn", manaCost: 24, cooldown: 2, group: "magic", emoji: "😇" },
  "Judgment":               { strMultiplier: 2.4,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", emoji: "⚖️" },
  "Consecration":           { strMultiplier: 0,    magicMultiplier: 1.8,  status: "burn", manaCost: 18, cooldown: 2, group: "magic", isAOE: true, emoji: "✨" },
  "Avenging Light":         { strMultiplier: 2.0,  magicMultiplier: 1.8,  status: "none", manaCost: 18, cooldown: 2, group: "hybrid", lowHpBonus: 0.6, emoji: "💫" },
  "Templar's Judgment":     { strMultiplier: 2.5,  magicMultiplier: 2.0,  status: "burn", manaCost: 20, cooldown: 2, group: "hybrid", emoji: "⚡" },
  "Holy Nova":              { strMultiplier: 0,    magicMultiplier: 3.0,  status: "none", manaCost: 30, cooldown: 3, group: "magic", isAOE: true, emoji: "✨" },
  "Radiant Burst":          { strMultiplier: 0,    magicMultiplier: 2.8,  status: "burn", manaCost: 28, cooldown: 2, group: "magic", blindEnemies: true, emoji: "☀️" },
  "Blessing of Light":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healAlliesPercent: 0.15, emoji: "✨" },
  "Sanctified Ground":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", fortifyAll: 80, healOverTime: true, emoji: "🛡️" },
  "Divine Intervention":    { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 5, group: "utility", reviveAlly: true, emoji: "👼" },
  
  // Assassin Branch
  "Bleeding Edge":          { strMultiplier: 1.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "🔪" },
  "Arterial Strike":        { strMultiplier: 2.2,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", bleedStacks: 2, emoji: "💉" },
  "Silent Kill":            { strMultiplier: 2.6,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", instantKillLowHp: 0.2, emoji: "💀" },
  "Crimson Dance":          { strMultiplier: 1.6,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", hits: 3, emoji: "💃" },
  "Assassinate":            { strMultiplier: 3.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", critBonus: 1.0, emoji: "☠️" },
  "Throat Slit":            { strMultiplier: 2.4,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", silence: true, emoji: "🩸" },
  "Shadow Dance":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", dodgeNext: true, extraTurn: true, emoji: "🌑" },
  "Poison Vial":            { strMultiplier: 1.4,  magicMultiplier: 0,    status: "corruption", manaCost: 0, cooldown: 2, group: "strength", applyGrim: true, emoji: "🧪" },
  "Garrote":                { strMultiplier: 2.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", silence: true, emoji: "🪢" },
  "Fatal Strike":           { strMultiplier: 3.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", alwaysCrits: true, emoji: "💥" },
  "Dimensional Step":       { strMultiplier: 2.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", extraTurn: true, emoji: "🌀" },
  "Execute Order":          { strMultiplier: 3.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "strength", lowHpBonus: 1.8, emoji: "💀" },
  "Phantom Blades":         { strMultiplier: 2.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", hits: 4, emoji: "🗡️" },
  "Death Sentence":         { strMultiplier: 4.0,  magicMultiplier: 0,    status: "grim", manaCost: 0, cooldown: 4, group: "strength", applyAllDebuffs: true, emoji: "☠️" },
  "Vanishing Act":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 5, group: "utility", dodgeChance: 0.8, isPassive: true, createClone: true, emoji: "👻", description: "Passive: 80% dodge chance for 1 turn after using" },
  
  // Tier 6 Legendary Boss Attacks
  "Divine Smite":           { strMultiplier: 2.5,  magicMultiplier: 2.5,  status: "none", manaCost: 25, cooldown: 1, group: "hybrid", emoji: "⚡" },
  "Holy Judgment":          { strMultiplier: 0,    magicMultiplier: 3.0,  status: "vulnerable", manaCost: 30, cooldown: 2, group: "magic", applyCorruption: true, emoji: "⚖️" },
  "Divine Protection":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", fortifySelf: 200, barrierSelf: 3, resolveSelf: true, emoji: "🛡️" },
  "Celestial Storm":        { strMultiplier: 0,    magicMultiplier: 3.8,  status: "burn", manaCost: 38, cooldown: 3, group: "magic", isAOE: true, applyVulnerable: true, emoji: "✨" },
  "Righteous Fury":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", lowHpVulnerable: true, isPassive: true, emoji: "😇", description: "Passive: Applies Vulnerable to attacker when below 30% HP" },
  "Resurrection Divine":    { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", transformToDemonKing: true, isPassive: true, emoji: "🔄", description: "Passive: Transforms into Demon King when defeated" },
  "Heaven's Light":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", healMagicMultiplier: 1.5, removesDebuffs: true, emoji: "☀️" },
  "God's Wrath":            { strMultiplier: 3.5,  magicMultiplier: 3.5,  status: "burn", manaCost: 35, cooldown: 4, group: "hybrid", applyAllStatus: true, emoji: "☠️" },
  "Demon Claw":             { strMultiplier: 3.0,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", applyCorruption: true, emoji: "👿" },
  "Hellfire":               { strMultiplier: 0,    magicMultiplier: 3.5,  status: "burn", manaCost: 35, cooldown: 0, group: "magic", applyGrim: true, emoji: "🔥" },
  "Demonic Rage":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", stackingDamage: 0.05, isPassive: true, emoji: "😈", description: "Passive: Gains +5% damage per turn (stacks infinitely)" },
  "Apocalypse Boss":        { strMultiplier: 0,    magicMultiplier: 5.0,  status: "burn", manaCost: 50, cooldown: 4, group: "magic", isAOE: true, applyAllStatus: true, emoji: "💥" },
  "Soul Rend":              { strMultiplier: 3.2,  magicMultiplier: 3.2,  status: "corruption", manaCost: 32, cooldown: 2, group: "hybrid", heals: 1.0, applyGrim: true, emoji: "🔪" },
  "Infernal Shield":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 5, group: "utility", fortifySelf: 300, barrierSelf: 5, resolveSelf: true, emoji: "🔥" },
  "Damnation":              { strMultiplier: 4.0,  magicMultiplier: 4.0,  status: "none", manaCost: 40, cooldown: 3, group: "hybrid", ignoresDefense: true, emoji: "☠️" },
  "Electric Bite":          { strMultiplier: 2.8,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 1, group: "strength", emoji: "⚡" },
  "Lightning Shock":        { strMultiplier: 0,    magicMultiplier: 3.2,  status: "none", manaCost: 32, cooldown: 2, group: "magic", shockStatus: true, emoji: "⚡" },
  "Thunder Storm":          { strMultiplier: 0,    magicMultiplier: 3.5,  status: "burn", manaCost: 35, cooldown: 3, group: "magic", isAOE: true, applyVulnerable: true, emoji: "⛈️" },
  "Blood Hunt":             { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", bleedStrBonus: 0.2, isPassive: true, emoji: "🩸", description: "Passive: Gains +20% Strength for each bleeding enemy" },
  "Voltaic Shield":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", fortifySelf: 180, damageReflect: 0.5, emoji: "⚡" },
  "Feeding Frenzy Boss":    { strMultiplier: 3.5,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", heals: 1.0, requiresBleed: true, emoji: "🍴" },
  "Lightning Speed":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", doubleTurn: true, isPassive: true, emoji: "⚡", description: "Passive: Takes two turns for every player turn" },
  "Megavolt":               { strMultiplier: 3.0,  magicMultiplier: 4.0,  status: "burn", manaCost: 40, cooldown: 4, group: "hybrid", shockStatus: true, applyCorruption: true, emoji: "⚡" },
  
  // Tier 7 & Unknown Attacks
  "Reality Warp":           { strMultiplier: 0,    magicMultiplier: 4.0,  status: "random", manaCost: 40, cooldown: 0, group: "magic", randomStatusCount: 3, emoji: "🌀" },
  "Omniscient Strike":      { strMultiplier: 3.5,  magicMultiplier: 3.5,  status: "none", manaCost: 35, cooldown: 0, group: "hybrid", alwaysCrits: true, emoji: "👁️" },
  "Existence Erasure":      { strMultiplier: 5.0,  magicMultiplier: 5.0,  status: "none", manaCost: 50, cooldown: 0, group: "hybrid", ignoresDefense: true, emoji: "☠️" },
  
  // NEW ENEMY ATTACKS
  // Tier 1 - Wisp
  "Spirit Bolt":            { strMultiplier: 0,    magicMultiplier: 1.1,  status: "none", manaCost: 11, cooldown: 0, group: "magic", emoji: "✨" },
  "Flicker":                { strMultiplier: 0,    magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 0, group: "magic", dodgeBonus: 0.15, emoji: "💫" },
  "Ethereal Dodge":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", dodgeChance: 0.20, isPassive: true, emoji: "👻", description: "Passive: 20% chance to dodge incoming attacks" },
  
  // Tier 2 - Ooze
  "Acidic Strike":          { strMultiplier: 1.0,  magicMultiplier: 0.6,  status: "vulnerable", manaCost: 6, cooldown: 0, group: "hybrid", emoji: "🧪" },
  "Dissolve":               { strMultiplier: 0,    magicMultiplier: 1.4,  status: "corruption", manaCost: 14, cooldown: 1, group: "magic", reduceDefense: 0.2, emoji: "🫠" },
  "Split Form":             { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", summonCopy: true, emoji: "〰️" },
  "Toxic Absorption":       { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", healOnStatus: 0.1, isPassive: true, emoji: "☣️", description: "Passive: Heals when applying status effects" },
  
  // Tier 2 - Living Armor
  "Shield Slam":            { strMultiplier: 1.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", fortifySelf: 0.3, emoji: "🛡️" },
  "Counter Strike":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", counterDamage: 0.5, isPassive: true, emoji: "⚔️", description: "Passive: Counters for 50% damage when blocking" },
  "Armored Defense":        { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", fortifySelf: 60, barrierSelf: true, emoji: "🛡️" },
  "Reversal":               { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", counterBonus: 1.0, emoji: "🔄" },
  
  // Tier 2 - Swamp Beast
  "Bog Bite":               { strMultiplier: 1.2,  magicMultiplier: 0,    status: "corruption", manaCost: 0, cooldown: 0, group: "strength", emoji: "🦷" },
  "Swamp Gas":              { strMultiplier: 0,    magicMultiplier: 1.3,  status: "corruption", manaCost: 13, cooldown: 1, group: "magic", applyVulnerable: true, emoji: "💨" },
  "Murky Regeneration":     { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", healPercent: 0.04, isPassive: true, emoji: "🌿", description: "Passive: Heals 4% of max HP at the start of each turn" },
  "Marsh Grasp":            { strMultiplier: 1.6,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 2, group: "strength", heals: 0.3, emoji: "🫲" },
  
  // Tier 3 - Rune Sentinel
  "Rune Strike":            { strMultiplier: 1.3,  magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 0, group: "hybrid", emoji: "⚡" },
  "Ancient Script":         { strMultiplier: 0,    magicMultiplier: 1.6,  status: "vulnerable", manaCost: 16, cooldown: 0, group: "magic", emoji: "📜" },
  "Magic Amplify":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", magicEmpowerNext: 0.3, isPassive: true, emoji: "🔮", description: "Passive: Magic attacks empower next physical strike by 30%" },
  "Glyph Burst":            { strMultiplier: 0,    magicMultiplier: 2.1,  status: "burn", manaCost: 21, cooldown: 1, group: "magic", emoji: "💥" },
  "Power Rune":             { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", magicGrowth: 0.08, emoji: "🗿" },
  
  // Tier 3 - Spectral Knight
  "Ghost Blade":            { strMultiplier: 1.4,  magicMultiplier: 0.8,  status: "none", manaCost: 8, cooldown: 0, group: "hybrid", emoji: "👻" },
  "Spectral Charge":        { strMultiplier: 2.0,  magicMultiplier: 0,    status: "vulnerable", manaCost: 0, cooldown: 2, group: "strength", emoji: "⚔️" },
  "Phase Shift":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", dodgeChance: 0.18, isPassive: true, emoji: "🌫️", description: "Passive: 18% chance to phase through attacks" },
  "Haunting Strike":        { strMultiplier: 1.6,  magicMultiplier: 1.0,  status: "grim", manaCost: 10, cooldown: 1, group: "hybrid", emoji: "💀" },
  "Spirit Guard":           { strMultiplier: 0,    magicMultiplier: 0.5,  status: "none", manaCost: 5, cooldown: 0, group: "magic", fortifySelf: 0.4, emoji: "🛡️" },
  
  // Tier 3 - Magma Beast
  "Lava Claw":              { strMultiplier: 1.5,  magicMultiplier: 0,    status: "burn", manaCost: 0, cooldown: 0, group: "strength", emoji: "🔥" },
  "Eruption":               { strMultiplier: 0,    magicMultiplier: 1.9,  status: "burn", manaCost: 19, cooldown: 1, group: "magic", emoji: "🌋" },
  "Magma Shield":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", damageReduction: 0.2, burnReflect: true, isPassive: true, emoji: "🔥", description: "Passive: Reduces damage by 20% and reflects Burn to attackers" },
  "Volcanic Rage":          { strMultiplier: 2.2,  magicMultiplier: 0.8,  status: "burn", manaCost: 8, cooldown: 2, group: "hybrid", emoji: "😡" },
  "Molten Skin":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", fortifySelf: 45, emoji: "🛡️" },
  
  // Tier 4 - Shadow Reaper
  "Reaper Scythe":          { strMultiplier: 1.8,  magicMultiplier: 0,    status: "grim", manaCost: 0, cooldown: 1, group: "strength", emoji: "🪦" },
  "Dark Harvest":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", killStrBonus: 0.1, isPassive: true, emoji: "💀", description: "Passive: Gains +10% strength per enemy defeated this battle" },
  "Soul Steal":             { strMultiplier: 0,    magicMultiplier: 2.0,  status: "leech", manaCost: 20, cooldown: 0, group: "magic", heals: 0.8, emoji: "👻" },
  "Death's Door":           { strMultiplier: 2.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", lowHpTargetBonus: 0.8, emoji: "🚪" },
  "Shadow Veil":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", dodgeBonus: 0.4, emoji: "🌑" },
  "Grim Presence":          { strMultiplier: 0,    magicMultiplier: 1.2,  status: "grim", manaCost: 12, cooldown: 0, group: "magic", applyCorruption: true, emoji: "💀" },
  
  // Tier 4 - Crystal Behemoth
  "Crystal Slam":           { strMultiplier: 2.0,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "💎" },
  "Gem Barrage":            { strMultiplier: 0,    magicMultiplier: 1.8,  status: "bleed", manaCost: 18, cooldown: 1, group: "magic", hits: 3, emoji: "💠" },
  "Diamond Skin":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", fortifySelf: 90, isPassive: true, emoji: "💎", description: "Passive: Gains 90 Fortify at the start of each turn" },
  "Prism Shatter":          { strMultiplier: 2.5,  magicMultiplier: 1.2,  status: "vulnerable", manaCost: 12, cooldown: 2, group: "hybrid", isAOE: true, emoji: "💥" },
  "Refract":                { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", reflectMagic: 0.3, isPassive: true, emoji: "🔮", description: "Passive: Reflects 30% of magic damage back to attacker" },
  "Hardened Core":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", fortifySelf: 120, barrierSelf: 2, emoji: "🛡️" },
  
  // Tier 1 - Gargoyle
  "Stone Claw":             { strMultiplier: 1.4,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🪨" },
  "Harden":                 { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", fortifySelf: 30, emoji: "🛡️" },
  "Dive Bomb":              { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "strength", emoji: "💨" },

  // Tier 2 - Mimic
  "Snap Bite":              { strMultiplier: 1.6,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "🦷" },
  "Coin Toss":              { strMultiplier: 1.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "strength", emoji: "🪙" },
  "False Treasure":         { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", barrierSelf: 3, fortifySelf: 20, emoji: "💰" },
  "Mimic":                  { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", copyLastAttack: true, isPassive: true, emoji: "🎭", description: "Passive: Copies the damage type of the last attack received" },

  // Tier 2 - Banshee
  "Wail":                   { strMultiplier: 0,    magicMultiplier: 1.6,  status: "none", manaCost: 16, cooldown: 0, group: "magic", reduceMagic: 0.15, emoji: "😱" },
  "Soul Scream":            { strMultiplier: 0,    magicMultiplier: 2.2,  status: "vulnerable", manaCost: 22, cooldown: 1, group: "magic", emoji: "👻" },
  "Death Mark":             { strMultiplier: 0,    magicMultiplier: 1.4,  status: "grim", manaCost: 14, cooldown: 2, group: "magic", emoji: "💀" },
  "Haunting Cry":           { strMultiplier: 0,    magicMultiplier: 1.8,  status: "chill", manaCost: 18, cooldown: 1, group: "magic", emoji: "🌫️" },

  // Tier 2 - Void Touched
  "Void Slash":             { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "⚔️" },
  "Corruption":             { strMultiplier: 0,    magicMultiplier: 1.6,  status: "leech", manaCost: 16, cooldown: 1, group: "magic", emoji: "🌀" },
  "Unstable Form":          { strMultiplier: 1.4,  magicMultiplier: 1.4,  status: "random", manaCost: 14, cooldown: 2, group: "hybrid", emoji: "💫" },

  // Tier 3 - Storm Elemental
  "Lightning Bolt":         { strMultiplier: 0,    magicMultiplier: 2.0,  status: "none", manaCost: 20, cooldown: 0, group: "magic", emoji: "⚡" },
  "Thunder Clap":           { strMultiplier: 0,    magicMultiplier: 1.6,  status: "none", manaCost: 16, cooldown: 1, group: "magic", stunChance: 0.3, emoji: "💥" },
  "Chain Lightning":        { strMultiplier: 0,    magicMultiplier: 2.4,  status: "none", manaCost: 24, cooldown: 2, group: "magic", hits: 3, emoji: "⚡" },
  "Storm Surge":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", speedBoost: 0.1, isPassive: true, emoji: "🌪️", description: "Passive: Gains 10% speed each turn" },
  "Static Shield":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 3, group: "utility", barrierSelf: 4, reflectDamage: 0.25, emoji: "🛡️" },

  // Tier 3 - Blood Golem
  "Blood Strike":           { strMultiplier: 1.8,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 1, group: "strength", emoji: "🩸" },
  "Crimson Drain":          { strMultiplier: 1.4,  magicMultiplier: 0,    status: "leech", manaCost: 0, cooldown: 1, group: "strength", healPercent: 0.15, emoji: "💉" },
  "Coagulate":              { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", healPercent: 0.12, emoji: "🩹" },
  "Hemorrhage":             { strMultiplier: 2.2,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 2, group: "strength", bleedStacks: 3, emoji: "🔴" },
  "Blood Armor":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", bleedEmpowerment: true, isPassive: true, emoji: "🛡️", description: "Passive: Gains 5% strength for each bleeding enemy" },

  // Tier 3 - Frost Wyrm
  "Frost Bite":             { strMultiplier: 1.6,  magicMultiplier: 1.0,  status: "chill", manaCost: 10, cooldown: 0, group: "hybrid", emoji: "❄️" },
  "Ice Breath":             { strMultiplier: 0,    magicMultiplier: 2.4,  status: "chill", manaCost: 24, cooldown: 1, group: "magic", isAOE: true, emoji: "🌨️" },
  "Glacial Armor":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", fortifySelf: 40, emoji: "🧊" },
  "Blizzard":               { strMultiplier: 0,    magicMultiplier: 2.0,  status: "chill", manaCost: 20, cooldown: 2, group: "magic", hits: 4, emoji: "🌬️" },
  "Frozen Domain":          { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", slowEnemies: 0.08, isPassive: true, emoji: "❄️", description: "Passive: Reduces all enemy speed by 8%" },

  // Tier 4 - Plague Bringer
  "Plague Strike":          { strMultiplier: 1.6,  magicMultiplier: 0,    status: "bleed", manaCost: 0, cooldown: 0, group: "strength", emoji: "🦠" },
  "Disease Cloud":          { strMultiplier: 0,    magicMultiplier: 2.0,  status: "random", manaCost: 20, cooldown: 1, group: "magic", randomStatusCount: 2, isAOE: true, emoji: "☁️" },
  "Festering Wound":        { strMultiplier: 1.4,  magicMultiplier: 1.0,  status: "leech", manaCost: 10, cooldown: 1, group: "hybrid", emoji: "🩸" },
  "Epidemic":               { strMultiplier: 0,    magicMultiplier: 2.6,  status: "grim", manaCost: 26, cooldown: 2, group: "magic", spreadDebuffs: true, emoji: "☣️" },
  "Rot":                    { strMultiplier: 0,    magicMultiplier: 1.8,  status: "vulnerable", manaCost: 18, cooldown: 1, group: "magic", reduceHealing: 0.5, emoji: "💀" },
  "Contagion":              { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", spreadStatus: true, isPassive: true, emoji: "🦠", description: "Passive: Status effects spread to adjacent enemies" },

  // Tier 4 - Void Kraken
  "Tentacle Slam":          { strMultiplier: 2.2,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", emoji: "🦑" },
  "Ink Cloud":              { strMultiplier: 0,    magicMultiplier: 1.6,  status: "none", manaCost: 16, cooldown: 2, group: "magic", reduceAccuracy: 0.3, emoji: "💨" },
  "Crushing Grip":          { strMultiplier: 1.8,  magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 1, group: "strength", restrictAction: true, emoji: "✊" },
  "Void Pull":              { strMultiplier: 0,    magicMultiplier: 2.0,  status: "vulnerable", manaCost: 20, cooldown: 2, group: "magic", emoji: "🌀" },
  "Deep Terror":            { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", doubleAttack: true, isPassive: true, emoji: "🦑", description: "Passive: Attacks twice per turn" },
  "Maelstrom":              { strMultiplier: 2.8,  magicMultiplier: 1.6,  status: "none", manaCost: 16, cooldown: 3, group: "hybrid", isAOE: true, emoji: "🌊" },

  // Tier 5 - Ancient Lich
  "Death Coil":             { strMultiplier: 0,    magicMultiplier: 2.4,  status: "leech", manaCost: 24, cooldown: 0, group: "magic", healPercent: 0.2, emoji: "💀" },
  "Necromantic Power":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 2, group: "utility", empowerMagic: 0.25, emoji: "🔮" },
  "Soul Shackle":           { strMultiplier: 0,    magicMultiplier: 2.8,  status: "grim", manaCost: 28, cooldown: 1, group: "magic", stunTarget: true, emoji: "⛓️" },
  "Lich Form":              { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", barrierSelf: 5, fortifySelf: 80, emoji: "👤" },
  "Army of the Dead":       { strMultiplier: 0,    magicMultiplier: 3.2,  status: "none", manaCost: 32, cooldown: 2, group: "magic", summonMinions: true, emoji: "🧟" },
  "Eternal Curse":          { strMultiplier: 0,    magicMultiplier: 3.6,  status: "grim", manaCost: 36, cooldown: 3, group: "magic", permanentDebuff: true, emoji: "💀" },
  "Phylactery Shield":      { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", resurrectOnce: true, isPassive: true, emoji: "📿", description: "Passive: Resurrects once per battle at 50% HP" },

  // Tier 6 - Time Lord (SECRET BOSS)
  "Temporal Strike":        { strMultiplier: 1.6,  magicMultiplier: 1.6,  status: "chill", manaCost: 16, cooldown: 0, group: "hybrid", emoji: "⏰" },
  "Rewind":                 { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 4, group: "utility", healPercent: 0.25, undoDamage: true, emoji: "⏪" },
  "Time Stop":              { strMultiplier: 0,    magicMultiplier: 2.2,  status: "none", manaCost: 22, cooldown: 2, group: "magic", stunTarget: true, extraTurn: true, emoji: "⏸️" },
  "Chronos Blast":          { strMultiplier: 0,    magicMultiplier: 2.8,  status: "vulnerable", manaCost: 28, cooldown: 1, group: "magic", applyGrim: true, emoji: "💥" },
  "Future Sight":           { strMultiplier: 0,    magicMultiplier: 0,    status: "none", manaCost: 0, cooldown: 0, group: "utility", dodgeChance: 0.22, isPassive: true, emoji: "🔮", description: "Passive: 22% chance to foresee and dodge attacks" },
  "Paradox":                { strMultiplier: 2.4,  magicMultiplier: 2.4,  status: "random", manaCost: 24, cooldown: 2, group: "hybrid", randomStatusCount: 2, emoji: "🌀" },
  "Infinity Loop":          { strMultiplier: 0,    magicMultiplier: 3.5,  status: "none", manaCost: 35, cooldown: 3, group: "magic", isAOE: true, repeatNextTurn: true, emoji: "♾️" },
};


// Maximum player level cap
const MAX_PLAYER_LEVEL = 125;

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
    RELIC: null,
    LEVEL: 1,
    HEALTH: null,
    SKILL: 0,
    AMMO: 0,
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
    SKILL: 0,
    AMMO: 0,
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
    SKILL: 0,
    AMMO: 0,
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
    SKILL: 0,
    AMMO: 0,
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
    HEALTH: null,
    SKILL: 0,
    AMMO: 0,
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

    // Enforce max player level cap
    const level = Math.min(Number(member.LEVEL) || 1, MAX_PLAYER_LEVEL);
    if (member.LEVEL !== level) {
      member.LEVEL = level; // clamp persisted level if it exceeded cap previously
      // If XP exists beyond cap, clear it
      if (typeof member.XP === 'number' && level >= MAX_PLAYER_LEVEL) {
        member.XP = 0;
      }
    }
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
    let equippedMana = 0;
    let equippedSkill = 0;
    let equippedProcChance = 0;

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
      const itemMana = (item.mana || 0);
      equippedMana += itemMana;
      equippedSkill += (item.skill || 0);
      equippedProcChance += (item.procChance || 0);
      
      // Debug mana
      if (itemMana > 0) {
        console.log(`[STATS] ${memberKey} equipped ${item.name}: +${itemMana} mana (total equipped mana: ${equippedMana})`);
      }
      
      // Process item abilities
      if (item.ability === 89) {
        // Lucky Charm: +15% proc chance and +10% crit chance
        equippedProcChance += 15;
        equippedSkill += 20; // +20 skill gives +10% crit chance (0.5% per skill)
      }
    }
  }
}

    // 4. Calculate total stats by combining base stats and equipped item bonuses
    const totalStrength = baseStrength + equippedStrength;
    const totalSpeed = baseSpeed + equippedSpeed;
    const totalMagic = baseMagic + equippedMagic;
    const totalDefense = baseDefense + equippedDefense;
    const totalMaxHealth = baseHealth + equippedHealth;
    // Mana doesn't scale with level - 50 base + equipment bonuses
    const totalMaxMana = 50 + equippedMana; // Base 50 mana + equipment
    console.log(`[STATS] ${memberKey} - Equipped mana: ${equippedMana}, Total MAX_MANA: ${totalMaxMana}`);
    
    // Skill doesn't have a base value - only from equipment
    const totalSkill = equippedSkill;
    // Proc chance has a base of 25% plus equipment bonuses
    const totalProcChance = 25 + equippedProcChance;

    // 5. Update the party member's stats with the new totals
    // Store old max values to adjust current values proportionally
    const oldMaxMana = member.MAX_MANA;
    
    member.MAX_HEALTH = totalMaxHealth;
    member.STRENGTH = totalStrength;
    member.SPEED = totalSpeed;
    member.MAGIC = totalMagic;
    member.DEFENSE = totalDefense;
    member.MAX_MANA = totalMaxMana;
    member.SKILL = totalSkill;
    member.PROC_CHANCE = totalProcChance;
    
    // Set the current HEALTH to MAX_HEALTH if it's currently null
    if (member.HEALTH === null) {
      member.HEALTH = totalMaxHealth;
    }
    
    // Handle MANA adjustments when MAX_MANA changes
    if (typeof member.MANA === 'undefined' || member.MANA === null) {
      // First time initialization
      member.MANA = totalMaxMana;
    } else if (oldMaxMana && oldMaxMana !== totalMaxMana) {
      // MAX_MANA changed due to equipment change - adjust current MANA proportionally
      const manaRatio = member.MANA / oldMaxMana;
      member.MANA = Math.min(totalMaxMana, Math.round(manaRatio * totalMaxMana));
    }
    
    // ALWAYS ensure MANA never exceeds MAX_MANA (fixes legacy inflated values)
    if (member.MANA > member.MAX_MANA) {
      member.MANA = member.MAX_MANA;
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
function generateRandomItem(level, forceRarity = null, luckBonus = 0) {
  // Determine allowed rarities and weights based on level
  // luckBonus: percentage boost (e.g., 50 for +50% luck) that shifts weights toward higher rarities
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
    // Build a weight map per bucket with strict level gating
    let weights = {};
    
    // Levels 1-20: ONLY Common and Uncommon
    if (lvl <= 20) {
      const earlyFactor = Math.min(1, Math.max(0, (lvl - 1) / 19));
      weights = {
        [R.Common]: Math.max(40, 70 - (30 * earlyFactor)),  // 70% -> 40%
        [R.Uncommon]: 30 + (30 * earlyFactor)                // 30% -> 60%
      };
    }
    // Levels 21-40: Common, Uncommon, and Rare
    else if (lvl <= 40) {
      const midFactor = Math.min(1, Math.max(0, (lvl - 21) / 19));
      weights = {
        [R.Common]: Math.max(15, 35 - (20 * midFactor)),     // 35% -> 15%
        [R.Uncommon]: Math.max(30, 40 - (10 * midFactor)),   // 40% -> 30%
        [R.Rare]: 25 + (30 * midFactor)                      // 25% -> 55%
      };
    }
    // Levels 41-60: Uncommon, Rare, and Epic (no more Common)
    else if (lvl <= 60) {
      const lateFactor = Math.min(1, Math.max(0, (lvl - 41) / 19));
      weights = {
        [R.Uncommon]: Math.max(15, 40 - (25 * lateFactor)), // 40% -> 15%
        [R.Rare]: Math.max(25, 40 - (15 * lateFactor)),     // 40% -> 25%
        [R.Epic]: 20 + (40 * lateFactor)                    // 20% -> 60%
      };
    }
    // Levels 61+: Uncommon (very rare), Rare, Epic, Legendary
    else {
      const endFactor = Math.min(1, Math.max(0, (lvl - 61) / 29));
      weights = {
        [R.Uncommon]: Math.max(2, 10 - (8 * endFactor)),    // 10% -> 2% (super rare)
        [R.Rare]: Math.max(15, 30 - (15 * endFactor)),      // 30% -> 15%
        [R.Epic]: Math.max(35, 45 - (10 * endFactor)),      // 45% -> 35%
        [R.Legendary]: 15 + (33 * endFactor)                // 15% -> 48%
      };
    }
    
    // Exclude Base, Mythical, and Artifact from random drops at all levels
    delete weights[R.Base];
    delete weights[R.Mythical];
    delete weights[R.Artifact];
    
    // Apply luck bonus: shift weight from lower to higher rarities
    if (luckBonus > 0) {
      const rarityOrder = [R.Common, R.Uncommon, R.Rare, R.Epic, R.Legendary];
      const luckMultiplier = luckBonus / 100; // 50 -> 0.5
      
      // Transfer weight from lower rarities to higher ones
      for (let i = 0; i < rarityOrder.length - 1; i++) {
        const lowerRarity = rarityOrder[i];
        const higherRarity = rarityOrder[i + 1];
        
        if (weights[lowerRarity] && weights[higherRarity] !== undefined) {
          const transferAmount = weights[lowerRarity] * luckMultiplier;
          weights[lowerRarity] -= transferAmount;
          weights[higherRarity] = (weights[higherRarity] || 0) + transferAmount;
        }
      }
      
      console.log(`[LUCK BONUS] Applied +${luckBonus}% luck. Adjusted weights:`, weights);
    }

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
      // Fallback: use appropriate rarity for level
      if (lvl <= 20) chosenRarity = R.Common;
      else if (lvl <= 40) chosenRarity = R.Rare;
      else if (lvl <= 60) chosenRarity = R.Epic;
      else chosenRarity = R.Legendary;
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
  // Mana does NOT scale with level - keep base value from ITEM_TABLE
  // This ensures a level 1 mage robe gives the same mana as a level 100 mage robe
  if (typeof item.mana === 'undefined') {
    item.mana = 0;
  }
  // Keep mana as-is from the item template (no scaling)
  item.level = lvl;

  // Assign first available slot index
  assignItemSlot(item);
  INVENTORY.push(item);
  
  // Register item in collection index
  if (typeof registerItemCollected === 'function') {
    registerItemCollected(randomName);
  }
  
  return item;
}

/**
 * Assigns a slot index to an item (first available slot)
 */
function assignItemSlot(item) {
  const totalSlots = 125; // 5 pages * 25 slots per page
  const occupiedSlots = new Set();
  
  INVENTORY.forEach(i => {
    if (i && i.slotIndex !== undefined) {
      occupiedSlots.add(i.slotIndex);
    }
  });
  
  // Find first open slot
  for (let i = 0; i < totalSlots; i++) {
    if (!occupiedSlots.has(i)) {
      item.slotIndex = i;
      return;
    }
  }
  
  // If all slots full, assign to next index (overflow)
  item.slotIndex = totalSlots;
}
window.assignItemSlot = assignItemSlot;


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
    strMultiplier: attackStats.strMultiplier || 0,
    magicMultiplier: attackStats.magicMultiplier || 0,
    sklMultiplier: attackStats.skillMultiplier || 0,
    status: attackStats.status,
    manaCost: attackStats.manaCost || 10, // Default to 10 if not specified
    aoe: attackStats.aoe || false, // Copy AOE flag from attack stats
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
        sklMultiplier: 0,
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

