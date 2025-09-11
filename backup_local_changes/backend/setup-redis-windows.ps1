# Redis Setup for Windows - GameForge Backend

Write-Host "Setting up Redis for GameForge Backend..." -ForegroundColor Green

# Create Redis directory
$redisDir = "C:\Users\ya754\GameForge\ai-game-production-p\backend\redis"
if (!(Test-Path $redisDir)) {
    New-Item -ItemType Directory -Path $redisDir -Force
    Write-Host "Created Redis directory: $redisDir" -ForegroundColor Yellow
}

# Download Redis for Windows (Microsoft's port)
$redisUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip"
$redisZip = "$redisDir\redis.zip"
$extractPath = "$redisDir\redis-server"

if (!(Test-Path "$extractPath\redis-server.exe")) {
    Write-Host "Downloading Redis for Windows..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip
        
        # Extract Redis
        Expand-Archive -Path $redisZip -DestinationPath $extractPath -Force
        Remove-Item $redisZip
        
        Write-Host "Redis downloaded and extracted successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download Redis. Error: $_" -ForegroundColor Red
        Write-Host "Please install Redis manually from: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
        exit 1
    }
}

# Create Redis configuration
$redisConf = @"
# Redis Configuration for GameForge
port 6379
bind 127.0.0.1
dir $extractPath
dbfilename dump.rdb
save 900 1
save 300 10
save 60 10000
maxmemory 256mb
maxmemory-policy allkeys-lru
"@

$redisConf | Out-File -FilePath "$extractPath\redis.conf" -Encoding UTF8

# Create start script
$startScript = @"
@echo off
echo Starting Redis for GameForge...
cd /d "$extractPath"
redis-server.exe redis.conf
"@

$startScript | Out-File -FilePath "$redisDir\start-redis.bat" -Encoding ASCII

Write-Host "Redis setup complete!" -ForegroundColor Green
Write-Host "To start Redis, run: $redisDir\start-redis.bat" -ForegroundColor Cyan
Write-Host "Or use: npm run start:redis" -ForegroundColor Cyan
