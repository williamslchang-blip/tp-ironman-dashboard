"""Weekly actual-hour review and transparent, data-driven coaching notes."""
from __future__ import annotations
from datetime import date, timedelta
from html import escape
import math

SPORTS = {"Swim": "游泳", "Bike": "騎車", "Run": "跑步"}

def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) and result >= 0 else 0.0
    except (ValueError, TypeError):
        return 0.0

def build_weekly_training_reviews(cache, year, as_of):
    """Return W01-W52 by ISO year; actual_time is stored in minutes."""
    buckets = {w: [] for w in range(1, 53)}
    for event in cache.values():
        try:
            event_date = date.fromisoformat(event["date"])
            iso = event_date.isocalendar()
        except (KeyError, ValueError, TypeError):
            continue
        if iso.year == year and iso.week in buckets and event.get("type") in SPORTS:
            buckets[iso.week].append((event_date, event))
    result = {}
    for week in range(1, 53):
        monday = date.fromisocalendar(year, week, 1)
        sunday = monday + timedelta(days=6)
        actual = {s: 0.0 for s in SPORTS}
        planned = {s: 0.0 for s in SPORTS}
        sessions = {s: 0 for s in SPORTS}
        longest = {s: 0.0 for s in SPORTS}
        missing = {s: 0 for s in SPORTS}
        active_days = set()
        for event_date, event in buckets[week]:
            sport = event["type"]
            original = event.get("original_plan")
            original = original if isinstance(original, dict) else {}
            planned[sport] += number(original.get("planned_time", event.get("planned_time")))
            if event_date > as_of:
                continue
            minutes = number(event.get("actual_time"))
            if minutes > 0:
                actual[sport] += minutes
                sessions[sport] += 1
                longest[sport] = max(longest[sport], minutes)
                active_days.add(event_date)
            elif number(event.get("actual_dist")) > 0:
                missing[sport] += 1
                active_days.add(event_date)
        has_data = bool(active_days)
        hours = {s.lower(): (round(actual[s] / 60, 6) if has_data and not missing[s] else None) for s in SPORTS}
        hours["total"] = round(sum(actual.values()) / 60, 6) if has_data and not sum(missing.values()) else None
        plan_hours = {s.lower(): round(planned[s] / 60, 6) for s in SPORTS}
        plan_hours["total"] = round(sum(planned.values()) / 60, 6)
        result[week] = {
            "year": year, "week": week, "as_of": as_of.isoformat(),
            "monday": monday.isoformat(), "sunday": sunday.isoformat(),
            "is_future": monday > as_of, "is_partial": monday <= as_of <= sunday,
            "has_actual_data": has_data, "hours": hours, "planned_hours": plan_hours,
            "sessions": {s.lower(): sessions[s] for s in SPORTS},
            "longest_hours": {s.lower(): round(longest[s] / 60, 6) for s in SPORTS},
            "missing_time_count": sum(missing.values()),
            "active_days": len(active_days),
            "recorded_hours": round(sum(actual.values()) / 60, 6),
            "completion_pct": (round(hours["total"] / plan_hours["total"] * 100, 2)
                               if hours["total"] is not None and plan_hours["total"] > 0 else None),
        }
    for week, item in result.items():
        previous = [result[w]["hours"]["total"] for w in range(max(1, week - 4), week)
                    if result[w]["hours"]["total"] is not None and not result[w]["is_partial"]]
        item["previous_four_count"] = len(previous)
        item["previous_four_mean_hours"] = round(sum(previous) / len(previous), 6) if len(previous) >= 3 else None
        mean = item["previous_four_mean_hours"]
        item["trend_pct"] = (round((item["hours"]["total"] / mean - 1) * 100, 2)
                             if mean and item["hours"]["total"] is not None and not item["is_partial"] else None)
    return result

