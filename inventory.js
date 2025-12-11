// Helper to get the selected member (from script.js)
function getSelectedMember() {
  return typeof SELECTED_MEMBER !== 'undefined' ? SELECTED_MEMBER : 'ONE';
}

// Sound effect helper
function playSoundEffect(soundName) {
  const musicEnabled = localStorage.getItem('musicEnabled') === 'true';
  if (!musicEnabled) return;
  
  const audio = new Audio(`audio/soundEffects/${soundName}.wav`);
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Could not play sound:', err));
}

const invRows = 5;
const invCols = 5;

let inventoryPage = 1; // 1-based page index
const maxPages = 5;
const slotsPerPage = invRows * invCols;
const totalSlots = maxPages * slotsPerPage; // 125 total slots

// Ensure each item has a stable slot index
function ensureItemSlots() {
  INVENTORY.forEach((item, idx) => {
    if (item && item.slotIndex === undefined) {
      item.slotIndex = idx;
    }
  });
}

function renderInventoryGrid() {
  const inventory = document.getElementById("inventory");
  if (!inventory) {
    console.error("Inventory element not found!");
    return;
  }
  inventory.innerHTML = "";
  
  ensureItemSlots();
  
  // Calculate start/end slot index for current page
  const startSlot = (inventoryPage - 1) * slotsPerPage;
  const endSlot = startSlot + slotsPerPage;
  
  // Create a map of slot positions to items (only unequipped items)
  const slotMap = {};
  INVENTORY.forEach(item => {
    if (item && !item.equipped && item.slotIndex !== undefined) {
      slotMap[item.slotIndex] = item;
    }
  });

  for (let row = 0; row < invRows; row++) {
    for (let col = 0; col < invCols; col++) {
      const slotIndex = startSlot + (row * invCols) + col;
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.dataset.row = row;
      slot.dataset.col = col;
      slot.dataset.slotIndex = slotIndex;

      const data = slotMap[slotIndex];
      const img = document.createElement("img");
      img.className = "inv-img";

      if (data) {
        img.src = data.image || "Assests/empty-slot.png";
        img.alt = data.name;
        // Add rarity color border
        if (data.rarity && typeof window.getRarityColor === 'function') {
          const rarityColor = window.getRarityColor(data.rarity);
          slot.style.border = `3px solid ${rarityColor}`;
          slot.style.boxShadow = `0 0 8px ${rarityColor}`;
        }
        slot.addEventListener('click', (e) => displayItemInfo(data, e));
      } else {
        img.src = "Assests/empty-slot.png";
        img.alt = "Empty Slot";
      }

      slot.appendChild(img);
      inventory.appendChild(slot);
    }
  }
  
  // Update pagination controls
  updatePaginationControls();
}

function updatePaginationControls() {
  let navDiv = document.getElementById('inventory-page-nav');
  const inventorySection = document.querySelector('.section-title');
  
  if (!navDiv && inventorySection) {
    navDiv = document.createElement('div');
    navDiv.id = 'inventory-page-nav';
    navDiv.style.cssText = 'display: inline-flex; gap: 10px; margin-left: 20px; align-items: center;';
    inventorySection.style.display = 'inline-block';
    inventorySection.parentNode.insertBefore(navDiv, inventorySection.nextSibling);
  }
  
  if (navDiv) {
    const unequippedCount = INVENTORY.filter(i => i && !i.equipped).length;
    const actualMaxPages = Math.max(1, Math.ceil(unequippedCount / slotsPerPage));
    
    navDiv.innerHTML = `
      <button id="prev-page-btn" class="nav-btn" style="padding: 6px 12px; font-size: 0.9em;">←</button>
      <span style="color: #e94560; font-weight: bold;">Page ${inventoryPage} / ${actualMaxPages}</span>
      <button id="next-page-btn" class="nav-btn" style="padding: 6px 12px; font-size: 0.9em;">→</button>
    `;
    
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    prevBtn.disabled = inventoryPage <= 1;
    nextBtn.disabled = inventoryPage >= actualMaxPages;
    
    prevBtn.onclick = () => {
      if (inventoryPage > 1) {
        inventoryPage--;
        renderInventory();
      }
    };
    
    nextBtn.onclick = () => {
      if (inventoryPage < actualMaxPages) {
        inventoryPage++;
        renderInventory();
      }
    };
  }
}

function renderInventory() {
  renderInventoryGrid();
  const memberKey = getSelectedMember();
  renderMemberNameInput(memberKey);
  renderEquippedItems(memberKey);
  updateStatsDisplay(memberKey);
  renderAttacks(memberKey);
}

function getItemImage(item) { return item && item.image ? item.image : "Assests/empty-slot.png"; }

