import os

def generate_consolidated_plan():
    output_path = r"C:\Users\User\Desktop\TP\outputs\12_week_ironman_consolidated_master_plan.md"
    
    lines = []
    lines.append("# 220 Triathlon 體系：全距離鐵人三項 12 週 (84 天) 綜合整合訓練主課表")
    lines.append("")
    lines.append("本課表為 **全功能二合一綜合整合版主課表**。完整融合 **220 Triathlon 訓練體系**、**Nik Cook 教練之騎後跑 (Transition Run / Brick Run) 轉換機制**、與 **選手現行 FTP = 205 W 之功率量化數據**。本文檔包含 12 週階段演進總表、強度心率/功率區間對照表，以及 **完整 84 天每日詳細游騎跑與轉接操作菜單**。")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 一、 核心訓練原則與強度對照表")
    lines.append("")
    lines.append("### 1. 🚴 FTP 205W 功率區間對照表 (Power Zones)")
    lines.append("| 強度區間 | 佔 FTP % | 功率範圍 (瓦數 W) | 心率與體感 (RPE) | 賽事與訓練應用 |")
    lines.append("| :--- | :--- | :--- | :--- | :--- |")
    lines.append("| **Zone 1 (恢復)** | < 55% | **< 113 W** | RPE 2-3 / 極輕鬆 | 恢復騎乘、暖身與緩冷 |")
    lines.append("| **Zone 2 (有氧基底)** | 55% - 75% | **113 W - 154 W** | RPE 4-5 / 輕鬆談話 | **Ironman 226km 賽事核心瓦數 (目標 140W-150W)** |")
    lines.append("| **Zone 3 (節奏)** | 76% - 90% | **156 W - 185 W** | RPE 6-7 / 急促呼吸 | 70.3 配速 / 週中強度間歇 |")
    lines.append("| **Zone 4 (乳酸閾值)** | 91% - 105% | **187 W - 215 W** | RPE 8 / 相當沉重 | 閾值提升 / FTP 短間歇 |")
    lines.append("| **Zone 5 (最大攝氧量)** | 106% - 120% | **217 W - 246 W** | RPE 9 / 極度艱難 | VO2Max 爆發力間歇 |")
    lines.append("")
    lines.append("### 2. 🏃 心率區間 (Based on Joe Friel LTHR)")
    lines.append("- **Zone 1 (極輕鬆/恢復)**：最大心率 50-60% | RPE 2-3")
    lines.append("- **Zone 2 (有氧基底/Ironman配速)**：最大心率 60-70% | RPE 4-5 | 全距離馬拉松核心配速區間")
    lines.append("- **Zone 3 (節奏/70.3配速)**：最大心率 70-80% | RPE 6-7 | 週二/三間歇與節奏跑")
    lines.append("- **Zone 4 (乳酸閾值)**：最大心率 80-90% | RPE 8 | 閾值提升跑")
    lines.append("")
    lines.append("### 3. 🚩 Ironman 單車與轉接跑配速黃金鐵則")
    lines.append("1. **單車全程目標瓦數**：控制在 **140 W - 150 W (IF 0.68 - 0.73)**，保持燃脂效率與有氧儲備。")
    lines.append("2. **丘陵/逆風天花板**：上坡與逆風嚴禁爆發衝刺，功率上限 ≤ **174 W (85% FTP)**。")
    lines.append("3. **T2 下車前降瓦準備**：最後 10-15km 降至 **123 W - 133 W (60-65% FTP)**，迴轉數提升至 95+ rpm 舒緩雙腿。")
    lines.append("4. **騎後跑 (Transition Run) T2 規範**：單車結束 5m 內開跑。前 5m 心率限制 Zone 2 下限，步頻 88-92 rpm，絕不暴衝。")
    lines.append("5. **絕不補課**：若缺席訓練直接劃掉跳過，嚴禁加倍訓練。")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 二、 12 週總體進度規劃表 (12-Week Master Overview)")
    lines.append("")
    lines.append("| 週次 | 階段 | 週總時長 | 游泳重點 | 最長單車瓦數與時間 (週六) | 騎後跑 (Brick Run) | 最長跑步 (週日) |")
    lines.append("| :---: | :---: | :---: | :--- | :--- | :--- | :--- |")
    lines.append("| **W1** | Build | ~9h | 1,800m 間歇 | 3.0h (140W-148W) | **10m (Zone 2, 90rpm)** | 1.5h Zone 2 |")
    lines.append("| **W2** | Build | ~10.5h | 2,000m 配速 | 3.5h (140W-148W, 含爬坡 170W) | **15m (Zone 2 高步頻)** | 1.75h Zone 2 |")
    lines.append("| **W3** | Build | ~12h | 2,400m 長游 | 4.0h (142W-150W 配速) | **30m (賽事目標配速)** | 2.0h Zone 2 |")
    lines.append("| **W4** | Recovery | ~8h | 1,600m 輕鬆 | 2.5h (130W-140W 輕鬆) | **15m (輕鬆轉接)** | 1.25h Zone 2 |")
    lines.append("| **W5** | Peak | ~13.5h | 2,600m 間歇 | 4.5h (142W-150W, 含 1h 170W) | **30m (測試長騎下車腿感)** | 2.25h Zone 2 |")
    lines.append("| **W6** | Peak | ~15h | 3,000m 無中斷 | 5.0h (142W-150W, 含 2h 150W) | **40m (賽事配速轉接)** | 2.5h Zone 2 |")
    lines.append("| **W7** | **Big Brick** | **~16.5h** | **3,200m 高峰** | **5.5-6.0h (143W-148W 160k)** | **45m (完全比賽模擬)** | **2.75-3.0h (28-30k)** |")
    lines.append("| **W8** | Recovery | ~9.5h | 2,000m 輕鬆 | 3.0h (135W-142W 輕鬆) | **20m (輕鬆轉接)** | 1.5h Zone 2 |")
    lines.append("| **W9** | Taper Prep | ~12h | 2,500m 配速 | 4.0h (142W-148W) | **30m (配速微調)** | 2.0h Zone 2 |")
    lines.append("| **W10** | Taper 1 | ~9h | 2,000m 短刺激 | 3.0h (140W-146W) | **20m (保持短刺激)** | 1.25h Zone 2 |")
    lines.append("| **W11** | Taper 2 | ~6.5h | 1,500m 水感 | 2.0h (130W-140W) | **15m (輕鬆找步頻)** | 50m Zone 1-2 |")
    lines.append("| **W12** | **Race Week** | ~3.5h | 800-1,000m 水感 | 45m 輕鬆旋轉 (120W-135W) | **10m 賽前動態喚醒** | **Ironman 226km 賽事日！** |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 三、 84 天每日詳細菜單 (84-Day Master Schedule)")
    lines.append("")

    # Import daily data generator logic
    with open(r"C:\Users\User\Desktop\TP\outputs\12_week_ironman_daily_training_plan.md", "r", encoding="utf-8") as f:
        daily_md = f.read()

    # Append the daily schedule part starting from "### 第一階段"
    start_idx = daily_md.find("### 第一階段")
    if start_idx != -1:
        lines.append(daily_md[start_idx:])

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    generate_consolidated_plan()
