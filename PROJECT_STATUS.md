# PROJECT_STATUS

專案名稱：Trainingpeak運動記錄分析

專案目標：
- 追蹤運動成效
- 預估 IM226 完賽成績

目前狀態：
- 已建立專案初版文件
- 已確認主要資料來源為 TrainingPeaks
- 已知主要工作環境以中文內容為主，且需要保留原始資料
- 已產生七月肌力課表 Word 檔 `2026_07_strength_schedule.docx`
- 已完成結構檢查；視覺渲染驗證因本機缺少 LibreOffice/soffice 而無法執行

已採用的初版假設：
- 以個人研究用途為主，不先考慮對外發布版面
- 以可重現為核心，分析流程、輸入資料與輸出結果都要可追蹤
- 優先保留原始資料，不覆蓋、不改寫原始檔
- 若產生中介檔，應放在獨立輸出資料夾，並清楚標示來源與生成時間
- 若需要 Word 文件，數學方程式優先使用 Office Math / OMML
- Markdown 版內容可使用 LaTeX

輸出規劃：
- 表格
- 圖
- 報告
- 模型
- 網站
- 程式
- 論文結果

工具規劃：
- Python
- R
- Excel
- LaTeX
- Markdown
- Jupyter
- Word
- PPT
- Office Math OMML
- 其他必要工具

待確認事項：
- IM226 完賽預估的目標格式，是單一時間點、區間，還是含保守/中性/樂觀三版本
- 最終輸出要偏向研究筆記、正式報告，還是分析儀表板
- 是否需要建立 `skills/` 與自訂 `SKILL.md` 供後續重複使用

最近一次更新：
- 2026-07-06
- 2026-07-06 已成功為使用者排程每週一早上 9:00 自動執行分析與肌力合併任務。
- 2026-07-06 已完成上週（W27）執行率分析與本週（W28）肌力課表 Word 檔合併產出。
- 2026-07-06 已將 IM226 Sub-11 完賽目標拆解、配速與補給策略（引用自 220 Triathlon）無縫整合進 W28 課表與自動化腳本中。
- 2026-07-06 新增 `scripts/fetch_weekly_articles.py`，能自動抓取 Slowtwitch, Triathlete, 220 Triathlon, TrainingPeaks Blog, Joe Friel Blog 五個權威網站的當週新文章並按運動項目及補給進行分類。
- 2026-07-06 修改 `scripts/run_weekly_strength.ps1`，使排程任務在每週一自動產出當週肌力計畫之餘，亦一併生成當週鐵人新知與文章整理報告。
- 2026-07-06 成功執行並產生首份當週文章彙整報告，同時提供 `outputs/weekly/2026-W28_當週鐵人新知與文章整理.md` 與 `outputs/weekly/2026-W28_當週鐵人新知與文章整理.docx` (Word 檔)。
- 2026-07-15
- 2026-07-15 已重構排程設定，分割為兩項 Windows 工作排程任務：
  1. `TP_Monday_Schedule_Fetch`：每週一早上 9:00 自動執行，下載當週 TP 課表預測、產生當週肌力計畫，並抓取且自動翻譯鐵人新知。
  2. `TP_Sunday_Execution_Report`：每週日晚上 8:00 自動執行，同步最終實際訓練數據，產出當週執行率回顧報告。
