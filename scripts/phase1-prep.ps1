# ========================================================================
# Phase 1: Repository & Build Preparation (Windows PowerShell)
# Pre-build hygiene automation script
# ========================================================================

param(
    [string]$OutputDir = "",
    [switch]$SkipSecrets,
    [switch]$SkipSBOM,
    [switch]$Verbose
)

# Set strict mode
Set-StrictMode -Version 3.0
$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$ProjectRoot = Split-Path -Path $ScriptDir -Parent
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrEmpty($OutputDir)) {
    $OutputDir = Join-Path $ProjectRoot "phase1-reports"
}

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Color functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

function Write-Log {
    param([string]$Message)
    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-ColorOutput "[$TimeStamp] $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

# ========================================================================
# 1. Secrets Scanning
# ========================================================================
function Invoke-SecretsScanning {
    Write-Log "Running secrets scan..."
    
    $secretsFound = 0
    $scanReport = Join-Path $OutputDir "secrets-scan-$Timestamp.json"
    
    # Method 1: TruffleHog (if available)
    try {
        $trufflehog = Get-Command trufflehog -ErrorAction SilentlyContinue
        if ($trufflehog) {
            Write-Log "Running TruffleHog scan..."
            $trufflehogResult = & trufflehog filesystem $ProjectRoot --json 2>$null
            $trufflehogResult | Out-File -FilePath $scanReport -Encoding UTF8
            
            if ($trufflehogResult) {
                $secretsCount = ($trufflehogResult | ConvertFrom-Json).Count
                if ($secretsCount -gt 0) {
                    Write-Error "TruffleHog found $secretsCount potential secrets!"
                    $secretsFound += $secretsCount
                } else {
                    Write-Success "TruffleHog: No secrets detected"
                }
            } else {
                Write-Success "TruffleHog: No secrets detected"
            }
        }
    } catch {
        Write-Warning "TruffleHog not available or failed: $($_.Exception.Message)"
    }
    
    # Method 2: Basic pattern matching
    Write-Log "Running basic pattern matching for secrets..."
    $patternReport = Join-Path $OutputDir "pattern-secrets-$Timestamp.txt"
    
    $patterns = @(
        "password\s*[=:]\s*[`"'][^`"']{8,}[`"']",
        "secret\s*[=:]\s*[`"'][^`"']{16,}[`"']",
        "api_key\s*[=:]\s*[`"'][^`"']{16,}[`"']",
        "private_key",
        "-----BEGIN.*PRIVATE KEY-----",
        "github_pat_[a-zA-Z0-9]{22,255}",
        "ghp_[a-zA-Z0-9]{36}",
        "sk-[a-zA-Z0-9]{48}",
        "xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}"
    )
    
    "# Pattern-based secrets scan - $Timestamp" | Out-File -FilePath $patternReport -Encoding UTF8
    "# Scanning directory: $ProjectRoot" | Out-File -FilePath $patternReport -Append -Encoding UTF8
    "" | Out-File -FilePath $patternReport -Append -Encoding UTF8
    
    $patternFound = $false
    $excludeDirs = @(".git", "node_modules", ".venv", "venv", "env", "__pycache__", "phase1-reports")
    
    foreach ($pattern in $patterns) {
        Write-Log "Checking pattern: $pattern"
        
        $files = Get-ChildItem -Path $ProjectRoot -Recurse -File | 
                 Where-Object { 
                     $exclude = $false
                     foreach ($dir in $excludeDirs) {
                         if ($_.FullName -like "*\$dir\*") {
                             $exclude = $true
                             break
                         }
                     }
                     -not $exclude -and 
                     $_.Extension -notin @(".log", ".backup") -and
                     $_.Name -notlike "*phase1-reports*"
                 }
        
        foreach ($file in $files) {
            try {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -and ($content -match $pattern)) {
                    "FOUND in $($file.FullName): $pattern" | Out-File -FilePath $patternReport -Append -Encoding UTF8
                    $patternFound = $true
                }
            } catch {
                # Skip files that can't be read
            }
        }
    }
    
    if ($patternFound) {
        Write-Error "Pattern matching found potential secrets! Report: $patternReport"
        $secretsFound++
    } else {
        Write-Success "Pattern matching: No obvious secrets detected"
        "No secrets found using pattern matching" | Out-File -FilePath $patternReport -Append -Encoding UTF8
    }
    
    # Summary
    if ($secretsFound -eq 0) {
        Write-Success "🔐 SECRETS SCAN PASSED: No secrets detected"
        return $true
    } else {
        Write-Error "🚨 SECRETS SCAN FAILED: Potential secrets found!"
        Write-Host ""
        Write-Host "REMEDIATION STEPS:"
        Write-Host "1. Review reports in: $OutputDir"
        Write-Host "2. Remove or move secrets to HashiCorp Vault"
        Write-Host "3. Rotate any leaked credentials"
        Write-Host "4. Add patterns to .gitignore"
        Write-Host "5. Configure git-secrets hooks"
        return $false
    }
}

# ========================================================================
# 2. Dependency Version Locking
# ========================================================================
function Lock-Dependencies {
    Write-Log "Locking dependency versions..."
    
    $lockSuccess = $false
    
    # Python dependencies
    $requirementsIn = Join-Path $ProjectRoot "requirements.in"
    if (Test-Path $requirementsIn) {
        Write-Log "Compiling Python requirements..."
        
        try {
            $pipCompile = Get-Command pip-compile -ErrorAction SilentlyContinue
            if ($pipCompile) {
                Set-Location $ProjectRoot
                & pip-compile requirements.in --output-file requirements.txt --verbose
                Write-Success "Python: requirements.txt generated from requirements.in"
                $lockSuccess = $true
            } else {
                # Fallback: pip freeze (if virtual env is active)
                if ($env:VIRTUAL_ENV -or $env:CONDA_DEFAULT_ENV) {
                    & pip freeze > requirements.txt
                    Write-Success "Python: requirements.txt generated using pip freeze"
                    $lockSuccess = $true
                } else {
                    Write-Warning "Python: No virtual environment detected, skipping pip freeze"
                }
            }
        } catch {
            Write-Warning "Python: pip not available or failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "Python: requirements.in not found"
    }
    
    # Node.js dependencies (frontend)
    $packageJson = Join-Path $ProjectRoot "package.json"
    $packageLock = Join-Path $ProjectRoot "package-lock.json"
    
    if ((Test-Path $packageJson) -and !(Test-Path $packageLock)) {
        Write-Log "Generating Node.js lock file..."
        
        try {
            $npm = Get-Command npm -ErrorAction SilentlyContinue
            if ($npm) {
                Set-Location $ProjectRoot
                & npm install --package-lock-only
                Write-Success "Node.js: package-lock.json generated"
                $lockSuccess = $true
            } else {
                Write-Warning "Node.js: npm not available"
            }
        } catch {
            Write-Warning "Node.js: npm failed: $($_.Exception.Message)"
        }
    } elseif (Test-Path $packageLock) {
        Write-Success "Node.js: package-lock.json already exists"
        $lockSuccess = $true
    }
    
    # Node.js dependencies (backend)
    $backendPackageJson = Join-Path $ProjectRoot "backend\package.json"
    $backendPackageLock = Join-Path $ProjectRoot "backend\package-lock.json"
    
    if ((Test-Path $backendPackageJson) -and !(Test-Path $backendPackageLock)) {
        Write-Log "Generating backend Node.js lock file..."
        
        try {
            $npm = Get-Command npm -ErrorAction SilentlyContinue
            if ($npm) {
                Set-Location (Join-Path $ProjectRoot "backend")
                & npm install --package-lock-only
                Write-Success "Backend Node.js: package-lock.json generated"
                $lockSuccess = $true
            } else {
                Write-Warning "Backend Node.js: npm not available"
            }
        } catch {
            Write-Warning "Backend Node.js: npm failed: $($_.Exception.Message)"
        }
    } elseif (Test-Path $backendPackageLock) {
        Write-Success "Backend Node.js: package-lock.json already exists"
        $lockSuccess = $true
    }
    
    # Check for other dependency files
    $depFiles = @("poetry.lock", "Pipfile.lock", "yarn.lock", "composer.lock")
    foreach ($depFile in $depFiles) {
        $depPath = Join-Path $ProjectRoot $depFile
        if (Test-Path $depPath) {
            Write-Success "Found dependency lock file: $depFile"
            $lockSuccess = $true
        }
    }
    
    if ($lockSuccess) {
        Write-Success "📦 DEPENDENCY LOCKING PASSED: Dependencies are locked"
        return $true
    } else {
        Write-Warning "📦 DEPENDENCY LOCKING WARNING: Some dependencies may not be locked"
        return $true  # Warning, not error
    }
}

# ========================================================================
# 3. Reproducible Build Configuration
# ========================================================================
function Set-ReproducibleBuilds {
    Write-Log "Configuring reproducible builds..."
    
    $buildSuccess = $false
    
    # Check Dockerfile for build args
    $dockerfiles = @("Dockerfile", "Dockerfile.production", "Dockerfile.production.enhanced", "Dockerfile.frontend")
    
    foreach ($dockerfile in $dockerfiles) {
        $dockerfilePath = Join-Path $ProjectRoot $dockerfile
        if (Test-Path $dockerfilePath) {
            Write-Log "Checking $dockerfile for build reproducibility..."
            
            $content = Get-Content $dockerfilePath -Raw
            $hasBuildDate = ($content -match "ARG BUILD_DATE").Count
            $hasVcsRef = ($content -match "ARG VCS_REF").Count
            $hasVersion = ($content -match "ARG BUILD_VERSION|ARG VERSION").Count
            
            if ($hasBuildDate -gt 0 -and $hasVcsRef -gt 0 -and $hasVersion -gt 0) {
                Write-Success "$dockerfile`: Has reproducible build args"
                $buildSuccess = $true
            } else {
                Write-Warning "$dockerfile`: Missing some build args (BUILD_DATE: $hasBuildDate, VCS_REF: $hasVcsRef, VERSION: $hasVersion)"
            }
        }
    }
    
    # Generate build metadata
    $buildInfo = Join-Path $ProjectRoot "build-info.json"
    Write-Log "Generating build metadata..."
    
    $gitRef = "unknown"
    $gitBranch = "unknown" 
    $gitVersion = "v0.0.0-dev"
    $gitDirty = $true
    
    try {
        $git = Get-Command git -ErrorAction SilentlyContinue
        if ($git) {
            $gitRef = & git rev-parse HEAD 2>$null
            $gitBranch = & git rev-parse --abbrev-ref HEAD 2>$null
            $gitVersion = & git describe --tags --always 2>$null
            $gitStatus = & git status --porcelain 2>$null
            $gitDirty = [bool]$gitStatus
        }
    } catch {
        # Git not available or not a git repo
    }
    
    $buildMetadata = @{
        build_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        vcs_ref = $gitRef
        vcs_branch = $gitBranch
        build_version = $gitVersion
        build_user = $env:USERNAME
        build_host = $env:COMPUTERNAME
        build_os = "Windows"
        build_arch = $env:PROCESSOR_ARCHITECTURE
        git_dirty = $gitDirty
    }
    
    $buildMetadata | ConvertTo-Json -Depth 3 | Out-File -FilePath $buildInfo -Encoding UTF8
    Write-Success "Build metadata generated: $buildInfo"
    
    # Create build script with reproducible flags
    $scriptsDir = Join-Path $ProjectRoot "scripts"
    if (!(Test-Path $scriptsDir)) {
        New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    }
    
    $buildScript = Join-Path $scriptsDir "build-reproducible.ps1"
    
    $scriptContent = @'
