/** ============== H1_CareGoals.gs =============
 * 五、照顧目標：
 * - 問題清單（至多 5 項）
 * - 短／中期目標依照服務分類輸出多行
 * - 長期目標直接寫入前端彙整文字
 * ============================================ */

const PROBLEM_DICT = {
  1:'進食問題',2:'洗澡問題',3:'個人修飾問題',4:'穿脫衣物問題',5:'大小便控制問題',
  6:'上廁所問題',7:'移位問題',8:'走路問題',9:'上下樓梯問題',10:'使用電話問題',
  11:'購物或外出問題',12:'備餐問題',13:'處理家務問題',14:'用藥問題',15:'處理財務問題',
  16:'溝通問題',17:'短期記憶障礙',18:'疼痛問題',19:'不動症候群風險',20:'皮膚照護問題',
  21:'傷口問題',22:'水份及營養問題',23:'吞嚥問題',24:'管路照顧問題',25:'其他醫療照護問題',
  26:'跌倒風險',27:'安全疑慮',28:'居住環境障礙',29:'社會參與需協助',30:'困擾行為',
  31:'照顧負荷過重',32:'輔具使用問題',33:'感染問題',34:'其他問題'
};

const PROBLEM_HEADING_VARIANTS = (function(){
  const bases = ['(一)照顧問題','(一) 照顧問題','（一）照顧問題','（一） 照顧問題'];
  const marks = ['：',':'];
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

const GOAL_CATEGORY_FIELDS = Object.freeze([
  { suffix: 'care', label: '照顧服務' },
  { suffix: 'prof', label: '專業服務' },
  { suffix: 'car',  label: '交通車服務' },
  { suffix: 'resp', label: '喘息服務' },
  { suffix: 'access', label: '無障礙及輔具' },
  { suffix: 'meal', label: '營養送餐' }
]);

const GOAL_TIERS = Object.freeze([
  { prefix: 'short', headings: ['(二)短期目標','(二) 短期目標'] },
  { prefix: 'mid', headings: ['(三)中期目標','(三) 中期目標'] }
]);

const LONG_GOAL_HEADINGS = Object.freeze(['(四)長期目標','(四) 長期目標']);

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

function applyH1_CareGoals(body, form){
  applyCareProblems(body, form);
  GOAL_TIERS.forEach(function(tier){ applyGoalTier(body, form, tier); });
  applyLongGoal(body, form);
}

function applyCareProblems(body, form){
  const rawKeys = normalizeProblemKeys(form && form.problemKeys);
  const uniqueKeys = [];
  const seen = {};
  for (let i = 0; i < rawKeys.length; i++){
    const key = rawKeys[i];
    if (PROBLEM_DICT[key] && !seen[key]) {
      seen[key] = true;
      uniqueKeys.push(key);
      if (uniqueKeys.length >= 5) break;
    }
  }
  const items = uniqueKeys.map(function(k){ return k + '.' + PROBLEM_DICT[k]; }).join('、');
  const titleLine = items ? '(' + items + ')' : '';
  replaceAfterHeadingColon(body, PROBLEM_HEADING_VARIANTS, titleLine);

  const note = getTrimmed(form, 'problemNote');
  if (note) {
    upsertSingleLineUnderHeading(body, PROBLEM_HEADING_VARIANTS, '補充說明：' + note);
  }
}

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

function applyLongGoal(body, form){
  const text = getTrimmed(form, 'long_goal');
  upsertContentUnderHeading(body, LONG_GOAL_HEADINGS, text);
}
