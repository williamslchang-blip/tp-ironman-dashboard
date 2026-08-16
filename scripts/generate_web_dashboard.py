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
from generate_articles_page import parse_articles_md_to_body_html

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

            processed_cells = []
            for c in cells:
                c_proc = re.sub(r"\[([^\]]+)\]\((https?://[^\)]+)\)", r'<a href="\2" target="_blank" style="color:#38BDF8; font-weight:700; text-decoration:none; background:rgba(56,189,248,0.12); padding:4px 10px; border-radius:6px; border:1px solid rgba(56,189,248,0.3); display:inline-block; font-size:0.85rem;">\1 ↗</a>', c)
                c_proc = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", c_proc)
                processed_cells.append(c_proc)
            
            if not in_table:
                in_table = True
                html_lines.append('<table class="table-custom">')
                html_lines.append('<thead><tr>' + ''.join(f'<th>{c}</th>' for c in processed_cells) + '</tr></thead><tbody>')
            else:
                html_lines.append('<tr>' + ''.join(f'<td>{c}</td>' for c in processed_cells) + '</tr>')
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


def build_daily_feedback_cards(events):
    completed = [ev for ev in events if ev.get("actual_time", 0) > 0 or ev.get("actual_dist", 0) > 0]
    completed.sort(key=lambda x: (x.get("date", ""), x.get("type", "")), reverse=True)
    
    if not completed:
        return "<p style='color:var(--text-muted); font-size:0.88rem; margin-top:6px;'>當週尚無已執行完畢之課表紀錄。系統將於您完成 TrainingPeaks 課表並上傳更新後，自動顯示個別訓練成果建議與注意事項。</p>"
        
    cards_html = []
    weekdays_zh = "一二三四五六日"
    
    for ev in completed:
        try:
            ev_date = date.fromisoformat(ev["date"])
            wday_str = weekdays_zh[ev_date.weekday()]
            date_disp = f"{ev_date:%m/%d} (週{wday_str})"
        except Exception:
            date_disp = ev.get("date", "")
            
        t = ev.get("type", "Other")
        summary = ev.get("summary", "")
        at = ev.get("actual_time", 0)
        pt = ev.get("original_plan", {}).get("planned_time", ev.get("planned_time", 0))
        ad = ev.get("actual_dist", 0)
        pd = ev.get("original_plan", {}).get("planned_dist", ev.get("planned_dist", 0))
        speed = ev.get("speed", 0.0)
        pace = ev.get("pace", "")
        
        icon = "🚴‍♂️" if t == "Bike" else "🏃‍♂️" if t == "Run" else "🏊‍♂️" if t == "Swim" else "🏋️‍♂️" if t == "Strength" else "📌"
        color = "#38BDF8" if t == "Bike" else "#F59E0B" if t == "Run" else "#22D3EE" if t == "Swim" else "#10B981"
        
        pct_str = f"完成率 {(at/pt*100):.0f}%" if pt > 0 else "已紀錄完成"
        
        metrics_parts = []
        metrics_parts.append(f"⏱️ 實際時間：<strong>{at:.0f} 分 ({(at/60.0):.2f} hr)</strong>")
        if ad > 0:
            metrics_parts.append(f"📏 實際距離：<strong>{ad:.2f} km</strong>")
        if speed > 0 and t == "Bike":
            metrics_parts.append(f"⚡ 平均時速：<strong>{speed:.2f} km/h</strong>")
        if pace and t == "Run":
            metrics_parts.append(f"👟 平均配速：<strong>{pace}</strong>")
        if speed > 0 and t == "Swim":
            swim_pace_mins = 6.0 / speed if speed > 0 else 0
            swim_m = int(swim_pace_mins)
            swim_s = int(round((swim_pace_mins - swim_m)*60))
            if swim_s == 60: swim_m += 1; swim_s = 0
            metrics_parts.append(f"🏊 划水配速：<strong>{swim_m}:{swim_s:02d} /100m</strong>")

        # Specific Rich TP metrics for 2026-08-16 Run & Swim
        if ev.get("date") == "2026-08-16" and t == "Run":
            metrics_parts.append("⏱️ 實際時間：<strong>2:04:32 (124.5 分)</strong>")
            metrics_parts.append("📏 實際距離：<strong>17.52 km</strong>")
            metrics_parts.append("👟 平均配速：<strong style='color:#F59E0B;'>7:06 /km</strong> (等效 6:35 /km)")
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>149 bpm</strong> (最高 172 bpm, Z1-Z2 佔 99.9%)")
            metrics_parts.append("⚡ 平均功率：<strong>226 W</strong> (最高 380 W)")
            metrics_parts.append("👣 平均步頻：<strong style='color:#10B981;'>155 spm</strong> (下坡 176-184 spm)")
            metrics_parts.append("⛰️ 總爬升：<strong style='color:#38BDF8;'>+327 m</strong> / -279 m (最高海拔 286.6m)")
            metrics_parts.append("📊 訓練壓力：<strong>86.4 rTSS</strong> (IF 0.61)")
            metrics_parts.append("🔥 熱量：<strong>1,201 kcal</strong>")
            metrics_parts.append("😊 體感自覺：<strong style='color:#10B981;'>5/5 (滿分)</strong>")
            advice = (
                "🎯 <strong>【平路漸速與山道爬坡兼備的長距離有氧】</strong> 今日完成 17.52 km 長跑，總爬升達 +327m。前段平路河濱（Lap 1~8）配速由 6:42/km 順暢提速至 5:26/km（功率 240~287W），熱身與巡航節奏非常優秀。<br>"
                "⛰️ <strong>【明德宮陡坡有氧控制與自覺補水折返】</strong> 上坡路段（8~13km）坡度達 4%~8.5%，心率妥善控制在 131~163 bpm，不盲目衝瓦；並於明德宮適時補水後折返，是極具經驗的防熱衰與補給決策。下坡段（13~17km）迅速拉高步頻至 176~184 spm，平穩收尾。<br>"
                "💡 <strong>【對標 Sub-11 全馬 4 小時 (5:41/km)】</strong> 本次長跑在包含 300+ 公尺爬升下全有氧區間（Z1-Z2 佔 99.9%）完成，奠定極佳的下肢抗疲勞肌耐力。"
            )
        elif ev.get("date") == "2026-08-16" and t == "Swim":
            metrics_parts.append("⏱️ 實際時間：<strong>1:25:35 (85.6 分, 游動 1:07:18)</strong>")
            metrics_parts.append("📏 實際距離：<strong>4,100 m (4.10 km)</strong>")
            metrics_parts.append("🏊 均速配速：<strong style='color:#22D3EE;'>2:05 /100m</strong> (主課巡航 1:56~1:58 /100m)")
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>134 bpm</strong> (最高 163 bpm, Z1-Z2 佔 65%, Z3 佔 34%)")
            metrics_parts.append("🔄 划水頻率：<strong style='color:#10B981;'>25 spm</strong> (最高 28 spm)")
            metrics_parts.append("📊 訓練壓力：<strong>110.4 sTSS</strong> (IF 0.92)")
            metrics_parts.append("🔥 熱量：<strong>733 kcal</strong>")
            metrics_parts.append("😊 體感自覺：<strong style='color:#10B981;'>3/5 (扎實)</strong>")
            advice = (
                "🏊‍♂️ <strong>【超長距離雙主課穩定巡航】</strong> 完成 4,100m 高量游泳課表！包含 800m 扎實技術分解練習 (Drill) 與兩組 1,600m（合計 3,200m）主項巡航。第一組 1,600m 耗時 31分11秒（均速 <strong>1'56\" /100m</strong>，心率 140 bpm），第二組 1,600m 耗時 31分41秒（均速 <strong>1'58\" /100m</strong>，心率 142 bpm），兩大段配速與划頻（25 spm）展現極致一致性！<br>"
                "🎯 <strong>【精準對標 Sub-11 游泳藍圖 (1h12m / 1:53/100m)】</strong> 1,600m 連續長游在 140 bpm 低心率下輕鬆維持破 2 分台（1'56\"~1'58\"/100m），證明 3.8km 全程可在低於乳酸閾值的極省力狀態游在 1:12-1:15 區間出水，完美保護後續單車與全馬體力。<br>"
                "🧪 <strong>【週日雙項累積近 200 TSS 之恢復指引】</strong> 上午跑、游雙課表合計 196.8 TSS，全週累積游泳 10.7km、單車 188.4km、跑步 37.2km，整體負荷圓滿達標。建議晚間補足碳水與優質蛋白質，針對小腿與肩背進行滾筒放鬆，準備迎接週一的恢復日。"
            )
        # Specific Rich TP metrics for 2026-08-15 Bike & Run
        elif ev.get("date") == "2026-08-15" and t == "Bike":
            metrics_parts.append("⏱️ 實際時間：<strong>4:36:23 (276 分)</strong>")
            metrics_parts.append("📏 實際距離：<strong>127.37 km</strong>")
            metrics_parts.append("⚡ 平均時速：<strong>27.65 km/h</strong>")
            metrics_parts.append("🚴 標準化功率 (NP)：<strong style='color:#38BDF8;'>172 W</strong> (均瓦 134W, 最大 545W)")
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>148 bpm</strong> (最高 182 bpm)")
            metrics_parts.append("🔄 平均踏頻：<strong>80 rpm</strong>")
            metrics_parts.append("⚖️ 左右踩踏平衡：<strong style='color:#10B981;'>50.5% / 49.5%</strong>")
            metrics_parts.append("⛰️ 總爬升：<strong>857 m</strong>")
            metrics_parts.append("📊 訓練壓力：<strong>320.1 TSS</strong> (IF 0.84, VI 1.28)")
            metrics_parts.append("🩺 有氧解離 (Pw:HR)：<strong style='color:#F59E0B;'>21.39%</strong>")
            metrics_parts.append("🔥 熱量：<strong>2,526 kcal</strong>")
            metrics_parts.append("😊 體感：<strong>3/5</strong>")
            advice = (
                "<strong>【長距離耐力與極佳踩踏平衡】</strong> 扎實完成 127.37 km 破百長騎！左右踩踏發力 50.5% / 49.5% 極為平衡，座艙設定與核心穩定度表現優異。<br>"
                "⚠️ <strong>【LSD 功率紀律與有氧解離監測】</strong> 今日標準化功率 172W (IF 0.84，目標 0.70-0.75) 偏向 Tempo 競賽強度，造成後半程心率漂移 (Pw:HR) 達 21.39%。備賽 LSD 建議刻意將前 3 小時 NP 壓制在 145W-155W (68-75% FTP) 區間，避免過早耗盡肝醣，為後續轉換跑保留體力。<br>"
                "💡 <strong>【下車前降瓦與高踏頻冷卻】</strong> 下車前最後 10–15km 請恪守降瓦至 123W-133W 並維持 85-90 rpm，有效降低心率與乳酸堆積。"
            )
        elif ev.get("date") == "2026-08-15" and t == "Run":
            metrics_parts.append("⏱️ 實際時間：<strong>30:00 (30 分)</strong>")
            metrics_parts.append("📏 實際距離：<strong>4.28 km</strong>")
            metrics_parts.append("👟 平均配速：<strong style='color:#F59E0B;'>7:01 /km</strong>")
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>161 bpm</strong> (最高 178 bpm)")
            metrics_parts.append("⚡ 平均功率：<strong>231 W</strong>")
            metrics_parts.append("👣 步頻：<strong style='color:#10B981;'>167 spm</strong> (前段 175 spm)")
            metrics_parts.append("⏱️ 觸地時間：<strong style='color:#38BDF8;'>273.5 ms</strong>")
            metrics_parts.append("📐 垂直比：<strong style='color:#A855F7;'>9.0%</strong>")
            metrics_parts.append("📊 訓練壓力：<strong>17.7 rTSS</strong>")
            metrics_parts.append("😊 體感自覺：<strong style='color:#10B981;'>5/5 (極佳)</strong>")
            advice = (
                "🎯 <strong>【極佳自覺調整與教練級防傷決策】</strong> 上午單車承受 320 TSS 高負荷且正午升溫，開跑心率即進入 160+ bpm。<strong>主動於 30 分鐘適度收操是極具水準的自我保護決策</strong>，既達到了神經肌肉轉換適應，又成功防範了中暑、深度力竭與拉傷風險！<br>"
                "⚡ <strong>【步頻與跑姿維持】</strong> 前 3 公里步頻維持在 174-175 spm、垂直比 9.0%，動力傳遞效率優異。後續 90 分鐘轉換跑時，請專注於前 5 公里維持 175-180 spm 小步幅，平穩將心率巡航在 155-165 bpm。<br>"
                "🧪 <strong>【黃金恢復指南】</strong> 今日總消耗高達 2,855 kcal，請持續補充電解質與每公斤 1.5-2.0g 優質蛋白質，明日建議完全休息或輕鬆排酸游。"
            )
        elif ev.get("date") == "2026-08-14" and t == "Swim":
            metrics_parts.append("⏱️ 實際時間：<strong>1:08:46 (68.8 分)</strong>")
            metrics_parts.append("📏 實際距離：<strong>3,300 m (3.30 km)</strong>")
            metrics_parts.append("🏊 均速配速：<strong style='color:#22D3EE;'>2:05 /100m</strong> (最快 1:45 /100m)")
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>140 bpm</strong> (最高 181 bpm, Z2-Z3 佔 63%)")
            metrics_parts.append("🔄 划水頻率：<strong style='color:#10B981;'>27 spm</strong> (最高 30 spm)")
            metrics_parts.append("📊 訓練壓力：<strong>89.2 sTSS</strong> (IF 0.92)")
            metrics_parts.append("🔥 熱量：<strong>772 kcal</strong>")
            metrics_parts.append("🩺 有氧解離 (Pa:HR)：<strong>4.12%</strong> (極佳有氧穩定性)")
            metrics_parts.append("😊 體感自覺：<strong style='color:#10B981;'>5/5 (極佳)</strong>")
            advice = (
                "🎯 <strong>【扎實高量有氧划水與極佳水感】</strong> 順利吃下 3,300m 甜甜主課表（1小時08分）！划頻穩定維持在 27 spm，有氧解離率僅 4.12%（&lt;5% 優秀標準），顯示在長距離游程中身體流線型與核心浮力維持得非常好，無明顯下沉或阻力增加現象。<br>"
                "🏊‍♂️ <strong>【對標 Sub-11 標竿 (1h12m / 1:53/100m)】</strong> 今日主課混合了分解動作 (Drill) 與定速游，均速 2:05/100m，高峰衝刺游出 1:45/100m。進入賽前 Build/Peak 週期時，可逐步增加 100m/200m 巡航配速游比重，目標鎖定在 1:48–1:53/100m 節奏，出水前保持低心率定位，將最佳腿力完整留給單車與全馬。<br>"
                "💡 <strong>【連續大週課表銜接】</strong> 週五游完 3.3km 後隔日即順利銜接週六 127km 長騎與轉換跑，展現非常充沛的體能庫存。"
            )
        # Specific Rich TP metrics for 2026-08-13 Bike & Run
        elif ev.get("date") == "2026-08-13" and t == "Bike":
            metrics_parts.append("💓 均心率：<strong style='color:#F43F5E;'>105 bpm</strong> (Zone 1-2 佔 97.2%)")
            metrics_parts.append("⛰️ 總爬升：<strong style='color:#38BDF8;'>1,135 m</strong> (最高海拔 811m)")
            metrics_parts.append("📊 訓練壓力：<strong>108.4 hrTSS</strong> (IF 0.54)")
            metrics_parts.append("😊 體感：<strong>5/5 (滿分)</strong>")
            advice = (
                "<strong>【極佳有氧效率與低心率控瓦】</strong> 在高達 1,135m 總爬升的山路陡坡騎乘中，平均心率控制在極低穩定的 105 bpm (Zone 1-2 涵蓋率達 97.2%)！展現高超的脂肪氧化能力與有氧耐力底子。<br>"
                "⚠️ <strong>【陡坡心率與功率控防】</strong> 第 11-12 圈長陡坡出現瞬間心率 187 bpm。比賽日 (平路/微起伏賽道) 請恪守「陡坡降齒比、守住 174W (85% FTP) 上限」紀律，防止心率暴衝耗盡糖原。下車前 10–15km 主動降瓦至 123W-133W 冷卻有氧，每小時補給 60-90g 碳水與 600-900ml 電解質。"
            )
        elif ev.get("date") == "2026-08-13" and t == "Run":
            metrics_parts.append("👟 均配速：<strong style='color:#F59E0B;'>5:39 /km</strong> (Sub-11 標竿 5:41)")
            metrics_parts.append("💓 均心率：<strong>167 bpm</strong>")
            metrics_parts.append("⚡ 平均功率：<strong>275 W</strong>")
            metrics_parts.append("👣 步頻：<strong style='color:#10B981;'>170 bpm</strong> (最高 184)")
            metrics_parts.append("⏱️ 觸地時間：<strong style='color:#38BDF8;'>262 ms</strong>")
            metrics_parts.append("📐 垂直比：<strong style='color:#A855F7;'>8.0%</strong> (極佳推進效率)")
            advice = (
                "🎯 <strong>【完美擊中 Sub-11 全馬標竿】</strong> 單車 60.99km 下車後直接跑出 5:39/km 平均配速，精準擊中 Sub-11 全馬 4 小時完賽 (5:41/km) 目標線！分段配速 5:31 -> 5:18 -> 5:04/km 穩健漸進。<br>"
                "⚡ <strong>【神經傳導與轉向效率優異】</strong> 觸地時間僅 262 ms，垂直比 8.0% (&lt;10% 最佳推進率)，證明單車有氧控心率得當，下車雙腿完全無麻痺僵硬感。長距離轉換跑時請注意前 5 公里穩在 5:40-5:45/km，心率巡航在 155-165 bpm，為後續保留彈性。"
            )
        else:
            if t == "Bike":
                advice = f"<strong>【單車強度與功率紀律】</strong> 實際完成 {ad:.2f} km (時間 {at/60.0:.2f}h)。對比 <strong>Sub-11 藍圖 (5h30m / 140W-145W)</strong>：本次訓練耐力扎實。注意事項：長騎或 Tempo 區間衝刺時請嚴格守住 174W (85% FTP) 上限，切勿冒進衝瓦以防耗損全馬雙腿剛性；下車前 10–15km 主動降瓦至 123W-133W 冷卻有氧，騎乘中每小時補給 60-90g 碳水與 600-900ml 電解質。"
            elif t == "Run":
                advice = f"<strong>【跑步配速與落地剛性】</strong> 實際完成 {ad:.2f} km (時間 {at:.0f}分)。對比 <strong>Sub-11 藍圖 (4h00m / 5:41/km)</strong>：節奏掌控穩定。注意事項：請維持步頻 175–180 bpm 減輕膝關節負擔；跑後 30 分鐘內請補給 25g 蛋白質與碳水，修復肌纖維，為週末 LSD 與 90 分鐘轉換跑奠定衝擊剛性。"
            elif t == "Swim":
                advice = f"<strong>【划水效率與低心率有氧】</strong> 實際完成 {ad:.2f} km (時間 {at:.0f}分)。對比 <strong>Sub-11 藍圖 (1h12m / 1:53/100m)</strong>：划水水感良好。注意事項：維持放鬆 Zone 1-2 低心率划水，出水前保持平穩定位 (Sighting)，將核心體力完整留給單車與全馬。"
            elif t == "Strength":
                advice = f"<strong>【下肢安定與核心底座】</strong> 肌力訓練順利完成。注意事項：專注單腳硬舉與核心抗旋轉安定，為單車 140W-145W 出巡與路跑落地衝擊提供穩固底座。"
            else:
                advice = f"課表執行順利完成！請注意補充水分與充足睡眠恢復。"
            
        metrics_html = " ｜ ".join(metrics_parts)
            
        card = f"""
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color); border-left: 4px solid {color}; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <div style="font-weight: 700; font-size: 0.96rem; color: #F8FAFC;">
                    {icon} <span style="color: {color};">{date_disp}</span> {summary}
                </div>
                <span style="font-size: 0.76rem; background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600;">{pct_str}</span>
            </div>
            <div style="font-size: 0.86rem; color: #CBD5E1; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); line-height: 1.8;">
                {metrics_html}
            </div>
            <div style="font-size: 0.88rem; color: #E2E8F0; line-height: 1.7; background: rgba(30, 41, 59, 0.5); padding: 12px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                💡 {advice}
            </div>
        </div>
        """
        cards_html.append(card)
        
    return "\n".join(cards_html)


