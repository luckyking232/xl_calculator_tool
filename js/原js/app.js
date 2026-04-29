document.addEventListener('DOMContentLoaded', () => {
  // ==================== DOM 元素 ====================
  const charImg = document.getElementById('charImg');
  const charName = document.getElementById('charName');
  const charDetail = document.getElementById('charDetail');
  const changeCharBtn = document.getElementById('changeCharBtn');
  const attrGrid = document.getElementById('attrGrid');
  const showSourceToggle = document.getElementById('showSourceToggle');

  const modalLevel = document.getElementById('modal-level');
  const tierSelect = document.getElementById('tierSelect');
  const levelInput = document.getElementById('levelInput');
  const levelRange = document.getElementById('levelRange');
  const closeLevelBtn = document.getElementById('closeLevelBtn');

  const modalPassive = document.getElementById('modal-passive');
  const passiveContainer = document.getElementById('passiveContainer');
  const closePassiveBtn = document.getElementById('closePassiveBtn');

  const modalAwake = document.getElementById('modal-awake');
  const awakeCardsContainer = document.getElementById('awakeCardsContainer');
  const closeAwakeBtn = document.getElementById('closeAwakeBtn');

  const modalBadge = document.getElementById('modal-badge');
  const suitGrid = document.getElementById('suitGrid');
  const partsContainer = document.getElementById('partsContainer');
  const closeBadgeBtn = document.getElementById('closeBadgeBtn');

  const pickerModal = document.getElementById('pickerModal');
  const charGrid = document.getElementById('charGrid');
  const confirmPickBtn = document.getElementById('confirmPickBtn');
  const cancelPickBtn = document.getElementById('cancelPickBtn');

  const sideBtns = document.querySelectorAll('.side-btn');

  // ==================== 数据变量 ====================
  let characters = [];
  let levelUpData = {};
  let qualityUpData = {};
  let skillLevelUpData = {};
  let badgeConfig = null;
  let currentCharId = null;
  let selectedCharId = null;
  let filterStars = new Set();
  let filterProfs = new Set();
  let filterElems = new Set();
  let awakeActive = new Set();

  let selectedSuitId = null;
  let flowerLevel = 0, orbLevel = 0, featherLevel = 0;
  let flowerMain = '40005601', orbMain = '40005602', featherMain = '40005604';
  let flowerSubs = ['40005701','40005702','40005703','40005704'];
  let orbSubs = ['40005701','40005702','40005703','40005704'];
  let featherSubs = ['40005701','40005702','40005703','40005704'];
  let flowerSubTimes = [0,0,0,0], orbSubTimes = [0,0,0,0], featherSubTimes = [0,0,0,0];

  let lastValidLevel = 1;
  let lastValidFlowerLv = 0, lastValidOrbLv = 0, lastValidFeatherLv = 0;

  let lastRawStats = {};
  let lastBadgeAdd = {};
  let lastBadgeMult = {};
  let lastDetailData = {};

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
    "40000303": { name: "攻击距离", type: "int" },
    "40000316": { name: "攻速", type: "percent" },
    "40000501": { name: "治疗加成", type: "percent" }
  };

  function formatAttr(attrId, value) {
    const cfg = ATTR_ID_MAP[attrId];
    if (!cfg) return String(value);
    if (cfg.type === "percent") return (Math.abs(value) / 100).toFixed(2) + "%";
    if (cfg.type === "speed") return (value / 1000).toFixed(2) + " 秒";
    return String(Math.floor(value));
  }

  // ==================== 数据加载 ====================
  async function loadData() {
    try {
      const [charRes, levelRes, qualityRes, skillRes, badgeRes] = await Promise.all([
        fetch('./data/characters_base.json'),
        fetch('./data/level_up.json'),
        fetch('./data/quality_up.json'),
        fetch('./data/skill_level_up.json'),
        fetch('./data/badge_config.json')
      ]);
      characters = await charRes.json();
      levelUpData = await levelRes.json();
      qualityUpData = await qualityRes.json();
      skillLevelUpData = await skillRes.json();
      badgeConfig = await badgeRes.json();

      characters.sort((a, b) => a.id - b.id);
      if (characters.length > 0) selectCharacter(characters[0].id);
      initFilterButtons();
    } catch (err) { console.error(err); alert('数据加载失败'); }
  }

  function getBurstHeadName(id) { return `BurstHead_${id - 10000100 + 10000}_1.png`; }

  // ==================== 浮窗控制 ====================
  function openModal(m) { m.hidden = false; }
  function closeModal(m) { m.hidden = true; }
  sideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      if (id === 'level') openModal(modalLevel);
      else if (id === 'passive') openModal(modalPassive);
      else if (id === 'awake') openModal(modalAwake);
      else if (id === 'badge') {
        if (!badgeConfig) { alert('徽章数据未加载'); return; }
        renderBadgeUI();
        openModal(modalBadge);
      }
    });
  });
  [closeLevelBtn, closePassiveBtn, closeAwakeBtn, closeBadgeBtn].forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal'))));
  document.querySelectorAll('.modal-backdrop').forEach(b => b.addEventListener('click', () => closeModal(b.parentElement)));

  // ==================== 输入保护 ====================
  function setupNumberInput(input, min, getLast, setLast, onChange) {
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

  // ==================== 角色选择 ====================
  function selectCharacter(id) {
    currentCharId = id;
    const ch = characters.find(c => c.id == id);
    if (!ch) return;
    charName.textContent = ch.name;
    charDetail.textContent = `${ch.star}⭐ ${ch.element} ${ch.profession}`;
    charImg.src = `./assets/card/${getBurstHeadName(id)}`;
    charImg.onerror = () => { charImg.src = ''; };
    updateLevelRange();
    renderPassiveSkills(ch);
    renderAwakeCards(ch);
    awakeActive.clear();
    updateAwakeUI();
    lastValidLevel = 1;
    levelInput.value = 1;
    calculate();
  }

  function updateLevelRange() {
    const tier = parseInt(tierSelect.value);
    const maxLevels = [30,40,60,90,120];
    const maxLv = maxLevels[tier];
    levelRange.textContent = `1 ~ ${maxLv}`;
    levelInput.max = maxLv;
    let v = parseInt(levelInput.value) || lastValidLevel;
    if (v < 1) v = 1; if (v > maxLv) v = maxLv;
    levelInput.value = v;
    lastValidLevel = v;
  }

  // ==================== 被动技能 ====================
  function renderPassiveSkills(ch) {
    passiveContainer.innerHTML = '';
    if (!ch.grow_skill_ids || ch.grow_skill_ids.length === 0) {
      passiveContainer.innerHTML = '<p style="color:#aaa;">该角色无被动技能</p>';
      return;
    }
    ch.grow_skill_ids.forEach((skillId, idx) => {
      const rawDesc = (ch.passive_skill_descs && ch.passive_skill_descs[idx]) ? ch.passive_skill_descs[idx] : '';
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
    row.classList.toggle('active-skill', level > 0);
  }

  // ==================== 觉醒卡片 ====================
  function renderAwakeCards(ch) {
    awakeCardsContainer.innerHTML = '';
    const descs = ch.awakening_skill_descs || [];
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
      card.innerHTML = `<div class="awake-title">${title}</div><div class="awake-desc">${body}</div>`;
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
    document.querySelectorAll('.awake-card').forEach(card => {
      const idx = parseInt(card.dataset.awakeIndex);
      card.classList.toggle('active', awakeActive.has(idx));
    });
  }

  // ==================== 徽章 UI ====================
  function renderBadgeUI() {
    if (!badgeConfig) return;
    renderSuitGrid();
    renderPartsPanel();
  }

  function renderSuitGrid() {
    suitGrid.innerHTML = '';
    badgeConfig.suits.forEach(suit => {
      const card = document.createElement('div');
      card.className = 'suit-card' + (selectedSuitId === suit.id ? ' selected' : '');
      card.innerHTML = `<div class="suit-name">${suit.name}</div><div class="suit-parts">${suit.parts}</div><div class="suit-effects">2件: ${suit.desc2}</div><div class="suit-effects">3件: ${suit.desc3}</div>`;
      card.addEventListener('click', () => { selectedSuitId = suit.id; renderSuitGrid(); calculate(); });
      suitGrid.appendChild(card);
    });
  }

  function renderPartsPanel() {
    partsContainer.innerHTML = '';
    const flowerPanel = createPartPanel('花', flowerMain, badgeConfig.flower_main_options, flowerSubs, flowerSubTimes, flowerLevel,
      (v) => { flowerLevel = v; updateMainSelectOptions(flowerPanel, v); calculate(); }, 'flower', lastValidFlowerLv, v => lastValidFlowerLv = v);
    const orbPanel = createPartPanel('球', orbMain, badgeConfig.orb_main_options, orbSubs, orbSubTimes, orbLevel,
      (v) => { orbLevel = v; updateMainSelectOptions(orbPanel, v); calculate(); }, 'orb', lastValidOrbLv, v => lastValidOrbLv = v);
    const featherPanel = createPartPanel('羽', featherMain, badgeConfig.feather_main_options, featherSubs, featherSubTimes, featherLevel,
      (v) => { featherLevel = v; updateMainSelectOptions(featherPanel, v); calculate(); }, 'feather', lastValidFeatherLv, v => lastValidFeatherLv = v);
    partsContainer.append(flowerPanel, orbPanel, featherPanel);
  }

  function createPartPanel(name, mainValue, mainOptions, subValues, subTimes, currentLevel, onLevelChange, type, lastValid, setLastValid) {
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
    setupNumberInput(lvInput, 0, () => lastValid, setLastValid, onLevelChange);
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
  opt.textContent = getAttrDisplayName(optId, currentLevel, 0); // 主属性只有自身等级
  mainSelect.appendChild(opt);
});
    mainSelect.value = mainValue;
    mainSelect.addEventListener('change', () => {
      if (type === 'flower') flowerMain = mainSelect.value;
      else if (type === 'orb') orbMain = mainSelect.value;
      else featherMain = mainSelect.value;
      calculate();
    });
    mainGroup.appendChild(mainSelect);
    panel.appendChild(mainGroup);
    panel.mainSelect = mainSelect;  // 保存引用

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
  // 传入 0 级主等级 + 当前副属性升级次数
  opt.textContent = getAttrDisplayName(optId, 0, subTimes[i]);
  subSelect.appendChild(opt);
});
subSelect.value = subValues[i];
      subSelect.addEventListener('change', () => {
        const newVal = subSelect.value;
        const arr = type === 'flower' ? flowerSubs : type === 'orb' ? orbSubs : featherSubs;
        const others = arr.filter((_, idx) => idx !== i);
        if (others.includes(newVal)) { subSelect.value = arr[i]; alert('该属性已存在'); return; }
        arr[i] = newVal;
        calculate();
      });
      row.appendChild(subSelect);

      const minus = document.createElement('button'); minus.textContent = '-';
      const plus = document.createElement('button'); plus.textContent = '+';
      const span = document.createElement('span'); span.className = 'sub-times'; span.textContent = subTimes[i];
      minus.addEventListener('click', () => changeSubTimes(type, i, -1, panel));
      plus.addEventListener('click', () => changeSubTimes(type, i, 1, panel));
      row.appendChild(minus); row.appendChild(span); row.appendChild(plus);
      subGroup.appendChild(row);
    }
    panel.appendChild(subGroup);
    return panel;
  }

