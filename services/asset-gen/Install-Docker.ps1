# Docker Installation and Configuration Script for GameForge SDXL
# This script installs Docker Desktop and configures it for GPU support

param(
    [switch]$SkipDownload,
    [switch]$ConfigureOnly
)

Set-StrictMode -Version Latest

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-AdminPrivileges {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-DockerDesktop {
    Write-Log "Starting Docker Desktop installation"
    
    if (-not (Test-AdminPrivileges)) {
        Write-Log "Administrator privileges required for Docker installation" -Level "ERROR"
        Write-Log "Please run this script as Administrator" -Level "ERROR"
        throw "Administrator privileges required"
    }
    
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
    
    if (-not $SkipDownload) {
        Write-Log "Downloading Docker Desktop installer..."
        try {
            Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller -UseBasicParsing
            Write-Log "Docker Desktop installer downloaded successfully"
        }
        catch {
            Write-Log "Failed to download Docker Desktop: $($_.Exception.Message)" -Level "ERROR"
            throw
        }
    }
    
    if (-not (Test-Path $dockerInstaller)) {
        Write-Log "Docker installer not found at $dockerInstaller" -Level "ERROR"
        throw "Installer not found"
    }
    
    Write-Log "Installing Docker Desktop (this may take several minutes)..."
    try {
        $installArgs = @(
            "install",
            "--quiet",
            "--accept-license",
            "--always-run-service"
        )
        
        Start-Process -FilePath $dockerInstaller -ArgumentList $installArgs -Wait -NoNewWindow
        Write-Log "Docker Desktop installation completed" -Level "SUCCESS"
    }
    catch {
        Write-Log "Docker installation failed: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
    
    # Clean up installer
    if (Test-Path $dockerInstaller) {
        Remove-Item $dockerInstaller -Force
        Write-Log "Installer cleanup completed"
    }
}

function Wait-ForDockerService {
    Write-Log "Waiting for Docker service to start..."
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        Write-Log "Checking Docker service (attempt $attempt/$maxAttempts)..."
        
        try {
            $dockerInfo = & docker info 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Docker service is running" -Level "SUCCESS"
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        if ($attempt -lt $maxAttempts) {
            Write-Log "Docker service not ready, waiting 10 seconds..."
            Start-Sleep -Seconds 10
        }
    } while ($attempt -lt $maxAttempts)
    
    Write-Log "Docker service did not start within expected time" -Level "WARNING"
    return $false
}

function Configure-DockerForGPU {
    Write-Log "Configuring Docker for GPU support"
    
    try {
        # Check if NVIDIA Docker runtime is available
        Write-Log "Checking NVIDIA Docker runtime support..."
        
        # Test Docker basic functionality
        Write-Log "Testing Docker basic functionality..."
        & docker run --rm hello-world
        if ($LASTEXITCODE -ne 0) {
            throw "Docker basic functionality test failed"
        }
        Write-Log "Docker basic functionality verified" -Level "SUCCESS"
        
        # Test GPU support (if NVIDIA GPU is available)
        Write-Log "Testing GPU support..."
        & docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "GPU support verified" -Level "SUCCESS"
        } else {
            Write-Log "GPU support not available or NVIDIA Docker runtime not configured" -Level "WARNING"
            Write-Log "This may be expected if you don't have an NVIDIA GPU" -Level "WARNING"
        }
        
        Write-Log "Docker configuration completed" -Level "SUCCESS"
    }
    catch {
        Write-Log "Docker configuration failed: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Show-DockerInfo {
    Write-Log "Docker installation summary:"
    Write-Log "=" * 50
    
    try {
        Write-Log "Docker version:"
        & docker --version
        
        Write-Log "`nDocker system info:"
        & docker system info --format "table {{.Name}}\t{{.Value}}" | Select-Object -First 10
        
        Write-Log "`nDocker is ready for GameForge SDXL deployment!" -Level "SUCCESS"
        Write-Log "=" * 50
        Write-Log "Next steps:"
        Write-Log "1. Run the GameForge Phase C deployment script"
        Write-Log "2. The script will build and deploy the GPU-enabled container"
        Write-Log "3. Monitor the deployment progress"
    }
    catch {
        Write-Log "Error getting Docker info: $($_.Exception.Message)" -Level "ERROR"
    }
}

# Main installation flow
function Install-DockerForGameForge {
    Write-Log "Starting Docker installation and configuration for GameForge SDXL"
    Write-Log "=" * 60
    
    try {
        if (-not $ConfigureOnly) {
            # Step 1: Install Docker Desktop
            Install-DockerDesktop
            
            Write-Log "Docker installation completed. Please restart your computer if prompted."
            Write-Log "After restart, Docker Desktop should start automatically."
            
            # Give user option to continue or restart
            Write-Log "`nIMPORTANT: You may need to restart your computer for Docker to work properly."
            $response = Read-Host "Do you want to continue with configuration now? (y/n)"
            if ($response -notmatch '^[Yy]') {
                Write-Log "Please restart your computer and run this script with -ConfigureOnly flag"
                return
            }
        }
        
        # Step 2: Wait for Docker service
        $dockerReady = Wait-ForDockerService
        if (-not $dockerReady) {
            Write-Log "Please ensure Docker Desktop is running and try again" -Level "WARNING"
            return
        }
        
        # Step 3: Configure Docker for GPU
        Configure-DockerForGPU
        
        # Step 4: Show summary
        Show-DockerInfo
        
        Write-Log "Docker installation and configuration completed successfully!" -Level "SUCCESS"
    }
    catch {
        Write-Log "Docker setup failed: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Please check the Docker Desktop installation manually" -Level "ERROR"
        throw
    }
}

# Execute main installation
if ($MyInvocation.InvocationName -ne '.') {
    Install-DockerForGameForge
}
