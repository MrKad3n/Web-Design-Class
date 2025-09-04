const map = document.getElementById("map");
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
      tile.enemyTwo = "Enemies/skull.png";
      tile.enemyThree = "Enemies/skull.png";
    } else if (level === pathLength) {
      tile.title = "Boss";
      tile.description = "You've finally reached it.";
      tile.cleared = false;
      tile.status = false;
      tile.enemyOne = "Enemies/shadow.png";
    } else if (level === pathLength - 1) {
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
      tile.enemyThree = "Enemies/alien.png";
    } else {
      tile.title = "Basic";
      tile.description = `A path leads you deeper into the dungeon.`;
      tile.cleared = false;
      tile.status = false;
      tile.enemyOne = "Enemies/skull.png";
      tile.enemyTwo = "Enemies/slime.png";
      tile.enemyThree = null;
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