function changeSubTimes(type, index, delta, panel) {
  let arr = type === 'flower' ? flowerSubTimes : type === 'orb' ? orbSubTimes : featherSubTimes;
  const total = arr.reduce((a, b) => a + b, 0);
  if (delta > 0 && total >= (badgeConfig.max_sub_upgrades_per_part || 6)) return;
  const n = arr[index] + delta;
  if (n < 0) return;
  arr[index] = n;
  // 更新次数显示
  const spans = panel.querySelectorAll('.sub-times');
  if (spans[index]) spans[index].textContent = n;
  // 更新该副属性选项的显示文本
  const select = panel.querySelectorAll('.sub-upgrade-row select')[index];
  if (select) {
    const opt = select.options[select.selectedIndex];
    const attrId = opt.value;
    opt.textContent = getAttrDisplayName(attrId, 0, n);
  }
  calculate();
}

function updateMainSelectOptions(panel, level) {
  const select = panel.mainSelect;
  [...select.options].forEach(opt => {
    opt.textContent = getAttrDisplayName(opt.value, level, 0);
  });
}

function getAttrDisplayName(attrId, level, extraLevel = 0) {
  const info = badgeConfig.main_attr_table?.[attrId] || badgeConfig.sub_attr_table?.[attrId];
  if (!info) return attrId;
  const parts = info.attr.split(':');
  const baseVal = parseInt(parts[2]);
  const totalAdd = info.add * (level + extraLevel);  // 合并等级与升级次数
  let val = baseVal + totalAdd;
  const attrName = ATTR_ID_MAP[parts[1]]?.name || parts[1];
  const isPercent = parts[0] === '2' || parts[1] === '40000316' || parts[1] === '40000501' || ATTR_ID_MAP[parts[1]]?.type === 'percent';
  const display = isPercent ? (Math.abs(val) / 100).toFixed(2) + '%' : Math.floor(val);
  return `${attrName}（${display}）`;
}

  // ==================== 核心计算 ====================
  function calculate() {
    if (!currentCharId || !badgeConfig) return;
    const ch = characters.find(c => c.id == currentCharId);
    if (!ch) return;

    const tier = parseInt(tierSelect.value);
    const level = parseInt(levelInput.value) || lastValidLevel;
    const pre = [0,30,70,130,220];
    const totalLv = pre[tier] + level;

    const baseStats = {
      "40000102": ch.max_hp, "40000103": ch.atk, "40000104": ch.def,
      "40000201": ch.crt, "40000202": ch.blk, "40000203": ch.eva,
      "40000204": ch.crt_int, "40000205": ch.blk_int,
      "40000301": ch.spd_move, "40000302": ch.spd_atk, "40000303": ch.range_atk
    };

    const lvAdd = levelUpData[ch.grow_model_id * 1000 + totalLv] || {};
    for (let k in lvAdd) baseStats[k] = (baseStats[k]||0) + lvAdd[k];
    const qAdd = qualityUpData[ch.id * 1000 + tier] || {};
    for (let k in qAdd) if (k !== 'max_total_level') baseStats[k] = (baseStats[k]||0) + qAdd[k];

    let skillAdd = {}, skillMult = {};
    document.querySelectorAll('.passive-level').forEach(sel => {
      const sid = parseInt(sel.closest('.passive-row').dataset.skillId);
      const lv = parseInt(sel.value);
      if (lv > 0) applySkill(sid, lv);
    });
    awakeActive.forEach(idx => applySkill(ch.unlock_skill_ids[idx-1], 1));
    function applySkill(sid, lv) {
      const eff = skillLevelUpData[sid * 1000 + lv];
      if (!eff) return;
      for (let [k,v] of Object.entries(eff.add||{})) skillAdd[k] = (skillAdd[k]||0) + v;
      for (let [k,v] of Object.entries(eff.mult||{})) skillMult[k] = (skillMult[k]||0) + v;
    }

    // 原始面板（向上取整，攻速除外）
    const rawStats = {};
    for (let k in baseStats) {
      if (k === '40000302') continue;
      let v = baseStats[k] + (skillAdd[k]||0);
      const mult = (skillMult[k] || 0);
      v = v * (1 + mult / 10000);
      rawStats[k] = Math.ceil(v);
    }
    for (let k in skillAdd) {
      if (!(k in rawStats) && k !== '40000302' && k !== '40000316') {
        let v = skillAdd[k];
        v = v * (1 + (skillMult[k]||0)/10000);
        rawStats[k] = Math.ceil(v);
      }
    }

    // 原始攻速
    let rawSpd = baseStats['40000302'];
    if (skillAdd['40000316']) {
      rawSpd = rawSpd * (10000 + skillAdd['40000316']) / 10000;
    }
    const spdMultTotal = (skillMult['40000302'] || 0) + (skillMult['40000316'] || 0);
    if (spdMultTotal) {
      rawSpd = rawSpd / (1 + spdMultTotal / 10000);
    }
    rawStats['40000302'] = rawSpd;

    // 徽章加成
    let badgeAdd = {}, badgeMult = {};
    if (selectedSuitId) {
      const suit = badgeConfig.suits.find(s => s.id === selectedSuitId);
      if (suit?.add_attr) {
        for (let op in suit.add_attr) for (let k in suit.add_attr[op]) {
          if (op === '1') badgeAdd[k] = (badgeAdd[k]||0) + suit.add_attr[op][k];
          else badgeMult[k] = (badgeMult[k]||0) + suit.add_attr[op][k];
        }
      }
      const addMain = (mainId, partLv) => {
        if (partLv < 0) return;
        const info = badgeConfig.main_attr_table[mainId];
        if (!info) return;
        const p = info.attr.split(':');
        const total = parseInt(p[2]) + info.add * partLv;
        if (p[0]==='1') badgeAdd[p[1]] = (badgeAdd[p[1]]||0) + total;
        else badgeMult[p[1]] = (badgeMult[p[1]]||0) + total;
      };
      addMain(flowerMain, flowerLevel);
      addMain(orbMain, orbLevel);
      addMain(featherMain, featherLevel);
      const addSubs = (subs, times) => {
        subs.forEach((id, idx) => {
          const info = badgeConfig.sub_attr_table[id];
          if (!info) return;
          const p = info.attr.split(':');
          const total = parseInt(p[2]) + info.add * times[idx];
          if (p[0]==='1') badgeAdd[p[1]] = (badgeAdd[p[1]]||0) + total;
          else badgeMult[p[1]] = (badgeMult[p[1]]||0) + total;
        });
      };
      addSubs(flowerSubs, flowerSubTimes);
      addSubs(orbSubs, orbSubTimes);
      addSubs(featherSubs, featherSubTimes);
    }

    const finalStats = {};
    const detail = {};

    for (let k in {...rawStats, ...badgeAdd, ...badgeMult}) {
      if (k === '40000302' || k === '40000316') continue;
      const raw = rawStats[k] || 0;
      const add = Math.ceil(badgeAdd[k] || 0);
      const mult = badgeMult[k] || 0;
      const multVal = Math.ceil(raw * mult / 10000);
      const badgeTotal = add + multVal;
      finalStats[k] = raw + add + multVal;
      detail[k] = { raw, badgeAdd: add, badgeMultVal: multVal, badgeTotal };
    }

    // 最终攻速
    let finalSpd = rawStats['40000302'];
    if (badgeAdd['40000316']) {
      finalSpd = finalSpd * (10000 + badgeAdd['40000316']) / 10000;
    }
    const badgeSpdMult = (badgeMult['40000302'] || 0) + (badgeMult['40000316'] || 0);
    if (badgeSpdMult) {
      finalSpd = finalSpd / (1 + badgeSpdMult / 10000);
    }
    finalStats['40000302'] = Math.floor(finalSpd * 100) / 100;

    // 攻速明细：原始大数（整数），徽章影响值 = 最终大数整数 - 原始大数整数
    const rawSpdInt = Math.floor(rawSpd);
    const finalSpdInt = Math.floor(finalSpd);
    detail['40000302'] = {
      raw: rawSpdInt,
      badgeTotal: finalSpdInt - rawSpdInt
    };

    lastDetailData = detail;
    renderResult(finalStats);
  }

  // ==================== 渲染结果 ====================
  function renderResult(finalStats) {
    const showDetail = showSourceToggle && showSourceToggle.checked;
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
      if (showDetail && lastDetailData[id]) {
        const d = lastDetailData[id];
        if (id === '40000302') {
          // 攻速明细：原始大数 徽章差值
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

      // 最终值统一使用 formatAttr 显示
      const finalDisplay = formatAttr(id, finalVal);

      return `<div class="attr-item">
        <div class="attr-row"><span class="attr-name">${name}</span><span>${finalDisplay}</span></div>
        ${showDetail ? `<div class="detail-line visible">${detailHtml}</div>` : `<div class="detail-line"></div>`}
      </div>`;
    }).join('');
  }

  // ==================== 角色弹窗与筛选 ====================
  function openPicker() { selectedCharId = currentCharId; renderCharGrid(); pickerModal.hidden = false; }
  function closePicker() { pickerModal.hidden = true; }
  function confirmPick() { if (selectedCharId && selectedCharId !== currentCharId) selectCharacter(selectedCharId); closePicker(); }

  function getFilteredCharacters() {
    return characters.filter(c => {
      if (filterStars.size && !filterStars.has(c.star)) return false;
      if (filterProfs.size && !filterProfs.has(c.profession)) return false;
      if (filterElems.size && !filterElems.has(c.element)) return false;
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
      filterStars.clear(); filterProfs.clear(); filterElems.clear();
      updateFilterUI();
      renderCharGrid();
    });
  }

  function toggleFilter(set, value, btn) {
    if (set.has(value)) { set.delete(value); btn.classList.remove('active'); }
    else { set.add(value); btn.classList.add('active'); }
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

  // ==================== 事件绑定 ====================
  changeCharBtn.addEventListener('click', openPicker);
  tierSelect.addEventListener('change', () => { updateLevelRange(); calculate(); });
  setupNumberInput(levelInput, 1, () => lastValidLevel, v => lastValidLevel = v, () => calculate());
  confirmPickBtn.addEventListener('click', confirmPick);
  cancelPickBtn.addEventListener('click', closePicker);
  if (showSourceToggle) showSourceToggle.addEventListener('change', () => calculate());

  // 启动
  loadData();
});