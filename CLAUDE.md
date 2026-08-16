# CLAUDE

這份文件供 Claude Code 與 Codex 共用。

## 專案資訊

- 專案名稱：Trainingpeak運動記錄分析
- 專案目標：追蹤運動成效與達成 **IM226 Sub-11 完賽目標藍圖** (總目標 **10:54:00**：游泳 1h12m | T1 6m | 單車 5h30m / 140W-145W | T2 6m | 全馬 4h00m / 5:41km)
- 賽事階層定位：
  1. **2026 賽事 B (前哨實戰檢驗 / Tune-up & Test Race)**：2026 年 11 月 **IRONMAN 70.3 墾丁 (Kenting 70.3)** (`https://www.ironman.com/races/im703-kenting/course`)
  2. **2026 主要賽事 A (Main Target Race A)**：2026 年 11 月 **IRONMAN 馬來西亞蘭卡威 (Langkawi 226km)**
  3. **2027 主要賽事 (Ultimate Main Target Race)**：2027 年 **IRONMAN 澎湖 (Penghu 226km)** (`https://www.ironman.com/races/im-penghu/course#swim`)
- 主要資料來源：TrainingPeaks
- 使用者：自己研究用

## 核心規則

- 保留原始資料，不覆蓋原檔
- 分析流程要可重現
- 優先使用中文
- 避免前視偏誤
- 若要使用網路資料，需在輸出中註明來源與時間
- 若有中介資料，應與 raw 資料分開保存

## 公式與文件格式

- Word 文件使用 Office Math / OMML
- Markdown 文件可使用 LaTeX
- 若需跨格式輸出，維持相同數學定義與符號

## 協作規則

- 每次任務後更新 `PROJECT_STATUS.md`
- 新增、刪除、改名檔案時更新 `README.md`
- 若流程、工具、資料來源、輸出格式、公式格式或 agent 規則有變更，更新 `AGENTS.md` 與 `CLAUDE.md`

## 初版建議流程

1. 先確認 TrainingPeaks 資料取得方式
2. 建立原始資料與處理後資料分層
3. 先做週期性統計，再做成效分析
4. 再建立 IM226 完賽預估模型
5. 最後輸出報告、圖表與可重現程式

## 已確認事項與現行做法

- **TrainingPeaks 資料取得**：已採用自動擷取 (經由 Webcal iCal 串流串接，使用穩定鍵名 `YYYY-MM-DD_{type}_{idx}` 原地更新與去重，徹底避免重複數據)
- **自動化排程**：每週一 9:00 AM (TP_Monday_Schedule_Fetch) 下載課表預測、肌力計畫與鐵人新知中譯；每週日 8:00 PM (TP_Sunday_Execution_Report) 產出當週執行率回顧報告；每日 8:00 PM (TP_Daily_8PM_Update) 執行即時同步與資料庫稽核。
- **雙 Agent 互相監督機制 (Antigravity & Codex)**：
  - 每次數據更新後（包含 Codex 背景排程與 Antigravity 手動更新），系統自動執行 `verify_cache_integrity()` 資料庫完整性稽核。
  - 自動比對當週里程與 4 週滾動週均量，確保數據無重複加總或異常膨脹。
  - Antigravity 與 Codex 雙向監督，每次變更皆留下 Log 與記錄供交叉核對。
- **最終成果格式**：定案以 Markdown 報告（供快速瀏覽）與 Word 檔案（供正式存檔與列印）雙重格式輸出。

## 待確認事項

- 是否需要建立 `skills/` 與專案專用 `SKILL.md`