function renderEquippedItems(memberKey = getSelectedMember()) {
  const member = PARTY_STATS[memberKey];
  const equipDiv = document.getElementById("equipped-items");
  if (!equipDiv) return;
  equipDiv.innerHTML = "";

  // --- CLASS GENERALIZATION LOGIC ---
  function getClassGeneralization(stats) {
    // Example logic: prioritize highest stat, then secondary, then defense/magic split
    const statNames = ["STRENGTH", "MAGIC", "DEFENSE", "SPEED", "SKILL"];
    const statLabels = {
      STRENGTH: "Warrior",
      MAGIC: "Mage",
      DEFENSE: "Guardian",
      SPEED: "Rogue",
      SKILL: "Specialist"
    };
    // Get stat values
    let statArr = statNames.map(s => ({ name: s, value: stats[s] || 0 }));
    statArr.sort((a, b) => b.value - a.value);
    const highest = statArr[0];
    const second = statArr[1];
    // Defensive Mage, Swift Warrior, etc.
    let label = statLabels[highest.name];
    // If second stat is close to highest, combine
    if (second.value > 0 && second.value >= 0.7 * highest.value) {
      label = `${statLabels[highest.name]} / ${statLabels[second.name]}`;
    }
    // If defense is highest, but magic is second, "Defensive Mage"
    if (highest.name === "DEFENSE" && second.name === "MAGIC") {
      label = "Defensive Mage";
    }
    // If magic is highest, but defense is second, "Defensive Mage"
    if (highest.name === "MAGIC" && second.name === "DEFENSE") {
      label = "Defensive Mage";
    }
    // If speed is highest, but strength is second, "Swift Warrior"
    if (highest.name === "SPEED" && second.name === "STRENGTH") {
      label = "Swift Warrior";
    }
    // If strength is highest, but speed is second, "Swift Warrior"
    if (highest.name === "STRENGTH" && second.name === "SPEED") {
      label = "Swift Warrior";
    }
    // If skill is highest, but magic is second, "Arcane Specialist"
    if (highest.name === "SKILL" && second.name === "MAGIC") {
      label = "Arcane Specialist";
    }
    // If skill is highest, but strength is second, "Battle Specialist"
    if (highest.name === "SKILL" && second.name === "STRENGTH") {
      label = "Battle Specialist";
    }
    return label;
  }

  // Display class generalization above equipped items
  const classDiv = document.createElement('div');
  classDiv.className = 'class-generalization';
  classDiv.style.fontWeight = 'bold';
  classDiv.style.fontSize = '1.2em';
  classDiv.style.marginBottom = '8px';
  classDiv.style.textAlign = 'center';
  classDiv.textContent = `Class: ${getClassGeneralization(member)}`;
  equipDiv.appendChild(classDiv);

  // --- EQUIPPED ITEMS DISPLAY ---
  const slots = ["HELMET","CHEST","LEGS","BOOTS","MAINHAND","OFFHAND"];
  slots.forEach(s => {
    const itemName = member[s];
    // Prefer the actual INVENTORY object that is marked equipped for this slot (handles duplicates)
    const item = (itemName ? INVENTORY.find(i => i.name === itemName && i.equipped) : null) || ITEM_TABLE[itemName] || null;
    const imgSrc = item && item.image ? item.image : "Assests/empty-slot.png";
    const slotDiv = document.createElement('div');
    slotDiv.className = 'equip-slot';
    slotDiv.innerHTML = `<div>${s}</div><img src="${imgSrc}" style="width:50px;height:50px"><div style="font-size:12px">${itemName||'Empty'}</div>`;
    // If there's an equipped item object, make the slot clickable to inspect/unequip it
    if (item) {
      slotDiv.style.cursor = 'pointer';
      slotDiv.addEventListener('click', () => {
        // Ensure we pass the inventory object when possible so equip/unequip work on the same reference
        const invItem = INVENTORY.find(i => i === item) || INVENTORY.find(i => (i._uid && item._uid && i._uid === item._uid)) || INVENTORY.find(i => i.name === item.name && i.equipped) || item;
        displayItemInfo(invItem);
      });
    }
    equipDiv.appendChild(slotDiv);
  });
}

