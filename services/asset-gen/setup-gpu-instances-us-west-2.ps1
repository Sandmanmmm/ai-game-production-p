# GameForge GPU Instance Setup for us-west-2
# Creates GPU-optimized EC2 instances for ECS cluster

param(
    [string]$Region = "us-west-2",
    [string]$ClusterName = "gameforge-gpu-cluster",
    [string]$InstanceType = "g5.xlarge",
    [switch]$CreateSpotTemplate = $true,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🖥️  GameForge GPU Instance Setup - $Region" -ForegroundColor Green
Write-Host "Instance Type: $InstanceType (A10G GPU)" -ForegroundColor Cyan
Write-Host "Spot Instances: $CreateSpotTemplate" -ForegroundColor Cyan

# Get latest ECS-optimized AMI with GPU support for us-west-2
Write-Host "🔍 Finding latest ECS GPU-optimized AMI..." -ForegroundColor Cyan

$amiId = aws ec2 describe-images `
    --owners amazon `
    --filters "Name=name,Values=amzn2-ami-ecs-gpu-hvm-*" "Name=state,Values=available" `
    --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
    --output text `
    --region $Region

Write-Host "✅ Found AMI: $amiId" -ForegroundColor Green

# Get VPC and subnet information
Write-Host "🏢 Getting VPC information..." -ForegroundColor Cyan

$vpcId = aws ec2 describe-vpcs `
    --filters "Name=tag:Name,Values=gameforge-gpu-vpc" `
    --query "Vpcs[0].VpcId" `
    --output text `
    --region $Region

if ($vpcId -eq "None" -or $null -eq $vpcId) {
    Write-Host "❌ VPC not found. Run migration script first." -ForegroundColor Red
    exit 1
}

$subnetIds = aws ec2 describe-subnets `
    --filters "Name=vpc-id,Values=$vpcId" `
    --query "Subnets[*].SubnetId" `
    --output text `
    --region $Region

Write-Host "✅ VPC: $vpcId" -ForegroundColor Green
Write-Host "✅ Subnets: $subnetIds" -ForegroundColor Green

# Create Security Group for GPU instances
Write-Host "🔒 Creating security group for GPU instances..." -ForegroundColor Cyan

$securityGroupName = "gameforge-gpu-sg"
$sgDescription = "Security group for GameForge GPU instances"

if (-not $DryRun) {
    try {
        $sgId = aws ec2 create-security-group `
            --group-name $securityGroupName `
            --description $sgDescription `
            --vpc-id $vpcId `
            --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$securityGroupName}]" `
            --query "GroupId" `
            --output text `
            --region $Region

        # Add ingress rules
        aws ec2 authorize-security-group-ingress `
            --group-id $sgId `
            --protocol tcp `
            --port 8080 `
            --source-group $sgId `
            --region $Region

        aws ec2 authorize-security-group-ingress `
            --group-id $sgId `
            --protocol tcp `
            --port 22 `
            --cidr 10.0.0.0/16 `
            --region $Region

        Write-Host "✅ Security Group created: $sgId" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Security group may already exist, getting existing..." -ForegroundColor Yellow
        $sgId = aws ec2 describe-security-groups `
            --filters "Name=group-name,Values=$securityGroupName" "Name=vpc-id,Values=$vpcId" `
            --query "SecurityGroups[0].GroupId" `
            --output text `
            --region $Region
        Write-Host "✅ Using existing Security Group: $sgId" -ForegroundColor Green
    }
}

# Create IAM instance profile for ECS GPU instances
Write-Host "🔐 Creating IAM instance profile..." -ForegroundColor Cyan

$instanceProfileName = "gameforge-gpu-instance-profile"
$roleName = "gameforge-gpu-instance-role"

# Create trust policy for EC2
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "ec2.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Depth 10

$trustPolicyFile = "gpu-instance-trust-policy.json"
$trustPolicy | Out-File -FilePath $trustPolicyFile -Encoding UTF8

if (-not $DryRun) {
    try {
        # Create role
        aws iam create-role `
            --role-name $roleName `
            --assume-role-policy-document file://$trustPolicyFile

        # Attach ECS instance policy
        aws iam attach-role-policy `
            --role-name $roleName `
            --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"

        # Create instance profile
        aws iam create-instance-profile --instance-profile-name $instanceProfileName
        aws iam add-role-to-instance-profile --instance-profile-name $instanceProfileName --role-name $roleName

        Write-Host "✅ IAM instance profile created: $instanceProfileName" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  IAM resources may already exist" -ForegroundColor Yellow
    }
}

# Create user data script for GPU instances
$userData = @"
#!/bin/bash
yum update -y
yum install -y nvidia-container-toolkit

# Configure ECS agent
echo ECS_CLUSTER=$ClusterName >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_DOCKER_PLUGIN_MANAGEMENT=true >> /etc/ecs/ecs.config
echo ECS_INSTANCE_ATTRIBUTES='{"gpu.type":"A10G","instance.type":"g5.xlarge","region":"us-west-2"}' >> /etc/ecs/ecs.config

