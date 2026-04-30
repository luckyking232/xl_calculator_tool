// charUI.js

/**
 * 角色选择弹窗 & 筛选按钮
 */

/**
 * 渲染角色网格
 * @param {HTMLElement} container - 角色网格容器
 * @param {Array} characters - 角色列表
 * @param {number|null} selectedCharId - 当前选中的角色ID
 * @param {function} onSelect - 选中回调，接收角色ID
 */
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

/**
 * 初始化筛选按钮
 * @param {HTMLElement} starsGroup - 星级筛选按钮组容器
 * @param {HTMLElement} profsGroup - 职业筛选按钮组容器
 * @param {HTMLElement} elemsGroup - 元素筛选按钮组容器
 * @param {HTMLElement} clearBtn - 清除筛选按钮
 * @param {object} filterState - 筛选状态对象 { stars: Set, profs: Set, elems: Set }
 * @param {function} onFilterChange - 筛选变化后的回调
 */
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

// 内部函数：切换某个筛选值
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

// 内部函数：更新所有筛选按钮的激活样式
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