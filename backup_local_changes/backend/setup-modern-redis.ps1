# Updated Redis Setup for Windows - GameForge Backend (Redis 6.0+ compatible)

Write-Host "Setting up modern Redis for GameForge Backend..." -ForegroundColor Green

# Create Redis directory
$redisDir = "C:\Users\ya754\GameForge\ai-game-production-p\backend\redis-new"
if (!(Test-Path $redisDir)) {
    New-Item -ItemType Directory -Path $redisDir -Force
    Write-Host "Created Redis directory: $redisDir" -ForegroundColor Yellow
}

# Download Memurai Community (Redis 6.0 compatible)
$redisUrl = "https://github.com/memurai/memurai/releases/download/v2.1.2/Memurai-v2.1.2.zip"
$redisZip = "$redisDir\memurai.zip"
$extractPath = "$redisDir\memurai"

if (!(Test-Path "$extractPath\memurai.exe")) {
    Write-Host "Downloading Memurai (modern Redis for Windows)..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip -UseBasicParsing
        
        # Extract Redis
        Expand-Archive -Path $redisZip -DestinationPath $extractPath -Force
        Remove-Item $redisZip
        
        Write-Host "Memurai downloaded and extracted successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download Memurai. Error: $_" -ForegroundColor Red
        Write-Host "Please install Redis manually or use WSL2 with Redis" -ForegroundColor Yellow
        
        # Try alternative - just use node redis mock
        Write-Host "Setting up fallback mode without Redis queues..." -ForegroundColor Yellow
        $fallbackEnv = @"
# Fallback environment - no Redis required
NODE_ENV=development
REDIS_ENABLED=false
PORT=3001
"@
        $fallbackEnv | Out-File -FilePath "..\\.env.fallback" -Encoding UTF8
        Write-Host "Created fallback configuration. Backend will run without job queues." -ForegroundColor Cyan
        exit 0
    }
}

# Create start script for Memurai
$startScript = @"
@echo off
echo Starting Memurai (Redis 6.0+ compatible) for GameForge...
cd /d "$extractPath"
memurai.exe --port 6379
"@

$startScript | Out-File -FilePath "$redisDir\start-memurai.bat" -Encoding ASCII

Write-Host "Memurai setup complete!" -ForegroundColor Green
Write-Host "To start Redis, run: $redisDir\start-memurai.bat" -ForegroundColor Cyan
