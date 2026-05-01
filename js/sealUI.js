import { setupNumberInput } from './uiUtils.js';

const RANKS = [
  { min: 0, max: 14, name: '黑铁', prefix: '01、黑铁' },
  { min: 16, max: 29, name: '青铜', prefix: '02、青铜' },
  { min: 31, max: 44, name: '白银', prefix: '03、白银' },
  { min: 46, max: 74, name: '黄金', prefix: '04、黄金' },
  { min: 76, max: 104, name: '铂金', prefix: '05、铂金' },
  { min: 106, max: 134, name: '秘银', prefix: '06、秘银' },
  { min: 136, max: 179, name: '山铜', prefix: '07、山铜' },
  { min: 181, max: 224, name: '精钢', prefix: '08、精钢' },
  { min: 226, max: 270, name: '赤金', prefix: '09、赤金' }
];

const BOUNDARY_MAP = {
  15:  { from: '黑铁', to: '青铜', fromPrefix: '01、黑铁', toPrefix: '02、青铜' },
  30:  { from: '青铜', to: '白银', fromPrefix: '02、青铜', toPrefix: '03、白银' },
  45:  { from: '白银', to: '黄金', fromPrefix: '03、白银', toPrefix: '04、黄金' },
  75:  { from: '黄金', to: '铂金', fromPrefix: '04、黄金', toPrefix: '05、铂金' },
  105: { from: '铂金', to: '秘银', fromPrefix: '05、铂金', toPrefix: '06、秘银' },
  135: { from: '秘银', to: '山铜', fromPrefix: '06、秘银', toPrefix: '07、山铜' },
  180: { from: '山铜', to: '精钢', fromPrefix: '07、山铜', toPrefix: '08、精钢' },
  225: { from: '精钢', to: '赤金', fromPrefix: '08、精钢', toPrefix: '09、赤金' }
};

const RANK_COLORS = {
  '黑铁': '#8a8a8a', '青铜': '#cd7f32', '白银': '#c0c0c0',
  '黄金': '#ffd700', '铂金': '#e5e4e2', '秘银': '#a9b2c3',
  '山铜': '#c77e3a', '精钢': '#b0b0b0', '赤金': '#cc8800'
};

const SEALS = {
  '坚甲': {
    large: { back: '坚甲底纹_ExploreDevelop_fui_atlas0.png.png', icon: 'icon_大坚甲_ExploreDevelop_fui_atlas0.png.png' },
    attack: '21171103_ItemIcon_fui_atlas2.png.png',
    defense: '21171203_ItemIcon_fui_atlas2.png.png',
    hp: '21171303_ItemIcon_fui_atlas2.png.png'
  },
  '异刃': {
    large: { back: '异刃底纹_ExploreDevelop_fui_atlas0.png.png', icon: 'icon_大异刃_ExploreDevelop_fui_atlas0.png.png' },
    attack: '21172103_ItemIcon_fui_atlas2.png.png',
    defense: '21172203_ItemIcon_fui_atlas2.png.png',
    hp: '21172303_ItemIcon_fui_atlas2.png.png'
  },
  '言灵': {
    large: { back: '言灵底纹_ExploreDevelop_fui_atlas0.png.png', icon: 'icon_大言灵_ExploreDevelop_fui_atlas0.png.png' },
    attack: '21173103_ItemIcon_fui_atlas2.png.png',
    defense: '21173203_ItemIcon_fui_atlas2.png.png',
    hp: '21173303_ItemIcon_fui_atlas2.png.png'
  },
  '猎影': {
    large: { back: '猎影底纹_ExploreDevelop_fui_atlas0.png.png', icon: 'icon_大猎影_ExploreDevelop_fui_atlas0.png.png' },
    attack: '21174103_ItemIcon_fui_atlas2.png.png',
    defense: '21174203_ItemIcon_fui_atlas2.png.png',
    hp: '21174303_ItemIcon_fui_atlas2.png.png'
  }
};

const SMALL_JOB_MAP = { 1: '坚甲', 2: '异刃', 4: '言灵', 5: '猎影' };
const BIG_JOB_MAP = { 1: '坚甲', 2: '异刃', 3: '言灵', 4: '猎影' };

