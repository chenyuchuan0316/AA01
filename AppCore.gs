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
  applyPlanServiceSummaryPage,
  applyPlanOtherNotesPage
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

function renderSimpleTemplate(template, data){
  var text = template || '';
  var source = data || {};
  return text.replace(/{{\s*([\w.]+)\s*}}/g, function(match, key){
    return resolveTemplateValue(source, key);
  });
}

function resolveTemplateValue(data, path){
  if (!data) return '';
  var segments = String(path || '').split('.');
  var current = data;
  for (var i = 0; i < segments.length; i++) {
    if (current === null || typeof current === 'undefined') return '';
    current = current[segments[i]];
  }
  if (current === null || typeof current === 'undefined') return '';
  return String(current);
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
  const safeForm = form || {};
  const isConsult = !!safeForm.isConsultVisit;
  const template = isConsult ? H1_TEMPLATES.callDate.consult : H1_TEMPLATES.callDate.default;
  const text = renderSimpleTemplate(template, {
    caseName: (safeForm.caseName || '').trim(),
    consultName: (safeForm.consultName || '').trim(),
    date: ymdToCJK(safeForm.callDate)
  });
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
  const safeForm = form || {};
  const visitText = renderSimpleTemplate(H1_TEMPLATES.visitDate.main, {
    date: ymdToCJK(safeForm.visitDate)
  });
  let finalText = visitText;
  if (safeForm.isDischarge && safeForm.dischargeDate) {
    const dischargeText = renderSimpleTemplate(H1_TEMPLATES.visitDate.discharge, {
      date: ymdToCJK(safeForm.dischargeDate)
    });
    if (dischargeText) {
      finalText = visitText ? `${visitText}、${dischargeText}` : dischargeText;
    }
  }
  replaceAfterHeadingColon(body, ['二、家訪日期：', '二、家訪日期:'], finalText);
}

// -----------------------------------------------------------------------------
// 三、偕同訪視者
// -----------------------------------------------------------------------------

/**
 * 三、偕同訪視者：組合主要成員與額外參與者，輸出為單行句子。
 */
function applyH1_Attendees(body, form){
  const safeForm = form || {};
  const includePrimary = typeof safeForm.includePrimary === 'undefined'
    ? true
    : !!safeForm.includePrimary;
  const participants = [];

  const base = renderSimpleTemplate(H1_TEMPLATES.attendees.base, {
    caseName: (safeForm.caseName || '').trim(),
    caseManagerName: (safeForm.caseManagerName || '').trim(),
    consultName: (safeForm.consultName || '').trim()
  }).trim();
  if (base) {
    participants.push(base);
  }

  const primaryRel = (safeForm.primaryCaregiverRel || '').trim();
  const primaryName = (safeForm.primaryCaregiverName || '').trim();
  if (includePrimary && primaryRel && primaryName) {
    participants.push(renderSimpleTemplate(H1_TEMPLATES.attendees.primary, {
      primaryRel: primaryRel,
      primaryName: primaryName
    }));
  }

  (Array.isArray(safeForm.extras) ? safeForm.extras : []).forEach(function(extra){
    const role = (extra && extra.role || '').trim();
    const name = (extra && extra.name || '').trim();
    if (role && name) {
      participants.push(renderSimpleTemplate(H1_TEMPLATES.attendees.extra, {
        role: role,
        name: name
      }));
    }
  });

  const listText = participants.join('、');
  const sentence = renderSimpleTemplate(H1_TEMPLATES.attendees.sentence, { list: listText });

  upsertContentUnderHeading(
    body,
    ['三、偕同訪視者：', '三、偕同訪視者:', '三、偕同訪視者'],
    sentence
  );
}

// -----------------------------------------------------------------------------
// 四、個案概況
// -----------------------------------------------------------------------------

/**
 * 四、個案概況：依序處理六個小節，缺漏時寫入預設文字。
 */
