Write-Host ""
Write-Host "GameForge SDXL - Vast.ai Status Check" -ForegroundColor Green
Write-Host ""

# Check key files
if (Test-Path "main.py") {
    Write-Host "✓ main.py found" -ForegroundColor Green
} else {
    Write-Host "✗ main.py missing" -ForegroundColor Red
}

if (Test-Path "Dockerfile") {
    Write-Host "✓ Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "✗ Dockerfile missing" -ForegroundColor Red
}

if (Test-Path "requirements.txt") {
    Write-Host "✓ requirements.txt found" -ForegroundColor Green
} else {
    Write-Host "✗ requirements.txt missing" -ForegroundColor Red
}

if (Test-Path "docker-compose-vast.yml") {
    Write-Host "✓ docker-compose-vast.yml found" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose-vast.yml missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "Vast.ai Deployment Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Launch RTX 4090 on Vast.ai"
Write-Host "2. SSH to your instance" 
Write-Host "3. Clone repository"
Write-Host "4. Run setup script"
Write-Host ""
