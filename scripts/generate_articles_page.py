from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(r"C:\Users\User\Desktop\TP")
OUTPUT_DIR = ROOT / "outputs"
WEEKLY_DIR = OUTPUT_DIR / "weekly"
OUT_ARTICLES_HTML = OUTPUT_DIR / "weekly_articles.html"

def md_link_to_html(text: str) -> str:
    """Converts markdown links [title](url) to HTML <a href="url" target="_blank">title ↗</a>."""
    if not text:
        return ""
    pattern = r"\[([^\]]+)\]\((https?://[^\)]+)\)"
    replacement = r'<a href="\2" target="_blank" class="ext-link">\1 <span class="ext-icon">↗</span></a>'
    return re.sub(pattern, replacement, text)

def get_cat_id(cat_name: str) -> str:
    if "游泳" in cat_name or "Swim" in cat_name:
        return "swim"
    elif "騎車" in cat_name or "Bike" in cat_name or "Cycling" in cat_name:
        return "bike"
    elif "跑步" in cat_name or "Run" in cat_name:
        return "run"
    elif "補給" in cat_name or "Recovery" in cat_name or "Fueling" in cat_name:
        return "recovery"
    return "general"

def convert_md_to_full_html_articles(md_content: str, week_num: int, year: int) -> str:
    """Parses weekly articles Markdown into a beautiful standalone HTML web page with sticky quick jump navigation."""
    lines = md_content.split("\n")
    
    current_cat = "一般"
    articles_by_cat = {}
    summary_lines = []
    is_in_summary = False

    for line in lines:
        stripped = line.strip()
        if "五、 當週各項運動新知綜合整理重點" in stripped:
            is_in_summary = True
            continue

        if is_in_summary:
            summary_lines.append(line)
            continue

        if stripped.startswith("## ") and not stripped.startswith("## 目錄"):
            cat_name = stripped[3:].strip()
            cat_name = re.sub(r'<a name="[^"]*"></a>', '', cat_name).strip()
            current_cat = cat_name
            if current_cat not in articles_by_cat:
                articles_by_cat[current_cat] = []
        elif stripped.startswith("### 🔗 ") or stripped.startswith("### "):
            title_text = stripped[4:].strip() if stripped.startswith("### 🔗 ") else stripped[4:].strip()
            articles_by_cat.setdefault(current_cat, []).append({
                "title_raw": title_text,
                "meta": "",
                "desc": ""
            })
        elif stripped.startswith("**來源**:") or stripped.startswith("**英文原名**:"):
            if current_cat in articles_by_cat and articles_by_cat[current_cat]:
                articles_by_cat[current_cat][-1]["meta"] += f"<br>{stripped}"
        elif stripped.startswith("> "):
            if current_cat in articles_by_cat and articles_by_cat[current_cat]:
                articles_by_cat[current_cat][-1]["desc"] += f" {stripped[2:]}"

    summary_html = ""
    if summary_lines:
        raw_sum = "\n".join(summary_lines)
        summary_html = md_link_to_html(raw_sum)
        summary_html = summary_html.replace("### ", "<h3 style='color:#38BDF8; margin-top:16px; margin-bottom:8px;'>").replace("\n", "<br>")

    articles_cards_html = ""
    for cat, arts in articles_by_cat.items():
        if not arts:
            continue
        cat_id = get_cat_id(cat)
        articles_cards_html += f"""
        <div class="cat-group">
            <h2 class="cat-header" id="{cat_id}">{cat} ({len(arts)} 篇)</h2>
            <div class="articles-grid">"""
        for art in arts:
            title_html = md_link_to_html(art["title_raw"])
            meta_html = md_link_to_html(art["meta"])
            desc_text = art["desc"].strip()

            match = re.search(r"https?://[^\)]+", art["title_raw"])
            url = match.group(0) if match else "#"

            articles_cards_html += f"""
                <div class="art-card">
                    <div class="art-title">{title_html}</div>
                    <div class="art-meta">{meta_html}</div>
                    <div class="art-desc">
                        <div style="font-weight: 700; color: var(--accent-cyan); font-size: 0.82rem; margin-bottom: 6px;">💡 【100字繁體中文重點摘要】</div>
                        {desc_text if desc_text else '點擊下方連結可閱讀外網原始全文內容。'}
                    </div>
                    <div class="art-footer">
                        <a href="{url}" target="_blank" class="art-btn">🔗 閱讀外網原始文章 ↗</a>
                    </div>
                </div>"""
        articles_cards_html += """
            </div>
        </div>"""

    full_page_html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>當週鐵人新知與運動科學綜合整理 (W{week_num:02d})</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-primary: #0F172A;
            --bg-card: #1E293B;
            --bg-card-hover: #334155;
            --accent-cyan: #06B6D4;
            --accent-blue: #3B82F6;
            --accent-green: #10B981;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
            --border-color: #334155;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        html {{ scroll-behavior: smooth; }}
        body {{
            font-family: 'Inter', 'Noto Sans TC', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-main);
            line-height: 1.6;
            padding: 30px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .top-header {{
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 28px 36px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }}
        .top-header h1 {{
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(90deg, #38BDF8, #818CF8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .top-header .sub {{
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-top: 6px;
        }}
        .btn-back {{
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
            color: #FFF;
            padding: 10px 18px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
            transition: transform 0.2s;
        }}
        .btn-back:hover {{ transform: translateY(-2px); }}

        /* STICKY QUICK JUMP NAV BAR */
        .nav-quick-bar {{
            position: sticky;
            top: 15px;
            z-index: 100;
            background: rgba(30, 41, 59, 0.92);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 14px;
            padding: 12px 20px;
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
            overflow-x: auto;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }}
        .nav-label {{
            font-size: 0.85rem;
            font-weight: 700;
            color: #38BDF8;
            white-space: nowrap;
        }}
        .nav-chip {{
            padding: 7px 14px;
            border-radius: 20px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 700;
            white-space: nowrap;
            transition: all 0.2s ease;
            border: 1px solid var(--border-color);
        }}
        .chip-summary {{ background: rgba(56, 189, 248, 0.15); color: #38BDF8; border-color: rgba(56, 189, 248, 0.4); }}
        .chip-swim {{ background: rgba(6, 182, 212, 0.15); color: #22D3EE; border-color: rgba(6, 182, 212, 0.4); }}
        .chip-bike {{ background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-color: rgba(59, 130, 246, 0.4); }}
        .chip-run {{ background: rgba(245, 158, 11, 0.15); color: #FBBF24; border-color: rgba(245, 158, 11, 0.4); }}
        .chip-recovery {{ background: rgba(16, 185, 129, 0.15); color: #34D399; border-color: rgba(16, 185, 129, 0.4); }}
        .nav-chip:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        }}

        /* SUMMARY BOX */
        .summary-box {{
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 32px;
            box-shadow: 0 4px 24px rgba(6, 182, 212, 0.15);
            scroll-margin-top: 90px;
        }}
        .summary-box h2 {{
            font-size: 1.35rem;
            color: #38BDF8;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        /* CATEGORY & ARTICLES GRID */
        .cat-group {{
            margin-bottom: 36px;
        }}
        .cat-header {{
            font-size: 1.3rem;
            color: #38BDF8;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
            scroll-margin-top: 90px;
        }}
        .articles-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 20px;
        }}
        .art-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.2s ease;
        }}
        .art-card:hover {{
            border-color: var(--accent-cyan);
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }}
        .art-title {{
            font-size: 1.1rem;
            font-weight: 700;
            color: #F8FAFC;
            margin-bottom: 10px;
            line-height: 1.4;
        }}
        .art-title a {{
            color: #38BDF8;
            text-decoration: none;
            transition: color 0.2s;
        }}
        .art-title a:hover {{ color: var(--accent-cyan); text-decoration: underline; }}
        .art-meta {{
            font-size: 0.82rem;
            color: var(--text-muted);
            margin-bottom: 12px;
            line-height: 1.5;
        }}
        .art-desc {{
            font-size: 0.9rem;
            color: #CBD5E1;
            background: rgba(15, 23, 42, 0.5);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            flex: 1;
            line-height: 1.6;
        }}
        .art-footer {{
            display: flex;
            justify-content: flex-end;
        }}
        .art-btn {{
            background: rgba(6, 182, 212, 0.15);
            border: 1px solid rgba(6, 182, 212, 0.4);
            color: var(--accent-cyan);
            padding: 8px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }}
        .art-btn:hover {{
            background: var(--accent-cyan);
            color: #0F172A;
        }}
        .ext-link {{
            color: #38BDF8;
            text-decoration: none;
        }}
        .ext-link:hover {{
            text-decoration: underline;
        }}
        .ext-icon {{
            font-size: 0.8em;
            color: var(--accent-cyan);
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="top-header">
            <div>
                <h1>當週鐵人新知與運動科學綜合整理 (W{week_num:02d})</h1>
                <div class="sub">彙整權威網站：Slowtwitch, Triathlete, 220 Triathlon, TrainingPeaks, Joe Friel | 附外網原始連結</div>
            </div>
            <a href="index.html" class="btn-back">⬅️ 返回 52 週儀表板主頁</a>
        </div>

        <!-- STICKY QUICK JUMP NAV BAR -->
        <div class="nav-quick-bar">
            <span class="nav-label">⚡ 快速導覽：</span>
            {f'<a href="#summary" class="nav-chip chip-summary">🌟 綜合重點 SUMMARY</a>' if summary_html else ''}
            <a href="#swim" class="nav-chip chip-swim">🏊 游泳 SWIM</a>
            <a href="#bike" class="nav-chip chip-bike">🚴 騎車 BIKE</a>
            <a href="#run" class="nav-chip chip-run">🏃 跑步 RUN</a>
            <a href="#recovery" class="nav-chip chip-recovery">🥗 補給及恢復 RECOVERY</a>
        </div>

        {f'<div class="summary-box" id="summary"><h2>🌟 五、 當週各項運動新知綜合整理重點</h2><div>{summary_html}</div></div>' if summary_html else ''}

        {articles_cards_html}
    </div>
</body>
</html>
"""
    OUT_ARTICLES_HTML.write_text(full_page_html, encoding="utf-8")
    print("Standalone weekly articles web page with sticky quick jump nav generated at:", OUT_ARTICLES_HTML)

def generate_current_articles_page():
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    w_num = monday.isocalendar().week
    art_file = WEEKLY_DIR / f"2026-W{w_num:02d}_當週鐵人新知與文章整理_中文版.md"
    if art_file.exists():
        md_text = art_file.read_text(encoding="utf-8")
        convert_md_to_full_html_articles(md_text, w_num, today.year)
    else:
        print("Weekly articles MD file not found:", art_file)

if __name__ == "__main__":
    generate_current_articles_page()
