/**
 * 前端控制器：
 * - 頂部 Step 1 / Step 2 / Step 3 標籤切換 (解決頁面過長問題)
 * - 賽道等高線圖防重疊標籤演算法 + 點擊全螢幕無段縮放檢視視窗 (Zoom Modal)
 * - 地端 AI 賽道與當日天氣解析 (/api/analyze-course) + 多模型動態預估 (/api/predict)
 */

let currentCourseData = null;
let lastPredictionResult = null;
let currentBikeMode = 'ftp';
let predictDebounceTimer = null;
let activeZoomType = 'bike';
let activeZoomScale = 1.0;

// Step 4 Playbook 互動狀態
let activePlaybookTab = 1;
let isPlaybookShowAll = false;
let activeBikeSegIdx = 0;
let activeRunSegIdx = 0;
let activeRiskIdx = 0;

/**
 * 切換頂部 Step 1 ~ 4 分頁
 */
function switchStep(stepNum) {
    [1, 2, 3, 4].forEach(n => {
        const btn = document.getElementById(`navBtnStep${n}`);
        const view = document.getElementById(`stepView${n}`);
        if (btn) btn.classList.toggle('active', n === stepNum);
        if (view) view.classList.toggle('active-step', n === stepNum);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setDefaultRaceDate() {
    const dateEl = document.getElementById('raceDateInput');
    if (dateEl && !dateEl.value) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        dateEl.value = d.toISOString().split('T')[0];
    }
}

function quickFillUrl(url, suggestedDate) {
    document.getElementById('courseUrlInput').value = url;
    if (suggestedDate) {
        document.getElementById('raceDateInput').value = suggestedDate;
    }
    analyzeCourseUrl();
}

async function analyzeCourseUrl() {
    const url = document.getElementById('courseUrlInput').value.trim();
    const raceDate = document.getElementById('raceDateInput').value;
    const btn = document.getElementById('btnAnalyzeCourse');
    const origText = btn.textContent;
    btn.textContent = "⏳ AI 解析賽道與天氣中...";
    btn.disabled = true;

    const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

    try {
        if (!isStaticHost) {
            const resp = await fetch('/api/analyze-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, race_date: raceDate })
            });
            if (!resp.ok) throw new Error('Server returned ' + resp.status);
            const course = await resp.json();
            applyCourseDataToUI(course);
            return;
        }
        throw new Error('Static host mode');
    } catch (err) {
        if (typeof analyzeCourseClient === 'function') {
            const course = await analyzeCourseClient(url, raceDate);
            applyCourseDataToUI(course);
        } else {
            console.warn("Backend API error:", err);
            document.getElementById('parsedCourseStatus').textContent = "⚠️ 無法載入賽道解析模組";
        }
    } finally {
        btn.textContent = origText;
        btn.disabled = false;
    }
}

function applyCourseDataToUI(course) {
    currentCourseData = course;

    document.getElementById('parsedCourseName').textContent = course.name || "已解析之鐵人三項賽道";
    document.getElementById('parsedCourseStatus').textContent = course.ai_parse_status || "✓ 已完成賽道等高線與當日天氣預報解析";

    // 同步更新頂部 Step 1 導覽副標題
    const sub1 = document.getElementById('navSubStep1');
    if (sub1) {
        sub1.textContent = `${course.name} (${course.temp_c ?? 28}°C)`;
    }

    const w = course.weather || {};
    const weatherEl = document.getElementById('weatherForecastBadge');
    if (weatherEl) {
        weatherEl.innerHTML = `
            <div><strong>${w.source_label || '🌤️ 比賽當日氣象預估'}</strong></div>
            <div>氣溫 <strong>${w.temp_min_c ?? 23}°C – ${w.temp_max_c ?? 29}°C</strong> (體感最高 ${w.apparent_max_c ?? 31}°C) ｜ 濕度 <strong>${w.humidity_pct ?? course.humidity_pct ?? 76}%</strong></div>
            <div>風向 <strong>${w.wind_dir || '東北風'} ${w.wind_speed_kmh ?? 18} km/h</strong> (最大陣風 ${w.wind_gust_kmh ?? 28} km/h) ｜ 降雨機率 <strong>${w.rain_prob_pct ?? 20}%</strong></div>
        `;
    }

    document.getElementById('courseDistType').value = course.distance_type || "113";
    document.getElementById('courseSwimKm').value = course.swim_km ?? 1.9;
    document.getElementById('courseBikeKm').value = course.bike_km ?? 90;
    document.getElementById('courseBikeEle').value = course.bike_elevation_m ?? 500;
    document.getElementById('courseRunKm').value = course.run_km ?? 21.1;
    document.getElementById('courseRunEle').value = course.run_elevation_m ?? 120;
    document.getElementById('courseTempC').value = course.temp_c ?? 28;
    document.getElementById('courseHumidPct').value = course.humidity_pct ?? 76;
    document.getElementById('courseWindSpeed').value = course.wind_speed_kmh ?? 18;
    document.getElementById('courseWindGust').value = course.wind_gust_kmh ?? 28;

    drawElevationContour('bikeElevationChart', course.bike_profile || [], '#D97706', 'bikeGradFill', course.bike_km, false);
    drawElevationContour('runElevationChart', course.run_profile || [], '#E11D48', 'runGradFill', course.run_km, false);

    document.getElementById('bikeEleSummary').textContent = `${course.bike_km} km｜爬升 ${course.bike_elevation_m} m`;
    document.getElementById('runEleSummary').textContent = `${course.run_km} km｜爬升 ${course.run_elevation_m} m`;

    triggerPrediction();
}

/**
 * 繪製賽道等高線高度剖面圖
 * - 內建「防標籤重疊演算法 (Collision-Free Staggered Labels)」：
 *   一般預覽模式自動篩選並錯開標籤 X 軸距離；放大視窗模式則以高低錯落引線完整呈現所有地標與坡度。
 */
function drawElevationContour(containerId, profileList, strokeColor, gradId, totalKm, isLargeModal = false) {
    const container = document.getElementById(containerId);
    if (!container || !profileList || profileList.length < 2) return;

    const width = isLargeModal ? Math.round(980 * activeZoomScale) : 580;
    const height = isLargeModal ? 300 : 170;
    const padL = 44, padR = 28, padT = isLargeModal ? 48 : 30, padB = 28;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxKm = Math.max(...profileList.map(p => p.km), totalKm || 1);
    const rawPeakEle = Math.max(...profileList.map(p => p.ele), 30);
    const maxEle = rawPeakEle * 1.25;

    const toX = (km) => padL + (km / maxKm) * plotW;
    const toY = (ele) => padT + plotH - (ele / maxEle) * plotH;

    const polyPts = profileList.map(p => `${toX(p.km).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ');
    const areaPts = `${toX(profileList[0].km).toFixed(1)},${(padT + plotH).toFixed(1)} ${polyPts} ${toX(profileList[profileList.length - 1].km).toFixed(1)},${(padT + plotH).toFixed(1)}`;

    // 篩選要顯示文字標籤的點，並透過最小 X 間距避免重疊
    const minPixelGap = isLargeModal ? 85 : 135;
    let lastLabelX = -999;
    let staggerToggle = 0;
    let nodesHtml = '';

    // 找出全場最高點索引，確保最高點一定會標示
    let peakIdx = 0;
    profileList.forEach((p, i) => {
        if (p.ele > profileList[peakIdx].ele) peakIdx = i;
    });

    profileList.forEach((p, idx) => {
        const cx = toX(p.km);
        const cy = toY(p.ele);
        const isPeak = idx === peakIdx;
        const gradeStr = p.grade ? ` (坡度 ${p.grade > 0 ? '+' : ''}${p.grade}%)` : '';

        nodesHtml += `
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${isPeak ? 5 : (isLargeModal ? 4 : 3)}" fill="${strokeColor}" stroke="#fff" stroke-width="1.5">
                <title>📍 ${p.km} km｜海拔 ${p.ele} m${gradeStr} — ${p.label || ''}</title>
            </circle>
        `;

        if (!p.label) return;

        // 判斷是否與上一個標籤太近 (若為全場最高點則強制顯示)
        const canPlace = isPeak || (cx - lastLabelX >= minPixelGap);
        if (!canPlace && !isLargeModal) return;

        if (cx - lastLabelX >= minPixelGap || isLargeModal) {
            // 在放大模式若兩點較近，自動上下錯開標籤高度 (Staggered Y offset)
            const yOffset = (isLargeModal && (cx - lastLabelX < 115)) ? (staggerToggle % 2 === 0 ? -24 : -10) : -10;
            staggerToggle++;
            lastLabelX = cx;

            const labelY = Math.max(14, cy + yOffset);
            const anchor = cx > width - 85 ? 'end' : (cx < 85 ? 'start' : 'middle');
            const shortLabel = (!isLargeModal && p.label.length > 9) ? p.label.slice(0, 9) + '…' : p.label;

            // 引線
            if (cy - labelY > 8) {
                nodesHtml += `<line x1="${cx.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(labelY + 3).toFixed(1)}" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="2,2" opacity="0.7"/>`;
            }

            nodesHtml += `
                <text x="${cx.toFixed(1)}" y="${labelY.toFixed(1)}" fill="#0F172A" font-size="${isLargeModal ? '11.5' : '10'}" font-weight="700" text-anchor="${anchor}">
                    ${shortLabel} (${p.ele}m)
                </text>
            `;
        }
    });

    const topGridEle = Math.round(rawPeakEle);
    const midGridEle = Math.round(rawPeakEle / 2);

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" width="${isLargeModal ? width + 'px' : '100%'}" height="100%" preserveAspectRatio="none">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.38"/>
                    <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.03"/>
                </linearGradient>
            </defs>
            <line x1="${padL}" y1="${toY(topGridEle).toFixed(1)}" x2="${width - padR}" y2="${toY(topGridEle).toFixed(1)}" stroke="#CBD5E1" stroke-dasharray="3,3"/>
            <line x1="${padL}" y1="${toY(midGridEle).toFixed(1)}" x2="${width - padR}" y2="${toY(midGridEle).toFixed(1)}" stroke="#E2E8F0" stroke-dasharray="3,3"/>
            <line x1="${padL}" y1="${(padT + plotH).toFixed(1)}" x2="${width - padR}" y2="${(padT + plotH).toFixed(1)}" stroke="#94A3B8"/>

            <text x="${padL - 6}" y="${(toY(topGridEle) + 3).toFixed(1)}" fill="#475569" font-size="10" font-weight="600" text-anchor="end">${topGridEle}m</text>
            <text x="${padL - 6}" y="${(toY(midGridEle) + 3).toFixed(1)}" fill="#64748B" font-size="10" text-anchor="end">${midGridEle}m</text>
            <text x="${padL - 6}" y="${(padT + plotH + 3).toFixed(1)}" fill="#64748B" font-size="10" text-anchor="end">0m</text>

            <text x="${padL}" y="${height - 7}" fill="#475569" font-size="10.5" font-weight="600" text-anchor="start">0 km</text>
            <text x="${(padL + plotW * 0.25).toFixed(1)}" y="${height - 7}" fill="#64748B" font-size="10" text-anchor="middle">${(maxKm * 0.25).toFixed(1)} km</text>
            <text x="${(padL + plotW * 0.50).toFixed(1)}" y="${height - 7}" fill="#475569" font-size="10.5" font-weight="600" text-anchor="middle">${(maxKm * 0.50).toFixed(1)} km</text>
            <text x="${(padL + plotW * 0.75).toFixed(1)}" y="${height - 7}" fill="#64748B" font-size="10" text-anchor="middle">${(maxKm * 0.75).toFixed(1)} km</text>
            <text x="${width - padR}" y="${height - 7}" fill="#475569" font-size="10.5" font-weight="600" text-anchor="end">${maxKm} km</text>

            <polygon points="${areaPts}" fill="url(#${gradId})"/>
            <polyline fill="none" stroke="${strokeColor}" stroke-width="2.6" points="${polyPts}"/>
            ${nodesHtml}
        </svg>
    `;
}

/**
 * 開啟等高線全螢幕放大檢視視窗 (Zoom Modal)
 */
function openZoomModal(type) {
    if (!currentCourseData) return;
    activeZoomType = type;
    activeZoomScale = 1.0;
    updateZoomScaleButtons(1.0);

    const overlay = document.getElementById('zoomModalOverlay');
    if (overlay) overlay.classList.add('open');

    renderZoomModalContent();
}

function closeZoomModal() {
    const overlay = document.getElementById('zoomModalOverlay');
    if (overlay) overlay.classList.remove('open');
}

function setModalZoomScale(scale) {
    activeZoomScale = scale;
    updateZoomScaleButtons(scale);
    renderZoomModalContent();
}

function updateZoomScaleButtons(scale) {
    document.getElementById('btnZoom1x')?.classList.toggle('active', scale === 1);
    document.getElementById('btnZoom15x')?.classList.toggle('active', scale === 1.6);
    document.getElementById('btnZoom25x')?.classList.toggle('active', scale === 2.4);
}

function renderZoomModalContent() {
    if (!currentCourseData) return;
    const isBike = activeZoomType === 'bike';
    const profile = isBike ? (currentCourseData.bike_profile || []) : (currentCourseData.run_profile || []);
    const distKm = isBike ? currentCourseData.bike_km : currentCourseData.run_km;
    const eleM = isBike ? currentCourseData.bike_elevation_m : currentCourseData.run_elevation_m;
    const color = isBike ? '#D97706' : '#E11D48';

    document.getElementById('zoomModalTitle').textContent = isBike
        ? `🚴 ${currentCourseData.name} — 單車賽道等高線放大檢視 (${distKm}km / 總爬升 ${eleM}m)`
        : `🏃 ${currentCourseData.name} — 路跑賽道等高線放大檢視 (${distKm}km / 總爬升 ${eleM}m)`;

    drawElevationContour('zoomModalSvgBox', profile, color, 'modalGradFill', distKm, true);

    const tbody = document.getElementById('zoomModalTableBody');
    if (tbody) {
        tbody.innerHTML = profile.map(p => {
            const g = p.grade || 0;
            const gColor = g >= 4 ? '#DC2626' : (g >= 1.5 ? '#D97706' : (g <= -2.5 ? '#0284C7' : '#475569'));
            const gText = g > 0 ? `+${g}% (上坡)` : (g < 0 ? `${g}% (下坡)` : `0.0% (平路)`);
            return `
                <tr>
                    <td><strong>${p.km} km</strong></td>
                    <td><strong>${p.ele} m</strong></td>
                    <td style="color:${gColor}; font-weight:700;">${gText}</td>
                    <td>${p.label || '賽道巡航段'}</td>
                </tr>
            `;
        }).join('');
    }
}

function toggleSplitsBox() {
    const box = document.getElementById('pbSplitsContainer');
    if (!box) return;
    box.style.display = (box.style.display === 'none') ? 'grid' : 'none';
}

function toggleLongRunBox() {
    const box = document.getElementById('longSessionContainer');
    if (!box) return;
    box.style.display = (box.style.display === 'none') ? 'grid' : 'none';
}

function setBikeMode(mode) {
    currentBikeMode = mode;
    document.getElementById('btnModeFtp').classList.toggle('active', mode === 'ftp');
    document.getElementById('btnModeSpeed').classList.toggle('active', mode === 'speed');
    document.getElementById('ftpFieldWrap').style.display = mode === 'ftp' ? 'flex' : 'none';
    document.getElementById('speedFieldWrap').style.display = mode === 'speed' ? 'flex' : 'none';
    if (mode === 'ftp') {
        document.getElementById('flatSpeedKmh').value = '';
    } else {
        document.getElementById('ftpWatts').value = '';
    }
    triggerPrediction();
}

function parseHHMM(str) {
    if (!str) return 0;
    const clean = str.trim().replace('：', ':');
    if (!clean) return 0;
    if (clean.includes(':')) {
        const parts = clean.split(':').map(Number);
        if (parts.some(isNaN)) return 0;
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    }
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) {
        return num <= 16 && clean.includes('.') ? num * 60 : num;
    }
    return 0;
}

function formatHHMM(mins) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function onPbInput() {
    const totVal = document.getElementById('pbTotal').value.trim();
    if (totVal && document.getElementById('pbDistType').value === 'none') {
        document.getElementById('pbDistType').value = '113';
    }
    triggerPrediction();
}

function autoSumPbSplits() {
    const s = parseHHMM(document.getElementById('pbSwim').value);
    const t1 = parseHHMM(document.getElementById('pbT1').value);
    const b = parseHHMM(document.getElementById('pbBike').value);
    const t2 = parseHHMM(document.getElementById('pbT2').value);
    const r = parseHHMM(document.getElementById('pbRun').value);
    const sum = s + t1 + b + t2 + r;
    if (sum > 0) {
        document.getElementById('pbTotal').value = formatHHMM(sum);
        if (document.getElementById('pbDistType').value === 'none') {
            document.getElementById('pbDistType').value = '113';
        }
    }
    triggerPrediction();
}

async function manualExecutePrediction() {
    const btn = document.getElementById('btnRunPredict');
    if (btn) btn.textContent = "⏳ 正在運算多模型完賽預估...";
    await executePrediction();
    if (btn) btn.textContent = "🚀 計算完賽預估時間與賽道攻略 (前往 Step 3) ➔";
    switchStep(3);
}

function clearAllBlocks() {
    document.getElementById('pbDistType').value = 'none';
    if (document.getElementById('brickFreq')) document.getElementById('brickFreq').value = 'none';
    ['pbTotal', 'pbSwim', 'pbT1', 'pbBike', 'pbT2', 'pbRun',
     'swimSecPer100m', 'weightKg', 'ftpWatts', 'flatSpeedKmh', 'hmPb', 'runPaceSecPerKm',
     'weeklySwimKm', 'weeklyBikeKm', 'weeklyRunKm', 'longestBikeKm', 'longestRunKm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    triggerPrediction();
}

function loadDemoScenario(type) {
    clearAllBlocks();
    if (type === 'tp_dashboard') {
        setBikeMode('ftp');
        document.getElementById('swimSecPer100m').value = '105';
        document.getElementById('weightKg').value = '68';
        document.getElementById('ftpWatts').value = '205';
        document.getElementById('hmPb').value = '01:44';
        document.getElementById('weeklySwimKm').value = '8.5';
        document.getElementById('weeklyBikeKm').value = '167.5';
        document.getElementById('weeklyRunKm').value = '36.6';
        document.getElementById('longestBikeKm').value = '95';
        document.getElementById('longestRunKm').value = '18';
        document.getElementById('brickFreq').value = 'regular';
    } else if (type === 'pb_only') {
        document.getElementById('pbDistType').value = '113';
        document.getElementById('pbTotal').value = '06:10';
    } else if (type === 'speed_only') {
        setBikeMode('speed');
        document.getElementById('swimSecPer100m').value = '125';
        document.getElementById('flatSpeedKmh').value = '29.5';
        document.getElementById('runPaceSecPerKm').value = '345';
    } else if (type === 'all_blocks') {
        setBikeMode('ftp');
        document.getElementById('pbDistType').value = '113';
        document.getElementById('pbSwim').value = '00:34';
        document.getElementById('pbT1').value = '00:03';
        document.getElementById('pbBike').value = '02:41';
        document.getElementById('pbT2').value = '00:03';
        document.getElementById('pbRun').value = '01:54';
        document.getElementById('pbTotal').value = '05:15';
        document.getElementById('swimSecPer100m').value = '105';
        document.getElementById('weightKg').value = '68';
        document.getElementById('ftpWatts').value = '205';
        document.getElementById('hmPb').value = '01:44';
        document.getElementById('weeklySwimKm').value = '8.5';
        document.getElementById('weeklyBikeKm').value = '167.5';
        document.getElementById('weeklyRunKm').value = '36.6';
        document.getElementById('longestBikeKm').value = '95';
        document.getElementById('longestRunKm').value = '18';
        document.getElementById('brickFreq').value = 'regular';
    }
    triggerPrediction();
}

function handleGpxFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const xmlDoc = new DOMParser().parseFromString(e.target.result, "text/xml");
        const pts = Array.from(xmlDoc.getElementsByTagName("trkpt"));
        if (pts.length < 2) {
            alert("GPX 檔案中找不到足夠的軌跡點！");
            return;
        }
        let distKm = 0, gainM = 0;
        let prevLat = null, prevLon = null, prevEle = null;
        const rawProf = [];
        pts.forEach(pt => {
            const lat = parseFloat(pt.getAttribute("lat"));
            const lon = parseFloat(pt.getAttribute("lon"));
            const eleNode = pt.getElementsByTagName("ele")[0];
            const ele = eleNode ? parseFloat(eleNode.textContent) : 0;
            if (!isNaN(lat) && !isNaN(lon)) {
                if (prevLat !== null) {
                    const R = 6371;
                    const dLat = (lat - prevLat) * Math.PI / 180;
                    const dLon = (lon - prevLon) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(prevLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * (Math.sin(dLon / 2) ** 2);
                    distKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    if (ele > prevEle + 0.5) gainM += (ele - prevEle);
                }
                prevLat = lat; prevLon = lon; prevEle = ele;
                rawProf.push({ km: Number(distKm.toFixed(1)), ele: Math.round(ele), grade: 0, label: "" });
            }
        });
        const step = Math.max(1, Math.floor(rawProf.length / 15));
        const sampled = rawProf.filter((_, i) => i % step === 0 || i === rawProf.length - 1);
        for (let i = 1; i < sampled.length; i++) {
            const dKm = Math.max(0.05, sampled[i].km - sampled[i - 1].km);
            const dEle = sampled[i].ele - sampled[i - 1].ele;
            sampled[i].grade = Number(((dEle / (dKm * 1000)) * 100).toFixed(1));
        }
        if (currentCourseData) currentCourseData.bike_profile = sampled;
        document.getElementById('courseBikeKm').value = distKm.toFixed(1);
        document.getElementById('courseBikeEle').value = Math.round(gainM);
        drawElevationContour('bikeElevationChart', sampled, '#D97706', 'bikeGradFill', distKm, false);
        document.getElementById('bikeEleSummary').textContent = `${distKm.toFixed(1)} km｜爬升 ${Math.round(gainM)} m (GPX 實測)`;
        triggerPrediction();
    };
    reader.readAsText(file);
}

function triggerPrediction() {
    clearTimeout(predictDebounceTimer);
    predictDebounceTimer = setTimeout(executePrediction, 120);
}

async function executePrediction() {
    const baseCourse = currentCourseData || {};
    const w = baseCourse.weather || {};
    const payload = {
        course: {
            course_id: baseCourse.course_id || "",
            name: baseCourse.name || "目標鐵人三項賽",
            distance_type: document.getElementById('courseDistType').value,
            swim_km: parseFloat(document.getElementById('courseSwimKm').value) || 1.9,
            bike_km: parseFloat(document.getElementById('courseBikeKm').value) || 90,
            run_km: parseFloat(document.getElementById('courseRunKm').value) || 21.1,
            bike_elevation_m: parseFloat(document.getElementById('courseBikeEle').value) || 0,
            run_elevation_m: parseFloat(document.getElementById('courseRunEle').value) || 0,
            temp_c: parseFloat(document.getElementById('courseTempC').value) || 27.5,
            apparent_max_c: w.apparent_max_c || (parseFloat(document.getElementById('courseTempC').value) + 2.5),
            humidity_pct: parseFloat(document.getElementById('courseHumidPct').value) || 76,
            wind_speed_kmh: parseFloat(document.getElementById('courseWindSpeed').value) || 18,
            wind_gust_kmh: parseFloat(document.getElementById('courseWindGust').value) || 28,
            wind_dir: w.wind_dir || "東北風",
            rain_prob_pct: w.rain_prob_pct ?? 20,
            water_type: baseCourse.water_type || "ocean_calm",
            wetsuit_legal: baseCourse.wetsuit_legal || false,
            t1_base_mins: baseCourse.t1_base_mins || 3.5,
            t2_base_mins: baseCourse.t2_base_mins || 3.0,
            bike_profile: baseCourse.bike_profile || [],
            run_profile: baseCourse.run_profile || [],
            course_details: baseCourse.course_details || {}
        },
        blocks: {
            blockA: {
                pbDistType: document.getElementById('pbDistType').value,
                pbTotal: document.getElementById('pbTotal').value,
                pbSwim: document.getElementById('pbSwim').value,
                pbT1: document.getElementById('pbT1').value,
                pbBike: document.getElementById('pbBike').value,
                pbT2: document.getElementById('pbT2').value,
                pbRun: document.getElementById('pbRun').value
            },
            blockB: {
                swimSecPer100m: parseFloat(document.getElementById('swimSecPer100m').value) || 0,
                weightKg: parseFloat(document.getElementById('weightKg').value) || 68,
                ftpWatts: currentBikeMode === 'ftp' ? (parseFloat(document.getElementById('ftpWatts').value) || 0) : 0,
                flatSpeedKmh: currentBikeMode === 'speed' ? (parseFloat(document.getElementById('flatSpeedKmh').value) || 0) : 0,
                bikeType: document.getElementById('bikeType').value,
                hmPb: document.getElementById('hmPb').value,
                runPaceSecPerKm: parseFloat(document.getElementById('runPaceSecPerKm').value) || 0
            },
            blockC: {
                weeklySwimKm: parseFloat(document.getElementById('weeklySwimKm').value) || 0,
                weeklyBikeKm: parseFloat(document.getElementById('weeklyBikeKm').value) || 0,
                weeklyRunKm: parseFloat(document.getElementById('weeklyRunKm').value) || 0,
                longestBikeKm: parseFloat(document.getElementById('longestBikeKm')?.value) || 0,
                longestRunKm: parseFloat(document.getElementById('longestRunKm')?.value) || 0,
                brickFreq: document.getElementById('brickFreq')?.value || 'none'
            }
        }
    };

    const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

    try {
        if (!isStaticHost) {
            const resp = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error('Prediction API error');
            const res = await resp.json();
            lastPredictionResult = res;
            renderPredictionResult(res, payload.course);
            return;
        }
        throw new Error('Static host mode');
    } catch (e) {
        if (typeof runAdaptivePredictionClient === 'function') {
            const res = runAdaptivePredictionClient(payload);
            lastPredictionResult = res;
            renderPredictionResult(res, payload.course);
        } else {
            console.error(e);
        }
    }
}

function renderPredictionResult(res, course) {
    const conf = res.confidence;
    document.getElementById('confScoreText').textContent = `${conf.score_pct}%`;
    document.getElementById('confSourcesText').textContent = `資料推導基準：🏊 ${conf.sources.swim} ｜ 🚴 ${conf.sources.bike} ｜ 🏃 ${conf.sources.run}`;

    // 同步在頂部 Step 2、Step 3、Step 4 按鈕顯示摘要
    const sub2 = document.getElementById('navSubStep2');
    if (sub2) sub2.textContent = `目前資料完整度：${conf.score_pct}%`;
    const sub3 = document.getElementById('navSubStep3');
    if (sub3) sub3.textContent = `中性預估：${res.predictions.neutral.mid} (${res.predictions.neutral.range})`;
    const sub4 = document.getElementById('navSubStep4');
    if (sub4) sub4.textContent = `單車 NP ${res.playbook?.bike_plan?.target_np_w || '--'}W｜AI 分段攻略與補給`;

    const badgesEl = document.getElementById('activeModelsBadges');
    badgesEl.innerHTML = conf.active_models.map(m => `<span class="model-badge">✓ ${m}</span>`).join('');

    const hintsEl = document.getElementById('missingHintsBox');
    if (conf.missing_hints && conf.missing_hints.length > 0) {
        hintsEl.innerHTML = `💡 <strong>想進一步縮小預測誤差區間？</strong> ${conf.missing_hints.join('；')}`;
    } else {
        hintsEl.innerHTML = `<span style="color:#15803D; font-weight:700;">🌟 您已提供完整積木 A+B+C 資料，系統已啟動最高精準度全模型運算！</span>`;
    }

    const fb = res.metrics?.flat_benchmark;
    const fbEl = document.getElementById('flatBenchmarkCompareBox');
    if (fb && fbEl) {
        const modSign = fb.course_modifier_mins >= 0 ? `+${fb.course_modifier_mins}` : `${fb.course_modifier_mins}`;
        fbEl.innerHTML = `
            <div>🔮 <strong>對照 TP 儀表板「標準平路 ${course.distance_type}km 基準預估」</strong>：
                🟢 樂觀 <strong>${fb.optimistic_range}</strong> (中位 ${fb.optimistic_mid}) ｜
                🔵 中性 <strong>${fb.neutral_range}</strong> (中位 ${fb.neutral_mid}) ｜
                🔴 保守 <strong>${fb.conservative_range}</strong> (中位 ${fb.conservative_mid})
            </div>
            <div>⛰️ <strong>本賽道地形與氣象特化修正 (${course.name})</strong>：<strong>${modSign} 分鐘</strong>（已計入單車爬升 ${course.bike_elevation_m}m、路跑爬升 ${course.run_elevation_m}m 與當日風速 ${course.wind_speed_kmh}km/h / 氣溫 ${course.temp_c}°C 淨影響，下方大字卡即為加上 ${modSign} 分鐘後之實戰預估）</div>
        `;
    }

    const preds = res.predictions;
    document.getElementById('optRangeText').textContent = preds.optimistic.range;
    document.getElementById('optMidText').textContent = `預估中位數：${preds.optimistic.mid}`;
    renderVisualSplitBar('optVisualBar', preds.optimistic.extra);
    renderSplitsHTML('optSplitsBox', preds.optimistic.splits, course);

    document.getElementById('neuRangeText').textContent = preds.neutral.range;
    document.getElementById('neuMidText').textContent = `預估中位數：${preds.neutral.mid}`;
    renderVisualSplitBar('neuVisualBar', preds.neutral.extra);
    renderSplitsHTML('neuSplitsBox', preds.neutral.splits, course);

    document.getElementById('conRangeText').textContent = preds.conservative.range;
    document.getElementById('conMidText').textContent = `預估中位數：${preds.conservative.mid}`;
    renderVisualSplitBar('conVisualBar', preds.conservative.extra);
    renderSplitsHTML('conSplitsBox', preds.conservative.splits, course);

    // 渲染 Step 3 視覺化瀑布拆解圖、WBGT/坡度診斷與五維雷達圖
    renderStep3VisualAnalytics(res);

    // 渲染 Step 4 互動式戰術攻略本 (Playbook)
    if (res.playbook) {
        renderPlaybookUI(res, course);
    }
}

function renderVisualSplitBar(boxId, extra) {
    const el = document.getElementById(boxId);
    if (!el || !extra) return;
    const marginHrs = Math.floor(Math.abs(extra.cutoff_margin_mins) / 60);
    const marginMins = Math.abs(extra.cutoff_margin_mins) % 60;
    const isSafe = extra.cutoff_margin_mins >= 45;
    const safetyColor = isSafe ? '#059669' : '#D97706';
    const safetyText = extra.cutoff_margin_mins >= 0
        ? `✓ 關門餘裕 +${marginHrs}h${String(marginMins).padStart(2, '0')}m`
        : `⚠️ 超出關門 ${marginHrs}h${String(marginMins).padStart(2, '0')}m`;

    el.innerHTML = `
        <div class="clock-cutoff-pills">
            <span style="color:#1E293B;">🏁 06:00 開賽 ➔ 預計 <strong>${extra.finish_clock}</strong> 進終點</span>
            <span style="color:${safetyColor};">${safetyText}</span>
        </div>
        <div class="split-ratio-wrap">
            <div class="split-ratio-bar">
                <div style="width:${extra.swim_pct}%; background:#0284C7;" title="游泳佔比 ${extra.swim_pct}%"></div>
                <div style="width:${extra.trans_pct}%; background:#64748B;" title="T1+T2 轉換區佔比 ${extra.trans_pct}%"></div>
                <div style="width:${extra.bike_pct}%; background:#D97706;" title="單車佔比 ${extra.bike_pct}%"></div>
                <div style="width:${extra.run_pct}%; background:#E11D48;" title="路跑佔比 ${extra.run_pct}%"></div>
            </div>
            <div class="split-ratio-legend">
                <span style="color:#0284C7;">🏊 ${extra.swim_pct}%</span>
                <span style="color:#D97706;">🚴 ${extra.bike_pct}%</span>
                <span style="color:#E11D48;">🏃 ${extra.run_pct}%</span>
                <span style="color:#64748B;">⏱️ ${extra.trans_pct}%</span>
            </div>
        </div>
    `;
}

function renderStep3VisualAnalytics(res) {
    const wf = res.metrics?.waterfall || [];
    const wfEl = document.getElementById('waterfallChartBox');
    if (wfEl && wf.length) {
        const maxTotal = Math.max(...wf.map(x => x.mins), 300);
        wfEl.innerHTML = wf.map(item => {
            let barW = 0, barColor = '#3B82F6', textColor = '#1E293B';
            if (item.type === 'base') {
                barW = (item.mins / maxTotal) * 100;
                barColor = '#0284C7';
            } else if (item.type === 'total') {
                barW = (item.mins / maxTotal) * 100;
                barColor = '#2563EB';
                textColor = '#1D4ED8';
            } else {
                barW = Math.min(100, Math.max(4, (Math.abs(item.mins) / 45.0) * 65));
                barColor = item.mins > 0 ? '#F59E0B' : '#10B981';
                textColor = item.mins > 0 ? '#B45309' : '#047857';
            }
            return `
                <div class="wf-row">
                    <div class="wf-label" title="${item.label}">${item.label}</div>
                    <div class="wf-track">
                        <div class="wf-fill" style="width:${barW.toFixed(1)}%; background:${barColor};"></div>
                    </div>
                    <div class="wf-val" style="color:${textColor};">${item.display}</div>
                </div>
            `;
        }).join('');
    }

    const diag = res.metrics?.env_slope_diagnostics;
    const diagEl = document.getElementById('envSlopeDiagBox');
    if (diag && diagEl) {
        diagEl.innerHTML = `
            <div class="env-diag-box">
                <div style="font-weight:800; color:#0F172A; margin-bottom:3px;">🌡️ 綜合熱壓力指數 (WBGT) ＆ 露點診斷</div>
                <div>WBGT <strong>${diag.wbgt_c}°C</strong> ｜ 露點溫度 <strong>${diag.dew_point_c}°C</strong></div>
                <div style="color:#B45309; font-weight:600; margin-top:2px;">${diag.heat_risk_label}</div>
            </div>
            <div class="env-diag-box">
                <div style="font-weight:800; color:#0F172A; margin-bottom:3px;">⛰️ 賽道坡度分佈型態 ＆ 變異係數 (VI)</div>
                <div>${diag.slope_type_label}</div>
                <div style="color:#475569; margin-top:2px;">由賽道等高線自動判讀，無須手動輸入</div>
            </div>
        `;
    }

    const radar = res.metrics?.radar_5d || [];
    const radarEl = document.getElementById('radarSvgBox');
    const legendEl = document.getElementById('radarLegendBox');
    if (radarEl && radar.length === 5) {
        const cx = 145, cy = 125, rMax = 88;
        const angles = radar.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);

        const ringPolys = [0.35, 0.68, 1.0].map(scale => {
            const pts = angles.map(a => `${(cx + rMax * scale * Math.cos(a)).toFixed(1)},${(cy + rMax * scale * Math.sin(a)).toFixed(1)}`).join(' ');
            return `<polygon points="${pts}" fill="none" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="${scale < 1 ? '2,2' : 'none'}"/>`;
        }).join('');

        const axesLines = angles.map((a, i) => {
            const x2 = cx + rMax * Math.cos(a);
            const y2 = cy + rMax * Math.sin(a);
            const lx = cx + (rMax + 24) * Math.cos(a);
            const ly = cy + (rMax + 18) * Math.sin(a);
            return `
                <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#CBD5E1" stroke-width="1"/>
                <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" fill="#0F172A" font-size="10.5" font-weight="800" text-anchor="middle">${radar[i].axis} (${radar[i].score})</text>
            `;
        }).join('');

        const dataPts = radar.map((item, i) => {
            const rad = (item.score / 100.0) * rMax;
            return `${(cx + rad * Math.cos(angles[i])).toFixed(1)},${(cy + rad * Math.sin(angles[i])).toFixed(1)}`;
        }).join(' ');

        const dataDots = radar.map((item, i) => {
            const rad = (item.score / 100.0) * rMax;
            const dx = cx + rad * Math.cos(angles[i]);
            const dy = cy + rad * Math.sin(angles[i]);
            return `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4" fill="#2563EB" stroke="#FFF" stroke-width="1.5"/>`;
        }).join('');

        radarEl.innerHTML = `
            <svg viewBox="0 0 290 250" width="100%" height="100%">
                ${ringPolys}
                ${axesLines}
                <polygon points="${dataPts}" fill="rgba(37, 99, 235, 0.22)" stroke="#2563EB" stroke-width="2.4"/>
                ${dataDots}
            </svg>
        `;
    }

    if (legendEl && radar.length === 5) {
        legendEl.innerHTML = radar.map(item => `
            <div class="radar-pill">
                <div style="font-weight:800; color:#1E40AF;">${item.score} 分</div>
                <div style="color:#475569; font-weight:600;">${item.sub}</div>
            </div>
        `).join('');
    }
}

