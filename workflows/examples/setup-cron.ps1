# PowerShell script to setup scheduled tasks on Windows
# Run this script in PowerShell as Administrator

$projectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Create scheduled tasks using Task Scheduler

# Daily CI/CD workflow at 2 AM
$action = New-ScheduledTaskAction -Execute "npm" -Argument "run workflow:run workflows/definitions/ci-cd-workflow.json" -WorkingDirectory $projectDir
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "AIDevelo-CICD-Workflow" -Action $action -Trigger $trigger -Settings $settings -Description "Daily CI/CD workflow execution"

# Health checks every 6 hours
$action2 = New-ScheduledTaskAction -Execute "npm" -Argument "run workflow:run workflows/definitions/scheduled-tasks.json" -WorkingDirectory $projectDir
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName "AIDevelo-Health-Checks" -Action $action2 -Trigger $trigger2 -Settings $settings -Description "Health check workflow every 6 hours"

Write-Host "Scheduled tasks created successfully!"
Write-Host "View tasks with: Get-ScheduledTask | Where-Object {$_.TaskName -like 'AIDevelo-*'}"

