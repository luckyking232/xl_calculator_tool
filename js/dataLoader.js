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
export async function loadAllData() {
  try {
    const [charRes, levelRes, qualityRes, skillRes, badgeRes] = await Promise.all([
      fetch('./data/characters_base.json'),
      fetch('./data/level_up.json'),
      fetch('./data/quality_up.json'),
      fetch('./data/skill_level_up.json'),
      fetch('./data/badge_config.json')
    ]);

    // 检查所有响应是否成功
    if (!charRes.ok || !levelRes.ok || !qualityRes.ok || !skillRes.ok || !badgeRes.ok) {
      throw new Error('部分数据文件加载失败');
    }

    const characters = await charRes.json();
    const levelUpData = await levelRes.json();
    const qualityUpData = await qualityRes.json();
    const skillLevelUpData = await skillRes.json();
    const badgeConfig = await badgeRes.json();

    console.log('✅ 所有静态数据加载完成');
    return { characters, levelUpData, qualityUpData, skillLevelUpData, badgeConfig };
  } catch (err) {
    console.error('数据加载失败:', err);
    throw err; // 抛出错误，让调用者处理（如显示错误提示）
  }
}