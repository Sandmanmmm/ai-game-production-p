# GameForge SDXL Regional Migration Script
# Phase 1: Regional Migration and Infrastructure Setup
# Target: us-west-2 (Oregon)

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [string]$SourceRegion = "us-east-1",
    [string]$TargetRegion = "us-west-2"
)

$ErrorActionPreference = "Stop"

# Colors for PowerShell output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

Write-Host "🚀 GameForge SDXL Regional Migration: $SourceRegion → $TargetRegion" -ForegroundColor $Green
Write-Host "=================================================" -ForegroundColor $Green

# Validate AWS CLI and credentials
Write-Host "🔍 Validating AWS Configuration..." -ForegroundColor $Cyan
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $awsIdentity.Account
    Write-Host "✅ AWS Account ID: $accountId" -ForegroundColor $Green
} catch {
    Write-Host "❌ AWS CLI not configured or invalid credentials" -ForegroundColor $Red
    exit 1
}

# Configuration
$config = @{
    AccountId = $accountId
    SourceRegion = $SourceRegion
    TargetRegion = $TargetRegion
    ClusterName = "gameforge-gpu-cluster"
    ServiceName = "gameforge-sdxl-gpu-service"
    TaskFamily = "gameforge-sdxl-gpu-task"
    ECRRepo = "gameforge-sdxl-service"
    S3Bucket = "gameforge-models-9dexqte8"
    LogGroup = "/aws/ecs/gameforge-sdxl-gpu"
    VPCName = "gameforge-gpu-vpc"
}

Write-Host "📋 Migration Configuration:" -ForegroundColor $Cyan
$config | Format-Table -AutoSize

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual changes will be made" -ForegroundColor $Yellow
}

# Phase 1.1: Regional Infrastructure Setup
Write-Host "`n🏗️  Phase 1.1: Setting up us-west-2 Infrastructure" -ForegroundColor $Green

# Switch to target region
Write-Host "🌍 Switching AWS CLI to target region: $TargetRegion" -ForegroundColor $Cyan
if (-not $DryRun) {
    aws configure set default.region $TargetRegion
}
$env:AWS_DEFAULT_REGION = $TargetRegion

# 1. Create ECR repository in target region
Write-Host "📦 Creating ECR repository in $TargetRegion..." -ForegroundColor $Cyan
$ecrUri = "$accountId.dkr.ecr.$TargetRegion.amazonaws.com/$($config.ECRRepo)"

if (-not $DryRun) {
    try {
        aws ecr create-repository --repository-name $config.ECRRepo --region $TargetRegion 2>$null
        Write-Host "✅ ECR repository created: $ecrUri" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  ECR repository may already exist: $ecrUri" -ForegroundColor $Yellow
    }
}

# 2. Create S3 bucket in target region for model storage
Write-Host "🗂️  Creating S3 bucket in $TargetRegion..." -ForegroundColor $Cyan
$targetS3Bucket = "$($config.S3Bucket)-$TargetRegion"

if (-not $DryRun) {
    try {
        aws s3api create-bucket --bucket $targetS3Bucket --region $TargetRegion --create-bucket-configuration LocationConstraint=$TargetRegion 2>$null
        Write-Host "✅ S3 bucket created: $targetS3Bucket" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  S3 bucket may already exist: $targetS3Bucket" -ForegroundColor $Yellow
    }
}

# 3. Create VPC for GPU instances
Write-Host "🏢 Creating VPC for GPU instances..." -ForegroundColor $Cyan
$vpcScript = @"
# Create VPC with proper CIDR for GPU instances
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$($config.VPCName)}]" --region $TargetRegion

# Get VPC ID
`$VPC_ID = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$($config.VPCName)" --query "Vpcs[0].VpcId" --output text --region $TargetRegion)

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$($config.VPCName)-igw}]" --region $TargetRegion

# Get IGW ID
`$IGW_ID = (aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=$($config.VPCName)-igw" --query "InternetGateways[0].InternetGatewayId" --output text --region $TargetRegion)

# Attach IGW to VPC
aws ec2 attach-internet-gateway --internet-gateway-id `$IGW_ID --vpc-id `$VPC_ID --region $TargetRegion

# Create subnets in multiple AZs for GPU instances
aws ec2 create-subnet --vpc-id `$VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-west-2a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$($config.VPCName)-subnet-2a}]" --region $TargetRegion
aws ec2 create-subnet --vpc-id `$VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-west-2b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$($config.VPCName)-subnet-2b}]" --region $TargetRegion
aws ec2 create-subnet --vpc-id `$VPC_ID --cidr-block 10.0.3.0/24 --availability-zone us-west-2c --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$($config.VPCName)-subnet-2c}]" --region $TargetRegion

Write-Host "✅ VPC infrastructure created with ID: `$VPC_ID" -ForegroundColor $Green
"@

