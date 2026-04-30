// uiUtils.js
import { formatAttr } from './calculator.js';

// 弹窗
export function openModal(modal) { modal.hidden = false; }
export function closeModal(modal) { modal.hidden = true; }

/**
 * 数字输入框保护：支持清空、值边界检查、失焦恢复
 * @param {HTMLInputElement} input - 输入框元素
 * @param {number} min - 最小值
 * @param {function} getLast - 获取上次有效值的函数
 * @param {function} setLast - 设置上次有效值的函数
 * @param {function} onChange - 值变化时的回调，传递新值
 */
export function setupNumberInput(input, min, getLast, setLast, onChange) {
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

/**
 * 渲染属性计算结果与来源明细
 * @param {HTMLElement} attrGrid - 属性网格容器
 * @param {object} finalStats - 最终属性值
 * @param {object} detail - 明细数据
 * @param {boolean} showDetail - 是否显示来源明细
 * @param {object} ATTR_ID_MAP - 属性 ID 映射表
 */
export function renderResult(attrGrid, finalStats, detail, showDetail, ATTR_ID_MAP) {
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
    if (showDetail && detail[id]) {
      const d = detail[id];
      if (id === '40000302') {
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

    const finalDisplay = formatAttr(id, finalVal);

    return `<div class="attr-item">
      <div class="attr-row"><span class="attr-name">${name}</span><span>${finalDisplay}</span></div>
      ${showDetail ? `<div class="detail-line visible">${detailHtml}</div>` : `<div class="detail-line"></div>`}
    </div>`;
  }).join('');
}