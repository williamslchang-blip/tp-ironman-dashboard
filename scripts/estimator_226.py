from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(r"C:\Users\User\Desktop\TP")
CACHE_FILE = ROOT / "data" / "raw" / "calendar_cache.json"

def format_minutes(total_minutes: float) -> str:
    hours = int(total_minutes // 60)
    mins = int(round(total_minutes % 60))
    if mins == 60:
        hours += 1
        mins = 0
    return f"{hours:02d}:{mins:02d}"

def calculate_dynamic_226_estimate(target_monday: date) -> dict:
    """
    Calculates dynamic 226 finish time predictions using:
    1. Rolling 4-week Training Load & Fatigue/Fade Factor
    2. Riegel Power Law Formula (T2 = T1 * (D2/D1)^1.06~1.08)
    3. 70.3 Multiplier Model (2.12x ~ 2.28x)
    4. Alan Couzens / Joe Friel Power-Aerobic Pacing Model (FTP 205W Cohort)
    """
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception as e:
            print("Error reading cache for 226 estimator:", e)

    # 4-week window ending on the Sunday before target_monday
    window_end = target_monday - timedelta(days=1)
    window_start = window_end - timedelta(days=27)

    events_in_window = []
    for uid, ev in cache.items():
        ev_date = date.fromisoformat(ev["date"])
        if window_start <= ev_date <= window_end:
            events_in_window.append(ev)

    total_run_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Run")
    total_bike_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Bike")
    total_swim_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Swim")

    total_actual_time = sum(ev.get("actual_time", 0) for ev in events_in_window)
    total_planned_time = sum(ev.get("original_plan", {}).get("planned_time", ev.get("planned_time", 0)) for ev in events_in_window)

    long_bike_sessions = sum(1 for ev in events_in_window if ev.get("type") == "Bike" and ev.get("actual_time", 0) >= 120)
    long_run_sessions = sum(1 for ev in events_in_window if ev.get("type") == "Run" and ev.get("actual_time", 0) >= 70)

    active_weeks = max(1.0, min(4.0, (window_end - window_start).days / 7.0))

    avg_weekly_run_dist = total_run_dist / active_weeks
    avg_weekly_bike_dist = total_bike_dist / active_weeks
    avg_weekly_swim_dist = total_swim_dist / active_weeks

    exec_rate = (total_actual_time / total_planned_time * 100) if total_planned_time > 0 else 80.0

    # Base Targets for FTP ~205W Cohort (PB 11:38:24)
    base_swim_mins = 70.0
    base_transitions_mins = 12.0
    base_bike_mins = 345.0  # 5h45m
    base_run_mins = 255.0   # 4h15m

    # 1. Run Durability Factor (Target: 35km/wk, 1.5 long/brick runs per week)
    run_vol_ratio = min(1.0, avg_weekly_run_dist / 35.0)
    run_long_ratio = min(1.0, (long_run_sessions / active_weeks) / 1.5)
    run_fade_penalty_mins = 35.0 * (1.0 - (0.6 * run_vol_ratio + 0.4 * run_long_ratio))

    # 2. Bike Endurance Factor (Target: 120km/wk, 1 long bike per week)
    bike_vol_ratio = min(1.0, avg_weekly_bike_dist / 120.0)
    bike_long_ratio = min(1.0, (long_bike_sessions / active_weeks) / 1.0)
    bike_fade_penalty_mins = 25.0 * (1.0 - (0.5 * bike_vol_ratio + 0.5 * bike_long_ratio))

    base_total_mins = base_swim_mins + base_transitions_mins + base_bike_mins + base_run_mins
    fade_total = run_fade_penalty_mins + bike_fade_penalty_mins

    # Scenario formulation (Ensuring strict monotonicity: Optimistic < Neutral < Conservative)
    if exec_rate >= 85.0:
        exec_bonus = -10.0
        exec_status_text = "極佳 (有氧峰值，能量轉換順暢)"
    elif exec_rate >= 70.0:
        exec_bonus = 0.0
        exec_status_text = "良好 (維持基本盤發揮)"
    else:
        exec_bonus = 15.0
        exec_status_text = "偏低 (有體力下滑與後程抽筋風險)"

    opt_mins = base_total_mins + (0.20 * fade_total) + min(0.0, exec_bonus)
    neu_mins = base_total_mins + (0.60 * fade_total) + max(0.0, exec_bonus * 0.5)
    con_mins = base_total_mins + (1.10 * fade_total) + max(10.0, exec_bonus)

    if opt_mins >= neu_mins:
        opt_mins = neu_mins - 12.0
    if neu_mins >= con_mins:
        con_mins = neu_mins + 15.0

    # Classic Public Formulas (Riegel Formula & 70.3 Multiplier)
    # Assumed baseline 70.3 time: 5h15m (315 mins) for a 11:38 PB athlete
    ref_703_mins = 315.0
    riegel_opt = ref_703_mins * (2.0 ** 1.06)  # ~656 mins (10h56m)
    riegel_neu = ref_703_mins * (2.0 ** 1.08)  # ~665 mins (11h05m)
    riegel_con = ref_703_mins * (2.0 ** 1.11)  # ~679 mins (11h19m)

    mult_opt = ref_703_mins * 2.12  # 11h07m
    mult_neu = ref_703_mins * 2.20  # 11h33m
    mult_con = ref_703_mins * 2.28  # 11h58m

    return {
        "rolling_4w_avg_run_km": round(avg_weekly_run_dist, 2),
        "rolling_4w_avg_bike_km": round(avg_weekly_bike_dist, 2),
        "rolling_4w_avg_swim_km": round(avg_weekly_swim_dist, 2),
        "rolling_4w_exec_rate": round(exec_rate, 1),
        "exec_status_text": exec_status_text,
        "run_fade_penalty_mins": round(run_fade_penalty_mins, 1),
        "bike_fade_penalty_mins": round(bike_fade_penalty_mins, 1),
        "optimistic_range": f"{format_minutes(opt_mins - 7.5)} – {format_minutes(opt_mins + 7.5)}",
        "neutral_range": f"{format_minutes(neu_mins - 12.0)} – {format_minutes(neu_mins + 12.0)}",
        "conservative_range": f"{format_minutes(con_mins - 15.0)} – {format_minutes(con_mins + 20.0)}",
        "optimistic_mid": format_minutes(opt_mins),
        "neutral_mid": format_minutes(neu_mins),
        "conservative_mid": format_minutes(con_mins),
        "formulas": {
            "riegel_power_law": f"樂觀 {format_minutes(riegel_opt)} | 中性 {format_minutes(riegel_neu)} | 保守 {format_minutes(riegel_con)} (指數 1.06–1.11)",
            "multiplier_703": f"樂觀 {format_minutes(mult_opt)} (2.12x) | 中性 {format_minutes(mult_neu)} (2.20x) | 保守 {format_minutes(mult_con)} (2.28x)",
            "couzens_pacing": f"FTP 205W (目標 140W-145W) | 單車 {format_minutes(base_bike_mins)} | 馬拉松 {format_minutes(base_run_mins + run_fade_penalty_mins)}"
        },
        "benchmark_comparison": {
            "cohort_ftp": "205 W (68-70% 功率出巡: 140W-145W)",
            "benchmark_run_volume": "35–40 km / 週",
            "benchmark_bike_volume": "120–150 km / 週",
            "user_run_status": f"您目前 4 週均量 {avg_weekly_run_dist:.1f} km / 週 (達標率 {run_vol_ratio*100:.0f}%)",
            "user_bike_status": f"您目前 4 週均量 {avg_weekly_bike_dist:.1f} km / 週 (達標率 {bike_vol_ratio*100:.0f}%)",
            "marathon_fade_risk": "高 (需補足長距離衝擊剛性)" if run_fade_penalty_mins > 15 else "低 (肌肉適應良好)"
        }
    }

if __name__ == "__main__":
    res = calculate_dynamic_226_estimate(date(2026, 7, 27))
    print(json.dumps(res, indent=2, ensure_ascii=False))