function applyH1_CaseProfile(body, form){
  H1_CASE_PROFILE_SECTIONS.forEach(function(section){
    const text = getTrimmed(form, section.key) || section.fallback || '';
    upsertContentUnderHeading(body, section.headings, text);
  });
}

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
      var str = String(val).trim();
      if (!str) return '';
      var match = str.match(/\d+/);
      return match ? String(parseInt(match[0], 10)) : str;
    })
    .filter(function(val){ return !!val; });
}

function applyH1_CareGoals(body, form){
  applyCareProblems(body, form);
  H1_GOAL_TIERS.forEach(function(tier){
    applyGoalTier(body, form, tier);
  });
  applyLongGoal(body, form);
}

function applyCareProblems(body, form){
  const rawKeys = normalizeProblemKeys(form && form.problemKeys);
  const uniqueKeys = [];
  const seen = {};

  for (var i = 0; i < rawKeys.length; i++) {
    const key = rawKeys[i];
    if (H1_PROBLEM_DICT[key] && !seen[key]) {
      seen[key] = true;
      uniqueKeys.push(key);
      if (uniqueKeys.length >= 5) break;
    }
  }

  const items = uniqueKeys
    .map(function(k){
      return renderSimpleTemplate(H1_TEMPLATES.careGoals.problemItem, {
        index: k,
        label: H1_PROBLEM_DICT[k]
      });
    })
    .join('、');

  const titleLine = items
    ? renderSimpleTemplate(H1_TEMPLATES.careGoals.problemTitle, { items: items })
    : '';
  replaceAfterHeadingColon(body, H1_PROBLEM_HEADING_VARIANTS, titleLine);

  const note = getTrimmed(form, 'problemNote');
  if (note) {
    const renderedNote = renderSimpleTemplate(H1_TEMPLATES.careGoals.problemNote, { note: note });
    upsertSingleLineUnderHeading(body, H1_PROBLEM_HEADING_VARIANTS, renderedNote);
  }
}

function applyGoalTier(body, form, tier){
  const lines = H1_GOAL_CATEGORY_FIELDS
    .map(function(field){
      const value = getTrimmed(form, tier.prefix + '_' + field.suffix);
      return value
        ? renderSimpleTemplate(H1_TEMPLATES.careGoals.serviceLine, {
            label: field.label,
            value: value
          })
        : '';
    })
    .filter(function(text){ return !!text; });

  if (lines.length) {
    upsertContentUnderHeading(body, tier.headings, lines.join('\n'));
  }
}

function applyLongGoal(body, form){
  const text = getTrimmed(form, 'long_goal');
  upsertContentUnderHeading(body, H1_LONG_GOAL_HEADINGS, text);
}

// -----------------------------------------------------------------------------
// 六、與照專建議服務項目不一致原因
// -----------------------------------------------------------------------------

/**
 * 六、與照專建議服務項目、問題清單不一致原因說明及後續規劃。
 * - 僅在任一欄位有內容時建立段落。
 * - 會依序加入固定欄位與勾選的快捷語句。
 */
