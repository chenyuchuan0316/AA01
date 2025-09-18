/** ============== FilesVersion.gs =============
 * 公版→複製新檔；個案檔→同檔升版＆改名
 * ============================================ */

/** 依資料夾既有檔名計算下一版號：baseName_Vn → n+1 */
function computeNextVersion(baseName){
  const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const it = folder.getFiles();
  let maxV = 0;
  const re = new RegExp('^'+escapeRegExp(baseName)+'_V(\\d+)$');
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
