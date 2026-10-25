/**
 * 瀏覽器端全功能離線/GitHub Pages 演算引擎 (100% 同步對齊 server.py)
 * 支援：
 * 1. KNOWN_COURSE_TEMPLATES 賽道等高線與分段模板
 * 2. Open-Meteo 即時預報 API / 歷史同日氣候 API (CORS 直連)
 * 3. 多模型完賽時間預估 (對齊 TP estimator_226.py + WBGT/露點 + 坡度陡峭度 VI + 瀑布圖 + 五維雷達圖)
 * 4. Step 4 互動式六段戰術攻略本 (Playbook) 與單車上管貼紙生成
 */

const KNOWN_COURSE_TEMPLATES = {
  "kenting": {
    "course_id": "kenting_703",
    "name": "IRONMAN 70.3 Kenting 墾丁國際鐵人三項賽",
    "distance_type": "113",
    "swim_km": 1.9,
    "bike_km": 90.0,
    "run_km": 21.1,
    "bike_elevation_m": 641,
    "run_elevation_m": 342,
    "run_max_alt_m": 210,
    "lat": 21.9405,
    "lon": 120.806,
    "water_type": "ocean_swell",
    "water_label": "開放海域（小灣沙灘 M 字型雙峰折返，6 顆轉向浮標）",
    "wetsuit_legal": false,
    "t1_base_mins": 4.0,
    "t2_base_mins": 3.0,
    "swim_buoys": [
      {
        "id": 1,
        "name": "1 號浮標 (外海左轉)",
        "dist_m": 450
      },
      {
        "id": 2,
        "name": "2 號浮標 (回折向岸)",
        "dist_m": 530
      },
      {
        "id": 3,
        "name": "3 號浮標 (內側折返)",
        "dist_m": 905
      },
      {
        "id": 4,
        "name": "4 號浮標 (二峰出海)",
        "dist_m": 995
      },
      {
        "id": 5,
        "name": "5 號浮標 (外海折返)",
        "dist_m": 1370
      },
      {
        "id": 6,
        "name": "6 號浮標 (直線回岸)",
        "dist_m": 1450
      },
      {
        "id": 7,
        "name": "小灣沙灘起水終點",
        "dist_m": 1900
      }
    ],
    "bike_profile": [
      {
        "km": 0,
        "ele": 12,
        "grade": 0.0,
        "label": "小灣 T1 出發",
        "marker": "T1"
      },
      {
        "km": 6,
        "ele": 18,
        "grade": 0.5,
        "label": "南灣海岸段",
        "marker": ""
      },
      {
        "km": 12,
        "ele": 58,
        "grade": 4.2,
        "label": "大光/貓鼻頭爬坡",
        "marker": ""
      },
      {
        "km": 18,
        "ele": 22,
        "grade": -3.1,
        "label": "白砂灣下滑",
        "marker": ""
      },
      {
        "km": 26,
        "ele": 55,
        "grade": 3.8,
        "label": "屏153萬里桐(B1)",
        "marker": "B1"
      },
      {
        "km": 35,
        "ele": 15,
        "grade": -1.5,
        "label": "海口關門點(35k)",
        "marker": "⏱️"
      },
      {
        "km": 46.7,
        "ele": 64,
        "grade": 3.5,
        "label": "牡丹折返點(B2)",
        "marker": "B2"
      },
      {
        "km": 58.2,
        "ele": 20,
        "grade": -2.0,
        "label": "車城逆風段(B3)",
        "marker": "B3"
      },
      {
        "km": 71,
        "ele": 16,
        "grade": 0.2,
        "label": "海口關門點(71k)",
        "marker": "⏱️"
      },
      {
        "km": 74.5,
        "ele": 58,
        "grade": 4.0,
        "label": "萬里桐二爬坡(B4)",
        "marker": "B4"
      },
      {
        "km": 81,
        "ele": 60,
        "grade": 2.5,
        "label": "大光丘陵高點",
        "marker": ""
      },
      {
        "km": 86,
        "ele": 20,
        "grade": -3.8,
        "label": "南灣下坡排酸",
        "marker": ""
      },
      {
        "km": 90,
        "ele": 12,
        "grade": 0.0,
        "label": "福華 T2 (PT)",
        "marker": "T2"
      }
    ],
    "run_profile": [
      {
        "km": 0,
        "ele": 12,
        "grade": 0.0,
        "label": "福華 T2 出發",
        "marker": "T2"
      },
      {
        "km": 2.0,
        "ele": 42,
        "grade": 4.5,
        "label": "墾丁牌樓起爬(R1)",
        "marker": "R1"
      },
      {
        "km": 3.9,
        "ele": 145,
        "grade": 6.2,
        "label": "公園路陡坡(R2)",
        "marker": "R2"
      },
      {
        "km": 5.7,
        "ele": 210,
        "grade": 5.8,
        "label": "社頂最高點210m(R3)",
        "marker": "R3"
      },
      {
        "km": 7.2,
        "ele": 120,
        "grade": -5.5,
        "label": "船帆路陡下坡(R4)",
        "marker": "R4"
      },
      {
        "km": 9.1,
        "ele": 12,
        "grade": -2.0,
        "label": "船帆石海岸(R5)",
        "marker": "R5"
      },
      {
        "km": 11.1,
        "ele": 12,
        "grade": 0.0,
        "label": "小灣折返(R6)",
        "marker": "R6"
      },
      {
        "km": 13.8,
        "ele": 15,
        "grade": 0.3,
        "label": "台26船帆石(R5)",
        "marker": "R5"
      },
      {
        "km": 15.8,
        "ele": 18,
        "grade": 0.5,
        "label": "砂島折返(R6/⏱️)",
        "marker": "R6"
      },
      {
        "km": 18.5,
        "ele": 14,
        "grade": -0.2,
        "label": "船帆石回程(R5/⏱️)",
        "marker": "R5"
      },
      {
        "km": 21.1,
        "ele": 12,
        "grade": 0.0,
        "label": "小灣終點拱門",
        "marker": "🏁"
      }
    ],
    "bike_segments_template": [
      {
        "range_label": "0–15",
        "start_km": 0,
        "end_km": 15,
        "title": "保守騎乘",
        "np_pct_range": [
          0.88,
          0.95
        ],
        "if_note": "先讓心率從海泳穩下來",
        "terrain": "出轉換區上台26線往南灣、核三，轉入屏153大光/貓鼻頭。約 8–14 km 有第一段明顯丘陵起伏（海拔 50–60 m）。",
        "tactics": "前 15 分鐘讓心率與呼吸從游泳與 T1 階梯中穩下來，坡上絕對不追人。先喝幾口水，約 20 分鐘開始第一次能量補給。",
        "aid_station": "本段沒有補給站，出發時水壺務必裝滿。",
        "common_mistake": "游泳後腎上腺素高，跟著身邊刷過去的車友猛踩，前 10 km 平均功率高出目標 10% 以上。"
      },
      {
        "range_label": "15–35",
        "start_km": 15,
        "end_km": 35,
        "title": "進入競賽功率",
        "np_pct_range": [
          0.95,
          1.02
        ],
        "if_note": "進入目標巡航區間",
        "terrain": "屏153白砂灣、萬里桐海岸丘陵起伏，26 km 處經過 B1 補給站後下滑接回海口平路（35 km 第一關門點）。",
        "tactics": "在平緩段進入低風阻空力姿勢，遇到萬里桐短坡換輕齒比、維持 80–85 rpm 踏頻，不抽車硬頂。",
        "aid_station": "B1 補給站 (26 km) ｜ 海口關門點 (35 km)",
        "common_mistake": "在萬里桐連續短陡坡反覆抽車衝破瓦數上限，導致股四頭肌提早累積乳酸。"
      },
      {
        "range_label": "35–60",
        "start_km": 35,
        "end_km": 60,
        "title": "保持平穩輸出",
        "np_pct_range": [
          0.96,
          1.03
        ],
        "if_note": "落山風側逆風抗風區",
        "terrain": "台26線北上車城、左轉 199 縣道石門至牡丹折返點 (46.7 km)，此區段開闊且常遇恆春半島強勁「落山風」側逆陣風。",
        "tactics": "環境變了，守住功率、不守速度！遇到逆風時速掉是正常的，壓低身體減少迎風面積；側陣風強時雙手握彎把下把、不強躺休息把。",
        "aid_station": "B2 牡丹折返補給站 (46.7 km) ｜ B3 車城補給站 (58.2 km)",
        "common_mistake": "頂著落山風為了維持 32 km/h 帳面時速而把功率催到 110% NP 以上，直接把跑步的腿榨乾。"
      },
      {
        "range_label": "60–75",
        "start_km": 60,
        "end_km": 75,
        "title": "維持功率與補給",
        "np_pct_range": [
          0.94,
          1.0
        ],
        "if_note": "順側風回程穩定補水",
        "terrain": "由車城經海口 (71 km 關門點) 重新轉入屏153線往萬里桐，地勢先平緩後微幅爬升。",
        "tactics": "利用平路順風段穩定巡航，把握爬坡前的平穩路段把最後一包固體/半固體能量膠與電解質水喝足。",
        "aid_station": "海口關門點 (71 km) ｜ B4 萬里桐補給站 (74.5 km)",
        "common_mistake": "覺得體力還行就忽略第 2 小時的定時補給，導致後半段與路跑初段血糖下滑。"
      },
      {
        "range_label": "75–82",
        "start_km": 75,
        "end_km": 82,
        "title": "控制起伏路段",
        "np_pct_range": [
          0.92,
          0.98
        ],
        "if_note": "最後丘陵守住瓦數上限",
        "terrain": "屏153線萬里桐至大光段最後一波 50–60 m 連續丘陵爬坡，雙腿已累積超過 2 小時疲勞。",
        "tactics": "短坡嚴格看錶守住上坡功率紅線，寧可退一檔輕踩過坡頂，坡頂繼續踩 10 秒把速度帶起來再滑行。",
        "aid_station": "74.5 km B4 剛過，以車上水壺補水為主。",
        "common_mistake": "想趕在回 T2 前搶幾分鐘，在最後一個大光坡硬踩導致小腿或大腿內側出現抽筋前兆。"
      },
      {
        "range_label": "82–90",
        "start_km": 82,
        "end_km": 90,
        "title": "準備 T2 轉換",
        "np_pct_range": [
          0.82,
          0.9
        ],
        "if_note": "主動降瓦、拉高踏頻排酸",
        "terrain": "出大光接回台26線南灣一路微下坡與平路滑回福華飯店 T2 轉換區 (89 km 罰時帳篷 PT)。",
        "tactics": "最後 8 km 主動將瓦數調降 10–15%，踏頻拉高至 88–92 rpm 讓雙腿血液循環順暢，最後 15 分鐘只喝水不吃固體食物讓胃部排空。",
        "aid_station": "89 km 罰時帳篷 (PT) ➔ 90 km 福華 T2",
        "common_mistake": "南灣下坡一路重踩衝進 T2，一下車雙腿僵硬直接面對社頂大爬坡。"
      }
    ],
    "run_segments_template": [
      {
        "range_label": "0–2",
        "start_km": 0.0,
        "end_km": 2.0,
        "title": "保守起跑",
        "tag": "平路 · 2.0 km",
        "pace_offset_sec": [
          10,
          15
        ],
        "terrain": "福華 T2 轉換區出發經和平巷往墾丁國家公園牌樓，大致平緩微幅上升。",
        "intensity": "比平路目標配速慢 10–15 秒/km，心率絕對先別衝上去。",
        "form_tip": "步幅小、步頻高 (175–180 spm)，讓雙腿從騎車模式平順切換過來。",
        "aid_station": "R1 補給站 (2.0 km)。先喝水、拿海綿降溫，騎車後段補足的話可只喝水。",
        "common_mistake": "被 T2 出發的人潮與加油聲帶快，前 2 km 快了 20 秒/km 以上，一進社頂陡坡立刻爆心率。"
      },
      {
        "range_label": "2–5.5",
        "start_km": 2.0,
        "end_km": 5.5,
        "title": "依坡度調整強度",
        "tag": "社頂連續上坡 · 3.5 km",
        "pace_offset_sec": [
          55,
          85
        ],
        "terrain": "公園路連續爬升約 198m 直攻社頂自然公園最高點（海拔 210m，平均坡度 5%–6.5%）。",
        "intensity": "看心率與呼吸，不看配速！上坡每 km 慢 50–85 秒完全正常，遇到最陡段快走比硬跑更省能量。",
        "form_tip": "身體微前傾、縮短步幅、用臀部與大腿後側推地，手肘向後擺動帶動節奏。",
        "aid_station": "R2 (3.9 km)、R3 社頂高點 (5.7 km)。過坡頂務必補水與電解質。",
        "common_mistake": "在社頂上坡死盯著手錶想維持平路配速，不到 5 km 就把肝醣與心率極限燒光。"
      },
      {
        "range_label": "5.5–8.5",
        "start_km": 5.5,
        "end_km": 8.5,
        "title": "下坡保持跑姿",
        "tag": "船帆路陡下坡 · 3.0 km",
        "pace_offset_sec": [
          -12,
          5
        ],
        "terrain": "由社頂公園經船帆路一路陡下坡約 3 km 直達台26線船帆石海岸，坡度陡且離心衝擊大。",
        "intensity": "順著重力自然滑落，不刻意跨大步衝刺，也不後仰踩煞車。",
        "form_tip": "步頻維持高頻、腳掌落地點在身體正下方，保護股四頭肌免於離心收縮拉傷。",
        "aid_station": "R4 補給站 (7.2 km)。下坡晃動大，小口喝水避免嗆到或胃部不適。",
        "common_mistake": "下坡貪快跨大步用腳跟煞車，一下到 9 km 平路股四頭肌與小腿立刻抽筋。"
      },
      {
        "range_label": "8.5–13.8",
        "start_km": 8.5,
        "end_km": 13.8,
        "title": "進入穩定配速",
        "tag": "海岸平路 · 5.3 km",
        "pace_offset_sec": [
          -3,
          8
        ],
        "terrain": "接回台26線船帆石折返、經小灣完成第 1 圈 (11.1 km) 再往南跑向船帆石，全線海岸平路但無遮蔭。",
        "intensity": "回到您的平路目標配速區間，專心穩定執行，把呼吸與步頻鎖定。",
        "form_tip": "放鬆肩膀與雙手，目光看前方 15 公尺，利用每站冰水淋頭與後頸降溫。",
        "aid_station": "R5 (9.1 km)、R6 小灣 (11.1 km)、R5 (13.8 km)。每 30 分鐘按時吃能量膠。",
        "common_mistake": "下坡後覺得速度變慢而急躁加速，或是忽略正午海岸柏油路的熱輻射沒抓冰塊降溫。"
      },
      {
        "range_label": "13.8–17",
        "start_km": 13.8,
        "end_km": 17.0,
        "title": "檢查剩餘體力",
        "tag": "砂島折返段 · 3.2 km",
        "pace_offset_sec": [
          0,
          12
        ],
        "terrain": "台26線往南至最南端砂島折返點 (15.8 km)，海風與日曬最明顯的中後段。",
        "intensity": "守住目標配速上限，檢視心率是否漂移、雙腿是否有緊繃感。",
        "form_tip": "若感覺步伐變沉，主動把注意放在「抬腳跟、維持 175+ 步頻」，不掉步頻就不容易掉速。",
        "aid_station": "R6 砂島折返關門點 (15.8 km)。可補最後一包咖啡因膠或可樂提振中樞神經。",
        "common_mistake": "在 14–16 km 心態鬆懈開始連走帶跑，一旦停下來走路就很難再跑起來。"
      },
      {
        "range_label": "17–21.1",
        "start_km": 17.0,
        "end_km": 21.1,
        "title": "有餘裕才加速",
        "tag": "最後衝刺 · 4.1 km",
        "pace_offset_sec": [
          -10,
          10
        ],
        "terrain": "最後一趟台26線沿海平路經船帆石直奔小灣終點紅毯。",
        "intensity": "過了 18 km 若呼吸與肌力還有餘裕，每 km 可快 5–10 秒；若無餘裕就穩守目標配速到底。",
        "form_tip": "擺臂帶動雙腿，眼睛鎖定前方的下一個路標與終點拱門。",
        "aid_station": "R5 (18.5 km 關門點)、R6 (20.5 km)。拿水漱口或淋頭即可，全力奔向終點！",
        "common_mistake": "最後 1 km 突然百米衝刺導致終點前大腿劇烈抽筋鎖死。"
      }
    ],
    "course_details": {
      "swim_summary": "於墾丁小灣沙灘進行 1.9km「雙峰 M 字型」單圈海泳（450m-80m-375m-90m-375m-80m-450m），共需繞行 6 顆 90° 直角轉彎浮標。",
      "bike_summary": "單車 90km（總爬升 641m）：結合屏153海岸丘陵起伏與台26線車城/牡丹段強勁落山風側逆陣風。",
      "run_summary": "路跑 21.1km（兩圈制，總爬升 342m）：第一圈前 5.5km 直攻社頂自然公園海拔 210m，隨即 3km 船帆路陡下坡；第二圈為台26線海岸平路。",
      "key_warnings": [
        "⚠️ 【海泳與 T1 階梯】：小灣 M 字路線折返點多，逆光時務必提前抬頭定位；起水後穿越涵洞爬階梯進 T1 切忌拔腿狂奔。",
        "⚠️ 【屏153丘陵與台26落山風】：屏153丘陵切忌重齒比硬踩；進入車城落山風區時，守住功率不守速度，側風強時握下把不躺把。",
        "⚠️ 【社頂魔王坡與陡下坡護腿】：路跑前 5.5km 攻社頂看心率不看配速；船帆路陡下坡維持高步頻護住股四頭肌，避免回到平路抽筋。"
      ]
    }
  },
  "penghu": {
    "course_id": "penghu_226",
    "name": "IRONMAN Penghu 澎湖國際鐵人三項賽 (226km)",
    "distance_type": "226",
    "swim_km": 3.8,
    "bike_km": 180.0,
    "run_km": 42.2,
    "bike_elevation_m": 820,
    "run_elevation_m": 160,
    "run_max_alt_m": 28,
    "lat": 23.571,
    "lon": 119.563,
    "water_type": "ocean_calm",
    "water_label": "開放海灣（蒔裡沙灘雙圈三角形路線，1.9km 澳式出水）",
    "wetsuit_legal": true,
    "t1_base_mins": 5.5,
    "t2_base_mins": 5.0,
    "bike_profile": [
      {
        "km": 0,
        "ele": 5,
        "grade": 0.0,
        "label": "蒔裡沙灘 T1",
        "marker": "T1"
      },
      {
        "km": 15,
        "ele": 24,
        "grade": 1.2,
        "label": "湖西縣道204",
        "marker": "B1"
      },
      {
        "km": 38,
        "ele": 26,
        "grade": 1.5,
        "label": "跨海大橋(強側風)",
        "marker": "B2"
      },
      {
        "km": 52,
        "ele": 44,
        "grade": 2.8,
        "label": "西嶼西臺折返(圈1)",
        "marker": "B3"
      },
      {
        "km": 78,
        "ele": 18,
        "grade": 0.0,
        "label": "白沙折返A",
        "marker": "⏱️"
      },
      {
        "km": 98,
        "ele": 44,
        "grade": 2.5,
        "label": "西嶼西臺(圈2/特需袋)",
        "marker": "SN"
      },
      {
        "km": 118,
        "ele": 18,
        "grade": 0.0,
        "label": "白沙折返A",
        "marker": ""
      },
      {
        "km": 138,
        "ele": 44,
        "grade": 2.5,
        "label": "西嶼西臺(圈3)",
        "marker": "B4"
      },
      {
        "km": 158,
        "ele": 25,
        "grade": 1.0,
        "label": "跨海大橋最終趟",
        "marker": "⏱️"
      },
      {
        "km": 180,
        "ele": 10,
        "grade": 0.0,
        "label": "馬公體育館 T2",
        "marker": "T2"
      }
    ],
    "run_profile": [
      {
        "km": 0,
        "ele": 10,
        "grade": 0.0,
        "label": "馬公 T2 出發",
        "marker": "T2"
      },
      {
        "km": 5.2,
        "ele": 18,
        "grade": 1.0,
        "label": "重光媽祖銅像(圈1)",
        "marker": "R1"
      },
      {
        "km": 10.5,
        "ele": 6,
        "grade": -0.8,
        "label": "觀音亭虹橋(圈1)",
        "marker": "R2"
      },
      {
        "km": 21.1,
        "ele": 8,
        "grade": 0.0,
        "label": "半馬折返點(圈2)",
        "marker": "R3"
      },
      {
        "km": 31.6,
        "ele": 8,
        "grade": 0.0,
        "label": "觀音亭(圈3)",
        "marker": "R4"
      },
      {
        "km": 42.2,
        "ele": 8,
        "grade": 0.0,
        "label": "觀音亭終點拱門",
        "marker": "🏁"
      }
    ],
    "course_details": {
      "swim_summary": "蒔裡沙灘 3.8km 雙圈海泳，第一圈 1.9km 完成須衝上沙灘「澳式出水」再入水。",
      "bike_summary": "單車 180km（總爬升 820m）：跨海大橋與西嶼西臺 3 圈抗東北季風折返。",
      "run_summary": "路跑 42.2km（觀音亭與媽祖神像 4 圈制）：平坦但海風強、無遮蔭。",
      "key_warnings": [
        "⚠️ 【澳式出水心率控制】：1.9km 上沙灘切勿衝刺，避免入水游第二圈時喘不過氣。",
        "⚠️ 【跨海大橋抗風配瓦】：北上逆風嚴守功率上限、拉高踏頻，側陣風強時握下把防橫風拉扯。"
      ]
    }
  },
  "challenge_taiwan": {
    "course_id": "ct_taitung",
    "name": "Challenge Taiwan 台東國際鐵人三項賽",
    "distance_type": "113",
    "swim_km": 1.9,
    "bike_km": 90.0,
    "run_km": 21.1,
    "bike_elevation_m": 480,
    "run_elevation_m": 95,
    "run_max_alt_m": 42,
    "lat": 22.761,
    "lon": 121.157,
    "water_type": "calm_lake",
    "water_label": "平靜人工湖（台東活水湖，無浪無流、水質清澈）",
    "wetsuit_legal": false,
    "t1_base_mins": 3.8,
    "t2_base_mins": 3.0,
    "bike_profile": [
      {
        "km": 0,
        "ele": 10,
        "grade": 0.0,
        "label": "活水湖 T1",
        "marker": "T1"
      },
      {
        "km": 10,
        "ele": 48,
        "grade": 2.5,
        "label": "中華大橋/杉原",
        "marker": ""
      },
      {
        "km": 22,
        "ele": 65,
        "grade": 1.8,
        "label": "都蘭長緩坡",
        "marker": "B1"
      },
      {
        "km": 35,
        "ele": 32,
        "grade": -1.2,
        "label": "東河包子站",
        "marker": "B2"
      },
      {
        "km": 45,
        "ele": 78,
        "grade": 2.8,
        "label": "成功鎮折返點",
        "marker": "B3"
      },
      {
        "km": 60,
        "ele": 35,
        "grade": -1.5,
        "label": "東河回程",
        "marker": "B4"
      },
      {
        "km": 72,
        "ele": 62,
        "grade": 2.2,
        "label": "都蘭回程緩坡",
        "marker": ""
      },
      {
        "km": 90,
        "ele": 15,
        "grade": 0.0,
        "label": "森林公園/鐵花村 T2",
        "marker": "T2"
      }
    ],
    "run_profile": [
      {
        "km": 0,
        "ele": 15,
        "grade": 0.0,
        "label": "T2 出發",
        "marker": "T2"
      },
      {
        "km": 3.5,
        "ele": 12,
        "grade": -0.2,
        "label": "森林公園琵琶湖",
        "marker": "R1"
      },
      {
        "km": 7.5,
        "ele": 38,
        "grade": 1.5,
        "label": "馬亨亨大道折返(圈1)",
        "marker": "R2"
      },
      {
        "km": 10.5,
        "ele": 15,
        "grade": -1.2,
        "label": "Lap 1 完成",
        "marker": "R3"
      },
      {
        "km": 14.0,
        "ele": 12,
        "grade": 0.0,
        "label": "森林公園(圈2)",
        "marker": "R4"
      },
      {
        "km": 18.0,
        "ele": 38,
        "grade": 1.5,
        "label": "馬亨亨大道(圈2)",
        "marker": "R5"
      },
      {
        "km": 21.1,
        "ele": 18,
        "grade": 0.0,
        "label": "鐵花村終點拱門",
        "marker": "🏁"
      }
    ],
    "course_details": {
      "swim_summary": "於台東森林公園「活水湖」進行，標準長方形人工湖泊，無海浪與暗流。",
      "bike_summary": "台11線花東海岸公路（杉原、都蘭、東河、成功長緩坡起伏）。",
      "run_summary": "串聯台東森林公園、馬亨亨大道與舊鐵道路廊，地形平緩但午後悶熱。",
      "key_warnings": [
        "⚠️ 【活水湖下水卡位】：前 200m 人潮密集，保持穩定換氣不搶快。",
        "⚠️ 【台11線都蘭與成功長緩坡】：坡度約 2–3%，維持空力姿勢與 85rpm 踏頻。",
        "⚠️ 【森林公園與馬亨亨大道悶熱】：每站務必拿冰塊與海綿降溫。"
      ]
    }
  },
  "langkawi": {
    "course_id": "langkawi_226",
    "name": "IRONMAN Malaysia Langkawi 馬來西亞蘭卡威 (226km)",
    "distance_type": "226",
    "swim_km": 3.8,
    "bike_km": 180.0,
    "run_km": 42.2,
    "bike_elevation_m": 1500,
    "run_elevation_m": 140,
    "run_max_alt_m": 165,
    "lat": 6.35,
    "lon": 99.73,
    "water_type": "ocean_calm",
    "water_label": "溫暖平靜海灣（Pantai Kok 雙圈，水溫 29°C 禁防寒衣）",
    "wetsuit_legal": false,
    "t1_base_mins": 6.0,
    "t2_base_mins": 5.5,
    "bike_profile": [
      {
        "km": 0,
        "ele": 8,
        "grade": 0.0,
        "label": "Pantai Kok T1",
        "marker": "T1"
      },
      {
        "km": 18,
        "ele": 95,
        "grade": 5.5,
        "label": "Datai 雨林陡坡",
        "marker": "B1"
      },
      {
        "km": 32,
        "ele": 165,
        "grade": 8.0,
        "label": "The Gullet 魔王坡",
        "marker": "B2"
      },
      {
        "km": 50,
        "ele": 35,
        "grade": -3.0,
        "label": "Tengkorak 丘陵",
        "marker": "B3"
      },
      {
        "km": 95,
        "ele": 25,
        "grade": 0.0,
        "label": "Kuah 折返區",
        "marker": "SN"
      },
      {
        "km": 118,
        "ele": 155,
        "grade": 7.5,
        "label": "The Gullet 二度攻頂",
        "marker": "B4"
      },
      {
        "km": 145,
        "ele": 78,
        "grade": 3.2,
        "label": "Tengkorak 第二圈",
        "marker": "⏱️"
      },
      {
        "km": 180,
        "ele": 12,
        "grade": 0.0,
        "label": "MIEC 冷氣館 T2",
        "marker": "T2"
      }
    ],
    "run_profile": [
      {
        "km": 0,
        "ele": 12,
        "grade": 0.0,
        "label": "MIEC 冷氣館 T2",
        "marker": "T2"
      },
      {
        "km": 5.0,
        "ele": 18,
        "grade": 0.5,
        "label": "機場跑道外圍(暴曬)",
        "marker": "R1"
      },
      {
        "km": 10.5,
        "ele": 8,
        "grade": -0.5,
        "label": "Cenang 海灘(圈1)",
        "marker": "R2"
      },
      {
        "km": 21.1,
        "ele": 15,
        "grade": 0.5,
        "label": "機場熱浪段(圈2)",
        "marker": "R3"
      },
      {
        "km": 31.6,
        "ele": 8,
        "grade": 0.0,
        "label": "Cenang 海灘(圈2)",
        "marker": "R4"
      },
      {
        "km": 42.2,
        "ele": 6,
        "grade": 0.0,
        "label": "Pantai Cenang 終點",
        "marker": "🏁"
      }
    ],
    "course_details": {
      "swim_summary": "Pantai Kok 海灣 3.8km 兩圈制，水溫 29°C 禁止防寒衣。",
      "bike_summary": "180km 總爬升 1,500m，兩度翻越 Datai 與 The Gullet 陡坡，伴隨 34°C 高溫高濕。",
      "run_summary": "MIEC 冷氣房出發繞行機場跑道與珍南海灘 2.5 圈，機場段無遮蔭。",
      "key_warnings": [
        "⚠️ 【The Gullet 陡坡齒比】：務必使用 32T/34T 輕齒比並守住功率上限。",
        "⚠️ 【極端高溫補鈉】：每小時流汗量極大，每站抓冰塊降溫並補充 800–1000mg 鈉。"
      ]
    }
  }
};

