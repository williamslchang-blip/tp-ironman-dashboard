import urllib.request
import re
import json
from datetime import datetime, date, timedelta
from pathlib import Path

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
                
    print(f"Fetched {len(events)} events from TP.")
    
    live_uids = set()
    min_live_date = None
    max_live_date = None
    updated_count = 0
    new_count = 0
    
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
        
        # Parse times/distances
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
            
        uid = tp_uid if tp_uid else f"{dt_str}_{w_type}_{planned_time}_{planned_dist}"
        live_uids.add(uid)
            
        event_data = {
            "date": str(dt),
            "summary": summary,
            "uid": uid,
            "type": w_type,
            "planned_time": planned_time,
            "actual_time": actual_time,
            "planned_dist": planned_dist,
            "actual_dist": actual_dist,
            "last_synced": datetime.now().isoformat()
        }
        
        if uid in cache:
            old = cache[uid]
            orig_pt = old.get("original_plan", {}).get("planned_time", old.get("planned_time", planned_time))
            orig_pd = old.get("original_plan", {}).get("planned_dist", old.get("planned_dist", planned_dist))
            event_data["original_plan"] = {
                "planned_time": orig_pt if orig_pt > 0 else planned_time,
                "planned_dist": orig_pd if orig_pd > 0 else planned_dist
            }
            cache[uid].update(event_data)
            updated_count += 1
        else:
            # Check if old cache had legacy entry on same date & type
            orig_pt = planned_time
            orig_pd = planned_dist
            for old_k, old_v in cache.items():
                if old_v.get("date") == str(dt) and old_v.get("type") == w_type:
                    old_orig_pt = old_v.get("original_plan", {}).get("planned_time", old_v.get("planned_time", 0))
                    old_orig_pd = old_v.get("original_plan", {}).get("planned_dist", old_v.get("planned_dist", 0))
                    if old_orig_pt > 0 and orig_pt == 0:
                        orig_pt = old_orig_pt
                    if old_orig_pd > 0 and orig_pd == 0:
                        orig_pd = old_orig_pd
            event_data["original_plan"] = {
                "planned_time": orig_pt,
                "planned_dist": orig_pd
            }
            cache[uid] = event_data
            new_count += 1

    # Cleanup stale / deleted planned events from live date range
    to_delete = set()
    if min_live_date:
        for k, v in list(cache.items()):
            try:
                ev_date = date.fromisoformat(v["date"])
                if ev_date >= min_live_date:
                    if k not in live_uids:
                        if v.get("actual_time", 0) == 0 and v.get("actual_dist", 0) == 0:
                            to_delete.add(k)
                        elif not re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", k, re.I):
                            same_live = [l_k for l_k in live_uids if cache.get(l_k, {}).get("date") == v["date"] and cache.get(l_k, {}).get("type") == v["type"]]
                            if same_live:
                                to_delete.add(k)
            except Exception:
                pass

    # Deduplicate past events (before min_live_date)
    past_keys = [k for k, v in cache.items() if date.fromisoformat(v["date"]) < min_live_date]
    grouped_past = {}
    for k in past_keys:
        v = cache[k]
        group_key = (v["date"], v["type"])
        grouped_past.setdefault(group_key, []).append(k)

    for group_key, k_list in grouped_past.items():
        if len(k_list) > 1:
            has_completed = [k for k in k_list if cache[k].get("actual_time", 0) > 0]
            if has_completed:
                for k in k_list:
                    if cache[k].get("actual_time", 0) == 0 and cache[k].get("actual_dist", 0) == 0:
                        to_delete.add(k)
                seen_act = set()
                for k in has_completed:
                    act_tuple = (cache[k].get("actual_time", 0), cache[k].get("actual_dist", 0))
                    if act_tuple in seen_act:
                        to_delete.add(k)
                    else:
                        seen_act.add(act_tuple)

    for k in to_delete:
        if k in cache:
            del cache[k]

    # Save cache
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
        
    print(f"Sync complete. New: {new_count}, Updated: {updated_count}, Cleaned/Deleted: {len(to_delete)}. Total active events in cache: {len(cache)}.")

if __name__ == "__main__":
    sync()

