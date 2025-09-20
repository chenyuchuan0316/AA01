/** ============================================================
 * AppCore.gs
 *
 * AA01 的核心伺服端邏輯整合在此檔案，包含：
 * 1. 使用者介面入口（功能表／側欄／Web App）。
 * 2. 文件產生流程（複製模板 → 寫入 H1 段落 → 附件頁）。
 * 3. 共用文字處理工具（尋段落、插入/覆蓋內容、日期格式）。
 * 4. 外部資料查詢與靜態資料匯總（人員名單、服務給付資料）。
 *
 * 每個函式皆附上詳細註解，說明其在流程中的角色與使用方式，
 * 以便後續維護人員快速掌握邏輯並安全擴充。
 * ============================================================ */

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

function sanitizeFilePart(part){
  if (!part) return '';
  return String(part)
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '');
}

function buildDocumentNaming(form){
  const casePart = sanitizeFilePart(getTrimmed(form, 'caseName')) || '未填個案';
  const managerPart = sanitizeFilePart(getTrimmed(form, 'caseManagerName')) || '未填個管師';
  const versionKey = `${casePart}_${managerPart}`;
  const rawVisit = getTrimmed(form, 'visitDate');
  const visitYmd = rawVisit ? rawVisit.replace(/-/g, '') : '';
  const todayYmd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  const datePart = visitYmd || todayYmd;
  const baseName = `FNA1_${datePart}_${versionKey}`;
  const nextVersion = computeNextVersionByKey(versionKey);
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
  const naming = buildDocumentNaming(form);
  const docContext = createDocumentFromTemplate(naming.fileName);

  runDocumentWriters(docContext.body, form);

  docContext.doc.saveAndClose();

  return {
    message: '已建立新檔並寫入內容',
    file: { id: docContext.docId, name: naming.fileName, url: 'https://docs.google.com/document/d/' + docContext.docId + '/edit' }
  };
}
/**
 * ============= H1_Sections.gs =============
 * 將「第一部分（H1）」相關段落邏輯集中於單一檔案。
 * 每個 applyH1_* 函式皆附上段落說明與細部註解，方便維護人員理解流程。
 * ==========================================
 */

// -----------------------------------------------------------------------------
// 一、電聯日期
// -----------------------------------------------------------------------------

/**
 * 一、電聯日期：依照情境選擇描述文字，最後寫回標題行。
 * - 若為照專約訪案件：顯示「本案({個案}) 由照顧專員({照專})進行約訪」
 * - 否則：將表單日期轉為「YYYY年MM月DD日」格式。
 */
function applyH1_CallDate(body, form){
  let text = '';

  // 輸入含 isConsultVisit 時改為約訪描述；否則轉換日期格式。
  if (form && form.isConsultVisit) {
    const caseName = (form.caseName || '').trim();
    const consultName = (form.consultName || '').trim();
    text = '本案(' + caseName + ') 由照顧專員(' + consultName + ')進行約訪';
  } else {
    text = ymdToCJK(form && form.callDate);
  }

  // 僅取代標題冒號後的文字，不動原始標題。
  replaceAfterHeadingColon(body, ['一、電聯日期：', '一、電聯日期:'], text);
}

// -----------------------------------------------------------------------------
// 二、家訪日期
// -----------------------------------------------------------------------------

/**
 * 二、家訪日期：
 * - 主行：更新標題行後的日期。
 * - 若有出院資訊：在標題下插入「出院日期：YYYY年MM月DD日」。
 */
function applyH1_VisitDate(body, form){
  const visitText = ymdToCJK(form && form.visitDate);
  replaceAfterHeadingColon(body, ['二、家訪日期：', '二、家訪日期:'], visitText);

  // 同時處理可選的出院資訊，僅當 isDischarge 為真且有填日期時寫入。
  if (form && form.isDischarge && form.dischargeDate) {
    const dischargeText = '出院日期：' + ymdToCJK(form.dischargeDate);
    upsertSingleLineUnderHeading(body, ['二、家訪日期：', '二、家訪日期:'], dischargeText);
  }
}

