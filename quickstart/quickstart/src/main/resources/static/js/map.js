// map.js
class MapGrid {
    static ROWS = 10;
    static COLS = 10;

    static init() {
        const mapContainer = document.getElementById('map-container');
        const mapGrid = document.createElement('div');
        mapGrid.id = 'map-grid';
        mapGrid.className = 'w3-container';
        
        // Generate grid cells
        for (let row = 0; row < this.ROWS; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'w3-row';
            
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.createCell(row, col);
                rowDiv.appendChild(cell);
            }
            
            mapGrid.appendChild(rowDiv);
        }
        
        mapContainer.appendChild(mapGrid);
        this.bindCellEvents();
    }

    static createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'w3-col m1 w3-center grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = `${row},${col}`;
        return cell;
    }

    static bindCellEvents() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const row = cell.dataset.row;
                const col = cell.dataset.col;
                this.handleCellClick(row, col);
            });
        });
    }

    static handleCellClick(row, col) {
        fetch(`/map/select?row=${row}&col=${col}`)
            .then(response => response.json())
            .then(data => {
                if (data.battle) {
                    window.location.href = '/battle';
                } else {
                    this.showHexInfo(data);
                }
            });
    }

    static showHexInfo(hexData) {
        const popup = document.getElementById('hex-popup');
        popup.innerHTML = `
            <h3>${hexData.type} Hex</h3>
            <p>Coordinates: ${hexData.row},${hexData.col}</p>
            <button onclick="enterBattle(${hexData.row},${hexData.col})" 
                    class="w3-button w3-green">
                Enter
            </button>
        `;
        popup.classList.remove('hidden');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map-container')) {
        MapGrid.init();
    }
});