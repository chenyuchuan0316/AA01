/** ============== H1_CallDate.gs =============
 * 一、電聯日期：只改冒號後日期字串
 * ============================================ */
function applyH1_CallDate(body, form){
  let text = '';
  if(form && form.isConsultVisit){
    const caseName = (form.caseName || '').trim();
    const consultName = (form.consultName || '').trim();
    text = `本案(${caseName}) 由照顧專員(${consultName})進行約訪`;
  }else{
    text = ymdToCJK(form.callDate);
  }
  replaceAfterHeadingColon(body, ['一、電聯日期：','一、電聯日期:'], text);
}

