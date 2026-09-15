# TrainingPeaks & Ironman Dashboard Workflow Rules (本日活動同步標準作業規範)

Whenever a new TrainingPeaks workout/activity record is received, reviewed, or analyzed (凡使用者提供「本日活動」或 TrainingPeaks 活動連結時，一律自動執行全套同步與發布流程，無需使用者額外提醒)：

1. **Synchronize local database and rebuild dashboard (同步資料庫與重新生成報告/儀表板)**:
   - Extract & analyze detailed physiological metrics (pace, power, HR, cadence, GCT, vertical ratio, TSS, Feeling/RPE).
   - Run `python scripts/daily_update.py` from `C:\Users\User\Desktop\TP`.
   - Ensure `calendar_cache.json`, execution review reports (MD/Word), and `outputs/index.html` + `docs/` are fully updated.

2. **Deploy the updated dashboard to GitHub Pages (部署至 GitHub Pages)**:
   - Stage, commit, and push changes to main branch:
     `git add . ; git commit -m "feat: sync YYYY-MM-DD TP workout and update dashboard" ; git push origin main`

3. **Verify live website and provide direct link (確認線上網站並提供專屬連結)**:
   - Provide the user with direct clickable links to the live website (including specific anchor tags like `#swim`, `#bike`, `#run`, or `#recovery`):
     `https://williamslchang-blip.github.io/tp-ironman-dashboard/index.html#swim`

