$ErrorActionPreference = "Stop"
$root = "C:\Users\User\Desktop\TP"
Set-Location $root

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir "weekly_strength.log"

try {
    Write-Output "1. Generating weekly strength plan and analysis..."
    python scripts/tp_weekly_strength.py

    Write-Output "2. Fetching weekly articles and translating to Traditional Chinese..."
    python scripts/fetch_weekly_articles.py

    Write-Output "3. Generating web dashboard..."
    python scripts/generate_web_dashboard.py

    Write-Output "4. Packaging outputs for deployment..."
    python scripts/package_for_web.py

    if (Test-Path "$root\.git") {
        Write-Output "5. Pushing updates to GitHub..."
        git add docs/ outputs/ logs/ data/ scripts/ PROJECT_STATUS.md README.md
        git commit -m "Auto update weekly strength plan and articles"
        git push origin main
        Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') GIT_PUSH OK Site updated live on GitHub Pages"
    }
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') MONDAY_SCRIPT OK"
} catch {
    Add-Content -Encoding UTF8 -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') MONDAY_SCRIPT ERROR $($_.Exception.Message)"
    throw
}
