/** ========= H1_MismatchPlan.gs =============
 * 六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃
 * - 三格（有填才重建該節）：1.達成/差距 2.資源變動 3.替代方案/影響
 * - 常用快捷（q1/q2）會附加於第 3 格後
 * =========================================== */
function applyH1_MismatchPlan(body, form){
  const r1=(form.reason1||'').trim(), r2=(form.reason2||'').trim(), r3=(form.reason3||'').trim();
  const q=form.reasonQuick || [];
  const quickLines = [];
  if (q.includes('q1')) quickLines.push('1..經與案○討論，目前暫無備餐之需求，改為代購服務。');
  if (q.includes('q2')) quickLines.push('2..經與案○討論，目前因個案身體狀況，暫無專業服務需求，日後待個案狀況好轉後，依當下狀況核定，續追蹤。');

  const lines = [];
  if (r1) lines.push('1.目標達成的狀況以及未達成的差距：' + r1);
  if (r2) lines.push('2.資源的變動情形：' + r2);
  if (r3) lines.push('3.未使用的替代方案或是可能的影響：' + r3);
  quickLines.forEach(x=> lines.push(x));

  if (!lines.length) return; // 全空則不輸出
  upsertContentUnderHeading(
    body,
    ['六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃','六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃:'],
    lines.join('\n')
  );
}
