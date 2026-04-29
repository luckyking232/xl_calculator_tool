// ui.js
import { ATTR_ID_MAP, formatAttr } from './calculator.js';

// ==================== 模态框 ====================
export function openModal(modal) { modal.hidden = false; }
export function closeModal(modal) { modal.hidden = true; }

// ==================== 输入数字保护 ====================
export function setupNumberInput(input, min, getLast, setLast, onChange) {
  input.addEventListener('input', () => {
    const raw = input.value.trim();
    if (raw === '') return;
    let v = parseInt(raw);
    if (isNaN(v)) return;
    if (v < min) v = min;
    if (input.max && v > parseInt(input.max)) v = parseInt(input.max);
    input.value = v;
    setLast(v);
    onChange(v);
  });
  input.addEventListener('blur', () => {
    if (input.value.trim() === '') {
      const last = getLast();
      input.value = last;
      onChange(last);
    }
  });
}

// ==================== 被动技能面板 ====================
export function renderPassiveSkills(container, char, onPassiveChange) {
  container.innerHTML = '';
  if (!char.grow_skill_ids || char.grow_skill_ids.length === 0) {
    container.innerHTML = '<p style="color:#aaa;">该角色无被动技能</p>';
    return;
  }
  char.grow_skill_ids.forEach((skillId, idx) => {
    const rawDesc = (char.passive_skill_descs && char.passive_skill_descs[idx]) ? char.passive_skill_descs[idx] : '';
    const lines = rawDesc.split('\n').filter(l => l.trim() !== '');
    const skillName = lines.length > 0 ? lines[0] : `被动技能${idx+1}`;
    const descBody = lines.slice(1).join('\n');
    const row = document.createElement('div');
    row.className = 'passive-row';
    row.dataset.skillId = skillId;
    row.innerHTML = `<div class="skill-name">${skillName}</div>
      <div class="passive-desc" data-raw="${descBody.replace(/"/g, '&quot;')}">${descBody}</div>
      <div class="skill-select">
        <label>等级：</label>
        <select class="passive-level">
          <option value="0">0级</option>
          <option value="1">1级</option>
          <option value="2">2级</option>
          <option value="3">3级</option>
        </select>
      </div>`;
    container.appendChild(row);
    const select = row.querySelector('.passive-level');
    select.addEventListener('change', () => {
      updatePassiveHighlight(row, parseInt(select.value));
      onPassiveChange();
    });
  });
}

export function updatePassiveHighlight(row, level) {
  const descDiv = row.querySelector('.passive-desc');
  const rawDesc = descDiv.dataset.raw.replace(/&quot;/g, '"');
  const numbers = rawDesc.match(/\d+(\.\d+)?/g) || [];
  let html = rawDesc;
  if (level > 0 && numbers.length >= level) {
    const target = numbers[level-1];
    html = rawDesc.replace(new RegExp(`\\b${target}\\b`), `<span class="highlight-num">${target}</span>`);
  }
  descDiv.innerHTML = html;
  row.classList.toggle('active-skill', level > 0);
}

// ==================== 觉醒卡片 ====================
export function renderAwakeCards(container, char, awakeActive, onToggleAwake) {
  container.innerHTML = '';
  const descs = char.awakening_skill_descs || [];
  if (descs.length === 0) {
    container.innerHTML = '<p style="color:#aaa;">该角色无觉醒技能</p>';
    return;
  }
  descs.forEach((desc, idx) => {
    const awakeIndex = idx + 1;
    const lines = desc.split('\n').filter(l => l.trim() !== '');
    const title = lines.length > 0 ? lines[0] : `觉醒${awakeIndex}`;
    const body = lines.slice(1).join('\n');
    const card = document.createElement('div');
    card.className = 'awake-card';
    card.dataset.awakeIndex = awakeIndex;
    card.innerHTML = `<div class="awake-title">${title}</div><div class="awake-desc">${body}</div>`;
    card.addEventListener('click', () => onToggleAwake(awakeIndex));
    container.appendChild(card);
  });
  updateAwakeUI(container, awakeActive);
}

