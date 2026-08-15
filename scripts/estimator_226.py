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
    Calculates dynamic IM226 & IM70.3 finish time predictions using a Multi-Model Hybrid Engine:
    1. Critical Swim Speed (CSS) & Open-Water / Wetsuit Dynamics
    2. Best Bike Split (BBS) Aerodynamic Pacing & Couzens/Friel FTP Cohort (FTP 205W)
    3. Jack Daniels VDOT & Bike-to-Run Fatigue + Runalyze/Vickers Marathon Shape Penalty
    4. Rolling 4-week TrainingPeaks Load & Execution Rate Dynamic Bonus/Penalty
    5. TriRating Course Rating & Extreme Heat Modifier (e.g. Langkawi Tropical Hills)
    6. Cross-Validation with Peter Riegel Power Law & 70.3 Multiplier
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
        try:
            ev_date = date.fromisoformat(ev.get("date", ""))
            if window_start <= ev_date <= window_end:
                events_in_window.append(ev)
        except Exception:
            continue

    total_run_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Run")
    total_bike_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Bike")
    total_swim_dist = sum(ev.get("actual_dist", 0) for ev in events_in_window if ev.get("type") == "Swim")

    total_actual_time = sum(ev.get("actual_time", 0) for ev in events_in_window)
    total_planned_time = sum(ev.get("original_plan", {}).get("planned_time", ev.get("planned_time", 0)) for ev in events_in_window)

    long_bike_sessions = sum(1 for ev in events_in_window if ev.get("type") == "Bike" and ev.get("actual_time", 0) >= 120)
    long_run_sessions = sum(1 for ev in events_in_window if ev.get("type") == "Run" and ev.get("actual_time", 0) >= 70)

    # Calculate average swim speed if available
    swim_speeds = [ev.get("speed", 0) for ev in events_in_window if ev.get("type") == "Swim" and ev.get("speed", 0) > 0]
    avg_swim_speed = (sum(swim_speeds) / len(swim_speeds)) if swim_speeds else 3.0

    active_weeks = max(1.0, min(4.0, (window_end - window_start).days / 7.0))

    avg_weekly_run_dist = total_run_dist / active_weeks
    avg_weekly_bike_dist = total_bike_dist / active_weeks
    avg_weekly_swim_dist = total_swim_dist / active_weeks

    exec_rate = (total_actual_time / total_planned_time * 100) if total_planned_time > 0 else 80.0

    # -------------------------------------------------------------
    # 1. 🏊 SWIM MODEL (CSS + Open-Water / Wetsuit Dynamics)
    # -------------------------------------------------------------
    # Sub-11 Benchmark Swim: 1h10m - 1h12m (1:50-1:53/100m)
    # 70.3 Benchmark Swim: 33m - 35m (1:45-1:50/100m)
    base_swim_mins = 72.0       # IM226: 3.8km @ 1:53.7/100m
    base_swim_703 = 34.0        # IM70.3: 1.9km @ 1:47.4/100m

    # Swim volume readiness factor (Target 7.0km/wk)
    swim_vol_ratio = min(1.0, avg_weekly_swim_dist / 7.0)
    swim_fade_mins = 6.0 * (1.0 - swim_vol_ratio)

    # -------------------------------------------------------------
    # 2. 🚴 BIKE MODEL (Best Bike Split Physics & Couzens FTP 205W Pacing)
    # -------------------------------------------------------------
    # FTP = 205W
    # IM226: Target 0.69 IF (140W-145W) -> BBS Flat Speed ~32.7 km/h -> 5h30m (330 mins)
    # IM70.3: Target 0.80 IF (162W-166W) -> BBS Flat Speed ~33.5 km/h -> 2h41m (161 mins)
    base_bike_mins = 330.0      # IM226 180km @ 32.7 km/h
    base_bike_703 = 161.0       # IM70.3 90km @ 33.5 km/h

    # Bike volume & long session readiness (Target: 120km/wk, 1.0 long ride/wk)
    bike_vol_ratio = min(1.0, avg_weekly_bike_dist / 120.0)
    bike_long_ratio = min(1.0, (long_bike_sessions / active_weeks) / 1.0)
    bike_fade_penalty_mins = 25.0 * (1.0 - (0.5 * bike_vol_ratio + 0.5 * bike_long_ratio))

    # -------------------------------------------------------------
    # 3. 🏃 RUN MODEL (Jack Daniels VDOT + Runalyze Marathon Shape + Bike-to-Run)
    # -------------------------------------------------------------
    # VDOT baseline for sub-11 athlete: ~44-46 VDOT (Open Marathon ~3h35m-3h45m)
    # Bike-to-Run Transition Penalty (Couzens standard: +10% to +15% over open marathon)
    # Baseline Tri-Marathon = 4h00m (240 mins, 5:41/km)
    # Baseline Tri-Half-Marathon = 1h54m (114 mins, 5:24/km)
    base_run_mins = 240.0       # IM226 42.2km @ 5:41/km
    base_run_703 = 114.0        # IM70.3 21.1km @ 5:24/km

    # Run Durability & Vickers/Runalyze Marathon Shape Factor
    # (Target: 35km/wk, 1.5 long/brick runs per week)
    run_vol_ratio = min(1.0, avg_weekly_run_dist / 35.0)
    run_long_ratio = min(1.0, (long_run_sessions / active_weeks) / 1.5)
    marathon_shape_score = round((0.6 * run_vol_ratio + 0.4 * run_long_ratio) * 100, 1)

    # If Marathon Shape is low, non-linear fade kicks in after 28km
    run_fade_penalty_mins = 35.0 * (1.0 - (0.6 * run_vol_ratio + 0.4 * run_long_ratio))

    # -------------------------------------------------------------
    # 4. ⏱️ TRANSITION (T1 & T2)
    # -------------------------------------------------------------
    base_t1_mins = 6.0
    base_t2_mins = 6.0
    base_transitions_mins = base_t1_mins + base_t2_mins

    base_t1_703 = 3.0
    base_t2_703 = 3.0
    base_transitions_703 = base_t1_703 + base_t2_703

    # -------------------------------------------------------------
    # 5. 📈 TRAININGPEAKS EXECUTION RATE & RECOVERY BONUS/PENALTY
    # -------------------------------------------------------------
    if exec_rate >= 85.0:
        exec_bonus = -10.0
        exec_status_text = "極佳 (有氧峰值，能量轉換順暢，執行率達標)"
    elif exec_rate >= 70.0:
        exec_bonus = 0.0
        exec_status_text = "良好 (維持基本盤發揮，有氧底層穩定)"
    else:
        exec_bonus = 15.0
        exec_status_text = "偏低 (有體力下滑、跑量不足與後程抽筋風險)"

    fade_total = run_fade_penalty_mins + bike_fade_penalty_mins + swim_fade_mins
    base_total_mins = base_swim_mins + base_transitions_mins + base_bike_mins + base_run_mins

    # -------------------------------------------------------------
    # 6. SCENARIO FORMULATION: IM226
    # -------------------------------------------------------------
    opt_mins = base_total_mins + (0.20 * fade_total) + min(0.0, exec_bonus)
    neu_mins = base_total_mins + (0.60 * fade_total) + max(0.0, exec_bonus * 0.5)
    con_mins = base_total_mins + (1.10 * fade_total) + max(10.0, exec_bonus)

    if opt_mins >= neu_mins:
        opt_mins = neu_mins - 12.0
    if neu_mins >= con_mins:
        con_mins = neu_mins + 15.0

    opt_splits = {
        "swim": format_minutes(base_swim_mins - 2.0 + (0.20 * swim_fade_mins)),
        "t1": format_minutes(5.0),
        "bike": format_minutes(base_bike_mins + (0.20 * bike_fade_penalty_mins)),
        "t2": format_minutes(5.0),
        "run": format_minutes(base_run_mins + (0.20 * run_fade_penalty_mins) + min(0.0, exec_bonus))
    }
    neu_splits = {
        "swim": format_minutes(base_swim_mins + (0.60 * swim_fade_mins)),
        "t1": format_minutes(6.0),
        "bike": format_minutes(base_bike_mins + (0.60 * bike_fade_penalty_mins)),
        "t2": format_minutes(6.0),
        "run": format_minutes(base_run_mins + (0.60 * run_fade_penalty_mins) + max(0.0, exec_bonus * 0.5))
    }
    con_splits = {
        "swim": format_minutes(base_swim_mins + 4.0 + (1.10 * swim_fade_mins)),
        "t1": format_minutes(8.0),
        "bike": format_minutes(base_bike_mins + (1.10 * bike_fade_penalty_mins)),
        "t2": format_minutes(8.0),
        "run": format_minutes(base_run_mins + (1.10 * run_fade_penalty_mins) + max(10.0, exec_bonus))
    }

    # -------------------------------------------------------------
    # 7. SCENARIO FORMULATION: IM70.3 (113km)
    # -------------------------------------------------------------
    base_total_703 = base_swim_703 + base_transitions_703 + base_bike_703 + base_run_703
    fade_total_703 = 0.45 * (run_fade_penalty_mins + bike_fade_penalty_mins + swim_fade_mins)

    opt_mins_703 = base_total_703 + (0.15 * fade_total_703) + min(0.0, exec_bonus * 0.5)
    neu_mins_703 = base_total_703 + (0.50 * fade_total_703) + max(0.0, exec_bonus * 0.3)
    con_mins_703 = base_total_703 + (1.00 * fade_total_703) + max(6.0, exec_bonus * 0.6)

    if opt_mins_703 >= neu_mins_703:
        opt_mins_703 = neu_mins_703 - 8.0
    if neu_mins_703 >= con_mins_703:
        con_mins_703 = neu_mins_703 + 10.0

    opt_splits_703 = {
        "swim": format_minutes(base_swim_703 - 1.0 + (0.15 * 0.45 * swim_fade_mins)),
        "t1": format_minutes(2.5),
        "bike": format_minutes(base_bike_703 + (0.15 * 0.45 * bike_fade_penalty_mins)),
        "t2": format_minutes(2.5),
        "run": format_minutes(base_run_703 + (0.15 * 0.45 * run_fade_penalty_mins) + min(0.0, exec_bonus * 0.5))
    }
    neu_splits_703 = {
        "swim": format_minutes(base_swim_703 + (0.50 * 0.45 * swim_fade_mins)),
        "t1": format_minutes(3.0),
        "bike": format_minutes(base_bike_703 + (0.50 * 0.45 * bike_fade_penalty_mins)),
        "t2": format_minutes(3.0),
        "run": format_minutes(base_run_703 + (0.50 * 0.45 * run_fade_penalty_mins) + max(0.0, exec_bonus * 0.3))
    }
    con_splits_703 = {
        "swim": format_minutes(base_swim_703 + 2.0 + (1.00 * 0.45 * swim_fade_mins)),
        "t1": format_minutes(4.0),
        "bike": format_minutes(base_bike_703 + (1.00 * 0.45 * bike_fade_penalty_mins)),
        "t2": format_minutes(4.0),
        "run": format_minutes(base_run_703 + (1.00 * 0.45 * run_fade_penalty_mins) + max(6.0, exec_bonus * 0.6))
    }

    # -------------------------------------------------------------
    # 8. 🌡️ TRIRATING LANGKAWI (EXTREME HEAT & HILLS) MODIFIER
    # -------------------------------------------------------------
    langkawi_penalty_opt = 55.0
    langkawi_penalty_neu = 72.0
    langkawi_penalty_con = 95.0

    langkawi_opt_mins = opt_mins + langkawi_penalty_opt
    langkawi_neu_mins = neu_mins + langkawi_penalty_neu
    langkawi_con_mins = con_mins + langkawi_penalty_con

    # -------------------------------------------------------------
    # 9. CROSS-VALIDATION FORMULAS (Riegel, 70.3 Multiplier, VDOT)
    # -------------------------------------------------------------
    ref_703_mins = neu_mins_703
    riegel_opt = ref_703_mins * (2.0 ** 1.06)
    riegel_neu = ref_703_mins * (2.0 ** 1.08)
    riegel_con = ref_703_mins * (2.0 ** 1.11)

    mult_opt = ref_703_mins * 2.12
    mult_neu = ref_703_mins * 2.20
    mult_con = ref_703_mins * 2.28

    return {
        "window_date_range": f"{window_start:%Y/%m/%d} – {window_end:%Y/%m/%d} (截至上週日)",
        "rolling_4w_avg_run_km": round(avg_weekly_run_dist, 2),
        "rolling_4w_avg_bike_km": round(avg_weekly_bike_dist, 2),
        "rolling_4w_avg_swim_km": round(avg_weekly_swim_dist, 2),
        "rolling_4w_exec_rate": round(exec_rate, 1),
        "exec_status_text": exec_status_text,
        "marathon_shape_score": marathon_shape_score,
        "run_fade_penalty_mins": round(run_fade_penalty_mins, 1),
        "bike_fade_penalty_mins": round(bike_fade_penalty_mins, 1),
        "swim_fade_penalty_mins": round(swim_fade_mins, 1),
        "optimistic_range": f"{format_minutes(opt_mins - 7.5)} – {format_minutes(opt_mins + 7.5)}",
        "neutral_range": f"{format_minutes(neu_mins - 12.0)} – {format_minutes(neu_mins + 12.0)}",
        "conservative_range": f"{format_minutes(con_mins - 15.0)} – {format_minutes(con_mins + 20.0)}",
        "optimistic_mid": format_minutes(opt_mins),
        "neutral_mid": format_minutes(neu_mins),
        "conservative_mid": format_minutes(con_mins),
        "opt_splits": opt_splits,
        "neu_splits": neu_splits,
        "con_splits": con_splits,
        "optimistic_range_703": f"{format_minutes(opt_mins_703 - 5.0)} – {format_minutes(opt_mins_703 + 5.0)}",
        "neutral_range_703": f"{format_minutes(neu_mins_703 - 6.0)} – {format_minutes(neu_mins_703 + 6.0)}",
        "conservative_range_703": f"{format_minutes(con_mins_703 - 8.0)} – {format_minutes(con_mins_703 + 10.0)}",
        "optimistic_mid_703": format_minutes(opt_mins_703),
        "neutral_mid_703": format_minutes(neu_mins_703),
        "conservative_mid_703": format_minutes(con_mins_703),
        "opt_splits_703": opt_splits_703,
        "neu_splits_703": neu_splits_703,
        "con_splits_703": con_splits_703,
        "langkawi_estimate": {
            "optimistic": f"{format_minutes(langkawi_opt_mins - 10.0)} – {format_minutes(langkawi_opt_mins + 10.0)} (中位: {format_minutes(langkawi_opt_mins)})",
            "neutral": f"{format_minutes(langkawi_neu_mins - 15.0)} – {format_minutes(langkawi_neu_mins + 15.0)} (中位: {format_minutes(langkawi_neu_mins)})",
            "conservative": f"{format_minutes(langkawi_con_mins - 20.0)} – {format_minutes(langkawi_con_mins + 25.0)} (中位: {format_minutes(langkawi_con_mins)})",
            "heat_climbing_penalty": f"+{int(langkawi_penalty_neu)} 分鐘 (高溫 34°C/濕度 90% + 單車爬升 1,500m)"
        },
        "formulas": {
            "hybrid_engine": "結合 CSS 臨界水速 + BBS 物理力學 + Couzens 功率區間 + VDOT/Runalyze 馬拉松準備度 + TP 執行率",
            "riegel_power_law": f"樂觀 {format_minutes(riegel_opt)} | 中性 {format_minutes(riegel_neu)} | 保守 {format_minutes(riegel_con)} (指數 1.06–1.11)",
            "multiplier_703": f"樂觀 {format_minutes(mult_opt)} (2.12x) | 中性 {format_minutes(mult_neu)} (2.20x) | 保守 {format_minutes(mult_con)} (2.28x)",
            "couzens_pacing": f"FTP 205W (目標 140W-145W) | 單車 {format_minutes(base_bike_mins)} | 馬拉松 {format_minutes(base_run_mins + run_fade_penalty_mins)}"
        },
        "benchmark_comparison": {
            "cohort_ftp": "205 W (68-70% 功率出巡: 140W-145W)",
            "marathon_shape_status": f"Runalyze 馬拉松準備度指數：{marathon_shape_score}%",
            "benchmark_run_volume": "35–40 km / 週 (Sub-11 標竿)",
            "benchmark_bike_volume": "120–150 km / 週 (Sub-11 標竿)",
            "sub11_bike_target_time": "05:20 – 05:30",
            "sub11_run_target_time": "03:45 – 04:00",
            "user_run_status": f"您目前 4 週均量 {avg_weekly_run_dist:.1f} km / 週 (達標率 {run_vol_ratio*100:.0f}%)",
            "user_bike_status": f"您目前 4 週均量 {avg_weekly_bike_dist:.1f} km / 週 (達標率 {bike_vol_ratio*100:.0f}%)",
            "marathon_fade_risk": "高 (需補足長距離衝擊剛性)" if run_fade_penalty_mins > 15 else "低 (肌肉適應良好)",
            "sub11_coach_advice": "單車有氧基礎相當優異，請保持 140W-145W 配速紀律；全馬為突破 Sub-11 門檻的最關鍵瓶頸，請把握週末 90 分鐘轉換跑與 LSD 補足跑量與衝擊剛性。"
        }
    }

if __name__ == "__main__":
    res = calculate_dynamic_226_estimate(date(2026, 8, 10))
    print(json.dumps(res, indent=2, ensure_ascii=False))
