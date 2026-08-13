from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, date, timedelta
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = ROOT / "data" / "raw" / "calendar_cache.json"

def run_step(cmd_args: list[str], desc: str) -> bool:
    print(f"=== {desc} ===")
    res = subprocess.run(cmd_args, cwd=ROOT)
    if res.returncode != 0:
        print(f"Warning: {desc} exited with code {res.returncode}")
        return False
    return True

def verify_cache_integrity() -> bool:
    print("=== 1.5 Verifying Data Integrity & Checking Anomalies ===")
    if not CACHE_FILE.exists():
        print("Cache file does not exist!")
        return False
        
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)
        
    print(f"[Verification] Total active events in cache: {len(cache)}")
    
    # Check for duplicates by (date, type, summary, actual_time, actual_dist)
    groups = defaultdict(list)
    for uid, ev in cache.items():
        key = (ev.get("date"), ev.get("type"), ev.get("summary"), ev.get("actual_time"), ev.get("actual_dist"))
        groups[key].append(uid)
        
    dups = {k: v for k, v in groups.items() if len(v) > 1}
    if dups:
        print(f"[WARNING] Found {len(dups)} duplicate event groups in cache!")
        for (d, t, summary, at, ad), uids in dups.items():
            print(f"  - Date: {d} | Type: {t} | Summary: {summary} | ActTime: {at}m | ActDist: {ad}km ({len(uids)} entries)")
        return False
    else:
        print("[Verification] [OK] No duplicate entries found in cache.")

    # Calculate and log current week stats (Monday to Sunday)
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    
    w_events = [ev for ev in cache.values() if monday <= date.fromisoformat(ev.get("date", "1970-01-01")) <= sunday]
    run_dist = sum(ev.get("actual_dist", 0) for ev in w_events if ev.get("type") == "Run")
    bike_dist = sum(ev.get("actual_dist", 0) for ev in w_events if ev.get("type") == "Bike")
    swim_dist = sum(ev.get("actual_dist", 0) for ev in w_events if ev.get("type") == "Swim")
    
    print(f"[Verification] Current Week ({monday} ~ {sunday}) Summary:")
    print(f"  - Swim: {swim_dist:.2f} km | Bike: {bike_dist:.2f} km | Run: {run_dist:.2f} km")
    return True

def main():
    print(f"Starting Daily 8:00 PM Automation Update: {datetime.now().isoformat()}")
    
    # 1. Sync TrainingPeaks iCal calendar
    run_step([sys.executable, "scripts/sync_calendar.py"], "1. Syncing TrainingPeaks Calendar")
    
    # 1.5 Verify Data Integrity
    verify_cache_integrity()
    
    # 2. Update Current Week Execution Rate Report
    run_step([sys.executable, "scripts/generate_execution_report.py", "--current-week"], "2. Updating Current Week Execution Rate Report")
    
    # 3. Regenerate 52-Week Web Dashboard & Merged Articles
    run_step([sys.executable, "scripts/generate_web_dashboard.py"], "3. Regenerating Web Dashboard & Articles")
    
    # 4. Package outputs to docs/ deployment folder
    run_step([sys.executable, "scripts/package_for_web.py"], "4. Packaging to docs/ Deployment Directory")
    
    print("Daily Update Finished Successfully!")

if __name__ == "__main__":
    main()

