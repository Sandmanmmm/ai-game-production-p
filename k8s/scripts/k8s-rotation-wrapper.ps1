#!/usr/bin/env pwsh
# Kubernetes-aware wrapper for enterprise secret rotation

param(
    [Parameter(Mandatory=$true)]
    [string]$SecretType,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$ForceRotation
)

# Kubernetes environment detection
$env:RUNNING_IN_K8S = "true"
$env:K8S_NAMESPACE = if ($env:POD_NAMESPACE) { $env:POD_NAMESPACE } else { "gameforge-security" }
$env:K8S_POD_NAME = $env:HOSTNAME

# Set Vault configuration from Kubernetes secrets
if (Test-Path "/vault/secrets/token") {
    $env:VAULT_TOKEN = Get-Content "/vault/secrets/token" -Raw
}
if (Test-Path "/vault/secrets/addr") {
    $env:VAULT_ADDR = Get-Content "/vault/secrets/addr" -Raw
}

# Set notification configurations
if (Test-Path "/notifications/slack-webhook") {
    $env:SLACK_WEBHOOK_URL = Get-Content "/notifications/slack-webhook" -Raw
}

# Create health indicator
New-Item -Path "/app/state/health.txt" -ItemType File -Force | Out-Null
Set-Content -Path "/app/state/health.txt" -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Starting rotation for $SecretType"

try {
    # Execute rotation with Kubernetes-specific parameters
    $params = @{
        SecretType = $SecretType
        Environment = "production"
        ConfigPath = "/app/config/secret-rotation-config.yml"
    }
    
    if ($DryRun) { $params.DryRun = $true }
    if ($ForceRotation) { $params.ForceRotation = $true }
    
    Write-Host "[K8S] Starting secret rotation in Kubernetes environment"
    Write-Host "[K8S] Namespace: $env:K8S_NAMESPACE"
    Write-Host "[K8S] Pod: $env:K8S_POD_NAME"
    Write-Host "[K8S] Secret Type: $SecretType"
    
    & /app/enterprise-secret-rotation.ps1 @params
    
    # Update health status
    Set-Content -Path "/app/state/health.txt" -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Completed rotation for $SecretType"
    
    # Create Kubernetes event for successful rotation
    if (Get-Command kubectl -ErrorAction SilentlyContinue) {
        $eventData = @{
            apiVersion = "v1"
            kind = "Event"
            metadata = @{
                name = "secret-rotation-$SecretType-$(Get-Date -Format 'yyyyMMddHHmmss')"
                namespace = $env:K8S_NAMESPACE
            }
            involvedObject = @{
                apiVersion = "batch/v1"
                kind = "CronJob"
                name = "secret-rotation-$SecretType"
                namespace = $env:K8S_NAMESPACE
            }
            reason = "RotationCompleted"
            message = "Successfully rotated $SecretType secrets"
            type = "Normal"
            firstTime = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
            lastTime = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
            count = 1
        }
        
        $eventJson = $eventData | ConvertTo-Json -Depth 10
        $eventJson | kubectl apply -f - 2>$null
    }
    
    Write-Host "[K8S] Secret rotation completed successfully"
    exit 0
    
} catch {
    Write-Error "[K8S] Secret rotation failed: $_"
    
    # Update health status with error
    Set-Content -Path "/app/state/health.txt" -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - FAILED rotation for $SecretType - $_"
    
    # Create Kubernetes event for failed rotation
    if (Get-Command kubectl -ErrorAction SilentlyContinue) {
        $eventData = @{
            apiVersion = "v1"
            kind = "Event"
            metadata = @{
                name = "secret-rotation-$SecretType-error-$(Get-Date -Format 'yyyyMMddHHmmss')"
                namespace = $env:K8S_NAMESPACE
            }
            involvedObject = @{
                apiVersion = "batch/v1"
                kind = "CronJob"
                name = "secret-rotation-$SecretType"
                namespace = $env:K8S_NAMESPACE
            }
            reason = "RotationFailed"
            message = "Failed to rotate $SecretType secrets: $_"
            type = "Warning"
            firstTime = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
            lastTime = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
            count = 1
        }
        
        $eventJson = $eventData | ConvertTo-Json -Depth 10
        $eventJson | kubectl apply -f - 2>$null
    }
    
    exit 1
}
