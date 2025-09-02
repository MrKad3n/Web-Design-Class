const inventory = document.getElementById("inventory");
const rows=10;
const cols=5;

const inventoryData=[];

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const slot = document.createElement("div");
    cell.className = "inv-slot";
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.textContent = "s";
    //want a image from folder called Assests and the image is empty-slot.png to appear if there is no data for that slot

    const key = row+col;
    

    
    }
}