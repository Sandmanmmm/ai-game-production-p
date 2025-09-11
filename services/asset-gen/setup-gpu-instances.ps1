# GameForge GPU Instance Setup for us-west-2
# Deploy g5.xlarge instances with A10G GPUs

param(
    [string]$Region = "us-west-2",
    [string]$ClusterName = "gameforge-gpu-cluster",
    [string]$InstanceType = "g5.xlarge",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "GameForge GPU Instance Setup - $Region" -ForegroundColor Green
Write-Host "Instance Type: $InstanceType (A10G GPU)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green

# Get AWS account info
$identity = aws sts get-caller-identity --output json | ConvertFrom-Json
$accountId = $identity.Account
Write-Host "AWS Account: $accountId" -ForegroundColor Green

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
}

# Set region
$env:AWS_DEFAULT_REGION = $Region

# Get latest ECS GPU-optimized AMI
Write-Host "`nFinding latest ECS GPU-optimized AMI..." -ForegroundColor Cyan
$amiId = aws ec2 describe-images --owners amazon --filters "Name=name,Values=amzn2-ami-ecs-gpu-hvm-*" "Name=state,Values=available" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text --region $Region

if ($amiId -and $amiId -ne "None") {
    Write-Host "Found AMI: $amiId" -ForegroundColor Green
} else {
    Write-Host "ERROR: Could not find ECS GPU AMI" -ForegroundColor Red
    exit 1
}

# Create default VPC if needed
Write-Host "`nSetting up VPC..." -ForegroundColor Cyan
$defaultVpc = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region $Region

if ($defaultVpc -eq "None" -or $null -eq $defaultVpc) {
    Write-Host "Creating default VPC..." -ForegroundColor Cyan
    if (-not $DryRun) {
        aws ec2 create-default-vpc --region $Region
        $defaultVpc = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region $Region
    } else {
        $defaultVpc = "vpc-dry-run-test"
    }
}
Write-Host "Using VPC: $defaultVpc" -ForegroundColor Green

# Get default subnets
$subnets = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$defaultVpc" "Name=default-for-az,Values=true" --query "Subnets[*].SubnetId" --output text --region $Region
Write-Host "Using subnets: $subnets" -ForegroundColor Green

# Create Security Group
Write-Host "`nCreating security group..." -ForegroundColor Cyan
$sgName = "gameforge-gpu-sg"
$sgDescription = "Security group for GameForge GPU instances"

if (-not $DryRun) {
    try {
        $sgId = aws ec2 create-security-group --group-name $sgName --description $sgDescription --vpc-id $defaultVpc --query "GroupId" --output text --region $Region
        
        # Add ingress rules
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 8080 --source-group $sgId --region $Region
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region
        
        Write-Host "Security Group created: $sgId" -ForegroundColor Green
    } catch {
        Write-Host "Security group may exist, getting existing..." -ForegroundColor Yellow
        $sgId = aws ec2 describe-security-groups --filters "Name=group-name,Values=$sgName" "Name=vpc-id,Values=$defaultVpc" --query "SecurityGroups[0].GroupId" --output text --region $Region
        Write-Host "Using existing Security Group: $sgId" -ForegroundColor Green
    }
} else {
    Write-Host "Would create security group: $sgName" -ForegroundColor Yellow
    $sgId = "sg-dry-run-test"
}

# Create IAM role for GPU instances
Write-Host "`nCreating IAM instance profile..." -ForegroundColor Cyan
$roleName = "gameforge-gpu-instance-role"
$profileName = "gameforge-gpu-instance-profile"

$trustPolicy = @'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
'@

$trustPolicyFile = "gpu-trust-policy.json"
$trustPolicy | Out-File -FilePath $trustPolicyFile -Encoding UTF8

