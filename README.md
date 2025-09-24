# AA01 計畫助手（2025 版）

> 更新日期：2025-09-24

AA01 是一套專為 Google Docs 計畫書撰寫流程打造的 Google Apps Script 專案。本版本全面改寫前端與後端架構，採用單一 Heading 規格、單一命名空間與純資料契約，確保表單、文件輸出與後端流程一致且可預期。

## 系統架構總覽

| 模組 | 職責 |
| ---- | ---- |
| `Sidebar.html` | 使用原生 ES5/ES6 建構側欄介面。所有 UI 行為（導覽、驗證、儲存、送出）統一收斂在全域命名空間 `AA01`。 |
| `AppCore.gs` | Google Docs 端入口，負責顯示側欄、接收前端的純資料物件並呼叫 `writeAA01Plan(body, data)` 寫入文件。 |
| `DataStore.gs` | 存放模板文件與輸出資料夾 ID 等設定值，可視需求新增資料查詢函式。 |

### 核心設計亮點

- **單一資訊架構來源**：`AA01.HEADINGS` 與 `AA01_HEADINGS` 完全同步，導覽、進度、文件輸出皆由此樹狀結構產生。
- **AA01 命名空間**：前端所有函式（收集資料、驗證、排程、儲存、送出）皆掛載在 `AA01` 底下，避免全域污染並方便維護。
- **批次排程**：`AA01.batchFrame(key, fn)` 以 `requestAnimationFrame` 實作單一節流器，集中處理畫面重繪、進度計算與自動儲存。
- **資料/呈現分離**：`AA01.collect(rootEl)` 回傳最小化資料物件；`AA01.validate(data)` 為純函式，回傳 `{ ok, focusFieldId, errors[] }`。送出流程僅傳遞資料，不直接讀寫 DOM。
- **統一錯誤匯流**：所有驗證與規則警示會集中於 Toast 與摘要區，並提供「跳至欄位」的快速導覽。

## 快速開始

1. 於 Google Docs 中開啟 `Extensions → Apps Script`，將 `AppCore.gs`、`DataStore.gs`、`Sidebar.html` 內容貼上。
2. 在 `DataStore.gs` 設定 `TEMPLATE_DOC_ID` 與 `OUTPUT_FOLDER_ID`。若有名單、給付資料，請確認試算表已分享給執行帳號。
3. 回到文件，從功能表「計畫助手 → 開啟側欄」，授權腳本並輸入測試資料，驗證能成功產出文件。

## 表單資料 Schema

前端送往後端的資料物件包含下列區塊（可擴充但勿更名）：

```javascript
{
  basic: { unitCode, caseManagerName, caseName, consultName, cmsLevel },
  contact: { callDate, visitDate, dischargeDate, isConsultVisit },
  participants: { primary:{ rel, name }, extras:[{ rel, name }] },
  overview: {
    section1:{ summary, urineNight, nocturiaCount, excretionAids[], swallow, dietTexture[], feedingTubes[], transfer, walkIndoor },
    section2:{ summary }, section3:{ summary }, section4:{ summary }, section5:{ summary },
    section6:{ before, after }
  },
  goals:{ problems[], short:{ summary }, mid:{ summary }, long:{ summary }, previewText },
  plan:{ services:[{ code, provider, freq, qty, copay }], referral:{ summary }, emergencyNote },
  notes:{ other },
  meta:{ lastSaved, version }
}
```

### 前端驗證規則

`AA01.validate(data)` 會驗證必填欄位並套用下列情境規則：

- 勾選「夜間集尿袋」時，夜間排尿欄位須留空、夜尿次數須為 0。
- 夜尿次數大於 0 時，不可選擇「夜間未起夜」。
- 吞嚥為「明顯困難／危險（需專評）」時，會移除「一般」飲食質地。
- 吞嚥「無困難」且仍勾選管灌方式，提示確認。
- 起身移位為「重度協助／完全依賴」時，室內行走不可標示為可獨立行走狀態。

所有錯誤會統一顯示於錯誤摘要與 Toast，並提供跳轉至第一個錯誤欄位的按鈕。

### 草稿與鍵盤操作

- `AA01.persist.save/load` 利用 `localStorage` 儲存草稿，重新開啟側欄後會自動還原。
- 內建快捷鍵：`Ctrl/Cmd + S` 儲存草稿、`Alt + Shift + N` 下一步、`Alt + Shift + P` 上一步。

## 文件輸出流程

- `applyAndSaveAA01(data)`：由側欄送出的純資料物件進入 GAS 後端。函式會依命名規則複製模板文件，呼叫 `writeAA01Plan(body, data)` 寫入內容，最後回傳新檔資訊。
- `writeAA01Plan(body, data)`：清空文件後，依 `AA01_HEADINGS` 遞迴建立段落。各節點由 `HEADING_RENDERERS` 決定如何轉換資料，確保輸出格式與前端欄位一致。
- 服務項目以表格呈現；照顧問題、身心概況等欄位會自動組成條列或段落文字。

## 測試建議

1. **表單驗證**：嘗試觸發所有規則，確認錯誤摘要與跳轉行為正常。
2. **草稿還原**：輸入資料後關閉側欄再重新開啟，檢查草稿是否自動載入並顯示「已自動儲存於 HH:mm」。
3. **文件輸出一致性**：以相同資料物件，分別從 UI 與 Apps Script IDE (`applyAndSaveAA01`) 執行，確認輸出文件一致。
4. **鍵盤操作**：驗證快捷鍵在桌機、筆電與行動裝置外接鍵盤下皆可運作。

## 常見問題

| 狀況 | 建議處理 |
| ---- | -------- |
| 側欄顯示空白 | 確認 `HtmlService` 已授權，或重新部署 Apps Script 專案。 |
| 草稿無法儲存 | 瀏覽器可能封鎖 `localStorage`，請確認隱私設定或改用一般模式。 |
| 送出無反應 | 於開發者工具檢查 Console，確認是否因權限或 GAS 錯誤而中斷。 |

## 授權與資料保護

- 僅授權必要帳號存取模板文件與輸出資料夾，並定期檢視 Apps Script 權限。
- 測試與示範請使用匿名化資料，避免真實個資外洩。

感謝協助維護 AA01，若需新增欄位或調整流程，請同步更新 `AA01_HEADINGS` 與 README，以維持前後端對齊。 
