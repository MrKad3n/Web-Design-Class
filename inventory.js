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
  `;

  document.getElementById("equip-btn").onclick = function() {
    equipItemToMember(item);
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
}

// Example attack inventory (should be loaded from save or backend in a real app)
const ATTACKS = [
  { id: 1, name: "Grim Slice", image: "Items/demonSythe.png", magic: 10, strength: 20, equipped: true },
  { id: 2, name: "Force Strike", image: "Items/energySaber.png", magic: 5, strength: 15, equipped: true },
  { id: 3, name: "Leaf Impale", image: "Items/grassStaff.png", magic: 8, strength: 5, equipped: false },
  { id: 4, name: "Plasma Blast", image: "Items/grimoire.png", magic: 15, strength: 2, equipped: false },
];

// Render equipped and inventory attacks
function renderAttacks() {
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