export function initSealUI(container, editPanel, onStateChange, sealData) {
  let currentProf = '坚甲';
  const state = {
    '坚甲': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false, bigEnabled: true },
    '异刃': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false, bigEnabled: true },
    '言灵': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false, bigEnabled: true },
    '猎影': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false, bigEnabled: true }
  };

  const mainArea = container;
  const profSidebar = document.getElementById('sealProfSidebar');
  const layout = mainArea.parentNode;

  if (!layout.querySelector('.seal-close-btn')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'seal-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => layout.closest('.modal').hidden = true);
    layout.appendChild(closeBtn);
  }

  profSidebar.querySelectorAll('.seal-prof-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentProf = btn.dataset.prof;
      profSidebar.querySelectorAll('.seal-prof-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCircles(true);
      closeEditPanel(true);
    });
  });

  function renderCircles(animate = false) {
    if (animate) {
      mainArea.style.transition = 'opacity 0.15s';
      mainArea.style.opacity = '0';
    }
    const doRender = () => {
      mainArea.innerHTML = '';
      const wraps = document.createElement('div');
      wraps.className = 'seal-circles';
      wraps.appendChild(createCircle('large', '大刻印', null, state[currentProf].large));
      const smallRow = document.createElement('div');
      smallRow.className = 'seal-small-row';
      smallRow.appendChild(createCircle('small', '攻击', null, state[currentProf].attack, 'attack'));
      smallRow.appendChild(createCircle('small', '防御', null, state[currentProf].defense, 'defense'));
      smallRow.appendChild(createCircle('small', '生命', null, state[currentProf].hp, 'hp'));
      wraps.appendChild(smallRow);
      mainArea.appendChild(wraps);

      // 右侧总加成面板
      let totalPanel = document.getElementById('sealTotalPanel');
      if (!totalPanel) {
        totalPanel = document.createElement('div');
        totalPanel.id = 'sealTotalPanel';
        totalPanel.className = 'seal-total-panel';
        mainArea.appendChild(totalPanel);
      }
      updateTotalPanel(currentProf);

      if (animate) mainArea.style.opacity = '1';
    };
    if (animate) setTimeout(doRender, 150);
    else doRender();
  }

  function updateTotalPanel(prof) {
    const totalPanel = document.getElementById('sealTotalPanel');
    if (!totalPanel) return;
    const total = container.getTotalSealAdd(prof);
    totalPanel.innerHTML = `
      <div class="seal-total-title">${prof}刻印</div>
      <div class="seal-total-item"><span class="attr-label">攻击</span><span class="attr-value">+${total.atk}</span></div>
      <div class="seal-total-item"><span class="attr-label">防御</span><span class="attr-value">+${total.def}</span></div>
      <div class="seal-total-item"><span class="attr-label">生命</span><span class="attr-value">+${total.hp}</span></div>
    `;
  }

  function createCircle(position, label, iconSrc, level, type) {
    const circle = document.createElement('div');
    circle.className = position === 'large' ? 'seal-circle seal-circle-large-row' : 'seal-circle seal-circle-small';
    if (type) circle.dataset.sealType = type;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'seal-circle-img-wrap';
    const profSeals = SEALS[currentProf];

    if (position === 'large') {
      const back = document.createElement('img'); back.src = `./assets/seal/${profSeals.large.back}`; back.className = 'seal-circle-img';
      const icon = document.createElement('img'); icon.src = `./assets/seal/${profSeals.large.icon}`; icon.className = 'seal-circle-img';
      imgWrap.appendChild(back); imgWrap.appendChild(icon);
      circle.appendChild(imgWrap);

      const rightCol = document.createElement('div'); rightCol.className = 'seal-right-col';
      const rank = getRank(level);
      const rankWrap = document.createElement('div'); rankWrap.className = 'seal-rank-wrap';
      const rankBase = document.createElement('img'); rankBase.src = `./assets/seal/${rank.prefix}_底板_ExploreDevelop_fui_atlas0.png.png`; rankBase.className = 'seal-rank-img';
      const rankTex = document.createElement('img'); rankTex.src = `./assets/seal/${rank.prefix}_底纹_ExploreDevelop_fui_atlas0.png.png`; rankTex.className = 'seal-rank-img';
      rankWrap.appendChild(rankBase); rankWrap.appendChild(rankTex);
      const nameSpan = document.createElement('span'); nameSpan.className = 'seal-rank-text'; nameSpan.textContent = rank.name;
      nameSpan.style.textShadow = `0 0 6px ${RANK_COLORS[rank.name]}, 0 0 12px ${RANK_COLORS[rank.name]}`;
      rankWrap.appendChild(nameSpan);
      rightCol.appendChild(rankWrap);
      const lvDiv = document.createElement('div'); lvDiv.className = 'seal-circle-t1'; lvDiv.textContent = `lv.${level}`;
      rightCol.appendChild(lvDiv);
      circle.appendChild(rightCol);
    } else {
      const imgSrc = type === 'attack' ? profSeals.attack : type === 'defense' ? profSeals.defense : profSeals.hp;
      const icon = document.createElement('img'); icon.src = `./assets/seal/${imgSrc}`; icon.className = 'seal-circle-img';
      imgWrap.appendChild(icon);
      circle.appendChild(imgWrap);
      const lvDiv = document.createElement('div'); lvDiv.className = 'seal-circle-t1'; lvDiv.textContent = `lv.${level}`;
      circle.appendChild(lvDiv);
    }

    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditPanel(label, level, type || 'large');
    });
    return circle;
  }

  // 获取当前等级对应的段位对象（RANKS 元素）
  function getRank(level) {
    const b = state[currentProf]?.breakthrough;
    // 边界等级特殊处理
    if (BOUNDARY_MAP[level]) {
      const boundary = BOUNDARY_MAP[level];
      const targetName = b ? boundary.to : boundary.from;
      return RANKS.find(r => r.name === targetName) || RANKS[0];
    }
    for (let rank of RANKS) {
      if (level >= rank.min && level <= rank.max) return rank;
    }
    return RANKS[0];
  }

  // 大刻印加成 = 当前段位的品质加成 + 当前等级的一条等级加成
  function getBigSealAdd(profKey, level) {
    if (!state[profKey]?.bigEnabled) return { atk: 0, def: 0, hp: 0 };
    const bigJob = Object.keys(BIG_JOB_MAP).find(k => BIG_JOB_MAP[k] === profKey);
    if (!bigJob) return { atk: 0, def: 0, hp: 0 };
    const baseId = 21180000 + parseInt(bigJob);

    const rank = getRank(level);
    const rankIndex = RANKS.indexOf(rank);   // 黑铁=0, 青铜=1, ...
    if (rankIndex === -1) return { atk: 0, def: 0, hp: 0 };

    let totalAdd = { atk: 0, def: 0, hp: 0 };

    // 1. 品质加成 (big_quality_up) : key = baseId * 1000 + rankIndex
    const qualityKey = baseId * 1000 + rankIndex;
    const qualityData = sealData.big_quality_up[qualityKey];
    if (qualityData && qualityData.add_attr) {
      qualityData.add_attr.forEach(str => {
        const [_, attrId, val] = str.split(':');
        const num = parseInt(val);
        if (attrId === '40000103') totalAdd.atk += num;
        else if (attrId === '40000104') totalAdd.def += num;
        else if (attrId === '40000102') totalAdd.hp += num;
      });
    }

    // 2. 等级加成 (big_level_up) : key = baseId * 1000 + level
    const levelKey = baseId * 1000 + level;
    const levelData = sealData.big_level_up[levelKey];
    if (levelData && levelData.add_attr) {
      levelData.add_attr.forEach(str => {
        const [_, attrId, val] = str.split(':');
        const num = parseInt(val);
        if (attrId === '40000103') totalAdd.atk += num;
        else if (attrId === '40000104') totalAdd.def += num;
        else if (attrId === '40000102') totalAdd.hp += num;
      });
    }

    return totalAdd;
  }

  let editingType = null;
  let editTimer = null;

  function openEditPanel(label, level, type) {
    if (editingType && editingType.type === type && editPanel.classList.contains('open')) return;
    if (editPanel.classList.contains('open')) {
      closeEditPanel(true);
      clearTimeout(editTimer);
      editTimer = setTimeout(() => openEditPanelCore(label, level, type), 80);
    } else {
      openEditPanelCore(label, level, type);
    }
  }

  function openEditPanelCore(label, level, type) {
    const editBody = document.getElementById('sealEditBody');
    const editTitle = document.getElementById('sealEditTitle');
    editTitle.textContent = label + '等级';
    editingType = { type };
    editBody.innerHTML = '';

    if (type === 'large') {
      const max = 270;
      const levelInput = document.createElement('input');
      levelInput.type = 'number'; levelInput.min = 0; levelInput.max = max;
      levelInput.value = level; levelInput.style.width = '100px';
      editBody.appendChild(levelInput);
      let lastV = level;

      const updateBigUI = (v) => {
        state[currentProf].large = v;
        renderCircles(false);
        if (onStateChange) onStateChange();
        const totalAdd = getBigSealAdd(currentProf, v);
        const addDiv = document.getElementById('sealBigTotalAdd');
        if (addDiv) {
          addDiv.innerHTML = `总加成：<br>攻击 +${totalAdd.atk}  防御 +${totalAdd.def}  生命 +${totalAdd.hp}`;
        }
        updateTotalPanel(currentProf);
      };
      setupNumberInput(levelInput, 0, () => lastV, v => lastV = v, updateBigUI);

      // 滑块 - 突破进入下一段
      const toggleRow1 = document.createElement('div');
      toggleRow1.style.cssText = 'display:flex; align-items:center; gap:8px; margin-top:12px;';
      const label1 = document.createElement('label');
      label1.className = 'toggle-switch';
      const checkbox1 = document.createElement('input');
      checkbox1.type = 'checkbox';
      checkbox1.checked = state[currentProf].breakthrough;
      checkbox1.addEventListener('change', () => {
        state[currentProf].breakthrough = checkbox1.checked;
        renderCircles(false);
        if (onStateChange) onStateChange();
        const totalAdd = getBigSealAdd(currentProf, state[currentProf].large);
        const addDiv = document.getElementById('sealBigTotalAdd');
        if (addDiv) addDiv.innerHTML = `总加成：<br>攻击 +${totalAdd.atk}  防御 +${totalAdd.def}  生命 +${totalAdd.hp}`;
        updateTotalPanel(currentProf);
      });
      const slider1 = document.createElement('span');
      slider1.className = 'slider';
      label1.appendChild(checkbox1);
      label1.appendChild(slider1);
      const text1 = document.createElement('span');
      text1.className = 'toggle-label';
      text1.textContent = '突破进入下一段';
      toggleRow1.appendChild(label1);
      toggleRow1.appendChild(text1);
      editBody.appendChild(toggleRow1);

      // 滑块 - 启用大刻印
      const toggleRow2 = document.createElement('div');
      toggleRow2.style.cssText = 'display:flex; align-items:center; gap:8px; margin-top:8px;';
      const label2 = document.createElement('label');
      label2.className = 'toggle-switch';
      const checkbox2 = document.createElement('input');
      checkbox2.type = 'checkbox';
      checkbox2.checked = state[currentProf].bigEnabled;
      checkbox2.addEventListener('change', () => {
        state[currentProf].bigEnabled = checkbox2.checked;
        renderCircles(false);
        if (onStateChange) onStateChange();
        const totalAdd = getBigSealAdd(currentProf, state[currentProf].large);
        const addDiv = document.getElementById('sealBigTotalAdd');
        if (addDiv) addDiv.innerHTML = `总加成：<br>攻击 +${totalAdd.atk}  防御 +${totalAdd.def}  生命 +${totalAdd.hp}`;
        updateTotalPanel(currentProf);
      });
      const slider2 = document.createElement('span');
      slider2.className = 'slider';
      label2.appendChild(checkbox2);
      label2.appendChild(slider2);
      const text2 = document.createElement('span');
      text2.className = 'toggle-label';
      text2.textContent = '启用大刻印';
      toggleRow2.appendChild(label2);
      toggleRow2.appendChild(text2);
      editBody.appendChild(toggleRow2);

      // 总加成显示
      const totalAdd = getBigSealAdd(currentProf, level);
      const addDiv = document.createElement('div');
      addDiv.id = 'sealBigTotalAdd';
      addDiv.style.cssText = 'margin-top:12px; font-size:13px; color:#ffd966;';
      addDiv.innerHTML = `总加成：<br>攻击 +${totalAdd.atk}  防御 +${totalAdd.def}  生命 +${totalAdd.hp}`;
      editBody.appendChild(addDiv);
    } else {
      // 小圆编辑部分保持不变...
      // 小圆卡片列表（降序，含0级）
      const job = Object.keys(SMALL_JOB_MAP).find(k => SMALL_JOB_MAP[k] === currentProf);
      if (!job) return;
      const attrType = type === 'attack' ? 1 : type === 'defense' ? 2 : 3;
      const listContainer = document.createElement('div');
      listContainer.className = 'seal-level-list';
      const smallSeals = sealData.small_seals;
      const entries = [];
      for (let id in smallSeals) {
        const s = smallSeals[id];
        if (s.job === parseInt(job) && s.attr_type === attrType) entries.push(s);
      }
      entries.sort((a, b) => b.level - a.level); // 降序
      const zeroEntry = { level: 0, value: [`1:${attrType===1?'40000103':attrType===2?'40000104':'40000102'}:0`] };
      entries.unshift(zeroEntry);

      entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'seal-level-card' + (entry.level === level ? ' active' : '');
        const [_, attrId, num] = entry.value[0].split(':');
        const attrName = entry.level === 0 ? '无加成' : (attrType === 1 ? '攻击' : attrType === 2 ? '防御' : '生命');
        card.innerHTML = `<span class="level-num">${entry.level}级</span> <span class="attr-bonus">${attrName}${entry.level===0?'':'+'+num}</span>`;
        card.addEventListener('click', () => {
          if (type === 'attack') state[currentProf].attack = entry.level;
          else if (type === 'defense') state[currentProf].defense = entry.level;
          else state[currentProf].hp = entry.level;
          renderCircles(false);
          if (onStateChange) onStateChange();
          updateTotalPanel(currentProf);
          closeEditPanel(true);
        });
        listContainer.appendChild(card);
      });
      editBody.appendChild(listContainer);
    }

    editPanel.classList.add('open');
  }

  function closeEditPanel(instant = false) {
    if (instant) {
      editPanel.classList.remove('open');
      editingType = null;
      return;
    }
    editPanel.classList.remove('open');
    editingType = null;
  }

  document.getElementById('sealEditClose').addEventListener('click', () => closeEditPanel());
  container.addEventListener('click', (e) => {
    if (!e.target.closest('.seal-circle') && !e.target.closest('.seal-edit-panel')) {
      closeEditPanel();
    }
  });

