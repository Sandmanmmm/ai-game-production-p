# Redis Installation and Setup Guide for Windows

## Option 1: Using Docker (Recommended)

### Prerequisites
- Docker Desktop installed on Windows

### Quick Start
```powershell
# Start Redis using Docker
docker run --name gameforge-redis -p 6379:6379 -d redis:latest

# Verify Redis is running
docker ps | findstr redis

# Connect to Redis CLI (optional)
docker exec -it gameforge-redis redis-cli
```

### Stop Redis
```powershell
docker stop gameforge-redis
docker rm gameforge-redis
```

## Option 2: Using WSL2 (Windows Subsystem for Linux)

### Prerequisites
- WSL2 installed on Windows

### Installation Steps
```bash
# In WSL2 terminal
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Verify Redis is running
redis-cli ping
# Should return: PONG

# Set Redis to start automatically
sudo systemctl enable redis-server
```

## Option 3: Windows Native (Using Chocolatey)

### Prerequisites
- Chocolatey package manager installed

### Installation Steps
```powershell
# Install Redis using Chocolatey
choco install redis-64

# Start Redis service
redis-server

# Or start as Windows service
net start redis
```

## Option 4: Manual Windows Installation

### Download and Install
1. Download Redis for Windows from: https://github.com/tporadowski/redis/releases
2. Extract the ZIP file to `C:\Redis`
3. Add `C:\Redis` to your PATH environment variable

### Start Redis
```powershell
# Navigate to Redis directory
cd C:\Redis

# Start Redis server
redis-server.exe

# In another terminal, test connection
redis-cli.exe ping
# Should return: PONG
```

## Testing Redis Connection

Once Redis is running, test with our GameForge backend:

```powershell
# In the backend directory
npm run dev
```

You should see:
```
✅ Redis connected successfully
🚀 Redis is ready to accept commands
✅ Job queues initialized successfully
⚡ Redis & Job Queue: Initialized
```

## Redis Configuration for GameForge

Redis is configured via environment variables in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
```

## Production Considerations

For production deployment:
- Use Redis Cluster or Redis Sentinel for high availability
- Set up proper authentication (`REDIS_PASSWORD`)
- Configure persistence with AOF and RDB
- Monitor Redis memory usage and performance
- Set up Redis backups

## Troubleshooting

### Connection Issues
1. Check if Redis is running: `redis-cli ping`
2. Verify port 6379 is not blocked by firewall
3. Check Redis logs for errors

### Memory Issues
- Monitor Redis memory usage: `redis-cli info memory`
- Configure `maxmemory` and `maxmemory-policy` in Redis config

### Performance Issues
- Use Redis Insights or redis-cli MONITOR for debugging
- Check for slow queries with `redis-cli --latency`
