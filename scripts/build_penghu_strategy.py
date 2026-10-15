import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_penghu_strategy_md_and_docx():
    md_path = r"C:\Users\User\Desktop\TP\outputs\ironman_penghu_226_pacing_strategy.md"
    docx_path = r"C:\Users\User\Desktop\TP\outputs\ironman_penghu_226_pacing_strategy.docx"

    lines = []
    lines.append("# IRONMAN 澎湖 (Penghu 226km) 官方賽道特化配速戰術與 Sub-11 終極完賽指南")
    lines.append("")
    lines.append("本指南依據 **IRONMAN 澎湖 (Penghu 226km) 官方賽道地圖與地貌參數** (`https://www.ironman.com/races/im-penghu/course#swim`)，對標選手 **IM226 Sub-11 完賽目標藍圖 (總目標 10:54:00)**，並汲取 **IRONMAN 70.3 墾丁前哨實兵測驗** 之戰術精髓，為 2027 年度終極主要賽事提供專屬之五分段精細時間帳本、三項賽道抗風解析、能量補給與配速執行手冊。")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 一、 賽事階層定位與澎湖賽道特質概覽")
    lines.append("")
    lines.append("### 1. 三大目標賽事之戰略階層 (Race Hierarchy)")
    lines.append("- **2026 賽事 B (實戰前哨檢驗 / Tune-up & Test Race)**：**IRONMAN 70.3 墾丁 (Kenting 70.3)**")
    lines.append("  - 任務：檢驗小灣雙峰 M 字海泳水感、屏153/台26落山風控瓦紀律 (爬升 641m)、社頂攻頂 (標高 210m，爬升 342m) 後之防抽筋轉換跑配速。")
    lines.append("- **2026 主要賽事 A (年度大考)**：**IRONMAN 馬來西亞蘭卡威 (Langkawi 226km)**")
    lines.append("  - 任務：實戰試煉高溫 (34°C)/高濕 (90%) 與單車 1,500m 爬坡，嚴格落實散熱控心率與補水補電解質。")
    lines.append("- **2027 終極主要賽事 (Ultimate Target Race 🏆)**：**IRONMAN 澎湖 (Penghu 226km)**")
    lines.append("  - 官方路線：`https://www.ironman.com/races/im-penghu/course#swim`")
    lines.append("  - 任務：**2027 年度終極榮耀里程碑！** 全面實踐 **Sub-11 (10:54:00)** 完賽藍圖，以扎實有氧空力（140W-145W）抗衡跨海大橋 3 圈強烈東北季風與觀音亭 4 圈全馬。")
    lines.append("")
    lines.append("### 2. 澎湖賽道官方地貌與氣候指標")
    lines.append("| 賽事項目 | 官方路線與地標特點 | 環境參數與氣候挑戰 | 戰術核心對策 |")
    lines.append("| :--- | :--- | :--- | :--- |")
    lines.append("| **🏊 蒔裡海泳 3.8km** | 蒔裡沙灘出發，逆時針兩圈三角形外海折返，含岸上「澳式出水 (Australian Exit)」 | 水溫 23°C–24°C (防寒衣合法 Wetsuit Legal) | 穿著防寒衣善用浮力，第一圈放鬆長划幅巡航；澳式出水跑沙灘嚴控心率防暴衝 |")
    lines.append("| **🚴 跨海大橋 180km** | 縣道201/204 ➔ 縣道203 ➔ 澎湖跨海大橋 3 圈折返 (折返點A至西嶼西臺折返點B) | 東北季風 6–8 級 (陣風 9–10 級)，起伏丘陵，10 處補給站 | 逆風段踏頻 85-90rpm 壓瓦在 165W 內防乳酸；大橋橫風段下沉重心；順風 135W 高速滑行 |")
    lines.append("| **🏃 觀音亭全馬 42.2km** | T2(同和路)出發，經觀音亭、西瀛虹橋、世界最高媽祖銅像與喜來登港灣，採 4 圈手環制 | 平坦濱海步道，午後烈日無遮蔭、海風直吹 | 前 5k 守住 5:45/km 防暴衝；午後每站冰塊塞帽降溫；可樂/鹽錠補給守住 4h00m 完賽 |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 二、 突破 11 小時 (Sub-11) 澎湖專屬時間分配帳本")
    lines.append("")
    lines.append("### 1. 澎湖 226km 三套完賽目標情境 (對標 Sub-11 Blueprint)")
    lines.append("依據選手 FTP 205W、4 週滾動訓練量（游泳 10km+/週、單車 120km+/週、跑步 25-35km/週）與澎湖風況物理阻力模型，精算三套實戰時間分配：")
    lines.append("")
    lines.append("| 分段項目 | 🟢 樂觀目標 (破 Sub-11 巔峰發揮) | 🟠 中性目標 (東北季風穩健巡航) | 🔴 保守目標 (強逆風與後程抗衡) | 官方標竿 (Sub-11 藍圖) |")
    lines.append("| :--- | :---: | :---: | :---: | :---: |")
    lines.append("| **🏊 游泳 (3.8km)** | **01:10:00** (1:50/100m) | **01:14:00** (1:57/100m) | **01:18:00** (2:03/100m) | 01:12:00 (1:53/100m) |")
    lines.append("| **⏱️ T1 轉換** | **00:05:00** (沙灘/沖洗/更衣) | **00:06:00** (穩健穿戴) | **00:08:00** (放鬆補膠) | 00:06:00 |")
    lines.append("| **🚴 單車 (180km)** | **05:32:00** (32.5 km/h, 145W) | **05:43:00** (31.5 km/h, 141W) | **06:02:00** (29.8 km/h, 135W) | 05:30:00 (32.7 km/h) |")
    lines.append("| **⏱️ T2 轉換** | **00:04:00** (換鞋/抓帽/拿膠) | **00:05:00** (擦汗/防曬) | **00:07:00** (伸展小腿) | 00:06:00 |")
    lines.append("| **🏃 全馬 (42.2km)** | **03:52:00** (5:30/km) | **04:07:00** (5:51/km) | **04:27:00** (6:20/km) | 04:00:00 (5:41/km) |")
    lines.append("| **🏆 總完賽時間** | **10 小時 43 分 (破標成功！)** | **11 小時 15 分 (穩健達成！)** | **12 小時 02 分 (平安完賽！)** | **10 小時 54 分 (Sub-11)** |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 三、 澎湖賽道三項特化實戰配速戰術 (與墾丁 70.3 對照)")
    lines.append("")
    lines.append("### 1. 🏊 蒔裡沙灘海泳 3.8km：防寒衣雙圈澳式出水戰術")
    lines.append("- **路線結構**：")
    lines.append("  - 蒔裡沙灘 (Shili Beach) 鳴槍出發，海面依逆時針方向繞行三角形大浮標（外海航線單圈約 1.9km）。")
    lines.append("  - 完成第 1 圈後，選手需踏上沙灘穿過計時感應地墊（**澳式出水 Australian Exit**），在岸上觀眾歡呼中快步跑約 50–70 公尺，隨後再次躍入海中展開第 2 圈。")
    lines.append("- **水溫與防寒衣優勢**：")
    lines.append("  - 平均水溫約 **23°C – 24°C**，符合 IRONMAN 官方防寒衣穿著標準（Wetsuit Legal，上限 24.5°C）。")
    lines.append("  - 防寒衣可為選手帶來 6–8% 的天然浮力與流體減阻，每 100m 可自然省下 3–5 秒！")
    lines.append("- **實戰執行紀律**：")
    lines.append("  1. **起划放鬆找節奏**：鳴槍下水後切勿與人堆爭搶，以 Zone 1-2 輕鬆體感啟動，定位 (Sighting) 動作每 6–8 次划手抬頭一次確認三角形浮標方位。")
    lines.append("  2. **澳式出水「防爆心率」心法**：第一圈起水跑沙灘時，因水壓突失與重力改變，心率易瞬間飆升 15–20 bpm。此時**嚴禁全力衝刺**，應以高步頻小碎步慢跑，專注呼氣吐氣，待再度撲入海中後以放鬆前長游抓回水感。")
    lines.append("  3. **配速巡航**：全趟均速維持在 **1:50 – 1:55 /100m**，心率控制在 120 bpm 以下。完成第 2 圈起水時，在淺水區提前解開防寒衣拉鍊，穩步慢跑進入 T1。")
    lines.append("")
    lines.append("### 2. 🚴 跨海大橋 180km：東北季風抗風與 10 站補給特化戰術")
    lines.append("- **路線結構**：")
    lines.append("  - 由蒔裡沙灘出發走縣道 201 轉縣道 204（途經菓葉國小第 1 補給站），接鄉道 11、12 匯入縣道 203 主幹線。")
    lines.append("  - 縣道 203 一路向北穿越壯闊的「**澎湖跨海大橋 (Penghu Great Bridge)**」，抵達西嶼端。")
    lines.append("  - 在**折返點 A (白沙端)** 與**折返點 B (西嶼西臺停車場 Xiyu West Fort Parking)** 之間進行 **3 圈折返**。")
    lines.append("  - 結束 3 圈折返後向南返程，經天君殿/馬寮回到馬公市區進入 T2 (同和路)。")
    lines.append("- **澎湖東北季風四大騎乘應變戰術**：")
    lines.append("  1. **大橋橫風風口（防失控晃動）**：跨海大橋兩側全無遮蔽，風切效應極強。通過大橋時切勿硬趴低空力把，應抓握煞車副把，**身體重心下沉、大腿微夾上管**，放鬆手腕與上臂以核心抗側扭，嚴防陣風瞬間側推。")
    lines.append("  2. **北向逆風段（踏頻拉高＋瓦數封頂）**：向北往西嶼推進為主要頂風面，強烈逆風會讓人產生速度挫折感。**千萬不可重踩大齒比！** 齒比應退至 36x21T 或 23T，將踏頻拉高至 **85 – 90 rpm**，瓦數嚴格壓制在 **155W – 165W (不超過 170W)**，守住大腿肌肉儲備。")
    lines.append("  3. **南向順風段（高速度＋低功耗休眠）**：折返向南順風時，掛上大盤 52x11T，維持 80 rpm 即可以 38–43 km/h 疾馳。此時功率刻意收回至 **130W – 140W**，進行深呼吸與下肢放鬆，達到「高均速、低心率」的能量休眠效果。")
    lines.append("  4. **下車前最後 15km 排酸**：完成 3 圈跨海大橋返回馬公市區時，主動降瓦至 **120W – 130W**，高踏頻輕踩，拉伸腰背與阿基里斯腱，為全馬做好神經肌肉轉換。")
    lines.append("- **補給站與 Special Needs (特需袋) 戰術**：")
    lines.append("  - 單車賽道全程經過補給站 **10 次**！")
    lines.append("  - 補給節奏：每 15 分鐘小口啜飲含電解質運動飲料，**每小時補滿 60–80g 碳水化合物**（約 2-3 包能量膠或高濃度能量水）與 600–800ml 液體。")
    lines.append("  - **西嶼西臺 Special Needs 特需袋策略**：於第 2 圈通過折返點 B 時領取，備妥自備高碳水濃縮補給水、固態能量棒（換換口味防甜膩反胃）、防曬噴霧與備用 CO2 氣瓶。")
    lines.append("")
    lines.append("### 3. 🏃 觀音亭休閒園區＋媽祖神像 42.2km 全馬：4 圈信物制抗熱戰術")
    lines.append("- **路線結構**：")
    lines.append("  - 由 T2 (同和路) 出發，沿馬公濱海景觀步道展開 4 圈巡禮。")
    lines.append("  - 途經景點：觀音亭休閒園區、西瀛虹橋、世界最高媽祖銅像、馬公港灣、澎澄飯店與福朋喜來登。")
    lines.append("  - **4 圈信物制**：A 到 B 跑 2 圈、C 到 H 跑 2 圈，每個折返點領取 1 條不同顏色手環，全程必須集滿 **4 條不同顏色手環 (4 Wristbands)** 方能轉進最後 200m 終點紅地毯！")
    lines.append("- **全馬分圈配速與抗高溫戰術**：")
    lines.append("  - **Lap 1 (0–10.5km，神經肌肉轉換防暴衝)**：剛下車雙腿剛性高、容易因體感良好而暴衝至 5:10/km。**嚴格禁止跟風搶快！** 配速必須強制壓在 **5:45 – 5:50 /km**，專注 178–182 spm 高步頻與 <260ms 輕觸地，心率控制在 138–142 bpm。")
    lines.append("  - **Lap 2 (10.5–21.1km，有氧巡航節奏期)**：體感完全適應，進入有氧舒適巡航，配速提至 **5:38 – 5:42 /km**。此時海風與午後氣溫攀升，逢補給站必進站補水 150ml 與運動飲料。")
    lines.append("  - **Lap 3 (21.1–31.5km，午後高溫與撞牆期大作戰)**：鐵人賽道最艱難的勝負關鍵！體感溫度可能飆至 30°C 以上，開始實施「**冰塊物理降溫法**」——每站必抓冰塊塞入跑帽頂部、胸口與後頸，透過頸動脈散熱降低核心體溫。搭配每站 1/3 杯可樂 (快速糖原釋放) ＋ 1 粒鹽錠，堅守 **5:45 – 5:50 /km** 不掉速。")
    lines.append("  - **Lap 4 (31.5–42.2km，榮耀收割與衝線)**：集齊第 4 條手環！靠核心肌力、臀中肌穩定與不屈意志支撐，維持 180 spm 步頻推進。最後 2km 望向觀音亭與西瀛虹橋夕陽，穩健加速，以 4 小時整衝入終點拱門，榮膺 IRONMAN 226 Sub-11 終極桂冠！")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 四、 墾丁 70.3 與澎湖 226 賽事特性全面對照表")
    lines.append("")
    lines.append("| 比較維度 | 2026 IRONMAN 70.3 墾丁 (賽事 B 前哨檢驗) | 2027 IRONMAN 澎湖 (終極主要賽事 🏆) | 戰術轉移與學習重點 |")
    lines.append("| :--- | :--- | :--- | :--- |")
    lines.append("| **賽事定位** | 實戰前哨檢驗 (Tune-up & Test Race) | 終極主要賽事 (Ultimate Target Race) | 墾丁是壓力測試實驗室；澎湖是 Sub-11 榮耀驗收 |")
    lines.append("| **海泳地形** | 小灣沙灘，雙峰 M 字型 (6 處 90° 轉折) | 蒔裡沙灘，逆時針雙圈三角形＋澳式出水 | 墾丁練繞標轉體與近岸浪；澎湖練防寒衣浮力與出水控心率 |")
    lines.append("| **單車地形** | 90km，總爬升 **641M** (屏153丘陵＋台26車城) | 180km，起伏丘陵 (跨海大橋 3 圈折返) | 墾丁重在爬坡抗乳酸；澎湖重在 180km 跨海大橋抗東北季風 |")
    lines.append("| **單車風況** | 恆春半島「落山風」(6–8 級側逆陣風) | 澎湖海峽「東北季風」(8–10 級強風風櫃) | 墾丁驗證空力把穩定度；澎湖落實 180km 長時間控瓦防線 |")
    lines.append("| **單車補給** | 補給站 3–4 處，自備充足能量膠 | 補給站 10 次＋西嶼西臺 Special Needs 特需袋 | 澎湖必須善用 10 站密集優勢與特需袋精準補給 |")
    lines.append("| **路跑地形** | 21.1km 雙圈，爬升 **342M** (社頂攻頂標高 210M) | 42.2km 4 圈制 (觀音亭/媽祖神像/喜來登平路) | 墾丁練陡坡抗離心損傷；澎湖練平路高步頻與抗午後高溫 |")
    lines.append("| **路跑信物** | 雙圈折返信物 | 4 圈信物制 (集滿 4 條不同顏色手環衝線) | 澎湖需更嚴謹的心理分段拆解與進站冰塊降溫紀律 |")
    lines.append("| **完賽時間** | 樂觀 5:24 / 中性 5:48 / 保守 6:22 | 樂觀 10:43 / 中性 11:16 / 保守 12:03 | 墾丁 Sub-5:30 相當於澎湖 Sub-11 的最佳體能印證 |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 五、 器材裝備配置與賽前備戰建議")
    lines.append("")
    lines.append("### 1. 單車空力輪組與齒比推薦")
    lines.append("- **前輪框高建議**：**嚴禁使用 80mm 以上超高框或封閉前輪！** 跨海大橋陣風強烈，建議前輪採用 **45mm – 50mm** 中框輪組，兼顧空氣動力減阻與橫風操控安全性。")
    lines.append("- **後輪框高建議**：後輪受轉向影響極小，可配置 **60mm – 80mm** 高框輪組（風勢若在 6 級以下亦可使用封閉輪）。")
    lines.append("- **齒比搭配**：大盤建議 **52/36T** (或 50/34T)，飛輪建議 **11-30T** (或 11-32T)。逆風爬坡有輕齒比護腿，順風段有 52x11T 大齒比高速巡航。")
    lines.append("")
    lines.append("### 2. 全馬競速跑鞋與降溫防護")
    lines.append("- **跑鞋推薦**：配置頂級厚底碳板競速鞋（如 Nike Alphafly / Vaporfly、Saucony Endorphin Elite、Asics Metaspeed Sky+），提供長達 42km 的肌肉離心震盪保護與高效能量回饋。")
    lines.append("- **抗 UV 與物理降溫**：透氣空頂遮陽帽（必備，方便塞冰塊）、抗 UV 防風太陽眼鏡、高防汗防曬乳。")
    lines.append("")
    lines.append("### 3. 教練總結與心態建設")
    lines.append("> **「澎湖的風，只會吹倒心存僥倖的跑者；但對於有準備的 IRONMAN，強風是洗練意志與鑄造傳奇的最好夥伴。」**")
    lines.append("> 嚴格恪守 140W-145W 控瓦紀律，不急不躁、定時補給、高步頻輕跑，Sub-11 (10:54:00) 的榮耀必將在觀音亭的拱門前為您加冕！")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated {md_path}")

    # Build docx
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    in_table = False
    table_lines = []

    def flush_table():
        nonlocal table_lines
        if not table_lines:
            return
        rows = [t.strip("|").split("|") for t in table_lines if t.strip()]
        if len(rows) >= 2:
            if "---" in rows[1][0] or ":---" in rows[1][0]:
                headers = [c.strip() for c in rows[0]]
                data_rows = [[c.strip() for c in r] for r in rows[2:]]
            else:
                headers = [c.strip() for c in rows[0]]
                data_rows = [[c.strip() for c in r] for r in rows[1:]]

            tbl = doc.add_table(rows=len(data_rows)+1, cols=len(headers))
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

            hdr_cells = tbl.rows[0].cells
            for idx, text in enumerate(headers):
                hdr_cells[idx].text = text
                set_cell_background(hdr_cells[idx], "0F766E")
                p = hdr_cells[idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)
                    run.font.name = "微軟正黑體"
                    run.font.size = Pt(9.5)

            for r_idx, r_data in enumerate(data_rows):
                row_cells = tbl.rows[r_idx+1].cells
                bg_color = "F0FDF4" if r_idx % 2 == 1 else "FFFFFF"
                for c_idx, val in enumerate(r_data):
                    if c_idx < len(row_cells):
                        row_cells[c_idx].text = val
                        set_cell_background(row_cells[c_idx], bg_color)
                        p = row_cells[c_idx].paragraphs[0]
                        for run in p.runs:
                            run.font.name = "微軟正黑體"
                            run.font.size = Pt(9)
                        if c_idx == 0:
                            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

        doc.add_paragraph()
        table_lines = []

    for line in lines:
        sline = line.strip()
        if sline.startswith("|"):
            in_table = True
            table_lines.append(sline)
            continue
        elif in_table:
            in_table = False
            flush_table()

        if sline.startswith("# "):
            p = doc.add_paragraph()
            run = p.add_run(sline[2:].strip())
            run.font.bold = True
            run.font.size = Pt(19)
            run.font.color.rgb = RGBColor(15, 118, 110)
            run.font.name = "微軟正黑體"
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(10)
        elif sline.startswith("## "):
            p = doc.add_paragraph()
            run = p.add_run(sline[3:].strip())
            run.font.bold = True
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(13, 148, 136)
            run.font.name = "微軟正黑體"
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
        elif sline.startswith("### "):
            p = doc.add_paragraph()
            run = p.add_run(sline[4:].strip())
            run.font.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(30, 41, 59)
            run.font.name = "微軟正黑體"
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
        elif sline.startswith("- ") or sline.startswith("1. ") or sline.startswith("2. ") or sline.startswith("3. ") or sline.startswith("4. "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            parts = sline.split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                run.font.name = "微軟正黑體"
                run.font.size = Pt(10)
                if idx % 2 == 1:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(15, 118, 110)
            p.paragraph_format.space_after = Pt(3)
        elif sline.startswith("   - ") or sline.startswith("  - "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.5)
            parts = sline.strip().split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                run.font.name = "微軟正黑體"
                run.font.size = Pt(9.5)
                if idx % 2 == 1:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(13, 148, 136)
            p.paragraph_format.space_after = Pt(2)
        elif sline.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            run = p.add_run(sline[2:].strip())
            run.font.italic = True
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 118, 110)
            run.font.name = "微軟正黑體"
            run.font.size = Pt(10)
            p.paragraph_format.space_after = Pt(4)
        elif sline == "---":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
        elif sline:
            p = doc.add_paragraph()
            parts = sline.split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                run.font.name = "微軟正黑體"
                run.font.size = Pt(10)
                if idx % 2 == 1:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(15, 118, 110)
            p.paragraph_format.space_after = Pt(4)

    if in_table:
        flush_table()

    doc.save(docx_path)
    print(f"Generated {docx_path}")

if __name__ == "__main__":
    create_penghu_strategy_md_and_docx()