function applyH1_MismatchPlan(body, form){
  const lines = [];

  H1_MISMATCH_REASON_FIELDS.forEach(function(field){
    const text = getTrimmed(form, field.key);
    if (text) {
      lines.push(renderSimpleTemplate(H1_TEMPLATES.mismatch.line, {
        prefix: field.prefix,
        text: text
      }));
    }
  });

  const quickSelections = Array.isArray(form && form.reasonQuick)
    ? form.reasonQuick
    : [];

  quickSelections.forEach(function(key){
    const template = H1_MISMATCH_QUICK_TEMPLATES[key];
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

const PLAN_SUMMARY_GROUPS = Object.freeze([
  { id:'BC', label:'居家服務（B/C）', includes:['B','C'] },
  { id:'D', label:'專業服務（D）', includes:['D'] },
  { id:'G', label:'喘息服務（G）', includes:['G'] },
  { id:'EF', label:'輔具及無障礙補助（E/F）', includes:['EF'] },
  { id:'SC', label:'短期照顧（SC）', includes:['SC'] },
  { id:'MEAL', label:'營養餐飲服務（OT）', includes:['MEAL'] },
  { id:'OTHER', label:'其他服務', includes:['OTHER'] }
]);
const PLAN_CATEGORY_ORDER = Object.freeze(PLAN_SUMMARY_GROUPS.map(function(group){ return group.id; }));
const PLAN_CATEGORY_LOOKUP = (function(){
  const map = {};
  PLAN_SUMMARY_GROUPS.forEach(function(group){
    (group.includes || []).forEach(function(cat){
      map[String(cat).toUpperCase()] = group.id;
    });
  });
  return map;
})();

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
  var totalSelfPay = 0;
  PLAN_CATEGORY_ORDER.forEach(function(groupId){
    const list = grouped[groupId];
    if (!list || !list.length) return;
    appendHeading(body, planCategoryDisplay(groupId), DocumentApp.ParagraphHeading.HEADING2);
    const rows = [['服務代碼','服務名稱','承接','指定單位','額度／單位','自費金額','使用頻率／說明']];
    const aggregatedRows = aggregateServicePlanRows(list);
    aggregatedRows.forEach(function(row){
      totalSelfPay += row.totalSelfPay || 0;
      rows.push([
        row.codes || '',
        row.names || '',
        row.vendorMode || '',
        row.vendorName || '',
        row.amount || '',
        row.selfPay || '',
        row.usage || ''
      ]);
    });
    const table = body.appendTable(rows);
    const header = table.getRow(0);
    for (var i=0;i<header.getNumCells();i++){
      header.getCell(i).editAsText().setBold(true);
    }
    body.appendParagraph('');
  });
  body.appendParagraph('自費總額：' + formatCurrencyValue(totalSelfPay));
  const consent = buildConsentSummary(form);
  if (consent && consent.signerText){
    body.appendParagraph('簽署人：' + consent.signerText);
  }
}

function applyPlanOtherNotesPage(body, form){
  ensurePageBreak(body);
  appendHeading(body, '附件三：其他備註', DocumentApp.ParagraphHeading.HEADING1);
  const text = (form && form.planOther ? String(form.planOther) : '').trim();
  if (!text){
    body.appendParagraph('（未填寫備註）');
    return;
  }
  text.split(/\r?\n/).forEach(function(line){
    body.appendParagraph(line);
  });
}

function aggregateServicePlanRows(entries){
  const aggregated = {};
  (entries || []).forEach(function(entry){
    if (!entry) return;
    var mode = (entry.vendorMode || '輪派').trim() || '輪派';
    var name = (entry.vendorName || '').trim();
    var key = mode + '||' + name;
    if (!aggregated[key]){
      aggregated[key] = { vendorMode: mode, vendorName: name, entries: [] };
    }
    aggregated[key].entries.push(entry);
  });
  const groups = Object.keys(aggregated).map(function(key){ return aggregated[key]; });
  groups.forEach(function(group){
    group.entries = group.entries.slice().sort(function(a,b){
      const ac = (a && a.code) ? a.code : '';
      const bc = (b && b.code) ? b.code : '';
      return ac.localeCompare(bc);
    });
  });
  groups.sort(function(a,b){
    const ac = (a.entries[0] && a.entries[0].code) ? a.entries[0].code : '';
    const bc = (b.entries[0] && b.entries[0].code) ? b.entries[0].code : '';
    return ac.localeCompare(bc);
  });
  return groups.map(function(group){
    var codes = [];
    var names = [];
    var amountParts = [];
    var usageParts = [];
    var selfPayParts = [];
    var totalSelfPay = 0;
    group.entries.forEach(function(entry){
      var code = entry && entry.code ? entry.code : '';
      var name = entry && entry.name ? entry.name : '';
      if (code) codes.push(code);
      if (name) names.push(name);
      var amount = formatPlanAmount(entry);
      if (amount){
        amountParts.push(code ? code + '：' + amount : amount);
      }
      var usage = formatPlanUsage(entry);
      if (usage){
        usageParts.push(code ? code + '：' + usage : usage);
      }
      var selfPay = formatPlanSelfPay(entry);
      if (selfPay){
        selfPayParts.push(code ? code + '：' + selfPay : selfPay);
      }
      totalSelfPay += computeEntrySelfPay(entry);
    });
    var amountText = amountParts.join('\n');
    var usageText = usageParts.join('\n');
    var selfPayText = '';
    if (totalSelfPay > 0){
      selfPayText = '合計 ' + formatCurrencyValue(totalSelfPay);
      if (selfPayParts.length){
        selfPayText += '\n' + selfPayParts.join('\n');
      }
    }else if (selfPayParts.length){
      selfPayText = selfPayParts.join('\n');
    }
    return {
      vendorMode: group.vendorMode || '輪派',
      vendorName: group.vendorName || '',
      codes: codes.join('、'),
      names: names.join('、'),
      amount: amountText,
      selfPay: selfPayText,
      usage: usageText,
      totalSelfPay: totalSelfPay
    };
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
    const groupId = PLAN_CATEGORY_LOOKUP[cat] || 'OTHER';
    if (!grouped[groupId]) grouped[groupId] = [];
    grouped[groupId].push(entry);
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

function planCategoryDisplay(id){
  const key = (id || '').toUpperCase();
  for (var i=0;i<PLAN_SUMMARY_GROUPS.length;i++){
    if (PLAN_SUMMARY_GROUPS[i].id === key){
      return PLAN_SUMMARY_GROUPS[i].label;
    }
  }
  return '其他服務';
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

function parsePlanNumber(value){
  if (value === undefined || value === null) return 0;
  const text = String(value).replace(/[^0-9\-\.]/g, '');
  const num = parseFloat(text);
  return isNaN(num) ? 0 : num;
}

function toCurrencyInt(value){
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!isFinite(num)) return 0;
  if (num >= 0) return Math.floor(num);
  return Math.ceil(num);
}

function computeEntrySelfPay(entry){
  if (!entry) return 0;
  if (entry.selfPayManual && entry.selfPayAmount){
    return Math.max(0, toCurrencyInt(parsePlanNumber(entry.selfPayAmount)));
  }
  if (isFiniteNumber(entry.autoTotalSelfPay)){
    return Math.max(0, toCurrencyInt(entry.autoTotalSelfPay));
  }
  return 0;
}

function formatCurrencyValue(value){
  if (!isFiniteNumber(value)) return '';
  return formatPointValue(value) + ' 元';
}

function formatPlanSelfPay(entry){
  if (!entry) return '';
  const manualValue = entry.selfPayAmount ? String(entry.selfPayAmount).trim() : '';
  const autoTotal = isFiniteNumber(entry.autoTotalSelfPay) ? toCurrencyInt(entry.autoTotalSelfPay) : null;
  if (entry.selfPayManual && manualValue){
    const manualInt = Math.max(0, toCurrencyInt(parsePlanNumber(manualValue)));
    let text = formatCurrencyValue(manualInt);
    if (autoTotal !== null && autoTotal !== manualInt){
      const pieces=[];
      if (isFiniteNumber(entry.autoWithinCapCopay)){
        const withinInt = toCurrencyInt(entry.autoWithinCapCopay);
        pieces.push('上限內 ' + formatCurrencyValue(withinInt));
      }
      if (isFiniteNumber(entry.autoExcessSelfPay)){
        const excessInt = toCurrencyInt(entry.autoExcessSelfPay);
        pieces.push('超額 ' + formatCurrencyValue(excessInt));
      }
      pieces.push('共 ' + formatCurrencyValue(autoTotal));
      text += '（系統估算：' + pieces.join('；') + '）';
    }
    return text;
  }
  if (autoTotal !== null){
    const segments=[];
    if (isFiniteNumber(entry.autoWithinCapCopay)){
      const withinInt = toCurrencyInt(entry.autoWithinCapCopay);
      segments.push('上限內 ' + formatCurrencyValue(withinInt));
    }
    if (isFiniteNumber(entry.autoExcessSelfPay)){
      const excessInt = toCurrencyInt(entry.autoExcessSelfPay);
      segments.push('超額 ' + formatCurrencyValue(excessInt));
    }
    segments.push('共 ' + formatCurrencyValue(autoTotal));
    return segments.join('；');
  }
  return '';
}

function collectConsentPartiesFromForm(form){
  const parties = [];
  if (form && Array.isArray(form.consentParties) && form.consentParties.length){
    form.consentParties.forEach(function(item){
      const role = item && item.role ? String(item.role).trim() : '';
      const name = item && item.name ? String(item.name).trim() : '';
      const source = item && item.source ? String(item.source).trim() : '';
      if (role || name){
        parties.push({ role: role, name: name, source: source || 'form' });
      }
    });
    if (parties.length) return parties;
  }
  const includePrimary = typeof form.includePrimary === 'undefined' ? true : !!form.includePrimary;
  const primaryRel = form && form.primaryCaregiverRel ? String(form.primaryCaregiverRel).trim() : '';
  const primaryName = form && form.primaryCaregiverName ? String(form.primaryCaregiverName).trim() : '';
  if (includePrimary && primaryRel){
    parties.push({ role: primaryRel, name: primaryName, source: 'primary' });
  }
  (Array.isArray(form && form.extras) ? form.extras : []).forEach(function(extra){
    const role = extra && extra.role ? String(extra.role).trim() : '';
    const name = extra && extra.name ? String(extra.name).trim() : '';
    if (role && name){
      parties.push({ role: role, name: name, source: 'extra' });
    }
  });
  if (!parties.length){
    const fallbackName = form && form.caseName ? String(form.caseName).trim() : '';
    parties.push({ role: '本人', name: fallbackName, source: 'fallback' });
  }
  return parties;
}

function formatConsentPartyForServer(part){
  if (!part) return '';
  const role = (part.role || '').trim();
  const name = (part.name || '').trim();
  if (!role && !name) return '';
  if (role === '本人'){
    return '本人';
  }
  if (part.source === 'primary'){
    const segments = [];
    if (role) segments.push(role);
    if (name) segments.push(name);
    return segments.length ? '主要照顧者（' + segments.join(' ') + '）' : '主要照顧者';
  }
  if (name){
    return role ? role + '（' + name + '）' : name;
  }
  return role;
}

function buildConsentSummary(form){
  const parties = collectConsentPartiesFromForm(form);
  const seen = {};
  const names = [];
  parties.forEach(function(part){
    const text = formatConsentPartyForServer(part);
    if (text && !seen[text]){
      seen[text] = true;
      names.push(text);
    }
  });
  if (!names.length){
    names.push('本人');
  }
  const joined = names.join('、');
  return {
    notifyText: joined,
    signerText: joined
  };
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
        lines.push(`預估耗用${formatPointValue(entry.autoPlanMonthlyUnits)}元`);
      }
      if (isFiniteNumber(entry.autoPlanRemainingCap)){
        lines.push(`預估餘額${formatPointValue(entry.autoPlanRemainingCap)}元`);
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
var CASE_MANAGER_CACHE = null;

function getCaseManagersByUnit(unitCode){
  const key = normalizeUnitPrefix(unitCode);
  if (!key) return [];
  const index = ensureCaseManagerIndex();
  const list = index[key];
  return list ? list.slice() : [];
}

function ensureCaseManagerIndex(){
  if (CASE_MANAGER_CACHE !== null) return CASE_MANAGER_CACHE;
  const built = buildCaseManagerIndex();
  if (built === null) return {};
  CASE_MANAGER_CACHE = built;
  return CASE_MANAGER_CACHE;
}

function buildCaseManagerIndex(){
  const index = {};
  try{
    const sheet = SpreadsheetApp.openById(MANAGERS_SHEET_ID).getSheetByName(MANAGERS_SHEET_NAME);
    if (!sheet) return index;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++){
      const row = values[i];
      const unit = normalizeUnitPrefix(row && row[1]);
      const name = row && row[7] ? String(row[7]).trim() : '';
      if (!unit || !name) continue;
      if (!index[unit]) index[unit] = [];
      index[unit].push(name);
    }
    Object.keys(index).forEach(function(unit){
      index[unit].sort();
    });
  }catch(err){
    return null;
  }
  return index;
}
/** ================ getConsultantsByUnit.gs ================
 * 依單位代碼（B 欄前四碼）→ 取B 欄姓名清單
 * ============================================ */
var CONSULTANT_CACHE = null;

function getConsultantsByUnit(unit){
  const key = normalizeUnitKey(unit);
  if (!key) return [];
  const index = ensureConsultantIndex();
  const list = index[key];
  return list ? list.slice() : [];
}

function ensureConsultantIndex(){
  if (CONSULTANT_CACHE !== null) return CONSULTANT_CACHE;
  const built = buildConsultantIndex();
  if (built === null) return {};
  CONSULTANT_CACHE = built;
  return CONSULTANT_CACHE;
}

function buildConsultantIndex(){
  const index = {};
  try{
    const ss = SpreadsheetApp.openById(CONSULTANTS_BOOK_ID);
    const sheet = ss.getSheetByName(CONSULTANTS_BOOK_NAME);
    if (!sheet) return index;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++){
      const row = values[i];
      const unit = normalizeUnitKey(row && row[0]);
      const status = row && row[2] ? String(row[2]).trim() : '';
      if (!unit || status !== '在職') continue;
      const name = row && row[1] ? String(row[1]).trim() : '';
      if (!name) continue;
      if (!index[unit]) index[unit] = [];
      index[unit].push(name);
    }
    Object.keys(index).forEach(function(unit){
      index[unit].sort();
    });
  }catch(err){
    return null;
  }
  return index;
}

function normalizeUnitPrefix(value){
  const text = normalizeUnitKey(value);
  return text ? text.substring(0, 4) : '';
}

function normalizeUnitKey(value){
  if (value === undefined || value === null) return '';
  return String(value).trim();
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
    transportRoundTrips: 2,
    levelDetails: {},
    copayRates: {},
    transportCategory: ''
  };

  const caps = getTaoyuanLtcTable('needLevelsCaps');
  caps.forEach(function(item){
    if (!item || item.needLevel === undefined) return;
    const levelKey = String(item.needLevel);
    const bcMonthlyCap = Number(item.bcMonthlyCap) || 0;
    catalog.needLevelCaps[levelKey] = bcMonthlyCap;
    catalog.levelDetails[levelKey] = {
      bcMonthlyCap: bcMonthlyCap,
      dCaps: {
        '1': Number(item.dCategory1Cap) || 0,
        '2': Number(item.dCategory2Cap) || 0,
        '3': Number(item.dCategory3Cap) || 0,
        '4': Number(item.dCategory4Cap) || 0
      },
      gAnnualCap: Number(item.gAnnualCap) || 0,
      efThreeYearCap: Number(item.efThreeYearCap) || 0
    };
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

  const copayRates = getTaoyuanLtcTable('copayRates');
  const copayMap = {};
  copayRates.forEach(function(item){
    if (!item) return;
    const bucket = (item.serviceBucket || '').trim();
    const status = (item.householdStatus || '').trim();
    const percent = Number(item.copayPercent);
    if (!bucket || !status || isNaN(percent)) return;
    if (!copayMap[bucket]) copayMap[bucket] = {};
    copayMap[bucket][status] = percent;
  });
  catalog.copayRates = copayMap;

  const transportCategories = getTaoyuanLtcTable('transportAllowanceCategories');
  const taoyuanCategory = transportCategories.find(function(item){
    return item && item.region === '桃園市';
  });
  if (taoyuanCategory && taoyuanCategory.category) {
    catalog.transportCategory = String(taoyuanCategory.category);
  }

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