// -----------------------------------------------------------------------------
// 三、偕同訪視者
// -----------------------------------------------------------------------------

/**
 * 三、偕同訪視者：組合主要成員與額外參與者，輸出為單行句子。
 */
function applyH1_Attendees(body, form){
  const safeForm = form || {};
  const caseName = (safeForm.caseName || '').trim();
  const cmName = (safeForm.caseManagerName || '').trim();
  const consultName = (safeForm.consultName || '').trim();
  const primaryRel = (safeForm.primaryCaregiverRel || '').trim();
  const primaryName = (safeForm.primaryCaregiverName || '').trim();
  const includePrimary = typeof safeForm.includePrimary === 'undefined'
    ? true
    : !!safeForm.includePrimary;

  // 先組出固定格式的三位成員。
  let attendees = '個案(' + caseName + ') 、福安個管 (' + cmName + ')、照專(' + consultName + ')';

  // 視條件追加主要照顧者。
  if (includePrimary && primaryRel && primaryName) {
    attendees += '、主要照顧者為' + primaryRel + '(' + primaryName + ')';
  }

  // extras 是 [{role, name}] 陣列，逐一加到句子中。
  (Array.isArray(safeForm.extras) ? safeForm.extras : []).forEach(function(extra){
    const role = (extra && extra.role || '').trim();
    const name = (extra && extra.name || '').trim();
    if (role && name) {
      attendees += '、' + role + '(' + name + ')';
    }
  });

  attendees += '。';

  upsertContentUnderHeading(
    body,
    ['三、偕同訪視者：', '三、偕同訪視者:', '三、偕同訪視者'],
    attendees
  );
}

// -----------------------------------------------------------------------------
// 四、個案概況
// -----------------------------------------------------------------------------

/**
 * 四、個案概況的六個小節標題與預設值。
 * fallback 代表該欄未填時要補上的說明。
 */
const CASE_PROFILE_SECTIONS = Object.freeze([
  { key: 'section1', headings: ['(一)身心概況：','(一) 身心概況：','（一）身心概況：'] },
  { key: 'section2', headings: ['(二)經濟收入：','(二) 經濟收入：','（二）經濟收入：'] },
  { key: 'section3', headings: ['(三)居住環境：','(三) 居住環境：','（三）居住環境：'] },
  { key: 'section4', headings: ['(四)社會支持：','(四) 社會支持：','（四）社會支持：'] },
  { key: 'section5', headings: ['(五)其他：','(五) 其他：','（五）其他：'], fallback: '無。' },
  { key: 'section6', headings: ['(六)複評評值：','(六) 複評評值：','（六）複評評值：'], fallback: '此個案為新案，無複評評值。' }
]);

/**
 * 四、個案概況：依序處理六個小節，缺漏時寫入預設文字。
 */
function applyH1_CaseProfile(body, form){
  CASE_PROFILE_SECTIONS.forEach(function(section){
    const text = getTrimmed(form, section.key) || section.fallback || '';
    upsertContentUnderHeading(body, section.headings, text);
  });
}

// -----------------------------------------------------------------------------
// 五、照顧目標
// -----------------------------------------------------------------------------

/** 問題清單選項對照表（最多取前五項）。 */
const PROBLEM_DICT = {
  1:'進食問題', 2:'洗澡問題', 3:'個人修飾問題', 4:'穿脫衣物問題', 5:'大小便控制問題',
  6:'上廁所問題', 7:'移位問題', 8:'走路問題', 9:'上下樓梯問題', 10:'使用電話問題',
  11:'購物或外出問題', 12:'備餐問題', 13:'處理家務問題', 14:'用藥問題', 15:'處理財務問題',
  16:'溝通問題', 17:'短期記憶障礙', 18:'疼痛問題', 19:'不動症候群風險', 20:'皮膚照護問題',
  21:'傷口問題', 22:'水份及營養問題', 23:'吞嚥問題', 24:'管路照顧問題', 25:'其他醫療照護問題',
  26:'跌倒風險', 27:'安全疑慮', 28:'居住環境障礙', 29:'社會參與需協助', 30:'困擾行為',
  31:'照顧負荷過重', 32:'輔具使用問題', 33:'感染問題', 34:'其他問題'
};

