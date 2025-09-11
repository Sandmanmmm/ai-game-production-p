# Docker Diagnostic and Restart Script
# This script checks Docker status and restarts it if needed

param(
    [switch]$Restart,
    [switch]$Verbose
)

Set-StrictMode -Version Latest

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-DockerStatus {
    Write-Log "Checking Docker status..."
    
    try {
        # Quick test with timeout
        $job = Start-Job -ScriptBlock { docker version --format '{{.Server.Version}}' }
        if (Wait-Job $job -Timeout 10) {
            $result = Receive-Job $job
            Remove-Job $job
            if ($result) {
                Write-Log "Docker is responsive - Version: $result" -Level "SUCCESS"
                return $true
            }
        } else {
            Write-Log "Docker command timed out" -Level "WARNING"
            Remove-Job $job -Force
        }
    }
    catch {
        Write-Log "Docker command failed: $($_.Exception.Message)" -Level "ERROR"
    }
    
    return $false
}

function Stop-DockerProcesses {
    Write-Log "Stopping Docker processes..."
    
    try {
        # Stop Docker Desktop processes
        Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "com.docker.backend" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "dockerd" -ErrorAction SilentlyContinue | Stop-Process -Force
        
        Start-Sleep -Seconds 5
        Write-Log "Docker processes stopped" -Level "SUCCESS"
    }
    catch {
        Write-Log "Error stopping Docker processes: $($_.Exception.Message)" -Level "WARNING"
    }
}

function Start-DockerDesktop {
    Write-Log "Starting Docker Desktop..."
    
    try {
        $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Start-Process -FilePath $dockerPath -WindowStyle Hidden
            Write-Log "Docker Desktop started" -Level "SUCCESS"
            
            # Wait for Docker to be ready
            Write-Log "Waiting for Docker to be ready (this may take 1-2 minutes)..."
            $maxAttempts = 24  # 2 minutes with 5-second intervals
            $attempt = 0
            
            do {
                $attempt++
                Start-Sleep -Seconds 5
                Write-Log "Checking Docker status (attempt $attempt/$maxAttempts)..."
                
                if (Test-DockerStatus) {
                    Write-Log "Docker is ready!" -Level "SUCCESS"
                    return $true
                }
            } while ($attempt -lt $maxAttempts)
            
            Write-Log "Docker did not become ready within expected time" -Level "WARNING"
            return $false
        } else {
            Write-Log "Docker Desktop not found at expected location" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error starting Docker Desktop: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Restart-Docker {
    Write-Log "Restarting Docker Desktop..."
    Stop-DockerProcesses
    Start-Sleep -Seconds 3
    return Start-DockerDesktop
}

function Show-DockerInfo {
    Write-Log "Docker system information:"
    try {
        & docker system info --format "{{.Name}}: {{.ServerVersion}}"
        & docker system df
    }
    catch {
        Write-Log "Could not get Docker info: $($_.Exception.Message)" -Level "WARNING"
    }
}

# Main execution
Write-Log "Docker Diagnostic Tool"
Write-Log "=" * 40

if (Test-DockerStatus) {
    Write-Log "Docker is already running properly" -Level "SUCCESS"
    if ($Verbose) { Show-DockerInfo }
} else {
    Write-Log "Docker is not responding properly" -Level "WARNING"
    
    if ($Restart -or (Read-Host "Restart Docker Desktop? (y/n)") -match '^[Yy]') {
        if (Restart-Docker) {
            Write-Log "Docker restart completed successfully" -Level "SUCCESS"
            if ($Verbose) { Show-DockerInfo }
        } else {
            Write-Log "Docker restart failed" -Level "ERROR"
            Write-Log "You may need to manually restart Docker Desktop" -Level "WARNING"
        }
    }
}

Write-Log "Diagnostic complete"
