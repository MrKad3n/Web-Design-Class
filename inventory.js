const inventory = document.getElementById("inventory");
const rows = 6;
const cols = 5;

function renderInventoryGrid() {
  inventory.innerHTML = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.dataset.row = row;
      slot.dataset.col = col;

      const index = row * cols + col;
      const data = (typeof INVENTORY !== "undefined" && INVENTORY[index]) ? INVENTORY[index] : null;

      const img = document.createElement("img");
      img.className = "inv-img";

      if (data) {
        img.src = data.image || "Assests/empty-slot.png";
        img.alt = data.name;
        slot.addEventListener('click', () => displayItemInfo(data));
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
  renderEquippedItems('ONE');
  updateStatsDisplay();
  renderAttacks('ONE');
}

function getItemImage(item) { return item && item.image ? item.image : "Assests/empty-slot.png"; }

function renderEquippedItems(memberKey = 'ONE') {
  const member = PARTY_STATS[memberKey];
  const equipDiv = document.getElementById("equipped-items");
  if (!equipDiv) return;
  equipDiv.innerHTML = "";
  const slots = ["HELMET","CHEST","LEGS","BOOTS","MAINHAND","OFFHAND"];
  slots.forEach(s => {
    const itemName = member[s];
    const item = ITEM_TABLE[itemName] || INVENTORY.find(i => i.name === itemName) || null;
    const imgSrc = item && item.image ? item.image : "Assests/empty-slot.png";
    const slotDiv = document.createElement('div');
    slotDiv.className = 'equip-slot';
    slotDiv.innerHTML = `<div>${s}</div><img src="${imgSrc}" style="width:50px;height:50px"><div style="font-size:12px">${itemName||'Empty'}</div>`;
    equipDiv.appendChild(slotDiv);
  });
}

function displayItemInfo(item) {
  const infoItem = document.getElementById('info-item');
  infoItem.innerHTML = `\n    <h3>${item.name} Level ${item.level||1}</h3>\n    <img src="${item.image||'Assests/empty-slot.png'}" style="width:30%">\n    <p>Strength: ${item.strength||0} Magic: ${item.magic||0} Speed: ${item.speed||0}</p>\n    <p>Health: ${item.health||0} Defense: ${item.defense||0} Attack: ${item.attack||'none'}</p>\n    <button id="equip-btn">Equip</button>\n    <button id="unequip-btn">Unequip</button>\n  `;
  document.getElementById('equip-btn').onclick = () => equipItemToMember(item);
  document.getElementById('unequip-btn').onclick = () => unequipItemFromMember(item);
}

function equipItemToMember(item, memberKey = 'ONE') {
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
  member[slotKey] = item.name;
  updateStats();
  renderEquippedItems(memberKey);
  updateStatsDisplay();
  // If the item grants an attack, add it to the attack inventory
  if (item.attack && item.attack !== 'none') {
    if (!item._uid) item._uid = Date.now() + Math.floor(Math.random()*1000);
    addAttackFromItem(item);
  }
  renderAttacks(memberKey);
}

function unequipItemFromMember(item, memberKey = 'ONE') {
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
  if (member[slotKey] === item.name) {
    member[slotKey] = null;
    updateStats();
    renderEquippedItems(memberKey);
    updateStatsDisplay();
    // Remove any attacks that originated from this item (from equip list and inventory)
    if (item._uid) removeAttackBySourceUid(item._uid);
    renderAttacks(memberKey);
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

function renderAttacks(memberKey = 'ONE') {
  const attackContainer = document.getElementById('equipped-attacks');
  const invContainer = document.getElementById('inventory-attacks');
  if (!attackContainer && !invContainer) return;

  // Equipped attacks show entries from ATTACK_INVENTORY that are in ATTACK_EQUIPPED
  if (attackContainer) {
    attackContainer.innerHTML = '';
    const equippedList = ATTACK_INVENTORY.filter(a => ATTACK_EQUIPPED.has(a.id));
    if (equippedList.length === 0) attackContainer.innerHTML = '<div>No attacks equipped.</div>';
    equippedList.forEach(a => {
      attackContainer.innerHTML += '<div class="attack-entry" data-id="'+a.id+'">' +
        '<strong>'+a.name+'</strong> (from '+a.itemName+')<br>' +
        'Str x'+a.strMultiplier+', Magic x'+a.magicMultiplier+', Status: '+a.status +
      '</div>';
    });
    attackContainer.querySelectorAll('.attack-entry').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        unequipAttackById(id);
        renderAttacks(memberKey);
      };
    });
  }

  // Inventory attacks show ATTACK_INVENTORY entries that are not equipped
  if (invContainer) {
    invContainer.innerHTML = '';
    const invList = ATTACK_INVENTORY.filter(a => !ATTACK_EQUIPPED.has(a.id));
    if (invList.length === 0) invContainer.innerHTML = '<div>No attacks in inventory.</div>';
    invList.forEach(a => {
      invContainer.innerHTML += '<div class="attack-entry inv" data-id="'+a.id+'">' +
        '<strong>'+a.name+'</strong> (from '+a.itemName+')<br>' +
        'Str x'+a.strMultiplier+', Magic x'+a.magicMultiplier+', Status: '+a.status +
      '</div>';
    });
    invContainer.querySelectorAll('.attack-entry').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        equipAttackById(id);
        renderAttacks(memberKey);
      };
    });
  }
}

function updateStatsDisplay() {
  if (typeof PARTY_STATS === 'undefined' || typeof updateStats !== 'function') return;
  updateStats();
  const member = PARTY_STATS['ONE'];
  const statsDiv = document.getElementById('total-stats');
  if (statsDiv && member) {
    statsDiv.textContent = `Health: ${member.MAX_HEALTH}; Strength: ${member.STRENGTH}; Magic: ${member.MAGIC}; Speed: ${member.SPEED}; Defense: ${member.DEFENSE};`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderAttacks();
  renderInventory();
});

function generateAndShowItem() {
  const level = Math.floor(Math.random() * 10) + 1;
  generateRandomItem(level);
  renderInventory();
}