/**
 * 為了兼容不同標題寫法，組出所有可能的「照顧問題」標題版本。
 */
const PROBLEM_HEADING_VARIANTS = (function(){
  const bases = ['(一)照顧問題','(一) 照顧問題','（一）照顧問題','（一） 照顧問題'];
  const marks = ['：', ':'];
  const prefixes = ['', '五、照顧目標', '五、照顧目標 ', '五、 照顧目標', '五、 照顧目標 '];
  const joiners = ['', '：', ':', '： ', ': ', ' '];
  const variants = [];

  prefixes.forEach(function(prefix){
    bases.forEach(function(base){
      marks.forEach(function(mark){
        if (!prefix) {
          variants.push(base + mark);
        } else {
          joiners.forEach(function(joiner){
            variants.push(prefix + joiner + base + mark);
          });
        }
      });
    });
  });

  return Array.from(new Set(variants));
})();

/** 各服務分類欄位設定，用於組短／中期目標。 */
const GOAL_CATEGORY_FIELDS = Object.freeze([
  { suffix: 'care', label: '照顧服務' },
  { suffix: 'prof', label: '專業服務' },
  { suffix: 'car',  label: '交通車服務' },
  { suffix: 'resp', label: '喘息服務' },
  { suffix: 'access', label: '無障礙及輔具' },
  { suffix: 'meal', label: '營養送餐' }
]);

/** 分別代表短期與中期目標的標題列表。 */
const GOAL_TIERS = Object.freeze([
  { prefix: 'short', headings: ['(二)短期目標','(二) 短期目標'] },
  { prefix: 'mid', headings: ['(三)中期目標','(三) 中期目標'] }
]);

/** 長期目標標題的變體。 */
const LONG_GOAL_HEADINGS = Object.freeze(['(四)長期目標','(四) 長期目標']);

/**
 * 允許多種輸入格式的問題編號，統一轉為字串陣列。
 */
function normalizeProblemKeys(raw){
  if (raw === undefined || raw === null) return [];
  var arr;

  if (Array.isArray(raw)) {
    arr = raw.slice();
  } else if (typeof raw === 'string') {
    arr = raw.split(/[,，、\s]+/);
  } else if (typeof raw === 'object') {
    try {
      arr = Array.prototype.slice.call(raw);
    } catch (err) {
      arr = [];
      for (var key in raw) {
        if (Object.prototype.hasOwnProperty.call(raw, key) && /^\d+$/.test(key)) {
          arr.push(raw[key]);
        }
      }
    }
  } else {
    arr = [raw];
  }

  return arr
    .map(function(val){
      const str = String(val).trim();
      if (!str) return '';
      const match = str.match(/\d+/);
      return match ? String(parseInt(match[0], 10)) : str;
    })
    .filter(function(val){ return !!val; });
}

/** 主流程：依序處理照顧問題、短／中期目標與長期目標。 */
function applyH1_CareGoals(body, form){
  applyCareProblems(body, form);
  GOAL_TIERS.forEach(function(tier){
    applyGoalTier(body, form, tier);
  });
  applyLongGoal(body, form);
}