function displayItemInfo(item) {
  const memberKey = getSelectedMember();
  // Remove any existing popup
  let oldPopup = document.getElementById('item-info-popup');
  if (oldPopup) oldPopup.remove();

  // Create popup div
  const popup = document.createElement('div');
  popup.id = 'item-info-popup';
  popup.style.position = 'absolute';
  popup.style.zIndex = '9999';
  popup.style.background = 'rgba(15,52,96,0.98)';
  popup.style.border = '2px solid #e94560';
  popup.style.borderRadius = '12px';
  popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
  popup.style.padding = '28px 24px 18px 24px';
  popup.style.minWidth = '320px';
  popup.style.maxWidth = '400px';
  popup.style.color = '#fff';
  popup.style.fontSize = '1.08em';
  popup.style.pointerEvents = 'auto';

  // Position popup to the right of the clicked item
  if (arguments.length > 1 && arguments[1] && arguments[1].target) {
    const rect = arguments[1].target.getBoundingClientRect();
    popup.style.top = `${rect.top + window.scrollY}px`;
    popup.style.left = `${rect.right + 16 + window.scrollX}px`;
  } else {
    popup.style.top = '120px';
    popup.style.left = '60vw';
  }
  const rarityColor = (item.rarity && typeof window.getRarityColor === 'function') ? window.getRarityColor(item.rarity) : '#ffffff';
  
  // Ability descriptions
  const abilityDescriptions = {
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
    88: "Gravity Hammer - Pull all enemies to one location then attack hits all of them (item attack triggers)",
    89: "Lucky Strike - Increase all proc chances by +30%, crit chance by +15%",
    90: "Debilitating Aura - All enemies within range lose 10% to all stats passively",
    91: "Vengeance - Store 50% of damage taken, release it all on next attack (item attack triggers)",
    92: "Equilibrium - All your stats become equal to their average value at battle start",
    93: "Contagion - Your status effects spread to adjacent enemies after 1 turn (item attacks only)",
    94: "True Strike - Deal pure HP damage that ignores all defense, resistance, and shields (item attacks only)",
    95: "Speed Force - Gain 1 extra attack per 10 speed points, max +5 attacks per turn",
    96: "Penetrating Shot - Arrows ignore 50% of enemy defense",
    97: "Knockback - Attacks push enemies back and stun for 1 turn",
    98: "Ambush - Critical hits from full HP deal +100% damage",
    99: "Rapid Fire - Gain +1 attack per 15 skill points",
    100: "Eagle Vision - +10% crit chance, +20% crit damage",
    101: "Piercing Arrows - Attacks hit primary target and 2 adjacent enemies for 60% damage",
    102: "First Blood - First attack each battle deals 300% damage",
    103: "Arcane Bullets - Spend 10 mana per attack to add +50% magic damage to skill attacks"
  };
  
  const abilityText = (item.ability && item.ability > 0 && abilityDescriptions[item.ability]) 
    ? `<p style="color: #ffcc00; font-weight: bold;">⚡ ${abilityDescriptions[item.ability]}</p>` 
    : '';
  
  const enchantText = item.enchantment 
    ? `<p style="color: #ff8c00; font-weight: bold;">✨ Enchanted: ${item.enchantment}</p>`
    : '';
  
  // Build item stats display with colors
  const statsHTML = `
    <div style="display: flex; flex-direction: column; gap: 6px; margin: 12px 0; font-size: 0.95em;">
      ${item.health ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255, 0, 0, 0.15); border-left: 3px solid #ff4444; border-radius: 3px;">
        <span style="color: #ff6666; font-weight: bold;">❤️ Health:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.health}</span>
      </div>` : ''}
      ${item.strength ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255, 100, 0, 0.15); border-left: 3px solid #ff6644; border-radius: 3px;">
        <span style="color: #ff8866; font-weight: bold;">⚔️ Strength:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.strength}</span>
      </div>` : ''}
      ${item.magic ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(100, 100, 255, 0.15); border-left: 3px solid #6666ff; border-radius: 3px;">
        <span style="color: #8888ff; font-weight: bold;">✨ Magic:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.magic}</span>
      </div>` : ''}
      ${item.speed ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255, 255, 0, 0.15); border-left: 3px solid #ffdd44; border-radius: 3px;">
        <span style="color: #ffee66; font-weight: bold;">⚡ Speed:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.speed}</span>
      </div>` : ''}
      ${item.defense ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(100, 200, 255, 0.15); border-left: 3px solid #66ccff; border-radius: 3px;">
        <span style="color: #88ddff; font-weight: bold;">🛡️ Defense:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.defense}</span>
      </div>` : ''}
      ${item.mana ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(0, 150, 255, 0.15); border-left: 3px solid #0096ff; border-radius: 3px;">
        <span style="color: #44aaff; font-weight: bold;">💧 Mana:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.mana}</span>
      </div>` : ''}
      ${item.skill ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255, 150, 255, 0.15); border-left: 3px solid #ff88ff; border-radius: 3px;">
        <span style="color: #ffaaff; font-weight: bold;">🎯 Skill:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.skill}</span>
      </div>` : ''}
      ${item.procChance ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(150, 255, 150, 0.15); border-left: 3px solid #66ff66; border-radius: 3px;">
        <span style="color: #88ff88; font-weight: bold;">🎲 Proc Chance:</span>
        <span style="color: #ffffff; font-weight: bold;">+${item.procChance}%</span>
      </div>` : ''}
      ${item.attack ? `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255, 200, 0, 0.15); border-left: 3px solid #ffcc00; border-radius: 3px;">
        <span style="color: #ffdd44; font-weight: bold;">⚔️ Attack:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.attack}</span>
      </div>` : ''}
    </div>
  `;
  
  popup.innerHTML = `
    <h3 style="color: ${rarityColor}; margin-top: 0;">${item.name} <span style="font-size: 0.8em; color: #aaa;">Level ${item.level||1}</span></h3>
    <img src="${item.image||'Assests/empty-slot.png'}" style="width:40%; display: block; margin: 12px auto; border: 3px solid ${rarityColor}; box-shadow: 0 0 8px ${rarityColor}; border-radius: 8px;">
    ${statsHTML}
    ${abilityText}
    ${enchantText}
    <div style="margin-top:12px; display: flex; gap: 8px;">
      <button id="equip-btn" style="
        flex: 1;
        padding: 10px 16px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: 2px solid #28a745;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
      " onmouseover="this.style.background='linear-gradient(135deg, #20c997 0%, #28a745 100%)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='linear-gradient(135deg, #28a745 0%, #20c997 100%)'; this.style.transform='scale(1)';">Equip</button>
      <button id="unequip-btn" style="
        flex: 1;
        padding: 10px 16px;
        background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
        color: white;
        border: 2px solid #ffc107;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
      " onmouseover="this.style.background='linear-gradient(135deg, #ff9800 0%, #ffc107 100%)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'; this.style.transform='scale(1)';">Unequip</button>
    </div>
    <button id="close-item-popup" style="position:absolute;top:8px;right:12px;background:#e94560;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:1em;">✖</button>
  `;
  document.body.appendChild(popup);
  const equipBtn = popup.querySelector('#equip-btn');
  const unequipBtn = popup.querySelector('#unequip-btn');
  
  // Determine equipped state: check item.equipped flag AND verify it's actually in a slot
  let isEquipped = item.equipped;
  if (isEquipped) {
    // Double-check: is this specific item (by ref/uid) in a slot?
    let foundInSlot = false;
    for (const mKey in PARTY_STATS) {
      const m = PARTY_STATS[mKey];
      if (!m) continue;
      ['HELMET','CHEST','LEGS','BOOTS','MAINHAND','OFFHAND'].forEach(s => {
        if (m[s] === item.name) {
          // Slot name matches; now verify the inventory item in INVENTORY with this name and equipped=true is THIS one
          const equippedInv = INVENTORY.find(i => i.name === item.name && i.equipped);
          if (equippedInv === item) {
            foundInSlot = true;
          }
        }
      });
    }
    isEquipped = foundInSlot;
  }
  if (isEquipped) {
    equipBtn.style.display = 'none';
    unequipBtn.style.display = 'inline-block';
  } else {
    equipBtn.style.display = 'inline-block';
    unequipBtn.style.display = 'none';
  }
  equipBtn.onclick = () => {
    equipItemToMember(item, memberKey);
  };
  unequipBtn.onclick = () => {
    unequipItemFromMember(item, memberKey);
  };
  
  // Add Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.cssText = `
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;
    border: 2px solid #dc3545;
    border-radius: 8px;
    padding: 10px 16px;
    margin-left: 8px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s;
  `;
  deleteBtn.onmouseover = () => {
    deleteBtn.style.background = 'linear-gradient(135deg, #c82333 0%, #dc3545 100%)';
    deleteBtn.style.transform = 'scale(1.05)';
  };
  deleteBtn.onmouseout = () => {
    deleteBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    deleteBtn.style.transform = 'scale(1)';
  };
  deleteBtn.style.color = 'white';
  deleteBtn.style.marginLeft = '8px';
  deleteBtn.onclick = () => {
    // Store the slot index before removing
    const deletedSlotIndex = item.slotIndex;
    
    // Remove from INVENTORY array
    const idx = INVENTORY.indexOf(item);
    if (idx > -1) {
      INVENTORY.splice(idx, 1);
    }
    // If it was equipped, unequip from all members
    if (item.equipped) {
      for (const mKey in PARTY_STATS) {
        const m = PARTY_STATS[mKey];
        if (!m) continue;
        ['HELMET','CHEST','LEGS','BOOTS','MAINHAND','OFFHAND'].forEach(s => {
          if (m[s] === item.name) {
            m[s] = null;
          }
        });
        // Remove attacks from this item for every member
        if (typeof PARTY_ATTACKS !== 'undefined' && PARTY_ATTACKS[mKey]) {
          // Remove by UID if possible
          if (item._uid) removeAttackBySourceUid(item._uid, mKey);
          // Also remove by item name in case UID is missing
          if (item.attack && item.attack !== 'none') {
            removeAttackByItemName(item.name, mKey);
          }
        }
      }
    }
    
    // Close the popup
    const popup = document.getElementById('item-popup');
    if (popup) popup.remove();
    
    updateStats();
    renderInventory();
    if (typeof saveGameData === 'function') saveGameData();
    
    // Play delete sound
    playSoundEffect('delete');
  };
  
  const btnContainer = popup.querySelector('div[style*="margin-top"]');
  if (btnContainer) {
    btnContainer.appendChild(deleteBtn);
  }
  // Add close button functionality
  const closeBtn = popup.querySelector('#close-item-popup');
  if (closeBtn) {
    closeBtn.onclick = () => popup.remove();
  }
}

function equipItemToMember(item, memberKey = getSelectedMember()) {
  const member = PARTY_STATS[memberKey];
  let slotKey = null;
  switch (item.slot) {
    case 'Helmet': slotKey='HELMET'; break;
    case 'Chest': slotKey='CHEST'; break;
    case 'Leg': slotKey='LEGS'; break;
    case 'Boot': case 'Boots': slotKey='BOOTS'; break;
    case 'Weapon': slotKey='MAINHAND'; break;
    case 'Offhand': slotKey='OFFHAND'; break;
    default: return;
  }
  // If there's an item already equipped in that slot, unequip that specific inventory instance first (so it returns to inventory)
  // This applies even if the names are the same (e.g., duplicate items)
  const prevName = member[slotKey];
  if (prevName) {
    // Find the previously equipped item by name and equipped flag
    const prevInv = INVENTORY.find(i => i.name === prevName && i.equipped);
    if (prevInv) {
      prevInv.equipped = false;
      // Remove attack by uid if available, otherwise remove by item name
      if (prevInv._uid) {
        removeAttackBySourceUid(prevInv._uid, memberKey);
      } else if (prevInv.attack && prevInv.attack !== 'none') {
        // Fallback: remove attack by matching the attack name from this item
        removeAttackByItemName(prevInv.name, memberKey);
      }
    }
  }

  // Now equip the new item: find the exact inventory item
  // Prefer exact reference first, then uid match, then unequipped copy, then any copy
  let invItem = INVENTORY.find(i => i === item);
  if (!invItem) {
    invItem = INVENTORY.find(i => (item._uid && i._uid && i._uid === item._uid));
  }
  if (!invItem) {
    invItem = INVENTORY.find(i => i.name === item.name && !i.equipped);
  }
  if (!invItem) {
    invItem = INVENTORY.find(i => i.name === item.name);
  }
  if (!invItem) {
    invItem = item;
    INVENTORY.push(invItem);
  }
  invItem.equipped = true;

  // Equip by name on the member (after we've marked the item as equipped)
  member[slotKey] = item.name;

  // Ensure the item has a stable uid for attack tracking
  if (!invItem._uid) invItem._uid = Date.now() + Math.floor(Math.random()*1000);

  // If the item grants an attack, add it to the attack inventory
  if (invItem.attack && invItem.attack !== 'none') {
    addAttackFromItem(invItem, memberKey);
  }

  // Recalculate and re-render full inventory/equips/attacks/stats
  updateStats();
  renderInventory();
    if (typeof saveGameData === 'function') saveGameData();
  
  // Play equip sound
  playSoundEffect('confirmbeep');
}

function unequipItemFromMember(item, memberKey = getSelectedMember()) {
  const member = PARTY_STATS[memberKey];
  let slotKey = null;
  switch (item.slot) {
    case 'Helmet': slotKey='HELMET'; break;
    case 'Chest': slotKey='CHEST'; break;
    case 'Leg': slotKey='LEGS'; break;
    case 'Boot': case 'Boots': slotKey='BOOTS'; break;
    case 'Weapon': slotKey='MAINHAND'; break;
    case 'Offhand': slotKey='OFFHAND'; break;
    default: return;
  }
  
  // Check if inventory has space (count unequipped items)
  const unequippedCount = INVENTORY.filter(i => i && !i.equipped).length;
  if (unequippedCount >= totalSlots) {
    alert('Inventory is full! Cannot unequip item.');
    return;
  }
  
  // Check if the item being unequipped is actually the equipped one (handles duplicates)
  const isItemEquipped = member[slotKey] === item.name && item.equipped;
  
  if (isItemEquipped) {
    // This is the actual equipped item; unequip from the slot
    member[slotKey] = null;

    // Find the exact inventory item being unequipped
    let invItem = INVENTORY.find(i => i === item) || INVENTORY.find(i => (item._uid && i._uid && i._uid === item._uid)) || INVENTORY.find(i => i.name === item.name);
    if (!invItem) {
      invItem = item;
      INVENTORY.push(invItem);
    }
    invItem.equipped = false;
    
    // Find first available slot and assign it
    const occupiedSlots = new Set();
    INVENTORY.forEach(i => {
      if (i && !i.equipped && i.slotIndex !== undefined) {
        occupiedSlots.add(i.slotIndex);
      }
    });
    
    // Find first open slot
    for (let i = 0; i < totalSlots; i++) {
      if (!occupiedSlots.has(i)) {
        invItem.slotIndex = i;
        break;
      }
    }

    // Remove any attacks that originated from this item
    if (invItem._uid) removeAttackBySourceUid(invItem._uid, memberKey);

    // Recalculate and re-render everything
    updateStats();
    renderInventory();
    if (typeof saveGameData === 'function') saveGameData();
  
    // Play unequip sound
    playSoundEffect('confirmbeep');
  } else if (member[slotKey] === item.name && !item.equipped) {
    // Item with same name is equipped, but the one clicked is unequipped (duplicate case)
    // Just mark this unequipped copy as not equipped (it should already be false)
    item.equipped = false;
    // Do NOT unequip the slot or remove attacks; the other copy is still equipped
  }
}

function getEquippedAttackItems(memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  if (!member) return [];
  const slots = ['HELMET','CHEST','LEGS','BOOTS','MAINHAND','OFFHAND'];
  const attacks = [];
  for (const s of slots) {
    const itemName = member[s];
    if (!itemName) continue;
    const item = INVENTORY.find(i=>i.name===itemName) || ITEM_TABLE[itemName];
    if (item && item.attack && item.attack!=='none') {
      const stats = ATTACK_STATS[item.attack] || { strMultiplier:0, magicMultiplier:0, status:'none' };
      attacks.push({ item, attackName: item.attack, ...stats });
    }
  }
  return attacks;
}

function getUnequippedAttackItems() {
  const equippedNames = new Set();
  for (const mKey in PARTY_STATS) {
    const m = PARTY_STATS[mKey];
    if (!m) continue;
    ['HELMET','CHEST','LEGS','BOOTS','MAINHAND','OFFHAND'].forEach(s => { if (m[s]) equippedNames.add(m[s]); });
  }
  const unequipped = INVENTORY.filter(it => it && it.attack && it.attack!=='none' && !equippedNames.has(it.name));
  return unequipped.map(item => ({ item, attackName: item.attack, ...(ATTACK_STATS[item.attack]||{strMultiplier:0,magicMultiplier:0,status:'none'}) }));
}

function renderAttacks(memberKey = getSelectedMember()) {
  const attackContainer = document.getElementById('equipped-attacks');
  const invContainer = document.getElementById('inventory-attacks');
  if (!attackContainer && !invContainer) return;

  // Equipped attacks show entries from ATTACK_INVENTORY that are in ATTACK_EQUIPPED
  const attacks = typeof PARTY_ATTACKS !== 'undefined' && PARTY_ATTACKS[memberKey] ? PARTY_ATTACKS[memberKey].ATTACK_INVENTORY : [];
  const equipped = typeof PARTY_ATTACKS !== 'undefined' && PARTY_ATTACKS[memberKey] ? PARTY_ATTACKS[memberKey].ATTACK_EQUIPPED : new Set();
  if (attackContainer) {
    attackContainer.innerHTML = '';
    const equippedList = attacks.filter(a => equipped.has(a.id));
    if (equippedList.length === 0) attackContainer.innerHTML = '<div>No attacks equipped.</div>';
    equippedList.forEach(a => {
      // Find source item for rarity color
      const sourceItem = INVENTORY.find(i => i._uid === a.sourceUid) || INVENTORY.find(i => i.name === a.itemName);
      const rarityColor = (sourceItem && sourceItem.rarity && typeof window.getRarityColor === 'function') ? window.getRarityColor(sourceItem.rarity) : '#ffffff';
      
      // Build stat multipliers display
      let statParts = [];
      if (a.strMultiplier !== undefined && a.strMultiplier !== null) statParts.push(`<span style="color: #ff8866;">⚔️ Str x${a.strMultiplier}</span>`);
      if (a.magicMultiplier !== undefined && a.magicMultiplier !== null) statParts.push(`<span style="color: #8888ff;">✨ Mag x${a.magicMultiplier}</span>`);
      if (a.sklMultiplier !== undefined && a.sklMultiplier !== null) statParts.push(`<span style="color: #ffaaff;">🎯 Skl x${a.sklMultiplier}</span>`);
      const statText = statParts.length > 0 ? statParts.join(' • ') : '';
      const statusText = a.status && a.status !== 'none' ? `<span style="color: #ffdd44;">💫 ${a.status}</span>` : '';
      
      attackContainer.innerHTML += `<div class="attack-entry" data-id="${a.id}" style="
        border-left: 4px solid ${rarityColor};
        padding: 10px 12px;
        margin: 6px 0;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(0, 0, 0, 0.6)'; this.style.transform='translateX(4px)';" onmouseout="this.style.background='rgba(0, 0, 0, 0.4)'; this.style.transform='translateX(0)';">
        <div style="font-weight: bold; color: ${rarityColor}; font-size: 1.1em; margin-bottom: 4px;">${a.name}</div>
        <div style="font-size: 0.85em; color: #aaa; margin-bottom: 6px;">from ${a.itemName}</div>
        <div style="font-size: 0.9em;">${statText}</div>
        ${statusText ? `<div style="font-size: 0.9em; margin-top: 4px;">${statusText}</div>` : ''}
      </div>`;
    });
    attackContainer.querySelectorAll('.attack-entry').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        unequipAttackById(id, memberKey);
        renderAttacks(memberKey);
      };
    });
  }

  // Inventory attacks show ATTACK_INVENTORY entries that are not equipped
  if (invContainer) {
    invContainer.innerHTML = '';
    const invList = attacks.filter(a => !equipped.has(a.id));
    if (invList.length === 0) invContainer.innerHTML = '<div>No attacks in inventory.</div>';
    invList.forEach(a => {
      // Find source item for rarity color
      const sourceItem = INVENTORY.find(i => i._uid === a.sourceUid) || INVENTORY.find(i => i.name === a.itemName);
      const rarityColor = (sourceItem && sourceItem.rarity && typeof window.getRarityColor === 'function') ? window.getRarityColor(sourceItem.rarity) : '#ffffff';
      
      // Build stat multipliers display
      let statParts = [];
      if (a.strMultiplier !== undefined && a.strMultiplier !== null) statParts.push(`<span style="color: #ff8866;">⚔️ Str x${a.strMultiplier}</span>`);
      if (a.magicMultiplier !== undefined && a.magicMultiplier !== null) statParts.push(`<span style="color: #8888ff;">✨ Mag x${a.magicMultiplier}</span>`);
      if (a.sklMultiplier !== undefined && a.sklMultiplier !== null) statParts.push(`<span style="color: #ffaaff;">🎯 Skl x${a.sklMultiplier}</span>`);
      const statText = statParts.length > 0 ? statParts.join(' • ') : '';
      const statusText = a.status && a.status !== 'none' ? `<span style="color: #ffdd44;">💫 ${a.status}</span>` : '';
      
      invContainer.innerHTML += `<div class="attack-entry inv" data-id="${a.id}" style="
        border-left: 4px solid ${rarityColor};
        padding: 10px 12px;
        margin: 6px 0;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(0, 0, 0, 0.6)'; this.style.transform='translateX(4px)';" onmouseout="this.style.background='rgba(0, 0, 0, 0.4)'; this.style.transform='translateX(0)';">
        <div style="font-weight: bold; color: ${rarityColor}; font-size: 1.1em; margin-bottom: 4px;">${a.name}</div>
        <div style="font-size: 0.85em; color: #aaa; margin-bottom: 6px;">from ${a.itemName}</div>
        <div style="font-size: 0.9em;">${statText}</div>
        ${statusText ? `<div style="font-size: 0.9em; margin-top: 4px;">${statusText}</div>` : ''}
      </div>`;
    });
    invContainer.querySelectorAll('.attack-entry').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        equipAttackById(id, memberKey);
        renderAttacks(memberKey);
      };
    });
  }
}

function updateStatsDisplay(memberKey = getSelectedMember()) {
  if (typeof PARTY_STATS === 'undefined' || typeof updateStats !== 'function') return;
  updateStats();
  const member = PARTY_STATS[memberKey];
  const statsDiv = document.getElementById('total-stats');
  if (statsDiv && member) {
    // Calculate hidden stats
    const skill = Number(member.SKILL || 0);
    const baseCritChance = 5; // 5% base
    const skillCritBonus = skill * 0.5; // +0.5% per skill point
    const totalCritChance = baseCritChance + skillCritBonus;
    const baseCritDamage = 200; // 200% base
    const skillCritDamageBonus = skill * 1; // +1% per skill point
    const critDamage = baseCritDamage + skillCritDamageBonus;
    const procChance = Number(member.PROC_CHANCE || 25); // 25% default
    
    // Build vertical stats display with colors
    statsDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 1.1em;">
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 0, 0, 0.15); border-left: 3px solid #ff4444; border-radius: 4px;">
          <span style="color: #ff6666; font-weight: bold;">❤️ Health:</span>
          <span style="color: #ffffff; font-weight: bold;">${member.MAX_HEALTH}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 100, 0, 0.15); border-left: 3px solid #ff6644; border-radius: 4px;">
          <span style="color: #ff8866; font-weight: bold;">⚔️ Strength:</span>
          <span style="color: #ffffff; font-weight: bold;">${member.STRENGTH}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(100, 100, 255, 0.15); border-left: 3px solid #6666ff; border-radius: 4px;">
          <span style="color: #8888ff; font-weight: bold;">✨ Magic:</span>
          <span style="color: #ffffff; font-weight: bold;">${member.MAGIC}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 255, 0, 0.15); border-left: 3px solid #ffdd44; border-radius: 4px;">
          <span style="color: #ffee66; font-weight: bold;">⚡ Speed:</span>
          <span style="color: #ffffff; font-weight: bold;">${member.SPEED}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(100, 200, 255, 0.15); border-left: 3px solid #66ccff; border-radius: 4px;">
          <span style="color: #88ddff; font-weight: bold;">🛡️ Defense:</span>
          <span style="color: #ffffff; font-weight: bold;">${member.DEFENSE}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 150, 255, 0.15); border-left: 3px solid #ff88ff; border-radius: 4px;">
          <span style="color: #ffaaff; font-weight: bold;">🎯 Skill:</span>
          <span style="color: #ffffff; font-weight: bold;">${skill}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 215, 0, 0.15); border-left: 3px solid #ffd700; border-radius: 4px;">
          <span style="color: #ffdd44; font-weight: bold;">💥 Crit Chance:</span>
          <span style="color: #ffffff; font-weight: bold;">${totalCritChance.toFixed(1)}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255, 100, 100, 0.15); border-left: 3px solid #ff6666; border-radius: 4px;">
          <span style="color: #ff8888; font-weight: bold;">💢 Crit Damage:</span>
          <span style="color: #ffffff; font-weight: bold;">${critDamage}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(150, 255, 150, 0.15); border-left: 3px solid #66ff66; border-radius: 4px;">
          <span style="color: #88ff88; font-weight: bold;">🎲 Proc Chance:</span>
          <span style="color: #ffffff; font-weight: bold;">${procChance}%</span>
        </div>
      </div>
    `;
  }
}

