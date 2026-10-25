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


function aiSegmentBikeCourseClient(course, bikeKm, windDir, windSpeedKmh, climbCapW) {
    const cid = course.course_id || "";
    const bEle = Number(course.bike_elevation_m || 0);

    // 1. IRONMAN 70.3 墾丁 (90km, 6段)
    if (cid === "kenting_703" && Math.abs(bikeKm - 90) <= 15 && course.bike_segments_template) {
        return {
            segs: course.bike_segments_template,
            rationale: "AI 依墾丁 70.3『屏153雙次海岸丘陵 ＋ 台26車城/199縣道牡丹落山風折返』地形特徵，將 90km 智慧切割為 6 段：區分南灣暖身、萬里桐首波丘陵、車城落山風抗風區、海口順風補給、大光末段丘陵與回 T2 降瓦排酸。"
        };
    }

    // 2. IRONMAN 澎湖 226 (180km, 5段：蒔裡出發 + 跨海大橋/西嶼 3 圈制 + 回馬公 T2)
    if (cid === "penghu_226" && Math.abs(bikeKm - 180) <= 25) {
        return {
            rationale: "AI 依澎湖 226『蒔裡單向出發 ＋ 跨海大橋與西嶼西臺 3 圈制抗風折返 ＋ 馬公 T2』賽道結構，將 180km 智慧切割為 5 段（1 段出發暖身 ＋ 3 圈跨海主課表 ＋ 1 段進 T2 排酸）。",
            segs: [
                { range_label: "0–22", start_km: 0, end_km: 22, title: "蒔裡出發暖身巡航", np_pct_range: [0.88, 0.94], terrain: `由蒔裡沙灘 T1 出發經湖西 204 縣道往北寮/白沙，地勢平緩微幅起伏，適應當日 ${windDir} (${windSpeedKmh} km/h)。`, tactics: "前 20 分鐘讓心率從 3.8km 海泳中穩下來，不跟快車硬衝。先喝幾口水，第 20 分鐘啟動第一次定時補給。", aid_station: "B1 湖西補給站 (約 15 km)，出發水壺已滿可快速通過。", common_mistake: "第一段順風或平路太興奮，瓦數高出目標 NP 10% 以上。" },
                { range_label: "22–68", start_km: 22, end_km: 68, title: "第一圈：跨海大橋與西嶼折返", np_pct_range: [0.95, 1.02], terrain: "首次通過澎湖跨海大橋（開闊海面強勁側逆陣風）進入西嶼鄉起伏丘陵，至西嶼西臺折返 (52 km) 回白沙。", tactics: "過跨海大橋遇強側陣風時雙手握彎把/牛角把控車；西嶼短坡換輕齒比守住瓦數上限，不抽車硬頂。", aid_station: "B2 跨海大橋站 (38 km) ｜ B3 西嶼折返站 (52 km)", common_mistake: "在跨海大橋頂逆風死守時速，導致第一圈就燒掉過多無氧火柴。" },
                { range_label: "68–118", start_km: 68, end_km: 118, title: "第二圈：穩態配瓦與特需袋補給", np_pct_range: [0.95, 1.01], terrain: "於白沙折返點二進跨海大橋與西嶼西臺 (98 km)，日照升溫且東北季風持續。", tactics: "嚴格執行『照時鐘每 30 分鐘吃喝』，於 98 km 西嶼折返處領取單車特需袋 (Special Needs)，補滿後半程能量膠與電解質粉。", aid_station: "白沙折返點 (78 km) ｜ 西嶼特需袋與補給站 (98 km)", common_mistake: "中段專注騎車忘記按時補鈉補水，或錯過特需袋補給造成後段斷糧。" },
                { range_label: "118–162", start_km: 118, end_km: 162, title: "第三圈：西嶼最終圈抗衰退", np_pct_range: [0.92, 0.98], terrain: "白沙折返後第三次通過跨海大橋與西嶼西臺 (138 km)，雙腿已累積超過 3.5 小時做功。", tactics: `體感變沉時主動退一檔維持 82–86 rpm 踏頻，西嶼爬坡絕對不超過 ${climbCapW} W，把股四頭肌留給 42.2km 全馬。`, aid_station: "B4 西嶼最終站 (138 km) ｜ 跨海大橋站 (158 km)", common_mistake: "第三圈逆風心態急躁重齒比硬踩，導致踏頻掉到 70 rpm 以下引發抽筋。" },
                { range_label: "162–180", start_km: 162, end_km: 180, title: "回馬公 T2 降瓦排酸", np_pct_range: [0.82, 0.90], terrain: "離開跨海大橋經白沙、中正橋順風/平路返回馬公市區體育館 T2 轉換區。", tactics: "最後 18 km 主動降瓦、踏頻拉高至 88–92 rpm 排酸；最後 15 分鐘只喝白開水不吃固體食物，讓胃部排空準備全馬。", aid_station: "180 km 馬公體育館 T2 轉換區", common_mistake: "最後順風段一路猛催瓦數衝進 T2，一下車雙腿僵硬。" }
            ]
        };
    }

    // 3. Challenge Taiwan 台東 113 (4段) / 226 (5段)
    if (cid === "ct_taitung") {
        if (bikeKm < 135) {
            return {
                rationale: "AI 依 Challenge Taiwan 113『台11線花東海岸單圈雙向折返（活水湖 ⇄ 成功鎮 45k）』對稱緩坡特徵，將 90km 精簡切割為 4 段（前 12k 出城暖身 ＋ 北上緩坡去程 ＋ 南下巡航回程 ＋ 最後 12k 排酸進 T2）。",
                segs: [
                    { range_label: "0–12", start_km: 0, end_km: 12, title: "活水湖出城暖身轉換", np_pct_range: [0.88, 0.95], terrain: "由活水湖 T1 出發經中華大橋往杉原海岸，路幅寬廣平緩，僅過橋時有短坡與河口側風。", tactics: "前 15 分鐘讓心率從活水湖游泳平順過渡，維持 85+ rpm 輕快踏頻，勿在中華大橋與旁車競速。", aid_station: "出發水壺裝滿，本段無須停靠。", common_mistake: "一出活水湖見平路大直線就猛踩超瓦，前 10 km 把心率頂上 Z4。" },
                    { range_label: "12–45", start_km: 12, end_km: 45, title: "台11北上：都蘭東河至成功折返", np_pct_range: [0.95, 1.02], terrain: "沿台11線北上經杉原、都蘭長緩坡 (2–3%)、東河包子站至成功鎮折返點 (45 km)。", tactics: `都蘭與成功長緩坡維持休息把空力姿勢或微退一檔，爬坡上限守在 ${climbCapW} W 內，每 20–30 分鐘定時補碳水。`, aid_station: "B1 都蘭站 (22 km) ｜ B2 東河站 (35 km) ｜ B3 成功折返站 (45 km)", common_mistake: "在都蘭長緩坡不自覺重踩推瓦，忽略長緩坡累積的肌肉疲勞。" },
                    { range_label: "45–78", start_km: 45, end_km: 78, title: "台11南下：成功回程巡航與補給", np_pct_range: [0.94, 1.00], terrain: `由成功鎮折返南下經東河 (60 km)、都蘭回程緩坡 (72 km)，當日預報 ${windDir} ${windSpeedKmh} km/h。`, tactics: "折返後視順逆風調整齒比，守住目標 NP 區間；把握第 50–70 km 將隨車能量膠與電解質水按時喝完。", aid_station: "B4 東河回程站 (60 km) ｜ 都蘭站 (72 km)", common_mistake: "回程若遇逆風硬踩追時速，或因風景單調忘記定時吃第 2 小時補給。" },
                    { range_label: "78–90", start_km: 78, end_km: 90, title: "中華大橋回程進 T2 排酸", np_pct_range: [0.82, 0.90], terrain: "由杉原經中華大橋返回台東森林公園/鐵花村 T2 轉換區，地勢平緩微下坡。", tactics: "最後 12 km 主動降低瓦數、拉高踏頻至 90 rpm 放鬆大腿；最後 15 分鐘只喝水讓胃排空。", aid_station: "90 km 森林公園 T2 轉換區", common_mistake: "過中華大橋後重踩衝刺進 T2，導致一下車跑森林公園雙腿緊繃。" }
                ]
            };
        } else {
            return {
                rationale: "AI 依 Challenge Taiwan 226『台11線花東海岸雙圈長距離折返 (180km)』結構，將賽道智慧切割為 5 段（出城暖身 ＋ 第一圈穩態巡航 ＋ 第二圈北上抗熱抗風 ＋ 第二圈南下固體補給 ＋ 最後 12k 排酸進 T2）。",
                segs: [
                    { range_label: "0–15", start_km: 0, end_km: 15, title: "活水湖出城暖身段", np_pct_range: [0.86, 0.93], terrain: "活水湖 T1 出發過中華大橋至杉原海岸，平緩開闊。", tactics: "226 單車長達 5–6 小時，前 15 km 務必壓低瓦數讓心率穩定在 Z2 下緣。", aid_station: "水壺滿載出發。", common_mistake: "開賽跟隨 113 選手的高配速一起衝。" },
                    { range_label: "15–90", start_km: 15, end_km: 90, title: "第一圈：台11海岸往返巡航", np_pct_range: [0.95, 1.01], terrain: "第一趟經都蘭、東河、成功折返返回台東，包含數段 2–3% 海岸長緩坡。", tactics: "保持低風阻空力姿勢，每 30 分鐘嚴格執行 35–40g 碳水與水分補給，趁早段腸胃吸收最好時打底。", aid_station: "沿途都蘭、東河、成功各補給站按需換水。", common_mistake: "第一圈爬坡抽車或忽略前 2.5 小時的固體/能量膠補充。" },
                    { range_label: "90–135", start_km: 90, end_km: 135, title: "第二圈北上：午間升溫與海風考驗", np_pct_range: [0.94, 1.00], terrain: `進入第二圈北上段，氣溫升高且海風 (${windDir} ${windSpeedKmh} km/h) 轉強。`, tactics: `緩坡與逆風段嚴格守住 ${climbCapW} W 上限，每小時補水量拉高並搭配鹽錠/電解質。`, aid_station: "90k 折返點與第二圈都蘭/東河站務必補滿冰水。", common_mistake: "第二圈北上頂風硬踩導致心率漂移與大腿提前抽動。" },
                    { range_label: "135–168", start_km: 135, end_km: 168, title: "第二圈南下：耐力守衛與最後補給", np_pct_range: [0.91, 0.97], terrain: "由北端折返南下經東河、都蘭回程，體能進入第 4–5 小時關鍵期。", tactics: "專注維持 82–86 rpm 踏頻，完成單車段最後兩次碳水補給，確保下車前肝醣充足。", aid_station: "東河與都蘭最後補給站補滿清水。", common_mistake: "後段味覺疲勞停止吃東西，導致一進全馬立刻低血糖撞牆。" },
                    { range_label: "168–180", start_km: 168, end_km: 180, title: "中華大橋回程進 T2 排酸", np_pct_range: [0.80, 0.88], terrain: "最後 12 km 經中華大橋滑回森林公園/鐵花村 T2。", tactics: "瓦數調降 12–15%，拉高踏頻至 90 rpm 讓雙腿血液回流，最後 15 分鐘只喝水清空胃部。", aid_station: "180 km T2 轉換區", common_mistake: "最後 10 km 趕時間重踩，下車雙腿僵硬。" }
                ]
            };
        }
    }

    // 4. IRONMAN 蘭卡威 226 (180km, 5段)
    if (cid === "langkawi_226") {
        return {
            rationale: "AI 依蘭卡威 226『兩圈制雨林陡坡（兩度翻越 Datai 與 The Gullet 8% 魔王坡）＋ Kuah 平緩折返區 ＋ 34°C 高溫』地形，將 180km 智慧切割為 5 段，重點隔離兩次魔王陡坡功率紅線與中段補水區。",
            segs: [
                { range_label: "0–18", start_km: 0, end_km: 18, title: "Pantai Kok 出發與 Datai 雨林首坡", np_pct_range: [0.88, 0.95], terrain: "由 Pantai Kok T1 出發進入 Datai 雨林爬坡段（海拔升至 95m，坡度約 5.5%）。", tactics: "前 18 km 趁清晨氣溫尚未飆高，以輕齒比順暢爬完 Datai 雨林坡，下坡注意路面猴子與濕滑彎道。", aid_station: "B1 Datai 站 (18 km)", common_mistake: "在第一段 Datai 雨林坡就抽車飆瓦，提早消耗核心肝醣。" },
                { range_label: "18–50", start_km: 18, end_km: 50, title: "第一圈魔王坡：The Gullet 攻頂與丘陵", np_pct_range: [0.95, 1.03], terrain: "挑戰著名的 The Gullet 魔王陡坡（32 km 處海拔 165m，最大坡度 8%+）與 Tengkorak 連續起伏丘陵。", tactics: `換上最輕齒比 (32T/34T)，爬坡嚴格把瓦數壓在 ${climbCapW} W 附近，寧可慢速高踏頻也絕不硬踩鎖死大腿。`, aid_station: "B2 The Gullet 站 (32 km) ｜ B3 Tengkorak 站 (50 km)", common_mistake: "齒比太重在 The Gullet 陡坡硬頂超過 120% FTP，燒光雙腿。" },
                { range_label: "50–100", start_km: 50, end_km: 100, title: "Kuah 折返平緩巡航與高溫大量補水", np_pct_range: [0.94, 1.00], terrain: "進入島嶼東側與南側 Kuah 折返平緩區 (95 km 特需袋)，氣溫開始突破 32°C。", tactics: "把握這 50 km 相對平緩的路段維持空力姿勢，每過補給站必拿冰水淋身，並補足每小時 800ml+ 水分與高鈉電解質。", aid_station: "Kuah 折返與特需袋站 (95 km)", common_mistake: "在平緩段疏於抓冰水降溫，進入第二圈前核心體溫已經過高。" },
                { range_label: "100–145", start_km: 100, end_km: 145, title: "第二圈魔王坡：高溫二度攻頂 The Gullet", np_pct_range: [0.90, 0.98], terrain: "正午高溫下第二次進入 Datai 與 The Gullet 魔王坡 (118 km)，並翻越 Tengkorak 第二圈丘陵 (145 km)。", tactics: "正午熱壓力最大，上坡看心率與功率雙重上限，必要時在補給站停 15 秒用冰水從頭淋下再上坡。", aid_station: "B4 The Gullet 二圈站 (118 km) ｜ Tengkorak 站 (145 km)", common_mistake: "第二圈過 The Gullet 硬拼第一圈瓦數，導致嚴重熱衰竭或大腿抽筋。" },
                { range_label: "145–180", start_km: 145, end_km: 180, title: "回程滑入 MIEC 冷氣館 T2 排酸", np_pct_range: [0.82, 0.90], terrain: "離開丘陵區一路平緩回程進入 MIEC 展覽館冷氣房 T2 (180 km)。", tactics: "最後 15 km 主動降瓦 12%、拉高踏頻排酸，持續小口喝電解質水，進冷氣館 T2 換裝順便降低核心體溫。", aid_station: "180 km MIEC 冷氣館 T2", common_mistake: "下車前停止補水，帶著脫水狀態進入 34°C 機場跑道全馬。" }
            ]
        };
    }

    // 5. 短距離 51.5 標鐵 (<= 55km, 3段)
    if (bikeKm <= 55) {
        const c1 = Number((bikeKm * 0.18).toFixed(1));
        const c2 = Number((bikeKm * 0.82).toFixed(1));
        return {
            rationale: `AI 依標準距離 (${bikeKm}km) 緊湊節奏特徵，將單車賽道精簡切割為 3 段（前 ${c1}km 出 T1 快速暖身 ➔ 中段 ${(c2-c1).toFixed(1)}km 高效率空力巡航 ➔ 最後 ${(bikeKm-c2).toFixed(1)}km 高踏頻轉換進 T2）。`,
            segs: [
                { range_label: `0–${c1}`, start_km: 0, end_km: c1, title: "出 T1 快速暖身建立節奏", np_pct_range: [0.90, 0.96], terrain: `出 T1 轉換區前 ${c1} km 加速段。`, tactics: "前 5–8 分鐘利用 90 rpm 高踏頻讓雙腿從海泳切換至騎乘，逐步推升至目標瓦數。", aid_station: "使用車上水壺補水。", common_mistake: "標鐵出 T1 前 3 km 猛衝超過 115% FTP 導致呼吸紊亂。" },
                { range_label: `${c1}–${c2}`, start_km: c1, end_km: c2, title: "核心空力巡航與折返抗風", np_pct_range: [0.97, 1.03], terrain: `第 ${c1}–${c2} km 賽道主巡航與折返區（總爬升約 ${Math.round(bEle)}m，當日 ${windDir} ${windSpeedKmh} km/h）。`, tactics: `全程維持低風阻空力姿勢，遇坡或逆風上限守在 ${climbCapW} W，每 15–20 分鐘小口補充運動飲料或能量膠。`, aid_station: "賽道折返補給站視需要補水。", common_mistake: "逆風段死守時速硬踩，把接下來 10km 路跑的雙腿榨乾。" },
                { range_label: `${c2}–${bikeKm}`, start_km: c2, end_km: bikeKm, title: "高踏頻排酸準備 T2 轉換", np_pct_range: [0.85, 0.92], terrain: `最後 ${(bikeKm - c2).toFixed(1)} km 返回 T2 轉換區。`, tactics: "主動將瓦數微降 8–12%、踏頻拉高至 92 rpm 以上，讓雙腿準備好一下車就能跑出高步頻。", aid_station: `${bikeKm} km T2 轉換區`, common_mistake: "重齒比硬踩到下車線前才急煞，一下車雙腿僵硬。" }
            ]
        };
    }

    // 6. 通用/自訂 GPX 賽道 (5段)
    const bCuts = [0, Math.round(bikeKm * 0.15), Math.round(bikeKm * 0.45), Math.round(bikeKm * 0.72), Math.round(bikeKm * 0.88), Math.round(bikeKm)];
    return {
        rationale: `AI 掃描本場單車賽道 (${bikeKm}km / 爬升 ${Math.round(bEle)}m) 等高線與當日風向 (${windDir} ${windSpeedKmh}km/h)，自動將賽道切割為 5 個功率執行區段：依序為出 T1 暖身、前段巡航、中段爬坡/抗風核心區、後段耐力補給與進 T2 降瓦排酸。`,
        segs: [
            { range_label: `${bCuts[0]}–${bCuts[1]}`, start_km: bCuts[0], end_km: bCuts[1], title: "保守暖身騎乘", np_pct_range: [0.88, 0.95], terrain: `出 T1 轉換區前 ${bCuts[1]} km 暖身段，適應當日風向（${windDir} ${windSpeedKmh} km/h）。`, tactics: "前 15 分鐘讓心率與呼吸從游泳中穩下來，坡上不追人。先喝水，約 20 分鐘開始第一次補給。", aid_station: "出發時水壺裝滿，前段無須進站。", common_mistake: "游泳後腎上腺素高，前 10 km 平均功率高出目標 10% 以上。" },
            { range_label: `${bCuts[1]}–${bCuts[2]}`, start_km: bCuts[1], end_km: bCuts[2], title: "進入目標競賽功率", np_pct_range: [0.95, 1.02], terrain: `第 ${bCuts[1]}–${bCuts[2]} km 巡航與首波起伏路段。`, tactics: "進入低風阻空力姿勢，踏頻維持 82–88 rpm，每 20–30 分鐘按錶定時補充碳水與水分。", aid_station: `經過前段補給站（約 ${Math.round(bCuts[2]*0.7)} km）視水壺存量補水。`, common_mistake: "跟隨快車集團超瓦競速，忽略自身目標 IF 配速紀律。" },
            { range_label: `${bCuts[2]}–${bCuts[3]}`, start_km: bCuts[2], end_km: bCuts[3], title: "中段折返與爬坡/抗風核心", np_pct_range: [0.96, 1.03], terrain: `第 ${bCuts[2]}–${bCuts[3]} km 賽道中段與折返點，面對爬升與 ${windDir} 側逆風挑戰。`, tactics: `環境變了，守住功率、不守速度！爬坡與逆風嚴守 ≤ ${climbCapW} W 上限，壓低身體減少迎風面積。`, aid_station: `中段折返補給站（約 ${Math.round(bikeKm*0.5)} km），務必換滿運動飲料與水。`, common_mistake: "逆風或爬坡段為了維持帳面時速而將功率拉高到 110% NP 以上。" },
            { range_label: `${bCuts[3]}–${bCuts[4]}`, start_km: bCuts[3], end_km: bCuts[4], title: "中後段耐力守衛與最後固體補給", np_pct_range: [0.93, 0.99], terrain: `第 ${bCuts[3]}–${bCuts[4]} km 回程段，體能進入中後段考驗。`, tactics: "維持 82+ rpm 穩定踏頻，把握此區段將隨車能量膠與電解質水按時喝足，為路跑儲備肝醣。", aid_station: `後段補給站（約 ${Math.round(bikeKm*0.8)} km）。`, common_mistake: "騎乘後段味覺疲勞而少吃能量膠，造成下車後低血糖撞牆。" },
            { range_label: `${bCuts[4]}–${bCuts[5]}`, start_km: bCuts[4], end_km: bCuts[5], title: "主動降瓦排酸準備 T2", np_pct_range: [0.82, 0.90], terrain: `最後 ${bCuts[5] - bCuts[4]} km 滑回 T2 轉換區。`, tactics: "主動降瓦 10–15%、拉高踏頻至 90 rpm 活絡下肢；最後 15 分鐘只喝水不吃固體食物，讓胃在跑步前排空。", aid_station: `進 ${bCuts[5]} km T2 轉換區前減速慢行。`, common_mistake: "一路重踩衝進 T2，一下車雙腿僵硬抽筋。" }
        ]
    };
}

