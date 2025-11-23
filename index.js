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
        skill: item.skill || 0, // Skill doesn't scale with level
        defense: Math.round((item.defense || 0) * scale),
        health: Math.round((item.health || 0) * scale),
        mana: item.mana || 0 // Mana doesn't scale with level
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
        21: "Sea Shield - Immune to leech, burn, and chill status effects",
        22: "Fury - Deal +10% damage per 10% HP missing (max +90% at 10% HP)",
        23: "Temporal Shift - 30% chance to take two turns in a row",
        24: "Execute - Deal 300% damage to enemies below 25% HP",
        25: "Meteor Strike - 20% chance to deal 200% AOE damage to all enemies",
        26: "Death's Touch - Attacks instantly kill enemies below 15% HP",
        27: "Annihilation - Each kill permanently increases all stats by +5% (resets after battle)",
        28: "Gravity Well - Reduce all enemy speed by 30% at battle start",
        29: "Corruption - Deal +50% damage to enemies with status effects",
        30: "Ethereal - 25% chance to dodge all damage from an attack",
        31: "Life Drain - Heal 20% of damage dealt to enemies (item attacks only)",
        32: "Berserker - Gain +5% damage per consecutive attack (max +50%)",
        33: "Arcane Surge - Casting magic restores 10% of mana cost",
        34: "Phoenix - Revive once per battle at 30% HP when killed",
        35: "Frozen Heart - 40% chance to freeze enemies hit for 1 turn (item attacks only)",
        36: "Thunder God - Lightning attacks chain to 2 random enemies for 50% damage (item attacks only)",
        37: "Vampiric - Heal 15% max HP on kill",
        38: "Shield Bash - Counter physical attacks with 30% defense as damage",
        39: "Mana Burn - Physical attacks drain 20% of enemy max mana",
        40: "Critical Mass - Every 5th attack deals 400% damage",
        41: "Time Warp - Reduce all cooldowns by 1 turn when attacking",
        42: "Soul Harvest - Gain +10 max HP permanently per kill",
        43: "Elemental Chaos - Attacks randomly deal fire, ice, or lightning damage (+30%)",
        44: "Reaper - Deal bonus damage equal to 5% of enemy max HP (item attacks only)",
        45: "Divine Intervention - Survive lethal damage once per battle at 1 HP",
        46: "Apocalypse - Deal 150% damage to all enemies when HP drops below 20%",
        47: "Sage's Wisdom - Restore 5% max mana to both players per turn",
        48: "Protective Aura - Allies (dual-player) take 15% less damage",
        49: "Versatility - Share 15% of your highest stat with ally",
        50: "Godslayer - Heal to full HP on kill (item attacks only)",
        51: "Balance - Grant both players +20% speed when fighting together",
        52: "Precognition - Grant ally +10% damage and +10% defense",
        53: "Regeneration - Restore 3% max HP to both players per turn",
        54: "Provoke - All enemies target you for 2 turns, +20% defense while active (item attack triggers)",
        55: "Rally - Grant all allies +15% to all stats for 3 turns (item attack triggers)",
        56: "Adaptive - Gain +20% to your highest stat, +10% to second highest at battle start",
        57: "Sunder - Attacks reduce enemy defense by 10% permanently, stacks 5 times (item attacks only)",
        58: "Martyrdom - 50% of ally damage is redirected to you instead",
        59: "Momentum - Gain +10% speed each turn, max +50% at turn 5 (resets after battle)",
        60: "Ward - You and allies are immune to one random status effect each battle",
        61: "Champion - Gain +25% all stats for each dead ally, max +50%",
        62: "Lifebond - You and one ally share HP pools, damage distributed evenly",
        63: "Insight - See enemy stats, allies gain +10% damage to analyzed targets (item attack triggers)",
        64: "Reshape - Create beneficial terrain: +15% team damage OR +15% team defense, chosen per battle (item attack triggers)",
        65: "Unity - Gain +15% to all stats for each living ally",
        
        // Set 4 Abilities
        66: "Combo Mastery - Each consecutive hit on same target increases damage by +20% up to +100% (item attacks only, resets if you miss or switch targets)",
        67: "Siphon - Steal 8% of target's highest stat temporarily for 3 turns (item attack triggers)",
        68: "Resurrection - Bring one fallen ally back to life with 40% HP (item attack triggers)",
        69: "Mirror Armor - Reflect 35% of all damage taken back to attackers",
        70: "Critical Momentum - Each critical hit increases crit chance by +5% up to +25% (resets after battle)",
        71: "Rapid Action - Reduce all ability cooldowns by 1 turn after each action",
        72: "Tri-Element - Attacks deal fire, ice, and lightning damage simultaneously (item attacks only)",
        73: "Blood Magic - Convert 15% of your current HP into bonus damage each attack (item attacks only)",
        74: "Guardian's Blessing - Auto-revive yourself at 50% HP on death once per battle, heal all allies for 25% HP when triggered",
        75: "Venomous - Apply poison stacks: 5% max HP damage per turn, stacks up to 5 times (item attacks only)",
        76: "Overcharge - For every 10 mana above max, gain +5% magic damage, max +50%",
        77: "Curse Reflection - Transfer all your debuffs to target on hit (item attack triggers)",
        78: "Weakpoint - Critical hits ignore 100% of enemy defense",
        79: "Summoner - Create a minion with 30% of your stats that attacks with you for 5 turns (item attack triggers)",
        80: "Leeching Aura - Drain 3% max HP from all enemies per turn, heal yourself for total amount drained",
        81: "Enrage - Damage scales with missing HP: +2% per 1% missing HP up to +200% at 1% HP",
        82: "Chronobreak - Critical hits undo enemy's last action and restore your HP by 20% (item attacks only)",
        83: "Fortify - Gain +5% defense each time you take damage, max +50% (resets after battle)",
        84: "Soul Shackles - Reduce all enemy stats by 15%, enemies cannot use abilities while equipped",
        85: "Dual Strike - All attacks hit twice: second hit deals 60% damage (item attacks only)",
        86: "Overheal Shield - Healing beyond max HP creates shields (1:1 ratio), shields can stack up to 50% max HP",
        87: "Mana Barrier - Damage depletes mana before HP (1 damage = 2 mana), lose 50% magic damage while active",
        88: "Gravity Well - Pull all enemies to one location then attack hits all of them (item attack triggers)",
        89: "Lucky Strike - Increase all proc chances by +30%, crit chance by +15%",
        90: "Debilitating Aura - All enemies within range lose 10% to all stats passively",
        91: "Vengeance - Store 50% of damage taken, release it all on next attack (item attack triggers)",
        92: "Equilibrium - All your stats become equal to their average value at battle start",
        93: "Contagion - Your status effects spread to adjacent enemies after 1 turn (item attacks only)",
        94: "True Strike - Deal pure HP damage that ignores all defense, resistance, and shields (item attacks only)",
        95: "Speed Force - Gain 1 extra attack per 10 speed points, max +5 attacks per turn",
        
        // Skill-based weapon abilities
        96: "Penetrating Shot - Arrows ignore 50% of enemy defense",
        97: "Knockback - Attacks push enemies back and stun for 1 turn",
        98: "Ambush - Critical hits from full HP deal +100% damage",
        99: "Rapid Fire - Gain +1 attack per 15 skill points",
        100: "Eagle Vision - +10% crit chance, +20% crit damage",
        101: "Piercing Arrows - Attacks hit primary target and 2 adjacent enemies for 60% damage",
        102: "First Blood - First attack each battle deals 300% damage",
        103: "Arcane Bullets - Spend 10 mana per attack to add +50% magic damage to skill attacks"
    };
    return descriptions[abilityNum] || 'No special ability';
}

