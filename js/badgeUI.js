// badgeUI.js

import { ATTR_ID_MAP, formatAttr } from './calculator.js';
import { setupNumberInput } from './uiUtils.js';

// ==================== 图标辅助 ====================
function getSuitIconPath(suitId) {
  return `./assets/badge/${suitId}_ItemIcon_fui_atlas0.png.png`;
}

function getPartIconPath(suitId, partType) {
  if (!suitId) return '';
  // 套装序号 = suitId - 40008000 - 1，转为两位数字（第一套序号00）
  const seq = (suitId - 40008000 - 1).toString().padStart(2, '0');
  let partNum;
  if (partType === 'flower') partNum = 1;
  else if (partType === 'orb') partNum = 2;
  else if (partType === 'feather') partNum = 3;
  else return '';
  return `./assets/badge/2108${seq}1${partNum}_ItemIcon_fui_atlas1.png.png`;
}

// ==================== 主入口 ====================
export function renderBadgeUI(badgeConfig, suitGrid, partsContainer, badgeState, onChange) {
  renderSuitGrid(suitGrid, badgeConfig.suits, badgeState.selectedSuitId, (newId) => {
    badgeState.selectedSuitId = newId;
    Array.from(suitGrid.children).forEach(card => {
      const suitId = parseInt(card.dataset.suitId);
      card.classList.toggle('selected', suitId === newId);
    });
    renderPartsPanel(partsContainer, badgeConfig, badgeState, onChange);
    onChange();
  });
  renderPartsPanel(partsContainer, badgeConfig, badgeState, onChange);
}

// ==================== 套装网格 ====================
function renderSuitGrid(container, suits, selectedSuitId, onSelect) {
  container.innerHTML = '';
  suits.forEach(suit => {
    const card = document.createElement('div');
    card.className = 'suit-card' + (selectedSuitId === suit.id ? ' selected' : '');
    card.dataset.suitId = suit.id;
    card.style.cssText = 'overflow:auto; padding:8px;';
    card.innerHTML = `
      <img src="${getSuitIconPath(suit.id)}" alt="${suit.name}" 
           style="float:left; width:48px; height:48px; object-fit:contain; margin-right:12px; margin-bottom:4px;">
      <div style="font-size:16px; font-weight:bold; color:#fff; margin-bottom:4px;">${suit.name}</div>
      <div style="clear:left; font-size:12px; color:#aaa; margin-bottom:2px;">${suit.parts}</div>
      <div style="font-size:12px; color:#ccc;">2件: ${suit.desc2}</div>
      <div style="font-size:12px; color:#ccc;">3件: ${suit.desc3}</div>
    `;
    card.addEventListener('click', () => onSelect(suit.id));
    container.appendChild(card);
  });
}

// ==================== 部位面板 ====================
function renderPartsPanel(container, badgeConfig, state, onChange) {
  container.innerHTML = '';
  const suitId = state.selectedSuitId;
  if (!suitId) {
    container.innerHTML = '<p style="color:#aaa;">请先选择套装</p>';
    return;
  }
  const flowerPanel = createPartPanel('花', state.flowerMain, badgeConfig.flower_main_options, state.flowerSubs, state.flowerSubTimes, state.flowerLevel,
    (v) => { state.flowerLevel = v; onChange(); }, 'flower', state.lastValidFlowerLv, v => state.lastValidFlowerLv = v, badgeConfig, state, onChange, suitId);
  const orbPanel = createPartPanel('球', state.orbMain, badgeConfig.orb_main_options, state.orbSubs, state.orbSubTimes, state.orbLevel,
    (v) => { state.orbLevel = v; onChange(); }, 'orb', state.lastValidOrbLv, v => state.lastValidOrbLv = v, badgeConfig, state, onChange, suitId);
  const featherPanel = createPartPanel('羽', state.featherMain, badgeConfig.feather_main_options, state.featherSubs, state.featherSubTimes, state.featherLevel,
    (v) => { state.featherLevel = v; onChange(); }, 'feather', state.lastValidFeatherLv, v => state.lastValidFeatherLv = v, badgeConfig, state, onChange, suitId);
  container.append(flowerPanel, orbPanel, featherPanel);
}

function createPartPanel(name, mainValue, mainOptions, subValues, subTimes, currentLevel, onLevelChange, type, lastValid, setLastValid, badgeConfig, state, globalOnChange, suitId) {
  const panel = document.createElement('div');
  panel.className = 'part-panel';

  // ---------- 标题行（图标+名称 左对齐，等级 右对齐） ----------
  const titleRow = document.createElement('div');
  titleRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;';
  
  const leftPart = document.createElement('div');
  leftPart.style.cssText = 'display:flex; align-items:center; gap:6px;';
  const iconPath = getPartIconPath(suitId, type);
  if (iconPath) {
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = name;
    img.style.cssText = 'width:30px; height:30px; object-fit:contain;';
    leftPart.appendChild(img);
  }
  const titleText = document.createElement('div');
  titleText.className = 'part-title';
  titleText.textContent = name;
  leftPart.appendChild(titleText);
  titleRow.appendChild(leftPart);

  const rightPart = document.createElement('div');
  rightPart.style.cssText = 'display:flex; align-items:center; gap:6px;';
  const label = document.createElement('label');
  label.style.cssText = 'font-size:12px; color:#ccc;';
  label.textContent = '等级：';
  rightPart.appendChild(label);
  const lvInput = document.createElement('input');
  lvInput.type = 'number';
  lvInput.min = 0;
  lvInput.max = 12;
  lvInput.value = currentLevel;
  lvInput.style.width = '60px';
  setupNumberInput(lvInput, 0, () => lastValid, setLastValid, (v) => {
    onLevelChange(v);
    updateMainSelectOptions(panel, v, badgeConfig);
  });
  rightPart.appendChild(lvInput);
  titleRow.appendChild(rightPart);
  
  panel.appendChild(titleRow);

  // ---------- 主属性 ----------
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

  // ---------- 副属性 ----------
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