const map = document.getElementById("map");
if (map){
  

const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");

let tileData = {};
const rows = 10;
const cols = 10;
const pathLength = 10;

// Function to generate the dungeon using recursive backtracking and save to local storage
function generateAndSaveDungeon() {
  tileData = {}; // Clear existing tile data
  const dungeonPath = [];
  const visited = new Set();
  
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
    
    // Backtrack: If no path was found, remove the current tile and return false
    dungeonPath.pop();
    return false;
  }

  // Find a starting point
  let startRow, startCol;
  do {
    startRow = Math.floor(Math.random() * rows);
    startCol = Math.floor(Math.random() * cols);
  } while (!findPath(startRow, startCol));

  // Populate tileData from the generated path
  dungeonPath.forEach((coords, index) => {
    const key = `${coords.row},${coords.col}`;
    const level = index + 1;
    
    const tile = { level };

    if (level === 1) {
      tile.title = "Start Tile";
      tile.description = "This is the beginning of the map.";
      tile.cleared = true;
      tile.status = true;
      tile.enemyOne = "Enemies/skull.png";
    } else if (level === pathLength) {
      tile.title = "Boss";
      tile.description = "You've finally reached it.";
      tile.cleared = false;
      tile.status = false;
      tile.enemyOne = "Enemies/shadow.png";
    } else if ((level === pathLength/2)||(level===pathLength-1)) {
      tile.title = "MiniBoss";
      tile.description = "Rocky and cold up here.";
      tile.cleared = false;
      tile.status = false;
      tile.enemyOne = "Enemies/slime.png";
      tile.enemyTwo = "Enemies/slime.png";
      tile.enemyThree = "Enemies/cursedKnight.png";
    } else if (level === 2) {
      tile.title = "Basic";
      tile.description = "You entered a forest area.";
      tile.cleared = false;
      tile.status = true;
      tile.enemyOne = "Enemies/skull.png";
      tile.enemyTwo = "Enemies/slime.png";
      tile.enemyThree = null;
    } else {
      tile.title = "Basic";
      tile.description = `A path leads you deeper into the dungeon.`;
      tile.cleared = false;
      tile.status = false;
      tile.enemyOne = "Enemies/skull.png";
      tile.enemyTwo = "Enemies/slime.png";
      tile.enemyThree = "Enemies/alien.png";
    }

    tileData[key] = tile;
  });

  localStorage.setItem('dungeonTileData', JSON.stringify(tileData));
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
      } else {
        cell.style.visibility = "hidden";
      }
      map.appendChild(cell);
    }
  }
}

// Event listener for the entire map container
map.addEventListener("click", (e) => {
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

      const html = `
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <p>Level: ${data.level}</p>
        <div>${enemiesHTML}</div>
      `;
      openPopup(html);
    }
  }
});

// Other functions
// Function to open the popup
function openPopup(htmlContent) {
    popupContent.innerHTML = htmlContent;
    popup.style.display = "block";
}

// Function to close the popup
function closePopup() {
    popup.style.display = "none";
}

// Event listener for the entire map container
map.addEventListener("click", (e) => {
    // Check if the click occurred on a grid cell
    const cell = e.target.closest(".grid-cell");
    if (cell) {
        // Prevent the body's click listener from firing immediately
        e.stopPropagation();

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

            const html = `
                <h3>${data.title}</h3>
                <p>${data.description}</p>
                <p>Level: ${data.level}</p>
                <div>${enemiesHTML}</div>
            `;
            openPopup(html);
        }
    }
});

// Close popup if clicking outside it
document.body.addEventListener("click", () => {
    closePopup();
});

// Initial setup on page load
function initialize() {
  const savedData = localStorage.getItem('dungeonTileData');
  if (savedData) {
    tileData = JSON.parse(savedData);
  } else {
    generateAndSaveDungeon();
  }
  renderGrid();
}

// The button click function to regenerate the dungeon
function dungeonClick() {
  generateAndSaveDungeon();
  renderGrid();
}

// Run the initialization function when the page is loaded
window.onload = initialize;
}

//------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------

//Battle Logic


