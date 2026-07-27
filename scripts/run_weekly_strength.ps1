$ErrorActionPreference = "Stop"
$root = "C:\Users\User\Desktop\TP"
$python = "C:\Users\User\AppData\Local\Programs\Python\Python311\python.exe"
$tpScript = Join-Path $root "scripts\tp_weekly_strength.py"
$artScript = Join-Path $root "scripts\fetch_weekly_articles.py"
$logDir = Join-Path $root "logs"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir "weekly_strength.log"

try {
    # 1. 執行 TrainingPeaks 週分析與肌力課表產出
    $result1 = & $python $tpScript 2>&1
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) TP_ANALYSIS OK $result1"
    
    # 3. 自動更新地端網頁版儀表板與打包 (docs/index.html)
    $dashScript = Join-Path $root "scripts\generate_web_dashboard.py"
    $result3 = & $python $dashScript 2>&1
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) DASHBOARD_GEN OK $result3"

    $pkgScript = Join-Path $root "scripts\package_for_web.py"
    $result4 = & $python $pkgScript 2>&1
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) PKG_WEB OK $result4"

    # 4. 自動同步推送到 GitHub，達成線上網站 100% 全自動更新
    if (Test-Path "$root\.git") {
        git -C $root add docs/ outputs/ logs/ data/ raw/ 2>&1 | Out-Null
        git -C $root commit -m "Auto update weekly reports and 52-week dashboard" 2>&1 | Out-Null
        git -C $root push origin main 2>&1 | Out-Null
        Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) GIT_PUSH OK Site updated live on GitHub Pages"
    }
} catch {
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) ERROR $($_.Exception.Message)"
    throw
}
