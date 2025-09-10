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
}

function renderInventory() {
  const inventoryContainer = document.getElementById('inventory-list');
  if (!inventoryContainer) return;

  inventoryContainer.innerHTML = '';
  INVENTORY.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.innerHTML = `
      <strong>${item.name}</strong> (Lvl ${item.level})<br>
      Strength: ${item.strength}, Speed: ${item.speed}, Magic: ${item.magic}, Defense: ${item.defense}, Health: ${item.health}
    `;
    inventoryContainer.appendChild(itemDiv);
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
  `;
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
  updateStatsDisplay();
  renderInventory();
});

// ...existing code...

// Render inventory items

// Call this after generating a new item
// Example: 
// generateRandomItem(5);
// renderInventory();

// Optionally, call renderInventory() on page load

// ...existing code...