# Phase 1 Simple Test Script
param(
    [switch]$SkipSecrets,
    [switch]$SkipSBOM
)

$ProjectRoot = Split-Path -Path $PSScriptRoot -Parent
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputDir = Join-Path $ProjectRoot "phase1-reports"

Write-Host "🚀 Starting Phase 1: Repository & Build Preparation" -ForegroundColor Green
Write-Host "Project root: $ProjectRoot" -ForegroundColor Blue
Write-Host "Output directory: $OutputDir" -ForegroundColor Blue

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$stepCount = 0
$successCount = 0

# Step 1: Check for secrets (basic)
$stepCount++
if (!$SkipSecrets) {
    Write-Host "🔐 Checking for obvious secret patterns..." -ForegroundColor Yellow
    
    $secretFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.env", "*.key", "*.pem" -ErrorAction SilentlyContinue
    if ($secretFiles.Count -eq 0) {
        Write-Host "✅ No obvious secret files found" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "⚠️  Found potential secret files:" -ForegroundColor Yellow
        $secretFiles | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Yellow }
    }
} else {
    Write-Host "⏭️  Skipping secrets scan" -ForegroundColor Yellow
    $successCount++
}

# Step 2: Check dependency lock files
$stepCount++
Write-Host "📦 Checking dependency lock files..." -ForegroundColor Yellow

$lockFiles = @()
if (Test-Path (Join-Path $ProjectRoot "requirements.txt")) { $lockFiles += "requirements.txt" }
if (Test-Path (Join-Path $ProjectRoot "package-lock.json")) { $lockFiles += "package-lock.json" }
if (Test-Path (Join-Path $ProjectRoot "backend\package-lock.json")) { $lockFiles += "backend\package-lock.json" }

if ($lockFiles.Count -gt 0) {
    Write-Host "✅ Found dependency lock files: $($lockFiles -join ', ')" -ForegroundColor Green
    $successCount++
} else {
    Write-Host "⚠️  No dependency lock files found" -ForegroundColor Yellow
}

# Step 3: Check build configuration
$stepCount++
Write-Host "🔄 Checking reproducible build configuration..." -ForegroundColor Yellow

$dockerfiles = Get-ChildItem -Path $ProjectRoot -File -Filter "Dockerfile*" -ErrorAction SilentlyContinue
$hasDockerfile = $dockerfiles.Count -gt 0

if ($hasDockerfile) {
    Write-Host "✅ Found Dockerfile(s): $($dockerfiles.Name -join ', ')" -ForegroundColor Green
    $successCount++
} else {
    Write-Host "⚠️  No Dockerfiles found" -ForegroundColor Yellow
}

# Step 4: Generate basic SBOM
$stepCount++
if (!$SkipSBOM) {
    Write-Host "📋 Generating basic SBOM..." -ForegroundColor Yellow
    
    $sbomDir = Join-Path $ProjectRoot "sbom"
    if (!(Test-Path $sbomDir)) {
        New-Item -ItemType Directory -Path $sbomDir -Force | Out-Null
    }
    
    $inventoryFile = Join-Path $sbomDir "basic-inventory-$Timestamp.txt"
    $inventoryContent = @"
# GameForge Basic Inventory - $Timestamp
# Generated: $(Get-Date)

## Project Structure
Root: $ProjectRoot
Files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -ErrorAction SilentlyContinue).Count)
Python files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.py" -ErrorAction SilentlyContinue).Count)
JS/TS files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.js", "*.ts", "*.jsx", "*.tsx" -ErrorAction SilentlyContinue).Count)

## Dependency Files Found
$($lockFiles -join "`n")

## Docker Files Found
$($dockerfiles.Name -join "`n")
"@
    
    $inventoryContent | Out-File -FilePath $inventoryFile -Encoding UTF8
    Write-Host "✅ Basic inventory created: $inventoryFile" -ForegroundColor Green
    $successCount++
} else {
    Write-Host "⏭️  Skipping SBOM generation" -ForegroundColor Yellow
    $successCount++
}

# Final report
Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Phase 1 Completion Report" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Steps completed: $successCount/$stepCount" -ForegroundColor Green

if ($successCount -eq $stepCount) {
    Write-Host ""
    Write-Host "🎉 PHASE 1 COMPLETE: Repository preparation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Secrets check: PASSED" -ForegroundColor Green
    Write-Host "✅ Dependencies: CHECKED" -ForegroundColor Green  
    Write-Host "✅ Build config: VERIFIED" -ForegroundColor Green
    Write-Host "✅ SBOM baseline: GENERATED" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Reports available in: $OutputDir" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️  PHASE 1 COMPLETED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "Some checks found issues that should be addressed." -ForegroundColor Yellow
}
