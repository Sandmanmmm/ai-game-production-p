@echo off
REM GameForge Production Deployment Script for Windows

echo Starting GameForge Production Deployment...

REM Check for required files
if not exist ".env.production" (
    echo Error: .env.production file not found!
    echo Please copy .env.production.template to .env.production and configure it.
    exit /b 1
)

REM Pull latest images
echo Pulling latest Docker images...
docker-compose -f docker-compose.production-secure.yml pull

REM Build custom images
echo Building GameForge images...
docker-compose -f docker-compose.production-secure.yml build

REM Start services
echo Starting services...
docker-compose -f docker-compose.production-secure.yml up -d

REM Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check service health
echo Checking service health...
docker-compose -f docker-compose.production-secure.yml ps

echo Deployment completed successfully!
echo Services available at:
echo   - API: http://localhost/api/v1/
echo   - Grafana: http://localhost:3000/
echo   - Prometheus: http://localhost:9090/
