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
    image: "https://via.placeholder.com/100/00ff00"
  },
  "1,3": {
    title: "MiniBoss",
    description: "Rocky and cold up here.",
    image: "https://via.placeholder.com/100/0000ff"
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

    cell.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent closing popup from body click
    
      const key = `${row},${col}`;
      const data = tileData[key];
    
      if (data) {
        const html = `
          <h3>${data.title}</h3>
          <img src="${data.image}" alt="${data.title}" />
          <p>${data.description}</p>
          <button onclick="closePopup()">Close</button>
        `;
        openPopup(html);
      } else {
        openPopup(`<p>No data for tile [${row}, ${col}]</p>`);
      }
    });
    

    map.appendChild(cell);
  }
}

function openPopup(text) {
  popupContent.textContent = text;
  popup.style.display = "block";
}

function closePopup() {
  popup.style.display = "none";
}

// Close popup if clicking outside it
document.body.addEventListener("click", () => {
  closePopup();
});
