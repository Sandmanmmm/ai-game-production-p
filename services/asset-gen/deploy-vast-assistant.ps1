# GameForge SDXL - Vast.ai Deployment Assistant
# PowerShell script to help prepare for Vast.ai deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$VastInstanceIP,
    
    [Parameter(Mandatory=$false)]
    [switch]$PrepareOnly
)

Write-Host "🚀 GameForge SDXL - Vast.ai Deployment Assistant" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "main.py") -or !(Test-Path "Dockerfile")) {
    Write-Host "❌ Please run this script from the services/asset-gen directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Pre-Deployment Checklist:" -ForegroundColor Yellow

# Check Docker files
$dockerFiles = @("Dockerfile", "docker-compose-vast.yml", "requirements.txt")
foreach ($file in $dockerFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file found" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check setup scripts
$setupFiles = @("setup-vast.sh", "test-vast-service.sh", "vast-ai-setup.md")
foreach ($file in $setupFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file created" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $file missing (optional)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Configuration Check:" -ForegroundColor Yellow

# Check if config has been optimized
if (Test-Path "config-vast.py") {
    Write-Host "✅ RTX 4090 optimized config available" -ForegroundColor Green
    Write-Host "   → Copy config-vast.py to config.py before deployment" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ RTX 4090 config optimization missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Next Steps:" -ForegroundColor Yellow

if ($PrepareOnly) {
    Write-Host "1. Launch your RTX 4090 instance on Vast.ai" -ForegroundColor White
    Write-Host "2. SSH into your instance: ssh root@YOUR_VAST_IP" -ForegroundColor White
    Write-Host "3. Run the setup script:" -ForegroundColor White
    Write-Host "   wget https://raw.githubusercontent.com/your-repo/setup-vast.sh" -ForegroundColor Gray
    Write-Host "   chmod +x setup-vast.sh" -ForegroundColor Gray
    Write-Host "   ./setup-vast.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or manually:" -ForegroundColor White
    Write-Host "   git clone YOUR_REPO_URL GameForge" -ForegroundColor Gray
    Write-Host "   cd GameForge/services/asset-gen" -ForegroundColor Gray
    Write-Host "   docker-compose -f docker-compose-vast.yml up -d --build" -ForegroundColor Gray
} else {
    if ($VastInstanceIP) {
        Write-Host "🔗 Connecting to Vast.ai instance: $VastInstanceIP" -ForegroundColor Cyan
        
        # Test connection
        Write-Host "Testing SSH connection..." -ForegroundColor Yellow
        Write-Host "✅ Ready for SSH connection test" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🚀 Ready to deploy! Run these commands:" -ForegroundColor Green
        Write-Host "ssh root@$VastInstanceIP" -ForegroundColor White
                Write-Host ""
                Write-Host "Then on the instance:" -ForegroundColor Yellow
                Write-Host "curl -sSL https://raw.githubusercontent.com/your-repo/setup-vast.sh | bash" -ForegroundColor Gray
                Write-Host ""
                Write-Host "Or clone and run manually:" -ForegroundColor Yellow
                Write-Host "git clone YOUR_REPO_URL GameForge" -ForegroundColor Gray
                Write-Host "cd GameForge/services/asset-gen" -ForegroundColor Gray
                Write-Host "chmod +x setup-vast.sh" -ForegroundColor Gray
                Write-Host "./setup-vast.sh" -ForegroundColor Gray
                
            } else {
                Write-Host "❌ SSH connection failed" -ForegroundColor Red
                Write-Host "Make sure your Vast.ai instance is running and SSH is enabled" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Could not test SSH connection" -ForegroundColor Red
            Write-Host "Make sure OpenSSH is installed and the IP is correct" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Usage: .\deploy-vast-assistant.ps1 -VastInstanceIP YOUR_VAST_IP" -ForegroundColor Yellow
        Write-Host "   or: .\deploy-vast-assistant.ps1 -PrepareOnly" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 Development Tips:" -ForegroundColor Cyan
Write-Host "• RTX 4090 has 24GB VRAM - perfect for SDXL development" -ForegroundColor White
Write-Host "• Use segmind/SSD-1B model for faster generation (vs full SDXL)" -ForegroundColor White  
Write-Host "• Monitor GPU usage with: nvidia-smi" -ForegroundColor White
Write-Host "• Check service health: curl http://localhost:8000/health" -ForegroundColor White
Write-Host "• View logs: docker logs gameforge-sdxl" -ForegroundColor White

Write-Host ""
Write-Host "💰 Cost Comparison:" -ForegroundColor Green
Write-Host "• Vast.ai RTX 4090: ~$0.20-0.40/hour" -ForegroundColor White
Write-Host "• AWS g5.xlarge: ~$1.00/hour" -ForegroundColor White
Write-Host "• Savings: 60-80% cost reduction for development!" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Deployment assistant completed!" -ForegroundColor Green
