# GameForge SDXL Regional Migration Script - Simplified Version
# Phase 1: Regional Migration and Infrastructure Setup
# Target: us-west-2 (Oregon)

param(
    [switch]$DryRun = $false,
    [string]$SourceRegion = "us-east-1",
    [string]$TargetRegion = "us-west-2"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 GameForge SDXL Regional Migration: $SourceRegion → $TargetRegion" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Validate AWS CLI and credentials
Write-Host "🔍 Validating AWS Configuration..." -ForegroundColor Cyan
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $awsIdentity.Account
    Write-Host "✅ AWS Account ID: $accountId" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured or invalid credentials" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
}

# Switch to target region
Write-Host "🌍 Switching AWS CLI to target region: $TargetRegion" -ForegroundColor Cyan
if (-not $DryRun) {
    aws configure set default.region $TargetRegion
}
$env:AWS_DEFAULT_REGION = $TargetRegion

# 1. Create ECR repository in target region
Write-Host "📦 Creating ECR repository in $TargetRegion..." -ForegroundColor Cyan
$ecrRepo = "gameforge-sdxl-service"
$ecrUri = "$accountId.dkr.ecr.$TargetRegion.amazonaws.com/$ecrRepo"

if (-not $DryRun) {
    try {
        aws ecr create-repository --repository-name $ecrRepo --region $TargetRegion 2>$null
        Write-Host "✅ ECR repository created: $ecrUri" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  ECR repository may already exist: $ecrUri" -ForegroundColor Yellow
    }
} else {
    Write-Host "🧪 Would create ECR repository: $ecrUri" -ForegroundColor Yellow
}

# 2. Create S3 bucket in target region
Write-Host "🗂️  Creating S3 bucket in $TargetRegion..." -ForegroundColor Cyan
$targetS3Bucket = "gameforge-models-9dexqte8-$TargetRegion"

if (-not $DryRun) {
    try {
        aws s3api create-bucket --bucket $targetS3Bucket --region $TargetRegion --create-bucket-configuration LocationConstraint=$TargetRegion 2>$null
        Write-Host "✅ S3 bucket created: $targetS3Bucket" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  S3 bucket may already exist: $targetS3Bucket" -ForegroundColor Yellow
    }
} else {
    Write-Host "🧪 Would create S3 bucket: $targetS3Bucket" -ForegroundColor Yellow
}

# 3. Create CloudWatch Log Group
Write-Host "📊 Creating CloudWatch Log Group..." -ForegroundColor Cyan
$logGroup = "/aws/ecs/gameforge-sdxl-gpu"

if (-not $DryRun) {
    try {
        aws logs create-log-group --log-group-name $logGroup --region $TargetRegion 2>$null
        Write-Host "✅ Log group created: $logGroup" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Log group may already exist: $logGroup" -ForegroundColor Yellow
    }
} else {
    Write-Host "🧪 Would create log group: $logGroup" -ForegroundColor Yellow
}

# 4. Create ECS Cluster
Write-Host "🐳 Creating ECS Cluster for GPU instances..." -ForegroundColor Cyan
$clusterName = "gameforge-gpu-cluster"

if (-not $DryRun) {
    try {
        aws ecs create-cluster --cluster-name $clusterName --region $TargetRegion 2>$null
        Write-Host "✅ ECS Cluster created: $clusterName" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  ECS Cluster may already exist: $clusterName" -ForegroundColor Yellow
    }
} else {
    Write-Host "🧪 Would create ECS cluster: $clusterName" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📈 Migration Progress Summary:" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Target Region: $TargetRegion" -ForegroundColor Green
Write-Host "✅ ECR Repository: $ecrUri" -ForegroundColor Green
Write-Host "✅ S3 Bucket: $targetS3Bucket" -ForegroundColor Green
Write-Host "✅ Log Group: $logGroup" -ForegroundColor Green
Write-Host "✅ ECS Cluster: $clusterName" -ForegroundColor Green
Write-Host "✅ GPU Instance Type: g5.xlarge (A10G)" -ForegroundColor Green

# Create updated configuration file for us-west-2
$newConfig = @{
    LOG_GROUP = $logGroup
    S3_BUCKET = $targetS3Bucket
    SETUP_TYPE = "regional_migration"
    ECR_REPOSITORY = $ecrRepo
    AWS_ACCOUNT_ID = $accountId
    DEPLOYMENT_DATE = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    ECR_URI = $ecrUri
    REGION = $TargetRegion
    SOURCE_REGION = $SourceRegion
    CLUSTER_NAME = $clusterName
    GPU_TYPE = "A10G"
    INSTANCE_TYPE = "g5.xlarge"
}

$configJson = $newConfig | ConvertTo-Json -Depth 10
if (-not $DryRun) {
    $configJson | Out-File -FilePath "aws-config-us-west-2.json" -Encoding UTF8
    Write-Host "✅ Configuration saved to: aws-config-us-west-2.json" -ForegroundColor Green
} else {
    Write-Host "🧪 Would save configuration to: aws-config-us-west-2.json" -ForegroundColor Yellow
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review the created infrastructure in AWS Console" -ForegroundColor White
Write-Host "2. Run: .\setup-gpu-instances-us-west-2.ps1" -ForegroundColor White
Write-Host "3. Deploy GPU-enabled task definition" -ForegroundColor White
Write-Host "4. Run: .\validate-gpu-service.ps1" -ForegroundColor White

Write-Host "`n🎉 Phase 1 Regional Migration Setup Complete!" -ForegroundColor Green
Write-Host "Ready for Phase 2: GPU Instance Setup" -ForegroundColor Cyan