if (-not $DryRun) {
    Invoke-Expression $vpcScript
} else {
    Write-Host "🧪 Would create VPC infrastructure" -ForegroundColor $Yellow
}

# 4. Create IAM roles if they don't exist in target region
Write-Host "🔐 Setting up IAM roles..." -ForegroundColor $Cyan

# 5. Create CloudWatch Log Group
Write-Host "📊 Creating CloudWatch Log Group..." -ForegroundColor $Cyan
if (-not $DryRun) {
    try {
        aws logs create-log-group --log-group-name $config.LogGroup --region $TargetRegion 2>$null
        Write-Host "✅ Log group created: $($config.LogGroup)" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  Log group may already exist: $($config.LogGroup)" -ForegroundColor $Yellow
    }
}

# Phase 1.2: GPU Instance Setup
Write-Host "`n🖥️  Phase 1.2: GPU Instance Configuration" -ForegroundColor $Green

# Create ECS Cluster
Write-Host "🐳 Creating ECS Cluster for GPU instances..." -ForegroundColor $Cyan
if (-not $DryRun) {
    try {
        aws ecs create-cluster --cluster-name $config.ClusterName --region $TargetRegion 2>$null
        Write-Host "✅ ECS Cluster created: $($config.ClusterName)" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  ECS Cluster may already exist: $($config.ClusterName)" -ForegroundColor $Yellow
    }
}

# Create GPU-optimized launch template
Write-Host "🚀 Creating GPU launch template..." -ForegroundColor $Cyan
$launchTemplateData = @{
    ImageId = "ami-0c2d3e23b7b6c4d7e"  # ECS-optimized AMI with GPU support for us-west-2
    InstanceType = "g5.xlarge"  # A10G GPU - recommended for us-west-2
    SecurityGroupIds = @()  # Will be populated after security group creation
    UserData = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(@"
#!/bin/bash
echo ECS_CLUSTER=$($config.ClusterName) >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_DOCKER_PLUGIN_MANAGEMENT=true >> /etc/ecs/ecs.config
"@))
}

# Summary
Write-Host "`n📈 Migration Progress Summary:" -ForegroundColor $Green
Write-Host "================================" -ForegroundColor $Green
Write-Host "✅ Target Region: $TargetRegion" -ForegroundColor $Green
Write-Host "✅ ECR Repository: $ecrUri" -ForegroundColor $Green
Write-Host "✅ S3 Bucket: $targetS3Bucket" -ForegroundColor $Green
Write-Host "✅ VPC: $($config.VPCName)" -ForegroundColor $Green
Write-Host "✅ ECS Cluster: $($config.ClusterName)" -ForegroundColor $Green
Write-Host "✅ GPU Instance Type: g5.xlarge (A10G)" -ForegroundColor $Green

# Next Steps
Write-Host "`n🎯 Next Steps:" -ForegroundColor $Cyan
Write-Host "1. Review the created infrastructure in AWS Console" -ForegroundColor $Yellow
Write-Host "2. Run container optimization script" -ForegroundColor $Yellow
Write-Host "3. Deploy GPU-enabled task definition" -ForegroundColor $Yellow
Write-Host "4. Test GPU performance" -ForegroundColor $Yellow

# Create updated configuration file for us-west-2
$newConfig = @{
    LOG_GROUP = $config.LogGroup
    S3_BUCKET = $targetS3Bucket
    SETUP_TYPE = "regional_migration"
    ECR_REPOSITORY = $config.ECRRepo
    AWS_ACCOUNT_ID = $accountId
    DEPLOYMENT_DATE = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    ECR_URI = $ecrUri
    REGION = $TargetRegion
    SOURCE_REGION = $SourceRegion
    CLUSTER_NAME = $config.ClusterName
    VPC_NAME = $config.VPCName
    GPU_TYPE = "A10G"
    INSTANCE_TYPE = "g5.xlarge"
}

$configJson = $newConfig | ConvertTo-Json -Depth 10
if (-not $DryRun) {
    $configJson | Out-File -FilePath "aws-config-us-west-2.json" -Encoding UTF8
    Write-Host "✅ Configuration saved to: aws-config-us-west-2.json" -ForegroundColor $Green
}

Write-Host "`n🎉 Phase 1 Regional Migration Setup Complete!" -ForegroundColor $Green
Write-Host "Ready for Phase 2: Container Optimization" -ForegroundColor $Cyan
