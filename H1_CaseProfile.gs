/** ============ H1_CaseProfile.gs ============
 * 四、個案概況：包含 (一)~(六) 六個標題2（同一檔）
 * - (一)(二)(三)：先保護/補齊說明行，再就地插入內容
 * - (五)其他：空白→「無。」
 * - (六)複評評值：空白→「此個案為新案，無複評評值。」
 * ============================================ */
function applyH1_CaseProfile(body, form){
  applyH1_CP_S1(body, form); // (一) 身心概況
  applyH1_CP_S2(body, form); // (二) 經濟收入
  applyH1_CP_S3(body, form); // (三) 居住環境
  applyH1_CP_S4(body, form); // (四) 社會支持
  applyH1_CP_S5(body, form); // (五) 其他
  applyH1_CP_S6(body, form); // (六) 複評評值
}

/** (一) 身心概況 */
function applyH1_CP_S1(body, form){
  const text = (form.section1 || '').trim();
  upsertContentUnderHeading(body, ['(一)身心概況：','(一) 身心概況：','（一）身心概況：'], text);
}

/** (二) 經濟收入 */
function applyH1_CP_S2(body, form){
  const text = (form.section2 || '').trim();
  upsertContentUnderHeading(body, ['(二)經濟收入：','(二) 經濟收入：','（二）經濟收入：'], text);
}

/** (三) 居住環境（固定語序句） */
function applyH1_CP_S3(body, form){
  const text = (form.section3 || '').trim();
  upsertContentUnderHeading(body, ['(三)居住環境：','(三) 居住環境：','（三）居住環境：'], text);
}

/** (四) 社會支持（固定加：社區整合型服務中心為福安） */
function applyH1_CP_S4(body, form){
  const text = (form.section4 || '').trim();
  upsertContentUnderHeading(body, ['(四)社會支持：','(四) 社會支持：','（四）社會支持：'], text);
}

/** (五) 其他（空白→輸出「無。」） */
function applyH1_CP_S5(body, form){
  let text = (form.section5 || '').trim();
  if (!text) text = '無。';
  upsertContentUnderHeading(body, ['(五)其他：','(五) 其他：','（五）其他：'], text);
}

/** (六) 複評評值（空白→新案句） */
function applyH1_CP_S6(body, form){
  let text = (form.section6 || '').trim();
  if (!text) text = '此個案為新案，無複評評值。';
  upsertContentUnderHeading(body, ['(六)複評評值：','(六) 複評評值：','（六）複評評值：'], text);
}
