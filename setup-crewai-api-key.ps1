# Quick script to help set up CrewAI API Key
# Run this script: .\setup-crewai-api-key.ps1

Write-Host "=== CrewAI API Key Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path ".env" -ItemType File | Out-Null
}

# Read current .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue -Raw

# Check if API key is already set (and not placeholder)
if ($envContent -match "OPENAI_API_KEY=sk-[a-zA-Z0-9]+") {
    Write-Host "✓ OpenAI API key is already configured!" -ForegroundColor Green
    $currentKey = ($envContent | Select-String -Pattern "OPENAI_API_KEY=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    Write-Host "  Current key: $($currentKey.Substring(0, [Math]::Min(20, $currentKey.Length)))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "To change it, edit .env file manually." -ForegroundColor Yellow
} else {
    Write-Host "⚠ API key not set or using placeholder" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set your API key:" -ForegroundColor Cyan
    Write-Host "1. Get your key from: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "2. Edit the .env file and replace 'your_openai_api_key_here' with your actual key" -ForegroundColor White
    Write-Host "3. Run this script again to restart the service" -ForegroundColor White
    Write-Host ""
    Write-Host "File location: $(Resolve-Path '.env')" -ForegroundColor Gray
}

Write-Host ""
$restart = Read-Host "Do you want to restart the CrewAI service now? (y/n)"

if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host ""
    Write-Host "Restarting CrewAI service..." -ForegroundColor Cyan
    docker-compose restart crewai-service
    
    Write-Host ""
    Write-Host "Waiting for service to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "Testing service health..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8004/health" -UseBasicParsing -ErrorAction Stop
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✓ Service is healthy!" -ForegroundColor Green
        Write-Host "  Status: $($health.status)" -ForegroundColor Gray
        Write-Host "  Provider: $($health.llm_provider)" -ForegroundColor Gray
        Write-Host "  Model: $($health.llm_model)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Service health check failed: $_" -ForegroundColor Red
        Write-Host "  Check logs with: docker-compose logs crewai-service" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "To restart manually, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose restart crewai-service" -ForegroundColor White
}

Write-Host ""
Write-Host "Done! ✓" -ForegroundColor Green
