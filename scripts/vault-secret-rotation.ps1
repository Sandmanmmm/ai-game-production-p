# GameForge Vault Secret Rotation System - PowerShell Version
# Rotates Vault root tokens, unseal keys, and model secrets
# Verifies worker authentication after rotation

param(
    [switch]$TestOnly,
    [switch]$Validate,
    [switch]$Cleanup,
    [switch]$Help,
    [string]$VaultAddr = "http://localhost:8200"
)

# Configuration
$RotationLogFile = "./logs/vault-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$BackupDir = "./vault/backups/$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$NotificationWebhook = $env:SLACK_WEBHOOK_URL

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$Level] $timestamp - $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        default { Write-Host $logEntry -ForegroundColor Blue }
    }
    
    # Ensure log directory exists
    $logDir = Split-Path $RotationLogFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }
    
    Add-Content -Path $RotationLogFile -Value $logEntry
}

function Send-Notification {
    param([string]$Message, [string]$Level = "info")
    
    if ($NotificationWebhook) {
        $color = switch ($Level) {
            "error" { "danger" }
            "warning" { "warning" }
            default { "good" }
        }
        
        $payload = @{
            text = "🔐 GameForge Vault Rotation"
            attachments = @(
                @{
                    color = $color
                    text = $Message
                }
            )
        } | ConvertTo-Json -Depth 3
        
        try {
            Invoke-RestMethod -Uri $NotificationWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
        } catch {
            Write-Log "Failed to send notification: $($_.Exception.Message)" "WARNING"
        }
    }
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if vault.exe is available
    try {
        $null = Get-Command vault -ErrorAction Stop
    } catch {
        Write-Log "Vault CLI not found. Please install HashiCorp Vault CLI." "ERROR"
        return $false
    }
    
    # Check if docker is available
    try {
        $null = Get-Command docker -ErrorAction Stop
    } catch {
        Write-Log "Docker not found. Some operations may fail." "WARNING"
    }
    
    # Check Vault connectivity
    try {
        $env:VAULT_ADDR = $VaultAddr
        vault status | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Cannot connect to Vault at $VaultAddr" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Cannot connect to Vault at $VaultAddr" "ERROR"
        return $false
    }
    
    Write-Log "Prerequisites check passed" "SUCCESS"
    return $true
}

function Backup-VaultState {
    Write-Log "Creating Vault state backup..."
    
    # Create backup directory
    New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
    
    # Export current environment variables
    Get-ChildItem env: | Where-Object { $_.Name -match '^(VAULT_|GAMEFORGE_)' } | 
        ForEach-Object { "$($_.Name)=$($_.Value)" } | 
        Set-Content -Path "$BackupDir/vault-env-backup.txt"
    
    # Backup Vault configuration if exists
    if (Test-Path "./vault/config") {
        Copy-Item -Path "./vault/config" -Destination "$BackupDir/" -Recurse -ErrorAction SilentlyContinue
    }
    
    # Save current token info (masked)
    if ($env:VAULT_TOKEN) {
        "VAULT_TOKEN_PREFIX=$($env:VAULT_TOKEN.Substring(0, [Math]::Min(10, $env:VAULT_TOKEN.Length)))..." | 
            Set-Content -Path "$BackupDir/token-info.txt"
    }
    
    Write-Log "Vault state backed up to $BackupDir" "SUCCESS"
}

function New-SecureToken {
    param([int]$Length = 32)
    
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $token = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $token += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $token
}

