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

/**
 * 依序處理文件寫入的函式。
 * 使用 Object.freeze 避免部署時遭到意外改動順序。
 * H1 相關段落已整併於 H1_Sections.gs，便於維護。
 */
const DOCUMENT_WRITERS = Object.freeze([
  applyH1_CallDate,
  applyH1_VisitDate,
  applyH1_Attendees,
  applyH1_CaseProfile,
  applyH1_CareGoals,
  applyH1_MismatchPlan,
  applyPlanExecutionPage,
  applyPlanServiceSummaryPage
]);

function buildDocumentNaming(form){
  const unitCode = (form && form.unitCode) || '';
  const visitYmd = ((form && form.visitDate) || '').replace(/-/g, '');
  const caseName = (form && form.caseName) || '';
  let baseName = `${unitCode}_${visitYmd}_${caseName}`;
  if (!unitCode && !visitYmd && !caseName) {
    baseName = 'AA01_計畫';
  }
  const nextVersion = computeNextVersion(baseName);
  return {
    baseName: baseName,
    version: nextVersion,
    fileName: `${baseName}_V${nextVersion}`
  };
}

function createDocumentFromTemplate(fileName){
  const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const copy = templateFile.makeCopy(fileName, folder);
  const docId = copy.getId();
  const doc = DocumentApp.openById(docId);
  return { docId: docId, doc: doc, body: doc.getBody() };
}

function runDocumentWriters(body, form){
  DOCUMENT_WRITERS.forEach(function(writer){
    if (typeof writer === 'function') {
      writer(body, form);
    }
  });
}

/** 主要流程：複製公版 → 依表單寫入 → 依規則命名 → 開啟 */
function applyAndSave(form){
  // 一致性潤稿（預留掛鉤；目前不修改 form）
  if (form.doBatchPolish) {
    // TODO: 批次潤稿策略（雜湊比對僅處理有變動段落）
  }

  const naming = buildDocumentNaming(form);
  const docContext = createDocumentFromTemplate(naming.fileName);

  runDocumentWriters(docContext.body, form);

  docContext.doc.saveAndClose();

  return {
    message: '已建立新檔並寫入內容',
    file: { id: docContext.docId, name: naming.fileName, url: 'https://docs.google.com/document/d/' + docContext.docId + '/edit' }
  };
}
