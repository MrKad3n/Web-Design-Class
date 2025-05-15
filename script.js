const map = document.getElementById("map");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");

// Generate 50x50 grid
<<<<<<< HEAD
const rows = 13;
const cols = 13;
=======
const rows = 20;
const cols = 20;
>>>>>>> 877367ffc50ec594070a86a12d7b4d1112326c07

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.textContent = `${row},${col}`;

    cell.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent closing popup from body click
      openPopup(`You clicked on tile [${row}, ${col}]`);
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
