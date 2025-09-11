# GameForge Phase 5: Compose Runtime Validation (PowerShell)
# ===========================================================
# End-to-end testing of docker-compose.production-hardened.yml

param(
    [string]$ComposeFile = "docker-compose.production-hardened.yml",
    [int]$TestTimeout = 300,
    [switch]$SkipCleanup
)

# Configuration
$ProjectRoot = $PWD
$TestReportsDir = Join-Path $ProjectRoot "phase5-test-reports"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "🚀 GameForge Phase 5: Compose Runtime Validation" -ForegroundColor Blue
Write-Host "================================================================="
Write-Host "Project: $ProjectRoot"
Write-Host "Compose: $ComposeFile" 
Write-Host "Timestamp: $Timestamp"
Write-Host ""

# Create test reports directory
if (!(Test-Path $TestReportsDir)) {
    New-Item -ItemType Directory -Path $TestReportsDir -Force | Out-Null
}

# Function to log with timestamp
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Function to check result
function Test-Result {
    param([string]$StepName, [int]$ExitCode)
    
    if ($ExitCode -eq 0) {
        Write-Log "✅ PASS: $StepName" -Color Green
        return $true
    } else {
        Write-Log "❌ FAIL: $StepName" -Color Red
        return $false
    }
}

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedPattern = ""
    )
    
    Write-Log "🌐 Testing: $Description" -Color Blue
    Write-Log "URL: $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            if ($ExpectedPattern -and $response.Content -notmatch $ExpectedPattern) {
                Write-Log "❌ FAIL: $Description (Pattern not found)" -Color Red
                return $false
            }
            Write-Log "✅ PASS: $Description (HTTP $($response.StatusCode))" -Color Green
            return $true
        } else {
            Write-Log "❌ FAIL: $Description (HTTP $($response.StatusCode))" -Color Red
            return $false
        }
    } catch {
        Write-Log "❌ FAIL: $Description (Connection failed: $($_.Exception.Message))" -Color Red
        return $false
    }
}

# Cleanup function
function Invoke-Cleanup {
    if (!$SkipCleanup) {
        Write-Log "🧹 Cleaning up..." -Color Yellow
        docker compose -f $ComposeFile down --volumes --remove-orphans 2>$null
    }
}

