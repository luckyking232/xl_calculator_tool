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

// 段位对应的金属颜色（用于文字描边）
const RANK_COLORS = {
  '黑铁': '#8a8a8a',
  '青铜': '#cd7f32',
  '白银': '#c0c0c0',
  '黄金': '#ffd700',
  '铂金': '#e5e4e2',
  '秘银': '#a9b2c3',
  '山铜': '#c77e3a',
  '精钢': '#b0b0b0',
  '赤金': '#cc8800'
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

export function initSealUI(container, editPanel, onStateChange) {
  let currentProf = '坚甲';
  const state = {
    '坚甲': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false },
    '异刃': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false },
    '言灵': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false },
    '猎影': { large: 0, attack: 0, defense: 0, hp: 0, breakthrough: false }
  };

  const mainArea = container;
  const profSidebar = document.getElementById('sealProfSidebar');
  const layout = mainArea.parentNode; // .seal-layout

  // ----- 自动生成关闭按钮（不需要改HTML） -----
  if (!layout.querySelector('.seal-close-btn')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'seal-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
      layout.closest('.modal').hidden = true;
    });
    layout.appendChild(closeBtn);
  }

  // ----- 职业切换 -----
  profSidebar.querySelectorAll('.seal-prof-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentProf = btn.dataset.prof;
      profSidebar.querySelectorAll('.seal-prof-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCircles(true);      // 切换职业，播放淡入淡出
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

      // 大圆（左右并排布局）
      wraps.appendChild(createCircle('large', '大刻印', SEALS[currentProf].large, state[currentProf].large));

      // 三个小圆：攻击、生命、防御
      const smallRow = document.createElement('div');
      smallRow.className = 'seal-small-row';
      smallRow.appendChild(createCircle('small', '攻击', SEALS[currentProf].attack, state[currentProf].attack, 'attack'));
      smallRow.appendChild(createCircle('small', '生命', SEALS[currentProf].hp, state[currentProf].hp, 'hp'));
      smallRow.appendChild(createCircle('small', '防御', SEALS[currentProf].defense, state[currentProf].defense, 'defense'));
      wraps.appendChild(smallRow);

      mainArea.appendChild(wraps);
      if (animate) {
        mainArea.style.opacity = '1';
      }
    };

    if (animate) {
      setTimeout(doRender, 150);
    } else {
      doRender();
    }
  }

  function createCircle(position, label, iconSrc, level, type) {
    const circle = document.createElement('div');
    // 大圆使用特殊类名，不再用 seal-circle-large
    circle.className = position === 'large' ? 'seal-circle seal-circle-large-row' : 'seal-circle seal-circle-small';
    if (type) circle.dataset.sealType = type;

    // 图标容器
    const imgWrap = document.createElement('div');
    imgWrap.className = 'seal-circle-img-wrap';
    if (typeof iconSrc === 'object') {
      const back = document.createElement('img');
      back.src = `./assets/seal/${iconSrc.back}`;
      back.className = 'seal-circle-img';
      imgWrap.appendChild(back);
      const icon = document.createElement('img');
      icon.src = `./assets/seal/${iconSrc.icon}`;
      icon.className = 'seal-circle-img';
      imgWrap.appendChild(icon);
    } else {
      const icon = document.createElement('img');
      icon.src = `./assets/seal/${iconSrc}`;
      icon.className = 'seal-circle-img';
      imgWrap.appendChild(icon);
    }

    if (position === 'large') {
      // 左侧图标
      circle.appendChild(imgWrap);

      // 右侧：段位 + 等级
      const rightCol = document.createElement('div');
      rightCol.className = 'seal-right-col';

      const rank = getRank(level);
      const rankWrap = document.createElement('div');
      rankWrap.className = 'seal-rank-wrap';
      const rankBase = document.createElement('img');
      rankBase.src = `./assets/seal/${rank.prefix}_底板_ExploreDevelop_fui_atlas0.png.png`;
      rankBase.className = 'seal-rank-img';
      rankWrap.appendChild(rankBase);
      const rankTex = document.createElement('img');
      rankTex.src = `./assets/seal/${rank.prefix}_底纹_ExploreDevelop_fui_atlas0.png.png`;
      rankTex.className = 'seal-rank-img';
      rankWrap.appendChild(rankTex);

      // 段位文字（宋体、小一号、金属泛光描边）
      const nameSpan = document.createElement('span');
      nameSpan.className = 'seal-rank-text';
      nameSpan.textContent = rank.name;
      const glowColor = RANK_COLORS[rank.name] || '#ffffff';
      nameSpan.style.textShadow = `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`;
      nameSpan.style.fontFamily = '"SimSun", "宋体", serif';
      nameSpan.style.fontSize = '11px';   // 比原来的12px小一号
      rankWrap.appendChild(nameSpan);

      rightCol.appendChild(rankWrap);

      const lvDiv = document.createElement('div');
      lvDiv.className = 'seal-circle-t1';
      lvDiv.textContent = `lv.${level}`;
      rightCol.appendChild(lvDiv);

      circle.appendChild(rightCol);
    } else {
      // 小圆：图标在上，等级在下
      circle.appendChild(imgWrap);
      const lvDiv = document.createElement('div');
      lvDiv.className = 'seal-circle-t1';
      lvDiv.textContent = `lv.${level}`;
      circle.appendChild(lvDiv);
    }

    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditPanel(label, level, type || 'large');
    });
    return circle;
  }

  function getRank(level) {
    const b = state[currentProf].breakthrough;
    if (BOUNDARY_MAP[level]) {
      const boundary = BOUNDARY_MAP[level];
      return b ? { name: boundary.to, prefix: boundary.toPrefix } : { name: boundary.from, prefix: boundary.fromPrefix };
    }
    for (let rank of RANKS) {
      if (level >= rank.min && level <= rank.max) return rank;
    }
    return RANKS[0];
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
    const isLarge = (type === 'large');
    const max = isLarge ? 270 : 10;
    const levelInput = document.createElement('input');
    levelInput.type = 'number';
    levelInput.min = 0;
    levelInput.max = max;
    levelInput.value = level;
    levelInput.style.width = '100px';
    editBody.appendChild(levelInput);

    let lastV = level;
    setupNumberInput(levelInput, 0, () => lastV, v => lastV = v, (v) => {
      switch (type) {
        case 'large': state[currentProf].large = v; break;
        case 'attack': state[currentProf].attack = v; break;
        case 'defense': state[currentProf].defense = v; break;
        case 'hp': state[currentProf].hp = v; break;
      }
      renderCircles(false);
    });

    if (isLarge) {
      const toggleRow = document.createElement('div');
      toggleRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-top:12px;';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state[currentProf].breakthrough;
      checkbox.addEventListener('change', () => {
        state[currentProf].breakthrough = checkbox.checked;
        renderCircles(false);
      });
      toggleRow.appendChild(checkbox);
      const toggleLabel = document.createElement('label');
      toggleLabel.textContent = '突破进入下一段';
      toggleLabel.style.cssText = 'font-size:12px; color:#ccc;';
      toggleRow.appendChild(toggleLabel);
      editBody.appendChild(toggleRow);
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

  renderCircles(false);
}