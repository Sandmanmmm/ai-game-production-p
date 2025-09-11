# GameForge AWS Setup - Complete Installation and Deployment
# This script installs prerequisites and deploys AWS infrastructure

param(
    [string]$Region = "us-east-1",
    [string]$BucketPrefix = "gameforge-models",
    [string]$ServiceName = "gameforge-sdxl"
)

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    $colors = @{
        'Red' = 'Red'; 'Green' = 'Green'; 'Yellow' = 'Yellow'; 
        'Blue' = 'Blue'; 'Magenta' = 'Magenta'; 'Cyan' = 'Cyan'
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput Cyan "GameForge AWS Setup - Phase A Infrastructure"
Write-ColorOutput Yellow "Checking prerequisites..."

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-ColorOutput Red "This script requires Administrator privileges for installing AWS CLI."
    Write-ColorOutput Yellow "Please run PowerShell as Administrator and try again."
    Write-ColorOutput Yellow ""
    Write-ColorOutput Yellow "Manual steps to continue without admin:"
    Write-ColorOutput Yellow "1. Download AWS CLI v2 from: https://awscli.amazonaws.com/AWSCLIV2.msi"
    Write-ColorOutput Yellow "2. Install AWS CLI v2"
    Write-ColorOutput Yellow "3. Configure AWS credentials: aws configure"
    Write-ColorOutput Yellow "4. Re-run this script"
    exit 1
}

# Check for Chocolatey
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Installing Chocolatey package manager..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-ColorOutput Green "Chocolatey installed successfully"
    } catch {
        Write-ColorOutput Red "Failed to install Chocolatey: $($_.Exception.Message)"
        Write-ColorOutput Yellow "Please install AWS CLI manually from: https://awscli.amazonaws.com/AWSCLIV2.msi"
        exit 1
    }
}

# Install AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Installing AWS CLI v2..."
    try {
        choco install awscli -y
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-ColorOutput Green "AWS CLI v2 installed successfully"
    } catch {
        Write-ColorOutput Red "Failed to install AWS CLI: $($_.Exception.Message)"
        Write-ColorOutput Yellow "Please install AWS CLI manually from: https://awscli.amazonaws.com/AWSCLIV2.msi"
        exit 1
    }
}

# Verify AWS CLI installation
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "AWS CLI not found in PATH after installation."
    Write-ColorOutput Yellow "Please:"
    Write-ColorOutput Yellow "1. Restart PowerShell as Administrator"
    Write-ColorOutput Yellow "2. Or install AWS CLI manually from: https://awscli.amazonaws.com/AWSCLIV2.msi"
    exit 1
}

Write-ColorOutput Green "AWS CLI available - checking configuration..."

# Check AWS configuration
try {
    $accountId = aws sts get-caller-identity --query Account --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "AWS CLI not configured or no valid credentials."
        Write-ColorOutput Yellow ""
        Write-ColorOutput Yellow "Please configure AWS CLI with your credentials:"
        Write-ColorOutput Yellow "  aws configure"
        Write-ColorOutput Yellow ""
        Write-ColorOutput Yellow "You will need:"
        Write-ColorOutput Yellow "  - AWS Access Key ID"
        Write-ColorOutput Yellow "  - AWS Secret Access Key"
        Write-ColorOutput Yellow "  - Default region name (e.g., us-east-1)"
        Write-ColorOutput Yellow "  - Default output format (json)"
        Write-ColorOutput Yellow ""
        Write-ColorOutput Yellow "After configuration, re-run this script."
        exit 1
    }
    Write-ColorOutput Green "AWS credentials configured - Account ID: $accountId"
} catch {
    Write-ColorOutput Red "Failed to verify AWS configuration: $($_.Exception.Message)"
    exit 1
}

Write-ColorOutput Cyan "Prerequisites verified - starting infrastructure deployment..."

# Continue with infrastructure deployment
Write-ColorOutput Yellow "Creating AWS resources in region: $Region"

# Generate unique bucket name
$RandomSuffix = -join ((1..8) | ForEach-Object {Get-Random -input ([char[]]"abcdefghijklmnopqrstuvwxyz0123456789")})
$BucketName = "$BucketPrefix-$RandomSuffix"

