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
  infoItem.innerHTML = `\n    <h3 style="color: ${rarityColor}">${item.name} Level ${item.level||1}</h3>\n    <img src="${item.image||'Assests/empty-slot.png'}" style="width:30%; border: 3px solid ${rarityColor}; box-shadow: 0 0 8px ${rarityColor}">\n    <p>Strength: ${item.strength||0} Magic: ${item.magic||0} Speed: ${item.speed||0}</p>\n    <p>Health: ${item.health||0} Defense: ${item.defense||0} Attack: ${item.attack||'none'}</p>\n    <div style="margin-top:8px">\n      <button id="equip-btn">Equip</button>\n      <button id="unequip-btn">Unequip</button>\n    </div>\n  `;
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
  if (prevInv._uid) removeAttackBySourceUid(prevInv._uid, memberKey);
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
function ensureResetButton() {
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
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', ensureResetButton);
} else {
  ensureResetButton();
}

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
