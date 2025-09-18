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
