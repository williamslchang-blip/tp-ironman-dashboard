# TrainingPeaks & Ironman Dashboard Workflow Rules

Whenever a new TrainingPeaks workout/activity record is received, reviewed, or analyzed:
1. Synchronize the local database and rebuild the dashboard:
   - Run python scripts/daily_update.py from C:\Users\User\Desktop\TP.
2. Deploy the updated dashboard to GitHub Pages:
   - Stage, commit, and push changes to main branch (git add . ; git commit -m '...' ; git push origin main).
3. Ensure the live website at https://williamslchang-blip.github.io/tp-ironman-dashboard/index.html#recovery reflects the latest workout stats and execution reports.
