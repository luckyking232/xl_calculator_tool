// main.js
import { loadAllData } from './dataLoader.js';
import { calculate, ATTR_ID_MAP } from './calculator.js';
import { openModal, closeModal, setupNumberInput, renderResult } from './uiUtils.js';
import { renderCharGrid, initFilterButtons } from './charUI.js';
import { renderPassiveSkills, updatePassiveHighlight, renderAwakeCards, toggleAwake } from './skillUI.js';
import { renderBadgeUI } from './badgeUI.js';
import { initSealUI } from './sealUI.js';

document.addEventListener('DOMContentLoaded', async () => {
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

  // 刻印相关 DOM
  const modalSeal = document.getElementById('modal-seal');
  const sealMain = document.getElementById('sealMain');
  const sealEditPanel = document.getElementById('sealEditPanel');

  const pickerModal = document.getElementById('pickerModal');
  const charGrid = document.getElementById('charGrid');
  const confirmPickBtn = document.getElementById('confirmPickBtn');
  const cancelPickBtn = document.getElementById('cancelPickBtn');

  const sideBtns = document.querySelectorAll('.side-btn');
  const starsGroup = document.getElementById('filterStars');
  const profsGroup = document.getElementById('filterProfs');
  const elemsGroup = document.getElementById('filterElems');
  const clearFilterBtn = document.getElementById('clearFilterBtn');

  // ==================== 全局状态 ====================
  let characters = [];
  let levelUpData = {};
  let qualityUpData = {};
  let skillLevelUpData = {};
  let badgeConfig = null;
  let sealData = null;              // 新增：刻印数据

  let currentCharId = null;
  let selectedCharId = null;

  let filterStars = new Set();
  let filterProfs = new Set();
  let filterElems = new Set();
  let awakeActive = new Set();

  const badgeState = {
    selectedSuitId: null,
    flowerLevel: 0, orbLevel: 0, featherLevel: 0,
    flowerMain: '40005601', orbMain: '40005602', featherMain: '40005604',
    flowerSubs: ['40005701','40005702','40005703','40005704'],
    orbSubs: ['40005701','40005702','40005703','40005704'],
    featherSubs: ['40005701','40005702','40005703','40005704'],
    flowerSubTimes: [0,0,0,0], orbSubTimes: [0,0,0,0], featherSubTimes: [0,0,0,0],
    lastValidFlowerLv: 0, lastValidOrbLv: 0, lastValidFeatherLv: 0
  };

  let lastValidLevel = 1;
  let lastFinalStats = {};
  let lastDetail = {};

  // 刻印初始化标志
  let sealInited = false;

  // ==================== 辅助函数 ====================
  function getBurstHeadName(id) {
    return `BurstHead_${id - 10000100 + 10000}_1.png`;
  }

  function getFilteredCharacters() {
    return characters.filter(c => {
      if (filterStars.size && !filterStars.has(c.star)) return false;
      if (filterProfs.size && !filterProfs.has(c.profession)) return false;
      if (filterElems.size && !filterElems.has(c.element)) return false;
      return true;
    });
  }

// ==================== 核心计算 ====================
function runCalculate() {
  if (!currentCharId || !badgeConfig) return;
  const ch = characters.find(c => c.id === currentCharId);
  if (!ch) return;

  const tier = parseInt(tierSelect.value);
  const level = parseInt(levelInput.value) || lastValidLevel;

  const passiveLevels = {};
  document.querySelectorAll('.passive-level').forEach(sel => {
    const skillId = parseInt(sel.closest('.passive-row').dataset.skillId);
    const lv = parseInt(sel.value);
    if (lv > 0) passiveLevels[skillId] = lv;
  });

  // 获取刻印加成（只计算当前角色职业的刻印）
  const sealAdd = (sealMain && sealMain.getTotalSealAdd)
    ? sealMain.getTotalSealAdd(ch.profession)
    : { atk: 0, def: 0, hp: 0 };

  const state = {
    char: ch,
    tier,
    level,
    passiveLevels,
    awakeActive,
    badgeState,
    sealAdd               // 刻印加成
  };

  const { finalStats, detail } = calculate(state, {
    levelUpData, qualityUpData, skillLevelUpData, badgeConfig
  });

  lastFinalStats = finalStats;
  lastDetail = detail;
  renderResult(attrGrid, finalStats, detail, showSourceToggle.checked, ATTR_ID_MAP);
}

  // ==================== 角色选择 ====================
  function selectCharacter(id) {
    currentCharId = id;
    const ch = characters.find(c => c.id === id);
    if (!ch) return;

    charName.textContent = ch.name;
    charDetail.textContent = `${ch.star}⭐ ${ch.element} ${ch.profession}`;
    charImg.src = `./assets/card/${getBurstHeadName(id)}`;
    charImg.onerror = () => { charImg.src = ''; };

    lastValidLevel = 1;
    levelInput.value = 1;
    updateLevelRange();

    renderPassiveSkills(passiveContainer, ch, runCalculate);
    awakeActive.clear();
    renderAwakeCards(awakeCardsContainer, ch, awakeActive, (idx) => {
      toggleAwake(idx, awakeActive, awakeCardsContainer, runCalculate);
    });

    runCalculate();
  }

  function updateLevelRange() {
    const tier = parseInt(tierSelect.value);
    const maxLevels = [30, 40, 60, 90, 120];
    const maxLv = maxLevels[tier];
    levelRange.textContent = `1 ~ ${maxLv}`;
    levelInput.max = maxLv;
    let v = parseInt(levelInput.value) || lastValidLevel;
    if (v < 1) v = 1;
    if (v > maxLv) v = maxLv;
    levelInput.value = v;
    lastValidLevel = v;
  }

  // ==================== 徽章 UI 更新 ====================
  function updateBadgeUI() {
    if (!badgeConfig) return;
    renderBadgeUI(badgeConfig, suitGrid, partsContainer, badgeState, runCalculate);
  }

  // ==================== 弹窗与事件绑定 ====================
  sideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId === 'level') openModal(modalLevel);
      else if (modalId === 'passive') openModal(modalPassive);
      else if (modalId === 'awake') openModal(modalAwake);
      else if (modalId === 'badge') {
        updateBadgeUI();
        openModal(modalBadge);
      } else if (modalId === 'seal') {
        openModal(modalSeal);
        // 延后到数据加载完成后才初始化（见下方启动流程）
      }
    });
  });

  // 关闭按钮与背景点击
  [closeLevelBtn, closePassiveBtn, closeAwakeBtn, closeBadgeBtn].forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', () => closeModal(bd.parentElement));
  });

  // 更换角色
  changeCharBtn.addEventListener('click', () => {
    selectedCharId = currentCharId;
    renderCharGrid(charGrid, getFilteredCharacters(), selectedCharId, (id) => {
      selectCharacter(id);
      closeModal(pickerModal);
    });
    openModal(pickerModal);
  });

  confirmPickBtn.addEventListener('click', () => {
    if (selectedCharId) selectCharacter(selectedCharId);
    closeModal(pickerModal);
  });
  cancelPickBtn.addEventListener('click', () => closeModal(pickerModal));

  // 等级输入
  setupNumberInput(levelInput, 1, () => lastValidLevel, v => lastValidLevel = v, () => runCalculate());
  tierSelect.addEventListener('change', () => {
    updateLevelRange();
    runCalculate();
  });

  // 属性来源开关
  if (showSourceToggle) {
    showSourceToggle.addEventListener('change', () => {
      renderResult(attrGrid, lastFinalStats, lastDetail, showSourceToggle.checked, ATTR_ID_MAP);
    });
  }

  // ==================== 筛选按钮 ====================
  const filterState = { stars: filterStars, profs: filterProfs, elems: filterElems };
  initFilterButtons(starsGroup, profsGroup, elemsGroup, clearFilterBtn, filterState, () => {
    if (!pickerModal.hidden) {
      renderCharGrid(charGrid, getFilteredCharacters(), selectedCharId, (id) => {
        selectCharacter(id);
        closeModal(pickerModal);
      });
    }
  });

  // ==================== 启动 ====================
  try {
    const data = await loadAllData();
    characters = data.characters;
    levelUpData = data.levelUpData;
    qualityUpData = data.qualityUpData;
    skillLevelUpData = data.skillLevelUpData;
    badgeConfig = data.badgeConfig;
    sealData = data.sealData;                // 保存刻印数据

    characters.sort((a, b) => a.id - b.id);

    // 初始化刻印 UI（只需一次，传入数据和计算回调）
    if (sealData) {
      initSealUI(sealMain, sealEditPanel, runCalculate, sealData);
    }

    if (characters.length > 0) selectCharacter(characters[0].id);
  } catch (err) {
    alert('数据加载失败，请刷新重试。');
  }
});