container.getTotalSealAdd = (profession) => {
  let result = { atk: 0, def: 0, hp: 0 };
  if (!profession) return result;
  const profState = state[profession];
  if (!profState) return result;

  // 大刻印
  const big = getBigSealAdd(profession, profState.large);
  result.atk += big.atk;
  result.def += big.def;
  result.hp += big.hp;

  // 小刻印（乘以 1.1，向上取整，使用整数计算避免浮点误差）
  const job = Object.keys(SMALL_JOB_MAP).find(k => SMALL_JOB_MAP[k] === profession);
  if (job) {
    const smallSeals = sealData.small_seals;
    const addSmall = (typeNum, level) => {
      if (!level) return { atk: 0, def: 0, hp: 0 };
      for (let id in smallSeals) {
        const s = smallSeals[id];
        if (s.job === parseInt(job) && s.attr_type === typeNum && s.level === level) {
          const [_, attrId, val] = s.value[0].split(':');
          const num = parseInt(val);
          if (attrId === '40000103') return { atk: num, def: 0, hp: 0 };
          if (attrId === '40000104') return { atk: 0, def: num, hp: 0 };
          if (attrId === '40000102') return { atk: 0, def: 0, hp: num };
        }
      }
      return { atk: 0, def: 0, hp: 0 };
    };
    const atk = addSmall(1, profState.attack);
    const def = addSmall(2, profState.defense);
    const hp = addSmall(3, profState.hp);
    result.atk += Math.ceil(atk.atk * 11 / 10);   // ← 修改点
    result.def += Math.ceil(def.def * 11 / 10);
    result.hp += Math.ceil(hp.hp * 11 / 10);
  }
  return result;
};

  renderCircles(false);
}