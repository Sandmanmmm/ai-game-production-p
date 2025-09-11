# GameForge SDXL Service AWS Deployment Script - PowerShell Version
# Phase A: Infrastructure Setup

param(
    [string]$Region = "us-east-1",
    [string]$BucketName = "gameforge-models", 
    [string]$ECRRepo = "gameforge/sdxl-worker"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 Starting GameForge SDXL AWS Deployment - Phase A"

# Check if AWS CLI is configured
try {
    $null = aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not configured"
    }
} catch {
    Write-ColorOutput Red "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
}

# Get AWS Account ID
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-ColorOutput Green "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# Step 1: Create S3 Bucket for Model Storage
Write-ColorOutput Yellow "📦 Creating S3 bucket for model storage..."
try {
    aws s3api head-bucket --bucket $BucketName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ S3 bucket $BucketName already exists"
    } else {
        throw "Bucket does not exist"
    }
} catch {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $BucketName --region $Region
    } else {
        aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
    }
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled
    
    # Create bucket policy
    $bucketPolicy = @"
{
    `"Version`": `"2012-10-17`",
    `"Statement`": [
        {
            `"Sid`": `"GameForgeModelAccess`",
            `"Effect`": `"Allow`",
            `"Principal`": {
                `"AWS`": `"arn:aws:iam::$AWS_ACCOUNT_ID:root`"
            },
            `"Action`": [
                `"s3:GetObject`",
                `"s3:PutObject`", 
                `"s3:DeleteObject`",
                `"s3:ListBucket`"
            ],
            `"Resource`": [
                `"arn:aws:s3:::$BucketName`",
                `"arn:aws:s3:::$BucketName/*`"
            ]
        }
    ]
}
"@
    
    $bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8
    aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json
    Remove-Item "bucket-policy.json"
    
    Write-ColorOutput Green "✅ S3 bucket $BucketName created successfully"
}

# Step 2: Create ECR Repository
Write-ColorOutput Yellow "🐳 Creating ECR repository..."
try {
    aws ecr describe-repositories --repository-names $ECRRepo --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ ECR repository $ECRRepo already exists"
    } else {
        throw "Repository does not exist"
    }
} catch {
    aws ecr create-repository --repository-name $ECRRepo --region $Region
    Write-ColorOutput Green "✅ ECR repository $ECRRepo created successfully"
}

# Step 3: Build and Push Docker Image
Write-ColorOutput Yellow "🔨 Building Docker image..."
docker build -t gameforge-sdxl:latest .

# Authenticate Docker to ECR
Write-ColorOutput Yellow "🔐 Authenticating Docker to ECR..."
$loginCommand = aws ecr get-login-password --region $Region
$loginCommand | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com"

# Tag and push image
$ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ECRRepo`:latest"
Write-ColorOutput Yellow "🏷️ Tagging image: $ECR_URI"
docker tag gameforge-sdxl:latest $ECR_URI

Write-ColorOutput Yellow "📤 Pushing image to ECR..."
docker push $ECR_URI

Write-ColorOutput Green "✅ Docker image pushed successfully"
Write-ColorOutput Green "📍 ECR Image URI: $ECR_URI"

# Step 4: Create IAM Roles
Write-ColorOutput Yellow "👤 Creating IAM roles for ECS task..."
$RoleName = "GameForgeSDXLTaskRole"
$ExecutionRoleName = "GameForgeSDXLExecutionRole"

# Create trust policy
$trustPolicy = @"
{
    `"Version`": `"2012-10-17`",
    `"Statement`": [
        {
            `"Effect`": `"Allow`",
            `"Principal`": {
                `"Service`": `"ecs-tasks.amazonaws.com`"
            },
            `"Action`": `"sts:AssumeRole`"
        }
    ]
}
"@

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8

# Create task role if it doesn't exist
try {
    aws iam get-role --role-name $RoleName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM role $RoleName already exists"
    } else {
        throw "Role does not exist"
    }
} catch {
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://trust-policy.json
    Write-ColorOutput Green "✅ IAM role $RoleName created"
}

# Create execution role
try {
    aws iam get-role --role-name $ExecutionRoleName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM execution role $ExecutionRoleName already exists"
    } else {
        throw "Execution role does not exist"
    }
} catch {
    aws iam create-role --role-name $ExecutionRoleName --assume-role-policy-document file://trust-policy.json
    aws iam attach-role-policy --role-name $ExecutionRoleName --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    Write-ColorOutput Green "✅ IAM execution role $ExecutionRoleName created"
}

# Create custom policy
$PolicyName = "GameForgeSDXLPolicy"
$customPolicy = @"
{
    `"Version`": `"2012-10-17`",
    `"Statement`": [
        {
            `"Effect`": `"Allow`",
            `"Action`": [
                `"s3:GetObject`",
                `"s3:PutObject`",
                `"s3:DeleteObject`", 
                `"s3:ListBucket`"
            ],
            `"Resource`": [
                `"arn:aws:s3:::$BucketName`",
                `"arn:aws:s3:::$BucketName/*`"
            ]
        },
        {
            `"Effect`": `"Allow`",
            `"Action`": [
                `"logs:CreateLogGroup`",
                `"logs:CreateLogStream`",
                `"logs:PutLogEvents`"
            ],
            `"Resource`": `"*`"
        }
    ]
}
"@

$customPolicy | Out-File -FilePath "sdxl-policy.json" -Encoding UTF8

# Create and attach policy
try {
    aws iam get-policy --policy-arn "arn:aws:iam::$($AWS_ACCOUNT_ID):policy/$PolicyName" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM policy $PolicyName already exists"
    } else {
        throw "Policy does not exist"
    }
} catch {
    aws iam create-policy --policy-name $PolicyName --policy-document file://sdxl-policy.json
    Write-ColorOutput Green "✅ IAM policy $PolicyName created"
}

aws iam attach-role-policy --role-name $RoleName --policy-arn "arn:aws:iam::$($AWS_ACCOUNT_ID):policy/$PolicyName"

# Cleanup
Remove-Item "trust-policy.json", "sdxl-policy.json" -ErrorAction SilentlyContinue

Write-ColorOutput Green "🎉 Phase A deployment completed successfully!"
Write-ColorOutput Green "📋 Summary:"
Write-Output "  • S3 Bucket: $BucketName"
Write-Output "  • ECR Repository: $ECRRepo"  
Write-Output "  • Docker Image: $ECR_URI"
Write-Output "  • IAM Task Role: $RoleName"
Write-Output "  • IAM Execution Role: $ExecutionRoleName"
Write-Output ""
Write-ColorOutput Yellow "📝 Next Steps:"
Write-Output "  1. Upload SDXL model files to S3: s3://$BucketName/sdxl-base/"
Write-Output "  2. Create ECS cluster and task definition"
Write-Output "  3. Deploy service to ECS with GPU instances"
