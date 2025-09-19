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
