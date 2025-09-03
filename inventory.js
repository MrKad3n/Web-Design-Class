const inventory = document.getElementById("inventory");
const rows = 10;
const cols = 5;

const inventoryData = [
  { id: 1, image: "Items/frostChest.png", name: "Frost Chestplate", strength: 15, magic: 5, speed: 10, health: 50, defense: 8, attack: 20, level: 1 },
  { id: 2, image: "Items/woodenSword.png", name: "Wooden Sword", strength: 2, magic: 12, speed: 3, health: 60, defense: 25, attack: 5, level: 1 },
  { id: 3, image: "Items/grimoire.png", name: "Grimoire", strength: 1, magic: 8, speed: 20, health: 30, defense: 2, attack: 3, level: 3 },
];

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const slot = document.createElement("div");
    slot.className = "inv-slot";
    slot.dataset.row = row;
    slot.dataset.col = col;

    const index = row * cols + col;

    const data = inventoryData[index];

    const img = document.createElement("img");
    img.className = "inv-img";
    
    if (data) {
      img.src = data.image;
      img.alt = data.name;
      slot.addEventListener('click', () => {
        displayItemInfo(data);
      });
    } else {
      // If no data, display the empty slot image
      img.src = "Assets/empty-slot.png";
      img.alt = "Empty Slot";
    }

    slot.appendChild(img);
    inventory.appendChild(slot);
  }
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