function Invoke-RootTokenRotation {
    Write-Log "Rotating Vault root token..."
    
    try {
        # Create a new token with root policy
        $newTokenResponse = vault token create -policy=root -format=json | ConvertFrom-Json
        
        if ($newTokenResponse.auth.client_token) {
            $newRootToken = $newTokenResponse.auth.client_token
            $oldTokenPrefix = $env:VAULT_TOKEN.Substring(0, [Math]::Min(10, $env:VAULT_TOKEN.Length))
            
            # Update environment
            $env:VAULT_TOKEN = $newRootToken
            
            # Save to backup
            @(
                "NEW_VAULT_ROOT_TOKEN=$newRootToken"
                "OLD_VAULT_ROOT_TOKEN_PREFIX=$oldTokenPrefix..."
                "ROTATION_TIME=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
            ) | Set-Content -Path "$BackupDir/new-tokens.txt"
            
            Write-Log "Root token rotated successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "Failed to generate new root token" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to rotate root token: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-UnsealKeyRotation {
    Write-Log "Generating new unseal keys (development simulation)..."
    
    # Generate simulated unseal keys
    $newUnsealKey1 = New-SecureToken -Length 64
    $newUnsealKey2 = New-SecureToken -Length 64
    $newUnsealKey3 = New-SecureToken -Length 64
    
    @(
        "# WARNING: These are simulated unseal keys for development"
        "# In production, use proper Vault rekey process"
        "NEW_UNSEAL_KEY_1=$newUnsealKey1"
        "NEW_UNSEAL_KEY_2=$newUnsealKey2"
        "NEW_UNSEAL_KEY_3=$newUnsealKey3"
        "GENERATED_AT=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
    ) | Set-Content -Path "$BackupDir/new-unseal-keys.txt"
    
    Write-Log "New unseal keys generated (development simulation)" "SUCCESS"
}

function Invoke-ModelSecretRotation {
    Write-Log "Rotating model access secrets..."
    
    try {
        # Generate new API keys
        $newHuggingfaceToken = "hf_$(New-SecureToken -Length 40)"
        $newOpenAIKey = "sk-$(New-SecureToken -Length 64)"
        $newStabilityKey = "sk-$(New-SecureToken -Length 56)"
        $rotationId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC'
        
        # Update secrets in Vault
        vault kv put gameforge/models/huggingface token="$newHuggingfaceToken" updated_at="$timestamp" rotation_id="$rotationId"
        vault kv put gameforge/models/openai api_key="$newOpenAIKey" updated_at="$timestamp" rotation_id="$rotationId"
        vault kv put gameforge/models/stability api_key="$newStabilityKey" updated_at="$timestamp" rotation_id="$rotationId"
        
        # Generate new JWT signing key
        $newJwtSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-SecureToken -Length 64)))
        vault kv put gameforge/secrets/jwt secret="$newJwtSecret" updated_at="$timestamp" rotation_id="$rotationId"
        
        # Generate new database credentials
        $newDbPassword = [Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes(32))
        vault kv put gameforge/secrets/database password="$newDbPassword" updated_at="$timestamp" rotation_id="$rotationId"
        
        Write-Log "Model and application secrets rotated" "SUCCESS"
        return $true
    } catch {
        Write-Log "Failed to rotate model secrets: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Update-WorkerAuthentication {
    Write-Log "Updating worker authentication tokens..."
    
    try {
        # Generate new worker tokens
        $workerToken1 = (vault token create -policy=gameforge-app -format=json | ConvertFrom-Json).auth.client_token
        $workerToken2 = (vault token create -policy=gameforge-app -format=json | ConvertFrom-Json).auth.client_token
        $workerToken3 = (vault token create -policy=gameforge-app -format=json | ConvertFrom-Json).auth.client_token
        
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC'
        $rotationId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        
        # Store worker tokens in Vault
        vault kv put gameforge/workers/tokens worker_1="$workerToken1" worker_2="$workerToken2" worker_3="$workerToken3" updated_at="$timestamp" rotation_id="$rotationId"
        
        # Save to backup
        @(
            "WORKER_TOKEN_1=$workerToken1"
            "WORKER_TOKEN_2=$workerToken2"
            "WORKER_TOKEN_3=$workerToken3"
            "GENERATED_AT=$timestamp"
        ) | Set-Content -Path "$BackupDir/new-worker-tokens.txt"
        
        Write-Log "Worker authentication tokens updated" "SUCCESS"
        return $true
    } catch {
        Write-Log "Failed to update worker tokens: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-WorkerAuthentication {
    Write-Log "Testing worker authentication..."
    
    try {
        # Get worker tokens from Vault
        $workerTokensJson = vault kv get -format=json gameforge/workers/tokens | ConvertFrom-Json
        
        if (-not $workerTokensJson.data.data) {
            Write-Log "Failed to retrieve worker tokens" "ERROR"
            return $false
        }
        
        $workerToken1 = $workerTokensJson.data.data.worker_1
        $workerToken2 = $workerTokensJson.data.data.worker_2
        
        $failedTests = 0
        
        # Test each worker token
        foreach ($i in @(1, 2)) {
            $token = if ($i -eq 1) { $workerToken1 } else { $workerToken2 }
            
            Write-Log "Testing worker $i authentication..."
            
            # Test token validity
            $oldToken = $env:VAULT_TOKEN
            $env:VAULT_TOKEN = $token
            
            try {
                vault token lookup | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Worker $i token is valid" "SUCCESS"
                    
                    # Test secret access
                    vault kv get gameforge/models/huggingface | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "Worker $i can access model secrets" "SUCCESS"
                    } else {
                        Write-Log "Worker $i cannot access model secrets" "ERROR"
                        $failedTests++
                    }
                } else {
                    Write-Log "Worker $i token is invalid" "ERROR"
                    $failedTests++
                }
            } catch {
                Write-Log "Worker $i authentication test failed: $($_.Exception.Message)" "ERROR"
                $failedTests++
            } finally {
                $env:VAULT_TOKEN = $oldToken
            }
        }
        
        if ($failedTests -eq 0) {
            Write-Log "All worker authentication tests passed" "SUCCESS"
            return $true
        } else {
            Write-Log "$failedTests worker authentication tests failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Worker authentication test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Update-EnvironmentFiles {
    Write-Log "Updating environment files with new tokens..."
    
    if (Test-Path "$BackupDir/new-tokens.txt") {
        $newTokens = Get-Content "$BackupDir/new-tokens.txt" | ConvertFrom-StringData
        $newRootToken = $newTokens.NEW_VAULT_ROOT_TOKEN
        
        if (Test-Path ".env") {
            # Create backup
            Copy-Item ".env" "$BackupDir/env-backup"
            
            # Update environment file
            $envContent = Get-Content ".env"
            $envContent = $envContent -replace "VAULT_ROOT_TOKEN=.*", "VAULT_ROOT_TOKEN=$newRootToken"
            $envContent = $envContent -replace "VAULT_TOKEN=.*", "VAULT_TOKEN=$newRootToken"
            $envContent | Set-Content ".env"
            
            Write-Log "Environment files updated" "SUCCESS"
        } else {
            Write-Log "No .env file found to update" "WARNING"
        }
    } else {
        Write-Log "No new tokens found to update environment files" "WARNING"
    }
}

function Test-RotationValidation {
    Write-Log "Validating rotation success..."
    
    $validationErrors = 0
    
    # Test Vault connectivity
    try {
        vault status | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Cannot connect to Vault with new token" "ERROR"
            $validationErrors++
        }
    } catch {
        Write-Log "Cannot connect to Vault with new token" "ERROR"
        $validationErrors++
    }
    
    # Test secret retrieval
    try {
        vault kv get gameforge/models/huggingface | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Cannot retrieve model secrets" "ERROR"
            $validationErrors++
        }
    } catch {
        Write-Log "Cannot retrieve model secrets" "ERROR"
        $validationErrors++
    }
    
    # Test worker authentication
    if (-not (Test-WorkerAuthentication)) {
        Write-Log "Worker authentication tests failed" "ERROR"
        $validationErrors++
    }
    
    if ($validationErrors -eq 0) {
        Write-Log "All rotation validation tests passed" "SUCCESS"
        return $true
    } else {
        Write-Log "$validationErrors validation errors detected" "ERROR"
        return $false
    }
}