export function toggleAwake(index, awakeActive, container, onAwakeChanged) {
  if (awakeActive.has(index)) {
    for (let i = 5; i >= index; i--) awakeActive.delete(i);
  } else {
    for (let i = 1; i <= index; i++) awakeActive.add(i);
  }
  updateAwakeUI(container, awakeActive);
  onAwakeChanged();
}

function updateAwakeUI(container, awakeActive) {
  container.querySelectorAll('.awake-card').forEach(card => {
    const idx = parseInt(card.dataset.awakeIndex);
    card.classList.toggle('active', awakeActive.has(idx));
  });
}

// ==================== 徽章 UI ====================
export function renderBadgeUI(badgeConfig, suitGrid, partsContainer, badgeState, onChange) {
  renderSuitGrid(suitGrid, badgeConfig.suits, badgeState.selectedSuitId, (newId) => {
    badgeState.selectedSuitId = newId;
    // 手动更新套装卡片高亮（避免重绘丢失焦点）
    Array.from(suitGrid.children).forEach(card => {
      const suitId = parseInt(card.dataset.suitId);
      card.classList.toggle('selected', suitId === newId);
    });
    onChange();
  });
  renderPartsPanel(partsContainer, badgeConfig, badgeState, onChange);
}

function renderSuitGrid(container, suits, selectedSuitId, onSelect) {
  container.innerHTML = '';
  suits.forEach(suit => {
    const card = document.createElement('div');
    card.className = 'suit-card' + (selectedSuitId === suit.id ? ' selected' : '');
    card.dataset.suitId = suit.id;   // 用于后续高亮更新
    card.innerHTML = `
      <div class="suit-name">${suit.name}</div>
      <div class="suit-parts">${suit.parts}</div>
      <div class="suit-effects">2件: ${suit.desc2}</div>
      <div class="suit-effects">3件: ${suit.desc3}</div>
    `;
    card.addEventListener('click', () => onSelect(suit.id));
    container.appendChild(card);
  });
}

function renderPartsPanel(container, badgeConfig, state, onChange) {
  container.innerHTML = '';
  const flowerPanel = createPartPanel('花', state.flowerMain, badgeConfig.flower_main_options, state.flowerSubs, state.flowerSubTimes, state.flowerLevel,
    (v) => { state.flowerLevel = v; onChange(); }, 'flower', state.lastValidFlowerLv, v => state.lastValidFlowerLv = v, badgeConfig, state, onChange);
  const orbPanel = createPartPanel('球', state.orbMain, badgeConfig.orb_main_options, state.orbSubs, state.orbSubTimes, state.orbLevel,
    (v) => { state.orbLevel = v; onChange(); }, 'orb', state.lastValidOrbLv, v => state.lastValidOrbLv = v, badgeConfig, state, onChange);
  const featherPanel = createPartPanel('羽', state.featherMain, badgeConfig.feather_main_options, state.featherSubs, state.featherSubTimes, state.featherLevel,
    (v) => { state.featherLevel = v; onChange(); }, 'feather', state.lastValidFeatherLv, v => state.lastValidFeatherLv = v, badgeConfig, state, onChange);
  container.append(flowerPanel, orbPanel, featherPanel);
}

