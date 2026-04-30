// skillUI.js

// 被动技能图标映射（按技能名称）
const passiveIcons = {
    '战斗精通': 'Grow_1_SkillIcon_fui_atlas0.png.png',
    '防护强化': 'Grow_2_SkillIcon_fui_atlas0_1.png.png',
    '体能突破': 'Grow_3_SkillIcon_fui_atlas0_1.png.png',
    '战斗诀窍': 'Grow_4_SkillIcon_fui_atlas0.png.png',
    '极致锋芒': 'Grow_5_SkillIcon_fui_atlas0.png.png',
    '坚毅斗志': 'Grow_6_SkillIcon_fui_atlas0.png.png',
    '冲击术': 'Grow_10_SkillIcon_fui_atlas0.png.png'
};

// 觉醒图标映射（按觉醒名称）
const awakeningIcons = {
    '同调': 'Passive_3003_SkillStarIcon_fui_atlas0.png.png',
    '启示': 'Passive_3002_SkillStarIcon_fui_atlas0.png.png',
    '升变': 'Passive_3001_SkillStarIcon_fui_atlas0.png.png',
    '斗志激昂': 'Passive_4003_SkillStarIcon_fui_atlas0.png.png',
    '不朽之辉': 'Passive_4003_SkillStarIcon_fui_atlas0.png.png',
    '狂风意志': 'Passive_4001_SkillStarIcon_fui_atlas0.png.png',
    '征服之光': 'Passive_4001_SkillStarIcon_fui_atlas0.png.png',
    '生存本能': 'Passive_4002_SkillStarIcon_fui_atlas0.png.png',
    '无畏之志': 'Passive_4002_SkillStarIcon_fui_atlas0.png.png',
    '潜能激发': 'Passive_2001_SkillStarIcon_fui_atlas0.png.png',
    '本源共鸣': 'Passive_5001_SkillStarIcon_fui_atlas0.png.png'
};

/**
 * 渲染被动技能面板
 * @param {HTMLElement} container - 被动技能容器
 * @param {object} char - 当前角色数据
 * @param {function} onPassiveChange - 等级改变时的回调
 */
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
    row.style.cssText = 'overflow:auto; padding:8px;';

    // 图标（浮动左侧）
    const iconFile = passiveIcons[skillName];
    if (iconFile) {
      const img = document.createElement('img');
      img.src = './assets/grow&passive/' + iconFile;
      img.alt = skillName;
      img.style.cssText = 'float:left; width:36px; height:36px; object-fit:contain; margin-right:8px; margin-bottom:4px;';
      row.appendChild(img);
    }

    // 技能名（与图标同行）
    const nameDiv = document.createElement('div');
    nameDiv.className = 'skill-name';
    nameDiv.textContent = skillName;
    nameDiv.style.cssText = 'font-weight:bold; margin-bottom:4px;';
    row.appendChild(nameDiv);

    // 描述（清除浮动，另起一行）
    const descDiv = document.createElement('div');
    descDiv.className = 'passive-desc';
    descDiv.setAttribute('data-raw', descBody.replace(/"/g, '&quot;'));
    descDiv.textContent = descBody;
    descDiv.style.cssText = 'clear:left; font-size:13px; line-height:1.6; margin-bottom:8px; color:#ccc;';
    row.appendChild(descDiv);

    // 等级选择（紧凑排列）
    const skillSelectDiv = document.createElement('div');
    skillSelectDiv.className = 'skill-select';
    skillSelectDiv.style.cssText = 'display:flex; align-items:center; gap:6px;';
    const label = document.createElement('label');
    label.textContent = '等级：';
    label.style.cssText = 'font-size:13px; color:#aaa;';
    skillSelectDiv.appendChild(label);
    const select = document.createElement('select');
    select.className = 'passive-level';
    select.style.cssText = 'width:55px; padding:2px 4px; font-size:13px;';
    select.innerHTML = `
      <option value="0">0级</option>
      <option value="1">1级</option>
      <option value="2">2级</option>
      <option value="3">3级</option>
    `;
    select.addEventListener('change', () => {
      updatePassiveHighlight(row, parseInt(select.value));
      onPassiveChange();
    });
    skillSelectDiv.appendChild(select);
    row.appendChild(skillSelectDiv);

    container.appendChild(row);
  });
}

/**
 * 更新被动技能行的高亮
 * @param {HTMLElement} row - 被动行元素
 * @param {number} level - 当前等级（0-3）
 */
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

/**
 * 渲染觉醒卡片
 * @param {HTMLElement} container - 觉醒容器
 * @param {object} char - 当前角色数据
 * @param {Set} awakeActive - 当前已激活的觉醒编号集合
 * @param {function} onToggleAwake - 点击卡片时的回调，传递觉醒编号
 */
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
    card.style.cssText = 'overflow:auto; padding:8px;';

    // 图标
    const iconFile = awakeningIcons[title];
    if (iconFile) {
      const img = document.createElement('img');
      img.src = './assets/grow&passive/' + iconFile;
      img.alt = title;
      img.style.cssText = 'float:left; width:36px; height:36px; object-fit:contain; margin-right:8px; margin-bottom:4px;';
      card.appendChild(img);
    }

    // 觉醒标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'awake-title';
    titleDiv.textContent = title;
    titleDiv.style.cssText = 'font-weight:bold; margin-bottom:4px;';
    card.appendChild(titleDiv);

    // 描述
    const descDiv = document.createElement('div');
    descDiv.className = 'awake-desc';
    descDiv.textContent = body;
    descDiv.style.cssText = 'clear:left; font-size:13px; color:#ccc; white-space:pre-line;';
    card.appendChild(descDiv);

    card.addEventListener('click', () => onToggleAwake(awakeIndex));
    container.appendChild(card);
  });
  updateAwakeUI(container, awakeActive);
}

/**
 * 切换觉醒激活状态（栈式逻辑）
 * @param {number} index - 觉醒编号（1-5）
 * @param {Set} awakeActive - 当前激活状态集合
 * @param {HTMLElement} container - 觉醒容器
 * @param {function} onAwakeChanged - 变化后回调
 */
export function toggleAwake(index, awakeActive, container, onAwakeChanged) {
  if (awakeActive.has(index)) {
    for (let i = 5; i >= index; i--) awakeActive.delete(i);
  } else {
    for (let i = 1; i <= index; i++) awakeActive.add(i);
  }
  updateAwakeUI(container, awakeActive);
  onAwakeChanged();
}

// 内部函数：更新觉醒卡片的高亮样式
function updateAwakeUI(container, awakeActive) {
  container.querySelectorAll('.awake-card').forEach(card => {
    const idx = parseInt(card.dataset.awakeIndex);
    card.classList.toggle('active', awakeActive.has(idx));
  });
}