const map = document.getElementById("map");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
//tiles data, only need tiles data for tiles needed, if there is no tile data for a tile then it is hiden/can't see put other tiles should not shift
const tileData = {
  "1,1": {
    title: "Start Tile",
    description: "This is the beginning of the map.",
    enemyOne: "Enemies/skull.png",
    enemyTwo: "Enemies/skull.png",
    enemyThree: "Enemies/skull.png"
  },
  "1,2": {
    title: "Basic",
    description: "You entered a forest area.",
    enemyOne: "Enemies/skull.png",
    enemyTwo: "Enemies/slime.png",
    enemyThree: "Enemies/alien.png"
  },
  "1,3": {
    title: "MiniBoss",
    description: "Rocky and cold up here.",
    enemyOne: "Enemies/slime.png",
    enemyTwo: "Enemies/slime.png",
    enemyThree: "Enemies/cursedKnight.png"
  },
  "1,4": {
    title: "Boss",
    description: "You Finally Reached it",
    enemyOne: "Enemies/shadow.png"
  }
};


// Generate 10x10 grid
const rows = 10;
const cols = 10;

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.textContent = `${row},${col}`;

    const key = `${row},${col}`;
    const data = tileData[key];

    // Hide cells without data from the start, but preserve layout
    if (!data) {
      cell.style.visibility = "hidden";
    }

cell.addEventListener("click", (e) => {
  e.stopPropagation();

  if (data) {
    const enemies = [
      data.enemyOne,
      data.enemyTwo,
      data.enemyThree
    ].filter(enemy => enemy); // Remove empty/undefined entries

    const enemiesHTML = enemies.map(enemy => 
      `<img src="${enemy}" alt="${data.title}" style="width:${100/enemies.length}%"/>`
    ).join('');

    const html = `
      <h3>${data.title}</h3>
      <p>${data.description}</p>
      <div>${enemiesHTML}</div>
    `;
    openPopup(html);
  }
});

    map.appendChild(cell);
  }
}


function openPopup(htmlContent) {
  popupContent.innerHTML = htmlContent;
  popup.style.display = "block";
}

function closePopup() {
  popup.style.display = "none";
}

function dungeonClick() {
  
}

// Close popup if clicking outside it
document.body.addEventListener("click", () => {
  closePopup();
});