function createPartPanel(name, mainValue, mainOptions, subValues, subTimes, currentLevel, onLevelChange, type, lastValid, setLastValid, badgeConfig, state, globalOnChange) {
  const panel = document.createElement('div');
  panel.className = 'part-panel';
  panel.innerHTML = `<div class="part-title">${name}</div>`;

  // 等级输入
  const lvRow = document.createElement('div');
  lvRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;';
  lvRow.innerHTML = '<label style="font-size:12px;">等级：</label>';
  const lvInput = document.createElement('input');
  lvInput.type = 'number'; lvInput.min = 0; lvInput.max = 12;
  lvInput.value = currentLevel; lvInput.style.width = '60px';
  setupNumberInput(lvInput, 0, () => lastValid, setLastValid, (v) => {
    onLevelChange(v);
    updateMainSelectOptions(panel, v, badgeConfig);
  });
  lvRow.appendChild(lvInput);
  panel.appendChild(lvRow);

  // 主属性选择
  const mainGroup = document.createElement('div');
  mainGroup.className = 'attr-select-group';
  mainGroup.innerHTML = '<label>主属性</label>';
  const mainSelect = document.createElement('select');
  mainOptions.forEach(optId => {
    const opt = document.createElement('option');
    opt.value = optId;
    opt.textContent = getAttrDisplayName(optId, currentLevel, 0, badgeConfig);
    mainSelect.appendChild(opt);
  });
  mainSelect.value = mainValue;
  mainSelect.addEventListener('change', () => {
    if (type === 'flower') state.flowerMain = mainSelect.value;
    else if (type === 'orb') state.orbMain = mainSelect.value;
    else state.featherMain = mainSelect.value;
    globalOnChange();
  });
  mainGroup.appendChild(mainSelect);
  panel.appendChild(mainGroup);
  panel.mainSelect = mainSelect;

  // 副属性
  const subGroup = document.createElement('div');
  subGroup.className = 'attr-select-group';
  subGroup.innerHTML = '<label>副属性</label>';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'sub-upgrade-row';
    const subSelect = document.createElement('select');
    badgeConfig.sub_options.forEach(optId => {
      const opt = document.createElement('option');
      opt.value = optId;
      opt.textContent = getAttrDisplayName(optId, 0, subTimes[i], badgeConfig);
      subSelect.appendChild(opt);
    });
    subSelect.value = subValues[i];
    subSelect.addEventListener('change', () => {
      const newVal = subSelect.value;
      const arr = type === 'flower' ? state.flowerSubs : type === 'orb' ? state.orbSubs : state.featherSubs;
      const others = arr.filter((_, idx) => idx !== i);
      if (others.includes(newVal)) { subSelect.value = arr[i]; alert('该属性已存在'); return; }
      arr[i] = newVal;
      globalOnChange();
    });
    row.appendChild(subSelect);

    const minus = document.createElement('button'); minus.textContent = '-';
    const plus = document.createElement('button'); plus.textContent = '+';
    const span = document.createElement('span'); span.className = 'sub-times'; span.textContent = subTimes[i];
    minus.addEventListener('click', () => changeSubTimes(type, i, -1, panel, badgeConfig, state, globalOnChange));
    plus.addEventListener('click', () => changeSubTimes(type, i, 1, panel, badgeConfig, state, globalOnChange));
    row.appendChild(minus); row.appendChild(span); row.appendChild(plus);
    subGroup.appendChild(row);
  }
  panel.appendChild(subGroup);
  return panel;
}

function changeSubTimes(type, index, delta, panel, badgeConfig, state, onChange) {
  let arr = type === 'flower' ? state.flowerSubTimes : type === 'orb' ? state.orbSubTimes : state.featherSubTimes;
  const total = arr.reduce((a, b) => a + b, 0);
  if (delta > 0 && total >= (badgeConfig.max_sub_upgrades_per_part || 6)) return;
  const n = arr[index] + delta;
  if (n < 0) return;
  arr[index] = n;
  const spans = panel.querySelectorAll('.sub-times');
  if (spans[index]) spans[index].textContent = n;
  const select = panel.querySelectorAll('.sub-upgrade-row select')[index];
  if (select) {
    const opt = select.options[select.selectedIndex];
    const attrId = opt.value;
    opt.textContent = getAttrDisplayName(attrId, 0, n, badgeConfig);
  }
  onChange();
}

function updateMainSelectOptions(panel, level, badgeConfig) {
  const select = panel.mainSelect;
  [...select.options].forEach(opt => {
    opt.textContent = getAttrDisplayName(opt.value, level, 0, badgeConfig);
  });
}

export function getAttrDisplayName(attrId, level, extraLevel, badgeConfig) {
  const info = badgeConfig.main_attr_table?.[attrId] || badgeConfig.sub_attr_table?.[attrId];
  if (!info) return attrId;
  const parts = info.attr.split(':');
  const baseVal = parseInt(parts[2]);
  const totalAdd = info.add * (level + extraLevel);
  let val = baseVal + totalAdd;
  const attrName = ATTR_ID_MAP[parts[1]]?.name || parts[1];
  const isPercent = parts[0] === '2' || parts[1] === '40000316' || parts[1] === '40000501' || ATTR_ID_MAP[parts[1]]?.type === 'percent';
  const display = isPercent ? (Math.abs(val) / 100).toFixed(2) + '%' : Math.floor(val);
  return `${attrName}（${display}）`;
}