/** 根據問題編號輸出「(編號.名稱)」字串，並處理補充說明。 */
function applyCareProblems(body, form){
  const rawKeys = normalizeProblemKeys(form && form.problemKeys);
  const uniqueKeys = [];
  const seen = {};

  for (var i = 0; i < rawKeys.length; i++) {
    const key = rawKeys[i];
    if (PROBLEM_DICT[key] && !seen[key]) {
      seen[key] = true;
      uniqueKeys.push(key);
      if (uniqueKeys.length >= 5) break; // 文件僅列前五項。
    }
  }

  const items = uniqueKeys.map(function(k){
    return k + '.' + PROBLEM_DICT[k];
  }).join('、');

  const titleLine = items ? '(' + items + ')' : '';
  replaceAfterHeadingColon(body, PROBLEM_HEADING_VARIANTS, titleLine);

  const note = getTrimmed(form, 'problemNote');
  if (note) {
    upsertSingleLineUnderHeading(body, PROBLEM_HEADING_VARIANTS, '補充說明：' + note);
  }
}

/** 逐一檢查服務分類欄位並組成多行內容。 */
function applyGoalTier(body, form, tier){
  const lines = GOAL_CATEGORY_FIELDS
    .map(function(field){
      const value = getTrimmed(form, tier.prefix + '_' + field.suffix);
      return value ? field.label + '：' + value : '';
    })
    .filter(function(text){ return !!text; });

  if (lines.length) {
    upsertContentUnderHeading(body, tier.headings, lines.join('\n'));
  }
}

/** 長期目標：直接寫入前端整理好的文字。 */
function applyLongGoal(body, form){
  const text = getTrimmed(form, 'long_goal');
  upsertContentUnderHeading(body, LONG_GOAL_HEADINGS, text);
}

// -----------------------------------------------------------------------------
// 六、與照專建議服務項目不一致原因
// -----------------------------------------------------------------------------

/** 三個主要欄位的標題及前綴字。 */
const MISMATCH_REASON_FIELDS = Object.freeze([
  { key: 'reason1', prefix: '1.目標達成的狀況以及未達成的差距：' },
  { key: 'reason2', prefix: '2.資源的變動情形：' },
  { key: 'reason3', prefix: '3.未使用的替代方案或是可能的影響：' }
]);

/** 常用快捷字串，會附加在第三小節之後。 */
const MISMATCH_QUICK_TEMPLATES = Object.freeze({
  q1: '1..經與案○討論，目前暫無備餐之需求，改為代購服務。',
  q2: '2..經與案○討論，目前因個案身體狀況，暫無專業服務需求，日後待個案狀況好轉後，依當下狀況核定，續追蹤。'
});

/**
 * 六、與照專建議服務項目、問題清單不一致原因說明及後續規劃。
 * - 僅在任一欄位有內容時建立段落。
 * - 會依序加入固定欄位與勾選的快捷語句。
 */
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
    ['六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃',
     '六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃:'],
    lines.join('\n')
  );
}

// -----------------------------------------------------------------------------
// 結束：此檔案僅暴露 applyH1_* 系列函式，供 Main.gs 的 DOCUMENT_WRITERS 使用。
// -----------------------------------------------------------------------------
/** ============== PlanAttachments.gs =============
 * 處理附件頁面：計畫執行規劃與服務明細
 * ============================================== */

const PLAN_CATEGORY_ORDER = Object.freeze(['B','C','D','EF','G','SC','MEAL','OTHER']);

function applyPlanExecutionPage(body, form){
  ensurePageBreak(body);
  appendHeading(body, '附件一：計畫執行規劃', DocumentApp.ParagraphHeading.HEADING1);
  const planText = (form && form.planText ? String(form.planText) : '').trim();
  if (!planText){
    body.appendParagraph('（未提供計畫執行規劃內容）');
    return;
  }
  planText.split(/\r?\n/).forEach(function(line){
    appendPlanExecutionLine(body, line);
  });
}