def coaching_messages(review, phase=""):
    r = review
    phase = str(phase)
    low_phase = any(word in phase.lower() for word in ("taper", "recovery", "off-season", "減量", "恢復"))
    if not r["has_actual_data"]:
        message = ("此週尚未開始，圖表不以預定時數冒充實際完成量。"
                   if r["is_future"] else "沒有已同步的實際訓練時間，不能據此判定完全休息或未完成課表。")
        return {"summary": message, "analysis": [f"原訂三項時數 {r['planned_hours']['total']:.2f} 小時；尚無可評估的實際紀錄。"],
                "advice": ["先確認 TrainingPeaks 活動是否完成同步，再依原課表與訓練週期安排執行；不根據缺漏資料補課或加量。"],
                "sports": []}
    analysis = [f"本週已記錄 {r['recorded_hours']:.2f} 小時、{sum(r['sessions'].values())} 次有時間紀錄的三項訓練，分布於 {r['active_days']} 個有活動紀錄的日子。"]
    advice = []
    if r["missing_time_count"]:
        analysis.append(f"另有 {r['missing_time_count']} 筆活動已有里程但缺少實際時間，相關分項與總時數留空，不計完整執行率。")
        advice.append("優先補齊缺漏的實際時間，再判讀本週總量與分項落差。")
    if r["is_partial"]:
        summary = "本週進行中：以截至資料日期的累計表現判讀，不把剩餘課表視為未完成。"
        if r["completion_pct"] is not None:
            analysis.append(f"目前三項時間累計為全週原訂的 {r['completion_pct']:.1f}%；這是進度，不是週末結算執行率。")
        advice.append("剩餘日依原排程與當日主觀恢復調整，避免為追數字集中補量。")
    else:
        summary = "已結束週：對照該週原課表與之前四週的實際時數，辨識執行分配。"
        if r["completion_pct"] is not None:
            analysis.append(f"三項實際時間為原訂 {r['planned_hours']['total']:.2f} 小時的 {r['completion_pct']:.1f}%；時數完成不等同強度或訓練品質達標。")
        else:
            analysis.append("該週沒有有效原訂時數，僅回顧實際完成量，不給出執行率百分比。")
        trend = r["trend_pct"]
        if trend is not None:
            direction = "增加" if trend >= 0 else "減少"
            analysis.append(f"相對之前四週可用資料的平均 {r['previous_four_mean_hours']:.2f} 小時，本週{direction} {abs(trend):.1f}%（使用 {r['previous_four_count']}/4 週）。")
            advice.append("先核對這個量的變化是否符合課表週期，再結合主觀疲勞與完成品質調整下一週；不把時數增減直接當成體能或恢復指標。")
        else:
            analysis.append(f"之前四週僅有 {r['previous_four_count']}/4 週完整時數，近期趨勢資料不足。")
    if low_phase:
        advice.append(f"目前週期為 {phase}：以原訂減量／恢復安排為優先，不以追高時數作為本週目標。")
    else:
        advice.append("下週先維持原課表的規律與分項目的；實際時間少於計畫時，先確認原因，避免把差額全部補回。")
    sport_notes = []
    priorities = {"swim": "維持原訂的水感、動作與穩定划水練習", "bike": "按原課表控制騎乘用力與長騎節奏", "run": "維持規律跑頻與原訂強度分配"}
    for sport, name in (("swim", "游泳"), ("bike", "騎車"), ("run", "跑步")):
        actual, plan = r["hours"][sport], r["planned_hours"][sport]
        fact = f"{name}：實際 {'待補' if actual is None else format(actual, '.2f') + ' 小時'}／原訂 {plan:.2f} 小時；{r['sessions'][sport]} 次，最長一次 {r['longest_hours'][sport]:.2f} 小時。"
        if actual is None:
            note = "實際時間不足，補齊紀錄後再評估分項執行。"
        elif actual == 0:
            note = ("目前未見該分項紀錄；先查是否尚未同步或原本未排課，不能僅據此判定能力退步。")
        elif low_phase:
            note = priorities[sport] + "，依減量週安排收斂總量，不追加補量。"
        elif plan > 0 and actual > plan:
            note = "時數高於原訂；核對是否加課或延長暖收操，下一週先守住課表目的，避免連續疊加時數。"
        elif plan > 0 and actual < plan and not r["is_partial"]:
            note = "時數低於原訂；確認漏課或縮短的原因，" + priorities[sport] + "，不集中補齊時數差額。"
        else:
            note = priorities[sport] + "；以完成品質與後續可恢復性優先。"
        sport_notes.append({"sport": sport, "title": name, "fact": fact, "advice": note})
    return {"summary": summary, "analysis": analysis, "advice": advice, "sports": sport_notes}

def build_weekly_coach_html(review, phase=""):
    messages = coaching_messages(review, phase)
    def items(lines):
        return "".join("<li>" + escape(line) + "</li>" for line in lines)
    cards = "".join(
        '<div class="weekly-coach-sport"><h4>' + escape(row["title"]) + '</h4><p>' +
        escape(row["fact"]) + '</p><p>' + escape(row["advice"]) + '</p></div>'
        for row in messages["sports"]
    )
    return (
        '<section class="section-box weekly-coach-box" id="coachInsightsBox">'
        '<div class="section-title">🧭 教練視角綜合解析與後續建議 · W' + f'{review["week"]:02d}' + '</div>'
        '<p class="weekly-review-note">' + escape(messages["summary"]) + '</p>'
        '<div class="weekly-coach-columns"><div><h4>本週資料判讀</h4><ul>' +
        items(messages["analysis"]) + '</ul></div><div><h4>後續執行建議</h4><ul>' +
        items(messages["advice"]) + '</ul></div></div><div class="weekly-coach-sports">' + cards +
        '</div><p class="weekly-review-note">依該週原課表、已同步時間及此前四週資料整理；不包含未提供的心率、功率、強度或主觀恢復評估。'
        '參考 <a href="https://help.trainingpeaks.com/hc/en-us/articles/204861204-Workout-Card-Overview" target="_blank" rel="noopener">TrainingPeaks 課表與完成資料判讀</a>。'
        '資料日期：' + escape(review["as_of"]) + '。</p></section>'
    )
