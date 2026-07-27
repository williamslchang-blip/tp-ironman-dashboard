from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from pathlib import Path
import sys

ROOT = Path(r"C:\Users\User\Desktop\TP")
if str(ROOT / "scripts") not in sys.path:
    sys.path.append(str(ROOT / "scripts"))

from estimator_226 import calculate_dynamic_226_estimate

CACHE_FILE = ROOT / "data" / "raw" / "calendar_cache.json"
OUT_INDEX = ROOT / "outputs" / "index.html"
WEEKLY_DIR = ROOT / "outputs" / "weekly"
WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

def simple_md_to_html(md_text: str) -> str:
    """Converts basic Markdown syntax (headings, bold, lists, tables) into clean HTML."""
    if not md_text:
        return "<p style='color: var(--text-muted);'>尚無詳細內容</p>"

    lines = md_text.split("\n")
    html_lines = []
    in_table = False
    table_has_header = False

    for line in lines:
        stripped = line.strip()

        # Table processing
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            if all(set(c).issubset({"-", ":", " "}) for c in cells):
                # Separator line
                continue
            
            if not in_table:
                in_table = True
                html_lines.append('<table class="table-custom">')
                html_lines.append('<thead><tr>' + ''.join(f'<th>{c}</th>' for c in cells) + '</tr></thead><tbody>')
            else:
                html_lines.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cells) + '</tr>')
            continue
        elif in_table:
            in_table = False
            html_lines.append('</tbody></table>')

        # Convert Markdown links [text](url) to HTML <a href="url" target="_blank">text ↗</a>
        line_processed = re.sub(
            r"\[([^\]]+)\]\((https?://[^\)]+)\)",
            r'<a href="\2" target="_blank" style="color:#38BDF8; font-weight:700; text-decoration:none;">\1 <span style="font-size:0.8em; color:var(--accent-cyan);">↗</span></a>',
            stripped
        )

        # Headings
        if line_processed.startswith("### "):
            html_lines.append(f'<h3 style="color:#38BDF8; margin-top:20px; margin-bottom:8px;">{line_processed[4:]}</h3>')
        elif line_processed.startswith("## "):
            html_lines.append(f'<h2 style="color:#38BDF8; margin-top:24px; margin-bottom:12px; border-bottom: 1px solid var(--border-color); padding-bottom:6px;">{line_processed[3:]}</h2>')
        elif line_processed.startswith("# "):
            html_lines.append(f'<h1 style="color:#F8FAFC; margin-top:28px; margin-bottom:14px; font-size:1.5rem;">{line_processed[2:]}</h1>')
        # Lists
        elif line_processed.startswith("- ") or line_processed.startswith("* "):
            content = line_processed[2:]
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            html_lines.append(f'<li style="margin-left:20px; margin-bottom:6px; color:var(--text-main);">{content}</li>')
        elif line_processed.startswith("1. ") or line_processed.startswith("2. ") or line_processed.startswith("3. "):
            content = line_processed[3:]
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            html_lines.append(f'<div style="margin-left:12px; margin-bottom:6px;"><strong>{line_processed[:2]}</strong> {content}</div>')
        elif line_processed.startswith("> "):
            html_lines.append(f'<blockquote style="background:rgba(6,182,212,0.1); border-left:4px solid var(--accent-cyan); padding:10px 14px; margin:12px 0; border-radius:4px; font-size:0.9rem;">{line_processed[2:]}</blockquote>')
        elif line_processed == "---":
            html_lines.append('<hr style="border:none; border-top:1px solid var(--border-color); margin:20px 0;">')
        elif line_processed:
            text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", line_processed)
            html_lines.append(f'<p style="margin-bottom:10px; color:var(--text-main);">{text}</p>')

    if in_table:
        html_lines.append('</tbody></table>')

    return "\n".join(html_lines)


def load_cache():
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("Error loading cache:", e)
    return {}