// Get attack description
function getAttackDescription(attackName) {
    if (!attackName || attackName === 'none') return 'No attack granted';
    
    if (typeof ATTACK_STATS !== 'undefined' && ATTACK_STATS[attackName]) {
        const attack = ATTACK_STATS[attackName];
        let desc = `${attackName}: `;
        
        // Show multipliers
        const parts = [];
        if (attack.strMultiplier > 0) parts.push(`${attack.strMultiplier}x STR`);
        if (attack.magicMultiplier > 0) parts.push(`${attack.magicMultiplier}x MAG`);
        if (attack.skillMultiplier > 0) parts.push(`${attack.skillMultiplier}x SKL`);
        if (parts.length > 0) desc += parts.join(' + ') + ' ';
        
        // Show costs/cooldown
        const costs = [];
        if (attack.manaCost > 0) costs.push(`${attack.manaCost} mana`);
        if (attack.cooldown > 0) costs.push(`${attack.cooldown} turn cooldown`);
        if (costs.length > 0) desc += `(${costs.join(', ')}) `;
        
        // Show status effect
        if (attack.status && attack.status !== 'none') desc += `+ ${attack.status} status`;
        
        // Show attack group
        if (attack.group) {
            const groupIcons = {
                'strength': '💪',
                'magic': '✨',
                'skill': '🎯',
                'hybrid': '⚔️',
                'utility': '🛠️'
            };
            const icon = groupIcons[attack.group] || '';
            desc += ` ${icon}`;
        }
        
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
                    ${stats1.skill > 0 ? `
                    <tr>
                        <td><strong>Skill</strong></td>
                        <td colspan="5">${stats1.skill}</td>
                    </tr>
                    ` : ''}
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
                    ${stats1.mana > 0 ? `
                    <tr>
                        <td><strong>Mana</strong></td>
                        <td colspan="5">${stats1.mana}</td>
                    </tr>
                    ` : ''}
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

        // Role/Playstyle section
        if (item.role) {
            html += `
                <div class="ability-section" style="background: rgba(233, 69, 96, 0.15); border-color: #e94560;">
                    <div class="section-title" style="color: #ff6b88;">💡 Best For</div>
                    <p style="font-size: 1.15em; color: #ffd4dc; line-height: 1.6;">${item.role}</p>
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
