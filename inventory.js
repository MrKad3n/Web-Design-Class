// Helper to get the selected member (from script.js)
function getSelectedMember() {
  return typeof SELECTED_MEMBER !== 'undefined' ? SELECTED_MEMBER : 'ONE';
}

const invRows = 10;
const invCols = 5;

function renderInventoryGrid() {
  const inventory = document.getElementById("inventory");
  if (!inventory) {
    console.error("Inventory element not found!");
    return;
  }
  inventory.innerHTML = "";
  
  // Filter to only unequipped items and pack them
  const unequippedItems = INVENTORY.filter(i => i && !i.equipped);
  let itemIdx = 0;
  
  for (let row = 0; row < invRows; row++) {
    for (let col = 0; col < invCols; col++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.dataset.row = row;
      slot.dataset.col = col;

      const data = unequippedItems[itemIdx];
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
        slot.addEventListener('click', () => displayItemInfo(data));
        itemIdx++;
      } else {
        img.src = "Assests/empty-slot.png";
        img.alt = "Empty Slot";
      }

      slot.appendChild(img);
      inventory.appendChild(slot);
    }
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
  const infoItem = document.getElementById('info-item');
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
    21: "Sea Shield - Immune to leech, burn, and chill status effects"
  };
  
  const abilityText = (item.ability && item.ability > 0 && abilityDescriptions[item.ability]) 
    ? `<p style="color: #ffcc00; font-weight: bold;">⚡ ${abilityDescriptions[item.ability]}</p>` 
    : '';
  
  const enchantText = item.enchantment 
    ? `<p style="color: #ff8c00; font-weight: bold;">✨ Enchanted: ${item.enchantment}</p>`
    : '';
  
  infoItem.innerHTML = `
    <h3 style="color: ${rarityColor}">${item.name} Level ${item.level||1}</h3>
    <img src="${item.image||'Assests/empty-slot.png'}" style="width:30%; border: 3px solid ${rarityColor}; box-shadow: 0 0 8px ${rarityColor}">
    <p>Strength: ${item.strength||0} Magic: ${item.magic||0} Speed: ${item.speed||0}</p>
    <p>Health: ${item.health||0} Defense: ${item.defense||0} Attack: ${item.attack||'none'}</p>
    ${abilityText}
    ${enchantText}
    <div style="margin-top:8px">
      <button id="equip-btn">Equip</button>
      <button id="unequip-btn">Unequip</button>
    </div>
  `;
  const equipBtn = document.getElementById('equip-btn');
  const unequipBtn = document.getElementById('unequip-btn');
  
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
  deleteBtn.style.background = '#c0392b';
  deleteBtn.style.color = 'white';
  deleteBtn.style.marginLeft = '8px';
  deleteBtn.onclick = () => {
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
      }
      // Remove attacks from this item
      if (item._uid) removeAttackBySourceUid(item._uid, memberKey);
    }
    updateStats();
    renderInventory();
    if (typeof saveGameData === 'function') saveGameData();
    infoItem.innerHTML = '<p>Item deleted.</p>';
  };
  
  const btnContainer = infoItem.querySelector('div[style*="margin-top"]');
  if (btnContainer) {
    btnContainer.appendChild(deleteBtn);
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
  const maxSlots = invRows * invCols;
  if (unequippedCount >= maxSlots) {
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

    // Remove any attacks that originated from this item
  if (invItem._uid) removeAttackBySourceUid(invItem._uid, memberKey);

    // Recalculate and re-render everything
  updateStats();
  renderInventory();
      if (typeof saveGameData === 'function') saveGameData();
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
      attackContainer.innerHTML += '<div class="attack-entry" data-id="'+a.id+'" style="border-left: 4px solid '+rarityColor+'; padding-left: 8px; margin: 4px 0;">' +
        '<strong style="color: '+rarityColor+'">'+a.name+'</strong> (from '+a.itemName+')<br>' +
        'Str x'+a.strMultiplier+', Magic x'+a.magicMultiplier+', Status: '+a.status +
      '</div>';
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
      invContainer.innerHTML += '<div class="attack-entry inv" data-id="'+a.id+'" style="border-left: 4px solid '+rarityColor+'; padding-left: 8px; margin: 4px 0;">' +
        '<strong style="color: '+rarityColor+'">'+a.name+'</strong> (from '+a.itemName+')<br>' +
        'Str x'+a.strMultiplier+', Magic x'+a.magicMultiplier+', Status: '+a.status +
      '</div>';
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
    statsDiv.textContent = `Health: ${member.MAX_HEALTH}; Strength: ${member.STRENGTH}; Magic: ${member.MAGIC}; Speed: ${member.SPEED}; Defense: ${member.DEFENSE};`;
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