# Create S3 bucket
Write-ColorOutput Yellow "Creating S3 bucket: $BucketName"
try {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $BucketName --region $Region
    } else {
        aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "S3 bucket created: $BucketName"
        
        # Enable versioning
        aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled
        Write-ColorOutput Green "S3 versioning enabled"
    } else {
        Write-ColorOutput Red "Failed to create S3 bucket"
        exit 1
    }
} catch {
    Write-ColorOutput Red "S3 bucket creation failed: $($_.Exception.Message)"
    exit 1
}

# Create ECR repository  
Write-ColorOutput Yellow "Creating ECR repository..."
$RepoName = "$ServiceName-service"

try {
    aws ecr create-repository --repository-name $RepoName --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "ECR repository created: $RepoName"
    } else {
        # Check if repository already exists
        aws ecr describe-repositories --repository-names $RepoName --region $Region >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "ECR repository already exists: $RepoName"
        } else {
            Write-ColorOutput Red "Failed to create/verify ECR repository"
            exit 1
        }
    }
} catch {
    Write-ColorOutput Red "ECR repository creation failed: $($_.Exception.Message)"
    exit 1
}

# Create CloudWatch Log Group
Write-ColorOutput Yellow "Creating CloudWatch log group..."
$LogGroupName = "/aws/ecs/$ServiceName"

try {
    aws logs create-log-group --log-group-name $LogGroupName --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "CloudWatch log group created: $LogGroupName"
    } else {
        Write-ColorOutput Green "CloudWatch log group already exists: $LogGroupName"
    }
} catch {
    Write-ColorOutput Green "CloudWatch log group exists or created: $LogGroupName"
}

Write-ColorOutput Green "Phase A Infrastructure deployment completed successfully!"

# Save configuration for next steps
$Config = @{
    AWS_ACCOUNT_ID = $accountId
    REGION = $Region
    S3_BUCKET = $BucketName
    ECR_REPOSITORY = $RepoName
    ECR_URI = "$accountId.dkr.ecr.$Region.amazonaws.com/$RepoName"
    LOG_GROUP = $LogGroupName
    DEPLOYMENT_DATE = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$Config | ConvertTo-Json -Depth 2 | Out-File -FilePath "aws-config.json" -Encoding UTF8
Write-ColorOutput Green "Configuration saved to aws-config.json"

# Display summary
Write-ColorOutput Cyan ""
Write-ColorOutput Cyan "=== AWS Phase A Deployment Summary ==="
Write-ColorOutput Green "Account ID: $($Config.AWS_ACCOUNT_ID)"
Write-ColorOutput Green "Region: $($Config.REGION)"
Write-ColorOutput Green "S3 Bucket: $($Config.S3_BUCKET)"
Write-ColorOutput Green "ECR Repository: $($Config.ECR_REPOSITORY)"
Write-ColorOutput Green "ECR URI: $($Config.ECR_URI)"
Write-ColorOutput Green "Log Group: $($Config.LOG_GROUP)"
Write-ColorOutput Cyan ""

Write-ColorOutput Cyan "=== Next Steps: Phase B - Model Upload ==="
Write-ColorOutput Yellow "1. Upload SDXL models to S3:"
Write-ColorOutput Yellow "   .\Upload-Models.ps1"
Write-ColorOutput Yellow ""
Write-ColorOutput Yellow "2. Build and push Docker container:"
Write-ColorOutput Yellow "   docker build -t $ServiceName-service ."
Write-ColorOutput Yellow "   aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $($Config.ECR_URI)"
Write-ColorOutput Yellow "   docker tag $ServiceName-service:latest $($Config.ECR_URI):latest"
Write-ColorOutput Yellow "   docker push $($Config.ECR_URI):latest"
Write-ColorOutput Yellow ""
Write-ColorOutput Yellow "3. Deploy to ECS (Phase C)"
Write-ColorOutput Yellow ""

Write-ColorOutput Green "Phase A Complete! Ready for model upload and container deployment."
