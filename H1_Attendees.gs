/**
 * ================= H1_Attendees.gs =================
 * 三、偕同訪視者：就地組句並寫入文件
 * 規格：
 * - 文件中「三、偕同訪視者：」標題下，插入（或更新）一行文字，格式：
 *   個案(個案姓名) 、福安個管 (個管師姓名)、照專(照專姓名)、
 *   （若 includePrimary 為 true 且主照者有填）主要照顧者為{關係}({姓名})、
 *   其他參與者：role(name)、role(name)…。
 * - 此函式僅負責「三、偕同訪視者」單一題目，不影響其他邏輯。
 */
function applyH1_Attendees(body, form){
  const caseName    = (form.caseName || '').trim();
  const cmName      = (form.caseManagerName || '').trim();
  const consultName = (form.consultName || '').trim();
  const primaryRel  = (form.primaryCaregiverRel || '').trim();
  const primaryName = (form.primaryCaregiverName || '').trim();
  const includePrimary = (typeof form.includePrimary === 'undefined') ? true : !!form.includePrimary;

  let attendees = `個案(${caseName}) 、福安個管 (${cmName})、照專(${consultName})`;
  if (includePrimary && primaryRel && primaryName) {
    attendees += `、主要照顧者為${primaryRel}(${primaryName})`;
  }
  (Array.isArray(form.extras) ? form.extras : []).forEach(e=>{
    const role=(e.role||'').trim(), name=(e.name||'').trim();
    if (role && name) attendees += `、${role}(${name})`;
  });
  attendees += '。';

  upsertContentUnderHeading(
    body,
    ['三、偕同訪視者：','三、偕同訪視者:','三、偕同訪視者'],
    attendees
  );
}