function appendPlanExecutionLine(body, line){
  const trimmed = (line || '').trim();
  if (!trimmed){
    body.appendParagraph('');
    return;
  }
  if (/^[-•\u2022]/.test(trimmed)){
    const item = body.appendListItem(trimmed.replace(/^[-•\u2022]+\s*/, ''));
    item.setGlyphType(DocumentApp.GlyphType.BULLET);
    return;
  }
  if (/^[一二三四五六七八九十]+、/.test(trimmed)){
    appendHeading(body, trimmed, DocumentApp.ParagraphHeading.HEADING2);
    return;
  }
  if (/^[（(][一二三四五六七八九十]+[)）]/.test(trimmed)){
    appendHeading(body, trimmed, DocumentApp.ParagraphHeading.HEADING3);
    return;
  }
  body.appendParagraph(trimmed);
}

function applyPlanServiceSummaryPage(body, form){
  ensurePageBreak(body);
  appendHeading(body, '附件二：服務計畫明細', DocumentApp.ParagraphHeading.HEADING1);
  const entries = Array.isArray(form && form.servicePlan)
    ? form.servicePlan.filter(function(entry){ return entry && entry.code; })
    : [];
  if (!entries.length){
    body.appendParagraph('尚未選擇服務項目。');
    return;
  }
  const grouped = groupServicePlanEntries(entries);
  PLAN_CATEGORY_ORDER.forEach(function(cat){
    const list = grouped[cat];
    if (!list || !list.length) return;
    appendHeading(body, planCategoryDisplay(cat), DocumentApp.ParagraphHeading.HEADING2);
    list.sort(function(a,b){ return (a.code || '').localeCompare(b.code || ''); });
    const rows = [['服務代碼','服務名稱','承接','指定單位','額度／單位','使用頻率／說明']];
    list.forEach(function(entry){
      rows.push([
        entry.code || '',
        entry.name || '',
        formatVendorMode(entry),
        formatVendorName(entry),
        formatPlanAmount(entry),
        formatPlanUsage(entry)
      ]);
    });
    const table = body.appendTable(rows);
    const header = table.getRow(0);
    for (var i=0;i<header.getNumCells();i++){
      header.getCell(i).editAsText().setBold(true);
    }
    body.appendParagraph('');
  });
}

function groupServicePlanEntries(entries){
  const grouped = {};
  entries.forEach(function(entry){
    if (!entry) return;
    var cat = (entry.category || '').toString().toUpperCase();
    if (!cat){
      cat = determineServiceCategoryCode(entry.code);
    }
    if (!cat) cat = 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  });
  return grouped;
}

function determineServiceCategoryCode(code){
  if (!code) return '';
  if (/^SC/i.test(code)) return 'SC';
  if (/^OT/i.test(code)) return 'MEAL';
  if (/^DA/i.test(code)) return 'D';
  const first = code.charAt(0).toUpperCase();
  if (first === 'B') return 'B';
  if (first === 'C') return 'C';
  if (first === 'D') return 'D';
  if (first === 'E' || first === 'F') return 'EF';
  if (first === 'G') return 'G';
  return '';
}

function planCategoryDisplay(cat){
  switch((cat || '').toUpperCase()){
    case 'B': return 'B碼服務（居家／日照）';
    case 'C': return 'C碼專業服務';
    case 'D': return 'D碼／交通接送';
    case 'EF': return 'E.F碼（輔具與無障礙補助）';
    case 'G': return 'G碼（喘息服務）';
    case 'SC': return 'SC碼（短期照顧）';
    case 'MEAL': return '營養餐飲服務（OT碼）';
    default: return '其他服務';
  }
}

function formatVendorMode(entry){
  if (!entry) return '';
  return entry.vendorMode || '輪派';
}

function formatVendorName(entry){
  if (!entry) return '';
  const mode = (entry.vendorMode || '').trim();
  if (mode === '指定'){
    return entry.vendorName || '（尚未填寫）';
  }
  return entry.vendorName || '';
}

function isFiniteNumber(value){
  return typeof value === 'number' && isFinite(value);
}

