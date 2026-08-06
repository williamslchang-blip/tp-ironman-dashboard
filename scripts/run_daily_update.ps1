$ErrorActionPreference = "Continue"
$root = "C:\Users\User\Desktop\TP"
Set-Location $root

Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting Daily 8:00 PM Website Update..."

# 1. Run Python daily update
python scripts/daily_update.py

# 2. Git Commit & Push to GitHub Pages
git add .
$status = git status --porcelain
if ($status) {
    $commitMsg = "Auto Daily 8:00 PM Dashboard Update [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]"
    git commit -m $commitMsg
    git push origin main
} else {
    Write-Output "No changes to commit for daily update."
}

Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Daily 8:00 PM Update Completed and Pushed to GitHub Pages!"
