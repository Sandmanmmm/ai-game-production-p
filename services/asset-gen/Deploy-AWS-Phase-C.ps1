# GameForge SDXL Service AWS Deployment Script - Phase C: Container Build & ECS Deployment
# This script builds the GPU-enabled Docker container and deploys to ECS

param(
    [string]$Region = "us-east-1",
    [string]$ClusterName = "gameforge-sdxl-cluster", 
    [string]$ServiceName = "gameforge-sdxl-service",
    [string]$TaskFamily = "gameforge-sdxl-task"
)

# Create user data script for ECS GPU instances
$userData = @"
#!/bin/bash
echo ECS_CLUSTER=$ClusterName >> /etc/ecs/ecs.config
echo 'ECS_AVAILABLE_LOGGING_DRIVERS=["json-file","awslogs"]' >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config

# Install NVIDIA Docker runtime
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
distribution=$(lsb_release -cs)
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt-get update && apt-get install -y nvidia-docker2
systemctl restart docker

# Restart ECS agent
systemctl restart ecs
"@

# Load AWS configuration
if (Test-Path "aws-config.json") {
    $config = Get-Content "aws-config.json" | ConvertFrom-Json
    $Region = $config.region
    $BucketName = $config.s3_bucket.Replace("s3://", "")
    $ECRRepo = $config.ecr_repository
    $AWS_ACCOUNT_ID = $config.account_id
} else {
    Write-Error "❌ aws-config.json not found. Please run Phase A deployment first."
    exit 1
}

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "[SUCCESS] Starting GameForge SDXL AWS Deployment - Phase C"
Write-ColorOutput Green "[CONFIG] Configuration:"
Write-Output "  • Account ID: $AWS_ACCOUNT_ID"
Write-Output "  • Region: $Region"
Write-Output "  • S3 Bucket: $BucketName"
Write-Output "  • ECR Repository: $ECRRepo"
Write-Output ""

# Check if Docker is running
try {
    docker version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-ColorOutput Red "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Step 1: Build GPU-enabled Docker Image
Write-ColorOutput Yellow "[BUILD] Building GPU-enabled Docker image..."
docker build -t gameforge-sdxl:latest -f Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Docker build failed"
    exit 1
}

Write-ColorOutput Green "✅ Docker image built successfully"

# Step 2: Authenticate Docker to ECR
Write-ColorOutput Yellow "🔐 Authenticating Docker to ECR..."
$loginPassword = aws ecr get-login-password --region $Region
if ([string]::IsNullOrEmpty($loginPassword)) {
    Write-ColorOutput Red "❌ Failed to get ECR login password"
    exit 1
}

$loginPassword | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ ECR authentication failed"
    exit 1
}