# Set cleanup on exit
try {
    # =======================================================================
    # Phase 5.1: Environment Preparation
    # =======================================================================
    Write-Log "📋 Phase 5.1: Environment Preparation" -Color Magenta
    
    # Check Docker
    try {
        docker info | Out-Null
        Test-Result "Docker daemon check" 0
    } catch {
        Write-Log "❌ Docker is not running" -Color Red
        exit 1
    }
    
    # Check compose file
    if (!(Test-Path $ComposeFile)) {
        Write-Log "❌ Compose file not found: $ComposeFile" -Color Red
        exit 1
    }
    Test-Result "Compose file existence" 0
    
    # Check environment variables
    $requiredVars = @(
        "POSTGRES_PASSWORD",
        "JWT_SECRET_KEY", 
        "SECRET_KEY",
        "VAULT_ROOT_TOKEN",
        "VAULT_TOKEN"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if (!(Get-Variable -Name $var -ErrorAction SilentlyContinue) -and !(Test-Path "env:$var")) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Log "❌ Missing required environment variables:" -Color Red
        foreach ($var in $missingVars) {
            Write-Log "   - $var"
        }
        Write-Log "💡 Please set these variables or source from .env" -Color Yellow
        
        # Try to set some defaults for testing
        Write-Log "🔧 Setting test defaults..." -Color Yellow
        $env:POSTGRES_PASSWORD = "gameforge_secure_test_2025"
        $env:JWT_SECRET_KEY = "test_jwt_secret_key_for_phase5_validation_2025"
        $env:SECRET_KEY = "test_app_secret_key_for_phase5_validation_2025"
        $env:VAULT_ROOT_TOKEN = "test-vault-root-token-2025"
        $env:VAULT_TOKEN = "test-vault-token-2025"
        $env:REDIS_PASSWORD = "test_redis_password_2025"
        $env:ELASTIC_PASSWORD = "test_elastic_password_2025"
        $env:GRAFANA_ADMIN_PASSWORD = "test_grafana_admin_2025"
        $env:GRAFANA_SECRET_KEY = "test_grafana_secret_2025"
        
        Write-Log "✅ Test environment variables set" -Color Green
    }
    
    Test-Result "Environment variables check" 0
    
    # =======================================================================
    # Phase 5.2: Service Startup and Build
    # =======================================================================
    Write-Log "📋 Phase 5.2: Service Startup and Build" -Color Magenta
    
    # Clean existing containers
    Write-Log "🧹 Cleaning existing containers..." -Color Blue
    docker compose -f $ComposeFile down --volumes --remove-orphans 2>$null
    
    # Start core services first (to avoid overwhelming the system)
    Write-Log "🚀 Starting core services..." -Color Blue
    
    # Start database and cache first
    $coreServices = @("postgres", "redis", "vault")
    foreach ($service in $coreServices) {
        Write-Log "🔧 Starting $service..." -Color Blue
        docker compose -f $ComposeFile up -d $service
        Start-Sleep -Seconds 10
    }
    
    # Wait for core services
    Write-Log "⏳ Waiting for core services to stabilize..." -Color Blue
    Start-Sleep -Seconds 30
    
    # Start remaining services
    Write-Log "🚀 Starting all services..." -Color Blue
    docker compose -f $ComposeFile up -d
    
    # Wait for startup
    Write-Log "⏳ Waiting for services to initialize..." -Color Blue
    Start-Sleep -Seconds 60
    
    # =======================================================================
    # Phase 5.3: Health Check Validation
    # =======================================================================
    Write-Log "📋 Phase 5.3: Health Check Validation" -Color Magenta
    
    # Show service status
    Write-Log "📊 Service Status Overview:" -Color Blue
    docker compose -f $ComposeFile ps
    
    # Core services to check
    $coreServices = @(
        "gameforge-app",
        "postgres", 
        "redis",
        "vault",
        "nginx"
    )
    
    $healthResults = @()
    foreach ($service in $coreServices) {
        Write-Log "🔍 Checking $service health..." -Color Blue
        
        # Simple health check - if container is running
        $containerStatus = docker compose -f $ComposeFile ps --services --filter "status=running" | Where-Object { $_ -eq $service }
        
        if ($containerStatus) {
            Write-Log "✅ $service is running" -Color Green
            $healthResults += "$service=PASS"
        } else {
            Write-Log "❌ $service is not running" -Color Red
            $healthResults += "$service=FAIL"
            
            # Show logs for failed service
            Write-Log "📋 $service logs:" -Color Yellow
            docker compose -f $ComposeFile logs --tail=10 $service
        }
    }
    
    # =======================================================================
    # Phase 5.4: API Endpoint Validation  
    # =======================================================================
    Write-Log "📋 Phase 5.4: API Endpoint Validation" -Color Magenta
    
    # Wait for application to initialize
    Write-Log "⏳ Waiting for application initialization..." -Color Blue
    Start-Sleep -Seconds 30
    
    # Test main health endpoint
    Write-Log "🌐 Testing GameForge health endpoint..." -Color Blue
    $healthEndpointResult = Test-Endpoint -Url "http://localhost:8080/health" -Description "GameForge Health Check" -ExpectedPattern "status"
    
    if ($healthEndpointResult) {
        Write-Log "📊 Health endpoint response:" -Color Blue
        try {
            $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 10
            $healthResponse | ConvertTo-Json -Depth 3
        } catch {
            Write-Log "⚠️ Could not parse health response as JSON" -Color Yellow
        }
    }
    
    # Test other endpoints
    $endpointTests = @(
        @{ Url = "http://localhost:8080/metrics"; Description = "Prometheus Metrics" },
        @{ Url = "http://localhost:3000/api/health"; Description = "Grafana Health" },
        @{ Url = "http://localhost:9090/-/healthy"; Description = "Prometheus Health" }
    )
    
    $endpointResults = @()
    foreach ($test in $endpointTests) {
        $result = Test-Endpoint -Url $test.Url -Description $test.Description
        $endpointResults += "$($test.Description)=$(if($result){'PASS'}else{'FAIL'})"
    }
    
    # =======================================================================
    # Phase 5.5: End-to-End Generation Test
    # =======================================================================
    Write-Log "📋 Phase 5.5: End-to-End Generation Test" -Color Magenta
    
    Write-Log "🎨 Testing asset generation endpoint..." -Color Blue
    
    $generationPayload = @{
        prompt = "test character for phase 5 validation"
        model = "sdxl-lite"
        style = "fantasy"
        seed = 12345
    } | ConvertTo-Json
    
    $testToken = "test-bearer-token-phase5"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $testToken"
        }
        
        $generationResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/generate" -Method POST -Body $generationPayload -Headers $headers -TimeoutSec 30
        
        Write-Log "✅ Generation request accepted" -Color Green
        Write-Log "📊 Generation response:" -Color Blue
        $generationResponse | ConvertTo-Json -Depth 3
        $generationTestResult = $true
        
    } catch {
        Write-Log "❌ Generation request failed: $($_.Exception.Message)" -Color Red
        $generationTestResult = $false
    }
    
    # =======================================================================
    # Phase 5.6: Log and Metrics Validation
    # =======================================================================
    Write-Log "📋 Phase 5.6: Log and Metrics Validation" -Color Magenta
    
    # Check application logs for errors
    Write-Log "🔍 Checking application logs for errors..." -Color Blue
    $appLogs = docker compose -f $ComposeFile logs gameforge-app 2>&1
    
    if ($appLogs -match "error|exception|traceback") {
        Write-Log "⚠️ Found potential errors in logs" -Color Yellow
        $logCheckResult = $false
    } else {
        Write-Log "✅ No obvious errors in application logs" -Color Green  
        $logCheckResult = $true
    }
    
    # Test metrics endpoint
    Write-Log "📊 Testing Prometheus metrics..." -Color Blue
    $metricsResult = Test-Endpoint -Url "http://localhost:8080/metrics" -Description "Prometheus Metrics"
    
    # =======================================================================
    # Phase 5.7: Final Report
    # =======================================================================
    Write-Log "📋 Phase 5.7: Final Report Generation" -Color Magenta
    
    # Calculate results
    $totalTests = 0
    $passedTests = 0
    
    # Count health results
    foreach ($result in $healthResults) {
        $totalTests++
        if ($result -match "PASS") { $passedTests++ }
    }
    
    # Count endpoint results  
    foreach ($result in $endpointResults) {
        $totalTests++
        if ($result -match "PASS") { $passedTests++ }
    }
    
    # Count other tests
    $otherTests = @(
        @{ Name = "Health Endpoint"; Result = $healthEndpointResult },
        @{ Name = "Generation Test"; Result = $generationTestResult },
        @{ Name = "Log Check"; Result = $logCheckResult },
        @{ Name = "Metrics"; Result = $metricsResult }
    )
    
    foreach ($test in $otherTests) {
        $totalTests++
        if ($test.Result) { $passedTests++ }
    }
    
    # Generate report
    $reportFile = Join-Path $TestReportsDir "phase5-final-report-$Timestamp.txt"
    $reportContent = @"