// THIS IS THE FIXED CODE
// Add event listeners to party nav buttons
for (let i = 1; i <= 5; i++) {
   const btn = document.getElementById(`inv-${i}`);
   if (btn) {
    btn.addEventListener('click', () => {
      if (typeof SELECTED_MEMBER !== 'undefined') {
       SELECTED_MEMBER = ['ONE','TWO','THREE','FOUR','FIVE'][i-1];
      }
    renderInventory();
    });
   }
}

function generateAndShowItem() {
  const level = Math.floor(Math.random() * 10) + 1;
  generateRandomItem(level);
  renderInventory();
  if (typeof saveGameData === 'function') saveGameData();
}

renderInventory();
window.addEventListener('DOMContentLoaded', renderInventoryGrid);

// Create Reset Inventory button after DOM is ready
/*function ensureResetButton() {
  if (document.getElementById('reset-inv-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'reset-inv-btn';
  btn.textContent = 'Reset Inventory';
  btn.style.position = 'fixed';
  btn.style.right = '10px';
  btn.style.bottom = '10px';
  btn.style.zIndex = 9999;
  btn.style.padding = '8px 10px';
  btn.style.background = '#c0392b';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  btn.addEventListener('click', () => {
    if (typeof resetInventory === 'function') resetInventory();
  });
  document.body.appendChild(btn);
}*/