# Install NVIDIA drivers
nvidia-smi

# Configure Docker for GPU support
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Restart ECS agent
systemctl restart ecs

# Create cache directories
mkdir -p /tmp/gpu_cache /tmp/model_cache
chmod 777 /tmp/gpu_cache /tmp/model_cache

echo "GPU instance setup complete - $(date)" > /tmp/gpu-setup-complete.log
"@

$userDataEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($userData))

# Create Launch Template for On-Demand instances
Write-Host "🚀 Creating On-Demand launch template..." -ForegroundColor Cyan

$launchTemplateName = "gameforge-gpu-ondemand-template"
$launchTemplateData = @{
    ImageId = $amiId
    InstanceType = $InstanceType
    SecurityGroupIds = @($sgId)
    UserData = $userDataEncoded
    IamInstanceProfile = @{
        Name = $instanceProfileName
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
    MetadataOptions = @{
        HttpTokens = "required"
        HttpPutResponseHopLimit = 2
    }
} | ConvertTo-Json -Depth 10

$templateFile = "launch-template-ondemand.json"
$launchTemplateData | Out-File -FilePath $templateFile -Encoding UTF8

if (-not $DryRun) {
    try {
        aws ec2 create-launch-template `
            --launch-template-name $launchTemplateName `
            --launch-template-data file://$templateFile `
            --region $Region

        Write-Host "✅ On-Demand launch template created: $launchTemplateName" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Launch template may already exist" -ForegroundColor Yellow
    }
}

# Create Launch Template for Spot instances (cost optimization)
if ($CreateSpotTemplate) {
    Write-Host "💰 Creating Spot instance launch template..." -ForegroundColor Cyan
    
    $spotTemplateName = "gameforge-gpu-spot-template"
    $spotTemplateData = $launchTemplateData | ConvertFrom-Json
    $spotTemplateData | Add-Member -NotePropertyName "InstanceMarketOptions" -NotePropertyValue @{
        MarketType = "spot"
        SpotOptions = @{
            MaxPrice = "0.50"  # 50% of on-demand price
            SpotInstanceType = "one-time"
        }
    }
    
    $spotTemplateJson = $spotTemplateData | ConvertTo-Json -Depth 10
    $spotTemplateFile = "launch-template-spot.json"
    $spotTemplateJson | Out-File -FilePath $spotTemplateFile -Encoding UTF8
    
    if (-not $DryRun) {
        try {
            aws ec2 create-launch-template `
                --launch-template-name $spotTemplateName `
                --launch-template-data file://$spotTemplateFile `
                --region $Region

            Write-Host "✅ Spot launch template created: $spotTemplateName" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Spot launch template may already exist" -ForegroundColor Yellow
        }
    }
}

# Create Auto Scaling Group
Write-Host "📈 Creating Auto Scaling Group..." -ForegroundColor Cyan

$asgName = "gameforge-gpu-asg"
$subnetArray = $subnetIds -split "\t"

if (-not $DryRun) {
    try {
        aws autoscaling create-auto-scaling-group `
            --auto-scaling-group-name $asgName `
            --launch-template "LaunchTemplateName=$launchTemplateName,Version=`$Latest" `
            --min-size 0 `
            --max-size 3 `
            --desired-capacity 1 `
            --vpc-zone-identifier ($subnetArray -join ",") `
            --health-check-type "ECS" `
            --health-check-grace-period 300 `
            --tags "Key=Name,Value=gameforge-gpu-asg,PropagateAtLaunch=true" "Key=Cluster,Value=$ClusterName,PropagateAtLaunch=true" `
            --region $Region

        Write-Host "✅ Auto Scaling Group created: $asgName" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Auto Scaling Group may already exist" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n📊 GPU Infrastructure Summary:" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Instance Type: $InstanceType (A10G GPU)" -ForegroundColor White
Write-Host "AMI: $amiId" -ForegroundColor White
Write-Host "VPC: $vpcId" -ForegroundColor White
Write-Host "Security Group: $sgId" -ForegroundColor White
Write-Host "Launch Template: $launchTemplateName" -ForegroundColor White
if ($CreateSpotTemplate) {
    Write-Host "Spot Template: $spotTemplateName" -ForegroundColor White
}
Write-Host "Auto Scaling Group: $asgName" -ForegroundColor White
Write-Host "ECS Cluster: $ClusterName" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for instances to launch and join ECS cluster" -ForegroundColor Yellow
Write-Host "2. Register GPU task definition" -ForegroundColor Yellow
Write-Host "3. Create ECS service with GPU task" -ForegroundColor Yellow
Write-Host "4. Test GPU performance" -ForegroundColor Yellow

# Clean up temporary files
if (Test-Path $trustPolicyFile) { Remove-Item $trustPolicyFile }
if (Test-Path $templateFile) { Remove-Item $templateFile }
if (Test-Path $spotTemplateFile) { Remove-Item $spotTemplateFile }

Write-Host "`n🎉 GPU Infrastructure Setup Complete!" -ForegroundColor Green