function renderSplitsHTML(boxId, sp, course) {
    const el = document.getElementById(boxId);
    if (!el) return;
    el.innerHTML = `
        <div class="pred-split-item">
            <span>🏊 游泳 ${course.swim_km}km <span class="pred-split-sub">(${sp.swim_pace})</span></span>
            <strong>${sp.swim}</strong>
        </div>
        <div class="pred-split-item">
            <span>⏱️ T1 轉換區</span>
            <strong>${sp.t1}</strong>
        </div>
        <div class="pred-split-item">
            <span>🚴 單車 ${course.bike_km}km <span class="pred-split-sub">(${sp.bike_speed})</span></span>
            <strong>${sp.bike}</strong>
        </div>
        <div class="pred-split-item">
            <span>⏱️ T2 轉換區</span>
            <strong>${sp.t2}</strong>
        </div>
        <div class="pred-split-item">
            <span>🏃 路跑 ${course.run_km}km <span class="pred-split-sub">(${sp.run_pace})</span></span>
            <strong>${sp.run}</strong>
        </div>
    `;
}

/* =========================================================================
   STEP 4: INTERACTIVE DARK TACTICAL PLAYBOOK CONTROLLERS
   ========================================================================= */

function switchPlaybookTab(tabNum) {
    activePlaybookTab = tabNum;
    isPlaybookShowAll = false;
    [1, 2, 3, 4, 5, 6].forEach(n => {
        document.getElementById(`pbTab${n}`)?.classList.toggle('active', n === tabNum);
        document.getElementById(`pbMod${n}`)?.classList.toggle('active-mod', n === tabNum);
    });
}

