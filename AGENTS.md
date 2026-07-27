# AGENTS

本文件提供 Codex 與 Claude Code 共用規則。

## 專案目標

- 追蹤運動成效
- 預估 IM226 完賽成績

## 工作原則

- 保留原始資料，不覆蓋原始檔
- 分析流程要可重現
- 優先以中文輸出
- 避免前視偏誤
- 需要用到網路時，明確標示資料來源與抓取時間
- 若有中介檔，應清楚區分 raw / processed / output

## 公式格式

- Word 文件：使用 Office Math / OMML
- Markdown 文件：使用 LaTeX
- 若兩者需互轉，保留一致的符號與定義

## 變更規則

- 每次任務後更新 `PROJECT_STATUS.md`
- 新增、刪除、改名檔案時更新 `README.md`
- 改變流程、工具、資料來源、輸出格式、公式格式或 agent 規則時，更新 `AGENTS.md` 與 `CLAUDE.md`

## 建議資料夾結構

- `data/raw/`：原始資料
- `data/processed/`：清理後資料
- `outputs/`：圖表、表格、報告與匯出結果
- `notebooks/`：Jupyter 分析筆記
- `scripts/`：可重複執行的程式

## 已確認事項與現行做法

- **TrainingPeaks 資料取得**：已採用自動擷取 (經由 Webcal iCal 串流串接，使用複合 ID 緩存去重以防重複數據)
- **自動化排程**：每週一 9:00 AM (TP_Monday_Schedule_Fetch) 下載課表預測、肌力計畫與鐵人新知中譯；每週日 8:00 PM (TP_Sunday_Execution_Report) 產出當週執行率回顧報告。
- **最終成果格式**：定案以 Markdown 報告（供快速瀏覽）與 Word 檔案（供正式存檔與列印）雙重格式輸出。

## 待確認事項

- 是否要固定命名規則與資料夾結構
- 是否需要建立 `skills/` 與專案專用 `SKILL.md`