=================================================================
GameForge Phase 5: Compose Runtime Validation Report
=================================================================
Timestamp: $(Get-Date)
Project: $ProjectRoot
Compose File: $ComposeFile

SUMMARY
-------
Total Tests: $totalTests
Passed: $passedTests
Failed: $($totalTests - $passedTests)
Success Rate: $([math]::Round($passedTests * 100 / $totalTests, 1))%

SERVICE HEALTH CHECKS
--------------------
$($healthResults -join "`n")

ENDPOINT VALIDATION  
-------------------
$($endpointResults -join "`n")

FUNCTIONAL TESTS
----------------
$($otherTests | ForEach-Object { "$($_.Name): $(if($_.Result){'PASS'}else{'FAIL'})" } | Out-String)
"@
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    
    # Display results
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Blue
    Write-Host "🏁 Phase 5: Compose Runtime Validation Results" -ForegroundColor Blue  
    Write-Host "=================================================================" -ForegroundColor Blue
    
    $successRate = [math]::Round($passedTests * 100 / $totalTests, 1)
    
    if ($passedTests -eq $totalTests) {
        Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "✅ Production stack is ready for deployment" -ForegroundColor Green
        $overallResult = 0
    } elseif ($successRate -ge 80) {
        Write-Host "⚠️ MOSTLY SUCCESSFUL ($passedTests/$totalTests passed)" -ForegroundColor Yellow
        Write-Host "💡 Minor issues detected, review failed tests" -ForegroundColor Yellow
        $overallResult = 1
    } else {
        Write-Host "❌ SIGNIFICANT ISSUES DETECTED ($passedTests/$totalTests passed)" -ForegroundColor Red
        Write-Host "🚨 Address failures before production deployment" -ForegroundColor Red
        $overallResult = 2
    }
    
    Write-Host ""
    Write-Host "📊 Test Summary:" -ForegroundColor Cyan
    Write-Host "   Total Tests: $totalTests"
    Write-Host "   Passed: $passedTests" -ForegroundColor Green
    Write-Host "   Failed: $($totalTests - $passedTests)" -ForegroundColor Red
    Write-Host "   Success Rate: $successRate%"
    
    Write-Host ""
    Write-Host "📁 Reports Generated:" -ForegroundColor Cyan
    Write-Host "   Final Report: $reportFile"
    Write-Host "   Test Data: $TestReportsDir"
    
    Write-Host ""
    Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
    if ($overallResult -eq 0) {
        Write-Host "   ✅ Ready for production deployment" -ForegroundColor Green
        Write-Host "   ✅ All systems validated successfully" -ForegroundColor Green
    } elseif ($overallResult -eq 1) {
        Write-Host "   ⚠️ Review and address minor issues" -ForegroundColor Yellow
        Write-Host "   ⚠️ Consider additional testing" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Fix critical issues before deployment" -ForegroundColor Red
        Write-Host "   ❌ Review logs and service configurations" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🔍 For detailed analysis:" -ForegroundColor Blue
    Write-Host "   Get-Content '$reportFile'"
    Write-Host "   docker compose -f $ComposeFile logs [service_name]"
    
} finally {
    Invoke-Cleanup
}
