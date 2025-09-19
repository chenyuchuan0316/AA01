/** ============ H1_CaseProfile.gs ============
 * 四、個案概況：使用設定式流程一次處理六個小節
 * - 針對 (一)~(四) 直接寫入表單文字
 * - (五) 與 (六) 若為空白則補上預設語句
 * ============================================ */

const CASE_PROFILE_SECTIONS = Object.freeze([
  { key: 'section1', headings: ['(一)身心概況：','(一) 身心概況：','（一）身心概況：'] },
  { key: 'section2', headings: ['(二)經濟收入：','(二) 經濟收入：','（二）經濟收入：'] },
  { key: 'section3', headings: ['(三)居住環境：','(三) 居住環境：','（三）居住環境：'] },
  { key: 'section4', headings: ['(四)社會支持：','(四) 社會支持：','（四）社會支持：'] },
  { key: 'section5', headings: ['(五)其他：','(五) 其他：','（五）其他：'], fallback: '無。' },
  { key: 'section6', headings: ['(六)複評評值：','(六) 複評評值：','（六）複評評值：'], fallback: '此個案為新案，無複評評值。' }
]);

function applyH1_CaseProfile(body, form){
  CASE_PROFILE_SECTIONS.forEach(function(section){
    const text = getTrimmed(form, section.key) || section.fallback || '';
    upsertContentUnderHeading(body, section.headings, text);
  });
}
