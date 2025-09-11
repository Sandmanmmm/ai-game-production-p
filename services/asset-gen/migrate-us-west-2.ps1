# GameForge Regional Migration to us-west-2
# Phase 1: Infrastructure Setup

param(
    [switch]$DryRun = $false,
    [string]$TargetRegion = "us-west-2"
)

$ErrorActionPreference = "Stop"

Write-Host "GameForge SDXL Regional Migration: us-east-1 -> $TargetRegion" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Validate AWS CLI
Write-Host "Validating AWS Configuration..." -ForegroundColor Cyan
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $identity.Account
    Write-Host "AWS Account ID: $accountId" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS CLI not configured" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
}

# Set target region
Write-Host "Setting target region: $TargetRegion" -ForegroundColor Cyan
$env:AWS_DEFAULT_REGION = $TargetRegion

# Create ECR repository
Write-Host "Creating ECR repository..." -ForegroundColor Cyan
$ecrRepo = "gameforge-sdxl-service"
$ecrUri = "${accountId}.dkr.ecr.${TargetRegion}.amazonaws.com/${ecrRepo}"

if (-not $DryRun) {
    aws ecr create-repository --repository-name $ecrRepo --region $TargetRegion 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ECR repository created: $ecrUri" -ForegroundColor Green
    } else {
        Write-Host "ECR repository exists: $ecrUri" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create ECR: $ecrUri" -ForegroundColor Yellow
}

# Create S3 bucket
Write-Host "Creating S3 bucket..." -ForegroundColor Cyan
$s3Bucket = "gameforge-models-9dexqte8-$TargetRegion"

if (-not $DryRun) {
    aws s3api create-bucket --bucket $s3Bucket --region $TargetRegion --create-bucket-configuration LocationConstraint=$TargetRegion 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "S3 bucket created: $s3Bucket" -ForegroundColor Green
    } else {
        Write-Host "S3 bucket exists: $s3Bucket" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create S3 bucket: $s3Bucket" -ForegroundColor Yellow
}

# Create log group
Write-Host "Creating CloudWatch log group..." -ForegroundColor Cyan
$logGroup = "/aws/ecs/gameforge-sdxl-gpu"

if (-not $DryRun) {
    aws logs create-log-group --log-group-name $logGroup --region $TargetRegion 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Log group created: $logGroup" -ForegroundColor Green
    } else {
        Write-Host "Log group exists: $logGroup" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create log group: $logGroup" -ForegroundColor Yellow
}

# Create ECS cluster
Write-Host "Creating ECS cluster..." -ForegroundColor Cyan
$clusterName = "gameforge-gpu-cluster"

if (-not $DryRun) {
    aws ecs create-cluster --cluster-name $clusterName --region $TargetRegion 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ECS cluster created: $clusterName" -ForegroundColor Green
    } else {
        Write-Host "ECS cluster exists: $clusterName" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create ECS cluster: $clusterName" -ForegroundColor Yellow
}

# Create configuration
Write-Host "`nCreating configuration file..." -ForegroundColor Cyan
$config = @{
    LOG_GROUP = $logGroup
    S3_BUCKET = $s3Bucket
    SETUP_TYPE = "regional_migration"
    ECR_REPOSITORY = $ecrRepo
    AWS_ACCOUNT_ID = $accountId
    DEPLOYMENT_DATE = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    ECR_URI = $ecrUri
    REGION = $TargetRegion
    CLUSTER_NAME = $clusterName
    GPU_TYPE = "A10G"
    INSTANCE_TYPE = "g5.xlarge"
}

$configJson = $config | ConvertTo-Json -Depth 10
if (-not $DryRun) {
    $configJson | Out-File -FilePath "aws-config-us-west-2.json" -Encoding UTF8
    Write-Host "Configuration saved: aws-config-us-west-2.json" -ForegroundColor Green
} else {
    Write-Host "Would save configuration file" -ForegroundColor Yellow
}

# Summary
Write-Host "`nMigration Summary:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "Target Region: $TargetRegion" -ForegroundColor White
Write-Host "ECR URI: $ecrUri" -ForegroundColor White
Write-Host "S3 Bucket: $s3Bucket" -ForegroundColor White
Write-Host "Log Group: $logGroup" -ForegroundColor White
Write-Host "ECS Cluster: $clusterName" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Run GPU instance setup script" -ForegroundColor White
Write-Host "2. Register task definition" -ForegroundColor White
Write-Host "3. Create ECS service" -ForegroundColor White
Write-Host "4. Validate deployment" -ForegroundColor White

Write-Host "`nPhase 1 Complete!" -ForegroundColor Green
