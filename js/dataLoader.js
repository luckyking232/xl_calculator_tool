// dataLoader.js

/**
 * 加载所有计算所需的静态数据
 * @returns {Promise<{
 *   characters: Array,
 *   levelUpData: Object,
 *   qualityUpData: Object,
 *   skillLevelUpData: Object,
 *   badgeConfig: Object
 * }>}
 */
// dataLoader.js
export async function loadAllData() {
  try {
    const [charRes, levelRes, qualityRes, skillRes, badgeRes, sealRes] = await Promise.all([
      fetch('./data/characters_base.json'),
      fetch('./data/level_up.json'),
      fetch('./data/quality_up.json'),
      fetch('./data/skill_level_up.json'),
      fetch('./data/badge_config.json'),
      fetch('./data/seal_data.json')   // ← 新增加
    ]);

    if (!charRes.ok || !levelRes.ok || !qualityRes.ok || !skillRes.ok || !badgeRes.ok || !sealRes.ok) {
      throw new Error('部分数据文件加载失败');
    }

    const characters = await charRes.json();
    const levelUpData = await levelRes.json();
    const qualityUpData = await qualityRes.json();
    const skillLevelUpData = await skillRes.json();
    const badgeConfig = await badgeRes.json();
    const sealData = await sealRes.json();   // ← 新增

    console.log('✅ 所有静态数据加载完成');
    return { characters, levelUpData, qualityUpData, skillLevelUpData, badgeConfig, sealData };
  } catch (err) {
    console.error('数据加载失败:', err);
    throw err;
  }
}