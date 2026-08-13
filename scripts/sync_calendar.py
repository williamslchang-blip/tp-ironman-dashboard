import urllib.request
import re
import json
from datetime import datetime, date, timedelta
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\Users\User\Desktop\TP")
CONFIG = ROOT / "config" / "trainingpeaks_calendar_url.txt"
CACHE_FILE = ROOT / "data" / "raw" / "calendar_cache.json"

def unfold(text):
    result = []
    for line in text.replace("\r\n", "\n").split("\n"):
        if line.startswith((" ", "\t")) and result:
            result[-1] += line[1:]
        else:
            result.append(line)
    return result

def clean(value):
    return value.replace(r"\n", "\n").replace(r"\,", ",").replace(r"\;", ";").replace(r"\\", "\\")

def parse_time_str(time_str):
    if not time_str:
        return 0
    parts = time_str.strip().split(":")
    if len(parts) == 3:
        return int(parts[0]) * 60 + int(parts[1]) + int(parts[2].split(".")[0]) / 60.0
    elif len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    else:
        try:
            return float(time_str)
        except:
            return 0

def sync():
    if not CONFIG.exists():
        print("Config file not found.")
        return
        
    url = CONFIG.read_text(encoding="utf-8").strip()
    url = re.sub(r"^webcal://", "https://", url, flags=re.I)
    
    # Load existing cache
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception as e:
            print("Error reading cache, initializing empty:", e)
            
    # Fetch calendar
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            text = response.read().decode("utf-8")
    except Exception as e:
        print("Error fetching calendar:", e)
        return
        
    events = []
    current = None
    for line in unfold(text):
        if line == "BEGIN:VEVENT":
            current = {}
        elif line == "END:VEVENT" and current is not None:
            events.append(current)
            current = None
        elif current is not None and ":" in line:
            key = line.split(":", 1)[0].split(";", 1)[0]
            if key in {"DTSTART", "SUMMARY", "DESCRIPTION", "UID"}:
                current[key] = clean(line.split(":", 1)[1])
                
    print(f"Fetched {len(events)} events from TP live feed.")
    
    # Parse live events
    live_events_by_slot = defaultdict(list)
    min_live_date = None
    max_live_date = None
    
    for ev in events:
        raw_start = ev.get("DTSTART", "")
        if len(raw_start) < 8:
            continue
        dt_str = raw_start[:8]
        dt = datetime.strptime(dt_str, "%Y%m%d").date()
        if min_live_date is None or dt < min_live_date:
            min_live_date = dt
        if max_live_date is None or dt > max_live_date:
            max_live_date = dt

        summary = ev.get("SUMMARY", "")
        desc = ev.get("DESCRIPTION", "")
        tp_uid = ev.get("UID", "").strip()
        
        planned_time = 0
        actual_time = 0
        planned_dist = 0
        actual_dist = 0
        
        pt_match = re.search(r"Planned Time:\s*([\d:]+)", desc, re.I)
        at_match = re.search(r"Actual Time:\s*([\d:]+)", desc, re.I)
        pd_match = re.search(r"Distance Planned:\s*([\d\.]+)\s*(km|m)?", desc, re.I)
        ad_match = re.search(r"Actual Distance:\s*([\d\.]+)\s*(km|m)?", desc, re.I)
        
        if pt_match:
            planned_time = parse_time_str(pt_match.group(1))
        if at_match:
            actual_time = parse_time_str(at_match.group(1))
            
        if pd_match:
            planned_dist = float(pd_match.group(1))
            unit = pd_match.group(2)
            if unit == "m" or (not unit and "Swim" in summary):
                planned_dist /= 1000.0
        if ad_match:
            actual_dist = float(ad_match.group(1))
            unit = ad_match.group(2)
            if unit == "m" or (not unit and "Swim" in summary):
                actual_dist /= 1000.0
                
        w_type = "Other"
        if "Swim" in summary:
            w_type = "Swim"
        elif "Bike" in summary:
            w_type = "Bike"
        elif "Run" in summary:
            w_type = "Run"
        elif "Strength" in summary:
            w_type = "Strength"
        elif "Day Off" in summary:
            w_type = "Day Off"
            
        live_events_by_slot[(str(dt), w_type)].append({
            "date": str(dt),
            "summary": summary,
            "tp_uid": tp_uid,
            "type": w_type,
            "planned_time": planned_time,
            "actual_time": actual_time,
            "planned_dist": planned_dist,
            "actual_dist": actual_dist,
        })

    # Reconstruct cache into new_cache with stable keys: YYYY-MM-DD_{type}_{idx}
    new_cache = {}
    processed_live_slots = set()
    
    # 1. Process Live Events
    for (dt_s, w_type), ev_list in sorted(live_events_by_slot.items()):
        processed_live_slots.add((dt_s, w_type))
        # Sort events deterministically (by summary, planned_time, actual_time)
        ev_list.sort(key=lambda x: (x["summary"], x["planned_time"], x["actual_time"]))
        
        for idx, ev in enumerate(ev_list):
            stable_key = f"{dt_s}_{w_type}_{idx}"
            
            # Find existing candidate in old cache to preserve original_plan
            orig_pt = ev["planned_time"]
            orig_pd = ev["planned_dist"]
            
            # Search old cache for matching entry on dt_s and w_type
            for old_k, old_v in cache.items():
                if old_v.get("date") == dt_s and old_v.get("type") == w_type:
                    old_orig_pt = old_v.get("original_plan", {}).get("planned_time", old_v.get("planned_time", 0))
                    old_orig_pd = old_v.get("original_plan", {}).get("planned_dist", old_v.get("planned_dist", 0))
                    if old_orig_pt > 0:
                        orig_pt = old_orig_pt
                    if old_orig_pd > 0:
                        orig_pd = old_orig_pd
                    break
                    
            event_data = {
                "date": dt_s,
                "summary": ev["summary"],
                "uid": stable_key,
                "tp_uid": ev["tp_uid"],
                "type": w_type,
                "planned_time": ev["planned_time"],
                "actual_time": ev["actual_time"],
                "planned_dist": ev["planned_dist"],
                "actual_dist": ev["actual_dist"],
                "last_synced": datetime.now().isoformat(),
                "original_plan": {
                    "planned_time": orig_pt,
                    "planned_dist": orig_pd
                }
            }
            new_cache[stable_key] = event_data

    # 2. Process non-live historical/future events from old cache
    old_by_slot = defaultdict(list)
    for old_k, old_v in cache.items():
        dt_s = old_v.get("date")
        w_type = old_v.get("type", "Other")
        if not dt_s:
            continue
        ev_date = date.fromisoformat(dt_s)
        
        # Skip events within live date range that were NOT in live feed (unless completed)
        if min_live_date and min_live_date <= ev_date <= max_live_date:
            if (dt_s, w_type) not in processed_live_slots:
                # Unexecuted planned event deleted from TP -> omit
                if old_v.get("actual_time", 0) == 0 and old_v.get("actual_dist", 0) == 0:
                    continue
                    
        old_by_slot[(dt_s, w_type)].append(old_v)

    for (dt_s, w_type), ev_list in sorted(old_by_slot.items()):
        if (dt_s, w_type) in processed_live_slots:
            continue  # Already updated from live feed
            
        # Deduplicate multiple legacy entries for the same slot
        unique_events = {}
        for ev in ev_list:
            key_sig = (ev.get("summary"), ev.get("actual_time", 0), ev.get("actual_dist", 0), ev.get("planned_time", 0), ev.get("planned_dist", 0))
            if key_sig not in unique_events or ev.get("last_synced", "") > unique_events[key_sig].get("last_synced", ""):
                unique_events[key_sig] = ev
                
        sorted_evs = sorted(unique_events.values(), key=lambda x: (x.get("summary", ""), x.get("planned_time", 0)))
        for idx, ev in enumerate(sorted_evs):
            stable_key = f"{dt_s}_{w_type}_{idx}"
            ev["uid"] = stable_key
            new_cache[stable_key] = ev

    # Save cache
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(new_cache, f, ensure_ascii=False, indent=2)
        
    print(f"Sync complete. Total clean events in cache: {len(new_cache)}.")

if __name__ == "__main__":
    sync()