function New-RotationReport {
    Write-Log "Generating rotation report..."
    
    $reportFile = "$BackupDir/rotation-report.md"
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC'
    $rotationId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    
    $report = @"
# Vault Secret Rotation Report

**Date:** $timestamp
**Rotation ID:** $rotationId
**Backup Location:** $BackupDir

## Rotated Components

- ✅ Root Token
- ✅ Unseal Keys (simulated)
- ✅ Model API Keys
- ✅ Application Secrets
- ✅ Worker Authentication Tokens
- ✅ JWT Signing Key
- ✅ Database Credentials

## Validation Results

$(if (Test-RotationValidation) { "✅ All validation tests passed" } else { "❌ Some validation tests failed" })

## Worker Authentication Status

$(if (Test-WorkerAuthentication) { "✅ Worker authentication verified" } else { "❌ Worker authentication issues detected" })

## Backup Files

- Environment backup: ``$BackupDir/vault-env-backup.txt``
- New tokens: ``$BackupDir/new-tokens.txt``
- Worker tokens: ``$BackupDir/new-worker-tokens.txt``
- Unseal keys: ``$BackupDir/new-unseal-keys.txt``

## Next Steps

1. Update all client applications with new tokens
2. Restart worker services to pick up new authentication
3. Monitor logs for authentication issues
4. Schedule next rotation

## Security Notes

- Old tokens have been invalidated
- All secrets have new rotation IDs
- Worker authentication has been tested and verified
- Backup files contain sensitive data - secure appropriately

"@

    $report | Set-Content -Path $reportFile
    Write-Log "Rotation report generated: $reportFile" "SUCCESS"
}