function toggleAllPlaybookModules() {
    isPlaybookShowAll = !isPlaybookShowAll;
    [1, 2, 3, 4, 5, 6].forEach(n => {
        const mod = document.getElementById(`pbMod${n}`);
        if (mod) {
            mod.classList.toggle('active-mod', isPlaybookShowAll ? true : (n === activePlaybookTab));
        }
    });
}

function renderPlaybookUI(res, course) {
    const pb = res.playbook;
    if (!pb) return;

    // ---------------------------------------------------------
    // 01. 游泳五段策略與浮標通過時間
    // ---------------------------------------------------------
    const sw = pb.swim_plan;
    document.getElementById('pbSwimHeadline').textContent = sw.headline;
    document.getElementById('pbSwimWaterNote').textContent =
        `🌊 水域型態：${currentCourseData?.water_label || '開放水域'} ｜ 賽道距離 ${sw.total_m} m ｜ 當日風速預報 ${course.wind_speed_kmh} km/h (${course.wind_dir})`;

    const swStagesEl = document.getElementById('pbSwimStagesGrid');
    if (swStagesEl) {
        swStagesEl.innerHTML = sw.stages.map(s => `
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag">${s.range_m}</div>
                <div class="pb-dark-card-title">${s.title}</div>
                <div class="pb-dark-card-body">${s.tactic}</div>
            </div>
        `).join('');
    }

    const buoyGridEl = document.getElementById('pbSwimBuoyGrid');
    if (buoyGridEl) {
        const baseBoxes = `
            <div class="buoy-box" style="border-color:#0284C7;">
                <div class="b-label">目標平均配速</div>
                <div class="b-val">${sw.target_pace_100m} <span style="font-size:0.75rem;">/100m</span></div>
            </div>
            <div class="buoy-box" style="border-color:#0284C7;">
                <div class="b-label">預計游泳總時間</div>
                <div class="b-val">${sw.theory_time}</div>
            </div>
        `;
        const splitBoxes = sw.buoy_splits.map(b => `
            <div class="buoy-box">
                <div class="b-label">${b.mark || b.name} 通過時間</div>
                <div class="b-val" style="color:#E2E8F0;">${b.split_time || b.pass_time}</div>
            </div>
        `).join('');
        buoyGridEl.innerHTML = baseBoxes + splitBoxes;
    }

    // ---------------------------------------------------------
    // 02. 單車四個核心數字、AI 動態分段等高線與車錶設定
    // ---------------------------------------------------------
    const bk = pb.bike_plan;
    document.getElementById('pbBikeHeadline').textContent = bk.headline;

    const bkRationaleEl = document.getElementById('pbBikeAiSegRationale');
    if (bkRationaleEl) {
        bkRationaleEl.innerHTML = `🧠 <strong>AI 賽道分段決策（共切為 ${bk.segments.length} 段）</strong>：${bk.segmentation_rationale || '依據本場賽道距離、海拔起伏、折返點與風向特徵自動切割最佳功率執行區間。'}`;
    }

    const bkMetricsEl = document.getElementById('pbBikeFourMetrics');
    if (bkMetricsEl) {
        bkMetricsEl.innerHTML = `
            <div class="pb-metric-card">
                <div class="m-tag">NP · 標準化功率</div>
                <div class="m-big">${bk.target_np_w} W</div>
                <div class="m-desc">最能代表身體真實代謝負荷；本場 AI ${bk.segments.length} 段配瓦以它為主。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag">AP · 預估平均功率</div>
                <div class="m-big">${bk.est_ap_w} W</div>
                <div class="m-desc">含滑行與下坡，通常比 NP 低 5–10 W，防止下坡硬踩。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag">IF · 目標強度係數</div>
                <div class="m-big">${bk.target_if}</div>
                <div class="m-desc">NP ÷ FTP。控制在此區間，下車後雙腿才能跑出最佳配速。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag">FTP · 選手基準閾值</div>
                <div class="m-big">${bk.ftp_w} W</div>
                <div class="m-desc">上坡段絕對上限守在 ${bk.climb_cap_w} W 以內，避免燒掉無氧火柴。</div>
            </div>
        `;
    }

    if (activeBikeSegIdx >= bk.segments.length) activeBikeSegIdx = 0;
    renderBikeInteractiveSegment(bk, course);

    const windCompEl = document.getElementById('pbBikeWindAndComputerGrid');
    if (windCompEl) {
        windCompEl.innerHTML = `
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#FB923C;">HEADWIND · 逆風段法則</div>
                <div class="pb-dark-card-title">守功率下限 ${bk.headwind_w} W</div>
                <div class="pb-dark-card-body">當日預報 ${course.wind_dir} ${course.wind_speed_kmh} km/h。逆風時速度變慢是正常的，接受時速下降、維持低風阻姿勢，切勿硬踩追速度。</div>
            </div>
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#FB923C;">TAILWIND · 順風與下坡</div>
                <div class="pb-dark-card-title">趁順風吃喝補給、不超瓦</div>
                <div class="pb-dark-card-body">順風時維持目標功率即可免費獲得高速，這是穩定喝水、吃能量膠與放鬆肩頸的最佳時機。</div>
            </div>
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#F87171;">CROSSWIND · 強側風與陣風</div>
                <div class="pb-dark-card-title">控車優先 (當日陣風 ${course.wind_gust_kmh} km/h)</div>
                <div class="pb-dark-card-body">通過空曠海岸或涵洞缺口時，若車頭晃動立刻改握彎把/牛角把，不強躺休息把，並拉開與前車距離。</div>
            </div>
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#38BDF8;">BIKE COMPUTER · 車錶設定建議</div>
                <div class="pb-dark-card-title">主畫面欄位與手動分圈</div>
                <div class="pb-dark-card-body">
                    • <strong>顯示欄位</strong>：${bk.computer_setup.fields}<br>
                    • <strong>警示設定</strong>：${bk.computer_setup.alerts}<br>
                    • <strong>分圈策略</strong>：${bk.computer_setup.laps}
                </div>
            </div>
        `;
    }

    // ---------------------------------------------------------
    // 03. 路跑四大地形守則與 AI 動態分段配速
    // ---------------------------------------------------------
    const rn = pb.run_plan;
    document.getElementById('pbRunHeadline').textContent = rn.headline;

    const rnRationaleEl = document.getElementById('pbRunAiSegRationale');
    if (rnRationaleEl) {
        rnRationaleEl.innerHTML = `🧠 <strong>AI 路跑分段決策（共切為 ${rn.segments.length} 段）</strong>：${rn.segmentation_rationale || '依據本場路跑賽道坡度起伏、圈數與折返點自動切割最佳配速執行區間。'}`;
    }

    const rnRulesEl = document.getElementById('pbRunFourRules');
    if (rnRulesEl) {
        rnRulesEl.innerHTML = `
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#2DD4BF;">UPHILL · 上坡段</div>
                <div class="m-big" style="font-size:1.35rem;">縮短步幅、保步頻</div>
                <div class="m-desc">不硬追平路配速；看呼吸與心率，每公里允許比平路慢 20–35 秒。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#2DD4BF;">DOWNHILL · 下坡段</div>
                <div class="m-big" style="font-size:1.35rem;">不跨大步煞車</div>
                <div class="m-desc">重心微微前傾、落地點在身體正下方，保護股四頭肌不被離心收縮打爆。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#2DD4BF;">FLAT · 平路巡航段</div>
                <div class="m-big" style="font-size:1.35rem;">鎖定 ${rn.flat_base_pace}/km</div>
                <div class="m-desc">進入穩定巡航配速，每過一個補給站就喝水並用冰水/海綿降溫。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#2DD4BF;">FINAL · 最後衝刺段</div>
                <div class="m-big" style="font-size:1.35rem;">有餘裕再漸進加速</div>
                <div class="m-desc">地形校準預估路跑總時間 <strong>${rn.terrain_est_time}</strong>。最後 3 km 視體感決定巡航或加速。</div>
            </div>
        `;
    }

    if (activeRunSegIdx >= rn.segments.length) activeRunSegIdx = 0;
    renderRunInteractiveSegment(rn, course);

    // ---------------------------------------------------------
    // 04. 照時鐘吃：氣象連動補給帳本與每 30 分鐘提醒表
    // ---------------------------------------------------------
    const fl = pb.fueling_plan;
    document.getElementById('pbFuelSubnote').textContent =
        `結合當日預報氣溫 ${course.temp_c}°C / 濕度 ${course.humidity_pct}% 與您的預估完賽時間，自動精算每小時碳水、水分與鈉離子需求。`;

    const flTopEl = document.getElementById('pbFuelTopCards');
    if (flTopEl) {
        flTopEl.innerHTML = `
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#FBBF24;">BIKE CARBS · 騎車碳水</div>
                <div class="m-big">${fl.bike_carbs_rate} <span style="font-size:1rem;">g/hr</span></div>
                <div class="m-desc">單車段總目標約 ${fl.bike_total_g} g（${fl.bike_summary}）。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#FBBF24;">RUN CARBS · 跑步碳水</div>
                <div class="m-big">${fl.run_carbs_rate} <span style="font-size:1rem;">g/hr</span></div>
                <div class="m-desc">路跑段總目標約 ${fl.run_total_g} g（${fl.run_summary}）。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#38BDF8;">HYDRATION · 氣象補水</div>
                <div class="m-big">${fl.water_ml_hr} <span style="font-size:1rem;">ml/hr</span></div>
                <div class="m-desc">依當日 ${course.temp_c}°C 計算：單車約需 ${fl.total_bike_water_ml} ml、路跑約需 ${fl.total_run_water_ml} ml。</div>
            </div>
            <div class="pb-metric-card">
                <div class="m-tag" style="color:#34D399;">SODIUM · 防抽筋補鈉</div>
                <div class="m-big">${fl.sodium_mg_hr} <span style="font-size:1rem;">mg/hr</span></div>
                <div class="m-desc">能量膠務必配白開水吞服，避免與高濃度運動飲料同口喝造成胃脹氣。</div>
            </div>
        `;
    }

    const ledgerEl = document.getElementById('pbFuelLedgerList');
    if (ledgerEl) {
        const rows = fl.ledger.map(item => `
            <div class="fuel-ledger-row">
                <span>${item.item}</span>
                <strong style="color:#FBBF24;">${item.grams}</strong>
            </div>
        `).join('');
        ledgerEl.innerHTML = rows + `
            <div class="fuel-ledger-row" style="border-color:#F59E0B; background:#1E293B; margin-top:12px;">
                <span><strong>總準備碳水量 / 賽事建議目標需求</strong></span>
                <strong style="color:#34D399; font-size:1rem;">準備 ${fl.total_carried_g} g / 目標 ${fl.total_required_g} g</strong>
            </div>
        `;
    }

    const bikeSchedEl = document.getElementById('pbBikeSchedulePills');
    if (bikeSchedEl) {
        bikeSchedEl.innerHTML = fl.bike_schedule.map(s => `
            <div class="fuel-pill">
                <div class="fp-time">騎乘 ${s.time}</div>
                <div class="fp-val">${s.carbs_g}</div>
            </div>
        `).join('');
    }

    const runSchedEl = document.getElementById('pbRunSchedulePills');
    if (runSchedEl) {
        runSchedEl.innerHTML = fl.run_schedule.map(s => `
            <div class="fuel-pill">
                <div class="fp-time">開跑 ${s.time}</div>
                <div class="fp-val" style="color:#2DD4BF;">${s.carbs_g}</div>
            </div>
        `).join('');
    }

    // ---------------------------------------------------------
    // 05. 八大比賽風險辨識與應對指南
    // ---------------------------------------------------------
    renderRaceRisksModule(pb.race_risks || []);

    // ---------------------------------------------------------
    // 06. 個人專屬戰術總卡 & LINE 複製文字
    // ---------------------------------------------------------
    renderRaceSummaryAndLineCard(res, course);
}

