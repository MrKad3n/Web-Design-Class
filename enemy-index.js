// Enemy Index system for tracking encountered enemies
const ENEMY_INDEX_SAVE_KEY = 'dungeonGame_enemyIndex';

// Load encountered enemies from localStorage
function loadEnemyIndex() {
    try {
        const raw = localStorage.getItem(ENEMY_INDEX_SAVE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load enemy index', e);
        return {};
    }
}

// Save encountered enemies to localStorage
function saveEnemyIndex(index) {
    try {
        localStorage.setItem(ENEMY_INDEX_SAVE_KEY, JSON.stringify(index));
    } catch (e) {
        console.error('Failed to save enemy index', e);
    }
}

// Register an enemy as encountered
function registerEnemyEncountered(enemyName) {
    const index = loadEnemyIndex();
    if (!index[enemyName]) {
        index[enemyName] = {
            name: enemyName,
            encounteredAt: Date.now(),
            timesEncountered: 1,
            timesDefeated: 0
        };
    } else {
        index[enemyName].timesEncountered++;
    }
    saveEnemyIndex(index);
}

// Register an enemy defeat
function registerEnemyDefeated(enemyName) {
    let index = loadEnemyIndex();
    if (!index[enemyName]) {
        registerEnemyEncountered(enemyName);
        index = loadEnemyIndex(); // Reload index after registering encounter
    }
    index[enemyName].timesDefeated = (index[enemyName].timesDefeated || 0) + 1;
    saveEnemyIndex(index);
}

// Check if enemy has been encountered
function isEnemyEncountered(enemyName) {
    const index = loadEnemyIndex();
    return !!index[enemyName];
}

// Tier order for display
const TIER_ORDER = [1, 2, 3, 4, 5, 6, 'unknown', 7];

// Get tier color
function getTierColor(tier) {
    const colors = {
        1: '#4a4a4a',
        2: '#1eff00',
        3: '#0070dd',
        4: '#a335ee',
        5: '#ff8000',
        6: '#e91e63',
        'unknown': '#00ffff',
        7: '#ff0000'
    };
    return colors[tier] || '#ffffff';
}

// Get tier name
function getTierName(tier) {
    const names = {
        1: 'Tier 1 - Common',
        2: 'Tier 2 - Uncommon',
        3: 'Tier 3 - Rare',
        4: 'Tier 4 - Elite',
        5: 'Tier 5 - Mini-Boss',
        6: 'Tier 6 - Legendary',
        'unknown': 'Unknown - Mysterious Entities',
        7: 'Tier 7 - Ancient'
    };
    return names[tier] || `Tier ${tier}`;
}

// Calculate enemy stats at a specific level
function calculateEnemyStats(enemy, level) {
    // Use the same scaling formula as battle.html: level^0.9
    const scale = Math.pow(level, 0.9);
    
    return {
        health: Math.round((enemy.health || 0) * scale),
        strength: Math.round((enemy.strength || 0) * scale),
        magic: Math.round((enemy.magic || 0) * scale),
        speed: Math.round((enemy.speed || 0) * scale),
        defense: Math.round((enemy.defense || 0) * scale),
        mana: enemy.mana || 100 // Mana doesn't scale with level
    };
}

// Render the enemies index
function renderEnemiesIndex() {
    const container = document.getElementById('enemies-index');
    if (!container) return;

    const encounteredEnemies = loadEnemyIndex();
    
    // Group enemies by tier
    const enemiesByTier = {};
    TIER_ORDER.forEach(tier => {
        enemiesByTier[tier] = [];
    });

    // Populate enemies from ENEMY_BASE_STATS
    if (typeof ENEMY_BASE_STATS !== 'undefined') {
        for (const enemyName in ENEMY_BASE_STATS) {
            const enemy = ENEMY_BASE_STATS[enemyName];
            const tier = enemy.tier || 1;
            if (enemiesByTier[tier]) {
                enemiesByTier[tier].push({
                    name: enemyName,
                    data: enemy,
                    encountered: isEnemyEncountered(enemyName)
                });
            }
        }
    }

    // Build HTML
    let html = '';
    TIER_ORDER.forEach(tier => {
        const enemies = enemiesByTier[tier];
        if (enemies.length === 0) return;

        html += `
            <div class="tier-section">
                <div class="tier-header tier-${tier}">${getTierName(tier)}</div>
                <div class="enemies-grid">
        `;

        enemies.forEach(enemy => {
            const color = getTierColor(tier);
            const cardClass = enemy.encountered ? 'obtained' : 'locked';
            const imgSrc = enemy.data.image || 'Enemies/unknown.png';
            
            html += `
                <div class="enemy-card ${cardClass}" 
                     style="border-color: ${color}; color: ${color}"
                     data-enemy-name="${enemy.name}"
                     data-encountered="${enemy.encountered}">
                    <img src="${imgSrc}" alt="${enemy.encountered ? enemy.name : '???'}">
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Add event listeners to all enemy cards after DOM update
    setTimeout(() => {
        const enemyCards = document.querySelectorAll('.enemy-card');
        enemyCards.forEach(card => {
            const enemyName = card.dataset.enemyName;
            const encountered = card.dataset.encountered === 'true';
            
            card.addEventListener('mouseenter', (e) => {
                showEnemyTooltip(e, enemyName, encountered);
            });
            card.addEventListener('mousemove', moveEnemyTooltip);
            card.addEventListener('mouseleave', hideEnemyTooltip);
            card.addEventListener('click', () => showEnemyDetails(enemyName, encountered));
        });
    }, 0);
}

// Show tooltip on hover
function showEnemyTooltip(event, enemyName, encountered) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    if (!encountered) {
        tooltip.innerHTML = `
            <strong style="color: #666;">???</strong><br>
            <span style="color: #888;">Not yet encountered</span>
        `;
        tooltip.style.borderColor = '#666';
    } else {
        const enemy = ENEMY_BASE_STATS[enemyName];
        if (!enemy) return;
        
        const color = getTierColor(enemy.tier);
        tooltip.style.borderColor = color;
        tooltip.innerHTML = `
            <strong style="color: ${color};">${enemyName.replace(/_/g, ' ')}</strong><br>
            <span style="color: #aaa;">Tier ${enemy.tier}</span>
        `;
    }

    moveEnemyTooltip(event);
    tooltip.classList.add('visible');
}

// Move tooltip with cursor
function moveEnemyTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
}

// Hide tooltip
function hideEnemyTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// Show enemy details modal
function showEnemyDetails(enemyName, encountered) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;

    if (!encountered) {
        // Show locked view
        const color = '#666';
        modalContent.style.borderColor = color;
        modalBody.innerHTML = `
            <div class="locked-content">
                <h3>???</h3>
                <p>Encounter this enemy by exploring dungeons and completing battles.</p>
                <p style="margin-top: 20px; color: #aaa; font-size: 0.9em;">This enemy can be found in various battle encounters.</p>
            </div>
        `;
    } else {
        // Show full enemy details
        const enemy = ENEMY_BASE_STATS[enemyName];
        if (!enemy) return;

        const color = getTierColor(enemy.tier);
        modalContent.style.borderColor = color;

        // Calculate stats at different levels
        const stats1 = calculateEnemyStats(enemy, 1);
        const stats10 = calculateEnemyStats(enemy, 10);
        const stats25 = calculateEnemyStats(enemy, 25);
        const stats50 = calculateEnemyStats(enemy, 50);
        const stats100 = calculateEnemyStats(enemy, 100);

        // Get encounter stats
        const index = loadEnemyIndex();
        const encounterData = index[enemyName] || {};
        const timesEncountered = encounterData.timesEncountered || 0;
        const timesDefeated = encounterData.timesDefeated || 0;

        let html = `
            <div class="modal-header">
                <h2 style="color: ${color};">${enemyName.replace(/_/g, ' ')}</h2>
                <div class="enemy-tier">${getTierName(enemy.tier)}</div>
            </div>

            <div class="modal-image">
                <img src="${enemy.image || 'Enemies/unknown.png'}" 
                     alt="${enemyName}"
                     style="border-color: ${color}; box-shadow: 0 0 20px ${color};">
            </div>

            <table class="stat-table">
                <thead>
                    <tr>
                        <th>Stat</th>
                        <th>Level 1</th>
                        <th>Level 10</th>
                        <th>Level 25</th>
                        <th>Level 50</th>
                        <th>Level 100</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Health</strong></td>
                        <td>${stats1.health}</td>
                        <td>${stats10.health}</td>
                        <td>${stats25.health}</td>
                        <td>${stats50.health}</td>
                        <td>${stats100.health}</td>
                    </tr>
                    <tr>
                        <td><strong>Strength</strong></td>
                        <td>${stats1.strength}</td>
                        <td>${stats10.strength}</td>
                        <td>${stats25.strength}</td>
                        <td>${stats50.strength}</td>
                        <td>${stats100.strength}</td>
                    </tr>
                    <tr>
                        <td><strong>Magic</strong></td>
                        <td>${stats1.magic}</td>
                        <td>${stats10.magic}</td>
                        <td>${stats25.magic}</td>
                        <td>${stats50.magic}</td>
                        <td>${stats100.magic}</td>
                    </tr>
                    <tr>
                        <td><strong>Speed</strong></td>
                        <td>${stats1.speed}</td>
                        <td>${stats10.speed}</td>
                        <td>${stats25.speed}</td>
                        <td>${stats50.speed}</td>
                        <td>${stats100.speed}</td>
                    </tr>
                    <tr>
                        <td><strong>Defense</strong></td>
                        <td>${stats1.defense}</td>
                        <td>${stats10.defense}</td>
                        <td>${stats25.defense}</td>
                        <td>${stats50.defense}</td>
                        <td>${stats100.defense}</td>
                    </tr>
                    <tr>
                        <td><strong>Mana</strong></td>
                        <td colspan="5">${stats1.mana}</td>
                    </tr>
                    <tr>
                        <td><strong>Health Bars</strong></td>
                        <td colspan="5">${enemy.hBars || 1}</td>
                    </tr>
                </tbody>
            </table>
        `;

        // Special effect section
        if (enemy.specialEffect) {
            html += `
                <div class="special-section">
                    <div class="section-title">⚡ Special Ability</div>
                    <p style="color: #ffcc00; font-size: 1.1em;">${enemy.specialEffect}</p>
                </div>
            `;
        }

        // Encounter statistics
        html += `
            <div class="encounter-section">
                <div class="section-title">📊 Encounter Statistics</div>
                <p style="font-size: 1.1em;">
                    <strong>Times Encountered:</strong> ${timesEncountered}<br>
                    <strong>Times Defeated:</strong> ${timesDefeated}
                </p>
            </div>
        `;

        modalBody.innerHTML = html;
    }

    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderEnemiesIndex();
});