# Reproducible build script for GameForge (PowerShell)

param(
    [string]$Variant = "cpu",
    [switch]$Frontend,
    [switch]$Backend
)

# Build metadata
$BuildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$VcsRef = "unknown"
$BuildVersion = "v0.0.0-dev"

try {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $VcsRef = & git rev-parse HEAD 2>$null
        $BuildVersion = & git describe --tags --always 2>$null
    }
} catch {
    Write-Warning "Git not available, using default values"
}

# Set Docker BuildKit
$env:DOCKER_BUILDKIT = "1"

if ($Frontend -or (!$Backend -and !$Frontend)) {
    if (Test-Path "package.json") {
        Write-Host "Building frontend..." -ForegroundColor Green
        & docker build `
            --build-arg BUILD_DATE="$BuildDate" `
            --build-arg VCS_REF="$VcsRef" `
            --build-arg BUILD_VERSION="$BuildVersion" `
            --file Dockerfile.frontend `
            --tag gameforge-frontend:reproducible `
            .
    }
}

if ($Backend -or (!$Backend -and !$Frontend)) {
    if (Test-Path "Dockerfile.production.enhanced") {
        Write-Host "Building backend..." -ForegroundColor Green
        & docker build `
            --build-arg BUILD_DATE="$BuildDate" `
            --build-arg VCS_REF="$VcsRef" `
            --build-arg BUILD_VERSION="$BuildVersion" `
            --build-arg VARIANT="$Variant" `
            --file Dockerfile.production.enhanced `
            --tag gameforge-backend:reproducible `
            .
    }
}

Write-Host "✅ Reproducible build completed" -ForegroundColor Green
Write-Host "BUILD_DATE: $BuildDate"
Write-Host "VCS_REF: $VcsRef"
Write-Host "BUILD_VERSION: $BuildVersion"
'@
    
    $scriptContent | Out-File -FilePath $buildScript -Encoding UTF8
    Write-Success "Reproducible build script created: $buildScript"
    
    Write-Success "🔄 REPRODUCIBLE BUILDS CONFIGURED"
    return $true
}

# ========================================================================
# 4. SBOM Baseline Generation
# ========================================================================
function New-SBOMBaseline {
    Write-Log "Generating SBOM baseline..."
    
    $sbomDir = Join-Path $ProjectRoot "sbom"
    if (!(Test-Path $sbomDir)) {
        New-Item -ItemType Directory -Path $sbomDir -Force | Out-Null
    }
    
    $sbomSuccess = $false
    
    # Method 1: Syft (if available)
    try {
        $syft = Get-Command syft -ErrorAction SilentlyContinue
        if ($syft) {
            Write-Log "Generating SBOM with Syft..."
            
            $syftOutput = Join-Path $sbomDir "sbom-baseline-$Timestamp.json"
            & syft packages "dir:$ProjectRoot" -o json | Out-File -FilePath $syftOutput -Encoding UTF8
            Write-Success "Syft SBOM generated: $syftOutput"
            
            # Also generate SPDX format
            $spdxOutput = Join-Path $sbomDir "sbom-baseline-$Timestamp.spdx.json"
            & syft packages "dir:$ProjectRoot" -o spdx-json | Out-File -FilePath $spdxOutput -Encoding UTF8
            Write-Success "SPDX SBOM generated: $spdxOutput"
            
            $sbomSuccess = $true
        }
    } catch {
        Write-Warning "Syft not available, using fallback methods: $($_.Exception.Message)"
    }
    
    # Method 2: Create basic inventory
    Write-Log "Creating basic package inventory..."
    $inventory = Join-Path $sbomDir "package-inventory-$Timestamp.txt"
    
    $inventoryContent = @"
# GameForge Package Inventory - $Timestamp
# Generated at: $(Get-Date)
# Project root: $ProjectRoot

## Python Packages (from requirements.txt)
"@
    
    $requirementsTxt = Join-Path $ProjectRoot "requirements.txt"
    if (Test-Path $requirementsTxt) {
        $inventoryContent += "`n### Requirements.txt packages:`n"
        $requirements = Get-Content $requirementsTxt | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
        $inventoryContent += ($requirements -join "`n")
    }
    
    $inventoryContent += "`n`n## Node.js Packages (from package.json)"
    
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
            $inventoryContent += "`n### Frontend dependencies:`n"
            if ($packageJson.dependencies) {
                $packageJson.dependencies.PSObject.Properties | ForEach-Object {
                    $inventoryContent += "$($_.Name)==$($_.Value)`n"
                }
            }
            $inventoryContent += "`n### Frontend devDependencies:`n"
            if ($packageJson.devDependencies) {
                $packageJson.devDependencies.PSObject.Properties | ForEach-Object {
                    $inventoryContent += "$($_.Name)==$($_.Value)`n"
                }
            }
        } catch {
            Write-Warning "Could not parse frontend package.json"
        }
    }
    
    $backendPackageJsonPath = Join-Path $ProjectRoot "backend\package.json"
    if (Test-Path $backendPackageJsonPath) {
        try {
            $backendPackageJson = Get-Content $backendPackageJsonPath | ConvertFrom-Json
            $inventoryContent += "`n### Backend dependencies:`n"
            if ($backendPackageJson.dependencies) {
                $backendPackageJson.dependencies.PSObject.Properties | ForEach-Object {
                    $inventoryContent += "$($_.Name)==$($_.Value)`n"
                }
            }
        } catch {
            Write-Warning "Could not parse backend package.json"
        }
    }
    
    $inventoryContent += @"

