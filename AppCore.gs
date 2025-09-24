/** ============================================================
 * AppCore.gs (2025 重構版)
 *
 * - 建立側欄（Sidebar.html）
 * - 接收前端送來的資料物件並寫入 Google 文件
 * - 所有文件輸出函式均採用 (docBody, data) 簽章
 * ============================================================ */

function onOpen(){
  DocumentApp.getUi().createMenu('計畫助手')
    .addItem('開啟側欄','showSidebar')
    .addToUi();
}

function buildAppHtmlOutput(){
  return HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('AA01 長照計畫助手');
}

function showSidebar(){
  DocumentApp.getUi().showSidebar(buildAppHtmlOutput().setWidth(420));
}

function doGet(){
  return buildAppHtmlOutput();
}

const AA01_HEADINGS = Object.freeze([
  {
    id:'h1-basic', tag:'h1', label:'基本資訊', page:'basic',
    children:[
      { id:'h2-basic-unit-code', tag:'h2', label:'單位代碼', field:'basic.unitCode' },
      { id:'h2-basic-case-manager', tag:'h2', label:'個案管理師', field:'basic.caseManagerName' },
      { id:'h2-basic-case-name', tag:'h2', label:'個案姓名', field:'basic.caseName' },
      { id:'h2-basic-consultant-name', tag:'h2', label:'照專姓名', field:'basic.consultName' },
      { id:'h2-basic-cms-level', tag:'h2', label:'CMS 等級', field:'basic.cmsLevel' }
    ]
  },
  {
    id:'h1-goals', tag:'h1', label:'計畫目標', page:'goals',
    children:[
      {
        id:'h2-goals-call', tag:'h2', label:'一、電聯日期',
        children:[
          { id:'h3-goals-call-date', tag:'h3', label:'電聯日期', field:'contact.callDate' },
          { id:'h3-goals-call-consult', tag:'h3', label:'照顧專員約訪', field:'contact.isConsultVisit' }
        ]
      },
      {
        id:'h2-goals-homevisit', tag:'h2', label:'二、家訪日期',
        children:[
          { id:'h3-goals-homevisit-date', tag:'h3', label:'家訪日期', field:'contact.visitDate' },
          { id:'h3-goals-prep-date', tag:'h3', label:'出院日期', field:'contact.dischargeDate' }
        ]
      },
      {
        id:'h2-goals-companions', tag:'h2', label:'三、偕同訪視者', field:'participants'
      },
      {
        id:'h2-goals-overview', tag:'h2', label:'四、個案概況',
        children:[
          { id:'h3-goals-s1', tag:'h3', label:'（一）身心概況', field:'overview.section1' },
          { id:'h3-goals-s2', tag:'h3', label:'（二）經濟收入', field:'overview.section2.summary' },
          { id:'h3-goals-s3', tag:'h3', label:'（三）居住環境', field:'overview.section3.summary' },
          { id:'h3-goals-s4', tag:'h3', label:'（四）社會支持', field:'overview.section4.summary' },
          { id:'h3-goals-s5', tag:'h3', label:'（五）其他', field:'overview.section5.summary' },
          { id:'h3-goals-s6', tag:'h3', label:'（六）複評評值', field:'overview.section6' }
        ]
      },
      {
        id:'h2-goals-targets', tag:'h2', label:'五、照顧目標',
        children:[
          { id:'h3-goals-targets-problems', tag:'h3', label:'（一）照顧問題', field:'goals.problems' },
          { id:'h3-goals-targets-short', tag:'h3', label:'（二）短期目標（0–3 個月）', field:'goals.short.summary' },
          { id:'h3-goals-targets-mid', tag:'h3', label:'（三）中期目標（3–4 個月）', field:'goals.mid.summary' },
          { id:'h3-goals-targets-long', tag:'h3', label:'（四）長期目標（4–6 個月）', field:'goals.long.summary' }
        ]
      },
      {
        id:'h2-goals-mismatch', tag:'h2', label:'六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃',
        children:[
          { id:'h3-goals-mismatch-1', tag:'h3', label:'（一）目標達成的狀況以及未達成的差距', field:'goals.previewText' },
          { id:'h3-goals-mismatch-2', tag:'h3', label:'（二）資源的變動情形', field:'plan.referral.summary' },
          { id:'h3-goals-mismatch-3', tag:'h3', label:'（三）未使用的替代方案或是可能的影響', field:'plan.emergencyNote' }
        ]
      }
    ]
  },
  {
    id:'h1-exec', tag:'h1', label:'計畫執行規劃', page:'execution',
    children:[
      { id:'h2-exec-services', tag:'h2', label:'一、長照服務核定項目、頻率', field:'plan.services' },
      { id:'h2-exec-referral', tag:'h2', label:'二、轉介其他服務資源', field:'plan.referral.summary' },
      { id:'h2-exec-emergency-note', tag:'h2', label:'四、緊急救援服務說明', field:'plan.emergencyNote' }
    ]
  },
  {
    id:'h1-notes', tag:'h1', label:'其他備註', page:'notes',
    children:[
      { id:'h2-notes-other', tag:'h2', label:'其他（個案特殊狀況或其他未盡事宜可備註於此）', field:'notes.other' }
    ]
  }
]);

