const inventory = document.getElementById("inventory");
const rows = 6;
const cols = 5;

function renderInventoryGrid() {
  // Clear the inventory grid
  inventory.innerHTML = "";

  // Fill the grid with INVENTORY items or empty slots
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.dataset.row = row;
      slot.dataset.col = col;

      const index = row * cols + col;
      const data = (typeof INVENTORY !== "undefined" && INVENTORY[index]) ? INVENTORY[index] : null;

      const img = document.createElement("img");
      img.className = "inv-img";

      if (data) {
        img.src = data.image;
        img.alt = data.name;
        slot.addEventListener('click', () => {
          displayItemInfo(data);
        });
      } else {
        img.src = "Assests/empty-slot.png";
        img.alt = "Empty Slot";
      }

      slot.appendChild(img);
      inventory.appendChild(slot);
    }
  }
}

// Update renderInventory to call renderInventoryGrid

function renderInventory() {
  renderInventoryGrid();
  renderEquippedItems('ONE');
  updateStatsDisplay();
}

function getItemImage(item) {
  return item && item.image ? item.image : "Assests/empty-slot.png";
}

// Render equipped items for a party member
function renderEquippedItems(memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  const equipDiv = document.getElementById("equipped-items");
  if (!equipDiv) return;

  equipDiv.innerHTML = ""; // Clear

  const slots = [
    { key: "HELMET", label: "Helmet" },
    { key: "CHEST", label: "Chest" },
    { key: "LEGS", label: "Legs" },
    { key: "BOOTS", label: "Boots" },
    { key: "MAINHAND", label: "Mainhand" },
    { key: "OFFHAND", label: "Offhand" }
  ];

  slots.forEach(slot => {
    const itemName = member[slot.key];
    const item = ITEM_TABLE[itemName] || null;
    const imgSrc = item && item.image ? item.image : "Assests/empty-slot.png";
    const slotDiv = document.createElement("div");
    slotDiv.className = "equip-slot";
    slotDiv.innerHTML = `
      <div>${slot.label}</div>
      <img src="${imgSrc}" alt="${slot.label}" style="width:50px;height:50px;">
      <div style="font-size:12px">${itemName ? itemName : "Empty"}</div>
    `;
    equipDiv.appendChild(slotDiv);
  });
}


// Function to display item information
function displayItemInfo(item) {
  const infoItem = document.getElementById("info-item");
  infoItem.innerHTML = `
    <h3>${item.name} Level ${item.level}</h3>
    <img src="${item.image}" style="width:30%">
    <p>Strength: ${item.strength} Magic: ${item.magic} Speed: ${item.speed}</p>
    <p>Health: ${item.health} Defense: ${item.defense} Attack: ${item.attack}</p>
    <button id="equip-btn">Equip</button>
    <button id="unequip-btn">Unequip</button>
  `;

  document.getElementById("equip-btn").onclick = function() {
    equipItemToMember(item);
  };

  document.getElementById("unequip-btn").onclick = function() {
    unequipItemFromMember(item);
  };
}

function equipItemToMember(item, memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  // Find the slot this item goes in
  let slotKey = null;
  switch (item.slot) {
    case "Helmet": slotKey = "HELMET"; break;
    case "Chest": slotKey = "CHEST"; break;
    case "Leg": slotKey = "LEGS"; break;
    case "Boot": 
    case "Boots": slotKey = "BOOTS"; break;
    case "Weapon": slotKey = "MAINHAND"; break;
    case "Offhand": slotKey = "OFFHAND"; break;
    default: return;
  }
  // Equip the item
  member[slotKey] = item.name;
  updateStats();
  renderEquippedItems(memberKey);
  // Optionally, show a message or update stats display
  updateStatsDisplay();

   if (item.attack && item.attack !== "none") {
    // Check if attack is already in ATTACKS (by name and item source)
    const alreadyInInventory = ATTACKS.some(a => a.name === item.attack && a.sourceItem === item.name);
    if (!alreadyInInventory) {
      ATTACKS.push({
        id: Date.now() + Math.floor(Math.random()*1000), // unique id
        name: item.attack,
        image: item.image,
        magic: item.magic,
        strength: item.strength,
        equipped: false,
        sourceItem: item.name // Track which item gave this attack
      });
      renderAttacks();
    }
  }
}


function unequipItemFromMember(item, memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  // Find the slot this item goes in
  let slotKey = null;
  switch (item.slot) {
    case "Helmet": slotKey = "HELMET"; break;
    case "Chest": slotKey = "CHEST"; break;
    case "Leg": slotKey = "LEGS"; break;
    case "Boot":
    case "Boots": slotKey = "BOOTS"; break;
    case "Weapon": slotKey = "MAINHAND"; break;
    case "Offhand": slotKey = "OFFHAND"; break;
    default: return;
  }
  // Only unequip if this item is currently equipped
  if (member[slotKey] === item.name) {
    member[slotKey] = null;
    updateStats();
    renderEquippedItems(memberKey);
    updateStatsDisplay();

    for (let i = ATTACKS.length - 1; i >= 0; i--) {
      if (ATTACKS[i].sourceItem === item.name && !ATTACKS[i].equipped) {
        ATTACKS.splice(i, 1);
      }
    }
    renderAttacks();
  }
}