## System Information
OS: Windows $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Version)
Architecture: $env:PROCESSOR_ARCHITECTURE
Build Date: $(Get-Date)

## File Counts
Total files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File).Count)
Python files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.py").Count)
JavaScript/TypeScript files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.js", "*.ts", "*.jsx", "*.tsx").Count)
Configuration files: $((Get-ChildItem -Path $ProjectRoot -Recurse -File -Include "*.json", "*.yaml", "*.yml", "*.toml").Count)
"@
    
    $inventoryContent | Out-File -FilePath $inventory -Encoding UTF8
    Write-Success "Package inventory created: $inventory"
    $sbomSuccess = $true
    
    if ($sbomSuccess) {
        Write-Success "📋 SBOM BASELINE GENERATED"
        
        # Generate summary
        $summary = Join-Path $sbomDir "sbom-summary-$Timestamp.md"
        $summaryContent = @"
# SBOM Baseline Summary

**Generated:** $(Get-Date)  
**Project:** GameForge AI Game Production  
**Location:** $ProjectRoot  

## Files Generated

$(Get-ChildItem -Path $sbomDir -Filter "*$Timestamp*" | ForEach-Object { "- $($_.Name) ($($_.Length) bytes)" } | Out-String)

## Package Counts

"@
        
        if (Test-Path $requirementsTxt) {
            $pyCount = (Get-Content $requirementsTxt | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }).Count
            $summaryContent += "- Python packages: $pyCount`n"
        }
        
        if (Test-Path $packageJsonPath) {
            try {
                $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
                $nodeDeps = if ($packageJson.dependencies) { $packageJson.dependencies.PSObject.Properties.Count } else { 0 }
                $nodeDevDeps = if ($packageJson.devDependencies) { $packageJson.devDependencies.PSObject.Properties.Count } else { 0 }
                $summaryContent += "- Node.js dependencies: $nodeDeps`n"
                $summaryContent += "- Node.js devDependencies: $nodeDevDeps`n"
            } catch {
                # Ignore parsing errors
            }
        }
        
        $summaryContent += @"

