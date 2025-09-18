/** ============== H1_VisitDate.gs =============
 * 二、家訪日期：只改冒號後；出院日期：獨立行，保留括號說明
 * ============================================ */
function applyH1_VisitDate(body, form){
  const text = ymdToCJK(form.visitDate);
  replaceAfterHeadingColon(body, ['二、家訪日期：','二、家訪日期:'], text);
  if (form.isDischarge && form.dischargeDate){
    upsertSingleLineUnderHeading(body, ['二、家訪日期：','二、家訪日期:'], `出院日期：${ymdToCJK(form.dischargeDate)}`);
  }
}
