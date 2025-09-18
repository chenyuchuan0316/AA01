/** ============== H1_CallDate.gs =============
 * 一、電聯日期：只改冒號後日期字串
 * ============================================ */
function applyH1_CallDate(body, form){
  const text = ymdToCJK(form.callDate);
  replaceAfterHeadingColon(body, ['一、電聯日期：','一、電聯日期:'], text);
}

