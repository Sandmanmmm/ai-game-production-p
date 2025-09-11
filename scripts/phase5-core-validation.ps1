# GameForge Phase 5: Compose Runtime Validation (PowerShell - Fixed)
# ===================================================================

param(
    [string]$ComposeFile = "docker-compose.production-hardened.yml",
    [switch]$SkipCleanup
)

$ProjectRoot = $PWD
$TestReportsDir = Join-Path $ProjectRoot "phase5-test-reports"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "GameForge Phase 5: Compose Runtime Validation" -ForegroundColor Blue
Write-Host "=================================================="
Write-Host "Project: $ProjectRoot"
Write-Host "Compose: $ComposeFile"
Write-Host "Timestamp: $Timestamp"
Write-Host ""

# Create test reports directory
if (!(Test-Path $TestReportsDir)) {
    New-Item -ItemType Directory -Path $TestReportsDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Test-Result {
    param([string]$StepName, [bool]$Success)
    
    if ($Success) {
        Write-Log "PASS: $StepName" -Color Green
        return $true
    } else {
        Write-Log "FAIL: $StepName" -Color Red
        return $false
    }
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-Log "Testing: $Description" -Color Blue
    Write-Log "URL: $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Log "PASS: $Description (HTTP $($response.StatusCode))" -Color Green
            return $true
        } else {
            Write-Log "FAIL: $Description (HTTP $($response.StatusCode))" -Color Red
            return $false
        }
    } catch {
        Write-Log "FAIL: $Description (Connection failed)" -Color Red
        return $false
    }
}

function Invoke-Cleanup {
    if (!$SkipCleanup) {
        Write-Log "Cleaning up..." -Color Yellow
        docker compose -f $ComposeFile down --volumes --remove-orphans 2>$null
    }
}

try {
    # Phase 5.1: Environment Preparation
    Write-Log "Phase 5.1: Environment Preparation" -Color Magenta
    
    # Check Docker
    try {
        docker info | Out-Null
        Test-Result "Docker daemon check" $true
    } catch {
        Write-Log "Docker is not running" -Color Red
        exit 1
    }
    
    # Check compose file
    if (!(Test-Path $ComposeFile)) {
        Write-Log "Compose file not found: $ComposeFile" -Color Red
        exit 1
    }
    Test-Result "Compose file existence" $true
    
    # Phase 5.2: Service Startup
    Write-Log "Phase 5.2: Service Startup" -Color Magenta
    
    # Clean existing containers
    Write-Log "Cleaning existing containers..." -Color Blue
    docker compose -f $ComposeFile down --volumes --remove-orphans 2>$null
    
    # Start core services only for testing
    Write-Log "Starting core services..." -Color Blue
    $coreServices = @("postgres", "redis")
    
    foreach ($service in $coreServices) {
        Write-Log "Starting $service..." -Color Blue
        docker compose -f $ComposeFile up -d $service
        Start-Sleep -Seconds 5
    }
    
    # Wait for services to initialize
    Write-Log "Waiting for services to initialize..." -Color Blue
    Start-Sleep -Seconds 30
    
    # Phase 5.3: Health Check Validation
    Write-Log "Phase 5.3: Health Check Validation" -Color Magenta
    
    # Show service status
    Write-Log "Service Status:" -Color Blue
    docker compose -f $ComposeFile ps
    
    # Check service health
    $healthResults = @()
    foreach ($service in $coreServices) {
        Write-Log "Checking $service..." -Color Blue
        
        $containerStatus = docker compose -f $ComposeFile ps --services --filter "status=running" | Where-Object { $_ -eq $service }
        
        if ($containerStatus) {
            Write-Log "$service is running" -Color Green
            $healthResults += @{ Service = $service; Status = "PASS" }
        } else {
            Write-Log "$service is not running" -Color Red
            $healthResults += @{ Service = $service; Status = "FAIL" }
            
            Write-Log "$service logs:" -Color Yellow
            docker compose -f $ComposeFile logs --tail=5 $service
        }
    }
    
    # Phase 5.4: Basic Connectivity Test
    Write-Log "Phase 5.4: Basic Connectivity Test" -Color Magenta
    
    # Test database connectivity
    Write-Log "Testing database connectivity..." -Color Blue
    try {
        $dbTest = docker compose -f $ComposeFile exec -T postgres pg_isready -U gameforge
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database connectivity: PASS" -Color Green
            $dbConnectResult = $true
        } else {
            Write-Log "Database connectivity: FAIL" -Color Red
            $dbConnectResult = $false
        }
    } catch {
        Write-Log "Database connectivity test failed" -Color Red
        $dbConnectResult = $false
    }
    
    # Test Redis connectivity
    Write-Log "Testing Redis connectivity..." -Color Blue
    try {
        $redisTest = docker compose -f $ComposeFile exec -T redis redis-cli ping
        if ($redisTest -match "PONG") {
            Write-Log "Redis connectivity: PASS" -Color Green
            $redisConnectResult = $true
        } else {
            Write-Log "Redis connectivity: FAIL" -Color Red
            $redisConnectResult = $false
        }
    } catch {
        Write-Log "Redis connectivity test failed" -Color Red
        $redisConnectResult = $false
    }
    
    # Phase 5.5: Report Generation
    Write-Log "Phase 5.5: Report Generation" -Color Magenta
    
    # Calculate results
    $totalTests = 0
    $passedTests = 0
    
    # Count health results
    foreach ($result in $healthResults) {
        $totalTests++
        if ($result.Status -eq "PASS") { $passedTests++ }
    }
    
    # Count connectivity tests
    $connectivityTests = @(
        @{ Name = "Database Connectivity"; Result = $dbConnectResult },
        @{ Name = "Redis Connectivity"; Result = $redisConnectResult }
    )
    
    foreach ($test in $connectivityTests) {
        $totalTests++
        if ($test.Result) { $passedTests++ }
    }
    
    # Generate report
    $reportFile = Join-Path $TestReportsDir "phase5-core-test-report-$Timestamp.txt"
    $reportContent = @"