const ENEMY_BASE_STATS = {
  //Unknown Type Enemy Stats
  'skull': {
    health:15,
    strength:3.5,
    magic:0,
    speed:3.5,
    defense:0,
    hBars:1,
  },
  'slime': {
    health:45,
    strength:4,
    magic:0,
    speed:2,
    defense:0.15,
    hBars:1,
  },
  'alien': {
    health:20,
    strength:0,
    magic:8.5,
    speed:4,
    defense:0,
    hBars:1,
  },
  'Cursed_Knight': {
    health:65,
    strength:12,
    magic:0,
    speed:6.5,
    defense:30,
    hBars:1,
  },
  'Shadow': {
    health:110,
    strength:7,
    magic:5,
    speed:20,
    defense:0,
    hBars:1,
  },
  //Forest Type Enemy Stats
  'Sapling': {
    health:20,
    strength:0,
    magic:4,
    speed:1,
    defense:0,
    hBars:1,
  },
  'Vine_Lasher': {
    health:30,
    strength:5.5,
    magic:0,
    speed:3,
    defense:0,
    hBars:1,
  },
  'Treant': {
    health:50,
    strength:9,
    magic:0,
    speed:2,
    defense:15,
    hBars:1,
  },
  'Elder_Ent': {
    health:30,
    strength:0,
    magic:14,
    speed:4,
    defense:70,
    hBars:1,
  },
  'Worldroot': {
    health:150,
    strength:3,
    magic:15,
    speed:6,
    defense:0,
    hBars:1,
  }
};

// Item Stats/weight