if (-not $DryRun) {
    try {
        # Create role
        aws iam create-role --role-name $roleName --assume-role-policy-document file://$trustPolicyFile
        
        # Attach ECS policy
        aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
        
        # Create instance profile
        aws iam create-instance-profile --instance-profile-name $profileName
        aws iam add-role-to-instance-profile --instance-profile-name $profileName --role-name $roleName
        
        Write-Host "IAM instance profile created: $profileName" -ForegroundColor Green
        
        # Wait for profile to be ready
        Start-Sleep -Seconds 10
    } catch {
        Write-Host "IAM resources may exist" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create IAM instance profile: $profileName" -ForegroundColor Yellow
}

# Create user data script
$userData = @"
#!/bin/bash
yum update -y

# Configure ECS agent
echo ECS_CLUSTER=$ClusterName >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
echo ECS_INSTANCE_ATTRIBUTES='{\"gpu.type\":\"A10G\",\"instance.type\":\"g5.xlarge\",\"region\":\"us-west-2\"}' >> /etc/ecs/ecs.config

# Install nvidia-container-toolkit
yum install -y nvidia-container-toolkit

# Configure Docker for GPU
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Restart ECS agent
systemctl restart ecs

# Create cache directories
mkdir -p /tmp/gpu_cache /tmp/model_cache
chmod 777 /tmp/gpu_cache /tmp/model_cache

# Log completion
echo "GPU instance setup complete - $(date)" > /tmp/gpu-setup-complete.log
"@

$userDataEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($userData))

# Create Launch Template
Write-Host "`nCreating launch template..." -ForegroundColor Cyan
$templateName = "gameforge-gpu-template"

$launchTemplateData = @{
    ImageId = $amiId
    InstanceType = $InstanceType
    SecurityGroupIds = @($sgId)
    UserData = $userDataEncoded
    IamInstanceProfile = @{
        Name = $profileName
    }
    BlockDeviceMappings = @(
        @{
            DeviceName = "/dev/xvda"
            Ebs = @{
                VolumeSize = 100
                VolumeType = "gp3"
                DeleteOnTermination = $true
            }
        }
    )
    TagSpecifications = @(
        @{
            ResourceType = "instance"
            Tags = @(
                @{ Key = "Name"; Value = "gameforge-gpu-instance" },
                @{ Key = "Cluster"; Value = $ClusterName },
                @{ Key = "GPUType"; Value = "A10G" },
                @{ Key = "Region"; Value = $Region }
            )
        }
    )
} | ConvertTo-Json -Depth 10

$templateFile = "launch-template.json"
$launchTemplateData | Out-File -FilePath $templateFile -Encoding UTF8

if (-not $DryRun) {
    try {
        aws ec2 create-launch-template --launch-template-name $templateName --launch-template-data file://$templateFile --region $Region
        Write-Host "Launch template created: $templateName" -ForegroundColor Green
    } catch {
        Write-Host "Launch template may exist" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create launch template: $templateName" -ForegroundColor Yellow
}

# Create Auto Scaling Group
Write-Host "`nCreating Auto Scaling Group..." -ForegroundColor Cyan
$asgName = "gameforge-gpu-asg"
$subnetArray = $subnets -split "\t"

if (-not $DryRun) {
    try {
        aws autoscaling create-auto-scaling-group --auto-scaling-group-name $asgName --launch-template "LaunchTemplateName=$templateName,Version=`$Latest" --min-size 0 --max-size 3 --desired-capacity 1 --vpc-zone-identifier ($subnetArray -join ",") --health-check-type "ECS" --health-check-grace-period 300 --region $Region
        
        Write-Host "Auto Scaling Group created: $asgName" -ForegroundColor Green
    } catch {
        Write-Host "Auto Scaling Group may exist" -ForegroundColor Yellow
    }
} else {
    Write-Host "Would create Auto Scaling Group: $asgName" -ForegroundColor Yellow
}

# Clean up temp files
if (Test-Path $trustPolicyFile) { Remove-Item $trustPolicyFile }
if (Test-Path $templateFile) { Remove-Item $templateFile }

# Summary
Write-Host "`nGPU Infrastructure Summary:" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Instance Type: $InstanceType (A10G GPU)" -ForegroundColor White
Write-Host "AMI: $amiId" -ForegroundColor White
Write-Host "VPC: $defaultVpc" -ForegroundColor White
Write-Host "Security Group: $sgId" -ForegroundColor White
Write-Host "Launch Template: $templateName" -ForegroundColor White
Write-Host "Auto Scaling Group: $asgName" -ForegroundColor White
Write-Host "ECS Cluster: $ClusterName" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for instances to launch (2-3 minutes)" -ForegroundColor White
Write-Host "2. Register GPU task definition" -ForegroundColor White
Write-Host "3. Create ECS service" -ForegroundColor White
Write-Host "4. Test GPU performance" -ForegroundColor White

Write-Host "`nGPU Instance Setup Complete!" -ForegroundColor Green
