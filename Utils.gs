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