/*if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', ensureResetButton);
} else {
  ensureResetButton();
}*/

// Party member name management
function renderMemberNameInput(memberKey = getSelectedMember()) {
  const member = PARTY_STATS[memberKey];
  if (!member) return;
  const input = document.getElementById('member-name-input');
  if (input) {
    input.value = member.NAME || '';
  }
}

function saveMemberName() {
  const memberKey = getSelectedMember();
  const member = PARTY_STATS[memberKey];
  if (!member) return;
  const input = document.getElementById('member-name-input');
  if (input) {
    const newName = input.value.trim();
    if (newName) {
      member.NAME = newName;
      // Save to local storage
      if (typeof saveGameData === 'function') saveGameData();
      renderInventory();
      // Update battle display if on battle page
      if (typeof updatePartyDisplay === 'function') updatePartyDisplay();
    }
  }
}

// Enchantment Inventory Management
const ENCHANTMENT_LIST = [
  // Basic Enchantments
  "Sharpness",
  "Lifesteal", 
  "Burning",
  "Fortification",
  "Swiftness",
  "Vitality",
  "Hemorrhage",
  "Precision",
  "Arcane Power",
  "Berserker",
  "Resilience",
  "Haste",
  "Frost",
  "Vengeance",
  "Warding",
  // Legendary Enchantments
  "Multistrike",
  "Soulrend",
  "Phoenix Rebirth",
  "Temporal Flux",
  "Chaos Storm"
];

