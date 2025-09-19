/** ============== PlanAttachments.gs =============
 * 處理附件頁面：計畫執行規劃與服務明細
 * ============================================== */

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
  const order = ['B','C','D','EF','G','SC','MEAL','OTHER'];
  order.forEach(function(cat){
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

function formatPlanAmount(entry){
  if (!entry) return '';
  const category = (entry.category || determineServiceCategoryCode(entry.code) || '').toUpperCase();
  const lines = [];
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
  const freq = entry.frequency || entry.autoFrequencyText;
  if (freq) lines.push(freq);
  if (entry.usage) lines.push(entry.usage);
  if (entry.extra) lines.push(entry.extra);
  return lines.join('\n');
}
