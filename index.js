// Index system for tracking collected items
const INDEX_SAVE_KEY = 'dungeonGame_itemIndex';

// Load collected items from localStorage
function loadItemIndex() {
    try {
        const raw = localStorage.getItem(INDEX_SAVE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load item index', e);
        return {};
    }
}

// Save collected items to localStorage
function saveItemIndex(index) {
    try {
        localStorage.setItem(INDEX_SAVE_KEY, JSON.stringify(index));
    } catch (e) {
        console.error('Failed to save item index', e);
    }
}

// Register an item as collected
function registerItemCollected(itemName) {
    const index = loadItemIndex();
    if (!index[itemName]) {
        index[itemName] = {
            name: itemName,
            collectedAt: Date.now(),
            timesCollected: 1
        };
    } else {
        index[itemName].timesCollected++;
    }
    saveItemIndex(index);
}

// Check if item has been collected
function isItemCollected(itemName) {
    const index = loadItemIndex();
    return !!index[itemName];
}

// Rarity order for display
const RARITY_ORDER = ['Base', 'Starter', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Mythic', 'Artifact', 'Divine'];

// Get rarity color
function getRarityColor(rarity) {
    const colors = {
        'Base': '#666666',
        'Starter': '#808080',
        'Common': '#a0a0a0',
        'Uncommon': '#1eff00',
        'Rare': '#0070dd',
        'Epic': '#a335ee',
        'Legendary': '#ff8000',
        'Mythical': '#e91e63',
        'Mythic': '#e91e63',
        'Artifact': '#00ffff',
        'Divine': '#ffd700'
    };
    return colors[rarity] || '#ffffff';
}

// Switch between different indexes
function switchIndex(indexType) {
    if (indexType === 'items') {
        renderItemsIndex();
    }
    // Future: enemies, bosses, etc.
}

// Render the items index
function renderItemsIndex() {
    const container = document.getElementById('items-index');
    if (!container) return;

    const collectedItems = loadItemIndex();
    
    // Group items by rarity
    const itemsByRarity = {};
    RARITY_ORDER.forEach(rarity => {
        itemsByRarity[rarity] = [];
    });

    // Populate items from ITEM_TABLE
    if (typeof ITEM_TABLE !== 'undefined') {
        for (const itemName in ITEM_TABLE) {
            const item = ITEM_TABLE[itemName];
            const rarity = item.rarity || 'Common';
            if (itemsByRarity[rarity]) {
                itemsByRarity[rarity].push({
                    name: itemName,
                    data: item,
                    collected: isItemCollected(itemName)
                });
            }
        }
    }

    // Build HTML
    let html = '';
    RARITY_ORDER.forEach(rarity => {
        const items = itemsByRarity[rarity];
        if (items.length === 0) return;

        html += `
            <div class="rarity-section">
                <div class="rarity-header ${rarity.toLowerCase()}">${rarity}</div>
                <div class="items-grid">
        `;

        items.forEach(item => {
            const color = getRarityColor(rarity);
            const cardClass = item.collected ? 'obtained' : 'locked';
            const imgSrc = item.data.image || 'Assests/empty-slot.png';
            
            html += `
                <div class="item-card ${cardClass}" 
                     style="border-color: ${color}; color: ${color}"
                     data-item-name="${item.name}"
                     data-collected="${item.collected}">
                    <img src="${imgSrc}" alt="${item.collected ? item.name : '???'}">
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Add event listeners to all item cards after DOM update
    setTimeout(() => {
        const itemCards = document.querySelectorAll('.item-card');
        itemCards.forEach(card => {
            const itemName = card.dataset.itemName;
            const collected = card.dataset.collected === 'true';
            
            card.addEventListener('mouseenter', (e) => {
                showTooltip(e, itemName, collected);
            });
            card.addEventListener('mousemove', moveTooltip);
            card.addEventListener('mouseleave', hideTooltip);
            card.addEventListener('click', () => showItemDetails(itemName, collected));
        });
    }, 0);
}

// Show tooltip on hover
function showTooltip(event, itemName, collected) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    if (!collected) {
        tooltip.innerHTML = `
            <strong style="color: #666;">???</strong><br>
            <span style="color: #888;">Not yet discovered</span>
        `;
    } else {
        const item = ITEM_TABLE[itemName];
        if (!item) {
            return;
        }
        
        const color = getRarityColor(item.rarity);
        tooltip.style.borderColor = color;
        tooltip.innerHTML = `
            <strong style="color: ${color};">${itemName}</strong><br>
            <span style="color: #aaa;">${item.slot || 'Unknown'}</span>
        `;
    }

    moveTooltip(event);
    tooltip.classList.add('visible');
}

// Move tooltip with cursor
function moveTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// Calculate item stats at a specific level
function calculateItemStats(item, level) {
    // Use the same scaling formula as generateRandomItem: level^0.8
    const scale = Math.pow(level, 0.8);
    
    return {
        strength: Math.round((item.strength || 0) * scale),
        magic: Math.round((item.magic || 0) * scale),
        speed: Math.round((item.speed || 0) * scale),
        defense: Math.round((item.defense || 0) * scale),
        health: Math.round((item.health || 0) * scale)
    };
}

// Get ability description
function getAbilityDescription(abilityNum) {
    const descriptions = {
        1: "Bleed - Each attack applies bleed status (stacks with attack bleed)",
        2: "Coral - Consecutive attacks deal +20% bonus damage per turn (max 80%)",
        3: "Magi Reflect - Reflect 10% of magic damage if you survive magic attacks",
        4: "Spikes - Counter attacks with 20% STR damage + apply bleed",
        5: "Plasma - Every attack grants random status effect",
        6: "Carried - Stats buffed 20% per ally over 3, -40% per ally under 3",
        7: "Overuse - Consecutive attacks deal 200% bonus damage but 20% recoil",
        8: "Burn - Set ground aflame for 35% magic damage/turn (3 turns)",
        10: "MultiStrike - Attack twice when using this item's attack",
        12: "After Shock - Next enemy attack ignored after hitting (2 turn cooldown)",
        13: "Pixel Combo - 50% damage initially, mini-game to chain attacks (100% after 8 combos)",
        17: "Perfectly Timed - 50% chance to critically strike for 150% damage",
        19: "Enhance - Each attack boosts stats by item's stats with decay (100%, 90%, 81%, ...)",
        20: "Spell Shield - Add 25% of magic stat as bonus defense",
        21: "Sea Shield - Immune to leech, burn, and chill status effects"
    };
    return descriptions[abilityNum] || 'No special ability';
}

// Get attack description
function getAttackDescription(attackName) {
    if (!attackName || attackName === 'none') return 'No attack granted';
    
    if (typeof ATTACK_STATS !== 'undefined' && ATTACK_STATS[attackName]) {
        const attack = ATTACK_STATS[attackName];
        let desc = `${attackName}: `;
        if (attack.strMultiplier > 0) desc += `${attack.strMultiplier}x STR `;
        if (attack.magicMultiplier > 0) desc += `${attack.magicMultiplier}x MAG `;
        if (attack.status && attack.status !== 'none') desc += `+ ${attack.status} status`;
        return desc;
    }
    
    return attackName;
}

// Show item details modal
function showItemDetails(itemName, collected) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;

    if (!collected) {
        // Show locked view
        const color = '#666';
        modalContent.style.borderColor = color;
        modalBody.innerHTML = `
            <div class="locked-content">
                <h3>???</h3>
                <p>Obtain this item by completing battles and exploring dungeons.</p>
                <p style="margin-top: 20px; color: #aaa; font-size: 0.9em;">This item can be found as a random drop on any level.</p>
            </div>
        `;
    } else {
        // Show full item details
        const item = ITEM_TABLE[itemName];
        if (!item) return;

        const color = getRarityColor(item.rarity);
        modalContent.style.borderColor = color;

        // Calculate stats at different levels
        const stats1 = calculateItemStats(item, 1);
        const stats10 = calculateItemStats(item, 10);
        const stats25 = calculateItemStats(item, 25);
        const stats50 = calculateItemStats(item, 50);
        const stats100 = calculateItemStats(item, 100);

        let html = `
            <div class="modal-header">
                <h2 style="color: ${color};">${itemName}</h2>
                <div class="item-slot">${item.slot || 'Unknown Slot'} • ${item.rarity || 'Common'}</div>
            </div>

            <div class="modal-image">
                <img src="${item.image || 'Assests/empty-slot.png'}" 
                     alt="${itemName}"
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
                        <td><strong>Health</strong></td>
                        <td>${stats1.health}</td>
                        <td>${stats10.health}</td>
                        <td>${stats25.health}</td>
                        <td>${stats50.health}</td>
                        <td>${stats100.health}</td>
                    </tr>
                </tbody>
            </table>
        `;

        // Ability section
        if (item.ability && item.ability > 0) {
            html += `
                <div class="ability-section">
                    <div class="section-title">⚡ Special Ability</div>
                    <p style="color: #ffcc00; font-size: 1.1em;">${getAbilityDescription(item.ability)}</p>
                </div>
            `;
        }

        // Attack section
        if (item.attack && item.attack !== 'none') {
            html += `
                <div class="attack-section">
                    <div class="section-title">⚔️ Granted Attack</div>
                    <p style="font-size: 1.1em;">${getAttackDescription(item.attack)}</p>
                </div>
            `;
        }

        // Obtain information
        const obtainText = itemName === 'Divine Crown' 
            ? 'Currently unobtainable - future content'
            : 'Obtained as a random drop from completing any battle';

        html += `
            <div class="obtain-section">
                <div class="section-title">📍 How to Obtain</div>
                <p style="font-size: 1.1em; color: #aaa;">${obtainText}</p>
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

// Register all existing inventory items (for existing saves)
function registerExistingItems() {
    if (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) {
        INVENTORY.forEach(item => {
            if (item && item.name) {
                registerItemCollected(item.name);
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    registerExistingItems();
    renderItemsIndex();
});
