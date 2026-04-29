// calculator.js

export const ATTR_ID_MAP = {
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

/**
 * 格式化属性值用于显示
 * @param {string} attrId - 属性ID
 * @param {number} value - 原始数值（攻速为除以加成后的大数，其他为取整后数值）
 * @returns {string}
 */
export function formatAttr(attrId, value) {
  const cfg = ATTR_ID_MAP[attrId];
  if (!cfg) return String(value);
  if (cfg.type === "percent") return (Math.abs(value) / 100).toFixed(2) + "%";
  if (cfg.type === "speed") {
    // 攻速：先转为秒，再向下取整到两位小数
    const seconds = value / 1000;
    return (Math.floor(seconds * 100) / 100).toFixed(2) + " 秒";
  }
  return String(Math.floor(value));
}

/**
 * 核心计算函数
 */
export function calculate(state, data) {
  const { char, tier, level, passiveLevels, awakeActive, badgeState } = state;
  const { levelUpData, qualityUpData, skillLevelUpData, badgeConfig } = data;

  const preLevels = [0, 30, 70, 130, 220];
  const totalLv = preLevels[tier] + level;

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
  const lvAdd = levelUpData[char.grow_model_id * 1000 + totalLv] || {};
  for (let k in lvAdd) baseStats[k] = (baseStats[k] || 0) + lvAdd[k];

  // 突破加成
  const qAdd = qualityUpData[char.id * 1000 + tier] || {};
  for (let k in qAdd) {
    if (k !== 'max_total_level') baseStats[k] = (baseStats[k] || 0) + qAdd[k];
  }

  // 技能加成
  let skillAdd = {}, skillMult = {};
  for (let [skillId, lv] of Object.entries(passiveLevels)) {
    if (lv > 0) applySkill(skillId, lv, skillLevelUpData, skillAdd, skillMult);
  }
  awakeActive.forEach(idx => {
    const skillId = char.unlock_skill_ids[idx - 1];
    if (skillId) applySkill(skillId, 1, skillLevelUpData, skillAdd, skillMult);
  });

  // 原始面板（不含攻速）
  const rawStats = {};
  for (let k in baseStats) {
    if (k === '40000302') continue;
    let v = baseStats[k] + (skillAdd[k] || 0);
    const mult = skillMult[k] || 0;
    v = v * (1 + mult / 10000);
    rawStats[k] = Math.ceil(v);
  }
  for (let k in skillAdd) {
    if (!(k in rawStats) && k !== '40000302' && k !== '40000316') {
      let v = skillAdd[k];
      v = v * (1 + (skillMult[k] || 0) / 10000);
      rawStats[k] = Math.ceil(v);
    }
  }

  // 技能影响的攻速加成（取绝对值，全部视为降低速度的百分比，即分母增大）
  let skillSpdBonus = 0;
  for (let k of ['40000316', '40000302']) {
    skillSpdBonus += Math.abs(skillAdd[k] || 0) + Math.abs(skillMult[k] || 0);
  }
  let rawSpd = baseStats['40000302'] / (1 + skillSpdBonus / 10000);

  // 徽章加成
  let badgeAdd = {}, badgeMult = {};
  if (badgeState.selectedSuitId && badgeConfig) {
    const suit = badgeConfig.suits.find(s => s.id === badgeState.selectedSuitId);
    if (suit && suit.add_attr) {
      for (let op in suit.add_attr) {
        for (let k in suit.add_attr[op]) {
          if (op === '1') badgeAdd[k] = (badgeAdd[k] || 0) + suit.add_attr[op][k];
          else badgeMult[k] = (badgeMult[k] || 0) + suit.add_attr[op][k];
        }
      }
    }
    const addMain = (mainId, partLv) => {
      if (partLv < 0) return;
      const info = badgeConfig.main_attr_table[mainId];
      if (!info) return;
      const p = info.attr.split(':');
      const total = parseInt(p[2]) + info.add * partLv;
      if (p[0] === '1') badgeAdd[p[1]] = (badgeAdd[p[1]] || 0) + total;
      else badgeMult[p[1]] = (badgeMult[p[1]] || 0) + total;
    };
    addMain(badgeState.flowerMain, badgeState.flowerLevel);
    addMain(badgeState.orbMain, badgeState.orbLevel);
    addMain(badgeState.featherMain, badgeState.featherLevel);
    const addSubs = (subs, times) => {
      subs.forEach((id, idx) => {
        const info = badgeConfig.sub_attr_table[id];
        if (!info) return;
        const p = info.attr.split(':');
        const total = parseInt(p[2]) + info.add * times[idx];
        if (p[0] === '1') badgeAdd[p[1]] = (badgeAdd[p[1]] || 0) + total;
        else badgeMult[p[1]] = (badgeMult[p[1]] || 0) + total;
      });
    };
    addSubs(badgeState.flowerSubs, badgeState.flowerSubTimes);
    addSubs(badgeState.orbSubs, badgeState.orbSubTimes);
    addSubs(badgeState.featherSubs, badgeState.featherSubTimes);
  }

  // 徽章影响的攻速加成
  let badgeSpdBonus = 0;
  for (let k of ['40000316', '40000302']) {
    badgeSpdBonus += Math.abs(badgeAdd[k] || 0) + Math.abs(badgeMult[k] || 0);
  }
  let finalSpd = rawSpd / (1 + badgeSpdBonus / 10000);

  // 最终属性（不含攻速）
  const finalStats = {};
  const detail = {};
  for (let k in { ...rawStats, ...badgeAdd, ...badgeMult }) {
    if (k === '40000302' || k === '40000316') continue;
    const raw = rawStats[k] || 0;
    const add = Math.ceil(badgeAdd[k] || 0);
    const mult = badgeMult[k] || 0;
    const multVal = Math.ceil(raw * mult / 10000);
    const badgeTotal = add + multVal;
    finalStats[k] = raw + add + multVal;
    detail[k] = { raw, badgeAdd: add, badgeMultVal: multVal, badgeTotal };
  }

  finalStats['40000302'] = finalSpd;

  // 攻速明细
  const rawSpdInt = Math.floor(rawSpd);
  const finalSpdInt = Math.floor(finalSpd);
  detail['40000302'] = {
    raw: rawSpdInt,
    badgeTotal: finalSpdInt - rawSpdInt
  };

  return { finalStats, detail };
}

function applySkill(skillId, level, skillLevelUpData, skillAdd, skillMult) {
  const eff = skillLevelUpData[skillId * 1000 + level];
  if (!eff) return;
  for (let [k, v] of Object.entries(eff.add || {})) {
    skillAdd[k] = (skillAdd[k] || 0) + v;
  }
  for (let [k, v] of Object.entries(eff.mult || {})) {
    skillMult[k] = (skillMult[k] || 0) + v;
  }
}