function selectBikeSegment(idx) {
    activeBikeSegIdx = idx;
    if (lastPredictionResult && lastPredictionResult.playbook) {
        renderBikeInteractiveSegment(lastPredictionResult.playbook.bike_plan, currentCourseData || {});
    }
}

function renderBikeInteractiveSegment(bk, course) {
    const btnsEl = document.getElementById('pbBikeSegButtons');
    const segs = bk.segments || [];
    if (!segs.length) return;

    if (btnsEl) {
        btnsEl.innerHTML = segs.map((s, i) => `
            <button type="button" class="seg-btn ${i === activeBikeSegIdx ? 'active' : ''}" onclick="selectBikeSegment(${i})">
                <div class="s-km">${s.range_label} km</div>
                <div class="s-name">${s.title}</div>
            </button>
        `).join('');
    }

    const cur = segs[activeBikeSegIdx] || segs[0];
    const profile = currentCourseData?.bike_profile || [];
    drawDarkPlaybookElevation(
        'pbBikeInteractiveSvg',
        profile,
        course.bike_km || 90,
        cur.start_km,
        cur.end_km,
        '#FB923C',
        'pbBikeDarkGrad'
    );

    const capEl = document.getElementById('pbBikeChartCaption');
    if (capEl) {
        capEl.textContent = `目前高亮區間：${cur.range_label} km（${cur.title}）｜平路目標 ${cur.flat_watts} W（${cur.if_range}）`;
    }

    const detailEl = document.getElementById('pbBikeSegDetailCard');
    if (detailEl) {
        detailEl.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:0.75rem; font-weight:800; color:#FB923C;">SEGMENT ${activeBikeSegIdx + 1} · ${cur.range_label} KM</span>
                    <span style="font-size:0.75rem; background:#1E293B; color:#FDBA74; padding:2px 8px; border-radius:99px;">${cur.if_range}</span>
                </div>
                <div style="font-size:1.3rem; font-weight:800; color:#FFFFFF; margin-bottom:10px;">${cur.title}</div>
                <div class="seg-stats-row">
                    <div class="seg-stat-mini">
                        <div class="sm-lbl">平路目標功率</div>
                        <div class="sm-val" style="color:#FB923C;">${cur.flat_watts} W</div>
                    </div>
                    <div class="seg-stat-mini">
                        <div class="sm-lbl">佔目標 NP 比例</div>
                        <div class="sm-val">${cur.np_pct}%</div>
                    </div>
                    <div class="seg-stat-mini">
                        <div class="sm-lbl">短坡/爬坡上限</div>
                        <div class="sm-val" style="color:#F87171;">≤ ${cur.climb_cap_w} W</div>
                    </div>
                </div>
            </div>
            <div class="seg-info-grid">
                <div class="seg-info-cell">
                    <div class="ic-lbl">⛰️ 地形與感受</div>
                    <div class="ic-txt">${cur.terrain}</div>
                </div>
                <div class="seg-info-cell">
                    <div class="ic-lbl">🎯 騎乘策略</div>
                    <div class="ic-txt">${cur.tactics}</div>
                </div>
                <div class="seg-info-cell">
                    <div class="ic-lbl">🍌 補給站與動作</div>
                    <div class="ic-txt">${cur.aid_station}</div>
                </div>
                <div class="seg-info-cell" style="border-color:#7F1D1D;">
                    <div class="ic-lbl" style="color:#FCA5A5;">⚠️ 本段常見失誤</div>
                    <div class="ic-txt">${cur.common_mistake}</div>
                </div>
            </div>
        `;
    }
}

function selectRunSegment(idx) {
    activeRunSegIdx = idx;
    if (lastPredictionResult && lastPredictionResult.playbook) {
        renderRunInteractiveSegment(lastPredictionResult.playbook.run_plan, currentCourseData || {});
    }
}

function renderRunInteractiveSegment(rn, course) {
    const btnsEl = document.getElementById('pbRunSegButtons');
    const segs = rn.segments || [];
    if (!segs.length) return;

    if (btnsEl) {
        btnsEl.innerHTML = segs.map((s, i) => `
            <button type="button" class="seg-btn run-theme ${i === activeRunSegIdx ? 'active' : ''}" onclick="selectRunSegment(${i})">
                <div class="s-km">${s.range_label} km</div>
                <div class="s-name">${s.title}</div>
            </button>
        `).join('');
    }

    const cur = segs[activeRunSegIdx] || segs[0];
    const profile = currentCourseData?.run_profile || [];
    drawDarkPlaybookElevation(
        'pbRunInteractiveSvg',
        profile,
        course.run_km || 21.1,
        cur.start_km,
        cur.end_km,
        '#2DD4BF',
        'pbRunDarkGrad'
    );

    const capEl = document.getElementById('pbRunChartCaption');
    if (capEl) {
        capEl.textContent = `目前高亮區間：${cur.range_label} km（${cur.title}）｜建議配速 ${cur.pace_range} /km｜本段預估耗時 ${cur.est_time}`;
    }

    const detailEl = document.getElementById('pbRunSegDetailCard');
    if (detailEl) {
        detailEl.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:0.75rem; font-weight:800; color:#2DD4BF;">RUN SEGMENT ${activeRunSegIdx + 1} · ${cur.range_label} KM</span>
                    <span style="font-size:0.75rem; background:#1E293B; color:#5EEAD4; padding:2px 8px; border-radius:99px;">${cur.tag}</span>
                </div>
                <div style="font-size:1.3rem; font-weight:800; color:#FFFFFF; margin-bottom:10px;">${cur.title}</div>
                <div class="seg-stats-row">
                    <div class="seg-stat-mini" style="grid-column: span 2;">
                        <div class="sm-lbl">建議配速 / km (${cur.offset_note})</div>
                        <div class="sm-val" style="color:#2DD4BF;">${cur.pace_range} <span style="font-size:0.8rem;">/km</span></div>
                    </div>
                    <div class="seg-stat-mini">
                        <div class="sm-lbl">預估本段時間</div>
                        <div class="sm-val">${cur.est_time}</div>
                    </div>
                </div>
            </div>
            <div class="seg-info-grid">
                <div class="seg-info-cell">
                    <div class="ic-lbl">⛰️ 地形與強度重點</div>
                    <div class="ic-txt">${cur.terrain} ${cur.intensity}</div>
                </div>
                <div class="seg-info-cell">
                    <div class="ic-lbl">🏃 跑姿與步頻提醒</div>
                    <div class="ic-txt">${cur.form_tip}</div>
                </div>
                <div class="seg-info-cell">
                    <div class="ic-lbl">🧊 補給站與降溫</div>
                    <div class="ic-txt">${cur.aid_station}</div>
                </div>
                <div class="seg-info-cell" style="border-color:#7F1D1D;">
                    <div class="ic-lbl" style="color:#FCA5A5;">⚠️ 本段常見失誤</div>
                    <div class="ic-txt">${cur.common_mistake}</div>
                </div>
            </div>
        `;
    }
}

