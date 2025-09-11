@echo off
echo.
echo GameForge SDXL - Vast.ai RTX 4090 Connection Helper
echo ==================================================
echo.
echo Your Instance Details:
echo - Instance ID: 25599851
echo - Host: 3483  
echo - GPU: RTX 4090 (24GB VRAM)
echo.

echo Trying common SSH connection formats...
echo.

REM Try different SSH formats
echo 1. Trying: ssh -p 3483 root@ssh.vast.ai
ssh -p 3483 root@ssh.vast.ai "echo 'SSH Format 1 - Success!' && nvidia-smi --query-gpu=name --format=csv,noheader"
if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ Connection successful with: ssh -p 3483 root@ssh.vast.ai
    echo.
    echo To deploy GameForge SDXL, run this on your instance:
    echo curl -sSL https://raw.githubusercontent.com/Sandmanmmm/ai-game-production-p/main/services/asset-gen/quick-deploy-vast.sh -o deploy.sh ^&^& chmod +x deploy.sh ^&^& ./deploy.sh
    echo.
    goto :end
)

echo.
echo 2. Trying: ssh root@ssh3483.vast.ai
ssh root@ssh3483.vast.ai "echo 'SSH Format 2 - Success!' && nvidia-smi --query-gpu=name --format=csv,noheader"
if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ Connection successful with: ssh root@ssh3483.vast.ai
    echo.
    echo To deploy GameForge SDXL, run this on your instance:
    echo curl -sSL https://raw.githubusercontent.com/Sandmanmmm/ai-game-production-p/main/services/asset-gen/quick-deploy-vast.sh -o deploy.sh ^&^& chmod +x deploy.sh ^&^& ./deploy.sh
    echo.
    goto :end
)

echo.
echo 3. Trying: ssh root@3483.ssh.vast.ai  
ssh root@3483.ssh.vast.ai "echo 'SSH Format 3 - Success!' && nvidia-smi --query-gpu=name --format=csv,noheader"
if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ Connection successful with: ssh root@3483.ssh.vast.ai
    echo.
    echo To deploy GameForge SDXL, run this on your instance:
    echo curl -sSL https://raw.githubusercontent.com/Sandmanmmm/ai-game-production-p/main/services/asset-gen/quick-deploy-vast.sh -o deploy.sh ^&^& chmod +x deploy.sh ^&^& ./deploy.sh
    echo.
    goto :end
)

echo.
echo ❌ Could not connect with common SSH formats.
echo.
echo Alternative Options:
echo.
echo 1. Web Terminal (Recommended):
echo    - Go to https://vast.ai/console/instances/
echo    - Find your instance (25599851)
echo    - Click "CONNECT" button
echo    - Run: curl -sSL https://raw.githubusercontent.com/Sandmanmmm/ai-game-production-p/main/services/asset-gen/quick-deploy-vast.sh -o deploy.sh ^&^& chmod +x deploy.sh ^&^& ./deploy.sh
echo.
echo 2. Check Vast.ai Console:
echo    - Look for the exact SSH command in your instance details
echo    - Copy the SSH command provided by Vast.ai
echo.
echo 3. Manual Connection:
echo    - Instance might still be starting up
echo    - Wait 1-2 minutes and try again
echo.

:end
echo.
echo 💡 Once connected, your RTX 4090 will be ready for GameForge SDXL development!
echo    Cost: ~$0.20-0.40/hour vs $1.00/hour on AWS
echo.
pause