function formatPointValue(value){
  if (!isFiniteNumber(value)) return '';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatWeeklyValue(value){
  if (!isFiniteNumber(value)) return '';
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) return String(Math.round(rounded));
  return rounded.toFixed(1).replace(/\.0$/, '');
}

function formatPlanAmount(entry){
  if (!entry) return '';
  const category = (entry.category || determineServiceCategoryCode(entry.code) || '').toUpperCase();
  const lines = [];
  if (category === 'B'){
    const hasAuto = isFiniteNumber(entry.autoPlanMonthlyVisits) || isFiniteNumber(entry.autoPlanMonthlyUnits);
    if (hasAuto){
      if (isFiniteNumber(entry.autoPlanMonthlyVisits)){
        const unitLabel = entry.autoPlanUnitLabel || (entry.code && entry.code.indexOf('BD03') === 0 ? '趟' : '次');
        const monthly = formatPointValue(entry.autoPlanMonthlyVisits);
        if (isFiniteNumber(entry.autoPlanWeeklyVisits)){
          const weeklyUnit = unitLabel === '趟' ? '趟' : '次';
          lines.push(`每月約${monthly}${unitLabel}（每週約${formatWeeklyValue(entry.autoPlanWeeklyVisits)}${weeklyUnit}）`);
        } else {
          lines.push(`每月約${monthly}${unitLabel}`);
        }
      }
      if (isFiniteNumber(entry.autoPlanMonthlyUnits)){
        lines.push(`預估耗用${formatPointValue(entry.autoPlanMonthlyUnits)}點`);
      }
      if (isFiniteNumber(entry.autoPlanRemainingCap)){
        lines.push(`預估餘額${formatPointValue(entry.autoPlanRemainingCap)}點`);
      }
      if (lines.length) return lines.join('\n');
    }
  }
  if (category === 'EF'){
    if (entry.original) lines.push('原額度：' + entry.original);
    if (entry.planned) lines.push('核定：' + entry.planned);
    if (entry.remaining) lines.push('餘額：' + entry.remaining);
  } else if (category === 'G' || category === 'SC'){
    if (entry.planned) lines.push('規劃：' + entry.planned);
    if (entry.remaining) lines.push('餘額：' + entry.remaining);
  } else if (category === 'MEAL'){
    if (entry.mealsPerDay) lines.push('每日' + entry.mealsPerDay + '餐');
    if (entry.mealType) lines.push(entry.mealType);
  } else {
    const monthly = entry.monthlyUnits || entry.monthlyUnitsComputed;
    if (monthly) lines.push(monthly + ' 單位/月');
    if (entry.monthlyExtraDesc) lines.push(entry.monthlyExtraDesc);
  }
  if (!lines.length && entry.planned) lines.push(entry.planned);
  return lines.join('\n');
}

function formatPlanUsage(entry){
  if (!entry) return '';
  const lines = [];
  if (entry.period) lines.push('期間：' + entry.period);
  const freq = entry.frequencyManual ? entry.frequency : (entry.autoFrequencyText || entry.frequency);
  if (freq) lines.push(freq);
  if (entry.usage){
    lines.push(entry.usage);
  } else if (entry.autoUsageText){
    lines.push(entry.autoUsageText);
  }
  if (entry.extra) lines.push(entry.extra);
  return lines.join('\n');
}
/** ================= Utils.gs ==================
 * 共用：尋段、就地取代/插入、區塊重建、日期格式、句尾規範等
 * ============================================ */


/** yyyy-MM-dd → YYYY年MM月DD日 */
function ymdToCJK(ymd){
  if(!ymd) return '';
  const [y,m,d] = ymd.split('-');
  return `${y}年${m}月${d}日`;
}

/** 找到符合任一標題前綴的段落；回傳 {index, paragraph, hv} 或 null */
function findHeadingParagraph(body, headingVariants){
  const paras = body.getParagraphs();
  for (let i=0;i<paras.length;i++){
    const t = (paras[i].getText() || '').trim();
    for (const hv of headingVariants){
      if (t.indexOf(hv) === 0) return { index:i, paragraph: paras[i], hv };
    }
  }
  return null;
}