def generate_52_week_dashboard():
    today = date.today()
    current_year = today.year
    current_week_num = today.isocalendar().week

    cache = load_cache()

    cache_by_week = {}
    for uid, ev in cache.items():
        try:
            ev_date = date.fromisoformat(ev["date"])
            w_num = ev_date.isocalendar().week
            if w_num not in cache_by_week:
                cache_by_week[w_num] = []
            cache_by_week[w_num].append(ev)
        except Exception:
            pass

    weeks_data = {}
    for w in range(1, 53):
        try:
            w_monday = date.fromisocalendar(current_year, w, 1)
        except ValueError:
            continue
        w_sunday = w_monday + timedelta(days=6)

        events = cache_by_week.get(w, [])

        swim_dist = sum(ev.get("actual_dist", 0) for ev in events if ev.get("type") == "Swim")
        bike_dist = sum(ev.get("actual_dist", 0) for ev in events if ev.get("type") == "Bike")
        run_dist = sum(ev.get("actual_dist", 0) for ev in events if ev.get("type") == "Run")

        planned_time = sum(ev.get("original_plan", {}).get("planned_time", ev.get("planned_time", 0)) for ev in events)
        actual_time = sum(ev.get("actual_time", 0) for ev in events)
        exec_rate = (actual_time / planned_time * 100) if planned_time > 0 else 0.0

        if w < current_week_num:
            status_tag = "Past"
            status_label = "已完成"
            phase = "Base / Build" if w <= 20 else "Peak Phase"
        elif w == current_week_num:
            status_tag = "Current"
            status_label = "本週進行中"
            phase = "Base 1-3"
        else:
            status_tag = "Future"
            status_label = "預計計畫"
            if w in range(32, 35):
                phase = "Build 2"
            elif w in range(35, 38):
                phase = "Peak 1"
            elif w in range(38, 41):
                phase = "Big Brick Peak"
            elif w in range(41, 44):
                phase = "Taper Phase"
            elif w == 44:
                phase = "Ironman Race Week 🏆"
            else:
                phase = "Off-Season / Maintenance"

        # Read reports content if available
        art_md_file = WEEKLY_DIR / f"2026-W{w:02d}_當週鐵人新知與文章整理_中文版.md"
        art_html = simple_md_to_html(art_md_file.read_text(encoding="utf-8")) if art_md_file.exists() else "<p style='color:var(--text-muted);'>該週尚未產生鐵人新知報告</p>"

        rev_md_file = WEEKLY_DIR / f"2026-W{w:02d}_當週執行率回顧報告.md"
        rev_html = simple_md_to_html(rev_md_file.read_text(encoding="utf-8")) if rev_md_file.exists() else "<p style='color:var(--text-muted);'>該週執行率回顧報告將於週日晚上自動結算生成</p>"

        daily_schedule = []
        curr_d = w_monday
        while curr_d <= w_sunday:
            day_events = [ev for ev in events if ev.get("date") == str(curr_d)]
            day_text_list = [ev.get("summary", "") for ev in day_events]
            summary_str = " ＋ ".join(day_text_list) if day_text_list else "未排定"
            
            day_name = WEEKDAYS[curr_d.weekday()]
            strength_str = "不排肌力；專注完成主課。"
            if curr_d.weekday() == 0:
                strength_str = "主課 A/B (30–40 分鐘)；保留 2–3 下餘裕。"
            elif "Swim" in summary_str:
                strength_str = "短課 (15–20 分鐘)；游泳後或晚間執行。"
            elif "Rest" in summary_str or "Day Off" in summary_str:
                strength_str = "全身滾筒與活動度拉伸。"

            daily_schedule.append({
                "date": f"{curr_d:%m/%d}",
                "day_name": f"週{day_name}",
                "summary": summary_str,
                "strength": strength_str
            })
            curr_d += timedelta(days=1)

        est_snap = calculate_dynamic_226_estimate(w_monday)

        weeks_data[w] = {
            "week_num": w,
            "monday": f"{w_monday:%Y/%m/%d}",
            "sunday": f"{w_sunday:%Y/%m/%d}",
            "date_range": f"{w_monday:%m/%d} – {w_sunday:%m/%d}",
            "status_tag": status_tag,
            "status_label": status_label,
            "phase": phase,
            "exec_rate": round(exec_rate, 1),
            "actual_time_hrs": round(actual_time / 60.0, 1),
            "planned_time_hrs": round(planned_time / 60.0, 1),
            "swim_km": round(swim_dist, 2),
            "bike_km": round(bike_dist, 2),
            "run_km": round(run_dist, 2),
            "daily_schedule": daily_schedule,
            "estimator": est_snap,
            "art_html": art_html,
            "rev_html": rev_html,
            "docx_strength": f"2026-W{w:02d}_第{w}週肌力訓練計畫.docx",
            "docx_articles": f"2026-W{w:02d}_當週鐵人新知與文章整理_中文版.docx",
            "docx_review": f"2026-W{w:02d}_當週執行率回顧報告.docx"
        }

    weeks_json_str = json.dumps(weeks_data, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrainingPeaks 52 週運動自動化全景儀表板 (網頁版內容閱覽)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-primary: #0F172A;
            --bg-sidebar: #1E293B;
            --bg-card: #1E293B;
            --bg-card-hover: #334155;
            --accent-cyan: #06B6D4;
            --accent-blue: #3B82F6;
            --accent-green: #10B981;
            --accent-orange: #F59E0B;
            --accent-red: #EF4444;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
            --border-color: #334155;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Inter', 'Noto Sans TC', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }}
        /* SIDEBAR */
        .sidebar {{
            width: 330px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }}
        .sidebar-header {{
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            background: linear-gradient(135deg, #1E293B, #0F172A);
        }}
        .sidebar-header h1 {{
            font-size: 1.2rem;
            font-weight: 800;
            background: linear-gradient(90deg, #38BDF8, #818CF8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .sidebar-header .sub {{ font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; }}
        .sidebar-controls {{ padding: 10px 16px; border-bottom: 1px solid var(--border-color); }}
        .btn-current {{
            width: 100%;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
            color: #FFF;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
        }}
        .week-list {{ flex: 1; overflow-y: auto; padding: 10px; }}
        .week-item {{
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 6px;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .week-item:hover {{ background: var(--bg-card-hover); }}
        .week-item.active {{
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
            border-color: var(--accent-cyan);
        }}
        .week-title {{ font-weight: 700; font-size: 0.9rem; }}
        .week-dates {{ font-size: 0.75rem; color: var(--text-muted); }}
        .badge-status {{ font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }}
        .badge-past {{ background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.3); }}
        .badge-current {{ background: rgba(6, 182, 212, 0.25); color: #38BDF8; border: 1px solid #38BDF8; }}
        .badge-future {{ background: rgba(148, 163, 184, 0.15); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.3); }}

        /* MAIN CONTENT */
        .main-content {{
            flex: 1;
            overflow-y: auto;
            padding: 24px 32px;
        }}
        .main-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--border-color);
        }}
        .subnav-tabs {{
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 8px;
        }}
        .subtab-btn {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.88rem;
            transition: all 0.2s ease;
        }}
        .subtab-btn:hover, .subtab-btn.active {{
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
            color: #FFF;
            border-color: transparent;
        }}
        .subtab-view {{ display: none; }}
        .subtab-view.active {{ display: block; animation: fadeIn 0.25s ease-in-out; }}
        @keyframes fadeIn {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}

        .grid-kpi {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 14px;
            margin-bottom: 20px;
        }}
        .kpi-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 14px 18px;
        }}
        .kpi-title {{ font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }}
        .kpi-val {{ font-size: 1.5rem; font-weight: 800; margin-top: 4px; }}

        .section-box {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 22px;
            margin-bottom: 20px;
        }}
        .section-title {{
            font-size: 1.1rem;
            font-weight: 700;
            color: #38BDF8;
            margin-bottom: 14px;
        }}
        .table-custom {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.92rem;
            margin-top: 8px;
        }}
        .table-custom th, .table-custom td {{
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }}
        .table-custom th {{
            background: rgba(51, 65, 85, 0.5);
            color: #94A3B8;
            font-weight: 600;
        }}
        .target-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 10px;
        }}
        .target-card {{ border-radius: 10px; padding: 12px; border: 1px solid var(--border-color); }}
        .target-opt {{ background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.4); }}
        .target-neu {{ background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.4); }}
        .target-con {{ background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.4); }}
        .target-tag {{ font-weight: 700; font-size: 0.82rem; margin-bottom: 4px; }}
        .target-opt .target-tag {{ color: var(--accent-green); }}
        .target-neu .target-tag {{ color: var(--accent-orange); }}
        .target-con .target-tag {{ color: var(--accent-red); }}
        .target-time {{ font-size: 1.25rem; font-weight: 800; }}
        .downloads {{ display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }}
        .btn-dl {{
            background: rgba(51, 65, 85, 0.6);
            border: 1px solid var(--border-color);
            color: #38BDF8;
            padding: 8px 12px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 600;
        }}
        .btn-dl:hover {{ background: var(--accent-blue); color: #FFF; }}
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <h1>TrainingPeaks 52 週網頁版儀表板</h1>
            <div class="sub">全網頁內容即時閱讀 & 地端資料分析</div>
        </div>
        <div class="sidebar-controls">
            <button class="btn-current" onclick="selectWeek({current_week_num})">🎯 跳至本週 (W{current_week_num:02d})</button>
        </div>
        <div class="week-list" id="weekList"></div>
    </div>

    <div class="main-content" id="mainContent"></div>

    <script>
        const WEEKS_DATA = {weeks_json_str};
        const CURRENT_WEEK = {current_week_num};
        let selectedWeekNum = CURRENT_WEEK;

        function renderSidebar() {{
            const listEl = document.getElementById('weekList');
            listEl.innerHTML = '';

            for (let w = 1; w <= 52; w++) {{
                const data = WEEKS_DATA[w];
                if (!data) continue;

                const item = document.createElement('div');
                item.className = `week-item ${{w === selectedWeekNum ? 'active' : ''}}`;
                item.onclick = () => selectWeek(w);

                let badgeClass = 'badge-future';
                if (data.status_tag === 'Past') badgeClass = 'badge-past';
                if (data.status_tag === 'Current') badgeClass = 'badge-current';

                item.innerHTML = `
                    <div>
                        <div class="week-title">第 ${{w}} 週 (W${{String(w).padStart(2, '0')}})</div>
                        <div class="week-dates">${{data.date_range}} | ${{data.phase}}</div>
                    </div>
                    <span class="badge-status ${{badgeClass}}">${{data.status_label}}</span>
                `;
                listEl.appendChild(item);
            }}
        }}

        function selectWeek(wNum) {{
            selectedWeekNum = wNum;
            renderSidebar();
            renderMainContent(wNum);
        }}

        function openSubtab(tabName) {{
            document.querySelectorAll('.subtab-view').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.subtab-btn').forEach(el => el.classList.remove('active'));
            
            document.getElementById('subview-' + tabName).classList.add('active');
            event.currentTarget.classList.add('active');
        }}

        function renderMainContent(wNum) {{
            const data = WEEKS_DATA[wNum];
            const mainEl = document.getElementById('mainContent');
            if (!data) return;

            const est = data.estimator;
            const bench = est.benchmark_comparison;
            const forms = est.formulas;

            let scheduleRowsHtml = '';
            data.daily_schedule.forEach(item => {{
                scheduleRowsHtml += `
                    <tr>
                        <td><strong>${{item.date}} (${{item.day_name}})</strong></td>
                        <td style="color: var(--accent-cyan);">${{item.summary}}</td>
                        <td>${{item.strength}}</td>
                    </tr>
                `;
            }});

            mainEl.innerHTML = `
                <div class="main-header">
                    <div>
                        <h2 style="font-size: 1.5rem;">第 ${{data.week_num}} 週訓練報告與內容 (W${{String(data.week_num).padStart(2, '0')}})</h2>
                        <div style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
                            週期：${{data.monday}} – ${{data.sunday}} ｜ 階段：<strong style="color: #38BDF8;">${{data.phase}}</strong>
                        </div>
                    </div>
                    <span class="badge-status ${{data.status_tag === 'Current' ? 'badge-current' : data.status_tag === 'Past' ? 'badge-past' : 'badge-future'}}" style="font-size: 0.85rem; padding: 5px 12px;">
                        ${{data.status_label}}
                    </span>
                </div>

                <!-- SUBNAV TABS FOR ONLINE READING -->
                <div class="subnav-tabs">
                    <button class="subtab-btn active" onclick="openSubtab('overview')">📊 當週總覽 & 226 預估</button>
                    <button class="subtab-btn" onclick="openSubtab('plan')">🏋️ 當週課表與肌力計畫 (網頁線上版)</button>
                    <button class="subtab-btn" onclick="openSubtab('articles')">📰 當週鐵人新知 (網頁線上版)</button>
                    <button class="subtab-btn" onclick="openSubtab('review')">📈 當週執行率回顧 (網頁線上版)</button>
                    <button class="subtab-btn" onclick="openSubtab('files')">📄 原始 Word 檔案</button>
                </div>

                <!-- SUBTAB 1: OVERVIEW -->
                <div id="subview-overview" class="subtab-view active">
                    <div class="grid-kpi">
                        <div class="kpi-card">
                            <div class="kpi-title">訓練時間完成率</div>
                            <div class="kpi-val" style="color: ${{data.exec_rate >= 80 ? 'var(--accent-green)' : 'var(--accent-orange)'}};">
                                ${{data.exec_rate}}%
                            </div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                                實際 ${{data.actual_time_hrs}}h / 計畫 ${{data.planned_time_hrs}}h
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">跑步累計里程</div>
                            <div class="kpi-val">${{data.run_km}} km</div>
                            <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-top: 4px;">滾動均量 ${{est.rolling_4w_avg_run_km}} km/週</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">單車累計里程</div>
                            <div class="kpi-val">${{data.bike_km}} km</div>
                            <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-top: 4px;">滾動均量 ${{est.rolling_4w_avg_bike_km}} km/週</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">游泳累計里程</div>
                            <div class="kpi-val">${{data.swim_km}} km</div>
                            <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-top: 4px;">滾動均量 ${{est.rolling_4w_avg_swim_km}} km/週</div>
                        </div>
                    </div>

                    <div class="section-box">
                        <div class="section-title">🔮 IM226 滾動動態完賽時間預估 (該週數據試算)</div>
                        <div class="target-grid">
                            <div class="target-card target-opt">
                                <div class="target-tag">🟢 樂觀目標 (高峰發揮 / 無抽筋)</div>
                                <div class="target-time">${{est.optimistic_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">預估中位數：${{est.optimistic_mid}}</div>
                            </div>
                            <div class="target-card target-neu">
                                <div class="target-tag">🟠 中性目標 (穩定配速完賽)</div>
                                <div class="target-time">${{est.neutral_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">預估中位數：${{est.neutral_mid}}</div>
                            </div>
                            <div class="target-card target-con">
                                <div class="target-tag">🔴 保守目標 (後半程馬拉松掉速/抽筋)</div>
                                <div class="target-time">${{est.conservative_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">預估中位數：${{est.conservative_mid}}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SUBTAB 2: PLAN & STRENGTH -->
                <div id="subview-plan" class="subtab-view">
                    <div class="section-box">
                        <div class="section-title">🏋️ 第 ${{data.week_num}} 週 TrainingPeaks 課表與肌力整合內容</div>
                        <table class="table-custom">
                            <thead>
                                <tr>
                                    <th style="width: 140px;">日期</th>
                                    <th>TrainingPeaks 課表內容</th>
                                    <th>肌力與備忘安排</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${{scheduleRowsHtml}}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SUBTAB 3: ARTICLES ONLINE READ -->
                <div id="subview-articles" class="subtab-view">
                    <div class="section-box" style="line-height: 1.8;">
                        <div style="margin-bottom: 16px;">
                            <a href="weekly_articles.html" target="_blank" class="btn-dl" style="background:linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); color:#FFF; font-size:0.92rem; font-weight:700; padding:10px 18px; display:inline-block;">📰 開啟當週鐵人新知與綜合整理重點獨立網頁 ↗</a>
                        </div>
                        <div class="section-title">📰 第 ${{data.week_num}} 週鐵人新知與權威文章（繁體中文網頁線上閱讀）</div>
                        <div>${{data.art_html}}</div>
                    </div>
                </div>

                <!-- SUBTAB 4: REVIEW ONLINE READ -->
                <div id="subview-review" class="subtab-view">
                    <div class="section-box" style="line-height: 1.8;">
                        <div class="section-title">📈 第 ${{data.week_num}} 週訓練執行率回顧（網頁線上閱讀）</div>
                        <div>${{data.rev_html}}</div>
                    </div>
                </div>

                <!-- SUBTAB 5: DOCX FILES -->
                <div id="subview-files" class="subtab-view">
                    <div class="section-box">
                        <div class="section-title">📄 地端原始 Word 檔案與備份</div>
                        <div class="downloads">
                            <a href="weekly/${{data.docx_strength}}" class="btn-dl" target="_blank">📥 下載肌力計畫 Word 檔 (${{data.docx_strength}})</a>
                            <a href="weekly/${{data.docx_articles}}" class="btn-dl" target="_blank">📥 下載鐵人新知 Word 檔 (${{data.docx_articles}})</a>
                            <a href="weekly/${{data.docx_review}}" class="btn-dl" target="_blank">📥 下載執行率回顧 Word 檔 (${{data.docx_review}})</a>
                        </div>
                    </div>
                </div>
            `;
        }}

        renderSidebar();
        renderMainContent(CURRENT_WEEK);
    </script>
</body>
</html>
"""

    OUT_INDEX.write_text(html, encoding="utf-8")
    print("Full Web-Native 52-Week Dashboard generated successfully at:", OUT_INDEX)

    try:
        from generate_articles_page import generate_current_articles_page
        generate_current_articles_page()
    except Exception as e:
        print("Could not generate standalone articles page:", e)

if __name__ == "__main__":
    generate_52_week_dashboard()
