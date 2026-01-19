# Ralph Status Script (PowerShell)
# Displays current Ralph session status

param(
    [string]$SessionFile = ".ralph_session",
    [ValidateSet("text", "json")]
    [string]$OutputFormat = "text"
)

if (-not (Test-Path $SessionFile)) {
    if ($OutputFormat -eq "json") {
        @{
            error = "No active session found"
            session_file = $SessionFile
        } | ConvertTo-Json
    } else {
        Write-Host "No active Ralph session found." -ForegroundColor Yellow
        Write-Host "Session file: $SessionFile"
        Write-Host ""
        Write-Host "To start a session, use the autonomous-loop skill in Cursor."
    }
    exit 1
}

# Parse session file
try {
    $session = Get-Content $SessionFile | ConvertFrom-Json
} catch {
    Write-Host "Error: Unable to parse session file" -ForegroundColor Red
    exit 1
}

$loopCount = $session.loop_count ?? 0
$apiCalls = $session.api_calls ?? 0
$startTime = $session.start_time ?? "unknown"
$lastActivity = $session.last_activity ?? "unknown"
$circuitBreaker = $session.circuit_breaker ?? "closed"
$failures = $session.failures ?? 0
$exitSignal = $session.exit_signal ?? $false
$currentTask = $session.current_task ?? "none"
$completedTasks = $session.completed_tasks ?? @()
$rateLimitCalls = $session.rate_limit.calls_this_hour ?? 0
$rateLimitMax = $session.rate_limit.max_per_hour ?? 100

# Calculate runtime
$runtime = $null
if ($startTime -ne "unknown") {
    try {
        $startDate = [DateTime]::Parse($startTime)
        $runtime = (Get-Date) - $startDate
        $runtimeHours = [Math]::Floor($runtime.TotalHours)
        $runtimeMins = [Math]::Floor($runtime.TotalMinutes % 60)
    } catch {
        $runtimeHours = 0
        $runtimeMins = 0
    }
}

if ($OutputFormat -eq "json") {
    # JSON output
    $status = @{
        loop_count = $loopCount
        api_calls = $apiCalls
        start_time = $startTime
        last_activity = $lastActivity
        circuit_breaker = $circuitBreaker
        failures = $failures
        exit_signal = $exitSignal
        current_task = $currentTask
        rate_limit = @{
            calls_this_hour = $rateLimitCalls
            max_per_hour = $rateLimitMax
            remaining = $rateLimitMax - $rateLimitCalls
        }
    }
    
    if ($runtime) {
        $status.runtime = @{
            hours = $runtimeHours
            minutes = $runtimeMins
        }
    }
    
    $status | ConvertTo-Json -Depth 10
} else {
    # Text output
    Write-Host "Ralph Session Status" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Session File: $SessionFile"
    Write-Host ""
    Write-Host "Loop Count: $loopCount"
    Write-Host "API Calls: $apiCalls"
    Write-Host "Start Time: $startTime"
    Write-Host "Last Activity: $lastActivity"
    if ($runtime) {
        Write-Host "Runtime: ${runtimeHours}h ${runtimeMins}m"
    }
    Write-Host ""
    Write-Host "Circuit Breaker: $circuitBreaker"
    Write-Host "Failures: $failures"
    Write-Host "Exit Signal: $exitSignal"
    Write-Host ""
    Write-Host "Current Task: $currentTask"
    Write-Host ""
    Write-Host "Rate Limit: $rateLimitCalls / $rateLimitMax calls per hour"
    Write-Host "Remaining: $($rateLimitMax - $rateLimitCalls) calls"
    Write-Host ""
    
    if ($completedTasks.Count -gt 0) {
        Write-Host "Completed Tasks:" -ForegroundColor Green
        foreach ($task in $completedTasks) {
            Write-Host "  - $task"
        }
        Write-Host ""
    }
    
    # Check log file
    if (Test-Path "logs\ralph.log") {
        Write-Host "Recent Log Entries (last 5):" -ForegroundColor Yellow
        Get-Content "logs\ralph.log" -Tail 5 | ForEach-Object { Write-Host "  $_" }
    }
}