// Example attack inventory (should be loaded from save or backend in a real app)
const ATTACKS = [
  { id: 1, name: "Grim Slice", image: "Items/demonSythe.png", magic: 10, strength: 20, equipped: true },
  { id: 2, name: "Force Strike", image: "Items/energySaber.png", magic: 5, strength: 15, equipped: true },
  { id: 3, name: "Leaf Impale", image: "Items/grassStaff.png", magic: 8, strength: 5, equipped: false },
  { id: 4, name: "Plasma Blast", image: "Items/grimoire.png", magic: 15, strength: 2, equipped: false },
];


function getEquippedAttacks(memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  const slots = ['HELMET', 'CHEST', 'LEGS', 'BOOTS', 'MAINHAND', 'OFFHAND'];
  const attacks = [];

  for (const slot of slots) {
    const itemName = member[slot];
    if (itemName) {
      // Find the item in INVENTORY by name
      const item = INVENTORY.find(i => i.name === itemName);
      if (item && item.attack && item.attack !== "none") {
        attacks.push({
          name: item.attack,
          itemName: item.name,
          ...ATTACK_STATS[item.attack]
        });
      }
    }
  }
  return attacks;
}


// Render equipped and inventory attacks
/*function renderAttacks() {
  const equippedContainer = document.querySelectorAll('[id^="equip-attack-"]');
  const invContainer = document.querySelectorAll('[id^="inv-attack-"]');

  // Get equipped and unequipped attacks
  const equipped = ATTACKS.filter(a => a.equipped);
  const unequipped = ATTACKS.filter(a => !a.equipped);

  // Render equipped attacks
  equippedContainer.forEach((el, i) => {
    if (equipped[i]) {
      el.innerHTML = `<img src="${equipped[i].image}" style="width:10%">${equipped[i].name} Magic: ${equipped[i].magic} Strength: ${equipped[i].strength}`;
      el.onclick = () => unequipAttack(equipped[i].id);
      el.style.display = '';
    } else {
      el.innerHTML = '';
      el.style.display = 'none';
    }
  });

  // Render unequipped attacks
  invContainer.forEach((el, i) => {
    if (unequipped[i]) {
      el.innerHTML = `<img src="${unequipped[i].image}" style="width:10%">${unequipped[i].name} Magic: ${unequipped[i].magic} Strength: ${unequipped[i].strength}`;
      el.onclick = () => equipAttack(unequipped[i].id);
      el.style.display = '';
    } else {
      el.innerHTML = '';
      el.style.display = 'none';
    }
  });
}*/

function renderAttacks(memberKey = 'ONE') {
  const attacks = getEquippedAttacks(memberKey);
  const attackContainer = document.getElementById('equipped-attacks');
  if (!attackContainer) return;

  attackContainer.innerHTML = '';
  if (attacks.length === 0) {
    attackContainer.innerHTML = '<div>No attacks equipped.</div>';
    return;
  }

  attacks.forEach(atk => {
    attackContainer.innerHTML += `
      <div class="attack-entry">
        <strong>${atk.name}</strong> (from ${atk.itemName})<br>
        Str x${atk.strMultiplier}, Magic x${atk.magicMultiplier}, Status: ${atk.status}
      </div>
    `;
  });
}

function equipAttack(id) {
  // Max 5 equipped
  if (ATTACKS.filter(a => a.equipped).length >= 5) return;
  const atk = ATTACKS.find(a => a.id === id);
  if (atk) atk.equipped = true;
  renderAttacks();
}

function unequipAttack(id) {
  const atk = ATTACKS.find(a => a.id === id);
  if (atk) atk.equipped = false;
  renderAttacks();
}

// --- Stats Update ---

function updateStatsDisplay() {
  // Use the first party member for stats
  if (typeof PARTY_STATS === 'undefined' || typeof updateStats !== 'function') return;
  updateStats();
  const member = PARTY_STATS['ONE'];
  const statsDiv = document.getElementById('total-stats');
  if (statsDiv && member) {
    statsDiv.textContent =
      `Health: ${member.MAX_HEALTH}; Strength: ${member.STRENGTH}; Magic: ${member.MAGIC}; Speed: ${member.SPEED}; Defense: ${member.DEFENSE};`;
  }
}

// --- Initialize on load ---
window.addEventListener('DOMContentLoaded', () => {
  renderAttacks();
  renderInventory();
});

// ...existing code...

function generateAndShowItem() {
  // You can set the level however you want, here it's random between 1 and 10
  const level = Math.floor(Math.random() * 10) + 1;
  generateRandomItem(level);
  renderInventory();
}