function renderEnchantmentInventory() {
  const container = document.getElementById('enchantment-inventory');
  if (!container) return;
  
  // Get enchantment counts from global variable
  if (typeof ENCHANTMENT_INVENTORY === 'undefined') {
    window.ENCHANTMENT_INVENTORY = {};
  }
  
  let html = '';
  
  ENCHANTMENT_LIST.forEach(enchantName => {
    const count = ENCHANTMENT_INVENTORY[enchantName] || 0;
    const isLegendary = ['Multistrike', 'Soulrend', 'Phoenix Rebirth', 'Temporal Flux', 'Chaos Storm'].includes(enchantName);
    
    if (count > 0) {
      const borderColor = isLegendary ? '#ff8000' : '#ffcc00';
      const bgColor = isLegendary ? 'rgba(255, 128, 0, 0.1)' : 'rgba(255, 204, 0, 0.1)';
      const icon = isLegendary ? '🌟' : '✨';
      html += `
        <div class="enchant-slot has-enchant" style="border-color: ${borderColor}; background: ${bgColor};">
          <div class="enchant-name" style="color: ${borderColor};">${icon} ${enchantName}</div>
          <div class="enchant-count">${count}</div>
        </div>
      `;
    } else {
      html += `
        <div class="enchant-slot empty">
          <div class="enchant-empty-text">${enchantName}</div>
          <div style="color: #444; font-size: 0.9em; margin-top: 5px;">0 owned</div>
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
}

// Add enchantment to inventory
function addEnchantment(enchantName, count = 1) {
  // Limit inventory to 125 unequipped items
  const unequippedCount = INVENTORY.filter(i => i && !i.equipped).length;
  if (unequippedCount >= maxPages * slotsPerPage) {
    alert('Inventory is full! You cannot add more items.');
    return;
  }
  // ...existing code...
}
function addEnchantment(enchantName, count = 1) {
  if (typeof ENCHANTMENT_INVENTORY === 'undefined') {
    window.ENCHANTMENT_INVENTORY = {};
  }
  
  if (!ENCHANTMENT_INVENTORY[enchantName]) {
    ENCHANTMENT_INVENTORY[enchantName] = 0;
  }
  
  ENCHANTMENT_INVENTORY[enchantName] += count;
  
  // Save to localStorage
  if (typeof saveGameData === 'function') saveGameData();
  
  // Re-render enchantment inventory
  renderEnchantmentInventory();
}

// Expose addEnchantment to window for use in other pages
window.addEnchantment = addEnchantment;

// Remove enchantment from inventory (used when applying to item)
function removeEnchantment(enchantName, count = 1) {
  if (typeof ENCHANTMENT_INVENTORY === 'undefined') {
    window.ENCHANTMENT_INVENTORY = {};
  }
  
  if (ENCHANTMENT_INVENTORY[enchantName] && ENCHANTMENT_INVENTORY[enchantName] > 0) {
    ENCHANTMENT_INVENTORY[enchantName] -= count;
    if (ENCHANTMENT_INVENTORY[enchantName] < 0) {
      ENCHANTMENT_INVENTORY[enchantName] = 0;
    }
    
    // Save to localStorage
    if (typeof saveGameData === 'function') saveGameData();
    
    // Re-render enchantment inventory
    renderEnchantmentInventory();
    return true;
  }
  return false;
}

// Enchantment stat bonuses
const ENCHANTMENT_BONUSES = {
  // Basic Enchantments
  "Sharpness": { strength: 5 },
  "Lifesteal": { health: 10 },
  "Burning": { magic: 5 },
  "Fortification": { defense: 5 },
  "Swiftness": { speed: 3 },
  "Vitality": { health: 15 },
  "Hemorrhage": { strength: 3, speed: 2 },
  "Precision": { speed: 5 },
  "Arcane Power": { magic: 8 },
  "Berserker": { strength: 10, defense: -3 },
  "Resilience": { defense: 8, health: 5 },
  "Haste": { speed: 6 },
  "Frost": { magic: 4, speed: 2 },
  "Vengeance": { strength: 6, health: 8 },
  "Warding": { defense: 10 },
  // Legendary Enchantments
  "Multistrike": { strength: 15, speed: 10 },
  "Soulrend": { magic: 20, health: -10 },
  "Phoenix Rebirth": { health: 25, defense: 5 },
  "Temporal Flux": { speed: 15, magic: 10 },
  "Chaos Storm": { strength: 12, magic: 12, speed: 8 }
};

// Show enchantment selection modal
function showEnchantmentModal(item) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'enchant-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0, 0, 0, 0.85)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '10000';
  
  const modalContent = document.createElement('div');
  modalContent.style.background = '#1a1a1a';
  modalContent.style.padding = '30px';
  modalContent.style.borderRadius = '12px';
  modalContent.style.maxWidth = '600px';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflowY = 'auto';
  modalContent.style.border = '3px solid #ff8c00';
  modalContent.style.boxShadow = '0 0 20px rgba(255, 140, 0, 0.5)';
  
  const currentEnchant = item.enchantment ? `<p style="color: #ff8c00;">Current: ${item.enchantment}</p>` : '';
  
  let enchantListHTML = '<h2 style="color: #ff8c00;">Select Enchantment</h2>';
  enchantListHTML += `<p style="color: #fff;">Item: ${item.name}</p>`;
  enchantListHTML += currentEnchant;
  enchantListHTML += '<p style="color: #aaa; font-size: 0.9em;">Once applied, the enchantment is permanent until replaced.</p>';
  enchantListHTML += '<div style="margin-top: 20px;">';
  
  if (typeof ENCHANTMENT_INVENTORY === 'undefined') {
    window.ENCHANTMENT_INVENTORY = {};
  }
  
  // Show available enchantments
  let hasEnchants = false;
  for (const enchantName in ENCHANTMENT_INVENTORY) {
    const count = ENCHANTMENT_INVENTORY[enchantName] || 0;
    if (count > 0) {
      hasEnchants = true;
      const isLegendary = ['Multistrike', 'Soulrend', 'Phoenix Rebirth', 'Temporal Flux', 'Chaos Storm'].includes(enchantName);
      const color = isLegendary ? '#ff8000' : '#ffcc00';
      const bonuses = ENCHANTMENT_BONUSES[enchantName] || {};
      const bonusText = Object.keys(bonuses).map(stat => {
        const val = bonuses[stat];
        return `${stat}: ${val > 0 ? '+' : ''}${val}`;
      }).join(', ');
      
      enchantListHTML += `
        <div style="background: rgba(0,0,0,0.5); padding: 15px; margin: 10px 0; border-radius: 8px; border: 2px solid ${color};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="color: ${color}; margin: 0;">${isLegendary ? '🌟' : '✨'} ${enchantName}</h3>
              <p style="color: #aaa; margin: 5px 0; font-size: 0.9em;">${bonusText}</p>
              <p style="color: #888; margin: 5px 0; font-size: 0.85em;">Owned: ${count}</p>
            </div>
            <button 
              onclick="applyEnchantmentToItem('${enchantName}', '${item.name}')"
              style="background: ${color}; color: #000; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;"
            >Apply</button>
          </div>
        </div>
      `;
    }
  }
  
  if (!hasEnchants) {
    enchantListHTML += '<p style="color: #888;">No enchantments available. Complete challenge stages to earn enchantments!</p>';
  }
  
  enchantListHTML += '</div>';
  enchantListHTML += '<button id="close-modal-btn" style="margin-top: 20px; background: #c0392b; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">Close</button>';
  
  modalContent.innerHTML = enchantListHTML;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  document.getElementById('close-modal-btn').onclick = () => {
    modal.remove();
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

// Apply enchantment to item
function applyEnchantmentToItem(enchantName, itemName) {
  const item = INVENTORY.find(i => i.name === itemName);
  if (!item) {
    alert('Item not found!');
    return;
  }
  
  const count = ENCHANTMENT_INVENTORY[enchantName] || 0;
  if (count <= 0) {
    alert('You don\'t have this enchantment!');
    return;
  }
  
  // Confirm replacement if item already has enchantment
  if (item.enchantment) {
    if (!confirm(`Replace ${item.enchantment} with ${enchantName}? The old enchantment will be lost forever.`)) {
      return;
    }
  }
  
  // Apply enchantment bonuses
  const bonuses = ENCHANTMENT_BONUSES[enchantName] || {};
  
  // Remove old enchantment bonuses if exists
  if (item.enchantment && item.enchantmentBonuses) {
    for (const stat in item.enchantmentBonuses) {
      item[stat] = (item[stat] || 0) - item.enchantmentBonuses[stat];
    }
  }
  
  // Apply new enchantment bonuses
  item.enchantment = enchantName;
  item.enchantmentBonuses = Object.assign({}, bonuses);
  for (const stat in bonuses) {
    item[stat] = (item[stat] || 0) + bonuses[stat];
  }
  
  // Remove enchantment from inventory (it's consumed)
  removeEnchantment(enchantName, 1);
  
  // Update display
  updateStats();
  renderInventory();
  // Add event listeners to party nav buttons
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`inv-${i}`);
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof SELECTED_MEMBER !== 'undefined') {
          SELECTED_MEMBER = ['ONE','TWO','THREE','FOUR','FIVE'][i-1];
        }
        renderInventory();
      });
    }
  }
  if (typeof saveGameData === 'function') saveGameData();
  
  // Close modal
  const modal = document.getElementById('enchant-modal');
  if (modal) modal.remove();
  
  alert(`${enchantName} applied to ${itemName}!`);
}

// Make functions globally accessible
window.addEnchantment = addEnchantment;
window.removeEnchantment = removeEnchantment;
window.renderEnchantmentInventory = renderEnchantmentInventory;
window.applyEnchantmentToItem = applyEnchantmentToItem;

// Initialize enchantment inventory on page load
document.addEventListener('DOMContentLoaded', () => {
  renderEnchantmentInventory();
});