const AA01_PROBLEM_LABELS = Object.freeze({
  mobility:'行動受限',
  nutrition:'營養不良',
  cognition:'認知障礙',
  caregiver:'照顧者負荷',
  others:'其他'
});

function sanitizeFilePart(part){
  if(!part) return '';
  return String(part)
    .trim()
    .replace(/[\\/:*?"<>|]/g,'')
    .replace(/\s+/g,'');
}

function buildDocumentNaming(data){
  var basic = data && data.basic ? data.basic : {};
  var contact = data && data.contact ? data.contact : {};
  var casePart = sanitizeFilePart(basic.caseName) || '未填個案';
  var managerPart = sanitizeFilePart(basic.caseManagerName) || '未填個管師';
  var datePart = contact.visitDate ? String(contact.visitDate).replace(/-/g,'') : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  var baseName = 'FNA1_' + datePart + '_' + casePart + '_' + managerPart;
  return { baseName: baseName, fileName: baseName, version:'v1' };
}

function createDocumentFromTemplate(fileName){
  var folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  var templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  var copy = templateFile.makeCopy(fileName, folder);
  var docId = copy.getId();
  var doc = DocumentApp.openById(docId);
  return { docId: docId, doc: doc, body: doc.getBody() };
}

function applyAndSaveAA01(data){
  var naming = buildDocumentNaming(data);
  var context = createDocumentFromTemplate(naming.fileName);
  writeAA01Plan(context.body, data || {});
  context.doc.saveAndClose();
  return {
    message:'已產出並儲存',
    file:{ id: context.docId, url: context.doc.getUrl(), name: naming.fileName }
  };
}

function writeAA01Plan(body, data){
  if(!body) throw new Error('缺少文件 Body 物件');
  body.clear();
  AA01_HEADINGS.forEach(function(section){
    appendHeadingNode(body, section, data || {});
  });
}

function appendHeadingNode(body, node, data){
  var paragraph = body.appendParagraph(node.label);
  paragraph.setHeading(resolveHeading(node.tag));
  var renderer = HEADING_RENDERERS[node.id];
  if(typeof renderer === 'function'){
    renderer(body, data, node);
  }else if(node.field && (!node.children || !node.children.length)){
    appendFieldValue(body, node.field, data);
  }
  if(Array.isArray(node.children)){
    node.children.forEach(function(child){ appendHeadingNode(body, child, data); });
  }
}

function resolveHeading(tag){
  switch(tag){
    case 'h1': return DocumentApp.ParagraphHeading.HEADING1;
    case 'h2': return DocumentApp.ParagraphHeading.HEADING2;
    case 'h3': return DocumentApp.ParagraphHeading.HEADING3;
    case 'h4': return DocumentApp.ParagraphHeading.HEADING4;
    default: return DocumentApp.ParagraphHeading.NORMAL;
  }
}

function appendFieldValue(body, path, data){
  var value = resolvePath(data, path);
  var text = formatValue(value);
  appendParagraph(body, text);
}

function resolvePath(obj, path){
  if(!obj) return null;
  var parts = String(path || '').split('.');
  var node = obj;
  for(var i=0; i<parts.length; i++){
    if(node === null || typeof node === 'undefined') return null;
    node = node[parts[i]];
  }
  return node;
}

function formatValue(value){
  if(value === null || typeof value === 'undefined') return '';
  if(Array.isArray(value)){
    return value.map(function(item){ return formatValue(item); }).filter(Boolean).join('、');
  }
  if(value instanceof Date){
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  }
  if(typeof value === 'object'){
    if(typeof value.summary === 'string'){
      return value.summary;
    }
    if(typeof value.before === 'string' || typeof value.after === 'string'){
      var lines = [];
      if(value.before) lines.push('介入前：' + value.before);
      if(value.after) lines.push('介入後：' + value.after);
      return lines.join('\n');
    }
    if(typeof value.rel === 'string' || typeof value.name === 'string'){
      return [value.rel, value.name].filter(Boolean).join('／');
    }
    return JSON.stringify(value);
  }
  if(typeof value === 'boolean'){
    return value ? '是' : '否';
  }
  return String(value);
}

function appendParagraph(body, text){
  if(!text) return;
  String(text).split(/\n+/).forEach(function(line){
    var trimmed = line.trim();
    if(trimmed){
      body.appendParagraph(trimmed);
    }
  });
}

function appendList(body, items){
  if(!Array.isArray(items)) return;
  items.filter(function(item){ return item && String(item).trim(); }).forEach(function(item){
    var listItem = body.appendListItem(String(item));
    listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
  });
}

function renderDateParagraph(path){
  return function(body, data){
    var value = resolvePath(data, path);
    if(!value) return;
    var text = formatDateString(value);
    appendParagraph(body, text);
  };
}

function formatDateString(ymd){
  if(!ymd) return '';
  var text = String(ymd);
  if(/\d{4}-\d{2}-\d{2}/.test(text)){
    var parts = text.split('-');
    return parts[0] + '年' + Number(parts[1]) + '月' + Number(parts[2]) + '日';
  }
  return text;
}

function renderParticipants(body, data){
  var participants = data && data.participants ? data.participants : {};
  var primary = participants.primary || {};
  var extras = Array.isArray(participants.extras) ? participants.extras : [];
  var lines = [];
  if(primary.rel || primary.name){
    lines.push('主要參與者：' + [primary.rel, primary.name].filter(Boolean).join('／'));
  }
  if(extras.length){
    var extrasText = extras.map(function(entry){ return [entry.rel, entry.name].filter(Boolean).join('／'); }).filter(Boolean).join('、');
    lines.push('其他參與者：' + extrasText);
  }
  if(!lines.length){
    lines.push('未提供參與者資訊。');
  }
  appendParagraph(body, lines.join('\n'));
}

function renderSection1(body, data){
  var section = resolvePath(data, 'overview.section1') || {};
  appendParagraph(body, section.summary || '');
  var details = [];
  if(section.urineNight) details.push('夜間排尿：' + section.urineNight);
  if(typeof section.nocturiaCount === 'number') details.push('夜尿次數：' + section.nocturiaCount + ' 次');
  if(Array.isArray(section.excretionAids) && section.excretionAids.length) details.push('排泄輔具：' + section.excretionAids.join('、'));
  if(section.swallow) details.push('吞嚥狀態：' + section.swallow);
  if(Array.isArray(section.dietTexture) && section.dietTexture.length) details.push('飲食質地：' + section.dietTexture.join('、'));
  if(Array.isArray(section.feedingTubes) && section.feedingTubes.length) details.push('管灌方式：' + section.feedingTubes.join('、'));
  if(section.transfer) details.push('起身移位能力：' + section.transfer);
  if(section.walkIndoor) details.push('室內行走：' + section.walkIndoor);
  appendList(body, details);
}

function renderSection6(body, data){
  var section = resolvePath(data, 'overview.section6') || {};
  if(section.before) appendParagraph(body, '介入前評估：' + section.before);
  if(section.after) appendParagraph(body, '介入後評估：' + section.after);
}

function renderProblems(body, data){
  var problems = resolvePath(data, 'goals.problems');
  if(!Array.isArray(problems) || !problems.length){
    appendParagraph(body, '未勾選照顧問題。');
    return;
  }
  var labels = problems.map(function(code){ return AA01_PROBLEM_LABELS[code] || String(code); });
  appendList(body, labels);
}

function renderServices(body, data){
  var services = resolvePath(data, 'plan.services');
  if(!Array.isArray(services) || !services.length){
    appendParagraph(body, '無服務項目。');
    return;
  }
  var table = body.appendTable([['代碼','提供者','頻率','單次量','部分負擔']]);
  services.forEach(function(service){
    var row = table.appendTableRow();
    row.appendTableCell(service.code || '');
    row.appendTableCell(service.provider || '');
    row.appendTableCell(service.freq || '');
    row.appendTableCell(service.qty || '');
    row.appendTableCell(service.copay || '');
  });
  var header = table.getRow(0);
  for(var i=0; i<header.getNumCells(); i++){
    header.getCell(i).getChild(0).asParagraph().setBold(true);
  }
}

function renderSimpleField(path){
  return function(body, data){ appendFieldValue(body, path, data); };
}

const HEADING_RENDERERS = Object.freeze({
  'h2-basic-unit-code': renderSimpleField('basic.unitCode'),
  'h2-basic-case-manager': renderSimpleField('basic.caseManagerName'),
  'h2-basic-case-name': renderSimpleField('basic.caseName'),
  'h2-basic-consultant-name': renderSimpleField('basic.consultName'),
  'h2-basic-cms-level': renderSimpleField('basic.cmsLevel'),
  'h3-goals-call-date': renderDateParagraph('contact.callDate'),
  'h3-goals-call-consult': function(body, data){
    var flag = resolvePath(data, 'contact.isConsultVisit');
    if(flag === null || typeof flag === 'undefined') return;
    appendParagraph(body, flag ? '本次訪視由照顧專員陪同。' : '本次訪視非照顧專員約訪。');
  },
  'h3-goals-homevisit-date': renderDateParagraph('contact.visitDate'),
  'h3-goals-prep-date': renderDateParagraph('contact.dischargeDate'),
  'h2-goals-companions': renderParticipants,
  'h3-goals-s1': renderSection1,
  'h3-goals-s2': renderSimpleField('overview.section2.summary'),
  'h3-goals-s3': renderSimpleField('overview.section3.summary'),
  'h3-goals-s4': renderSimpleField('overview.section4.summary'),
  'h3-goals-s5': renderSimpleField('overview.section5.summary'),
  'h3-goals-s6': renderSection6,
  'h3-goals-targets-problems': renderProblems,
  'h3-goals-targets-short': renderSimpleField('goals.short.summary'),
  'h3-goals-targets-mid': renderSimpleField('goals.mid.summary'),
  'h3-goals-targets-long': renderSimpleField('goals.long.summary'),
  'h3-goals-mismatch-1': renderSimpleField('goals.previewText'),
  'h3-goals-mismatch-2': renderSimpleField('plan.referral.summary'),
  'h3-goals-mismatch-3': renderSimpleField('plan.emergencyNote'),
  'h2-exec-services': renderServices,
  'h2-exec-referral': renderSimpleField('plan.referral.summary'),
  'h2-exec-emergency-note': renderSimpleField('plan.emergencyNote'),
  'h2-notes-other': renderSimpleField('notes.other')
});