/**
 * 繪製暗色主題之互動式等高線圖，並將目前選取的 [hlStartKm, hlEndKm] 區間高亮顯示
 */
function drawDarkPlaybookElevation(containerId, profileList, totalKm, hlStartKm, hlEndKm, themeColor, gradId) {
    const container = document.getElementById(containerId);
    if (!container || !profileList || profileList.length < 2) return;

    const width = 560, height = 205;
    const padL = 40, padR = 20, padT = 28, padB = 26;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxKm = Math.max(...profileList.map(p => p.km), totalKm || 1);
    const rawPeakEle = Math.max(...profileList.map(p => p.ele), 30);
    const maxEle = rawPeakEle * 1.25;

    const toX = (km) => padL + (km / maxKm) * plotW;
    const toY = (ele) => padT + plotH - (ele / maxEle) * plotH;

    const polyPts = profileList.map(p => `${toX(p.km).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ');
    const areaPts = `${toX(profileList[0].km).toFixed(1)},${(padT + plotH).toFixed(1)} ${polyPts} ${toX(profileList[profileList.length - 1].km).toFixed(1)},${(padT + plotH).toFixed(1)}`;

    const hlX1 = toX(Math.max(0, hlStartKm));
    const hlX2 = toX(Math.min(maxKm, hlEndKm));
    const hlW = Math.max(4, hlX2 - hlX1);

    let markersHtml = '';
    let lastX = -999;
    profileList.forEach(p => {
        const cx = toX(p.km);
        const cy = toY(p.ele);
        const inRange = p.km >= hlStartKm - 0.5 && p.km <= hlEndKm + 0.5;
        markersHtml += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${inRange ? 4.5 : 3}" fill="${inRange ? themeColor : '#64748B'}" stroke="#0B1120" stroke-width="1.5"/>`;
        if (p.marker && (cx - lastX >= 42 || inRange)) {
            lastX = cx;
            markersHtml += `<text x="${cx.toFixed(1)}" y="${Math.max(14, cy - 8).toFixed(1)}" fill="${inRange ? '#FFFFFF' : '#94A3B8'}" font-size="10" font-weight="700" text-anchor="middle">${p.marker}</text>`;
        }
    });

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${themeColor}" stop-opacity="0.42"/>
                    <stop offset="100%" stop-color="${themeColor}" stop-opacity="0.04"/>
                </linearGradient>
            </defs>
            <line x1="${padL}" y1="${toY(rawPeakEle).toFixed(1)}" x2="${width - padR}" y2="${toY(rawPeakEle).toFixed(1)}" stroke="#1E293B" stroke-dasharray="3,3"/>
            <line x1="${padL}" y1="${(padT + plotH).toFixed(1)}" x2="${width - padR}" y2="${(padT + plotH).toFixed(1)}" stroke="#334155"/>

            <!-- 高亮選取分段背景帶 -->
            <rect x="${hlX1.toFixed(1)}" y="${padT - 8}" width="${hlW.toFixed(1)}" height="${plotH + 8}" fill="${themeColor}" fill-opacity="0.18" stroke="${themeColor}" stroke-opacity="0.6" stroke-width="1" rx="6"/>

            <polygon points="${areaPts}" fill="url(#${gradId})"/>
            <polyline fill="none" stroke="${themeColor}" stroke-width="2.5" points="${polyPts}"/>
            ${markersHtml}

            <text x="${padL - 6}" y="${(toY(rawPeakEle) + 3).toFixed(1)}" fill="#94A3B8" font-size="9.5" text-anchor="end">${Math.round(rawPeakEle)}m</text>
            <text x="${padL - 6}" y="${(padT + plotH + 3).toFixed(1)}" fill="#64748B" font-size="9.5" text-anchor="end">0m</text>
            <text x="${padL}" y="${height - 6}" fill="#94A3B8" font-size="10" text-anchor="start">0 km</text>
            <text x="${((hlX1 + hlX2) / 2).toFixed(1)}" y="${height - 6}" fill="${themeColor}" font-size="10.5" font-weight="800" text-anchor="middle">▲ ${hlStartKm}–${hlEndKm} km</text>
            <text x="${width - padR}" y="${height - 6}" fill="#94A3B8" font-size="10" text-anchor="end">${maxKm} km</text>
        </svg>
    `;
}

function selectRaceRisk(idx) {
    activeRiskIdx = idx;
    if (lastPredictionResult && lastPredictionResult.playbook) {
        renderRaceRisksModule(lastPredictionResult.playbook.race_risks || []);
    }
}

function renderRaceRisksModule(risks) {
    if (!risks.length) return;
    if (activeRiskIdx >= risks.length) activeRiskIdx = 0;

    const gridEl = document.getElementById('pbRiskSelectorGrid');
    if (gridEl) {
        gridEl.innerHTML = risks.map((r, i) => `
            <button type="button" class="seg-btn ${i === activeRiskIdx ? 'active' : ''}" onclick="selectRaceRisk(${i})">
                <div style="font-size:0.72rem; color:${i === activeRiskIdx ? '#FFF' : '#F87171'}; font-weight:800;">RISK ${r.id}</div>
                <div class="s-km" style="font-size:0.9rem; margin-top:2px;">${r.title}</div>
            </button>
        `).join('');
    }

    const cur = risks[activeRiskIdx] || risks[0];
    const boardEl = document.getElementById('pbRiskDetailBoard');
    if (boardEl) {
        boardEl.innerHTML = `
            <div class="pb-dark-card-tag" style="color:#F87171;">RISK ${cur.id} · 實戰危機處理 SOP</div>
            <div class="pb-dark-card-title" style="font-size:1.3rem; margin-bottom:14px;">${cur.title}</div>
            <div class="risk-four-boxes">
                <div class="risk-box-card">
                    <h5>🔍 1. 如何辨識 (Identify)</h5>
                    <ul>${cur.identify.map(x => `<li>${x}</li>`).join('')}</ul>
                </div>
                <div class="risk-box-card">
                    <h5>🛡️ 2. 如何預防 (Prevent)</h5>
                    <ul>${cur.prevent.map(x => `<li>${x}</li>`).join('')}</ul>
                </div>
                <div class="risk-box-card">
                    <h5>⚡ 3. 當下如何處理 (Respond)</h5>
                    <ul>${cur.respond.map(x => `<li>${x}</li>`).join('')}</ul>
                </div>
                <div class="risk-box-card stop-alert">
                    <h5 style="color:#FCA5A5;">🛑 4. 什麼情況該立即停止 (When to Stop)</h5>
                    <ul>${cur.stop_when.map(x => `<li>${x}</li>`).join('')}</ul>
                </div>
            </div>
        `;
    }
}

function renderRaceSummaryAndLineCard(res, course) {
    const pb = res.playbook;
    const neu = res.predictions.neutral;
    const sw = pb.swim_plan;
    const bk = pb.bike_plan;
    const rn = pb.run_plan;
    const fl = pb.fueling_plan;

    const threeColsEl = document.getElementById('pbSummaryThreeCols');
    if (threeColsEl) {
        threeColsEl.innerHTML = `
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag">SWIM · 游泳戰術摘要</div>
                <div class="pb-dark-card-title">目標 ${neu.splits.swim} (${sw.target_pace_100m}/100m)</div>
                <div class="pb-dark-card-body">
                    • 前 200 m 只用 85% 體感建立換氣節奏<br>
                    • 每 6–8 划抬頭看大目標定位<br>
                    • 最後 300 m 增加打水頻率喚醒雙腿進 T1
                </div>
            </div>
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#FB923C;">BIKE · 單車功率摘要</div>
                <div class="pb-dark-card-title">目標 ${neu.splits.bike} (NP ${bk.target_np_w}W / IF ${bk.target_if})</div>
                <div class="pb-dark-card-body">
                    • 基準 FTP ${bk.ftp_w}W，預估 AP ${bk.est_ap_w}W<br>
                    • 爬坡絕對上限 ≤ ${bk.climb_cap_w}W，逆風守 ${bk.headwind_w}W<br>
                    • 最後一段主動降瓦排酸、拉高踏頻準備 T2
                </div>
            </div>
            <div class="pb-dark-card">
                <div class="pb-dark-card-tag" style="color:#2DD4BF;">RUN & FUEL · 路跑與補給摘要</div>
                <div class="pb-dark-card-title">目標 ${neu.splits.run} (平路 ${rn.flat_base_pace}/km)</div>
                <div class="pb-dark-card-body">
                    • 前 2 km 保守起跑 (${rn.segments[0]?.pace_range}/km)<br>
                    • 騎車碳水 ${fl.bike_carbs_rate}g/hr、跑步 ${fl.run_carbs_rate}g/hr<br>
                    • 每小時補水 ${fl.water_ml_hr}ml + 鈉 ${fl.sodium_mg_hr}mg
                </div>
            </div>
        `;
    }

    const bikeSegLines = bk.segments.map(s => `  • ${s.range_label}km (${s.title})：平路 ${s.flat_watts}W / 爬坡上限 ≤${s.climb_cap_w}W`).join('\n');
    const runSegLines = rn.segments.map(s => `  • ${s.range_label}km (${s.title})：配速 ${s.pace_range}/km (約 ${s.est_time})`).join('\n');

    const lineText = [
        `【🏁 ${course.name} 個人實戰戰術卡】`,
        `🌤️ 當日氣象預估：氣溫 ${course.temp_c}°C / 濕度 ${course.humidity_pct}% / ${course.wind_dir} ${course.wind_speed_kmh}km/h (陣風 ${course.wind_gust_kmh}km/h)`,
        `🎯 中性完賽目標：${neu.mid} (區間 ${neu.range})`,
        `   🏊 游泳 ${neu.splits.swim} ｜ ⏱️ T1 ${neu.splits.t1} ｜ 🚴 單車 ${neu.splits.bike} ｜ ⏱️ T2 ${neu.splits.t2} ｜ 🏃 路跑 ${neu.splits.run}`,
        ``,
        `🏊 【01 游泳配速與浮標 (${sw.target_pace_100m}/100m)】`,
        `  • 口訣：${sw.headline}`,
        `  • 浮標通過：${sw.buoy_splits.map(b => `${b.mark || b.name}=${b.split_time || b.pass_time}`).join(' ｜ ')}`,
        ``,
        `🚴 【02 單車騎法與功率計畫 (AI 依地形切為 ${bk.segments.length} 段｜FTP ${bk.ftp_w}W / 目標 NP ${bk.target_np_w}W / IF ${bk.target_if})】`,
        `  • 分段邏輯：${bk.segmentation_rationale || ''}`,
        bikeSegLines,
        ``,
        `🏃 【03 路跑地形與配速計畫 (AI 依地形切為 ${rn.segments.length} 段｜平路基準 ${rn.flat_base_pace}/km)】`,
        `  • 分段邏輯：${rn.segmentation_rationale || ''}`,
        runSegLines,
        ``,
        `🍌 【04 照時鐘吃：補給與防中暑帳本】`,
        `  • 單車 (${fl.bike_carbs_rate}g/hr)：${fl.bike_summary}`,
        `  • 路跑 (${fl.run_carbs_rate}g/hr)：${fl.run_summary}`,
        `  • 氣象補水與補鈉：每小時 ${fl.water_ml_hr} ml 水分 + ${fl.sodium_mg_hr} mg 鈉（能量膠必配白開水）`
    ].join('\n');

    const preEl = document.getElementById('pbLineCardPre');
    if (preEl) preEl.textContent = lineText;

    // 渲染單車上管戰術貼紙 (Top-Tube Sticker)
    const stickerEl = document.getElementById('pbTopTubeStickerBox');
    if (stickerEl) {
        const segRows = bk.segments.map((s, idx) => `
            <tr>
                <td style="color:#FBBF24;">${s.range_label}k</td>
                <td>${s.title}</td>
                <td style="color:#38BDF8;">${s.flat_watts}W</td>
                <td style="color:#F87171;">≤${s.climb_cap_w}W</td>
                <td style="color:#34D399; font-size:0.74rem;">${idx % 2 === 1 ? '🍌 膠+水' : '💧 飲水+鈉'}</td>
            </tr>
        `).join('');
        stickerEl.innerHTML = `
            <div class="toptube-header">
                <div>
                    <div style="font-size:0.86rem; font-weight:800; color:#FBBF24;">🚴 ${course.name} 上管戰術貼紙</div>
                    <div style="font-size:0.72rem; color:#94A3B8;">目標 NP ${bk.target_np_w}W (IF ${bk.target_if}) ｜ 逆風守 ${bk.headwind_w}W</div>
                </div>
                <div style="text-align:right; font-size:0.74rem; color:#E2E8F0; font-weight:700;">
                    <div>預估騎乘 ${neu.splits.bike}</div>
                    <div style="color:#34D399;">每30分 ${Math.round(fl.bike_carbs_rate / 2)}g碳水 / 每小時 ${fl.water_ml_hr}ml水</div>
                </div>
            </div>
            <table class="toptube-table">
                <thead>
                    <tr>
                        <th>里程</th>
                        <th>階段任務</th>
                        <th>平路瓦數</th>
                        <th>爬坡上限</th>
                        <th>定時補給</th>
                    </tr>
                </thead>
                <tbody>${segRows}</tbody>
            </table>
            <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #334155; display:flex; justify-content:space-between; font-size:0.74rem; color:#CBD5E1;">
                <span>🏃 下車前2k配速：<strong>${rn.segments[0]?.pace_range}/km</strong></span>
                <span>🎯 平路巡航：<strong>${rn.flat_base_pace}/km</strong></span>
                <span>🏁 目標總時：<strong>${neu.mid}</strong></span>
            </div>
        `;
    }
}

function copyLineTacticalCard() {
    const preEl = document.getElementById('pbLineCardPre');
    const btn = document.getElementById('btnCopyLineCard');
    if (!preEl) return;
    navigator.clipboard.writeText(preEl.textContent).then(() => {
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = "✓ 已複製到剪貼簿！可直接貼上 LINE";
            btn.style.background = "#059669";
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.background = "#EA580C";
            }, 2500);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    setDefaultRaceDate();
    analyzeCourseUrl();
});
