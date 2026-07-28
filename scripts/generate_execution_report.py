from __future__ import annotations

import re
import json
import argparse
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(r"C:\Users\User\Desktop\TP")
OUT_DIR = ROOT / "outputs" / "weekly"
CACHE_FILE = ROOT / "data" / "raw" / "calendar_cache.json"

def font(run, size=11, bold=False, color="000000"):
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    fonts = rpr.rFonts
    if fonts is None:
        fonts = OxmlElement("w:rFonts")
        rpr.append(fonts)
    fonts.set(qn("w:ascii"), "Calibri")
    fonts.set(qn("w:hAnsi"), "Calibri")
    fonts.set(qn("w:eastAsia"), "Microsoft JhengHei")

def shade(cell, fill):
    node = OxmlElement("w:shd")
    node.set(qn("w:fill"), fill)
    cell._tc.get_or_add_tcPr().append(node)

def table_geometry(table, widths):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tblpr = table._tbl.tblPr
    tblw = tblpr.first_child_found_in("w:tblW")
    tblw.set(qn("w:w"), str(sum(widths)))
    tblw.set(qn("w:type"), "dxa")
    ind = OxmlElement("w:tblInd")
    ind.set(qn("w:w"), "120")
    ind.set(qn("w:type"), "dxa")
    tblpr.append(ind)
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        node = OxmlElement("w:gridCol")
        node.set(qn("w:w"), str(width))
        grid.append(node)
    for row in table.rows:
        for cell, width in zip(row.cells, widths):
            tcpr = cell._tc.get_or_add_tcPr()
            tcw = tcpr.first_child_found_in("w:tcW")
            tcw.set(qn("w:w"), str(width))
            tcw.set(qn("w:type"), "dxa")
            margins = OxmlElement("w:tcMar")
            for name, value in (("top", 80), ("start", 120), ("bottom", 80), ("end", 120)):
                node = OxmlElement(f"w:{name}")
                node.set(qn("w:w"), str(value))
                node.set(qn("w:type"), "dxa")
                margins.append(node)
            tcpr.append(margins)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def build_report(target_date: date):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Monday of the target week
    monday = target_date - timedelta(days=target_date.weekday())
    sunday = monday + timedelta(days=6)
    week_num = monday.isocalendar().week
    
    # Load cache
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception as e:
            print("Error loading cache:", e)
            
    # Group cached events by date
    week_events = []
    for uid, ev in cache.items():
        ev_date = date.fromisoformat(ev["date"])
        if monday <= ev_date <= sunday:
            orig = ev.get("original_plan", {})
            planned_time = orig.get("planned_time", ev.get("planned_time", 0))
            planned_dist = orig.get("planned_dist", ev.get("planned_dist", 0))
            
            week_events.append({
                "date": ev_date,
                "summary": ev.get("summary", ""),
                "type": ev.get("type", "Other"),
                "planned_time": planned_time,
                "actual_time": ev.get("actual_time", 0),
                "planned_dist": planned_dist,
                "actual_dist": ev.get("actual_dist", 0)
            })
            
    df_week = pd.DataFrame(week_events) if week_events else pd.DataFrame(columns=["date", "summary", "type", "planned_time", "actual_time", "planned_dist", "actual_dist"])
    
    # Calculate stats
    stats_summary = {}
    total_planned_time = 0
    total_actual_time = 0
    
    for t in ["Swim", "Bike", "Run", "Strength"]:
        sub = df_week[df_week["type"] == t] if not df_week.empty else pd.DataFrame()
        pt = sub["planned_time"].sum() if not sub.empty else 0
        at = sub["actual_time"].sum() if not sub.empty else 0
        pd_sum = sub["planned_dist"].sum() if not sub.empty else 0
        ad_sum = sub["actual_dist"].sum() if not sub.empty else 0
        
        total_planned_time += pt
        total_actual_time += at
        
        stats_summary[t] = {
            "planned_time": pt / 60.0,
            "actual_time": at / 60.0,
            "pct_time": (at / pt * 100) if pt > 0 else 0,
            "planned_dist": pd_sum,
            "actual_dist": ad_sum,
            "pct_dist": (ad_sum / pd_sum * 100) if pd_sum > 0 else 0,
            "sessions": len(sub) if not sub.empty else 0
        }
        
    overall_completion = (total_actual_time / total_planned_time * 100) if total_planned_time > 0 else 0
    
    # --- 1. Write Markdown Report ---
    md_path = OUT_DIR / f"{monday.year}-W{week_num:02d}_當週執行率回顧報告.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# 鐵人三項當週訓練執行率回顧報告 (W{week_num:02d})\n\n")
        f.write(f"本報告回顧了當週 (**{monday:%Y-%m-%d}** 至 **{sunday:%Y-%m-%d}**) 的 TrainingPeaks 計畫執行狀況。\n")
        f.write(f"**生成時間**：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | **整體時間執行率**：{overall_completion:.1f}%\n\n")
        
        f.write("## 一、 當週數據統計\n\n")
        f.write("| 運動項目 | 計劃時間 | 實際時間 | 時間執行率 | 計劃距離 | 實際距離 | 距離執行率 | 總堂數 |\n")
        f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n")
        
        for t in ["Swim", "Bike", "Run", "Strength"]:
            s = stats_summary[t]
            t_name = "游泳 (Swim)" if t == "Swim" else "單車 (Bike)" if t == "Bike" else "跑步 (Run)" if t == "Run" else "肌力 (Strength)"
            dist_p_str = f"{s['planned_dist']:.2f} km" if t != "Strength" else "-"
            dist_a_str = f"{s['actual_dist']:.2f} km" if t != "Strength" else "-"
            dist_pct_str = f"{s['pct_dist']:.1f}%" if t != "Strength" and s['planned_dist'] > 0 else "-"
            f.write(f"| {t_name} | {s['planned_time']:.2f} hr | {s['actual_time']:.2f} hr | {s['pct_time']:.1f}% | {dist_p_str} | {dist_a_str} | {dist_pct_str} | {s['sessions']} |\n")
        f.write("\n---\n\n")
        
        f.write("## 二、 每日課表執行明細\n\n")
        f.write("| 日期 | 課表名稱 | 類型 | 計劃時間 | 實際時間 | 計劃距離 | 實際距離 | 狀態 |\n")
        f.write("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n")
        
        # Sort events by date
        sorted_events = sorted(week_events, key=lambda x: x["date"])
        for ev in sorted_events:
            status = "✅ 已完成" if ev["actual_time"] > 0 or ev["actual_dist"] > 0 else "❌ 未執行"
            if ev["type"] == "Day Off":
                status = "休息日"
            dist_p = f"{ev['planned_dist']:.2f} km" if ev["type"] not in ["Strength", "Day Off"] else "-"
            dist_a = f"{ev['actual_dist']:.2f} km" if ev["type"] not in ["Strength", "Day Off"] else "-"
            wday = "一二三四五六日"[ev["date"].weekday()]
            f.write(f"| {ev['date']:%m/%d (週}{wday}) | {ev['summary']} | {ev['type']} | {ev['planned_time']} 分 | {ev['actual_time']} 分 | {dist_p} | {dist_a} | {status} |\n")
            
    print(f"Markdown report generated: {md_path}")
    
    # --- 2. Write DOCX Report ---
    docx_path = OUT_DIR / f"{monday.year}-W{week_num:02d}_當週執行率回顧報告.docx"
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Inches(8.5), Inches(11)
    for attr in ("top_margin", "right_margin", "bottom_margin", "left_margin"):
        setattr(section, attr, Inches(1))
        
    normal = doc.styles["Normal"]
    normal.font.name, normal.font.size = "Calibri", Pt(11)
    normal.paragraph_format.space_after, normal.paragraph_format.line_spacing = Pt(6), 1.25
    
    for name, size, before, after, color in (
        ("Heading 1", 16, 18, 10, "1F4D78"),
        ("Heading 2", 13, 14, 7, "2E74B5"),
    ):
        style = doc.styles[name]
        style.font.name, style.font.size = "Calibri", Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before, style.paragraph_format.space_after = Pt(before), Pt(after)
        
    header = section.header.paragraphs[0]
    header.text = "TrainingPeaks 當週訓練執行率回顧報告"
    font(header.runs[0], 9, False, "666666")
    
    footer = section.footer.paragraphs[0]
    footer.text = f"W{week_num:02d} 執行率報告 | {monday:%Y-%m-%d} ~ {sunday:%Y-%m-%d}"
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    font(footer.runs[0], 9, False, "777777")
    
    # Title
    p_title = doc.add_paragraph()
    font(p_title.add_run(f"當週訓練執行率回顧報告 (W{week_num:02d})"), 22, True, "1F4D78")
    
    p_meta = doc.add_paragraph()
    font(p_meta.add_run(f"週期：{monday:%Y/%m/%d}–{sunday:%Y/%m/%d}　｜　整體時間執行率：{overall_completion:.1f}%"), 10, False, "555555")
    
    doc.add_paragraph("一、 當週數據統計", style="Heading 1")
    table1 = doc.add_table(rows=1, cols=8)
    table1.style = "Table Grid"
    headers1 = ["項目", "計劃時間", "實際時間", "時間執行率", "計劃距離", "實際距離", "距離執行率", "總堂數"]
    for idx, text in enumerate(headers1):
        table1.rows[0].cells[idx].text = text
        shade(table1.rows[0].cells[idx], "1F4D78")
        for p in table1.rows[0].cells[idx].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                font(run, 10, True, "FFFFFF")
                
    for t in ["Swim", "Bike", "Run", "Strength"]:
        s = stats_summary[t]
        cells = table1.add_row().cells
        cells[0].text = "游泳 (Swim)" if t == "Swim" else "單車 (Bike)" if t == "Bike" else "跑步 (Run)" if t == "Run" else "肌力 (Strength)"
        cells[1].text = f"{s['planned_time']:.2f} hr"
        cells[2].text = f"{s['actual_time']:.2f} hr"
        cells[3].text = f"{s['pct_time']:.1f}%"
        cells[4].text = f"{s['planned_dist']:.2f} km" if t != "Strength" else "-"
        cells[5].text = f"{s['actual_dist']:.2f} km" if t != "Strength" else "-"
        cells[6].text = f"{s['pct_dist']:.1f}%" if t != "Strength" else "-"
        cells[7].text = str(s['sessions'])
        
    table_geometry(table1, [1400, 1100, 1100, 1100, 1100, 1100, 1100, 1000])
    for row_idx, row in enumerate(table1.rows):
        if row_idx == 0: continue
        for col_idx, cell in enumerate(row.cells):
            for paragraph in cell.paragraphs:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    font(run, 9.5, False)
                    
    doc.add_paragraph("二、 每日課表執行明細", style="Heading 1")
    table2 = doc.add_table(rows=1, cols=6)
    table2.style = "Table Grid"
    headers2 = ["日期", "課表名稱", "類型", "計畫(時間/距離)", "實際(時間/距離)", "狀態"]
    for idx, text in enumerate(headers2):
        table2.rows[0].cells[idx].text = text
        shade(table2.rows[0].cells[idx], "595959")
        for p in table2.rows[0].cells[idx].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                font(run, 10, True, "FFFFFF")
                
    weekdays_zh = "一二三四五六日"
    for ev in sorted_events:
        cells = table2.add_row().cells
        wday = weekdays_zh[ev["date"].weekday()]
        cells[0].text = f"{ev['date']:%m/%d}\n週{wday}"
        cells[1].text = ev["summary"]
        cells[2].text = ev["type"]
        
        time_p_str = f"{ev['planned_time']}分"
        dist_p_str = f" / {ev['planned_dist']:.2f}km" if ev["type"] not in ["Strength", "Day Off"] and ev["planned_dist"] > 0 else ""
        cells[3].text = f"{time_p_str}{dist_p_str}"
        
        time_a_str = f"{ev['actual_time']}分"
        dist_a_str = f" / {ev['actual_dist']:.2f}km" if ev["type"] not in ["Strength", "Day Off"] and ev["actual_dist"] > 0 else ""
        cells[4].text = f"{time_a_str}{dist_a_str}"
        
        status = "✅ 已完成" if ev["actual_time"] > 0 or ev["actual_dist"] > 0 else "❌ 未執行"
        if ev["type"] == "Day Off":
            status = "休息日"
        cells[5].text = status
        
    table_geometry(table2, [1100, 3100, 1100, 1600, 1600, 1160])
    for row_idx, row in enumerate(table2.rows):
        if row_idx == 0: continue
        for col_idx, cell in enumerate(row.cells):
            for paragraph in cell.paragraphs:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    font(run, 9.5, False)
                    
    doc.save(docx_path)
    print(f"DOCX report generated: {docx_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="指定日期 YYYY-MM-DD，預設為今日")
    parser.add_argument("--current-week", action="store_true", help="強制以今日所在的當週計算執行率")
    args = parser.parse_args()
    
    if args.current_week:
        anchor = date.today()
    elif args.date:
        anchor = date.fromisoformat(args.date)
    else:
        anchor = date.today()
        if anchor.weekday() in (0, 1, 2):  # Mon, Tue, Wed
            anchor = anchor - timedelta(days=anchor.weekday() + 1)  # Target last Sunday

    # Automatically sync first
    try:
        from sync_calendar import sync
        print("Syncing calendar before generating report...")
        sync()
    except Exception as e:
        print("Calendar sync skipped or failed:", e)
        
    build_report(anchor)

if __name__ == "__main__":
    main()
