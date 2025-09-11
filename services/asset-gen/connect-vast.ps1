# GameForge SDXL - Connect to Vast.ai Instance 25599851
# PowerShell script to connect and deploy

Write-Host ""
Write-Host "GameForge SDXL - Vast.ai Instance 25599851" -ForegroundColor Green
Write-Host "RTX 4090 (24GB VRAM) Deployment" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Instance details
Write-Host "Instance Details:" -ForegroundColor Cyan
Write-Host "• Instance ID: 25599851"
Write-Host "• Host: 3483"
Write-Host "• GPU: RTX 4090 (24GB VRAM)"
Write-Host "• Storage: 32GB available"
Write-Host "• SSH: ssh -p 3483 root@ssh3.vast.ai"
Write-Host ""

# Check if SSH is available
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "SSH not found. Please install OpenSSH or use PuTTY" -ForegroundColor Red
    Write-Host "Alternative: Use Vast.ai web terminal" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deployment Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connect via SSH:" -ForegroundColor White
Write-Host "   ssh -p 3483 root@ssh3.vast.ai" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy deployment files to upload:" -ForegroundColor White
Write-Host "   - quick-deploy.sh (automated setup)"
Write-Host "   - docker-compose-vast.yml"
Write-Host "   - config-vast.py"
Write-Host ""
Write-Host "3. Or run manual commands:" -ForegroundColor White
Write-Host "   git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge"
Write-Host "   cd GameForge/services/asset-gen"
Write-Host "   chmod +x quick-deploy.sh"
Write-Host "   ./quick-deploy.sh"
Write-Host ""

# Ask user what they want to do
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Connect via SSH now"
Write-Host "2. Show deployment commands"
Write-Host "3. Exit"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Connecting to Vast.ai instance..." -ForegroundColor Green
        ssh -p 3483 root@ssh3.vast.ai
    }
    "2" {
        Write-Host ""
        Write-Host "Manual Deployment Commands:" -ForegroundColor Green
        Write-Host "=========================" -ForegroundColor Green
        Write-Host ""
        Write-Host "# 1. Connect to your instance"
        Write-Host "ssh -p 3483 root@ssh3.vast.ai"
        Write-Host ""
        Write-Host "# 2. Update system"
        Write-Host "apt-get update && apt-get upgrade -y"
        Write-Host ""
        Write-Host "# 3. Clone repository"
        Write-Host "git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge"
        Write-Host "cd GameForge/services/asset-gen"
        Write-Host ""
        Write-Host "# 4. Deploy service"
        Write-Host "chmod +x quick-deploy.sh"
        Write-Host "./quick-deploy.sh"
        Write-Host ""
        Write-Host "# 5. Test service"
        Write-Host "curl http://localhost:8000/health"
        Write-Host ""
    }
    "3" {
        Write-Host "Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Happy developing with your RTX 4090!" -ForegroundColor Green
Write-Host ""