/** 將「標題行」的冒號後文字取代為指定字串（用於日期與 Problems 行） */
function replaceAfterHeadingColon(body, headingVariants, replaceText){
  const found = findHeadingParagraph(body, headingVariants);
  if(!found) return false;
  const {paragraph, hv} = found;
  paragraph.setText(hv + replaceText);
  return true;
}

/** 是否遇到下一個標題（大標或小標） */
function isNextHeadingLine_(txt){
  const t = (txt||'').trim();
  if (!t) return false;
  // 小標：(一) / （一）
  if (/^[（(]?[一二三四五六七八九十]+[)）]/.test(t)) return true;
  // 大標：一、二、三… 或 五、
  if (/^[一二三四五六七八九十]+、/.test(t)) return true;
  return false;
}

/**
 * 在指定標題下插入/更新「內容行」（保留「如…等。」說明）
 * 規則：
 *  - 跳過空行與「如…等。」行
 *  - 找到第一個內容行 → 覆蓋
 *  - 若緊接下一個標題 → 插入新行
 */
function upsertContentUnderHeading(body, headingVariants, content){
  const found = findHeadingParagraph(body, headingVariants);
  if(!found) return false;
  const { index } = found;
  const paras = body.getParagraphs();
  let i = index + 1;
  while (i < paras.length){
    const txt = (paras[i].getText()||'').trim();
    if (isNextHeadingLine_(txt)) break;
    if (!txt || /如.*等[。.]?$/.test(txt)) { i++; continue; }
    // 覆蓋現有內容行
    paras[i].setText(content || '');
    return true;
  }
  // 沒有內容行 → 插入新段落
  body.insertParagraph(i, content || '');
  return true;
}

/** 在指定標題下新增或更新「單行內容」（不處理『如…等』） */
function upsertSingleLineUnderHeading(body, headingVariants, content){
  const found = findHeadingParagraph(body, headingVariants);
  if(!found) return false;
  const { index } = found;
  const paras = body.getParagraphs();
  const nextIdx = index + 1;
  if (nextIdx < paras.length){
    const txt = (paras[nextIdx].getText()||'').trim();
    if (isNextHeadingLine_(txt)){
      body.insertParagraph(nextIdx, content || '');
    }else{
      paras[nextIdx].setText(content || '');
    }
  }else{
    body.appendParagraph(content || '');
  }
  return true;
}

/** 在文件結尾補上一個分頁符號（若尚未存在） */
function ensurePageBreak(body){
  if (!body) return;
  const total = body.getNumChildren();
  if (total <= 0) return;
  const last = body.getChild(total - 1);
  if (last && last.getType() === DocumentApp.ElementType.PAGE_BREAK) return;
  body.appendPageBreak();
}

/** 於文件末尾新增標題段落，並套用指定 Heading 等級 */
function appendHeading(body, text, heading){
  if (!body) return null;
  const paragraph = body.appendParagraph(text || '');
  if (heading) {
    paragraph.setHeading(heading);
  }
  return paragraph;
}

/** 取得表單欄位並轉為去除前後空白的字串 */
function getTrimmed(form, key){
  if (!form || typeof key === 'undefined' || key === null) return '';
  const value = form[key];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}
/** ============== FilesVersion.gs =============
 * 公版→複製新檔；個案檔→同檔升版＆改名
 * ============================================ */

/** 依資料夾既有檔名計算下一版號：baseName_Vn → n+1 */
function computeNextVersionByKey(versionKey){
  const key = versionKey || '未填個案_未填個管師';
  const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const it = folder.getFiles();
  let maxV = 0;
  const re = new RegExp('^FNA1_\\d{8}_'+escapeRegExp(key)+'_V(\\d+)$');
  while (it.hasNext()){
    const f = it.next();
    const name = f.getName();
    const m = name.match(re);
    if (m) {
      const v = parseInt(m[1], 10);
      if (!isNaN(v) && v > maxV) maxV = v;
    }
  }
  return maxV + 1;
}