function fmtHHMM(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) return "--:--";
    let h = Math.floor(totalMinutes / 60);
    let m = Math.round(totalMinutes % 60);
    if (m === 60) { h += 1; m = 0; }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fmtMMSS(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) return "--:--";
    const totalSec = Math.round(totalMinutes * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtSecToMMSS(secVal) {
    const sTot = Math.max(0, Math.round(secVal));
    const m = Math.floor(sTot / 60);
    const s = sTot % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtPaceKm(totalMinutes, distKm) {
    if (distKm <= 0) return "--:--/km";
    const secPerKm = (totalMinutes * 60.0) / distKm;
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60);
    return `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}/km`;
}

function fmtSwimPace100m(totalMinutes, swimKm) {
    if (swimKm <= 0) return "--:--/100m";
    const secPer100 = (totalMinutes * 60.0) / (swimKm * 10.0);
    const m = Math.floor(secPer100 / 60);
    const s = Math.round(secPer100 % 60);
    return `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}/100m`;
}

function parseHhmmClient(val) {
    if (!val) return 0.0;
    const s = String(val).trim().replace("：", ":");
    if (!s) return 0.0;
    if (s.includes(":")) {
        const parts = s.split(":").map(Number);
        if (parts.some(isNaN)) return 0.0;
        if (parts.length === 2) return parts[0] * 60.0 + parts[1];
        if (parts.length === 3) return parts[0] * 60.0 + parts[1] + parts[2] / 60.0;
    }
    const num = parseFloat(s);
    if (!isNaN(num) && num > 0) {
        return (num <= 16 && s.includes(".")) ? num * 60.0 : num;
    }
    return 0.0;
}

function degToCompassZh(deg) {
    const dirs = ["北風", "東北風", "東風", "東南風", "南風", "西南風", "西風", "西北風"];
    const idx = Math.round(((deg || 0) % 360) / 45) % 8;
    return dirs[idx];
}

async function fetchRaceDayWeatherClient(lat, lon, raceDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let targetDate = new Date(today.getTime() + 7 * 86400000);
    if (raceDateStr) {
        const parsed = new Date(raceDateStr + "T00:00:00");
        if (!isNaN(parsed.getTime())) targetDate = parsed;
    }
    const deltaDays = Math.round((targetDate - today) / 86400000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const isoTarget = `${yyyy}-${mm}-${dd}`;

    try {
        let apiUrl = "";
        let sourceLabel = "";
        if (deltaDays >= 0 && deltaDays <= 15) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=relative_humidity_2m&timezone=Asia%2FTaipei&start_date=${isoTarget}&end_date=${isoTarget}`;
            sourceLabel = `📡 比賽當日 (${isoTarget}) 即時氣象預報 (Open-Meteo Live)`;
        } else {
            const refYear = today.getFullYear() - 1;
            const refDateStr = `${refYear}-${mm}-${dd}`;
            apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=relative_humidity_2m&timezone=Asia%2FTaipei&start_date=${refDateStr}&end_date=${refDateStr}`;
            sourceLabel = `📅 距離比賽尚有 ${deltaDays} 天 — 採用歷年同日 (${mm}/${dd}) 實測氣候大數據`;
        }
        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error("Weather HTTP " + resp.status);
        const data = await resp.json();
        const d = data.daily || {};
        const h = data.hourly || {};

        const tMax = (d.temperature_2m_max && d.temperature_2m_max[0] != null) ? Number(d.temperature_2m_max[0]) : 28.5;
        const tMin = (d.temperature_2m_min && d.temperature_2m_min[0] != null) ? Number(d.temperature_2m_min[0]) : 23.5;
        const appMax = (d.apparent_temperature_max && d.apparent_temperature_max[0] != null) ? Number(d.apparent_temperature_max[0]) : tMax + 2.5;
        const windMax = (d.wind_speed_10m_max && d.wind_speed_10m_max[0] != null) ? Number(d.wind_speed_10m_max[0]) : 18.0;
        const windGust = (d.wind_gusts_10m_max && d.wind_gusts_10m_max[0] != null) ? Number(d.wind_gusts_10m_max[0]) : windMax * 1.35;
        const windDeg = (d.wind_direction_10m_dominant && d.wind_direction_10m_dominant[0] != null) ? Number(d.wind_direction_10m_dominant[0]) : 45;

        let rainProb = 20;
        if (d.precipitation_probability_max && d.precipitation_probability_max[0] != null) {
            rainProb = Math.round(Number(d.precipitation_probability_max[0]));
        } else if (d.precipitation_sum && d.precipitation_sum[0] != null) {
            rainProb = Math.min(90, Math.round(Number(d.precipitation_sum[0]) * 12));
        }

        const humList = (h.relative_humidity_2m || []).slice(6, 15).filter(x => x != null);
        const avgHum = humList.length ? Math.round(humList.reduce((a, b) => a + b, 0) / humList.length) : 76;
        const raceAvgTemp = Number((tMin * 0.35 + tMax * 0.65).toFixed(1));
        const windLevel = windMax >= 28 ? "strong" : (windMax >= 16 ? "moderate" : "calm");

        return {
            race_date: isoTarget,
            source_label: sourceLabel,
            temp_max_c: Number(tMax.toFixed(1)),
            temp_min_c: Number(tMin.toFixed(1)),
            race_avg_temp_c: raceAvgTemp,
            apparent_max_c: Number(appMax.toFixed(1)),
            humidity_pct: avgHum,
            wind_speed_kmh: Number(windMax.toFixed(1)),
            wind_gust_kmh: Number(windGust.toFixed(1)),
            wind_dir: degToCompassZh(windDeg),
            wind_level: windLevel,
            rain_prob_pct: rainProb
        };
    } catch (e) {
        const m = targetDate.getMonth() + 1;
        const isHot = [5, 6, 7, 8, 9, 10].includes(m);
        const baseT = lat < 10 ? 31.5 : (isHot ? 29.0 : 24.5);
        const baseWind = (lon < 120.0 || [10, 11, 12, 1, 2, 3, 4].includes(m)) ? 26.0 : 15.0;
        return {
            race_date: isoTarget,
            source_label: `🌤️ 比賽當日 (${isoTarget}) 季節氣候模型推估`,
            temp_max_c: Number((baseT + 2.0).toFixed(1)),
            temp_min_c: Number((baseT - 3.0).toFixed(1)),
            race_avg_temp_c: baseT,
            apparent_max_c: Number((baseT + 3.5).toFixed(1)),
            humidity_pct: 78,
            wind_speed_kmh: baseWind,
            wind_gust_kmh: Number((baseWind * 1.4).toFixed(1)),
            wind_dir: "東北風",
            wind_level: baseWind >= 25 ? "strong" : "moderate",
            rain_prob_pct: 25
        };
    }
}

async function analyzeCourseClient(url, raceDateStr) {
    const urlLower = (url || "").toLowerCase();
    let matched = null;

    if (["kenting", "墾丁", "小灣", "社頂"].some(k => urlLower.includes(k))) {
        matched = JSON.parse(JSON.stringify(KNOWN_COURSE_TEMPLATES.kenting));
    } else if (["penghu", "澎湖", "蒔裡", "跨海大橋"].some(k => urlLower.includes(k))) {
        matched = JSON.parse(JSON.stringify(KNOWN_COURSE_TEMPLATES.penghu));
    } else if (["langkawi", "malaysia", "蘭卡威"].some(k => urlLower.includes(k))) {
        matched = JSON.parse(JSON.stringify(KNOWN_COURSE_TEMPLATES.langkawi));
    } else if (["challenge-taiwan", "challenge taiwan", "活水湖", "台東", "taitung", "普悠瑪", "puyuma"].some(k => urlLower.includes(k))) {
        matched = JSON.parse(JSON.stringify(KNOWN_COURSE_TEMPLATES.challenge_taiwan));
        if (urlLower.includes("226") && !urlLower.includes("113")) {
            matched.distance_type = "226";
            matched.name = "Challenge Taiwan / 台東 226km 超級鐵人賽";
            matched.swim_km = 3.8;
            matched.bike_km = 180.0;
            matched.run_km = 42.2;
            matched.bike_elevation_m = 950;
            matched.run_elevation_m = 180;
        } else if (urlLower.includes("51.5") || urlLower.includes("515")) {
            matched.distance_type = "515";
            matched.name = "台東 51.5km 標準距離鐵人三項賽";
            matched.swim_km = 1.5;
            matched.bike_km = 40.0;
            matched.run_km = 10.0;
            matched.bike_elevation_m = 210;
            matched.run_elevation_m = 45;
        }
    }

    if (!matched) {
        let distType = "113";
        let swimKm = 1.9, bikeKm = 90.0, runKm = 21.1;
        if (["226", "140.6", "3.8k", "180k", "42.2k", "full"].some(k => urlLower.includes(k))) {
            distType = "226"; swimKm = 3.8; bikeKm = 180.0; runKm = 42.2;
        } else if (["51.5", "515", "olympic", "標鐵"].some(k => urlLower.includes(k))) {
            distType = "515"; swimKm = 1.5; bikeKm = 40.0; runKm = 10.0;
        }
        const bikeEle = distType === "226" ? 750 : (distType === "113" ? 420 : 180);
        const runEle = distType === "226" ? 160 : (distType === "113" ? 90 : 40);
        const maxBikeAlt = Math.max(35, Math.round(bikeEle * 0.16));
        const maxRunAlt = Math.max(20, Math.round(runEle * 0.25));
        matched = {
            course_id: "custom_url",
            name: url ? `自訂解析賽事 (${url.slice(0, 42)}...)` : "標準鐵人三項賽道",
            distance_type: distType,
            swim_km: swimKm,
            bike_km: bikeKm,
            run_km: runKm,
            bike_elevation_m: bikeEle,
            run_elevation_m: runEle,
            run_max_alt_m: maxRunAlt,
            lat: 22.76,
            lon: 121.15,
            water_type: "ocean_calm",
            water_label: "開放水域海泳",
            wetsuit_legal: false,
            t1_base_mins: distType === "226" ? 5.5 : (distType === "113" ? 3.5 : 2.5),
            t2_base_mins: distType === "226" ? 5.0 : (distType === "113" ? 3.0 : 2.0),
            bike_profile: [
                { km: 0, ele: 10, grade: 0.0, label: "T1 出發", marker: "T1" },
                { km: Number((bikeKm * 0.2).toFixed(1)), ele: Math.round(maxBikeAlt * 0.6), grade: 2.2, label: "前段爬升區", marker: "B1" },
                { km: Number((bikeKm * 0.45).toFixed(1)), ele: maxBikeAlt, grade: 2.8, label: "賽道折返高點", marker: "B2" },
                { km: Number((bikeKm * 0.7).toFixed(1)), ele: Math.round(maxBikeAlt * 0.75), grade: 2.0, label: "中後段丘陵", marker: "B3" },
                { km: bikeKm, ele: 12, grade: 0.0, label: "T2 轉換區", marker: "T2" }
            ],
            run_profile: [
                { km: 0, ele: 12, grade: 0.0, label: "T2 出發", marker: "T2" },
                { km: Number((runKm * 0.3).toFixed(1)), ele: maxRunAlt, grade: 2.2, label: "路跑高點", marker: "R1" },
                { km: Number((runKm * 0.6).toFixed(1)), ele: 15, grade: -1.2, label: "折返平路區", marker: "R2" },
                { km: runKm, ele: 12, grade: 0.0, label: "終點拱門", marker: "🏁" }
            ],
            course_details: {}
        };
    }

    const weather = await fetchRaceDayWeatherClient(matched.lat || 22.76, matched.lon || 121.15, raceDateStr);
    matched.weather = weather;
    matched.temp_c = weather.race_avg_temp_c;
    matched.humidity_pct = weather.humidity_pct;
    matched.wind_level = weather.wind_level;
    matched.wind_speed_kmh = weather.wind_speed_kmh;
    matched.wind_gust_kmh = weather.wind_gust_kmh;
    matched.wind_dir = weather.wind_dir;
    matched.rain_prob_pct = weather.rain_prob_pct;
    matched.source_url = url;
    matched.ai_parse_status = `✓ 已自動完成賽道等高線解析 ＆ ${weather.source_label}`;
    return matched;
}

function buildDynamicPlaybookClient(course, swimKm, bikeKm, runKm, neuSwimMins, neuBikeMins, neuRunMins, effFtp, ifRatio, tempC, humidityPct, windSpeedKmh, windGustKmh, windDir) {
    const swimM = Math.round(swimKm * 1000);
    const secPer100m = (neuSwimMins * 60.0) / (swimKm * 10.0);
    const sCuts = swimM === 1900
        ? [0, 200, 700, 1200, 1600, 1900]
        : [0, Math.round(swimM * 0.11), Math.round(swimM * 0.37), Math.round(swimM * 0.63), Math.round(swimM * 0.84), swimM];

    const swimStages = [
        { range_m: `${sCuts[0]}–${sCuts[1]} m`, title: "出發建立節奏", tactic: "用約 85% 體感出發，先求換氣順、避免一開始被人群帶快而喘不過氣。" },
        { range_m: `${sCuts[1]}–${sCuts[2]} m`, title: "第一長邊巡航", tactic: "進入巡航配速，每 6–8 次划手抬頭定位一次，找同速度選手跟游省力。" },
        { range_m: `${sCuts[2]}–${sCuts[3]} m`, title: "折返與橫渡穩定段", tactic: "過浮標時外圈順轉不急停；遇側浪往無浪側換氣，維持穩定划頻。" },
        { range_m: `${sCuts[3]}–${sCuts[4]} m`, title: "第二長邊耐力段", tactic: "核心收緊避免下半身下沉，專注把氣吐光、保持划手抓水距離。" },
        { range_m: `${sCuts[4]}–${sCuts[5]} m`, title: "準備出水進 T1", tactic: "最後 300 m 稍微增加打水頻率喚醒下肢血液循環；上岸後前 30 公尺小跑步穩住暈眩感。" }
    ];

    const buoyMarks = swimM === 1900 ? [200, 400, 750, 1000, 1500, 1900] : [200, 500, 1000, Math.round(swimM * 0.5), Math.round(swimM * 0.8), swimM];
    const buoySplits = buoyMarks.map(bm => {
        const factor = bm <= 200 ? 0.98 : (bm <= 1000 ? 1.00 : 1.01);
        return {
            mark: bm === swimM ? `${bm} m (出水)` : `${bm} m`,
            split_time: fmtMMSS((bm / 100.0) * secPer100m * factor / 60.0)
        };
    });

    const targetNp = Math.round(effFtp * ifRatio);
    const estAp = Math.round(targetNp * 0.95);
    const climbCapW = Math.round(effFtp * Math.min(0.88, ifRatio + 0.10));
    const headwindMinW = Math.round(targetNp * 0.96);

    let bikeSegsRaw = course.bike_segments_template;
    if (!bikeSegsRaw || Math.abs(bikeKm - 90) > 5) {
        const bCuts = [0, Math.round(bikeKm * 0.17), Math.round(bikeKm * 0.39), Math.round(bikeKm * 0.56), Math.round(bikeKm * 0.72), Math.round(bikeKm * 0.91), Math.round(bikeKm)];
        bikeSegsRaw = [
            { range_label: `${bCuts[0]}–${bCuts[1]}`, start_km: bCuts[0], end_km: bCuts[1], title: "穩定出發", np_pct_range: [0.90, 0.96], terrain: `前 ${bCuts[1]} km 出轉換區熱身路段。`, tactics: "剛上車心率偏高，前 15 分鐘先把呼吸放慢、功率壓在目標下緣。", aid_station: "出 T1 後第 10–15 分鐘先喝第一口水。", common_mistake: "剛上車覺得雙腿有力就猛衝超過目標功率 20W 以上。" },
            { range_label: `${bCuts[1]}–${bCuts[2]}`, start_km: bCuts[1], end_km: bCuts[2], title: "去程巡航", np_pct_range: [0.96, 1.01], terrain: `第 ${bCuts[1]}–${bCuts[2]} km 主幹道巡航段。`, tactics: "保持穩定空力姿勢與 85–90 rpm 踏頻，每 20 分鐘固定補給。", aid_station: "經過第一、二處單車補給站補充水壺。", common_mistake: "只顧跟著快車集團拉扯，忽略了自己的功率錶。" },
            { range_label: `${bCuts[2]}–${bCuts[3]}`, start_km: bCuts[2], end_km: bCuts[3], title: "折返與爬升段", np_pct_range: [1.00, 1.03], terrain: `第 ${bCuts[2]}–${bCuts[3]} km 折返點或主要爬升區。`, tactics: "上坡提早換輕齒比，瓦數絕對不超過爬坡上限；折返減速過彎後漸進加速。", aid_station: "折返點前後補給站確認水壺存量。", common_mistake: "上坡硬踩重齒比衝破閾值，提早消耗路跑肝醣。" },
            { range_label: `${bCuts[3]}–${bCuts[4]}`, start_km: bCuts[3], end_km: bCuts[4], title: "回程定瓦巡航", np_pct_range: [0.98, 1.01], terrain: `第 ${bCuts[3]}–${bCuts[4]} km 回程長距離穩定段。`, tactics: "順風趁機吃能量膠與喝水，逆風則握下把或收窄手肘守住瓦數。", aid_station: "按時完成中段能量膠與鹽錠補充。", common_mistake: "中後段忘記喝水導致核心體溫上升、心率漂移。" },
            { range_label: `${bCuts[4]}–${bCuts[5]}`, start_km: bCuts[4], end_km: bCuts[5], title: "後段抗風與丘陵", np_pct_range: [0.95, 1.00], terrain: `第 ${bCuts[4]}–${bCuts[5]} km 體能考驗與丘陵段。`, tactics: "雙腿開始疲勞時，專注維持圓滑踩踏，不與逆風硬拚。", aid_station: "最後一處單車補給站補水。", common_mistake: "為了維持帳面時速而在逆風段硬踩超標。" },
            { range_label: `${bCuts[5]}–${bCuts[6]}`, start_km: bCuts[5], end_km: bCuts[6], title: "準備 T2 轉換", np_pct_range: [0.82, 0.90], terrain: `最後 ${bCuts[6] - bCuts[5]} km 滑回 T2 轉換區。`, tactics: "主動降瓦 10–15%、拉高踏頻至 90 rpm 活絡下肢；最後 15 分鐘少吃固體食物讓胃排空。", aid_station: "進 T2 轉換區前減速慢行。", common_mistake: "一路重踩衝進 T2，一下車雙腿僵硬抽筋。" }
        ];
    }

    const bikeSegments = bikeSegsRaw.map(seg => {
        const [loPct, hiPct] = seg.np_pct_range;
        const wLo = Math.round(targetNp * loPct);
        const wHi = Math.round(targetNp * hiPct);
        const ifLo = (ifRatio * loPct).toFixed(2);
        const ifHi = (ifRatio * hiPct).toFixed(2);
        return {
            range_label: seg.range_label,
            start_km: seg.start_km,
            end_km: seg.end_km,
            title: seg.title,
            flat_watts: `${wLo}–${wHi}`,
            np_pct: `${Math.round(loPct * 100)}–${Math.round(hiPct * 100)}`,
            if_range: `IF 約 ${ifLo}–${ifHi}`,
            climb_cap_w: climbCapW,
            terrain: seg.terrain,
            tactics: seg.tactics,
            aid_station: seg.aid_station,
            common_mistake: seg.common_mistake
        };
    });

    const avgRunSecPerKm = (neuRunMins * 60.0) / runKm;
    const flatBaseSecPerKm = Math.max(210.0, avgRunSecPerKm - ((course.run_elevation_m || 0) / 100.0) * 8.0);

    let runSegsRaw = course.run_segments_template;
    if (!runSegsRaw || Math.abs(runKm - 21.1) > 3) {
        const rCuts = [0.0, Number((runKm * 0.10).toFixed(1)), Number((runKm * 0.28).toFixed(1)), Number((runKm * 0.45).toFixed(1)), Number((runKm * 0.68).toFixed(1)), Number((runKm * 0.82).toFixed(1)), Number(runKm.toFixed(1))];
        runSegsRaw = [
            { range_label: `${rCuts[0]}–${rCuts[1]}`, start_km: rCuts[0], end_km: rCuts[1], title: "保守起跑", tag: `轉換適應 · ${(rCuts[1]-rCuts[0]).toFixed(1)} km`, pace_offset_sec: [10, 15], terrain: "出 T2 轉換區前段，雙腿剛由騎車切換為跑步。", intensity: "比平路目標配速慢 10–15 秒/km，心率絕對先別衝上去。", form_tip: "步幅小、步頻高 (175–180 spm)，讓雙腿平順切換。", aid_station: "第一處補給站先喝水、拿海綿或冰塊降溫。", common_mistake: "被 T2 出發的人潮帶快，前 2 km 快了 20 秒/km 以上。" },
            { range_label: `${rCuts[1]}–${rCuts[2]}`, start_km: rCuts[1], end_km: rCuts[2], title: "依坡度調整強度", tag: `前段爬升/節奏 · ${(rCuts[2]-rCuts[1]).toFixed(1)} km`, pace_offset_sec: (course.run_elevation_m || 0) > 180 ? [15, 35] : [0, 8], terrain: `第 ${rCuts[1]}–${rCuts[2]} km 賽道前段起伏區。`, intensity: "看心率與呼吸，不死守配速；遇上坡縮短步幅維持穩定出力。", form_tip: "身體微前傾、手肘往後擺動帶動步伐。", aid_station: "經過 R2/R3 補給站固定補水與電解質。", common_mistake: "上坡硬維持平路配速導致心率過早突破閾值。" },
            { range_label: `${rCuts[2]}–${rCuts[3]}`, start_km: rCuts[2], end_km: rCuts[3], title: "下坡與折返保持跑姿", tag: `中前段 · ${(rCuts[3]-rCuts[2]).toFixed(1)} km`, pace_offset_sec: [-5, 5], terrain: `第 ${rCuts[2]}–${rCuts[3]} km 下坡或折返轉換路段。`, intensity: "進入平順巡航節奏，下坡不跨大步煞車。", form_tip: "落地點在身體重心正下方，減少股四頭肌離心衝擊。", aid_station: "小口喝水，按時補充第一份跑步能量膠。", common_mistake: "下坡跨大步腳跟煞車導致大腿前側提早僵硬。" },
            { range_label: `${rCuts[3]}–${rCuts[4]}`, start_km: rCuts[3], end_km: rCuts[4], title: "進入穩定配速", tag: `中段巡航 · ${(rCuts[4]-rCuts[3]).toFixed(1)} km`, pace_offset_sec: [-3, 7], terrain: `第 ${rCuts[3]}–${rCuts[4]} km 核心平路巡航段。`, intensity: "鎖定平路目標配速，專心執行呼吸與補水節奏。", form_tip: "放鬆肩膀，每過一個補給站就用冷水淋頭降核心體溫。", aid_station: "每 30 分鐘補充 30g 碳水（能量膠配白開水）。", common_mistake: "正午氣溫升高卻只顧跑、沒拿冰塊降溫導致心率漂移。" },
            { range_label: `${rCuts[4]}–${rCuts[5]}`, start_km: rCuts[4], end_km: rCuts[5], title: "檢查剩餘體力", tag: `中後段耐力考驗 · ${(rCuts[5]-rCuts[4]).toFixed(1)} km`, pace_offset_sec: [0, 12], terrain: `第 ${rCuts[4]}–${rCuts[5]} km 體能撞牆考驗區。`, intensity: "守住目標配速上限，可補充咖啡因膠或可樂提振精神。", form_tip: "專注維持 175+ 步頻，步頻不掉、配速就不會崩盤。", aid_station: "折返關門點補給站，補充足夠鈉與水分防抽筋。", common_mistake: "心態鬆懈開始走路，一旦停下就很難重新跑起來。" },
            { range_label: `${rCuts[5]}–${rCuts[6]}`, start_km: rCuts[5], end_km: rCuts[6], title: "有餘裕才加速", tag: `最後衝刺 · ${(rCuts[6]-rCuts[5]).toFixed(1)} km`, pace_offset_sec: [-10, 10], terrain: `最後 ${(rCuts[6]-rCuts[5]).toFixed(1)} km 回程奔向終點拱門。`, intensity: "若呼吸與雙腿還有餘裕，每 km 可快 5–10 秒；若無餘裕就穩守目標配速到底。", form_tip: "擺臂帶動加速，眼睛看前方的下一個目標。", aid_station: "最後補給站拿水漱口或淋頭即可，穩定迎接終點！", common_mistake: "最後 500m 突然猛衝導致終點前小腿劇烈抽筋。" }
        ];
    }

    const runSegments = runSegsRaw.map(seg => {
        const [offLo, offHi] = seg.pace_offset_sec;
        const pLo = flatBaseSecPerKm + offLo;
        const pHi = flatBaseSecPerKm + offHi;
        const pMid = 0.5 * (pLo + pHi);
        const segDist = Math.max(0.1, seg.end_km - seg.start_km);
        const segMins = (pMid * segDist) / 60.0;
        const signLo = offLo >= 0 ? `+${offLo}` : `${offLo}`;
        const signHi = offHi >= 0 ? `+${offHi}` : `${offHi}`;
        return {
            range_label: seg.range_label,
            start_km: seg.start_km,
            end_km: seg.end_km,
            title: seg.title,
            tag: seg.tag,
            pace_range: `${fmtSecToMMSS(pLo)} – ${fmtSecToMMSS(pHi)}`,
            offset_note: `平路目標 ${fmtSecToMMSS(flatBaseSecPerKm)}，本段 ${signLo} ~ ${signHi} 秒`,
            est_time: fmtMMSS(segMins),
            terrain: seg.terrain,
            intensity: seg.intensity,
            form_tip: seg.form_tip,
            aid_station: seg.aid_station,
            common_mistake: seg.common_mistake
        };
    });

    const bikeCarbsPerHr = ["113", "226"].includes(String(course.distance_type)) ? 75 : 60;
    const runCarbsPerHr = ["113", "226"].includes(String(course.distance_type)) ? 60 : 45;
    const bikeHrs = neuBikeMins / 60.0;
    const runHrs = neuRunMins / 60.0;

    const totalBikeCarbsG = Math.round(bikeHrs * bikeCarbsPerHr);
    const totalRunCarbsG = Math.round(runHrs * runCarbsPerHr);

    const bikeBottles = Math.max(1, Math.round(bikeHrs * 0.8));
    const bikeDrinkCarbs = bikeBottles * 40;
    const bikeGels = Math.max(1, Math.ceil(Math.max(0, totalBikeCarbsG - bikeDrinkCarbs) / 30.0));
    const actualBikeCarbs = bikeDrinkCarbs + bikeGels * 30;

    const runCups = Math.max(2, Math.round(runHrs * 2.2));
    const runDrinkCarbs = runCups * 10;
    const runGels = Math.max(1, Math.ceil(Math.max(0, totalRunCarbsG - runDrinkCarbs) / 30.0));
    const actualRunCarbs = runDrinkCarbs + runGels * 30;

    const recWaterMlHr = Math.round(550 + Math.max(0.0, tempC - 22.0) * 35 + Math.max(0.0, humidityPct - 65.0) * 4);
    const recSodiumMgHr = Math.round(500 + Math.max(0.0, tempC - 22.0) * 30 + Math.max(0.0, humidityPct - 65.0) * 3);

    const bikeSchedule = [];
    let tMark = 30;
    const per30mBikeG = Math.round(bikeCarbsPerHr / 2.0);
    while (tMark <= Math.floor(neuBikeMins) - 10) {
        bikeSchedule.push({ time: fmtHHMM(tMark), carbs_g: `${per30mBikeG} g` });
        tMark += 30;
    }

    const runSchedule = [];
    tMark = 30;
    const per30mRunG = Math.round(runCarbsPerHr / 2.0);
    while (tMark <= Math.floor(neuRunMins) - 8) {
        runSchedule.push({ time: fmtHHMM(tMark), carbs_g: `${per30mRunG} g` });
        tMark += 30;
    }

    const raceRisks = [
        { id: 1, title: "開放水域恐慌與海況", identify: ["下水後呼吸急促、換氣不順、覺得胸口緊迫", "被周圍選手碰撞或蛙鏡進水導致手腳慌亂", "海浪湧起時看不見前方浮標而偏航"], prevent: ["下水前先潑水在臉與胸口讓迷走神經適應水溫", "依照自己的 100m 配速排在對應出發區，不搶第一排肉搏", "前 200 m 只用 85% 力道游，先求吐氣完全再求划手距離"], respond: ["立刻改為蛙式或仰漂 5–10 秒，專注把氣『吐光』", "向側面游開 3–5 公尺脫離擁擠人群，重新建立兩划或三划一換氣", "每次抬頭定位看大地形地標（如飯店屋頂或山峰）輔助導航"], stop_when: ["持續胸痛、頭暈目眩或完全無法控制呼吸", "➔ 立即高舉單手脫帽向水上救生艇或戒護浮板示意休息"] },
        { id: 2, title: "側風與逆風", identify: [`當日預報風速 ${windSpeedKmh} km/h (陣風 ${windGustKmh} km/h)，車把被推動、車身左右晃動`, "帳面速度明顯下降，但功率計瓦數已經頂到上限", "強陣風吹來時無法維持直線騎乘"], prevent: ["看當日陣風預報選擇輪組框高（陣風 >35 km/h 前輪避免高框板輪）", "平時練習低姿空力與握彎把下把位穩定控車", "預先心理建設：逆風段看瓦數不看時速"], respond: [`逆風：守功率下限 (${headwindMinW}–${targetNp} W)，壓低身體減少迎風面積`, "側風：雙手緊握牛角或彎把下把、不強躺休息把，身體重心放低", "與前車及側邊選手拉開安全距離，通過涵洞或缺口時預備陣風"], stop_when: ["陣風大到完全無法控制車頭方向或車身嚴重偏擺", "➔ 立即坐直減速，靠左/靠右停到路邊安全處等待陣風過去"] },
        { id: 3, title: "自行車過度輸出", identify: [`平路頻繁超過 ${targetNp + 15} W，或短坡衝破 ${climbCapW + 15} W`, "心率比平常同瓦數高出 8–10 bpm 以上", "騎乘過半後覺得大腿前側緊繃灼熱、踏頻掉到 70 rpm 以下"], prevent: [`將車錶主畫面設定『3秒功率』與『圈 NP』，嚴守目標 NP ${targetNp} W`, "前 15 km 強制保守騎乘，不跟隨超越自己的快車", "上坡提早換輕齒比，寧可慢 30 秒過坡頂也不燒掉無氧火柴"], respond: ["立刻退一至兩檔，將踏頻拉回 85 rpm 以上並主動降瓦 10–15 W", "利用下坡與順風段放鬆雙腿，立刻補充運動飲料與水分", "最後 8 km 強制降瓦進行雙腿排酸"], stop_when: ["雙腿大腿內側或股四頭肌開始頻繁跳動（嚴重抽筋前兆）", "➔ 大幅降低瓦數輕鬆踩踏，進補給站補水與電解質"] },
        { id: 4, title: "高溫與熱傷害", identify: [`當日預估氣溫 ${tempC}°C / 濕度 ${Math.round(humidityPct)}%，出現頭暈、起雞皮疙瘩或異常發冷`, "配速明明沒加快，但心率一路往上飆升（心率漂移）", "停止流汗、皮膚乾熱或注意力無法集中"], prevent: ["每個補給站都拿冰塊塞進三鐵衣後頸與帽子內物理降溫", `每小時穩定補充約 ${recWaterMlHr} ml 水分與 ${recSodiumMgHr} mg 鈉`, "跑步前段在無遮蔭路段主動降速 5–10 秒/km"], respond: ["立刻降速或改為快走，在補給站用大量冰水淋頭、頸部與大腿", "飲用含電解質的冷水，解開三鐵衣拉鍊幫助散熱", "在遮蔭處休息 2–3 分鐘觀察心率是否回落"], stop_when: ["出現意識模糊、步態不穩、噁心嘔吐或完全無汗", "➔ 立即停止比賽，向就近醫護站或裁判求助降溫"] },
        { id: 5, title: "補給不足與腸胃不適", identify: ["胃部脹氣、水聲晃動（胃排空變慢）、噁心想吐", "騎車後段或跑步中段突然全身無力、雙腿像灌鉛（低血糖撞牆）", "完全吃不下甜膩的能量膠"], prevent: ["照時鐘吃（每 20–30 分鐘小口補給），不照感覺吃", "能量膠一定要配白開水吞服，不可直接配高濃度運動飲料", "騎車最後 15 分鐘少吃固體食物，讓胃在跑步前清空"], respond: ["腸胃脹氣時：暫停吃能量膠 20 分鐘，改用運動飲料或可樂漱口，並降低運動強度讓血液流回腸胃", "低血糖飢餓時：立刻補充好吸收的液態碳水或半包能量膠"], stop_when: ["持續劇烈嘔吐、無法喝下任何水分或伴隨嚴重腹痛", "➔ 進入醫療帳篷休息評估，避免嚴重脫水"] },
        { id: 6, title: "跑步抽筋", identify: ["小腿肚、大腿後側或股四頭肌出現局部抽動與緊繃感", "上下坡轉換或跨過折返點時肌肉突然鎖死"], prevent: ["單車嚴格守住上坡瓦數上限，不提前透支股四頭肌", "下坡跑維持高步頻、重心在身體下方，避免跨大步煞車", `每小時穩定補充 ${recSodiumMgHr} mg 鈉與電解質`], respond: ["一有抽動前兆立刻縮短步幅、降低推蹬力道，改用小碎步慢跑", "若已抽筋鎖死：停在路邊溫和伸展拮抗肌，補充鹽錠/電解質水，待緩解後先快走 1 分鐘再慢跑"], stop_when: ["多處大肌群同時劇烈痙攣、尿液呈深褐色（橫紋肌溶解警訊）", "➔ 立即停止比賽並尋求醫療協助"] },
        { id: 7, title: "跑步前段超速", identify: ["剛出 T2 前 2 km 覺得雙腿很輕，配速比目標快 15–25 秒/km", "呼吸已經開始微喘，心率衝進 Z4 閾值區"], prevent: ["熟記『前 2 km 保守起跑口訣』：比目標配速慢 10–15 秒/km", "出 T2 第 1 km 強制看錶壓速，不被周圍選手帶節奏"], respond: ["發現第 1 km 太快時，第 2 km 立刻主動放慢 15 秒/km 把心率壓回來", "趁還不渴時在 R1 補給站先喝幾口水並拿海綿降溫"], stop_when: ["前段超速導致進入爬坡段時胸悶心悸", "➔ 立即改為快走直到呼吸與心率恢復平穩"] },
        { id: 8, title: "最後 5 km 失速", identify: ["最後 5 km 步頻掉到 165 以下、雙腿沉重抬不起來", "配速每公里掉超過 30 秒，甚至想停下來走路"], prevent: ["前段上坡與下坡嚴格執行保護股四頭肌策略", "第 14–16 km 按時吃最後一包能量膠或喝幾口可樂"], respond: ["把大目標拆小：『只跑到下一個補給站或下一根電線桿』", "不看配速，專注擺動雙手手肘帶動步頻，就算慢跑也比走路快", "補給站拿冰水淋臉提振精神，穩定跑向終點"], stop_when: ["出現嚴重暈眩、胸悶或視野變窄", "➔ 絕對不要硬撐衝線，立即停下向志工與醫護人員求助"] }
    ];

    return {
        swim_plan: {
            headline: "前 200 m 不搶，最後 300 m 準備出水。",
            target_pace_100m: fmtSecToMMSS(secPer100m),
            theory_time: fmtMMSS(neuSwimMins),
            total_m: swimM,
            stages: swimStages,
            buoy_splits: buoySplits
        },
        bike_plan: {
            headline: `六段騎法，前 ${bikeSegments[0].end_km} km 與最後 ${Math.round(bikeKm - bikeSegments[bikeSegments.length - 1].start_km)} km 都要收。`,
            wind_headline: "環境變了，守住功率，不守速度。",
            ftp_w: Math.round(effFtp),
            target_if: Number(ifRatio.toFixed(2)),
            target_np_w: targetNp,
            est_ap_w: `${estAp - 4}–${estAp + 4}`,
            climb_cap_w: climbCapW,
            headwind_w: `${headwindMinW}–${targetNp}`,
            avg_speed_kmh: Number((bikeKm / (neuBikeMins / 60.0)).toFixed(1)),
            segments: bikeSegments,
            computer_setup: {
                fields: "3 秒功率、圈 NP、心率、騎乘時間、距離、踏頻",
                alerts: `每 20 分鐘飲食提醒；超過 ${climbCapW} W 時上坡功率警示`,
                laps: `關閉自動圈，每段手動按圈，對照目標 NP ${targetNp} W`
            }
        },
        run_plan: {
            headline: "把平路配速，換成賽道每一段的配速。",
            flat_base_pace: fmtSecToMMSS(flatBaseSecPerKm),
            terrain_est_time: fmtMMSS(neuRunMins),
            segments: runSegments
        },
        fueling_plan: {
            headline: "照時鐘吃，不照感覺吃。",
            bike_carbs_rate: bikeCarbsPerHr,
            run_carbs_rate: runCarbsPerHr,
            bike_total_g: totalBikeCarbsG,
            run_total_g: totalRunCarbsG,
            bike_summary: `能量膠 ${bikeGels} 包 + 運動飲料 ${bikeBottles} 瓶 (${bikeDrinkCarbs} g)`,
            run_summary: `能量膠 ${runGels} 包 + 運動飲料 ${runCups} 杯 (${runDrinkCarbs} g)`,
            ledger: [
                { item: `騎車：運動飲料 ${bikeBottles} 瓶 (每瓶 40g)`, grams: `${bikeDrinkCarbs} g` },
                { item: `騎車：能量膠 ${bikeGels} 包 (每包 30g)`, grams: `${bikeGels * 30} g` },
                { item: `跑步：補給站運動飲料 ${runCups} 杯 (每杯 10g)`, grams: `${runDrinkCarbs} g` },
                { item: `跑步：能量膠 ${runGels} 包 (每包 30g)`, grams: `${runGels * 30} g` }
            ],
            total_required_g: totalBikeCarbsG + totalRunCarbsG,
            total_carried_g: actualBikeCarbs + actualRunCarbs,
            water_ml_hr: recWaterMlHr,
            sodium_mg_hr: recSodiumMgHr,
            total_bike_water_ml: Math.round(recWaterMlHr * bikeHrs / 50) * 50,
            total_run_water_ml: Math.round(recWaterMlHr * runHrs / 50) * 50,
            bike_schedule: bikeSchedule,
            run_schedule: runSchedule
        },
        race_risks: raceRisks
    };
}

function runAdaptivePredictionClient(payload) {
    const courseIn = payload.course || {};
    const cId = courseIn.course_id || "";
    let templateRef = null;
    for (const [k, v] of Object.entries(KNOWN_COURSE_TEMPLATES)) {
        if (v.course_id === cId || String(courseIn.name || "").toLowerCase().includes(k) || (String(courseIn.name || "").includes("墾丁") && k === "kenting")) {
            templateRef = v;
            break;
        }
    }
    const course = Object.assign({}, templateRef || {}, courseIn);
    const blocks = payload.blocks || {};

    const distType = String(course.distance_type || "113");
    const swimKm = Number(course.swim_km || (distType === "226" ? 3.8 : (distType === "113" ? 1.9 : 1.5)));
    const bikeKm = Number(course.bike_km || (distType === "226" ? 180.0 : (distType === "113" ? 90.0 : 40.0)));
    const runKm = Number(course.run_km || (distType === "226" ? 42.2 : (distType === "113" ? 21.1 : 10.0)));
    const bikeEleM = Number(course.bike_elevation_m || 0);
    const runEleM = Number(course.run_elevation_m || 0);

    const tempC = Number(course.temp_c || 27.5);
    const humidityPct = Number(course.humidity_pct || 76);
    const windSpeedKmh = Number(course.wind_speed_kmh || 18.0);
    const windGustKmh = Number(course.wind_gust_kmh || 28.0);
    const windDir = String(course.wind_dir || "東北風");
    const rainProbPct = Number(course.rain_prob_pct || 20);
    const waterType = String(course.water_type || "ocean_calm");
    const wetsuitLegal = Boolean(course.wetsuit_legal);

    const benchmarks = {
        "515": { swim_wk: 3.5, bike_wk: 60.0, run_wk: 20.0, if_pct: 85.0 },
        "113": { swim_wk: 5.0, bike_wk: 95.0, run_wk: 28.0, if_pct: 80.0 },
        "226": { swim_wk: 7.0, bike_wk: 120.0, run_wk: 35.0, if_pct: 69.0 }
    }[distType] || { swim_wk: 5.0, bike_wk: 95.0, run_wk: 28.0, if_pct: 80.0 };

    const activeModels = [
        "⛰️ 賽道等高線坡度物理模型 (含上下坡折返淨損益校準)",
        `🌤️ 比賽當日氣象模型 (${tempC}°C / 濕度${Math.round(humidityPct)}% / 風速${windSpeedKmh}km/h)`
    ];
    const missingHints = [];
    let confidenceScore = 32;

    const blockA = blocks.blockA || {};
    let pbDistType = String(blockA.pbDistType || "none");
    let pbTotalMins = parseHhmmClient(blockA.pbTotal);
    let pbSwimMins = parseHhmmClient(blockA.pbSwim);
    let pbT1Mins = parseHhmmClient(blockA.pbT1);
    let pbBikeMins = parseHhmmClient(blockA.pbBike);
    let pbT2Mins = parseHhmmClient(blockA.pbT2);
    let pbRunMins = parseHhmmClient(blockA.pbRun);

    if (pbDistType === "none" && (pbTotalMins || pbSwimMins || pbBikeMins || pbRunMins)) {
        pbDistType = pbTotalMins ? (pbTotalMins < 230 ? "515" : (pbTotalMins < 510 ? "113" : "226")) : distType;
    }

    const hasPb = pbDistType !== "none" && Boolean(pbTotalMins || pbSwimMins || pbBikeMins || pbRunMins);
    if (hasPb) {
        if (pbSwimMins && pbBikeMins && pbRunMins) {
            confidenceScore += 24;
            activeModels.push("🏆 積木 A：歷史五分項 PB 實戰轉換模型");
        } else if (pbTotalMins) {
            confidenceScore += 18;
            activeModels.push("🏆 積木 A：歷史總成績 PB (Riegel 冪次拆解)");
            if (!pbSwimMins) pbSwimMins = pbTotalMins * 0.108;
            if (!pbT1Mins) pbT1Mins = pbDistType === "226" ? 6.0 : (pbDistType === "113" ? 3.0 : 2.5);
            if (!pbBikeMins) pbBikeMins = pbTotalMins * 0.510;
            if (!pbT2Mins) pbT2Mins = pbDistType === "226" ? 6.0 : (pbDistType === "113" ? 3.0 : 2.0);
            if (!pbRunMins) pbRunMins = Math.max(20.0, pbTotalMins - pbSwimMins - pbT1Mins - pbBikeMins - pbT2Mins);
        } else {
            confidenceScore += 12;
            activeModels.push("🏆 積木 A：部分分項 PB 校準");
        }
    } else {
        missingHints.push("可選填【積木 A：過往比賽最佳成績】，納入您的實戰轉換效率 (+24% 精準度)");
    }

    const pbRefSwimKm = pbDistType === "226" ? 3.8 : (pbDistType === "113" ? 1.9 : 1.5);
    const pbRefBikeKm = pbDistType === "226" ? 180.0 : (pbDistType === "113" ? 90.0 : 40.0);
    const pbRefRunKm = pbDistType === "226" ? 42.2 : (pbDistType === "113" ? 21.1 : 10.0);

    const blockB = blocks.blockB || {};
    const cssSec100m = Number(blockB.swimSecPer100m || 0);
    const ftpWatts = Number(blockB.ftpWatts || 0);
    const flatSpeedKmh = Number(blockB.flatSpeedKmh || 0);
    const weightKg = Number(blockB.weightKg || 68.0);
    const bikeType = String(blockB.bikeType || "road_clipon");
    const hmPbMins = parseHhmmClient(blockB.hmPb);
    const runPaceSec = Number(blockB.runPaceSecPerKm || 0);

    const swimDecay = swimKm <= 1.6 ? 1.00 : (swimKm <= 2.2 ? 1.022 : 1.082);
    let effCssSec = 105.0;
    let swimSource = "";
    if (cssSec100m >= 50) {
        confidenceScore += 10;
        activeModels.push("🏊 積木 B：CSS 臨界泳速流體模型");
        effCssSec = cssSec100m;
        swimSource = `日常 100m 泳速 (${Math.round(effCssSec)}秒/100m)`;
    } else if (hasPb && pbSwimMins) {
        effCssSec = ((pbSwimMins * 60.0) / (pbRefSwimKm * 10.0)) / (pbDistType === "113" ? 1.022 : 1.082);
        swimSource = `由歷史游泳 PB 反推 (約 ${Math.round(effCssSec)}秒/100m)`;
    } else {
        effCssSec = 105.0;
        swimSource = "TP 標竿選手基準 (105秒/100m ➔ 70.3 平靜水域 34分 / 226 72分)";
        missingHints.push("可選填【積木 B：游泳 100m 秒數】精算個人海泳與各浮標時間");
    }

    let flatSwimMins = (swimKm * 10.0 * effCssSec * swimDecay) / 60.0;
    if (hasPb && pbSwimMins) {
        const scaledPbSwim = pbSwimMins * Math.pow(swimKm / pbRefSwimKm, 1.03);
        flatSwimMins = cssSec100m >= 50 ? (0.65 * flatSwimMins + 0.35 * scaledPbSwim) : scaledPbSwim;
    }

    let waterNeuMod = ({ calm_lake: 0.0, ocean_calm: 1.5, ocean_swell: 2.0, current_assist: -2.0 }[waterType] ?? 2.0) * (swimKm / 1.9);
    if (wetsuitLegal) waterNeuMod -= 2.0 * (swimKm / 1.9);

    const ifRatio = benchmarks.if_pct / 100.0;
    const aeroFactor = ({ tt_aero: 1.02, road_clipon: 1.00, road_drop: 0.95 }[bikeType]) || 1.00;
    let effFtp = 205.0, targetWatts = 164.0, estFlatKmh = 33.54, bikeSource = "";

    if (ftpWatts >= 70) {
        confidenceScore += 12;
        activeModels.push("🚴 積木 B：BBS 功率空氣力學與 W/kg 爬坡模型");
        effFtp = ftpWatts;
        targetWatts = effFtp * ifRatio;
        estFlatKmh = 32.7 * Math.pow(targetWatts / 141.5, 0.175) * Math.pow(68.0 / Math.max(42.0, weightKg), 0.06) * aeroFactor;
        bikeSource = `FTP ${Math.round(effFtp)}W (${(effFtp / Math.max(42.0, weightKg)).toFixed(2)} W/kg)`;
    } else if (flatSpeedKmh >= 15) {
        confidenceScore += 9;
        activeModels.push("🚴 積木 B：平路巡航時速與坡度物理轉換");
        const distSpeedMod = distType === "226" ? 0.95 : (distType === "113" ? 1.00 : 1.03);
        estFlatKmh = flatSpeedKmh * distSpeedMod;
        targetWatts = 164.0 * Math.pow(estFlatKmh / (33.54 * aeroFactor), 1.0 / 0.175);
        effFtp = targetWatts / ifRatio;
        bikeSource = `平路均速 ${flatSpeedKmh.toFixed(1)}km/h (推算等效 FTP ~${Math.round(effFtp)}W)`;
    } else if (hasPb && pbBikeMins) {
        const pbKmh = pbRefBikeKm / (pbBikeMins / 60.0);
        estFlatKmh = pbKmh * Math.pow(pbRefBikeKm / bikeKm, 0.04);
        targetWatts = 164.0 * Math.pow(estFlatKmh / (33.54 * aeroFactor), 1.0 / 0.175);
        effFtp = targetWatts / ifRatio;
        bikeSource = `由歷史單車 PB 反推 (等效 FTP ~${Math.round(effFtp)}W)`;
        missingHints.push("可選填【積木 B：單車 FTP 或平路時速】精算六段騎法瓦數");
    } else {
        effFtp = 205.0;
        targetWatts = effFtp * ifRatio;
        estFlatKmh = 32.7 * Math.pow(targetWatts / 141.5, 0.175) * aeroFactor;
        bikeSource = "TP 標竿選手基準 (FTP 205W ➔ 70.3 平路 02:41 / 226 平路 05:30)";
        missingHints.push("可選填【積木 B：單車 FTP 或平路時速】改依您的個人輸出計算");
    }

    let flatBikeMins = (bikeKm / Math.max(16.0, estFlatKmh)) * 60.0;
    if (hasPb && pbBikeMins) {
        const pbFlatEquiv = Math.max(60.0, pbBikeMins - 6.0 * (pbRefBikeKm / 90.0)) * Math.pow(bikeKm / pbRefBikeKm, 1.04);
        flatBikeMins = (ftpWatts >= 70 || flatSpeedKmh >= 15) ? (0.68 * flatBikeMins + 0.32 * pbFlatEquiv) : pbFlatEquiv;
    }

    const wkgFactor = (205.0 / 68.0) / Math.max(1.6, effFtp / Math.max(42.0, weightKg));
    const eleBikeNeuMins = (bikeEleM / 100.0) * 1.85 * Math.pow(wkgFactor, 0.65);
    let windBikeNeuMins = Math.max(0.0, (windSpeedKmh - 12.0) * 0.48 + Math.max(0.0, windGustKmh - 26.0) * 0.22) * (bikeKm / 90.0);
    if (rainProbPct >= 60) windBikeNeuMins += 2.5 * (bikeKm / 90.0);

    const triFatigueMult = distType === "226" ? 1.135 : (distType === "113" ? 1.095 : 1.065);
    let effHmMins = 104.1, flatRunMins = 114.0, runSource = "";
    if (hmPbMins && hmPbMins >= 60) {
        confidenceScore += 10;
        activeModels.push("🏃 積木 B：Jack Daniels VDOT 與騎轉跑轉換疲勞模型");
        effHmMins = hmPbMins;
        flatRunMins = effHmMins * Math.pow(runKm / 21.0975, 1.065) * triFatigueMult;
        runSource = `單項半馬 ${fmtHHMM(effHmMins)} (含騎轉跑轉換係數)`;
    } else if (runPaceSec && runPaceSec >= 180) {
        confidenceScore += 8;
        activeModels.push("🏃 積木 B：日常配速與騎轉跑轉換疲勞模型");
        effHmMins = (runPaceSec * 0.96 * 21.0975) / 60.0;
        flatRunMins = effHmMins * Math.pow(runKm / 21.0975, 1.065) * triFatigueMult;
        runSource = `日常配速 ${Math.floor(runPaceSec / 60)}:${String(Math.round(runPaceSec % 60)).padStart(2, '0')}/km`;
    } else if (hasPb && pbRunMins) {
        const pbFlatRunEquiv = Math.max(25.0, pbRunMins - 3.0 * (pbRefRunKm / 21.1));
        flatRunMins = pbFlatRunEquiv * Math.pow(runKm / pbRefRunKm, 1.075);
        effHmMins = (pbFlatRunEquiv / (pbDistType === "226" ? 1.135 : 1.095)) * Math.pow(21.0975 / pbRefRunKm, 1.065);
        runSource = "由歷史鐵人路跑 PB 反推 (已含騎轉跑轉換)";
        missingHints.push("可選填【積木 B：半馬成績或日常跑步配速】交叉驗證");
    } else {
        effHmMins = 104.1;
        flatRunMins = distType === "226" ? 240.0 : (distType === "113" ? 114.0 : 51.0);
        runSource = "TP 標竿選手基準 (70.3 平路轉換跑 01:54 / 226 平路轉換跑 04:00)";
        missingHints.push("可選填【積木 B：半馬成績或跑步配速】改依您的個人跑力計算");
    }

    const hmVel = 21097.5 / Math.max(62.0, effHmMins);
    const estVdot = Number(((-4.60 + 0.182258 * hmVel + 0.000104 * (hmVel * hmVel)) / 0.85).toFixed(1));

    // WBGT 綜合熱壓力與露點溫度 + 賽道坡度陡峭度 (VI)
    const gammaDp = (17.27 * tempC) / (237.7 + tempC) + Math.log(Math.max(10.0, humidityPct) / 100.0);
    const dewPointC = Number(((237.7 * gammaDp) / (17.27 - gammaDp)).toFixed(1));
    const vaporPressureHpa = (humidityPct / 100.0) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
    const windCoolingOffset = Math.min(2.2, Math.max(0.0, (windSpeedKmh - 8.0) * 0.08));
    const wbgtC = Number((0.567 * tempC + 0.393 * vaporPressureHpa + 3.94 - windCoolingOffset).toFixed(1));
    const heatRiskLabel = (wbgtC >= 29.5 || dewPointC >= 23.0)
        ? "極高熱壓力 (ACSM 紅旗警戒：汗水蒸發率下降，強制每站冰水降溫)"
        : ((wbgtC >= 26.5 || dewPointC >= 20.5)
            ? "中高熱壓力 (ACSM 黃橘警戒：注意正午路跑心率漂移與補鈉)"
            : "舒適溫和 (利於維持目標配速與穩定心率)");

    const bProf = course.bike_profile || [];
    const rProf = course.run_profile || [];
    const bGrades = bProf.map(p => Math.abs(Number(p.grade || 0)));
    const rGrades = rProf.map(p => Math.abs(Number(p.grade || 0)));
    const bikeMaxGrade = Number((bGrades.length ? Math.max(...bGrades) : 2.5).toFixed(1));
    const runMaxGrade = Number((rGrades.length ? Math.max(...rGrades) : 1.5).toFixed(1));
    const punchyNodes = bGrades.filter(g => g >= 3.8).length;
    const estVi = Number((1.02 + Math.min(0.07, (bikeEleM / Math.max(40.0, bikeKm)) * 0.005 + punchyNodes * 0.006)).toFixed(2));
    let slopeTypeLabel = "";
    let steepnessRunMod = 1.00;
    if (bikeMaxGrade >= 4.5 || runMaxGrade >= 4.5) {
        slopeTypeLabel = `陡坡起伏型 (單車最大 ${bikeMaxGrade}% / 路跑最大 ${runMaxGrade}%，預估變異係數 VI ~${estVi})`;
        steepnessRunMod = 1.04;
    } else if (bikeEleM / Math.max(40.0, bikeKm) >= 5.0) {
        slopeTypeLabel = `丘陵長坡型 (單車最大 ${bikeMaxGrade}%，預估變異係數 VI ~${estVi})`;
        steepnessRunMod = 1.02;
    } else {
        slopeTypeLabel = `平緩巡航型 (單車最大 ${bikeMaxGrade}%，預估變異係數 VI ~${estVi}，利於空力定瓦)`;
        steepnessRunMod = 1.00;
    }
    activeModels.push(`🌡️ WBGT 綜合熱壓力 (${wbgtC}°C / 露點 ${dewPointC}°C) ＆ 坡度陡峭度 (VI ${estVi}) 模型`);

    const eleRunNeuMins = (runEleM / 100.0) * 2.38 * steepnessRunMod;
    const heatExcess = Math.max(0.0, tempC - 26.0) + Math.max(0.0, (dewPointC - 21.5) * 0.35);
    const humidFactor = Math.max(0.0, (humidityPct - 70.0) / 20.0);
    const distHeatScale = distType === "226" ? 1.0 : (distType === "113" ? 0.38 : 0.18);
    const heatNeuMins = (heatExcess * 2.1 + heatExcess * humidFactor * 1.1) * distHeatScale;

    const blockC = blocks.blockC || {};
    const wkSwimKm = Number(blockC.weeklySwimKm || 0);
    const wkBikeKm = Number(blockC.weeklyBikeKm || 0);
    const wkRunKm = Number(blockC.weeklyRunKm || 0);
    const longestBikeKm = Number(blockC.longestBikeKm || 0);
    const longestRunKm = Number(blockC.longestRunKm || 0);
    const hasBrick = String(blockC.brickFreq || "none");

    const hasTrainingData = Boolean(wkSwimKm > 0 || wkBikeKm > 0 || wkRunKm > 0 || longestBikeKm > 0 || longestRunKm > 0);
    let swimVolRatio = 1.0, bikeVolRatio = 1.0, runVolRatio = 1.0;
    if (hasTrainingData) {
        confidenceScore += 12;
        activeModels.push("📈 積木 C：Runalyze 週訓練量 × 最長 LSD × 轉換跑抗衰退模型");
        swimVolRatio = wkSwimKm > 0 ? Math.min(1.0, wkSwimKm / benchmarks.swim_wk) : 1.0;
        const rawBikeVol = wkBikeKm > 0 ? Math.min(1.0, wkBikeKm / benchmarks.bike_wk) : 1.0;
        const rawRunVol = wkRunKm > 0 ? Math.min(1.0, wkRunKm / benchmarks.run_wk) : 1.0;
        const targetLongBike = distType === "226" ? 140.0 : (distType === "113" ? 75.0 : 38.0);
        const targetLongRun = distType === "226" ? 26.0 : (distType === "113" ? 16.0 : 9.0);
        const longBikeRatio = longestBikeKm > 0 ? Math.min(1.0, longestBikeKm / targetLongBike) : rawBikeVol;
        const longRunRatio = longestRunKm > 0 ? Math.min(1.0, longestRunKm / targetLongRun) : rawRunVol;
        const brickBonus = hasBrick === "regular" ? 0.04 : (hasBrick === "rare" ? -0.04 : 0.0);
        bikeVolRatio = Math.min(1.0, 0.6 * rawBikeVol + 0.4 * longBikeRatio);
        runVolRatio = Math.min(1.0, Math.max(0.3, 0.6 * rawRunVol + 0.4 * longRunRatio + brickBonus));
    } else {
        swimVolRatio = 1.0; bikeVolRatio = 1.0; runVolRatio = 1.0;
        missingHints.push("可選填【積木 C：近期週訓練量與最長單次課表】評估後半段抗掉速與轉換跑剛性 (+12% 精準度)");
    }

    const fadeScale = distType === "226" ? 1.0 : (distType === "113" ? 0.45 : 0.20);
    const swimFadeMins = 6.0 * (1.0 - swimVolRatio) * fadeScale;
    const bikeFadeMins = 25.0 * (1.0 - bikeVolRatio) * fadeScale;
    const runFadeMins = 35.0 * (1.0 - runVolRatio) * fadeScale;
    const marathonShapePct = Number((runVolRatio * 100.0).toFixed(1));

    const avgReadiness = (swimVolRatio + bikeVolRatio + runVolRatio) / 3.0;
    const execBonus226 = avgReadiness >= 0.90 ? -10.0 : (avgReadiness >= 0.75 ? 0.0 : 15.0);
    const execScaleOpt = distType === "226" ? 1.0 : (distType === "113" ? 0.5 : 0.25);
    const execScaleNeu = distType === "226" ? 0.5 : (distType === "113" ? 0.3 : 0.15);
    const execScaleCon = distType === "226" ? 1.0 : (distType === "113" ? 0.6 : 0.30);

    const baseT1 = pbT1Mins || Number(course.t1_base_mins || (distType === "226" ? 6.0 : 4.0));
    const baseT2 = pbT2Mins || Number(course.t2_base_mins || (distType === "226" ? 5.0 : 3.0));

    const flatT1Base = distType === "226" ? 6.0 : (distType === "113" ? 3.0 : 2.0);
    const flatT2Base = distType === "226" ? 6.0 : (distType === "113" ? 3.0 : 2.0);
    const flatOptTotal = (flatSwimMins - (distType === "226" ? 2.0 : 1.0) + 0.15 * swimFadeMins) + (flatT1Base - 0.5) + (flatBikeMins + 0.15 * bikeFadeMins) + (flatT2Base - 0.5) + (flatRunMins + 0.15 * runFadeMins + Math.min(0.0, execBonus226 * execScaleOpt));
    const flatNeuTotal = (flatSwimMins + 0.50 * swimFadeMins) + flatT1Base + (flatBikeMins + 0.50 * bikeFadeMins) + flatT2Base + (flatRunMins + 0.50 * runFadeMins + Math.max(0.0, execBonus226 * execScaleNeu));
    const flatConTotal = (flatSwimMins + (distType === "226" ? 4.0 : 2.0) + 1.00 * swimFadeMins) + (flatT1Base + 1.0) + (flatBikeMins + 1.00 * bikeFadeMins) + (flatT2Base + 1.0) + (flatRunMins + 1.00 * runFadeMins + Math.max(distType === "113" ? 6.0 : 10.0, execBonus226 * execScaleCon));

    const bikeCourseNeu = eleBikeNeuMins + windBikeNeuMins;
    const runCourseNeu = eleRunNeuMins + heatNeuMins;

    const optSwim = flatSwimMins + (distType === "113" ? 0.0 : -2.0) + 0.15 * swimFadeMins;
    const optT1 = Math.max(2.0, baseT1 - 1.0);
    const optBike = flatBikeMins + 0.58 * bikeCourseNeu + 0.15 * bikeFadeMins;
    const optT2 = Math.max(2.0, baseT2 - 1.0);
    const optRun = flatRunMins + 0.36 * runCourseNeu + 0.15 * runFadeMins + Math.min(0.0, execBonus226 * execScaleOpt);
    const optTotal = optSwim + optT1 + optBike + optT2 + optRun;

    const neuSwim = flatSwimMins + waterNeuMod + 0.50 * swimFadeMins;
    const neuT1 = baseT1;
    const neuBike = flatBikeMins + 1.00 * bikeCourseNeu + 0.50 * bikeFadeMins;
    const neuT2 = baseT2;
    const neuRun = flatRunMins + 1.00 * runCourseNeu + 0.50 * runFadeMins + Math.max(0.0, execBonus226 * execScaleNeu);
    const neuTotal = neuSwim + neuT1 + neuBike + neuT2 + neuRun;

    const conSwim = flatSwimMins + waterNeuMod * 2.0 + 1.00 * swimFadeMins;
    const conT1 = baseT1 + (distType === "226" ? 2.0 : 1.0);
    const conBike = flatBikeMins + 1.72 * bikeCourseNeu + 1.00 * bikeFadeMins;
    const conT2 = baseT2 + (distType === "226" ? 2.0 : 1.0);
    const conRun = flatRunMins + 1.80 * runCourseNeu + 1.00 * runFadeMins + Math.max(distType === "113" ? 6.0 : 10.0, execBonus226 * execScaleCon);
    const conTotal = conSwim + conT1 + conBike + conT2 + conRun;

    confidenceScore = Math.min(98, Math.max(35, confidenceScore));
    const spreadOpt = distType === "226" ? 8.0 : (distType === "113" ? 5.0 : 2.5);
    const spreadNeu = distType === "226" ? 12.0 : (distType === "113" ? 6.0 : 3.5);
    const spreadCon = distType === "226" ? 17.5 : (distType === "113" ? 9.0 : 5.0);

    const minW = Math.round(effFtp * (ifRatio - 0.02));
    const maxW = Math.round(effFtp * (ifRatio + 0.01));
    const climbCapW = Math.round(effFtp * Math.min(0.90, ifRatio + 0.10));
    const wPerKg = effFtp / Math.max(42.0, weightKg);

    const cutoffTotalMins = distType === "226" ? 1020.0 : (distType === "113" ? 510.0 : 240.0);
    const startClockMins = 6 * 60;
    const buildExtra = (sM, t1M, bM, t2M, rM, totM) => {
        const tot = Math.max(1.0, totM);
        return {
            swim_pct: Number((sM / tot * 100.0).toFixed(1)),
            bike_pct: Number((bM / tot * 100.0).toFixed(1)),
            run_pct: Number((rM / tot * 100.0).toFixed(1)),
            trans_pct: Number(((t1M + t2M) / tot * 100.0).toFixed(1)),
            finish_clock: fmtHHMM(startClockMins + totM),
            cutoff_margin_mins: Math.round(cutoffTotalMins - totM)
        };
    };

    const swimRadar = Math.min(99, Math.max(45, Math.round(100 - (effCssSec - 88.0) * 0.9)));
    const bikePowerRadar = Math.min(99, Math.max(45, Math.round(55 + (effFtp - 150.0) * 0.45)));
    const climbWkgRadar = Math.min(99, Math.max(45, Math.round(50 + (wPerKg - 2.1) * 32.0)));
    const runVdotRadar = Math.min(99, Math.max(45, Math.round(45 + (estVdot - 35.0) * 3.2)));
    const durabilityRadar = Math.min(99, Math.max(45, Math.round(avgReadiness * 96.0)));

    const pureFlatZeroFade = flatSwimMins + flatT1Base + flatBikeMins + flatT2Base + flatRunMins;
    const wfSwimTrans = Number((waterNeuMod + (neuT1 - flatT1Base) + (neuT2 - flatT2Base)).toFixed(1));
    const wfBikeClimb = Number(eleBikeNeuMins.toFixed(1));
    const wfBikeWind = Number(windBikeNeuMins.toFixed(1));
    const wfRunClimb = Number(eleRunNeuMins.toFixed(1));
    const wfHeatWbgt = Number(heatNeuMins.toFixed(1));
    const wfFadeMod = Number((0.50 * (swimFadeMins + bikeFadeMins + runFadeMins) + Math.max(0.0, execBonus226 * execScaleNeu)).toFixed(1));
    const fmtSignM = (v) => `${v >= 0 ? '+' : ''}${Math.round(v)}m`;

    const playbook = buildDynamicPlaybookClient(course, swimKm, bikeKm, runKm, neuSwim, neuBike, neuRun, effFtp, ifRatio, tempC, humidityPct, windSpeedKmh, windGustKmh, windDir);

    return {
        confidence: {
            score_pct: confidenceScore,
            active_models: activeModels,
            missing_hints: missingHints,
            sources: { swim: swimSource, bike: bikeSource, run: runSource }
        },
        predictions: {
            optimistic: {
                range: `${fmtHHMM(optTotal - spreadOpt)} – ${fmtHHMM(optTotal + spreadOpt)}`,
                mid: fmtHHMM(optTotal),
                extra: buildExtra(optSwim, optT1, optBike, optT2, optRun, optTotal),
                splits: {
                    swim: fmtHHMM(optSwim), swim_pace: fmtSwimPace100m(optSwim, swimKm),
                    t1: fmtHHMM(optT1),
                    bike: fmtHHMM(optBike), bike_speed: `${(bikeKm / (optBike / 60.0)).toFixed(1)} km/h`,
                    t2: fmtHHMM(optT2),
                    run: fmtHHMM(optRun), run_pace: fmtPaceKm(optRun, runKm)
                }
            },
            neutral: {
                range: `${fmtHHMM(neuTotal - spreadNeu)} – ${fmtHHMM(neuTotal + spreadNeu)}`,
                mid: fmtHHMM(neuTotal),
                extra: buildExtra(neuSwim, neuT1, neuBike, neuT2, neuRun, neuTotal),
                splits: {
                    swim: fmtHHMM(neuSwim), swim_pace: fmtSwimPace100m(neuSwim, swimKm),
                    t1: fmtHHMM(neuT1),
                    bike: fmtHHMM(neuBike), bike_speed: `${(bikeKm / (neuBike / 60.0)).toFixed(1)} km/h`,
                    t2: fmtHHMM(neuT2),
                    run: fmtHHMM(neuRun), run_pace: fmtPaceKm(neuRun, runKm)
                }
            },
            conservative: {
                range: `${fmtHHMM(conTotal - spreadCon)} – ${fmtHHMM(conTotal + spreadCon)}`,
                mid: fmtHHMM(conTotal),
                extra: buildExtra(conSwim, conT1, conBike, conT2, conRun, conTotal),
                splits: {
                    swim: fmtHHMM(conSwim), swim_pace: fmtSwimPace100m(conSwim, swimKm),
                    t1: fmtHHMM(conT1),
                    bike: fmtHHMM(conBike), bike_speed: `${(bikeKm / (conBike / 60.0)).toFixed(1)} km/h`,
                    t2: fmtHHMM(conT2),
                    run: fmtHHMM(conRun), run_pace: fmtPaceKm(conRun, runKm)
                }
            }
        },
        metrics: {
            eff_ftp: Math.round(effFtp),
            w_per_kg: wPerKg.toFixed(2),
            target_watts: `${minW}W–${maxW}W`,
            climb_cap_w: `${climbCapW}W`,
            est_vdot: estVdot,
            marathon_shape_pct: marathonShapePct,
            course_env_mod_mins: Math.round(neuTotal - flatNeuTotal),
            flat_benchmark: {
                optimistic_mid: fmtHHMM(flatOptTotal),
                optimistic_range: `${fmtHHMM(flatOptTotal - spreadOpt)} – ${fmtHHMM(flatOptTotal + spreadOpt)}`,
                neutral_mid: fmtHHMM(flatNeuTotal),
                neutral_range: `${fmtHHMM(flatNeuTotal - spreadNeu)} – ${fmtHHMM(flatNeuTotal + spreadNeu)}`,
                conservative_mid: fmtHHMM(flatConTotal),
                conservative_range: `${fmtHHMM(flatConTotal - spreadCon)} – ${fmtHHMM(flatConTotal + spreadCon)}`,
                course_modifier_mins: Math.round(neuTotal - flatNeuTotal)
            },
            waterfall: [
                { label: "平路無風基準", mins: Number(pureFlatZeroFade.toFixed(1)), display: fmtHHMM(pureFlatZeroFade), type: "base" },
                { label: "海況與轉換區", mins: wfSwimTrans, display: fmtSignM(wfSwimTrans), type: "add" },
                { label: `單車爬升 (${Math.round(bikeEleM)}m)`, mins: wfBikeClimb, display: fmtSignM(wfBikeClimb), type: "add" },
                { label: `當日風阻 (${Math.round(windSpeedKmh)}kph)`, mins: wfBikeWind, display: fmtSignM(wfBikeWind), type: "add" },
                { label: `路跑爬升 (${Math.round(runEleM)}m)`, mins: wfRunClimb, display: fmtSignM(wfRunClimb), type: "add" },
                { label: `WBGT 熱壓力 (${wbgtC}°C)`, mins: wfHeatWbgt, display: fmtSignM(wfHeatWbgt), type: "add" },
                { label: "耐力衰退修正", mins: wfFadeMod, display: fmtSignM(wfFadeMod), type: "add" },
                { label: "實戰中性預估", mins: Number(neuTotal.toFixed(1)), display: fmtHHMM(neuTotal), type: "total" }
            ],
            radar_5d: [
                { axis: "游泳水感", score: swimRadar, sub: `${Math.round(effCssSec)}s/100m` },
                { axis: "單車巡航功率", score: bikePowerRadar, sub: `FTP ${Math.round(effFtp)}W` },
                { axis: "爬坡推重比", score: climbWkgRadar, sub: `${wPerKg.toFixed(2)} W/kg` },
                { axis: "路跑轉換配速", score: runVdotRadar, sub: `VDOT ${estVdot}` },
                { axis: "長距離抗衰退", score: durabilityRadar, sub: `準備度 ${marathonShapePct}%` }
            ],
            env_slope_diagnostics: {
                dew_point_c: dewPointC,
                wbgt_c: wbgtC,
                heat_risk_label: heatRiskLabel,
                bike_max_grade: bikeMaxGrade,
                run_max_grade: runMaxGrade,
                est_vi: estVi,
                slope_type_label: slopeTypeLabel
            }
        },
        playbook: playbook
    };
}