const ITEM_TABLE = {
  "Wooden Sword": {
    slot: "Weapon",
    rarity: "Common",
    strength: 3,
    speed: 0.5,
    magic: 0,
    defense: 2,
    health: 0,
    attack: "stap",
    ability: 1,
    image: "Items/woodenSword.png",
  },
  "Stick": {
    slot: "Weapon",
    rarity: "Base",
    strength: 1,
    speed: 1,
    magic: 1,
    defense: 0,
    health: 0,
    attack: "slap",
    ability: 0,
  },
  "Grass Staff": {
    slot: "Weapon",
    rarity: "Common",
    strength: 0,
    speed: 0.5,
    magic: 3,
    defense: 2,
    health: 0,
    attack: "leaf impale",
    ability: 1,
    image: "Items/grassStaff.png",
  },
  "Coral Dagger": {
    slot: "Weapon",
    rarity: "Uncommon",
    strength: 4,
    speed: 2,
    magic: 1.5,
    defense: 0,
    health: 0,
    attack: "coral leech",
    ability: 2,
    image: "Items/coralDagger.png",
  },
  "Spell Shield": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 0,
    magic: 1.5,
    defense: 10,
    health: 5,
    attack: "reflection",
    ability: 3,
    image: "Items/spellShield.png",
  },
  "Sea Crystal": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 0,
    speed: 0.5,
    magic: 4,
    defense: 0,
    health: 5,
    attack: "sea shield",
    ability: 2,
  },
  "Shell": {
    slot: "Offhand",
    rarity: "Uncommon",
    strength: 2.5,
    speed: 0,
    magic: 0,
    defense: 15,
    health: 5,
    attack: "none",
    ability: 0,
    image: "Items/shell.png",
  },
  "Iron Helmet": {
    slot: "Helmet",
    rarity: "Uncommon",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 5,
    health: 3,
    attack: "none",
    ability: 0,
    image: "Items/ironHelmet.png",
  },
  "Iron Chestplate": {
    slot: "Chest",
    rarity: "Uncommon",
    strength: 0.5,
    speed: 0,
    magic: 0,
    defense: 10,
    health: 6,
    attack: "none",
    ability: 0,
    image: "Items/ironChest.png",
  },
  "Iron Legging": {
    slot: "Leg",
    rarity: "Uncommon",
    strength: 0,
    speed: 0.5,
    magic: 0,
    defense: 7,
    health: 2,
    attack: "none",
    ability: 0,
    image: "Items/ironPants.png",
  },
  "Iron Boots": {
    slot: "Boot",
    rarity: "Uncommon",
    strength: 0,
    speed: 1,
    magic: 0,
    defense: 3,
    health: 1,
    attack: "none",
    ability: 0,
  },
  "Spiked Shield": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 7,
    speed: 0,
    magic: 0,
    defense: 15,
    health: 10,
    attack: "Charge",
    ability: 4,
  },
  "Grimore": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 0,
    speed: 1.5,
    magic: 12,
    defense: 0,
    health: 0,
    attack: "Plasma Blast",
    ability: 5,
    image: "Items/grimoire.png",
  },
  "Forest Crown": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 0,
    speed: 3,
    magic: 5,
    defense: 5,
    health: 15,
    attack: "Tree People",
    ability: 6,
  },
  "Frosted Helmet": {
    slot: "Helmet",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 2,
    defense: 5,
    health: 8,
    attack: "none",
    ability: 0,
    image: "Items/frostHelmet.png",
  },
  "Frosted Chest": {
    slot: "Chest",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 2,
    defense: 20,
    health: 14,
    attack: "none",
    ability: 0,
    image: "Items/frostChest.png",
  },
  "Frosted Leg": {
    slot: "Leg",
    rarity: "Rare",
    strength: 0,
    speed: 0,
    magic: 1,
    defense: 10,
    health: 6,
    attack: "none",
    ability: 0,
    image: "Items/frostPants.png",
  },
  "Frosted Boots": {
    slot: "Boot",
    rarity: "Rare",
    strength: 0,
    speed: 3,
    magic: 1,
    defense: 3,
    health: 3,
    attack: "none",
    ability: 0,
    image: "Items/frostBoots.png",
  },
  "Ice Spear": {
    slot: "Weapon",
    rarity: "Rare",
    strength: 10,
    speed: 1.5,
    magic: 1,
    defense: 0,
    health: 0,
    attack: "plunge",
    ability: 1,
    image: "Items/iceSpear.png",
  },
  "Shadow Staff": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 2,
    speed: 1,
    magic: 22,
    defense: 0,
    health: 0,
    attack: "shadow vortex",
    ability: 7,
    image: "Items/shadowStaff.png",
  },
  "Blaze Blade": {
    slot: "Weapon",
    rarity: "Epic",
    strength: 16,
    speed: 5,
    magic: 7,
    defense: 3,
    health: 0,
    attack: "Incenerate",
    ability: 8,
  },
  "Gem Helmet": {
    slot: "Helmet",
    rarity: "Epic",
    strength: 3,
    speed: 0,
    magic: 4,
    defense: 12,
    health: 13,
    attack: "none",
    ability: 3,
    image: "Items/gemHelmet.png",
  },
  "Gem Chest": {
    slot: "Chest",
    rarity: "Epic",
    strength: 4,
    speed: 0,
    magic: 5,
    defense: 26,
    health: 17,
    attack: "none",
    ability: 0,
    image: "Items/gemChest.png",
  },
  "Gem Legs": {
    slot: "Leg",
    rarity: "Epic",
    strength: 3,
    speed: 2,
    magic: 4,
    defense: 15,
    health: 12,
    attack: "none",
    ability: 0,
    image: "Items/gemLegs.png",
  },
  "Gem Boots": {
    slot: "Boots",
    rarity: "Epic",
    strength: 2,
    speed: 3,
    magic: 3,
    defense: 25,
    health: 10,
    attack: "none",
    ability: 3,
    image: "Items/gemBoots.png",
  },
  "Water Skaters": {
    slot: "Boots",
    rarity: "Epic",
    strength: 0,
    speed: 0,
    magic: 1,
    defense: 11,
    health: 15,
    attack: "skater slice",
    ability: 9,
  },
  "Energy Saber": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 30,
    speed: 1,
    magic: 4,
    defense: 20,
    health: 0,
    attack: "force strike",
    ability: 10,
    image: "Items/energySaber.png",
  },
  "Demon Sythe": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 50,
    speed: 1,
    magic: 4,
    defense: 0,
    health: 0,
    attack: "Grim slice",
    ability: 11,
    image: "Items/demonSythe.png",
  },
  "Lightning Spear": {
    slot: "Offhand",
    rarity: "Legendary",
    strength: 30,
    speed: 8,
    magic: 3,
    defense: 5,
    health: 0,
    attack: "Thunder",
    ability: 12,
    image: "Items/lightningSpear.png",
  },
  "Pixel Sword": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 40,
    speed: 1,
    magic: 2,
    defense: 15,
    health: 10,
    attack: "Combo",
    ability: 13,
    image: "Items/pixelSword.png",
  },
  "Ice Cream Gun": {
    slot: "Weapon",
    rarity: "Legendary",
    strength: 0,
    speed: 0,
    magic: 5,
    defense: 1,
    health: 0,
    attack: "Chilled Cream",
    ability: 14,
    image: "Items/iceCreamGun.png",
  },
  "Running Spikes": {
    slot: "Boots",
    rarity: "Mythical",
    strength: 5,
    speed: 3,
    magic: 2,
    defense: 0,
    health: 0,
    attack: "none",
    ability: 15,
  },
  "Rulers Hand": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 65,
    speed: 1,
    magic: 0,
    defense: 65,
    health: 25,
    attack: "Arise",
    ability: 16,
  },
  "Muramasa": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 110,
    speed: 2,
    magic: 0,
    defense: 0,
    health: 10,
    attack: "Pure skill",
    ability: 17,
  },
  "Spell Blade": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 50,
    speed: 1,
    magic: 5,
    defense: 9,
    health: 0,
    attack: "spell infused",
    ability: 18,
    image: "Items/spellBlade.png",
  },
  "Enhanced Stick": {
    slot: "Weapon",
    rarity: "Mythical",
    strength: 20,
    speed: 2,
    magic: 2,
    defense: 6,
    health: 0,
    attack: "enhance",
    ability: 19,
  },
  "Divine Crown": {
    slot: "Helmet",
    rarity: "Artifact",
    strength: 0,
    speed: 0,
    magic: 0,
    defense: 100,
    health: 40,
    attack: "Rulers Authority",
    ability: 20,
  },
};