function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
/** ================ HRLookup.gs ================
 * 依單位代碼（B 欄前四碼）→ 取 H 欄姓名清單
 * ============================================ */
function getCaseManagersByUnit(unitCode){
  try{
    const sh = SpreadsheetApp.openById(MANAGERS_SHEET_ID).getSheetByName(MANAGERS_SHEET_NAME);
    const vals = sh.getDataRange().getValues(); // 第1列為標題
    const out = [];
    for (let i=1;i<vals.length;i++){
      const empId = (vals[i][1]||'').toString(); // B欄
      const name  = (vals[i][7]||'').toString(); // H欄
      if (empId && empId.substring(0,4) === unitCode && name) out.push(name);
    }
    return out.sort();
  }catch(e){
    return [];
  }
}
/** ================ getConsultantsByUnit.gs ================
 * 依單位代碼（B 欄前四碼）→ 取B 欄姓名清單
 * ============================================ */
function getConsultantsByUnit(unit) {
  const ss = SpreadsheetApp.openById(CONSULTANTS_BOOK_ID);
  const sheet = ss.getSheetByName(CONSULTANTS_BOOK_NAME);
  const values = sheet.getDataRange().getValues();
  return values
    .filter(r => r[0] === unit && r[2] === "在職")
    .map(r => r[1]);
}

/**
 * 彙整前端所需的服務資料：
 * - needLevelCaps：CMS 等級對應之 B/C 額度。
 * - dayCareRequirements / dayCareLevels：日照代碼與等級限制。
 * - serviceRates：各服務代碼的基本單價與備註。
 * - transportRoundTrips：交通車往返趟次（預設 2）。
 */
function getServiceCatalog(){
  const catalog = {
    needLevelCaps: {},
    dayCareRequirements: {},
    dayCareLevels: {},
    serviceRates: {},
    transportRoundTrips: 2
  };

  const caps = getTaoyuanLtcTable('needLevelsCaps');
  caps.forEach(function(item){
    if (!item || item.needLevel === undefined) return;
    catalog.needLevelCaps[String(item.needLevel)] = item.bcMonthlyCap || 0;
  });

  const dayCareLevels = {};
  getTaoyuanLtcTable('dayCare').forEach(function(item){
    if (!item || !item.code) return;
    catalog.serviceRates[item.code] = extractServiceRate(item);
    const level = extractServiceLevelRequirement(item.note);
    if (level){
      catalog.dayCareRequirements[item.code] = level;
      if (!dayCareLevels[level]) dayCareLevels[level] = [];
      dayCareLevels[level].push(item.code);
    }
  });

  // 其他服務（居家、專業、喘息、餐食等）亦納入 price map
  const data = getTaoyuanLtcData();
  Object.keys(data).forEach(function(key){
    const table = data[key];
    if (!Array.isArray(table)) return;
    table.forEach(function(item){
      if (!item || !item.code) return;
      if (!catalog.serviceRates[item.code]){
        catalog.serviceRates[item.code] = extractServiceRate(item);
      }
    });
  });

  Object.keys(dayCareLevels).forEach(function(level){
    dayCareLevels[level].sort();
  });
  catalog.dayCareLevels = dayCareLevels;

  return catalog;
}

function extractServiceRate(item){
  return {
    price: item && item.price ? Number(item.price) : null,
    remotePrice: item && item.remotePrice ? Number(item.remotePrice) : null,
    unit: item && item.unit ? item.unit : '',
    note: item && item.note ? item.note : ''
  };
}

function extractServiceLevelRequirement(note){
  if (!note) return '';
  const match = String(note).match(/等級\s*(\d+)/);
  return match ? String(match[1]) : '';
}