GameForge Phase 5: Core Services Validation Report
==================================================
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
$($healthResults | ForEach-Object { "$($_.Service): $($_.Status)" } | Out-String)

CONNECTIVITY TESTS
------------------
$($connectivityTests | ForEach-Object { "$($_.Name): $(if($_.Result){'PASS'}else{'FAIL'})" } | Out-String)
"@
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    
    # Display results
    Write-Host ""
    Write-Host "Phase 5: Core Services Validation Results" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    
    $successRate = [math]::Round($passedTests * 100 / $totalTests, 1)
    
    if ($passedTests -eq $totalTests) {
        Write-Host "ALL CORE TESTS PASSED!" -ForegroundColor Green
        Write-Host "Core services are ready" -ForegroundColor Green
        $overallResult = 0
    } elseif ($successRate -ge 70) {
        Write-Host "MOSTLY SUCCESSFUL ($passedTests/$totalTests passed)" -ForegroundColor Yellow
        Write-Host "Minor issues detected" -ForegroundColor Yellow
        $overallResult = 1
    } else {
        Write-Host "ISSUES DETECTED ($passedTests/$totalTests passed)" -ForegroundColor Red
        Write-Host "Address failures before proceeding" -ForegroundColor Red
        $overallResult = 2
    }
    
    Write-Host ""
    Write-Host "Test Summary:" -ForegroundColor Cyan
    Write-Host "   Total Tests: $totalTests"
    Write-Host "   Passed: $passedTests" -ForegroundColor Green
    Write-Host "   Failed: $($totalTests - $passedTests)" -ForegroundColor Red
    Write-Host "   Success Rate: $successRate%"
    
    Write-Host ""
    Write-Host "Report Generated: $reportFile" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    if ($overallResult -eq 0) {
        Write-Host "   Ready to test full stack" -ForegroundColor Green
        Write-Host "   Run: docker compose -f $ComposeFile up -d" -ForegroundColor Green
    } else {
        Write-Host "   Review failed services" -ForegroundColor Yellow
        Write-Host "   Check logs: docker compose -f $ComposeFile logs [service]" -ForegroundColor Yellow
    }
    
} finally {
    Invoke-Cleanup
}

exit $overallResult