- 2026-07-15 修復 `sync_calendar.py` 由於 TrainingPeaks Webcal UID 不穩定所導致的行事曆事件重複加載及數據加總錯誤 bug。現已改用基於日期、類型與計畫數據之複合穩定 Key (`stable_id`)，數據執行率回復 100% 正確。
- 2026-07-15 於 `fetch_weekly_articles.py` 中整合 Google 翻譯 API，當週鐵人新知現已支援自動產出繁體中文版 Markdown 與 Word 文件 (`_中文版.md` 及 `_中文版.docx`)。
- 2026-07-15 完成當週（W29）肌力整合計畫及鐵人新知中文翻譯，並成功產生首份當週執行率回顧報告 (`2026-W29_當週執行率回顧報告.docx`)。
- 2026-07-20
- 2026-07-20 順利完成第 30 週 (W30) 自動化排程任務 `TP_Monday_Schedule_Fetch`，已成功生成當週肌力訓練計畫 (`2026-W30_當週肌力訓練計畫.docx`) 及鐵人新知雙語整理報告 (`2026-W30_當週鐵人新知與文章整理_中文版.md` 與 `.docx`)。
- 2026-07-20 依據 220 Triathlon 訓練體系與 Nik Cook 教練指南，成功彙整並產出完整《12 週全距離鐵人三項訓練課表》(`outputs/12_week_ironman_full_training_plan.md` 及 `.docx`) 及細分至 84 天之《每日詳細訓練課表》(`outputs/12_week_ironman_daily_training_plan.md` 及 `.docx`)。
- 2026-07-20 針對使用者現行 **FTP = 205 W** 進行全課表單車瓦數量化更新，算出 Zone 1~5 精確瓦數（含全距離目標功率 140W-150W、爬坡上限 174W、T2 下車前降瓦 123W-133W），已全面同步更新至 12 週總課表與 84 天每日菜單 (MD 與 Word 雙格式)。
- 2026-07-20 完成全功能二合一綜合整合主課表產出 (`outputs/12_week_ironman_consolidated_master_plan.md` 及 `.docx`)。
- 2026-07-20 成功依據使用者個人每週律動（一休、二跑、三游、四騎+跑、五游、六長騎+跑、日跑+游）完成兩套課表之深層無縫融合，並產出《個人定制融合版 12 週全距離鐵人三項主課表》(`outputs/12_week_ironman_custom_master_plan.docx` 及 `.md`)。
- 2026-07-27
- 2026-07-27 修復 `tp_weekly_strength.py` 硬編碼評語 Bug，實現依據實際快取數據動態填寫上週跑步次數與累計里程。
- 2026-07-27 開發並整合 `scripts/estimator_226.py` 滾動動態完賽預估模型，結合「近 4 週滾動訓練量（跑/騎/游）、長距離課表完成率、整體執行率」以及「FTP 205W 年齡組公開標竿對比數據」，每週自動精算與動態浮動呈現 226 樂觀、中性與保守完賽預估區間。
- 2026-07-28
- 2026-07-28 為 `scripts/generate_execution_report.py` 新增 `--current-week` 參數，支援動態抓取與計算當週累計執行率與每日運動成就。
- 2026-07-28 整合至 `scripts/daily_update.py` 每日 8:00 PM 自動化流程，使每天晚上同步最新 TP 運動資料時，能自動將當天上午（及本週已完成）之運動成果無縫更新進《當週執行率回顧報告》 (Word/MD) 與地端/Web 儀表板。
- 2026-07-28 成功測試並執行全套 daily update 流程，將今日 (07/28) 上午完成之「比賽配速跑 9.31 km (58 分鐘)」即時更新入 W31 當週執行率報告與網頁儀表板。
- 2026-08-02
- 2026-08-02 已更新 `scripts/tp_weekly_strength.py` 教練評語動態生成邏輯，涵蓋上週所有運動項目 (游泳、單車、跑步、肌力) 之數據與完成率。
- 2026-08-02 依使用者需求，已將鐵人新知文章展示介面與連結邏輯恢復為原始簡潔設定（單一「🔗 閱讀外網原始文章 ↗」按鈕，並於卡片內直觀呈現繁體中文重點摘要）。
- 2026-08-03 成功執行週一 (W32, 8/3-8/9) 自動化流程 (`scripts/run_weekly_strength.ps1`)：
  1. 生成《W32 第32週肌力訓練計畫與教練評語報告》 (Word/MD)。
  2. 依據最新規則，抓取過去 7 天全網共 36 篇最新新知文章（無刪減全數保留），並為每篇文章生成 100% 繁體中文 3 點條列摘要。
  3. 自動更新地端/Web 儀表板並發布推送到 GitHub Pages (`main -> main`)。
- 2026-08-03 依使用者指示，確認並明確標註 IM226 / IM113 (70.3) 滾動完賽預估模型計算機制：明確顯示其採用**截至上週日（完整 4 週滾動窗口）**之實際運動數據進行動態試算，更新 `scripts/estimator_226.py` 與 `scripts/generate_web_dashboard.py` 頁面顯示文字，同步重新部署至 GitHub Pages。
- 2026-08-03 修復網頁儀表板「上週執行率回顧」頁籤判斷邏輯 Bug：當查看本週 (W32) 時，系統優先載入完整已結算之上週 (W31) 執行率回顧報告，頁籤按鈕與標題正確顯示為 `📈 上週 (W31) 執行率回顧`，已重新生成網頁並部署至 GitHub Pages。
- 2026-08-06
- 2026-08-06 已建立並配置 **Codex 子 Agent (`codex`)** 專責處理自動化腳本與排程任務執行；由主 Agent (Antigravity) 進行監督與產出檢驗。
- 2026-08-06 修復 PowerShell 排程腳本 (`run_weekly_strength.ps1`, `run_sunday_report.ps1`, `run_daily_update.ps1`) 於無檔案變更時執行 `git commit` 拋出 Exit Code 1 的錯誤，全面提升自動化工作排程穩定度。
- 2026-08-07
- 2026-08-07 成功手動觸發並完成 TP 自動化流程 (`scripts/run_daily_update.ps1`)：完成 TrainingPeaks 行事曆事件同步、當週 (W32) 累計執行率報告更新、互動式網頁儀表板重新生成、靜態網頁打包並順利推送至 GitHub Pages。
- 2026-08-07 同步 TrainingPeaks ATP (#plan) 官方 Period 階段命名格式：更新為「4 週一循環（3 週負荷 + 1 週恢復）」結構：`Base 3 - Week 1` (W32)、`Base 3 - Week 2` (W33)、`Base 3 - Week 3` (W34)、`Base 3 - Week 4 (Recovery)` (W35)，接續 `Build 1 - Week 1~4 (Recovery)`，已重新打包上傳 GitHub Pages。