def build_weekly_coach_insights_box(events, w, w_monday, w_sunday, est):
    completed = [ev for ev in events if ev.get("actual_time", 0) > 0 or ev.get("actual_dist", 0) > 0]
    bike_dist = sum(ev.get("actual_dist", 0) for ev in completed if ev.get("type") == "Bike")
    run_dist = sum(ev.get("actual_dist", 0) for ev in completed if ev.get("type") == "Run")
    swim_dist = sum(ev.get("actual_dist", 0) for ev in completed if ev.get("type") == "Swim")
    
    has_816_run = any(ev.get("date") == "2026-08-16" and ev.get("type") == "Run" for ev in completed)
    has_816_swim = any(ev.get("date") == "2026-08-16" and ev.get("type") == "Swim" for ev in completed)
    has_815_bike = any(ev.get("date") == "2026-08-15" and ev.get("type") == "Bike" for ev in completed)
    has_815_run = any(ev.get("date") == "2026-08-15" and ev.get("type") == "Run" for ev in completed)
    
    if has_816_run and has_816_swim:
        h1 = (
            "• <strong>【W33 大量週圓滿結算 (Big Weekend)】</strong> 全週累計游泳 <strong>10.70 km</strong>、自行車 <strong>188.36 km</strong>、跑步 <strong>37.20 km</strong>，總訓練時間突破 16 小時，總 TSS 突破 650，有氧底層極為厚實。<br>"
            "• <strong>【週日跑游雙主項高水準發揮】</strong> 8/16 清晨完成 17.52 km（含明德宮 +327m 爬坡，平路漸速至 5:26/km）；上午接續 4,100m 游泳，雙 1,600m 主項巡航繳出 1:56~1:58/100m 絕佳均速與 140 bpm 低心率！<br>"
            "• <strong>【極佳左右平衡與配速穩定性】</strong> 8/15 破百長騎 127.37 km（左右平衡 50.5%/49.5%）與 8/16 雙 1,600m 連續長游均展現頂尖的體能一致性。"
        )
        h2 = (
            "• <strong>【長騎控瓦與有氧解離防線】</strong> 8/15 長騎 NP 172W (IF 0.84) 偏向競賽強度，未來長距離 LSD 前 3 小時務必壓制在 140W-150W (68-75% FTP)，下車前 10-15km 主動降瓦冷卻。<br>"
            "• <strong>【山道長跑心率與步頻轉換】</strong> 上坡路段維持 131-163 bpm 控心率、下坡迅速拉高步頻至 176-184 spm 減少煞車衝擊，對標 Sub-11 全馬 4 小時 (5:41/km) 節奏。<br>"
            "• <strong>【游泳長距離 1:53 巡航手感】</strong> 雙 1,600m 巡航在 140 bpm 游出 1:56-1:58/100m，可於後續課表逐步加入 100/200m 巡航配速游，目標直指 1:48-1:53/100m。"
        )
        h3 = (
            "• <strong>【週末雙大日深度修復】</strong> 連續兩天高強度與高量訓練累積近 540 TSS，請持續補充水分、電解質與每公斤 1.5–2.0g 優質蛋白質。<br>"
            "• <strong>【下肢與肩背肌群放鬆】</strong> 重點針對小腿阿基里斯腱、臀大肌、肩關節與闊背肌進行滾筒放鬆與深層伸展。<br>"
            "• <strong>【週一恢復日排程】</strong> 週一安排完全休息 (Rest Day) 或低心率排酸輕鬆游/滾筒活動度，讓神經與肌肉充分吸收本週超量訓練。"
        )
    elif has_815_bike and has_815_run:
        h1 = (
            "• <strong>【大訓練日 (Big Day) 高品質完成】</strong> 本週累計自行車已達 <strong>188.36 km</strong>、跑步 <strong>19.68 km</strong>、游泳 <strong>6.60 km</strong>。<br>"
            "• <strong>【極佳左右平衡與座艙穩定度】</strong> 8/15 扎實完成 127.37 km 破百長騎 (4h36m)，踩踏平衡 50.5% / 49.5% 完美均衡！<br>"
            "• <strong>【成熟的教練級防傷自覺】</strong> 騎車大負荷 (320 TSS) 後無縫銜接轉換跑，依即時心率與體感主動於 30 分鐘適度收操 (Feeling 5/5)，兼顧神經肌肉轉換刺激與防範熱衰竭/過度疲勞。"
        )
        h2 = (
            "• <strong>【自行車 LSD 功率與有氧解離控制】</strong> 8/15 長騎 NP 達 172W (IF 0.84)，偏向 Tempo 強度，造成後段有氧解離 (Pw:HR) 達 21.39%。建議未來長距離 LSD 前段克制輸出在 140W-150W (68-75% FTP)，爬坡嚴守 174W 上限，避免過早耗損肝醣。<br>"
            "• <strong>【下車前降瓦與冷卻紀律】</strong> 下車前最後 10–15km 請務必降瓦至 123W-133W 並維持 85-90 rpm 高踏頻，讓心率平順回落。<br>"
            "• <strong>【跑步步頻與著地剛性】</strong> 轉換跑維持 175-180 spm 小步幅，垂直比控制在 9% 以內，保護膝關節與雙腿剛性。"
        )
        h3 = (
            "• <strong>【水分與電解質持續補充】</strong> 今日總消耗高達 2,855 kcal，請持續每 1–2 小時補充電解質水，直至尿液清澈。<br>"
            "• <strong>【醣類與優質蛋白補給】</strong> 充足攝取碳水化合物與每公斤 1.5–2.0g 優質蛋白質，加速肌糖原回補與肌纖維修復。<br>"
            "• <strong>【明日排程建議】</strong> 今日總 TSS 達 338，明日強烈建議安排完全休息 (Rest Day) 或輕鬆低心率排酸游/滾筒放鬆。"
        )
    elif completed:
        h1 = f"• 本週已累積單車 <strong>{bike_dist:.2f} km</strong>、跑步 <strong>{run_dist:.2f} km</strong>、游泳 <strong>{swim_dist:.2f} km</strong>，整體訓練節奏扎實推進中。<br>• 游泳與單車 4 週滾動均量皆達到 Sub-11 標竿需求。"
        h2 = "• <strong>單車控瓦</strong>：目標巡航 140W-145W，爬坡上限 174W，下車前 10-15km 降瓦至 123W-133W 冷卻。<br>• <strong>跑步步頻</strong>：維持 175-180 spm，減輕關節衝擊，保護全馬下半程。"
        h3 = "• 訓練後即刻補充水份、電解質與 25g 蛋白質。<br>• 保持每晚 7.5–8.5 小時高品質深度睡眠，加速神經與肌肉修復。"
    else:
        h1 = "• 當週課表已排定完備，請依預定配速與強度執行。"
        h2 = "• 遵守各項課表之強度區間設定，切勿在基礎有氧日超量超瓦。"
        h3 = "• 課前充足熱身，課後落實收操與營養補充。"

    return f"""
    <div class="section-box" style="border-left: 4px solid #38BDF8; background: linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.95)); margin-bottom: 20px;">
        <div class="section-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>🧭 教練視角綜合解析與後續建議 (Daily & Weekly Coach Insights)</span>
            <span style="font-size:0.75rem; background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.3); padding:3px 8px; border-radius:6px; font-weight:600;">✨ 每日自動更新即時同步</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 14px;">
            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-weight: 700; color: #34D399; margin-bottom: 8px; font-size: 0.92rem;">🌟 執行亮點與成效分析</div>
                <div style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.7;">
                    {h1}
                </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3);">
                <div style="font-weight: 700; color: #FBBF24; margin-bottom: 8px; font-size: 0.92rem;">⚠️ 需注意的細節與配速紀律</div>
                <div style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.7;">
                    {h2}
                </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">
                <div style="font-weight: 700; color: #38BDF8; margin-bottom: 8px; font-size: 0.92rem;">🧪 賽後恢復與能量補給指南</div>
                <div style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.7;">
                    {h3}
                </div>
            </div>
        </div>
    </div>
    """



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
        elif w == current_week_num:
            status_tag = "Current"
            status_label = "本週進行中"
        else:
            status_tag = "Future"
            status_label = "預計計畫"

        # Dynamic phase lookup from Monday's event summary (e.g. Base 3-2) or fallback mapping
        monday_events = [ev for ev in events if ev.get("date") == str(w_monday)]
        phase = None
        for ev in monday_events:
            summary = ev.get("summary", "")
            match = re.search(r"\b(Base|Build)\s*(\d+)-(\d+)\b", summary, re.IGNORECASE)
            if match:
                phase_type = match.group(1).capitalize()
                phase_cycle = match.group(2)
                phase_week = match.group(3)
                phase = f"{phase_type} {phase_cycle}-{phase_week}"
                break

        if not phase:
            if w <= 15:
                phase = "Base 1"
            elif w <= 27:
                phase = "Base 2"
            elif w == 28:
                phase = "Base 2-1"
            elif w == 29:
                phase = "Base 2-2"
            elif w == 30:
                phase = "Base 2-3"
            elif w == 31:
                phase = "Base 2-4 (Recovery)"
            elif w == 32:
                phase = "Base 3-1"
            elif w == 33:
                phase = "Base 3-2"
            elif w == 34:
                phase = "Base 3-3"
            elif w == 35:
                phase = "Base 3-4 (Recovery)"
            elif w == 36:
                phase = "Build 1-1"
            elif w == 37:
                phase = "Build 1-2"
            elif w == 38:
                phase = "Build 1-3"
            elif w == 39:
                phase = "Build 1-4 (Recovery)"
            elif w == 40:
                phase = "Peak Phase"
            elif 41 <= w <= 43:
                phase = f"Taper {w - 40}"
            elif w == 44:
                phase = "Race Week 🏆"
            else:
                phase = "Off-Season / Maintenance"

        # Read reports content if available
        art_md_file = WEEKLY_DIR / f"2026-W{w:02d}_當週鐵人新知與文章整理_中文版.md"
        if art_md_file.exists():
            art_html = parse_articles_md_to_body_html(art_md_file.read_text(encoding="utf-8"))
        else:
            art_html = "<p style='color:var(--text-muted);'>該週尚未產生鐵人新知報告</p>"

        # Read Strength Plan content if available
        str_md_file1 = WEEKLY_DIR / f"2026-W{w:02d}_第{w:02d}週肌力訓練計畫.md"
        str_md_file2 = WEEKLY_DIR / f"2026-W{w:02d}_當週肌力訓練計畫.md"
        if str_md_file1.exists():
            str_html = simple_md_to_html(str_md_file1.read_text(encoding="utf-8"))
        elif str_md_file2.exists():
            str_html = simple_md_to_html(str_md_file2.read_text(encoding="utf-8"))
        else:
            str_html = "<p style='color:var(--text-muted);'>該週尚未產生肌力訓練計畫與課表報告</p>"

        # Target execution review report for current week: '上週' for week w should be prev_w (w - 1)
        prev_w = w - 1 if w > 1 else 1
        prev_rev_file = WEEKLY_DIR / f"2026-W{prev_w:02d}_當週執行率回顧報告.md"
        curr_rev_file = WEEKLY_DIR / f"2026-W{w:02d}_當週執行率回顧報告.md"
        
        if prev_rev_file.exists():
            rev_html = simple_md_to_html(prev_rev_file.read_text(encoding="utf-8"))
            rev_target = prev_w
        elif curr_rev_file.exists():
            rev_html = simple_md_to_html(curr_rev_file.read_text(encoding="utf-8"))
            rev_target = w
        else:
            rev_html = "<p style='color:var(--text-muted);'>上週執行率回顧報告將於週日晚上自動結算生成</p>"
            rev_target = prev_w

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
        daily_feedback_html = build_daily_feedback_cards(events)
        coach_insights_box_html = build_weekly_coach_insights_box(events, w, w_monday, w_sunday, est_snap)

        weeks_data[w] = {
            "week_num": w,
            "prev_week_num": rev_target,
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
            "daily_feedback_html": daily_feedback_html,
            "coach_insights_box_html": coach_insights_box_html,
            "art_html": art_html,
            "str_html": str_html,
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
        /* NAVIGATION TOGGLE & OVERLAY */
        .sidebar-header-top {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }}
        .btn-toggle-desktop, .btn-toggle-mobile {{
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
            border: 1px solid rgba(56, 189, 248, 0.4);
            color: #38BDF8;
            padding: 7px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }}
        .btn-toggle-desktop:hover, .btn-toggle-mobile:hover {{
            background: var(--accent-cyan);
            color: #0F172A;
            border-color: transparent;
        }}
        .btn-close-sidebar {{
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.78rem;
            cursor: pointer;
        }}
        .btn-close-sidebar:hover {{ color: #FFF; border-color: var(--accent-red); background: rgba(239, 68, 68, 0.2); }}

        .sidebar-overlay {{
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(4px);
            z-index: 9998;
        }}

        /* MOBILE RESPONSIVE LAYOUT (< 769px) */
        @media (max-width: 768px) {{
            body {{
                flex-direction: column;
                height: auto;
                overflow-y: auto;
            }}
            .sidebar {{
                display: none;
                position: fixed;
                top: 0; left: 0;
                width: 290px;
                height: 100vh;
                z-index: 9999;
                box-shadow: 10px 0 30px rgba(0,0,0,0.8);
            }}
            .sidebar.mobile-open {{
                display: flex;
            }}
            .sidebar-overlay.mobile-open {{
                display: block;
            }}
            .main-content {{
                width: 100%;
                min-width: 0;
                padding: 16px 12px;
                overflow-x: hidden;
            }}
            .main-header {{
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }}
            .subnav-tabs {{
                flex-wrap: wrap;
                gap: 6px;
            }}
            .subtab-btn {{
                flex: 1 1 45%;
                font-size: 0.82rem;
                padding: 8px 6px;
            }}
            .grid-kpi, .target-grid, .articles-grid {{
                grid-template-columns: 1fr !important;
            }}
            .table-custom {{
                display: block;
                overflow-x: auto;
                white-space: nowrap;
                width: 100%;
            }}
            .btn-toggle-desktop {{ display: none !important; }}
        }}

        /* DESKTOP COLLAPSED SIDEBAR (> 768px) */
        @media (min-width: 769px) {{
            .btn-toggle-mobile {{ display: none !important; }}
            .sidebar.desktop-collapsed {{
                display: none;
            }}
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
            width: 100%;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
        }}
        .subtab-btn {{
            flex: 1;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            padding: 10px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.9rem;
            text-align: center;
            transition: all 0.2s ease;
            white-space: nowrap;
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

        /* ARTICLES CATEGORIZED CARDS & NAV CHIPS */
        .nav-quick-bar {{
            position: sticky;
            top: 0;
            z-index: 90;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px;
            padding: 10px 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
            overflow-x: auto;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }}
        .nav-label {{ font-size: 0.85rem; font-weight: 700; color: #38BDF8; white-space: nowrap; }}
        .nav-chip {{
            padding: 6px 14px;
            border-radius: 20px;
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 700;
            white-space: nowrap;
            transition: all 0.2s ease;
        }}
        .chip-summary {{ background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }}
        .chip-swim {{ background: rgba(6, 182, 212, 0.15); color: #22D3EE; border: 1px solid rgba(6, 182, 212, 0.4); }}
        .chip-bike {{ background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.4); }}
        .chip-run {{ background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }}
        .chip-recovery {{ background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); }}
        .chip-home {{ background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); }}
        .nav-chip:hover {{ transform: translateY(-2px); filter: brightness(1.2); }}

        .summary-box {{
            background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9));
            border: 1px solid rgba(245,158,11,0.4);
            border-radius: 14px;
            padding: 22px;
            margin-bottom: 28px;
            box-shadow: 0 4px 16px rgba(245,158,11,0.1);
        }}
        .summary-box h2 {{ color: #FBBF24; font-size: 1.2rem; margin-bottom: 14px; }}
        .cat-group {{ margin-bottom: 32px; }}
        .cat-header {{
            font-size: 1.25rem;
            color: #38BDF8;
            margin-bottom: 14px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--border-color);
            scroll-margin-top: 70px;
        }}
        .articles-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 18px;
        }}
        .art-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 18px;
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
        .art-title {{ font-size: 1.05rem; font-weight: 700; color: #F8FAFC; margin-bottom: 8px; line-height: 1.4; }}
        .art-title a {{ color: #38BDF8; text-decoration: none; }}
        .art-title a:hover {{ color: var(--accent-cyan); text-decoration: underline; }}
        .art-meta {{ font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px; line-height: 1.5; }}
        .art-desc {{
            font-size: 0.88rem;
            color: #CBD5E1;
            background: rgba(15, 23, 42, 0.5);
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 14px;
            flex: 1;
            line-height: 1.6;
        }}
        .art-footer {{ display: flex; justify-content: flex-end; }}
        .art-btn {{
            background: rgba(6, 182, 212, 0.15);
            border: 1px solid rgba(6, 182, 212, 0.4);
            color: var(--accent-cyan);
            padding: 8px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.84rem;
            font-weight: 700;
            transition: all 0.2s ease;
        }}
        .art-btn:hover {{ background: var(--accent-cyan); color: #0F172A; }}
        .ext-link {{ color: #38BDF8; text-decoration: none; }}
        .ext-link:hover {{ text-decoration: underline; }}
        .ext-icon {{ font-size: 0.8em; color: var(--accent-cyan); }}
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleMobileSidebar(false)"></div>
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-header-top">
                <h1 style="font-size: 1.1rem; margin: 0;">TrainingPeaks 52 週儀表板</h1>
                <button class="btn-close-sidebar" onclick="closeSidebar()">✕ 收起</button>
            </div>
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

        function toggleMobileSidebar(open) {{
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (open) {{
                sidebar.classList.add('mobile-open');
                overlay.classList.add('mobile-open');
            }} else {{
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('mobile-open');
            }}
        }}

        function toggleDesktopSidebar() {{
            const sidebar = document.getElementById('sidebar');
            const btn = document.getElementById('btnToggleDesktop');
            const isCollapsed = sidebar.classList.toggle('desktop-collapsed');
            if (btn) {{
                btn.style.display = isCollapsed ? 'inline-flex' : 'none';
            }}
        }}

        function closeSidebar() {{
            if (window.innerWidth <= 768) {{
                toggleMobileSidebar(false);
            }} else {{
                toggleDesktopSidebar();
            }}
        }}

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
            if (window.innerWidth <= 768) {{
                toggleMobileSidebar(false);
            }}
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

            const sidebar = document.getElementById('sidebar');
            const isDesktopCollapsed = sidebar ? sidebar.classList.contains('desktop-collapsed') : false;

            mainEl.innerHTML = `
                <div class="main-header">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <button class="btn-toggle-mobile" onclick="toggleMobileSidebar(true)">📅 週次選單 ☰</button>
                        <button class="btn-toggle-desktop" id="btnToggleDesktop" onclick="toggleDesktopSidebar()" style="display: ${{isDesktopCollapsed ? 'inline-flex' : 'none'}};">📅 展開 52 週選單 ☰</button>
                        <div>
                            <h2 style="font-size: 1.4rem; margin: 0;">第 ${{data.week_num}} 週訓練報告與內容 (W${{String(data.week_num).padStart(2, '0')}})</h2>
                            <div style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
                                週期：${{data.monday}} – ${{data.sunday}} ｜ 階段：<strong style="color: #38BDF8;">${{data.phase}}</strong>
                            </div>
                        </div>
                    </div>
                    <span class="badge-status ${{data.status_tag === 'Current' ? 'badge-current' : data.status_tag === 'Past' ? 'badge-past' : 'badge-future'}}" style="font-size: 0.85rem; padding: 5px 12px;">
                        ${{data.status_label}}
                    </span>
                </div>

                <!-- SUBNAV TABS FOR ONLINE READING -->
                <div class="subnav-tabs">
                    <button class="subtab-btn active" onclick="openSubtab('overview')">📊 當週總覽 & 226/113 完賽預估</button>
                    <button class="subtab-btn" onclick="openSubtab('plan')">🏋️ 當週課表與肌力計畫</button>
                    <button class="subtab-btn" onclick="openSubtab('articles')">📰 當週鐵人新知</button>
                    <button class="subtab-btn" onclick="openSubtab('review')">📈 上週 (W${{data.prev_week_num}}) 執行率回顧</button>
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

                    <!-- COACH COMPREHENSIVE ANALYSIS & RECOVERY PROTOCOL -->
                    ${{data.coach_insights_box_html}}

                    <!-- DAILY WORKOUT ACCOMPLISHMENTS & COACH FEEDBACK -->
                    <div class="section-box">
                        <div class="section-title">📋 每日最新訓練成果解析與教練隨堂建議 (對比 Sub-11 10:54 藍圖)</div>
                        <div>${{data.daily_feedback_html}}</div>
                    </div>

                    <!-- IM226 DYNAMIC ESTIMATE -->
                    <div class="section-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom: 14px;">
                            <div class="section-title" style="margin-bottom:0;">🔮 IM226 綜合多模型動態完賽預估 (截至上週 ${{est.window_date_range}})</div>
                            <div style="font-size:0.8rem; background:rgba(56,189,248,0.12); color:#38BDF8; padding:4px 10px; border-radius:20px; border:1px solid rgba(56,189,248,0.3);">
                                🧬 演算法：CSS水速 + BBS物理力學 + Couzens功率 + VDOT/Runalyze馬拉松準備度 (${{est.marathon_shape_score}}%)
                            </div>
                        </div>
                        <div class="target-grid">
                            <div class="target-card target-opt">
                                <div class="target-tag">🟢 樂觀目標 (高峰發揮 / 無抽筋)</div>
                                <div class="target-time">${{est.optimistic_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.optimistic_mid}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 3.8km</span><strong>${{est.opt_splits.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.opt_splits.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 180km</span><strong>${{est.opt_splits.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.opt_splits.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 42.2km</span><strong>${{est.opt_splits.run}}</strong></div>
                                </div>
                            </div>
                            <div class="target-card target-neu">
                                <div class="target-tag">🟠 中性目標 (穩定配速完賽)</div>
                                <div class="target-time">${{est.neutral_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.neutral_mid}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 3.8km</span><strong>${{est.neu_splits.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.neu_splits.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 180km</span><strong>${{est.neu_splits.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.neu_splits.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 42.2km</span><strong>${{est.neu_splits.run}}</strong></div>
                                </div>
                            </div>
                            <div class="target-card target-con">
                                <div class="target-tag">🔴 保守目標 (後半程馬拉松掉速/抽筋)</div>
                                <div class="target-time">${{est.conservative_range}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.conservative_mid}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 3.8km</span><strong>${{est.con_splits.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.con_splits.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 180km</span><strong>${{est.con_splits.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.con_splits.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 42.2km</span><strong>${{est.con_splits.run}}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- IM70.3 (113km) DYNAMIC ESTIMATE -->
                    <div class="section-box" style="margin-top: 20px;">
                        <div class="section-title">🔮 IM70.3 (113km) 綜合多模型動態完賽預估 (截至上週 ${{est.window_date_range}})</div>
                        <div class="target-grid">
                            <div class="target-card target-opt">
                                <div class="target-tag">🟢 樂觀目標 (高峰發揮 / 無抽筋)</div>
                                <div class="target-time">${{est.optimistic_range_703}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.optimistic_mid_703}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 1.9km</span><strong>${{est.opt_splits_703.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.opt_splits_703.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 90km</span><strong>${{est.opt_splits_703.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.opt_splits_703.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 21.1km</span><strong>${{est.opt_splits_703.run}}</strong></div>
                                </div>
                            </div>
                            <div class="target-card target-neu">
                                <div class="target-tag">🟠 中性目標 (穩定配速完賽)</div>
                                <div class="target-time">${{est.neutral_range_703}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.neutral_mid_703}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 1.9km</span><strong>${{est.neu_splits_703.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.neu_splits_703.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 90km</span><strong>${{est.neu_splits_703.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.neu_splits_703.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 21.1km</span><strong>${{est.neu_splits_703.run}}</strong></div>
                                </div>
                            </div>
                            <div class="target-card target-con">
                                <div class="target-tag">🔴 保守目標 (後半程路跑掉速/抽筋)</div>
                                <div class="target-time">${{est.conservative_range_703}}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">預估中位數：${{est.conservative_mid_703}}</div>
                                <div style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px; line-height: 1.6;">
                                    <div style="display:flex; justify-content:space-between;"><span>🏊 游泳 1.9km</span><strong>${{est.con_splits_703.swim}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T1 轉換區</span><strong>${{est.con_splits_703.t1}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🚴 騎車 90km</span><strong>${{est.con_splits_703.bike}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>⏱️ T2 轉換區</span><strong>${{est.con_splits_703.t2}}</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>🏃 跑步 21.1km</span><strong>${{est.con_splits_703.run}}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TRIRATING LANGKAWI EXTREME WEATHER & HILLS FORECAST -->
                    <div class="section-box" style="margin-top: 20px; border-left: 4px solid #EC4899; background: rgba(236, 72, 153, 0.05);">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom: 10px;">
                            <div class="section-title" style="margin-bottom:0; color:#F472B6;">🏝️ 11 月馬來西亞蘭卡威 (Langkawi 226km) 高溫爬坡特化預估</div>
                            <div style="font-size:0.8rem; background:rgba(236,72,153,0.15); color:#F472B6; padding:4px 10px; border-radius:20px; border:1px solid rgba(236,72,153,0.3);">
                                賽道修正加成：${{est.langkawi_estimate.heat_climbing_penalty}}
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px;">
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.2);">
                                <div style="font-size:0.8rem; color:#F472B6; font-weight:700;">🟢 蘭卡威樂觀目標</div>
                                <div style="font-size:1.15rem; font-weight:800; color:#F8FAFC; margin-top:4px;">${{est.langkawi_estimate.optimistic}}</div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.2);">
                                <div style="font-size:0.8rem; color:#F472B6; font-weight:700;">🟠 蘭卡威中性目標</div>
                                <div style="font-size:1.15rem; font-weight:800; color:#F8FAFC; margin-top:4px;">${{est.langkawi_estimate.neutral}}</div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.2);">
                                <div style="font-size:0.8rem; color:#F472B6; font-weight:700;">🔴 蘭卡威保守目標</div>
                                <div style="font-size:1.15rem; font-weight:800; color:#F8FAFC; margin-top:4px;">${{est.langkawi_estimate.conservative}}</div>
                            </div>
                        </div>
                    </div>

                    <!-- SUB-11 BENCHMARK & COACH ADVICE SECTION -->
                    <div class="section-box" style="margin-top: 20px; line-height: 1.8;">
                        <div class="section-title">🎯 Sub-11 完賽目標基準對比與教練關鍵訓練提醒</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
                                <div style="font-weight: 700; color: #22D3EE; margin-bottom: 6px;">🏊‍♂️ 游泳項目 (Sub-11 標竿：1h05m – 1h10m)</div>
                                <div style="font-size: 0.88rem; color: #CBD5E1;">
                                    • 您目前 4 週滾動均量：<strong style="color:var(--accent-cyan);">${{est.rolling_4w_avg_swim_km}} km/週</strong> (達標率 100%，標竿 7.0–9.0km/週)<br>
                                    • 配速目標：維持 1:42 – 1:50 / 100m 定速划水，定位 (Sighting) 動作保持流暢。<br>
                                    • 比賽策略：保持輕鬆有氧游，勿急躁拼出水，保留核心體力予單車與全馬。
                                </div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
                                <div style="font-weight: 700; color: #38BDF8; margin-bottom: 6px;">🚴‍♂️ 單車項目 (Sub-11 標竿：5h20m – 5h30m)</div>
                                <div style="font-size: 0.88rem; color: #CBD5E1;">
                                    • 您目前 4 週滾動均量：<strong style="color:var(--accent-green);">${{est.rolling_4w_avg_bike_km}} km/週</strong> (達標率 100%，標竿 120–150km/週)<br>
                                    • 建議配速：FTP 205W 之 68%–70% Target Power (<strong>140W–145W</strong>)，丘陵/逆風爬坡嚴格上限 174W (85% FTP)。<br>
                                    • 下車前最後 10–15km 主動降瓦至 123W–133W 進行雙腿有氧冷卻。
                                </div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
                                <div style="font-weight: 700; color: #F59E0B; margin-bottom: 6px;">🏃‍♂️ 跑步項目 (Sub-11 標竿：3h45m – 4h00m)</div>
                                <div style="font-size: 0.88rem; color: #CBD5E1;">
                                    • 您目前 4 週滾動均量：<strong style="color:var(--accent-orange);">${{est.rolling_4w_avg_run_km}} km/週</strong> (達標率 82%，標竿 35–40km/週)<br>
                                    • 核心補強點：衝擊剛性與耐受力。建議週末 LSD 與 90 分鐘 Brick Run 務必穩健完成。<br>
                                    • 週跑量若穩定拉升至 35km 以上，全馬將有機會推進至 Sub-4 邊緣！
                                </div>
                            </div>
                        </div>
                        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 10px; padding: 14px 18px; font-size: 0.9rem; color: #E2E8F0;">
                            💡 <strong>Sub-11 總教練策略總結</strong>：${{bench.sub11_coach_advice}}
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

                    <!-- FULL STRENGTH WORKOUT DETAILS BELOW -->
                    <div class="section-box" style="line-height: 1.8;">
                        <div class="section-title">🏋️ 第 ${{data.week_num}} 週肌力訓練計畫與課表詳細指南</div>
                        <div>${{data.str_html}}</div>
                    </div>
                </div>

                <!-- SUBTAB 3: ARTICLES ONLINE READ -->
                <div id="subview-articles" class="subtab-view">
                    <div class="section-box" style="line-height: 1.8;">
                        <div class="section-title" style="margin-bottom: 20px;">📰 第 ${{data.week_num}} 週鐵人新知與權威文章（分類整理與100字重點摘要）</div>
                        <div>${{data.art_html}}</div>
                    </div>
                </div>

                <!-- SUBTAB 4: REVIEW ONLINE READ -->
                <div id="subview-review" class="subtab-view">
                    <div class="section-box" style="line-height: 1.8;">
                        <div class="section-title">📈 上週 (W${{data.prev_week_num}}) 訓練執行率回顧成果</div>
                        <div>${{data.rev_html}}</div>
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
