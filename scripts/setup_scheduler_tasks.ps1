# Script to set up Windows Task Scheduler tasks for TrainingPeaks Automation
$ErrorActionPreference = "Stop"

$root = "C:\Users\User\Desktop\TP"
$mondayScript = Join-Path $root "scripts\run_weekly_strength.ps1"
$sundayScript = Join-Path $root "scripts\run_sunday_report.ps1"

# 1. Monday Task: Weekly on Monday at 9:00 AM
$mondayAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$mondayScript`""
$mondayTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9:00AM
$mondaySettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "TP_Monday_Schedule_Fetch" -Action $mondayAction -Trigger $mondayTrigger -Settings $mondaySettings -Description "Weekly TrainingPeaks Schedule Fetch, Strength Plan Generation, and Article Translation" -Force

# 2. Sunday Task: Weekly on Sunday at 8:00 PM
$sundayAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$sundayScript`""
$sundayTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 8:00PM
$sundaySettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "TP_Sunday_Execution_Report" -Action $sundayAction -Trigger $sundayTrigger -Settings $sundaySettings -Description "Weekly TrainingPeaks Execution and Completion Rate Report" -Force

Write-Output "Successfully scheduled Task Scheduler tasks:"
Write-Output " - [TP_Monday_Schedule_Fetch] runs every Monday at 9:00 AM"
Write-Output " - [TP_Sunday_Execution_Report] runs every Sunday at 8:00 PM"
