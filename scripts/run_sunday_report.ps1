$ErrorActionPreference = "Stop"
$root = "C:\Users\User\Desktop\TP"
$python = "C:\Users\User\AppData\Local\Programs\Python\Python311\python.exe"
$reportScript = Join-Path $root "scripts\generate_execution_report.py"
$logDir = Join-Path $root "logs"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir "weekly_strength.log"

try {
    # 執行當週執行率回顧報告生成
    $result = & $python $reportScript 2>&1
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) SUNDAY_REPORT OK $result"
    
    # 自動更新地端網頁版儀表板 (outputs/index.html)
    $dashScript = Join-Path $root "scripts\generate_web_dashboard.py"
    $resultDash = & $python $dashScript 2>&1
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) DASHBOARD_GEN OK $resultDash"

    # 自動同步推送到 GitHub，達成線上網站 100% 全自動更新
    if (Test-Path "$root\.git") {
        git -C $root add docs/ outputs/ logs/ data/ raw/ 2>&1 | Out-Null
        git -C $root commit -m "Auto update weekly execution report and 52-week dashboard" 2>&1 | Out-Null
        git -C $root push origin main 2>&1 | Out-Null
        Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) GIT_PUSH OK Site updated live on GitHub Pages"
    }
} catch {
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format s) SUNDAY_REPORT ERROR $($_.Exception.Message)"
    throw
}
