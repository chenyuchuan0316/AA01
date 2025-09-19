/** ============== H1_CareGoals.gs =============
 * 五、照顧目標：
 * - (一) 照顧問題（最多 5 項）→ 直寫在標題行冒號後，補「補充說明」行
 * - (二)(三) 短/中期：四格（照顧／專業／交通車／喘息）— 留白不寫
 * - (四) 長期：僅彙整已填之短/中期欄位
 * ============================================ */

/** ===== H1_CareGoals.gs ===== */

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
  prefixes.forEach(prefix => {
    bases.forEach(base => {
      marks.forEach(mark => {
        if (!prefix) {
          variants.push(base + mark);
        } else {
          joiners.forEach(joiner => {
            variants.push(`${prefix}${joiner}${base}${mark}`);
          });
        }
      });
    });
  });
  return Array.from(new Set(variants));
})();

function normalizeProblemKeys(raw){
  if (raw === undefined || raw === null) return [];
  let arr;
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
  applyH1_CG_Problems(body, form);
  applyH1_CG_ShortMid(body, form);
  applyH1_CG_Long(body, form);
}

/** (一) 照顧問題＋補充說明 */
function applyH1_CG_Problems(body, form){
  const rawKeys = normalizeProblemKeys(form && form.problemKeys);
  const uniqueKeys = [];
  const seen = {};
  for (let i=0;i<rawKeys.length;i++){
    const key = rawKeys[i];
    if (PROBLEM_DICT[key] && !seen[key]) {
      seen[key] = true;
      uniqueKeys.push(key);
      if (uniqueKeys.length >= 5) break;
    }
  }
  const items = uniqueKeys.map(k => `${k}.${PROBLEM_DICT[k]}`).join('、');
  const titleLine = items ? `(${items})` : '';
  replaceAfterHeadingColon(body, PROBLEM_HEADING_VARIANTS, titleLine);
  const note = (form && form.problemNote ? form.problemNote : '').trim();
  if (note) {
    upsertSingleLineUnderHeading(body, PROBLEM_HEADING_VARIANTS, `補充說明：${note}`);
  }
}

/** (二)(三) 短/中期四格：有值才輸出各行 */
function applyH1_CG_ShortMid(body, form){
  const short = [
    ['照顧服務', form.short_care],
    ['專業服務', form.short_prof],
    ['交通車服務', form.short_car],
    ['喘息服務', form.short_resp],
    ['無障礙及輔具', form.short_access],
    ['營養送餐', form.short_meal]
  ].filter(x=> (x[1]||'').trim()).map(x=> `${x[0]}：${x[1].trim()}`);

  const mid = [
    ['照顧服務', form.mid_care],
    ['專業服務', form.mid_prof],
    ['交通車服務', form.mid_car],
    ['喘息服務', form.mid_resp],
    ['無障礙及輔具', form.mid_access],
    ['營養送餐', form.mid_meal]
  ].filter(x=> (x[1]||'').trim()).map(x=> `${x[0]}：${x[1].trim()}`);

  if (short.length){
    upsertContentUnderHeading(body, ['(二)短期目標','(二) 短期目標'], short.join('\n'));
  }
  if (mid.length){
    upsertContentUnderHeading(body, ['(三)中期目標','(三) 中期目標'], mid.join('\n'));
  }
}

/** (四) 長期目標（直接寫入前端彙整後之文字） */
function applyH1_CG_Long(body, form){
  const text = (form.long_goal || '').trim();
  upsertContentUnderHeading(body, ['(四)長期目標','(四) 長期目標'], text);
}

