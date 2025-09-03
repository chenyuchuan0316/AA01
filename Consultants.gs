/* ===== 照專名單：依單位代碼取得在職照專姓名 ===== */
function getConsultantsByUnit(unit) {
  if (!unit) return [];
  const ss = SpreadsheetApp.openById(CONSULTANTS_BOOK_ID);
  const sheet = ss.getSheetByName(CONSULTANTS_BOOK_NAME);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const names = [];
  for (let i = 1; i < rows.length; i++) {
    const [unitCode, name, status] = rows[i];
    if (unitCode === unit && status === '在職') {
      names.push(name);
    }
  }
  return names;
}
