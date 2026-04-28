document.addEventListener('DOMContentLoaded', () => {
  // ==================== DOM 元素 ====================
  // 主界面
  const charImg = document.getElementById('charImg');
  const charName = document.getElementById('charName');
  const charDetail = document.getElementById('charDetail');
  const changeCharBtn = document.getElementById('changeCharBtn');
  const attrGrid = document.getElementById('attrGrid');

  // 等级浮窗
  const modalLevel = document.getElementById('modal-level');
  const tierSelect = document.getElementById('tierSelect');
  const levelInput = document.getElementById('levelInput');
  const levelRange = document.getElementById('levelRange');
  const closeLevelBtn = document.getElementById('closeLevelBtn');

  // 被动浮窗
  const modalPassive = document.getElementById('modal-passive');
  const passiveContainer = document.getElementById('passiveContainer');
  const closePassiveBtn = document.getElementById('closePassiveBtn');

  // 觉醒浮窗
  const modalAwake = document.getElementById('modal-awake');
  const awakeCardsContainer = document.getElementById('awakeCardsContainer');
  const closeAwakeBtn = document.getElementById('closeAwakeBtn');

  // 角色选择弹窗
  const pickerModal = document.getElementById('pickerModal');
  const charGrid = document.getElementById('charGrid');
  const confirmPickBtn = document.getElementById('confirmPickBtn');
  const cancelPickBtn = document.getElementById('cancelPickBtn');

  // 侧边按钮
  const sideBtns = document.querySelectorAll('.side-btn');

  // ==================== 数据变量 ====================
  let characters = [];
  let levelUpData = {};
  let qualityUpData = {};
  let skillLevelUpData = {};
  let currentCharId = null;
  let selectedCharId = null;
  let filterStars = new Set();
  let filterProfs = new Set();
  let filterElems = new Set();
  let awakeActive = new Set();

  // 属性映射
  const ATTR_ID_MAP = {
    "40000102": { name: "生命", type: "int" },
    "40000103": { name: "攻击", type: "int" },
    "40000104": { name: "防御", type: "int" },
    "40000201": { name: "暴击率", type: "percent" },
    "40000204": { name: "暴击伤害", type: "percent" },
    "40000202": { name: "格挡率", type: "percent" },
    "40000205": { name: "格挡强度", type: "percent" },
    "40000203": { name: "闪避率", type: "percent" },
    "40000301": { name: "移速", type: "int" },
    "40000302": { name: "攻速", type: "speed" },
    "40000303": { name: "攻击距离", type: "int" }
  };

  function formatAttr(attrId, value) {
    const cfg = ATTR_ID_MAP[attrId];
    if (!cfg) return String(value);
    if (cfg.type === "percent") return (value / 100).toFixed(2) + "%";
    if (cfg.type === "speed") return (value / 1000).toFixed(2) + " 秒";
    return String(Math.floor(value));
  }

  // ==================== 数据加载 ====================
  async function loadData() {
    try {
      const [charRes, levelRes, qualityRes, skillRes] = await Promise.all([
        fetch('./data/characters_base.json'),
        fetch('./data/level_up.json'),
        fetch('./data/quality_up.json'),
        fetch('./data/skill_level_up.json')
      ]);
      characters = await charRes.json();
      levelUpData = await levelRes.json();
      qualityUpData = await qualityRes.json();
      skillLevelUpData = await skillRes.json();

      characters.sort((a, b) => a.id - b.id);
      if (characters.length > 0) selectCharacter(characters[0].id);
      initFilterButtons();
    } catch (err) {
      console.error(err);
      alert('数据加载失败');
    }
  }

  function getBurstHeadName(id) {
    const burstId = id - 10000100 + 10000;
    return `BurstHead_${burstId}_1.png`;
  }

  // ==================== 浮窗控制 ====================
  function openModal(modal) { modal.hidden = false; }
  function closeModal(modal) { modal.hidden = true; }

  sideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId === 'level') openModal(modalLevel);
      else if (modalId === 'passive') openModal(modalPassive);
      else if (modalId === 'awake') openModal(modalAwake);
    });
  });

  [closeLevelBtn, closePassiveBtn, closeAwakeBtn].forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });

  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', () => closeModal(bd.parentElement));
  });

  // ==================== 角色选择 ====================
  function selectCharacter(id) {
    currentCharId = id;
    const char = characters.find(c => c.id == id);
    if (!char) return;

    charName.textContent = char.name;
    charDetail.textContent = `${char.star}⭐ ${char.element} ${char.profession}`;
    charImg.src = `./assets/card/${getBurstHeadName(id)}`;
    charImg.onerror = () => { charImg.src = ''; };

    updateLevelRange();
    renderPassiveSkills(char);
    renderAwakeCards(char);
    awakeActive.clear();
    updateAwakeUI();
    calculate();
  }

  function updateLevelRange() {
    const tier = parseInt(tierSelect.value);
    const maxLevels = [30, 40, 60, 90, 120];
    const maxLv = maxLevels[tier];
    levelRange.textContent = `当前等级范围：1 ~ ${maxLv}`;
    levelInput.max = maxLv;
    let lv = parseInt(levelInput.value);
    if (isNaN(lv) || lv < 1) lv = 1;
    if (lv > maxLv) lv = maxLv;
    levelInput.value = lv;
  }

  // ==================== 被动技能 ====================
  function renderPassiveSkills(char) {
    passiveContainer.innerHTML = '';
    if (!char.grow_skill_ids || char.grow_skill_ids.length === 0) {
      passiveContainer.innerHTML = '<p style="color:#aaa;">该角色无被动技能</p>';
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
      row.innerHTML = `
        <div class="skill-name">${skillName}</div>
        <div class="passive-desc" data-raw="${descBody.replace(/"/g, '&quot;')}">${descBody}</div>
        <div class="skill-select">
          <label>等级：</label>
          <select class="passive-level">
            <option value="0">0级</option>
            <option value="1">1级</option>
            <option value="2">2级</option>
            <option value="3">3级</option>
          </select>
        </div>
      `;
      passiveContainer.appendChild(row);

      const select = row.querySelector('.passive-level');
      select.addEventListener('change', () => {
        updatePassiveHighlight(row, parseInt(select.value));
        calculate();
      });
    });
  }

  function updatePassiveHighlight(row, level) {
    const descDiv = row.querySelector('.passive-desc');
    const rawDesc = descDiv.dataset.raw.replace(/&quot;/g, '"');
    const numbers = rawDesc.match(/\d+(\.\d+)?/g) || [];
    let html = rawDesc;
    if (level > 0 && numbers.length >= level) {
      const target = numbers[level-1];
      html = rawDesc.replace(new RegExp(`\\b${target}\\b`), `<span class="highlight-num">${target}</span>`);
    }
    descDiv.innerHTML = html;
    if (level > 0) row.classList.add('active-skill');
    else row.classList.remove('active-skill');
  }

  // ==================== 觉醒卡片 ====================
  function renderAwakeCards(char) {
    awakeCardsContainer.innerHTML = '';
    const descs = char.awakening_skill_descs || [];
    if (descs.length === 0) {
      awakeCardsContainer.innerHTML = '<p style="color:#aaa;">该角色无觉醒技能</p>';
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
      card.innerHTML = `
        <div class="awake-title">${title}</div>
        <div class="awake-desc">${body}</div>
      `;
      card.addEventListener('click', () => toggleAwake(awakeIndex));
      awakeCardsContainer.appendChild(card);
    });
    updateAwakeUI();
  }

  function toggleAwake(index) {
    if (awakeActive.has(index)) {
      for (let i = 5; i >= index; i--) awakeActive.delete(i);
    } else {
      for (let i = 1; i <= index; i++) awakeActive.add(i);
    }
    updateAwakeUI();
    calculate();
  }

  function updateAwakeUI() {
    const cards = awakeCardsContainer.querySelectorAll('.awake-card');
    cards.forEach(card => {
      const index = parseInt(card.dataset.awakeIndex);
      card.classList.toggle('active', awakeActive.has(index));
    });
  }

  // ==================== 核心计算（修正攻速） ====================
  function calculate() {
    if (!currentCharId) return;
    const char = characters.find(c => c.id == currentCharId);
    if (!char) return;

    const tier = parseInt(tierSelect.value);
    const level = parseInt(levelInput.value) || 1;
    const preLevels = [0, 30, 70, 130, 220];
    const totalLevel = preLevels[tier] + level;

    // 基础属性
    const baseStats = {
      "40000102": char.max_hp,
      "40000103": char.atk,
      "40000104": char.def,
      "40000201": char.crt,
      "40000202": char.blk,
      "40000203": char.eva,
      "40000204": char.crt_int,
      "40000205": char.blk_int,
      "40000301": char.spd_move,
      "40000302": char.spd_atk,
      "40000303": char.range_atk
    };

    // 等级成长
    const levelKey = char.grow_model_id * 1000 + totalLevel;
    const lvAdd = levelUpData[levelKey] || {};
    for (let attrId in lvAdd) {
      if (baseStats[attrId] !== undefined) baseStats[attrId] += lvAdd[attrId];
      else baseStats[attrId] = lvAdd[attrId];
    }

    // 突破加成
    const qualityKey = char.id * 1000 + tier;
    const qAdd = qualityUpData[qualityKey] || {};
    for (let attrId in qAdd) {
      if (attrId === "max_total_level") continue;
      if (baseStats[attrId] !== undefined) baseStats[attrId] += qAdd[attrId];
      else baseStats[attrId] = qAdd[attrId];
    }

    let addTotal = {};
    let multTotal = {};

    // 被动技能
    document.querySelectorAll('.passive-level').forEach(sel => {
      const skillId = parseInt(sel.closest('.passive-row').dataset.skillId);
      const lv = parseInt(sel.value);
      if (lv > 0) applySkill(skillId, lv);
    });

    // 觉醒技能
    awakeActive.forEach(index => {
      const skillId = char.unlock_skill_ids[index - 1];
      if (skillId) applySkill(skillId, 1);
    });

    function applySkill(skillId, level) {
      const skillLevelId = skillId * 1000 + level;
      const effect = skillLevelUpData[skillLevelId];
      if (!effect) return;
      for (let [attrId, val] of Object.entries(effect.add || {})) {
        addTotal[attrId] = (addTotal[attrId] || 0) + val;
      }
      for (let [attrId, val] of Object.entries(effect.mult || {})) {
        multTotal[attrId] = (multTotal[attrId] || 0) + val;
      }
    }

    // 最终属性计算
    const result = {};
    for (let attrId in baseStats) {
      if (attrId === "40000302") continue; // 攻速单独处理
      let val = baseStats[attrId] + (addTotal[attrId] || 0);
      const mult = multTotal[attrId] || 0;
      val = val * (1 + mult / 10000);
      result[attrId] = Math.floor(val);
    }
    // 处理只存在于加算中的新属性
    for (let attrId in addTotal) {
      if (!(attrId in result) && attrId !== "40000302" && attrId !== "40000316") {
        let val = (addTotal[attrId] || 0);
        const mult = multTotal[attrId] || 0;
        val = val * (1 + mult / 10000);
        result[attrId] = Math.floor(val);
      }
    }

    // 特殊处理攻速
    let baseSpdAtk = baseStats["40000302"] || 0;
    let spdAtkAdd = addTotal["40000316"] || 0;  // 攻速变化值
    let spdAtkMult = (multTotal["40000302"] || 0) + (multTotal["40000316"] || 0);
    let finalSpdAtk = baseSpdAtk * (10000 + spdAtkAdd) / 10000;
    finalSpdAtk = finalSpdAtk * (1 + spdAtkMult / 10000);
    result["40000302"] = Math.floor(finalSpdAtk);

    // 显示
    const displayOrder = [
      "40000102","40000103","40000104",
      "40000201","40000204","40000202",
      "40000205","40000203",
      "40000301","40000302","40000303"
    ];

    attrGrid.innerHTML = displayOrder.map(id => {
      const name = ATTR_ID_MAP[id]?.name || id;
      const value = result[id] !== undefined ? formatAttr(id, result[id]) : '-';
      return `<div class="attr-item"><span class="attr-name">${name}</span><span>${value}</span></div>`;
    }).join('');
  }

  // ==================== 角色弹窗与筛选 ====================
  function openPicker() {
    selectedCharId = currentCharId;
    renderCharGrid();
    pickerModal.hidden = false;
  }
  function closePicker() {
    pickerModal.hidden = true;
  }
  function confirmPick() {
    if (selectedCharId && selectedCharId !== currentCharId) selectCharacter(selectedCharId);
    closePicker();
  }

  function getFilteredCharacters() {
    return characters.filter(c => {
      if (filterStars.size > 0 && !filterStars.has(c.star)) return false;
      if (filterProfs.size > 0 && !filterProfs.has(c.profession)) return false;
      if (filterElems.size > 0 && !filterElems.has(c.element)) return false;
      return true;
    });
  }

  function renderCharGrid() {
    charGrid.innerHTML = '';
    getFilteredCharacters().forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card' + (selectedCharId === c.id ? ' selected' : '');
      const img = document.createElement('img');
      img.src = `./assets/card/${getBurstHeadName(c.id)}`;
      img.alt = c.name;
      img.onerror = () => { img.src = ''; };
      card.appendChild(img);
      const nameSpan = document.createElement('span');
      nameSpan.className = 'card-name';
      nameSpan.textContent = c.name;
      card.appendChild(nameSpan);
      card.addEventListener('click', () => {
        document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
        selectedCharId = c.id;
      });
      charGrid.appendChild(card);
    });
  }

  function initFilterButtons() {
    const starsGroup = document.getElementById('filterStars');
    const profsGroup = document.getElementById('filterProfs');
    const elemsGroup = document.getElementById('filterElems');

    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = '⭐' + i;
      btn.addEventListener('click', () => toggleFilter(filterStars, i, btn));
      starsGroup.appendChild(btn);
    }
    ['坚甲','异刃','言灵','猎影'].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = p;
      btn.addEventListener('click', () => toggleFilter(filterProfs, p, btn));
      profsGroup.appendChild(btn);
    });
    ['水属性','火属性','木属性','暗属性','光属性'].forEach(e => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = e;
      btn.addEventListener('click', () => toggleFilter(filterElems, e, btn));
      elemsGroup.appendChild(btn);
    });

    document.getElementById('clearFilterBtn').addEventListener('click', () => {
      filterStars.clear();
      filterProfs.clear();
      filterElems.clear();
      updateFilterUI();
      renderCharGrid();
    });
  }

  function toggleFilter(set, value, btn) {
    if (set.has(value)) {
      set.delete(value);
      btn.classList.remove('active');
    } else {
      set.add(value);
      btn.classList.add('active');
    }
    renderCharGrid();
  }

  function updateFilterUI() {
    document.querySelectorAll('#filterStars .filter-btn').forEach(btn => {
      const star = parseInt(btn.textContent.slice(1));
      btn.classList.toggle('active', filterStars.has(star));
    });
    document.querySelectorAll('#filterProfs .filter-btn').forEach(btn => {
      btn.classList.toggle('active', filterProfs.has(btn.textContent));
    });
    document.querySelectorAll('#filterElems .filter-btn').forEach(btn => {
      btn.classList.toggle('active', filterElems.has(btn.textContent));
    });
  }

  // ==================== 事件监听 ====================
  changeCharBtn.addEventListener('click', openPicker);
  tierSelect.addEventListener('change', () => { updateLevelRange(); calculate(); });
  levelInput.addEventListener('input', () => {
    let val = parseInt(levelInput.value);
    const max = parseInt(levelInput.max);
    if (isNaN(val) || val < 1) val = 1;
    if (val > max) val = max;
    levelInput.value = val;
    calculate();
  });
  confirmPickBtn.addEventListener('click', confirmPick);
  cancelPickBtn.addEventListener('click', closePicker);

  // 启动
  loadData();
});