function aiSegmentRunCourseClient(course, runKm) {
    const cid = course.course_id || "";
    const rEle = Number(course.run_elevation_m || 0);

    // 1. IRONMAN 70.3 墾丁 (21.1km, 6段)
    if (cid === "kenting_703" && Math.abs(runKm - 21.1) <= 3 && course.run_segments_template) {
        return {
            segs: course.run_segments_template,
            rationale: "AI 依墾丁 70.3『第一圈直攻社頂公園 210m 陡升與船帆路陡降 ＋ 第二圈台26海岸平路』先苦後甘地形，將 21.1km 智慧切割為 6 段，精準分離 T2 轉換、社頂爬坡、船帆路護腿下坡與台26平路巡航。"
        };
    }

    // 2. IRONMAN 澎湖 226 (42.2km, 5段)
    if (cid === "penghu_226" && Math.abs(runKm - 42.2) <= 5) {
        return {
            rationale: "AI 依澎湖全馬『馬公 T2 出發 ＋ 觀音亭與重光媽祖銅像 4 圈制（每圈約 10.55km）』賽道結構，將 42.2km 智慧切割為 5 段（前 3km T2 轉換起跑 ＋ 四圈配速、補鈉與防撞牆守則）。",
            segs: [
                { range_label: "0–3", start_km: 0.0, end_km: 3.0, title: "出馬公 T2 保守起跑", tag: "T2 轉換適應 · 3.0 km", pace_offset_sec: [10, 18], terrain: "由馬公體育館 T2 出發進入市區與海岸連接段，雙腿剛結束 180km 跨海抗風騎乘。", intensity: "比平路目標配速慢 10–18 秒/km，強制壓住剛下車的亢奮感與心率。", form_tip: "小步幅、高步頻 (175–180 spm)，先求跑姿放鬆流暢。", aid_station: "R1 補給站先喝水並用海綿/冰水降溫。", common_mistake: "剛下單車覺得腿輕就開出比目標快 15 秒的配速，導致半馬後提前崩盤。" },
                { range_label: "3–10.5", start_km: 3.0, end_km: 10.5, title: "第一圈：重光媽祖至觀音亭建立節奏", tag: "Lap 1 巡航 · 7.5 km", pace_offset_sec: [-2, 8], terrain: "往北跑向重光媽祖銅像折返 (5.2 km) 再回到觀音亭虹橋 (10.5 km)，海風開闊無遮蔭。", intensity: "進入目標全馬配速區間，順逆風交替時看心率與步頻微調。", form_tip: "逆海風段身體微前傾、手肘貼近身體擺動減少風阻。", aid_station: "每 2–2.5 km 補給站必進，第 30 分鐘吃第一包跑步能量膠配白開水。", common_mistake: "第一圈頂著海風硬推配速，心率提早進入 Z3 上緣。" },
                { range_label: "10.5–21.1", start_km: 10.5, end_km: 21.1, title: "第二圈：半馬折返散熱與定時補鈉", tag: "Lap 2 穩態 · 10.6 km", pace_offset_sec: [0, 10], terrain: "觀音亭與媽祖銅像第二圈往返，日照與海風持續考驗核心體溫。", intensity: "穩守平路目標配速，讓體感維持在『可以穩定說話』的有氧節奏。", form_tip: "每過一處折返點做一次肩頸與雙手放鬆甩動，避免上半身僵硬耗能。", aid_station: "每站拿冰塊塞帽內/後頸，按時補充第 2、3 包能量膠與鹽錠。", common_mistake: "因為海風吹乾汗水而低估排汗量，忽略補鈉導致 25k 後抽筋。" },
                { range_label: "21.1–31.6", start_km: 21.1, end_km: 31.6, title: "第三圈：全馬關鍵撞牆防線", tag: "Lap 3 耐力決戰 · 10.5 km", pace_offset_sec: [5, 18], terrain: "全馬最關鍵的 21–32 km 第三圈，肝醣逐漸耗竭且肌纖維微損傷累積。", intensity: "允許配速比前段微幅慢 5–15 秒/km，核心原則是『進補給站可快走 10 秒喝水，出站立刻跑起來絕不連走』！", form_tip: "專注『抬腳跟、守住 172+ 步頻』，把注意力拆解成從這一個補給站跑到下一個補給站。", aid_station: "可開始喝半杯可樂或咖啡因能量膠提振中樞神經。", common_mistake: "第三圈心理鬆懈開始長距離步行，每走 1 km 就會損失 3–4 分鐘。" },
                { range_label: "31.6–42.2", start_km: 31.6, end_km: 42.2, title: "第四圈：觀音亭最終圈榮耀衝線", tag: "Lap 4 終點衝刺 · 10.6 km", pace_offset_sec: [-5, 15], terrain: "最後一趟重光媽祖折返直奔觀音亭西瀛虹橋終點拱門。", intensity: "前 6 km 穩守節奏，最後 4 km 若心肺還有餘裕再漸進加速迎接終點紅毯！", form_tip: "用擺臂帶動雙腿，抬頭看遠方虹橋地標提振士氣。", aid_station: "小口喝可樂或電解質水即可，全力迎向 IRONMAN 終點拱門！", common_mistake: "最後 1 km 突然暴衝導致大腿後側劇烈抽筋。" }
            ]
        };
    }

    // 3. Challenge Taiwan 台東 113 (4段) / 226 (5段)
    if (cid === "ct_taitung") {
        if (runKm < 30) {
            return {
                rationale: "AI 依 Challenge Taiwan 113『台東森林公園＋馬亨亨大道雙圈平緩賽道（每圈 10.5km）』結構，將 21.1km 精簡切割為 4 段（森林公園樹蔭轉換起跑 ＋ 第一圈馬亨亨巡航 ＋ 第二圈午後抗熱降溫 ＋ 舊鐵道回鐵花村終點衝線）。",
                segs: [
                    { range_label: "0–3.5", start_km: 0.0, end_km: 3.5, title: "森林公園琵琶湖轉換起跑", tag: "樹蔭轉換 · 3.5 km", pace_offset_sec: [8, 15], terrain: "由 T2 進入台東森林公園與琵琶湖步道，地勢平緩且有濃密樹蔭遮蔽。", intensity: "前 2–3 km 比目標配速慢 10 秒/km，讓雙腿從台11線 90km 騎乘平順轉換為跑姿。", form_tip: "高步頻 (176+ spm)、小步幅，趁森林公園樹蔭調整呼吸節奏。", aid_station: "R1 森林公園站先喝水、拿海綿沾濕降溫。", common_mistake: "森林公園樹蔭涼爽加上觀眾加油，起跑前 3 km 衝太快導致出公園後見光死。" },
                    { range_label: "3.5–10.5", start_km: 3.5, end_km: 10.5, title: "第一圈：馬亨亨大道平路穩定巡航", tag: "Lap 1 巡航 · 7.0 km", pace_offset_sec: [-3, 6], terrain: "出森林公園轉入馬亨亨大道慢車道折返（微幅緩升 1.5% 後緩降回第 1 圈折返點 10.5 km）。", intensity: "鎖定平路目標配速穩定巡航，馬亨亨大道較無遮蔭，注意防曬與心率控制。", form_tip: "肩膀放鬆、落地輕柔，去程微上坡保持步頻、回程微下坡順勢延伸步幅。", aid_station: "R2/R3 馬亨亨大道補給站每站拿冰水淋頭，第 30 分鐘吃第一包能量膠。", common_mistake: "在馬亨亨大道暴曬段忽略淋水降溫，核心體溫在第一圈尾段就飆高。" },
                    { range_label: "10.5–17.5", start_km: 10.5, end_km: 17.5, title: "第二圈：森林公園與馬亨亨抗熱守衛", tag: "Lap 2 抗熱 · 7.0 km", pace_offset_sec: [0, 10], terrain: "進入第二圈森林公園 (14 km) 與馬亨亨大道，正午台東悶熱感最明顯。", intensity: "守住目標配速上限，每過補給站強制抓冰塊塞入三鐵衣與帽內物理降溫。", form_tip: "專注維持步頻不掉，把專注力放在每一次擺臂與吐氣。", aid_station: "R4/R5 補給站補充第 2 包能量膠（或可樂）與足量電解質。", common_mistake: "第二圈馬亨亨大道因為悶熱心浮氣躁而開始走路。" },
                    { range_label: "17.5–21.1", start_km: 17.5, end_km: 21.1, title: "舊鐵道路廊奔向鐵花村終點", tag: "終點衝刺 · 3.6 km", pace_offset_sec: [-10, 8], terrain: "最後 3.6 km 轉入台東舊鐵道路廊與鐵花村音樂聚落，兩旁觀眾熱情加油。", intensity: "若心肺與大腿還有餘裕，每 km 可提速 5–10 秒，帥氣衝進鯉魚山下的終點紅毯！", form_tip: "抬頭挺胸、擺臂帶動步頻迎接終點。", aid_station: "最後補給站拿水漱口即可，直奔終點拱門！", common_mistake: "最後 500m 突然百米衝刺導致小腿抽筋。" }
                ]
            };
        } else {
            return {
                rationale: "AI 依 Challenge Taiwan 226『森林公園＋馬亨亨大道 4 圈制全馬 (42.2km)』結構，將賽道智慧切割為 5 段（前 3.5k 樹蔭轉換 ＋ 第一圈建立配速 ＋ 第二圈半馬抗熱 ＋ 第三圈撞牆防線 ＋ 第四圈鐵花村終點衝線）。",
                segs: [
                    { range_label: "0–3.5", start_km: 0.0, end_km: 3.5, title: "森林公園 T2 轉換起跑", tag: "樹蔭轉換 · 3.5 km", pace_offset_sec: [10, 18], terrain: "由 T2 進入台東森林公園琵琶湖樹蔭步道。", intensity: "比全馬目標配速慢 10–18 秒/km，讓雙腿從 180km 騎乘平順切換。", form_tip: "高步頻、小步幅，嚴格壓制開跑心率。", aid_station: "R1 站喝水並拿冰塊降溫。", common_mistake: "全馬前 3 km 跑太快，提早消耗寶貴肝醣。" },
                    { range_label: "3.5–10.5", start_km: 3.5, end_km: 10.5, title: "第一圈：馬亨亨大道建立全馬節奏", tag: "Lap 1 巡航 · 7.0 km", pace_offset_sec: [0, 8], terrain: "第一圈馬亨亨大道折返，午後陽光強烈。", intensity: "進入全馬目標配速，每站必拿冰塊與海綿降溫。", form_tip: "放鬆雙肩，維持穩定有氧呼吸。", aid_station: "每 30 分鐘補充 30g 碳水與電解質水。", common_mistake: "忽略午後馬亨亨大道的熱輻射，沒有每站抓冰塊。" },
                    { range_label: "10.5–21.1", start_km: 10.5, end_km: 21.1, title: "第二圈：半馬穩態與電解質守衛", tag: "Lap 2 半馬段 · 10.6 km", pace_offset_sec: [0, 10], terrain: "第二圈森林公園與馬亨亨大道往返，完成前半馬。", intensity: "穩守目標配速，利用森林公園樹蔭段回穩心率。", form_tip: "步幅不貪大，落地點保持在重心正下方。", aid_station: "持續按錶每 30 分鐘吃膠並補充 600mg+ 鈉/小時。", common_mistake: "半馬前停止吃能量膠，導致第三圈血糖驟降。" },
                    { range_label: "21.1–31.6", start_km: 21.1, end_km: 31.6, title: "第三圈：傍晚降溫與防撞牆決戰", tag: "Lap 3 耐力防線 · 10.5 km", pace_offset_sec: [5, 18], terrain: "第三圈太陽漸落、氣溫轉涼，但雙腿進入 25–32 km 最沉重的撞牆期。", intensity: "只在補給站內快走 10 秒喝水吃膠，一出補給站立刻慢跑起來，絕不連續步行！", form_tip: "專注手肘擺動帶動 172+ 步頻。", aid_station: "使用咖啡因膠或可樂提振中樞神經。", common_mistake: "進站走路後拖延太久，雙腿冷卻後更跑不動。" },
                    { range_label: "31.6–42.2", start_km: 31.6, end_km: 42.2, title: "第四圈：舊鐵道奔向鐵花村終點紅毯", tag: "Lap 4 榮耀衝線 · 10.6 km", pace_offset_sec: [-5, 15], terrain: "最後一圈森林公園與馬亨亨大道，轉入舊鐵道燈光廊道直奔鐵花村終點。", intensity: "穩守配速，最後 3 km 鐵道段享受全場歡呼漸進提速完賽！", form_tip: "抬頭挺胸，穩定擺臂衝線。", aid_station: "小口喝可樂維持血糖即可。", common_mistake: "最後一刻過度衝刺引發抽筋。" }
                ]
            };
        }
    }

    // 4. IRONMAN 蘭卡威 226 (42.2km, 5段)
    if (cid === "langkawi_226") {
        return {
            rationale: "AI 依蘭卡威全馬『MIEC 冷氣館出發 ＋ 機場外圍無遮蔭暴曬段與珍南海灘 2.5 圈』熱帶結構，將 42.2km 智慧切割為 5 段，特別針對冷氣房溫差轉換與兩次機場暴曬熱浪區制定降溫配速。",
            segs: [
                { range_label: "0–3", start_km: 0.0, end_km: 3.0, title: "出 MIEC 冷氣館溫差適應起跑", tag: "溫差轉換 · 3.0 km", pace_offset_sec: [12, 20], terrain: "由 MIEC 冷氣展覽館 T2 跑出戶外 33–34°C 熱帶高溫環境。", intensity: "比目標配速慢 15 秒/km，給心血管與排汗系統 15 分鐘適應冷氣房到酷熱戶外的劇烈溫差。", form_tip: "極小步幅、高步頻慢跑，切勿在剛出冷氣房覺得涼爽時衝刺。", aid_station: "出館第一站立刻拿冰水淋濕帽子與三鐵衣。", common_mistake: "在冷氣館換裝後覺得身體很涼，前 3 km 衝太快導致一進機場跑道瞬間熱衰竭。" },
                { range_label: "3–14", start_km: 3.0, end_km: 14.0, title: "第一圈：機場跑道外圍暴曬與珍南海灘", tag: "Lap 1 抗熱巡航 · 11.0 km", pace_offset_sec: [0, 10], terrain: "繞行蘭卡威機場跑道外圍（全線無遮蔭、柏油熱輻射強）接往珍南海灘 (Cenang Beach)。", intensity: "看心率配速！在機場暴曬段主動放慢 5–10 秒/km，絕不讓心率突破閾值。", form_tip: "放鬆肩膀，每站必拿冰塊塞進衣領、後頸與手中握著降溫。", aid_station: "每 1.5–2 km 補給站必進，每小時補足 800ml+ 水分與 800mg+ 鈉。", common_mistake: "在機場跑道硬撐平路配速且跳過冰塊降溫。" },
                { range_label: "14–26", start_km: 14.0, end_km: 26.0, title: "第二圈前段：海灘折返與電解質防抽筋", tag: "Lap 2 海灘巡航 · 12.0 km", pace_offset_sec: [3, 15], terrain: "珍南海灘折返並準備再次進入中段路線，高濕度 (85%+) 下排汗量極大。", intensity: "穩守有氧配速，若覺得胃部水聲晃動則放慢 10 秒讓血液流回腸胃幫助吸收。", form_tip: "維持 175 spm 輕快步頻，減少足底與小腿在熱柏油路上的停留時間。", aid_station: "按時吃能量膠配白開水，交替補充鹽錠或電解質飲。", common_mistake: "高溫下喝太多高濃度甜飲卻沒配白開水，引發胃脹氣想吐。" },
                { range_label: "26–36", start_km: 26.0, end_km: 36.0, title: "第二圈後段：二度穿越機場熱浪防線", tag: "Lap 2 耐力守衛 · 10.0 km", pace_offset_sec: [8, 22], terrain: "全馬最艱難的 26–36 km，再次通過機場外圍熱浪區。", intensity: "採『補給站內快走 15 秒徹底淋冰水降溫 ➔ 出站立刻小碎步跑起來』策略，守住不崩盤。", form_tip: "把目標縮小到『只跑到下一個冰水桶』，用手臂擺動帶動雙腿。", aid_station: "補充可樂與冰水提振精神。", common_mistake: "在無遮蔭機場段停下來長距離散步，暴曬時間反而更長。" },
                { range_label: "36–42.2", start_km: 36.0, end_km: 42.2, title: "最終半圈：轉入珍南海灘終點拱門", tag: "沙灘榮耀衝線 · 6.2 km", pace_offset_sec: [0, 15], terrain: "最後 6.2 km 轉入熱鬧的 Pantai Cenang 珍南海灘大街直奔海灘終點拱門。", intensity: "海風與觀眾歡呼聲中穩住步伐，享受最後一段路程迎向終點！", form_tip: "保持直立核心與流暢步頻。", aid_station: "最後補給站拿冰水淋臉，帥氣衝線！", common_mistake: "進沙灘終點前突然加速導致大腿抽筋。" }
            ]
        };
    }

    // 5. 短距離 51.5 標鐵 (<= 12km, 3段)
    if (runKm <= 12) {
        const r1 = Number((runKm * 0.20).toFixed(1));
        const r2 = Number((runKm * 0.75).toFixed(1));
        return {
            rationale: `AI 依標準距離路跑 (${runKm}km) 節奏，將賽道精簡切割為 3 段（前 ${r1}km T2 轉換壓速 ➔ 中段 ${(r2-r1).toFixed(1)}km 閾值巡航 ➔ 最後 ${(runKm-r2).toFixed(1)}km 終點漸進衝刺）。`,
            segs: [
                { range_label: `0–${r1}`, start_km: 0.0, end_km: r1, title: "出 T2 轉換起跑壓速", tag: `轉換適應 · ${r1} km`, pace_offset_sec: [5, 12], terrain: `出 T2 轉換區前 ${r1} km。`, intensity: "比目標配速微慢 5–10 秒/km，讓雙腿適應地面衝擊。", form_tip: "高步頻 (178+ spm)、小步幅。", aid_station: "第一站喝水並淋水降溫。", common_mistake: "出 T2 第 1 km 衝太快導致第 3 km 就側腹痛或爆心率。" },
                { range_label: `${r1}–${r2}`, start_km: r1, end_km: r2, title: "核心巡航與呼吸鎖定", tag: `主巡航段 · ${(r2-r1).toFixed(1)} km`, pace_offset_sec: [-2, 5], terrain: `第 ${r1}–${r2} km 賽道核心路段（總爬升約 ${Math.round(rEle)}m）。`, intensity: "鎖定目標配速穩定推進，遇緩坡維持步頻不硬跨大步。", form_tip: "肩膀放鬆、目光看前方 15m。", aid_station: "中段補給站補水或吃半包能量膠/運動飲料。", common_mistake: "中段被旁人帶亂呼吸節奏。" },
                { range_label: `${r2}–${runKm}`, start_km: r2, end_km: runKm, title: "最後漸進加速衝線", tag: `終點衝刺 · ${(runKm-r2).toFixed(1)} km`, pace_offset_sec: [-10, 5], terrain: `最後 ${(runKm-r2).toFixed(1)} km 返回終點拱門。`, intensity: "若體感還有餘裕，每 km 可提速 5–10 秒全力奔向終點！", form_tip: "加大擺臂帶動雙腿步頻。", aid_station: "拿水漱口或淋頭即可，直奔終點！", common_mistake: "最後 300m 姿勢變形跨大步導致拉傷。" }
            ]
        };
    }

    // 6. 通用/自訂賽道：依爬升決定 4 段或 5 段
    if (rEle <= 130) {
        const rCuts = [0.0, Number((runKm * 0.14).toFixed(1)), Number((runKm * 0.50).toFixed(1)), Number((runKm * 0.82).toFixed(1)), Number(runKm.toFixed(1))];
        return {
            rationale: `AI 掃描本場路跑賽道 (${runKm}km / 爬升 ${Math.round(rEle)}m) 屬於平緩巡航型，自動將賽道精簡切割為 4 段：依序為出 T2 轉換起跑、前段穩定巡航、中後段抗熱耐力守衛與最後終點衝刺。`,
            segs: [
                { range_label: `${rCuts[0]}–${rCuts[1]}`, start_km: rCuts[0], end_km: rCuts[1], title: "出 T2 保守起跑轉換", tag: `轉換適應 · ${(rCuts[1]-rCuts[0]).toFixed(1)} km`, pace_offset_sec: [10, 15], terrain: "出 T2 轉換區前段，雙腿剛由騎車切換為跑步。", intensity: "比平路目標配速慢 10–15 秒/km，心率絕對先別衝上去。", form_tip: "步幅小、步頻高 (175–180 spm)，讓雙腿平順切換。", aid_station: "第一處補給站先喝水、拿海綿或冰塊降溫。", common_mistake: "被 T2 出發的人潮帶快，前 2 km 快了 20 秒/km 以上。" },
                { range_label: `${rCuts[1]}–${rCuts[2]}`, start_km: rCuts[1], end_km: rCuts[2], title: "前半程穩定配速巡航", tag: `前段巡航 · ${(rCuts[2]-rCuts[1]).toFixed(1)} km`, pace_offset_sec: [-3, 6], terrain: `第 ${rCuts[1]}–${rCuts[2]} km 平緩巡航段。`, intensity: "進入平路目標配速，鎖定有氧呼吸與步頻節奏。", form_tip: "放鬆肩膀與雙手，落地點在身體正下方。", aid_station: "每 30 分鐘按時補充 30g 碳水（能量膠配白開水）。", common_mistake: "前半程覺得輕鬆而超速，埋下後半程掉速伏筆。" },
                { range_label: `${rCuts[2]}–${rCuts[3]}`, start_km: rCuts[2], end_km: rCuts[3], title: "中後段抗熱與步頻守衛", tag: `耐力考驗 · ${(rCuts[3]-rCuts[2]).toFixed(1)} km`, pace_offset_sec: [0, 12], terrain: `第 ${rCuts[2]}–${rCuts[3]} km 體能撞牆與氣溫考驗區。`, intensity: "守住目標配速上限，每過補給站強制淋冰水降核心體溫。", form_tip: "專注維持 175+ 步頻，步頻不掉、配速就不會崩盤。", aid_station: "折返點補給站補充足夠鈉與咖啡因膠/可樂。", common_mistake: "心態鬆懈開始走路，一旦停下就很難重新跑起來。" },
                { range_label: `${rCuts[3]}–${rCuts[4]}`, start_km: rCuts[3], end_km: rCuts[4], title: "最後餘裕漸進加速衝線", tag: `終點衝刺 · ${(rCuts[4]-rCuts[3]).toFixed(1)} km`, pace_offset_sec: [-10, 10], terrain: `最後 ${(rCuts[4]-rCuts[3]).toFixed(1)} km 奔向終點拱門。`, intensity: "若呼吸與雙腿還有餘裕，每 km 可快 5–10 秒；若無餘裕就穩守目標配速到底。", form_tip: "擺臂帶動加速，眼睛看前方的下一個目標。", aid_station: "最後補給站拿水漱口或淋頭即可，穩定迎接終點！", common_mistake: "最後 500m 突然猛衝導致終點前小腿劇烈抽筋。" }
            ]
        };
    } else {
        const rCuts = [0.0, Number((runKm * 0.12).toFixed(1)), Number((runKm * 0.35).toFixed(1)), Number((runKm * 0.60).toFixed(1)), Number((runKm * 0.84).toFixed(1)), Number(runKm.toFixed(1))];
        return {
            rationale: `AI 掃描本場路跑賽道 (${runKm}km / 爬升 ${Math.round(rEle)}m) 具有明顯坡度起伏，自動將賽道切割為 5 段：依序為 T2 轉換起跑、前段爬坡調節、下坡護腿轉換、中後段平路耐力與最後衝刺段。`,
            segs: [
                { range_label: `${rCuts[0]}–${rCuts[1]}`, start_km: rCuts[0], end_km: rCuts[1], title: "保守起跑轉換", tag: `轉換適應 · ${(rCuts[1]-rCuts[0]).toFixed(1)} km`, pace_offset_sec: [10, 15], terrain: "出 T2 轉換區前段，雙腿剛由騎車切換為跑步。", intensity: "比平路目標配速慢 10–15 秒/km，心率絕對先別衝上去。", form_tip: "步幅小、步頻高 (175–180 spm)，讓雙腿平順切換。", aid_station: "第一處補給站先喝水、拿海綿或冰塊降溫。", common_mistake: "被 T2 出發的人潮帶快，前 2 km 快了 20 秒/km 以上。" },
                { range_label: `${rCuts[1]}–${rCuts[2]}`, start_km: rCuts[1], end_km: rCuts[2], title: "爬坡段看心率調強度", tag: `爬升調節 · ${(rCuts[2]-rCuts[1]).toFixed(1)} km`, pace_offset_sec: [20, 45], terrain: `第 ${rCuts[1]}–${rCuts[2]} km 主要爬升起伏路段。`, intensity: "看心率與呼吸，不死守平路配速；上坡每 km 慢 20–45 秒完全正常。", form_tip: "身體微前傾、縮短步幅、手肘往後擺動帶動步伐。", aid_station: "過坡頂補給站務必補水與電解質。", common_mistake: "上坡硬維持平路配速導致心率過早突破閾值。" },
                { range_label: `${rCuts[2]}–${rCuts[3]}`, start_km: rCuts[2], end_km: rCuts[3], title: "下坡與折返護腿跑姿", tag: `下坡護腿 · ${(rCuts[3]-rCuts[2]).toFixed(1)} km`, pace_offset_sec: [-8, 5], terrain: `第 ${rCuts[2]}–${rCuts[3]} km 下坡與折返轉換路段。`, intensity: "順著重力自然滑落，不跨大步煞車。", form_tip: "落地點在身體重心正下方，減少股四頭肌離心收縮衝擊。", aid_station: "小口喝水，按時補充跑步能量膠。", common_mistake: "下坡跨大步腳跟煞車導致大腿前側提早抽筋。" },
                { range_label: `${rCuts[3]}–${rCuts[4]}`, start_km: rCuts[3], end_km: rCuts[4], title: "中後段平路配速守衛", tag: `耐力巡航 · ${(rCuts[4]-rCuts[3]).toFixed(1)} km`, pace_offset_sec: [0, 12], terrain: `第 ${rCuts[3]}–${rCuts[4]} km 中後段耐力考驗區。`, intensity: "回到目標配速上限，每站抓冰塊降溫並可補充咖啡因提振精神。", form_tip: "專注維持 175+ 步頻，步頻不掉、配速就不會崩盤。", aid_station: "每 30 分鐘補充碳水與足量鈉離子。", common_mistake: "心態鬆懈開始走路，一旦停下就很難重新跑起來。" },
                { range_label: `${rCuts[4]}–${rCuts[5]}`, start_km: rCuts[4], end_km: rCuts[5], title: "有餘裕才漸進加速", tag: `最後衝刺 · ${(rCuts[5]-rCuts[4]).toFixed(1)} km`, pace_offset_sec: [-10, 10], terrain: `最後 ${(rCuts[5]-rCuts[4]).toFixed(1)} km 回程奔向終點拱門。`, intensity: "若呼吸與雙腿還有餘裕，每 km 可快 5–10 秒；若無餘裕就穩守目標配速到底。", form_tip: "擺臂帶動加速，眼睛看前方的下一個目標。", aid_station: "最後補給站拿水漱口或淋頭即可，穩定迎接終點！", common_mistake: "最後 500m 突然猛衝導致終點前小腿劇烈抽筋。" }
            ]
        };
    }
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

    const bikeSegObj = aiSegmentBikeCourseClient(course, bikeKm, windDir, windSpeedKmh, climbCapW);
    const bikeSegsRaw = bikeSegObj.segs;
    const bikeSegRationale = bikeSegObj.rationale;

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

    const runSegObj = aiSegmentRunCourseClient(course, runKm);
    const runSegsRaw = runSegObj.segs;
    const runSegRationale = runSegObj.rationale;

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
            headline: `AI 依賽道地形切為 ${bikeSegments.length} 段騎法，前 ${bikeSegments[0].end_km} km 與最後 ${Math.round(bikeKm - bikeSegments[bikeSegments.length - 1].start_km)} km 都要收。`,
            segmentation_rationale: bikeSegRationale,
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
            headline: `AI 依賽道地形切為 ${runSegments.length} 段配速，把平路配速換成每一段的實戰配速。`,
            segmentation_rationale: runSegRationale,
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
