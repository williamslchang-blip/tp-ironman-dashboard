from __future__ import annotations

import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def run_step(cmd_args: list[str], desc: str) -> bool:
    print(f"=== {desc} ===")
    res = subprocess.run(cmd_args, cwd=ROOT)
    if res.returncode != 0:
        print(f"Warning: {desc} exited with code {res.returncode}")
        return False
    return True

def main():
    print(f"Starting Daily 8:00 PM Automation Update: {datetime.now().isoformat()}")
    
    # 1. Sync TrainingPeaks iCal calendar
    run_step([sys.executable, "scripts/sync_calendar.py"], "1. Syncing TrainingPeaks Calendar")
    
    # 2. Regenerate 52-Week Web Dashboard & Merged Articles
    run_step([sys.executable, "scripts/generate_web_dashboard.py"], "2. Regenerating Web Dashboard & Articles")
    
    # 3. Package outputs to docs/ deployment folder
    run_step([sys.executable, "scripts/package_for_web.py"], "3. Packaging to docs/ Deployment Directory")
    
    print("Daily Update Finished Successfully!")

if __name__ == "__main__":
    main()