// attack stats multipliers and status effects

const ATTACK_STATS = {
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
    NAME: 'null',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: null,
    HEALTH: null,
  },
  'THREE': {
    NAME: 'null',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: null,
    HEALTH: null,
  },
  'FOUR': {
    NAME: 'null',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: null,
    HEALTH: null,
  },
  'FIVE': {
    NAME: 'null',
    HELMET: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    MAINHAND: null,
    OFFHAND: null,
    LEVEL: null,
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
    const sqrtLevel = Math.sqrt(level);

    const baseHealth = Math.round(level * sqrtLevel * 3);
    const baseStrength = Math.round(level * sqrtLevel);
    const baseMagic = Math.round(level * sqrtLevel);
    const baseSpeed = Math.round(sqrtLevel + level);
    
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
    // Find the item in the INVENTORY array by name
    const item = INVENTORY.find(i => i.name === itemName);
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

// --- Inventory Array ---
const INVENTORY = []; // Holds generated items

/**
 * Generates a random item scaled to the given level, applies stat scaling, and adds it to the inventory.
 * @param {number} level - The level to scale the item to.
 * @returns {object} The generated item object.
 */
function generateRandomItem(level) {
  // Get all item names from ITEM_TABLE
  const itemNames = Object.keys(ITEM_TABLE);
  // Pick a random item
  const randomName = itemNames[Math.floor(Math.random() * itemNames.length)];
  const baseItem = ITEM_TABLE[randomName];

  // Deep copy base stats
  const item = JSON.parse(JSON.stringify(baseItem));
  item.name = randomName;

  // Scaling factor
  const scale = Math.sqrt(level);

  // Helper to scale stat (positive: scale, negative: percent)
  function scaleStat(stat, baseValue) {
    if (baseValue === 0) return 0;
    if (baseValue > 0) {
      return Math.round(baseValue * scale);
    } else {
      // Negative values are percent-based, e.g. -10 means -10% after scaling
      return Math.round(baseValue); // Keep as percent for later use
    }
  }

  // Scale stats
  item.strength = scaleStat('strength', item.strength);
  item.speed = scaleStat('speed', item.speed);
  item.magic = scaleStat('magic', item.magic);
  item.defense = scaleStat('defense', item.defense);
  item.health = scaleStat('health', item.health);

  // Add level info
  item.level = level;

  // Add to inventory
  INVENTORY.push(item);

  return item;
}


// Example usage: generateRandomItem(5);
// The item will be added to INVENTORY

// ...existing code...