# Step 3: Tag and Push Image
$ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ECRRepo`:latest"
Write-ColorOutput Yellow "[TAG] Tagging image: $ECR_URI"
docker tag gameforge-sdxl:latest $ECR_URI

Write-ColorOutput Yellow "[PUSH] Pushing image to ECR..."
docker push $ECR_URI

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Docker push failed"
    exit 1
}

Write-ColorOutput Green "✅ Docker image pushed to ECR successfully"

# Step 4: Create ECS Cluster
Write-ColorOutput Yellow "🏗️ Creating ECS cluster with GPU support..."
try {
    aws ecs describe-clusters --clusters $ClusterName --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ ECS cluster $ClusterName already exists"
    } else {
        throw "Cluster does not exist"
    }
} catch {
    aws ecs create-cluster --cluster-name $ClusterName --region $Region --capacity-providers EC2 --default-capacity-provider-strategy capacityProvider=EC2,weight=1
    Write-ColorOutput Green "✅ ECS cluster $ClusterName created successfully"
}

# Step 5: Create ECS Task Definition
Write-ColorOutput Yellow "📄 Creating ECS task definition with GPU support..."
$taskDefinition = @"
{
  "family": "$TaskFamily",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["EC2"],
  "cpu": "4096",
  "memory": "16384",
  "executionRoleArn": "arn:aws:iam::$($AWS_ACCOUNT_ID):role/GameForgeSDXLExecutionRole",
  "taskRoleArn": "arn:aws:iam::$($AWS_ACCOUNT_ID):role/GameForgeSDXLTaskRole",
  "containerDefinitions": [
    {
      "name": "sdxl-container",
      "image": "$ECR_URI",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_DEFAULT_REGION",
          "value": "$Region"
        },
        {
          "name": "S3_BUCKET_NAME", 
          "value": "$BucketName"
        },
        {
          "name": "MODEL_CACHE_DIR",
          "value": "/tmp/models"
        },
        {
          "name": "CUDA_VISIBLE_DEVICES",
          "value": "0"
        },
        {
          "name": "PYTORCH_CUDA_ALLOC_CONF",
          "value": "max_split_size_mb:512"
        }
      ],
      "resourceRequirements": [
        {
          "type": "GPU",
          "value": "1"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/gameforge-sdxl",
          "awslogs-region": "$Region",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "mountPoints": [
        {
          "sourceVolume": "tmp-models",
          "containerPath": "/tmp/models",
          "readOnly": false
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "tmp-models",
      "host": {
        "sourcePath": "/tmp/models"
      }
    }
  ]
}
"@

$taskDefinition | Out-File -FilePath "task-definition.json" -Encoding UTF8

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Failed to register task definition"
    exit 1
}

Write-ColorOutput Green "✅ ECS task definition registered successfully"

# Step 6: Create Security Group for ECS Service
Write-ColorOutput Yellow "[SECURITY] Creating security group for ECS service..."
$SecurityGroupName = "gameforge-sdxl-sg"

try {
    $sgInfo = aws ec2 describe-security-groups --filters "Name=group-name,Values=$SecurityGroupName" --region $Region 2>$null
    $sgData = $sgInfo | ConvertFrom-Json
    if ($sgData.SecurityGroups.Count -gt 0) {
        $SecurityGroupId = $sgData.SecurityGroups[0].GroupId
        Write-ColorOutput Green "✅ Security group $SecurityGroupName already exists: $SecurityGroupId"
    } else {
        throw "Security group does not exist"
    }
} catch {
    # Get default VPC
    $vpcInfo = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $Region
    $vpcData = $vpcInfo | ConvertFrom-Json
    $VpcId = $vpcData.Vpcs[0].VpcId
    
    # Create security group
    $sgCreation = aws ec2 create-security-group --group-name $SecurityGroupName --description "GameForge SDXL Service Security Group" --vpc-id $VpcId --region $Region
    $sgData = $sgCreation | ConvertFrom-Json
    $SecurityGroupId = $sgData.GroupId
    
    # Add ingress rules
    aws ec2 authorize-security-group-ingress --group-id $SecurityGroupId --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $Region
    aws ec2 authorize-security-group-ingress --group-id $SecurityGroupId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region
    aws ec2 authorize-security-group-ingress --group-id $SecurityGroupId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region
    
    Write-ColorOutput Green "✅ Security group $SecurityGroupName created: $SecurityGroupId"
}

# Step 7: Get subnet information
Write-ColorOutput Yellow "🌐 Getting subnet information..."
$subnetInfo = aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --region $Region
$subnetData = $subnetInfo | ConvertFrom-Json
$SubnetIds = $subnetData.Subnets | ForEach-Object { $_.SubnetId }
$SubnetIdList = $SubnetIds -join ","

Write-ColorOutput Green "✅ Found subnets: $SubnetIdList"

# Step 8: Create ECS Service
Write-ColorOutput Yellow "🚀 Creating ECS service..."

$serviceDefinition = @"
{
  "serviceName": "$ServiceName",
  "cluster": "$ClusterName",
  "taskDefinition": "$TaskFamily",
  "desiredCount": 1,
  "launchType": "EC2",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["$($SubnetIds[0])"],
      "securityGroups": ["$SecurityGroupId"],
      "assignPublicIp": "ENABLED"
    }
  },
  "placementConstraints": [
    {
      "type": "memberOf",
      "expression": "attribute:ecs.instance-type =~ g4dn.*"
    }
  ],
  "serviceTags": [
    {
      "key": "Project",
      "value": "GameForge"
    },
    {
      "key": "Service", 
      "value": "SDXL-GPU"
    }
  ]
}
"@

$serviceDefinition | Out-File -FilePath "service-definition.json" -Encoding UTF8

try {
    $serviceInfo = aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $Region 2>$null
    $serviceData = $serviceInfo | ConvertFrom-Json
    if ($serviceData.services.Count -gt 0 -and $serviceData.services[0].status -ne "INACTIVE") {
        Write-ColorOutput Yellow "⚠️ Service $ServiceName already exists, updating..."
        aws ecs update-service --cluster $ClusterName --service $ServiceName --task-definition $TaskFamily --desired-count 1 --region $Region
    } else {
        throw "Service does not exist"
    }
} catch {
    aws ecs create-service --cli-input-json file://service-definition.json --region $Region
    Write-ColorOutput Green "✅ ECS service $ServiceName created successfully"
}

# Step 9: Create Launch Template for GPU instances
Write-ColorOutput Yellow "🖥️ Creating launch template for GPU instances..."
$LaunchTemplateName = "gameforge-sdxl-gpu-template"

$userDataEncoded = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userData))

$launchTemplateData = @"
{
  "LaunchTemplateName": "$LaunchTemplateName",
  "LaunchTemplateData": {
    "ImageId": "ami-0c02fb55956c7d316",
    "InstanceType": "g4dn.xlarge",
    "KeyName": "gameforge-key",
    "SecurityGroupIds": ["$SecurityGroupId"],
    "IamInstanceProfile": {
      "Name": "ecsInstanceRole"
    },
    "UserData": "$userDataEncoded",
    "TagSpecifications": [
      {
        "ResourceType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": "GameForge-SDXL-GPU"
          },
          {
            "Key": "Project",
            "Value": "GameForge"
          }
        ]
      }
    ]
  }
}
"@

try {
    aws ec2 describe-launch-templates --launch-template-names $LaunchTemplateName --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ Launch template $LaunchTemplateName already exists"
    } else {
        throw "Launch template does not exist"
    }
} catch {
    $launchTemplateData | Out-File -FilePath "launch-template.json" -Encoding UTF8
    aws ec2 create-launch-template --cli-input-json file://launch-template.json --region $Region
    Write-ColorOutput Green "✅ Launch template $LaunchTemplateName created successfully"
}

# Step 10: Create Auto Scaling Group
Write-ColorOutput Yellow "📈 Creating Auto Scaling Group for GPU instances..."
$ASGName = "gameforge-sdxl-asg"

try {
    aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASGName --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ Auto Scaling Group $ASGName already exists"
    } else {
        throw "ASG does not exist"
    }
} catch {
    aws autoscaling create-auto-scaling-group --auto-scaling-group-name $ASGName --launch-template "LaunchTemplateName=$LaunchTemplateName,Version=`$Latest" --min-size 0 --max-size 2 --desired-capacity 1 --vpc-zone-identifier $SubnetIds[0] --tags "Key=Name,Value=GameForge-SDXL-GPU,PropagateAtLaunch=true" --region $Region
    
    Write-ColorOutput Green "✅ Auto Scaling Group $ASGName created successfully"
}

# Cleanup temporary files
Remove-Item "task-definition.json", "service-definition.json", "launch-template.json" -ErrorAction SilentlyContinue

Write-ColorOutput Green "🎉 Phase C deployment completed successfully!"
Write-ColorOutput Green "📋 Deployment Summary:"
Write-Output "  • Docker Image: $ECR_URI"
Write-Output "  • ECS Cluster: $ClusterName"
Write-Output "  • ECS Service: $ServiceName"
Write-Output "  • Task Definition: $TaskFamily"
Write-Output "  • Security Group: $SecurityGroupId" 
Write-Output "  • Launch Template: $LaunchTemplateName"
Write-Output "  • Auto Scaling Group: $ASGName"
Write-Output ""

Write-ColorOutput Yellow "📝 Next Steps:"
Write-Output "  1. Wait for ECS service to start (may take 5-10 minutes)"
Write-Output "  2. Check service status: aws ecs describe-services --cluster $ClusterName --services $ServiceName"
Write-Output "  3. Monitor logs: aws logs tail /aws/ecs/gameforge-sdxl --follow"
Write-Output "  4. Test endpoint: curl http://<public-ip>:8000/health"
Write-Output ""

Write-ColorOutput Green "🚀 GameForge SDXL GPU Service is deploying!"
