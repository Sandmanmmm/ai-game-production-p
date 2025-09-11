# AWS Phase A Deployment Script (Simplified)
# GameForge SDXL Service Infrastructure Setup

param(
    [string]$Region = "us-east-1",
    [string]$BucketPrefix = "gameforge-models",
    [string]$ServiceName = "gameforge-sdxl"
)

# Color output function
function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    $colors = @{
        'Red' = 'Red'; 'Green' = 'Green'; 'Yellow' = 'Yellow'; 
        'Blue' = 'Blue'; 'Magenta' = 'Magenta'; 'Cyan' = 'Cyan'
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput Cyan "🚀 Starting AWS Phase A Deployment..."
Write-ColorOutput Yellow "📍 Region: $Region"

# Check AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
}

# Get AWS Account ID
Write-ColorOutput Yellow "🔍 Getting AWS Account ID..."
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Failed to get AWS Account ID. Please configure AWS CLI."
    exit 1
}
Write-ColorOutput Green "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# Generate unique bucket name
$RandomSuffix = -join ((1..8) | ForEach {Get-Random -input ([char[]]"abcdefghijklmnopqrstuvwxyz0123456789")})
$BucketName = "$BucketPrefix-$RandomSuffix"

Write-ColorOutput Yellow "📦 Creating S3 bucket: $BucketName"

# Create S3 bucket
try {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $BucketName --region $Region
    } else {
        aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ S3 bucket created: $BucketName"
        
        # Enable versioning
        aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled
        Write-ColorOutput Green "✅ S3 versioning enabled"
        
        # Set server-side encryption
        aws s3api put-bucket-encryption --bucket $BucketName --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    },
                    "BucketKeyEnabled": true
                }
            ]
        }'
        Write-ColorOutput Green "✅ S3 encryption enabled"
    } else {
        Write-ColorOutput Red "❌ Failed to create S3 bucket"
        exit 1
    }
} catch {
    Write-ColorOutput Red "❌ S3 bucket creation failed: $($_.Exception.Message)"
    exit 1
}

# Create ECR repository
Write-ColorOutput Yellow "🐳 Creating ECR repository..."
$RepoName = "$ServiceName-service"

try {
    aws ecr create-repository --repository-name $RepoName --region $Region
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ ECR repository created: $RepoName"
    } else {
        # Repository might already exist
        aws ecr describe-repositories --repository-names $RepoName --region $Region >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✅ ECR repository already exists: $RepoName"
        } else {
            Write-ColorOutput Red "❌ Failed to create/verify ECR repository"
            exit 1
        }
    }
} catch {
    Write-ColorOutput Red "❌ ECR repository creation failed: $($_.Exception.Message)"
    exit 1
}

# Create CloudWatch Log Group
Write-ColorOutput Yellow "📊 Creating CloudWatch log group..."
$LogGroupName = "/aws/ecs/$ServiceName"

try {
    aws logs create-log-group --log-group-name $LogGroupName --region $Region
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ CloudWatch log group created: $LogGroupName"
    } else {
        # Log group might already exist
        aws logs describe-log-groups --log-group-name-prefix $LogGroupName --region $Region >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✅ CloudWatch log group already exists: $LogGroupName"
        } else {
            Write-ColorOutput Yellow "⚠️ CloudWatch log group creation failed, but continuing..."
        }
    }
} catch {
    Write-ColorOutput Yellow "⚠️ CloudWatch log group creation failed: $($_.Exception.Message)"
}

# Create IAM roles
Write-ColorOutput Yellow "🔐 Creating IAM roles..."
$TaskRoleName = "GameForgeSDXLTaskRole"
$ExecutionRoleName = "GameForgeSDXLExecutionRole"

# Task Role Trust Policy
$TaskTrustPolicy = @'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
'@

$TaskTrustPolicy | Out-File -FilePath "task-trust-policy.json" -Encoding UTF8

try {
    aws iam create-role --role-name $TaskRoleName --assume-role-policy-document file://task-trust-policy.json
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM task role created: $TaskRoleName"
    } else {
        Write-ColorOutput Green "✅ IAM task role already exists: $TaskRoleName"
    }
} catch {
    Write-ColorOutput Green "✅ IAM task role already exists: $TaskRoleName"
}

# Execution Role
try {
    aws iam create-role --role-name $ExecutionRoleName --assume-role-policy-document file://task-trust-policy.json
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM execution role created: $ExecutionRoleName"
    } else {
        Write-ColorOutput Green "✅ IAM execution role already exists: $ExecutionRoleName"
    }
    
    # Attach AWS managed policy for ECS task execution
    aws iam attach-role-policy --role-name $ExecutionRoleName --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
} catch {
    Write-ColorOutput Green "✅ IAM execution role already exists: $ExecutionRoleName"
}

# Create custom policy for S3 access
$PolicyName = "GameForgeSDXLPolicy"
$CustomPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::$BucketName",
                "arn:aws:s3:::$BucketName/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
"@

$CustomPolicy | Out-File -FilePath "sdxl-policy.json" -Encoding UTF8

try {
    aws iam create-policy --policy-name $PolicyName --policy-document file://sdxl-policy.json
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ IAM custom policy created: $PolicyName"
    } else {
        Write-ColorOutput Green "✅ IAM custom policy already exists: $PolicyName"
    }
    
    # Attach policy to task role
    aws iam attach-role-policy --role-name $TaskRoleName --policy-arn "arn:aws:iam::$($AWS_ACCOUNT_ID):policy/$PolicyName"
} catch {
    Write-ColorOutput Green "✅ IAM custom policy already exists: $PolicyName"
}

# Cleanup temp files
Remove-Item "task-trust-policy.json" -ErrorAction SilentlyContinue
Remove-Item "sdxl-policy.json" -ErrorAction SilentlyContinue

# Save configuration
$Config = @{
    AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID
    REGION = $Region
    S3_BUCKET = $BucketName
    ECR_REPOSITORY = $RepoName
    ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$RepoName"
    TASK_ROLE_ARN = "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$TaskRoleName"
    EXECUTION_ROLE_ARN = "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$ExecutionRoleName"
    LOG_GROUP = $LogGroupName
}

$Config | ConvertTo-Json -Depth 2 | Out-File -FilePath "aws-config.json" -Encoding UTF8

Write-ColorOutput Green "💾 Configuration saved to aws-config.json"

Write-ColorOutput Cyan "🎉 AWS Phase A Infrastructure Deployment Complete!"
Write-ColorOutput Yellow "📝 Summary:"
Write-ColorOutput Green "   ✅ S3 Bucket: $BucketName"
Write-ColorOutput Green "   ✅ ECR Repository: $RepoName"
Write-ColorOutput Green "   ✅ ECR URI: $($Config.ECR_URI)"
Write-ColorOutput Green "   ✅ Task Role: $TaskRoleName"
Write-ColorOutput Green "   ✅ Execution Role: $ExecutionRoleName"
Write-ColorOutput Green "   ✅ Log Group: $LogGroupName"

Write-ColorOutput Cyan "🔥 Next Steps:"
Write-ColorOutput Yellow "   1. Run: .\Upload-Models.ps1 (to upload SDXL models)"
Write-ColorOutput Yellow "   2. Run: docker build -t $ServiceName-service ."
Write-ColorOutput Yellow "   3. Push container to ECR and deploy to ECS"

Write-ColorOutput Green "🚀 Phase A Complete - Ready for Model Upload!"
