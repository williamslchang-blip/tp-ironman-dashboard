# Trainingpeak運動記錄分析

這個專案用來整理 TrainingPeaks 的運動資料，追蹤訓練成效，並預估 IM226 完賽成績。

## 目前文件與腳本

- `PROJECT_STATUS.md`：專案狀態、假設、待確認事項 (已於 2026-07-15 新增 W29 排程與去重修復紀錄)
- `AGENTS.md`：Codex 與 Claude Code 共用的工作規則
- `CLAUDE.md`：Claude Code 需要遵守的專案規則
- `2026_07_strength_schedule.docx`：七月肌力課表 Word 版本
- `build_july_strength_doc.py`：生成七月肌力課表的腳本
- `scripts/sync_calendar.py`：下載並使用穩定複合式 Key (`stable_id`) 去重快取 TrainingPeaks ical 行事曆事件的腳本
- `scripts/fetch_weekly_articles.py`：每週自動擷取五大鐵人權威網站新文章、進行中文翻譯並產出英文與中文版報告的腳本
- `scripts/generate_execution_report.py`：每週日自動讀取快取數據並產出當週訓練執行率回顧報告 (Markdown 與 Word 格式) 的腳本
- `scripts/generate_web_dashboard.py`：每週自動匯總訓練數據、226 動態預估與文章摘要並產出地端網頁版儀表板 HTML 的腳本
- `outputs/index.html`：**地端互動式網頁儀表板**（瀏覽器雙擊即可開啟，包含 226 動態完賽預估、當週課表排程、上週執行率與鐵人新知）
- `outputs/weekly/`：存放每週自動生成的肌力訓練計畫 (例如：`YYYY-Wxx_第xx週肌力訓練計畫.docx`)、鐵人新知彙整 (中/英) 與執行率回顧報告。
- `outputs/12_week_ironman_full_training_plan.md` (.docx)：依據 220 Triathlon 體系與 Nik Cook 騎後跑機制建立之完整 12 週全距離鐵人三項總課表 (提供 MD 與 Word 檔)。
- `outputs/12_week_ironman_daily_training_plan.md` (.docx)：將 12 週完整拆解至 84 天之每日詳細菜單 (提供 MD 與 Word 檔)。
- `outputs/12_week_ironman_consolidated_master_plan.md` (.docx)：**全功能二合一綜合整合主課表**，將訓練原則、FTP 205W 量化瓦數、12 週進度總表與 84 天每日詳細菜單無縫完美整併為單一檔 (提供 MD 與 Word 檔)。
- `outputs/12_week_ironman_custom_master_plan.docx` (.md)：**個人定制融合版主課表**，完全依照使用者「一休、二跑、三游、四騎+跑、五游、六長騎+跑、日跑+游」之個人每週律動重構並完美融合 (提供 Word 與 MD 檔)。
- `outputs/ironman_sub11_and_langkawi_strategy.docx` (.md)：**Ironman 226km Sub-11 時間拆解與馬來西亞蘭卡威備賽特化策略指南** (提供 Word 與 MD 檔)。
- `outputs/ftp_elevation_guide_and_workouts.docx` (.md)：**FTP 高效提升專項指南與 4 週輪替課表** (基於 FTP 205W，提供 Word 與 MD 檔)。







## 專案原則

- 保留原始資料，不覆蓋原檔
- 分析流程要可重現
- 優先使用中文撰寫結果與說明
- 若需要 Word 文件，數學方程式使用 Office Math / OMML
- Markdown 版本可使用 LaTeX

## 文件變更規則

- 新增、刪除、改名檔案時，更新本 README
- 每次任務後，更新 `PROJECT_STATUS.md`
- 若流程、工具、資料來源、輸出格式、公式格式或 agent 規則改變，更新 `AGENTS.md` 與 `CLAUDE.md`

## 目前判斷

暫時不建立 `skills/` 與 `SKILL.md`。

原因：
- 專案仍在建立初版文件階段
- 目前較重要的是先把資料結構、流程與輸出標準固定
- 後續若流程成熟、需要重複使用，再把可重用規則整理成 `skills/SKILL.md`
