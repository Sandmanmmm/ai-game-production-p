# GameForge Enhanced Security Scanning
# ====================================
# Comprehensive security scanning with installed tools
# Includes: TruffleHog3, pattern matching, file analysis

param(
    [string]$OutputDir = ".\security-reports",
    [switch]$Verbose = $false,
    [string]$ScanScope = "all"  # all, secrets, files, dependencies
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "=== GameForge Enhanced Security Scan ===" -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "Scope: $ScanScope" -ForegroundColor Gray

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

# ============================================================================
# Function: Advanced Secret Detection
# ============================================================================
function Invoke-AdvancedSecretScan {
    param([string]$ReportPath)
    
    Write-Host "`n--- Advanced Secret Detection ---" -ForegroundColor Yellow
    
    $secretReport = @"
# Enhanced Secret Scan Report - $timestamp
# =============================================

## TruffleHog3 Scan Results

"@
    
    try {
        Write-Host "Running TruffleHog3 scan..." -ForegroundColor White
        $truffleOutput = python -c "
import trufflehog3
import json
import os

# Initialize TruffleHog3
th = trufflehog3.TruffleHog()

# Scan current directory
results = th.scan_directory('.')

# Process results
findings = []
for result in results:
    if hasattr(result, '__dict__'):
        finding = {
            'file': getattr(result, 'file', 'unknown'),
            'reason': getattr(result, 'reason', 'unknown'),
            'line': getattr(result, 'line', 0),
            'type': getattr(result, 'type', 'unknown')
        }
        findings.append(finding)

print(f'Total findings: {len(findings)}')
for finding in findings[:10]:  # Limit output
    print(f'File: {finding[\"file\"]}')
    print(f'Reason: {finding[\"reason\"]}')
    print(f'Line: {finding[\"line\"]}')
    print('---')
"
        
        $secretReport += $truffleOutput
        Write-Host "✓ TruffleHog3 scan completed" -ForegroundColor Green
        
    } catch {
        Write-Host "⚠ TruffleHog3 scan failed: $($_.Exception.Message)" -ForegroundColor Yellow
        $secretReport += "`nTruffleHog3 scan failed: $($_.Exception.Message)`n"
    }
    
    # Enhanced pattern matching
    Write-Host "Running enhanced pattern detection..." -ForegroundColor White
    
    $dangerousPatterns = @(
        @{Pattern="[A-Za-z0-9+/]{40,}"; Name="Base64 encoded data"}
        @{Pattern="(?i)(password|pwd|pass)\s*[:=]\s*[^\s]+"; Name="Password assignment"}
        @{Pattern="(?i)(api[_-]?key|apikey)\s*[:=]\s*[^\s]+"; Name="API key"}
        @{Pattern="(?i)(secret[_-]?key|secretkey)\s*[:=]\s*[^\s]+"; Name="Secret key"}
        @{Pattern="(?i)(token)\s*[:=]\s*[^\s]+"; Name="Token"}
        @{Pattern="(?i)(private[_-]?key|privatekey)"; Name="Private key reference"}
        @{Pattern="-----BEGIN [A-Z ]+-----"; Name="PEM encoded certificate/key"}
        @{Pattern="(?i)mongodb://[^\s]+"; Name="MongoDB connection string"}
        @{Pattern="(?i)mysql://[^\s]+"; Name="MySQL connection string"}
        @{Pattern="(?i)postgres://[^\s]+"; Name="PostgreSQL connection string"}
    )
    
    $secretReport += "`n## Pattern-Based Detection`n"
    
    $excludePatterns = @("*.git*", "*.venv*", "*node_modules*", "*backup_local_changes*", "*.log")
    
    foreach ($pattern in $dangerousPatterns) {
        try {
            $findings = Select-String -Path "." -Pattern $pattern.Pattern -Recurse -Exclude $excludePatterns | 
                        Where-Object { $_.Line -notmatch "^\s*#" } | 
                        Select-Object -First 5
            
            if ($findings) {
                $secretReport += "`n### $($pattern.Name)`n"
                foreach ($finding in $findings) {
                    $relativePath = $finding.Filename -replace [regex]::Escape((Get-Location).Path), "."
                    $secretReport += "- File: $relativePath (Line $($finding.LineNumber))`n"
                }
            }
        } catch {
            Write-Host "Pattern scan error for $($pattern.Name): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # File analysis
    Write-Host "Analyzing sensitive files..." -ForegroundColor White
    $secretReport += "`n## Sensitive File Analysis`n"
    
    $sensitiveFiles = Get-ChildItem -Recurse -Include "*.env", "*.key", "*.pem", "*.p12", "*.pfx", "*.crt" -ErrorAction SilentlyContinue |
                     Where-Object { $_.FullName -notmatch "(\.git|\.venv|node_modules|backup_local_changes)" }
    
    foreach ($file in $sensitiveFiles) {
        $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path), "."
        $size = [math]::Round($file.Length / 1KB, 2)
        $modTime = $file.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
        $secretReport += "- $relativePath ($size KB) - Modified: $modTime`n"
    }
    
    $secretReport | Out-File -FilePath $ReportPath -Encoding UTF8
    Write-Host "✓ Secret scan report saved: $ReportPath" -ForegroundColor Green
}

# ============================================================================
# Function: Dependency Security Analysis
# ============================================================================
function Invoke-DependencySecurityScan {
    param([string]$ReportPath)
    
    Write-Host "`n--- Dependency Security Analysis ---" -ForegroundColor Yellow
    
    $depReport = @"
# Dependency Security Scan - $timestamp
# ========================================

## Python Dependencies Analysis

"@
    
    # Check for known vulnerable packages
    if (Test-Path "requirements.txt") {
        Write-Host "Analyzing Python dependencies..." -ForegroundColor White
        
        try {
            $pipOutput = pip list --format=json | ConvertFrom-Json
            $depReport += "Total Python packages: $($pipOutput.Count)`n`n"
            
            # Check for common vulnerable packages
            $vulnerablePatterns = @("django==1.*", "flask==0.*", "requests==2.0.*", "urllib3==1.2.*")
            
            foreach ($pkg in $pipOutput) {
                foreach ($pattern in $vulnerablePatterns) {
                    if ($pkg.name -match $pattern.Split("==")[0]) {
                        $depReport += "⚠ Potentially vulnerable: $($pkg.name) $($pkg.version)`n"
                    }
                }
            }
            
        } catch {
            $depReport += "Error analyzing Python dependencies: $($_.Exception.Message)`n"
        }
    }
    
    # Check Node.js dependencies
    if (Test-Path "package.json") {
        Write-Host "Analyzing Node.js dependencies..." -ForegroundColor White
        $depReport += "`n## Node.js Dependencies Analysis`n"
        
        try {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                $npmAudit = npm audit --json 2>$null | ConvertFrom-Json
                if ($npmAudit.metadata) {
                    $depReport += "Vulnerabilities found: $($npmAudit.metadata.vulnerabilities.total)`n"
                    $depReport += "- High: $($npmAudit.metadata.vulnerabilities.high)`n"
                    $depReport += "- Medium: $($npmAudit.metadata.vulnerabilities.moderate)`n"
                    $depReport += "- Low: $($npmAudit.metadata.vulnerabilities.low)`n"
                }
            } else {
                $depReport += "npm not available for dependency audit`n"
            }
        } catch {
            $depReport += "Error running npm audit: $($_.Exception.Message)`n"
        }
    }
    
    $depReport | Out-File -FilePath $ReportPath -Encoding UTF8
    Write-Host "✓ Dependency security report saved: $ReportPath" -ForegroundColor Green
}

# ============================================================================
# Function: Configuration Security Check
# ============================================================================
function Invoke-ConfigSecurityScan {
    param([string]$ReportPath)
    
    Write-Host "`n--- Configuration Security Check ---" -ForegroundColor Yellow
    
    $configReport = @"
# Configuration Security Report - $timestamp
# ==========================================

## Docker Configuration Analysis

"@
    
    # Docker security checks
    $dockerfiles = Get-ChildItem -Name "Dockerfile*" -ErrorAction SilentlyContinue
    foreach ($dockerfile in $dockerfiles) {
        Write-Host "Analyzing $dockerfile..." -ForegroundColor White
        $content = Get-Content $dockerfile -Raw
        
        $configReport += "`n### $dockerfile`n"
        
        # Security checks
        if ($content -match "USER root|USER 0") {
            $configReport += "⚠ Running as root user detected`n"
        }
        if ($content -notmatch "USER \d+") {
            $configReport += "⚠ No explicit non-root user specified`n"
        }
        if ($content -match "ADD.*http") {
            $configReport += "⚠ Using ADD with remote URLs (security risk)`n"
        }
        if ($content -match "--privileged") {
            $configReport += "⚠ Privileged containers detected`n"
        }
        if ($content -notmatch "HEALTHCHECK") {
            $configReport += "ℹ No health check defined`n"
        } else {
            $configReport += "✓ Health check configured`n"
        }
    }
    
    # Docker Compose security
    if (Test-Path "docker-compose.yml") {
        Write-Host "Analyzing docker-compose.yml..." -ForegroundColor White
        $composeContent = Get-Content "docker-compose.yml" -Raw
        
        $configReport += "`n### docker-compose.yml`n"
        
        if ($composeContent -match "privileged:\s*true") {
            $configReport += "⚠ Privileged containers in compose`n"
        }
        if ($composeContent -match "network_mode:\s*host") {
            $configReport += "⚠ Host networking mode (security risk)`n"
        }
        if ($composeContent -match "volumes:.*:/var/run/docker.sock") {
            $configReport += "⚠ Docker socket mounted (high risk)`n"
        }
        if ($composeContent -match "read_only:\s*true") {
            $configReport += "✓ Read-only containers detected`n"
        }
        if ($composeContent -match "cap_drop") {
            $configReport += "✓ Capability dropping configured`n"
        }
    }
    
    $configReport | Out-File -FilePath $ReportPath -Encoding UTF8
    Write-Host "✓ Configuration security report saved: $ReportPath" -ForegroundColor Green
}

# ============================================================================
# Main Execution
# ============================================================================

Write-Host "`nStarting enhanced security scan..." -ForegroundColor Green
Write-Host "Output directory: $OutputDir" -ForegroundColor Gray

try {
    # Run scans based on scope
    if ($ScanScope -eq "all" -or $ScanScope -eq "secrets") {
        Invoke-AdvancedSecretScan -ReportPath "$OutputDir\secrets-scan-$timestamp.md"
    }
    
    if ($ScanScope -eq "all" -or $ScanScope -eq "dependencies") {
        Invoke-DependencySecurityScan -ReportPath "$OutputDir\dependency-scan-$timestamp.md"
    }
    
    if ($ScanScope -eq "all" -or $ScanScope -eq "config") {
        Invoke-ConfigSecurityScan -ReportPath "$OutputDir\config-scan-$timestamp.md"
    }
    
    # Generate summary report
    $summaryReport = @"
# GameForge Security Scan Summary - $timestamp
# =============================================

## Scan Overview
- Scope: $ScanScope
- Timestamp: $timestamp
- Output Directory: $OutputDir

## Reports Generated
"@
    
    $reports = Get-ChildItem -Path $OutputDir -Filter "*$timestamp*" | Sort-Object Name
    foreach ($report in $reports) {
        $summaryReport += "- $($report.Name)`n"
    }
    
    $summaryReport += @"

## Next Steps
1. Review individual reports for detailed findings
2. Address high-priority security issues
3. Update .gitignore to exclude sensitive files
4. Consider implementing pre-commit hooks
5. Schedule regular security scans

## Quick Actions
```powershell
# Review secret findings
Get-Content '$OutputDir\secrets-scan-$timestamp.md'

# Check dependencies
Get-Content '$OutputDir\dependency-scan-$timestamp.md'

# Review configurations
Get-Content '$OutputDir\config-scan-$timestamp.md'
```
"@
    
    $summaryReport | Out-File -FilePath "$OutputDir\summary-$timestamp.md" -Encoding UTF8
    
    Write-Host "`n=== SCAN COMPLETED ===" -ForegroundColor Green
    Write-Host "Summary report: $OutputDir\summary-$timestamp.md" -ForegroundColor Yellow
    Write-Host "`nRecommendations:" -ForegroundColor Cyan
    Write-Host "1. Review all generated reports" -ForegroundColor White
    Write-Host "2. Secure or encrypt sensitive files" -ForegroundColor White
    Write-Host "3. Update dependencies with vulnerabilities" -ForegroundColor White
    Write-Host "4. Implement security hardening for Docker" -ForegroundColor White
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nEnhanced security scan completed successfully!" -ForegroundColor Green
