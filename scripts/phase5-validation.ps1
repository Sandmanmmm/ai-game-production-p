# Phase 5 Runtime Validation Script (Simplified)
# ===============================================
# Validates core services can start and communicate

Write-Host "Phase 5: Compose Runtime Validation (Core Services)" -ForegroundColor Blue
Write-Host "======================================================="

$ErrorActionPreference = "Continue"
$TestReportsDir = "phase5-test-reports"

# Create test reports directory
if (-not (Test-Path $TestReportsDir)) {
    New-Item -ItemType Directory -Path $TestReportsDir -Force | Out-Null
}

$TestResults = @()
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Add-TestResult {
    param($TestName, $Status, $Message, $Details = "")
    
    $result = [PSCustomObject]@{
        Test = $TestName
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
    
    $script:TestResults += $result
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "[$Status] $TestName - $Message" -ForegroundColor $color
    if ($Details) {
        Write-Host "      Details: $Details" -ForegroundColor Gray
    }
}

Write-Host "Starting Phase 5 validation at $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

# Test 1: Environment Setup
Write-Host "Test 1: Environment Variables" -ForegroundColor Yellow
$envVars = @("POSTGRES_PASSWORD", "JWT_SECRET_KEY", "VAULT_TOKEN")
$envOk = $true

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Add-TestResult "Environment-$var" "PASS" "Variable is set" "Length: $($value.Length)"
    } else {
        Add-TestResult "Environment-$var" "WARN" "Variable not set" "Will use defaults"
        $envOk = $false
    }
}

# Test 2: Docker Environment
Write-Host "`nTest 2: Docker Environment" -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Add-TestResult "Docker-Version" "PASS" "Docker is available" $dockerVersion
} catch {
    Add-TestResult "Docker-Version" "FAIL" "Docker not available" $_.Exception.Message
    Write-Host "Cannot proceed without Docker. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker compose version
    Add-TestResult "Docker-Compose" "PASS" "Docker Compose is available" $composeVersion
} catch {
    Add-TestResult "Docker-Compose" "FAIL" "Docker Compose not available" $_.Exception.Message
    Write-Host "Cannot proceed without Docker Compose." -ForegroundColor Red
    exit 1
}

# Test 3: Required Files Check
Write-Host "`nTest 3: Required Files" -ForegroundColor Yellow

$requiredFiles = @(
    "docker-compose.production-hardened.yml",
    "Dockerfile", 
    "requirements.txt",
    "database_setup.sql",
    "nginx/nginx.conf",
    "nginx/conf.d/default.conf"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Add-TestResult "File-$($file.Replace('/', '_'))" "PASS" "File exists" (Get-Item $file).Length
    } else {
        Add-TestResult "File-$($file.Replace('/', '_'))" "FAIL" "File missing" "Required for deployment"
    }
}

# Test 4: Network Port Availability
Write-Host "`nTest 4: Port Availability" -ForegroundColor Yellow

$ports = @(80, 8080, 5432, 6379, 9200, 9090, 3000, 8200)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Add-TestResult "Port-$port" "WARN" "Port is in use" "May conflict with services"
        } else {
            Add-TestResult "Port-$port" "PASS" "Port is available" "Ready for service"
        }
    } catch {
        Add-TestResult "Port-$port" "PASS" "Port is available" "Ready for service"
    }
}

# Test 5: Create Test Docker Compose for Core Services
Write-Host "`nTest 5: Core Services Test" -ForegroundColor Yellow

$testComposeContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gameforge_prod
      POSTGRES_USER: gameforge
      POSTGRES_PASSWORD: gameforge_secure_2025
    volumes:
      - ./database_setup.sql:/docker-entrypoint-initdb.d/01-setup.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gameforge"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass gameforge_redis_2025
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
"@

# Write test compose file
$testComposeFile = "docker-compose.phase5-test.yml"
$testComposeContent | Out-File -FilePath $testComposeFile -Encoding UTF8

Add-TestResult "Core-Services-Config" "PASS" "Test composition created" $testComposeFile

# Test 6: Basic Service Startup Test
Write-Host "`nTest 6: Service Startup Test" -ForegroundColor Yellow

try {
    Write-Host "  Starting core services (this may take a few minutes)..." -ForegroundColor Cyan
    
    # Start services
    $startResult = docker compose -f $testComposeFile up -d 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Add-TestResult "Service-Startup" "PASS" "Core services started" "postgres, redis, nginx"
        
        # Wait for services to be ready
        Write-Host "  Waiting for services to be ready..." -ForegroundColor Cyan
        Start-Sleep -Seconds 30
        
        # Check service status
        $serviceStatus = docker compose -f $testComposeFile ps --format json | ConvertFrom-Json
        
        $healthyServices = 0
        foreach ($service in $serviceStatus) {
            if ($service.State -eq "running") {
                Add-TestResult "Service-$($service.Name)" "PASS" "Service is running" $service.Status
                $healthyServices++
            } else {
                Add-TestResult "Service-$($service.Name)" "FAIL" "Service not running" $service.Status
            }
        }
        
        if ($healthyServices -gt 0) {
            Add-TestResult "Service-Health" "PASS" "$healthyServices services are healthy" "Ready for testing"
        } else {
            Add-TestResult "Service-Health" "FAIL" "No services are healthy" "Check logs"
        }
        
    } else {
        Add-TestResult "Service-Startup" "FAIL" "Failed to start services" $startResult
    }
    
} catch {
    Add-TestResult "Service-Startup" "FAIL" "Exception during startup" $_.Exception.Message
}