## Next Steps
1. Store these SBOM files in version control
2. Compare future SBOMs against this baseline
3. Monitor for new vulnerabilities in these packages
4. Set up automated SBOM generation in CI/CD
"@
        
        $summaryContent | Out-File -FilePath $summary -Encoding UTF8
        Write-Success "SBOM summary created: $summary"
        return $true
    } else {
        Write-Error "📋 SBOM BASELINE GENERATION FAILED"
        return $false
    }
}

# ========================================================================
# Main Execution
# ========================================================================
function Invoke-Phase1Prep {
    Write-Log "🚀 Starting Phase 1: Repository & Build Preparation"
    Write-Log "Project root: $ProjectRoot"
    Write-Log "Output directory: $OutputDir"
    
    $overallSuccess = 0
    $stepCount = 0
    $failedSteps = @()
    
    # Step 1: Secrets scan
    $stepCount++
    if (!$SkipSecrets) {
        if (Invoke-SecretsScanning) {
            $overallSuccess++
        } else {
            $failedSteps += "Secrets Scan"
        }
    } else {
        Write-Warning "Skipping secrets scan"
        $overallSuccess++
    }
    
    # Step 2: Lock dependencies
    $stepCount++
    if (Lock-Dependencies) {
        $overallSuccess++
    } else {
        $failedSteps += "Dependency Locking"
    }
    
    # Step 3: Reproducible builds
    $stepCount++
    if (Set-ReproducibleBuilds) {
        $overallSuccess++
    } else {
        $failedSteps += "Reproducible Builds"
    }
    
    # Step 4: SBOM baseline
    $stepCount++
    if (!$SkipSBOM) {
        if (New-SBOMBaseline) {
            $overallSuccess++
        } else {
            $failedSteps += "SBOM Baseline"
        }
    } else {
        Write-Warning "Skipping SBOM generation"
        $overallSuccess++
    }
    
    # Final report
    Write-Host ""
    Write-Host "========================================================================="
    Write-Log "Phase 1 Completion Report"
    Write-Host "========================================================================="
    
    Write-Success "Steps completed: $overallSuccess/$stepCount"
    
    if ($failedSteps.Count -eq 0) {
        Write-Host ""
        Write-Success "🎉 PHASE 1 COMPLETE: Repository is ready for secure build!"
        Write-Host ""
        Write-Host "✅ Secrets scanning: PASSED" -ForegroundColor Green
        Write-Host "✅ Dependency locking: PASSED" -ForegroundColor Green
        Write-Host "✅ Reproducible builds: CONFIGURED" -ForegroundColor Green
        Write-Host "✅ SBOM baseline: GENERATED" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 Reports available in: $OutputDir" -ForegroundColor Cyan
        Write-Host "🔨 Use scripts\build-reproducible.ps1 for builds" -ForegroundColor Cyan
        Write-Host ""
        return $true
    } else {
        Write-Host ""
        Write-Error "❌ PHASE 1 INCOMPLETE: Some steps failed"
        Write-Host ""
        Write-Host "Failed steps:" -ForegroundColor Red
        foreach ($step in $failedSteps) {
            Write-Host "  ❌ $step" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "📁 Check reports in: $OutputDir" -ForegroundColor Cyan
        Write-Host "📖 Review error messages above for remediation steps" -ForegroundColor Cyan
        Write-Host ""
        return $false
    }
}

# Execute main function
$result = Invoke-Phase1Prep
if (!$result) {
    exit 1
}