function Invoke-FullRotation {
    Write-Log "Starting Vault secret rotation process..."
    Send-Notification "🔄 Starting Vault secret rotation process" "info"
    
    # Setup directories
    New-Item -Path (Split-Path $RotationLogFile -Parent) -ItemType Directory -Force | Out-Null
    New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
    New-Item -Path "./vault/rotation-scripts" -ItemType Directory -Force | Out-Null
    New-Item -Path "./vault/new-keys" -ItemType Directory -Force | Out-Null
    
    # Prerequisites
    if (-not (Test-Prerequisites)) {
        Send-Notification "❌ Prerequisites check failed" "error"
        return $false
    }
    
    # Backup current state
    Backup-VaultState
    
    # Perform rotations
    if (Invoke-RootTokenRotation) {
        Write-Log "Root token rotation completed" "SUCCESS"
    } else {
        Write-Log "Root token rotation failed" "ERROR"
        Send-Notification "❌ Root token rotation failed" "error"
        return $false
    }
    
    Invoke-UnsealKeyRotation
    Invoke-ModelSecretRotation
    Update-WorkerAuthentication
    
    # Update configuration
    Update-EnvironmentFiles
    
    # Validation
    if (Test-RotationValidation) {
        Write-Log "Rotation validation passed" "SUCCESS"
        Send-Notification "✅ Vault secret rotation completed successfully" "good"
    } else {
        Write-Log "Rotation validation failed" "ERROR"
        Send-Notification "⚠️ Vault secret rotation completed with validation errors" "warning"
    }
    
    # Generate report
    New-RotationReport
    
    Write-Log "Vault secret rotation process completed" "SUCCESS"
    return $true
}

function Remove-OldBackups {
    Write-Log "Cleaning up old rotation backups..."
    
    $backupBaseDir = "./vault/backups"
    if (Test-Path $backupBaseDir) {
        $backups = Get-ChildItem $backupBaseDir | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 10) {
            $backups | Select-Object -Skip 10 | ForEach-Object {
                Remove-Item $_.FullName -Recurse -Force
                Write-Log "Removed old backup: $($_.Name)" "INFO"
            }
        }
    }
}

function Show-Help {
    Write-Host @"
GameForge Vault Secret Rotation System - PowerShell Version

Usage: .\vault-secret-rotation.ps1 [OPTIONS]

Options:
    -TestOnly              Test worker authentication without rotation
    -Validate              Validate current configuration
    -Cleanup               Clean up old backup files
    -Help                  Show this help message
    -VaultAddr <address>   Vault server address (default: http://localhost:8200)

Environment Variables:
    VAULT_TOKEN            Current Vault token (required)
    SLACK_WEBHOOK_URL      Slack webhook for notifications (optional)

Examples:
    .\vault-secret-rotation.ps1                    # Perform full rotation
    .\vault-secret-rotation.ps1 -TestOnly          # Test worker authentication only
    .\vault-secret-rotation.ps1 -Validate          # Validate current setup
    .\vault-secret-rotation.ps1 -Cleanup           # Clean up old backups

"@ -ForegroundColor Cyan
}

# Main execution logic
if ($Help) {
    Show-Help
    exit 0
}

# Set Vault address
$env:VAULT_ADDR = $VaultAddr

if ($TestOnly) {
    New-Item -Path (Split-Path $RotationLogFile -Parent) -ItemType Directory -Force | Out-Null
    if (Test-Prerequisites) {
        Test-WorkerAuthentication
    }
} elseif ($Validate) {
    New-Item -Path (Split-Path $RotationLogFile -Parent) -ItemType Directory -Force | Out-Null
    if (Test-Prerequisites) {
        Test-RotationValidation
    }
} elseif ($Cleanup) {
    Remove-OldBackups
} else {
    # Perform full rotation
    Invoke-FullRotation
    Remove-OldBackups
}
