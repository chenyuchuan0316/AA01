/** ================= Main.gs ==================
 * 進入點：showSidebar/doGet、applyAndSave
 * - 若在公版：複製新檔 → 對新檔寫入 → 開新檔
 * - 若在個案檔：同檔寫入 → 同檔改名（日期與版本 +1）
 * ============================================ */

/** ===== Main.gs ===== */

/** 右上功能表 */
function onOpen(){
  DocumentApp.getUi().createMenu('計畫助手')
    .addItem('開啟側欄','showSidebar')
    .addToUi();
}

/** 建立 HtmlService 介面（供側欄或 Web App 共用） */
function buildAppHtmlOutput(){
  return HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('計畫助手（快速填寫）');
}

/** 顯示 Sidebar.html */
function showSidebar(){
  const html = buildAppHtmlOutput().setWidth(420);
  DocumentApp.getUi().showSidebar(html);
}

/** Web App 入口：回傳完整頁面（無寬度限制） */
function doGet(){
  return buildAppHtmlOutput();
}

/** AI 潤稿（目前 Stub：原文返回；後續可改為串接實際模型） */
function polishSection(key, text, context){
  // 僅允許語句順化（請於串接模型時遵守不得新增事實）
  return { text: text };
}

/** 主要流程：複製公版 → 依表單寫入 → 依規則命名 → 開啟 */
function applyAndSave(form){
  // 一致性潤稿（預留掛鉤；目前不修改 form）
  if (form.doBatchPolish) {
    // TODO: 批次潤稿策略（雜湊比對僅處理有變動段落）
  }

  // 命名規則：單位代碼_家訪日期_個案名稱_Vn
  const ymd = (form.visitDate || '').replace(/-/g,''); // YYYYMMDD
  const baseName = `${form.unitCode}_${ymd}_${form.caseName}`;
  const nextVer = computeNextVersion(baseName);
  const fileName = `${baseName}_V${nextVer}`;

  // 從公版複製新檔
  const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const tpl = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const copy = tpl.makeCopy(fileName, folder);
  const docId = copy.getId();
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();

  // === H1-1 ~ H1-3 ===
  applyH1_CallDate(body, form);
  applyH1_VisitDate(body, form);
  applyH1_Attendees(body, form);

  // === H1-4 ：四、個案概況 ===
  applyH1_CaseProfile(body, form);

  // === H1-5 ：五、照顧目標 ===
  applyH1_CareGoals(body, form);

  // === H1-6 ：六、與照專… ===
  applyH1_MismatchPlan(body, form);

  doc.saveAndClose();

  return {
    message: '已建立新檔並寫入內容',
    file: { id: docId, name: fileName, url: 'https://docs.google.com/document/d/'+docId+'/edit' }
  };
}
