# GameForge SDXL - Vast.ai Deployment Checker
# Simple PowerShell script to check deployment readiness

param(
    [string]$VastInstanceIP
)

Write-Host ""
Write-Host "🚀 GameForge SDXL - Vast.ai Deployment Checker" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "main.py") -or !(Test-Path "Dockerfile")) {
    Write-Host "❌ Please run this script from the services/asset-gen directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Deployment Readiness Check:" -ForegroundColor Yellow
Write-Host ""

# Check essential files
$files = @{
    "main.py" = "FastAPI service entry point"
    "Dockerfile" = "Container definition"
    "requirements.txt" = "Python dependencies"
    "docker-compose-vast.yml" = "Vast.ai Docker Compose"
    "setup-vast.sh" = "Automated setup script"
    "vast-ai-setup.md" = "Deployment guide"
    "config-vast.py" = "RTX 4090 optimized config"
}

$allGood = $true
foreach ($file in $files.GetEnumerator()) {
    if (Test-Path $file.Key) {
        Write-Host "✅ $($file.Key) - $($file.Value)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($file.Key) - $($file.Value)" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "✅ All files ready for Vast.ai deployment!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some files are missing - check above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Deployment Instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Launch RTX 4090 instance on Vast.ai" -ForegroundColor White
Write-Host "2. SSH into your instance:" -ForegroundColor White
if ($VastInstanceIP) {
    Write-Host "   ssh root@$VastInstanceIP" -ForegroundColor Gray
} else {
    Write-Host "   ssh root@YOUR_VAST_IP" -ForegroundColor Gray
}
Write-Host ""
Write-Host "3. Clone your repository:" -ForegroundColor White
Write-Host "   git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge" -ForegroundColor Gray
Write-Host "   cd GameForge/services/asset-gen" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run the setup script:" -ForegroundColor White
Write-Host "   chmod +x setup-vast.sh" -ForegroundColor Gray
Write-Host "   ./setup-vast.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Test the service:" -ForegroundColor White
Write-Host "   ./test-vast-service.sh" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 RTX 4090 Advantages:" -ForegroundColor Green
Write-Host "• 24GB VRAM - Perfect for SDXL development" -ForegroundColor White
Write-Host "• 60-80% cost savings vs AWS" -ForegroundColor White
Write-Host "• Fast iteration for model testing" -ForegroundColor White
Write-Host "• No AWS quotas or limits" -ForegroundColor White

Write-Host ""
Write-Host "🔧 After Deployment:" -ForegroundColor Yellow
Write-Host "• Health check: curl http://YOUR_VAST_IP:8000/health" -ForegroundColor White
Write-Host "• API docs: http://YOUR_VAST_IP:8000/docs" -ForegroundColor White
Write-Host "• Monitor GPU: nvidia-smi" -ForegroundColor White
Write-Host "• View logs: docker logs gameforge-sdxl" -ForegroundColor White

Write-Host ""
Write-Host "Ready for Vast.ai deployment!" -ForegroundColor Green
Write-Host ""
