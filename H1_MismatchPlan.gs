/** ========= H1_MismatchPlan.gs =============
 * 六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃
 * - 三格（有填才重建該節）：1.達成/差距 2.資源變動 3.替代方案/影響
 * - 常用快捷（q1/q2）會附加於第 3 格後
 * =========================================== */
const MISMATCH_REASON_FIELDS = Object.freeze([
  { key: 'reason1', prefix: '1.目標達成的狀況以及未達成的差距：' },
  { key: 'reason2', prefix: '2.資源的變動情形：' },
  { key: 'reason3', prefix: '3.未使用的替代方案或是可能的影響：' }
]);

const MISMATCH_QUICK_TEMPLATES = Object.freeze({
  q1: '1..經與案○討論，目前暫無備餐之需求，改為代購服務。',
  q2: '2..經與案○討論，目前因個案身體狀況，暫無專業服務需求，日後待個案狀況好轉後，依當下狀況核定，續追蹤。'
});

function applyH1_MismatchPlan(body, form){
  const lines = [];

  MISMATCH_REASON_FIELDS.forEach(function(field){
    const text = getTrimmed(form, field.key);
    if (text) {
      lines.push(field.prefix + text);
    }
  });

  const quickSelections = Array.isArray(form && form.reasonQuick)
    ? form.reasonQuick
    : [];
  quickSelections.forEach(function(key){
    const template = MISMATCH_QUICK_TEMPLATES[key];
    if (template) {
      lines.push(template);
    }
  });

  if (!lines.length) return;
  upsertContentUnderHeading(
    body,
    ['六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃','六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃:'],
    lines.join('\n')
  );
}