// ==================== 结果渲染 ====================
export function renderResult(attrGrid, finalStats, detail, showDetail, ATTR_ID_MAP) {
  const order = [
    "40000102","40000103","40000104",
    "40000201","40000204","40000202",
    "40000205","40000203",
    "40000301","40000302","40000303"
  ];
  attrGrid.innerHTML = order.map(id => {
    const name = ATTR_ID_MAP[id]?.name || id;
    const finalVal = finalStats[id] ?? 0;

    let detailHtml = '';
    if (showDetail && detail[id]) {
      const d = detail[id];
      if (id === '40000302') {
        detailHtml = `<span class="detail-raw">${d.raw}</span>`;
        if (d.badgeTotal !== 0) {
          detailHtml += ` <span class="detail-badge-add">${d.badgeTotal >= 0 ? '+' : ''}${d.badgeTotal}</span>`;
        }
      } else {
        const rawStr = formatAttr(id, d.raw);
        const badgeStr = formatAttr(id, d.badgeTotal);
        detailHtml = `<span class="detail-raw">${rawStr}</span>`;
        if (d.badgeTotal !== 0) {
          detailHtml += ` <span class="detail-badge-add">${d.badgeTotal >= 0 ? '+' : ''}${badgeStr}</span>`;
        }
      }
    }

    const finalDisplay = formatAttr(id, finalVal);

    return `<div class="attr-item">
      <div class="attr-row"><span class="attr-name">${name}</span><span>${finalDisplay}</span></div>
      ${showDetail ? `<div class="detail-line visible">${detailHtml}</div>` : `<div class="detail-line"></div>`}
    </div>`;
  }).join('');
}

// ==================== 角色选择弹窗 ====================
export function renderCharGrid(container, characters, selectedCharId, onSelect) {
  container.innerHTML = '';
  characters.forEach(c => {
    const card = document.createElement('div');
    card.className = 'char-card' + (selectedCharId === c.id ? ' selected' : '');
    const img = document.createElement('img');
    img.src = `./assets/card/BurstHead_${c.id - 10000100 + 10000}_1.png`;
    img.alt = c.name;
    img.onerror = () => { img.src = ''; };
    card.appendChild(img);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'card-name';
    nameSpan.textContent = c.name;
    card.appendChild(nameSpan);
    card.addEventListener('click', () => onSelect(c.id));
    container.appendChild(card);
  });
}

// ==================== 筛选按钮 ====================
export function initFilterButtons(starsGroup, profsGroup, elemsGroup, clearBtn, filterState, onFilterChange) {
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = '⭐' + i;
    btn.addEventListener('click', () => toggleFilter(filterState.stars, i, btn, onFilterChange));
    starsGroup.appendChild(btn);
  }
  ['坚甲','异刃','言灵','猎影'].forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = p;
    btn.addEventListener('click', () => toggleFilter(filterState.profs, p, btn, onFilterChange));
    profsGroup.appendChild(btn);
  });
  ['水属性','火属性','木属性','暗属性','光属性'].forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = e;
    btn.addEventListener('click', () => toggleFilter(filterState.elems, e, btn, onFilterChange));
    elemsGroup.appendChild(btn);
  });
  clearBtn.addEventListener('click', () => {
    filterState.stars.clear();
    filterState.profs.clear();
    filterState.elems.clear();
    updateFilterUI(starsGroup, profsGroup, elemsGroup, filterState);
    onFilterChange();
  });
}

function toggleFilter(set, value, btn, onChange) {
  if (set.has(value)) {
    set.delete(value);
    btn.classList.remove('active');
  } else {
    set.add(value);
    btn.classList.add('active');
  }
  onChange();
}

function updateFilterUI(starsGroup, profsGroup, elemsGroup, filterState) {
  starsGroup.querySelectorAll('.filter-btn').forEach(btn => {
    const star = parseInt(btn.textContent.slice(1));
    btn.classList.toggle('active', filterState.stars.has(star));
  });
  profsGroup.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', filterState.profs.has(btn.textContent));
  });
  elemsGroup.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', filterState.elems.has(btn.textContent));
  });
}