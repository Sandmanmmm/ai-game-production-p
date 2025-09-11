Write-Host ""
Write-Host "GameForge SDXL - Vast.ai Deployment Status" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check deployment files
$files = @("main.py", "Dockerfile", "requirements.txt", "docker-compose-vast.yml", "setup-vast.sh")
$ready = $true

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file found" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
        $ready = $false
    }
}

Write-Host ""
if ($ready) {
    Write-Host "STATUS: Ready for Vast.ai deployment!" -ForegroundColor Green
} else {
    Write-Host "STATUS: Missing files - check above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Launch RTX 4090 instance on Vast.ai"
Write-Host "2. SSH to your instance"
Write-Host "3. Run: git clone your-repo"
Write-Host "4. Run: cd GameForge/services/asset-gen"  
Write-Host "5. Run: chmod +x setup-vast.sh"
Write-Host "6. Run: ./setup-vast.sh"
Write-Host ""
