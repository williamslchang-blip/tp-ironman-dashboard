$ErrorActionPreference = "Stop"
$root = "C:\Users\User\Desktop\TP"
Set-Location $root

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir "weekly_strength.log"

try {
    Write-Output "1. Generating weekly execution report..."
    python scripts/generate_execution_report.py

    Write-Output "2. Generating web dashboard..."
    python scripts/generate_web_dashboard.py

    Write-Output "3. Packaging outputs for deployment..."
    python scripts/package_for_web.py

    if (Test-Path "$root\.git") {
        Write-Output "4. Pushing updates to GitHub..."
        git add docs/ outputs/ logs/ data/ scripts/ PROJECT_STATUS.md README.md
        git commit -m "Auto update weekly execution report and 52-week dashboard"
        git push origin main
        Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') GIT_PUSH OK Site updated live on GitHub Pages"
    }
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') SUNDAY_REPORT OK"
} catch {
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') SUNDAY_REPORT ERROR $($_.Exception.Message)"
    throw
}