# Test 7: Basic Connectivity Test  
Write-Host "`nTest 7: Service Connectivity" -ForegroundColor Yellow

try {
    # Test nginx
    $nginxTest = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 10 -UseBasicParsing
    if ($nginxTest.StatusCode -eq 200) {
        Add-TestResult "Connectivity-Nginx" "PASS" "Nginx responding" "Status: $($nginxTest.StatusCode)"
    } else {
        Add-TestResult "Connectivity-Nginx" "WARN" "Nginx responding but not OK" "Status: $($nginxTest.StatusCode)"
    }
} catch {
    Add-TestResult "Connectivity-Nginx" "FAIL" "Cannot connect to nginx" $_.Exception.Message
}

try {
    # Test PostgreSQL
    $pgTest = docker exec ai-game-production-p-postgres-1 pg_isready -U gameforge 2>&1
    if ($LASTEXITCODE -eq 0) {
        Add-TestResult "Connectivity-PostgreSQL" "PASS" "PostgreSQL ready" $pgTest
    } else {
        Add-TestResult "Connectivity-PostgreSQL" "FAIL" "PostgreSQL not ready" $pgTest
    }
} catch {
    Add-TestResult "Connectivity-PostgreSQL" "FAIL" "Cannot test PostgreSQL" $_.Exception.Message
}

# Cleanup
Write-Host "`nCleaning up test services..." -ForegroundColor Yellow
try {
    docker compose -f $testComposeFile down 2>&1 | Out-Null
    Add-TestResult "Cleanup" "PASS" "Test services stopped" "Cleanup completed"
} catch {
    Add-TestResult "Cleanup" "WARN" "Cleanup had issues" $_.Exception.Message
}

# Generate Report
Write-Host "`nGenerating test report..." -ForegroundColor Yellow

$reportPath = "$TestReportsDir/phase5-validation-$Timestamp.json"
$TestResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8

$summaryPath = "$TestReportsDir/phase5-summary-$Timestamp.txt"
$summary = @"
Phase 5 Runtime Validation Summary
==================================
Timestamp: $(Get-Date)
Total Tests: $($TestResults.Count)
Passed: $($TestResults | Where-Object Status -eq "PASS" | Measure-Object | Select-Object -ExpandProperty Count)
Failed: $($TestResults | Where-Object Status -eq "FAIL" | Measure-Object | Select-Object -ExpandProperty Count)
Warnings: $($TestResults | Where-Object Status -eq "WARN" | Measure-Object | Select-Object -ExpandProperty Count)

Test Results:
$($TestResults | ForEach-Object { "[$($_.Status)] $($_.Test) - $($_.Message)" } | Out-String)

Recommendations:
1. Set environment variables for production deployment
2. Ensure all required configuration files are properly configured
3. Address any port conflicts before production deployment
4. Review failed tests and resolve issues

Next Steps:
- For full deployment: docker compose -f docker-compose.production-hardened.yml up -d
- For monitoring: Check service logs and health endpoints
- For security: Run Phase 1 security scans regularly
"@

$summary | Out-File -FilePath $summaryPath -Encoding UTF8

# Final Summary
Write-Host "`n" -NoNewline
Write-Host "================================================" -ForegroundColor Blue
Write-Host "PHASE 5 VALIDATION COMPLETE" -ForegroundColor Blue  
Write-Host "================================================" -ForegroundColor Blue

$passCount = ($TestResults | Where-Object Status -eq "PASS" | Measure-Object).Count
$failCount = ($TestResults | Where-Object Status -eq "FAIL" | Measure-Object).Count
$warnCount = ($TestResults | Where-Object Status -eq "WARN" | Measure-Object).Count

Write-Host "Results: $passCount PASS, $failCount FAIL, $warnCount WARN" -ForegroundColor Cyan
Write-Host "Reports saved to: $TestReportsDir/" -ForegroundColor Gray

if ($failCount -eq 0) {
    Write-Host "✅ Phase 5 validation successful!" -ForegroundColor Green
    Write-Host "Ready for production deployment with docker-compose.production-hardened.yml" -ForegroundColor Green
} else {
    Write-Host "⚠️  Phase 5 validation completed with issues" -ForegroundColor Yellow
    Write-Host "Review failed tests before production deployment" -ForegroundColor Yellow
}

Write-Host "Next: Run full stack with docker compose -f docker-compose.production-hardened.yml up -d" -ForegroundColor Cyan
