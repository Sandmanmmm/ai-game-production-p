# Save Configuration After Manual Setup
# Run this after successfully creating AWS resources manually

Write-Host "Collecting AWS configuration..." -ForegroundColor Yellow

# Get AWS Account ID
try {
    $accountId = aws sts get-caller-identity --query Account --output text
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS Account ID: $accountId" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to get AWS Account ID. Make sure 'aws configure' is completed." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ AWS CLI error. Make sure AWS is configured: aws configure" -ForegroundColor Red
    exit 1
}

# Get the suggested bucket name if available
$suggestedBucket = ""
if (Test-Path "suggested-config.json") {
    $suggested = Get-Content "suggested-config.json" | ConvertFrom-Json
    $suggestedBucket = $suggested.SUGGESTED_BUCKET_NAME
    Write-Host "Suggested bucket name found: $suggestedBucket" -ForegroundColor Yellow
}

# Prompt for bucket name
Write-Host ""
Write-Host "Enter the S3 bucket name you created:" -ForegroundColor Yellow
if ($suggestedBucket) {
    Write-Host "(Press Enter to use: $suggestedBucket)" -ForegroundColor Gray
}
$bucketInput = Read-Host
$bucketName = if ($bucketInput) { $bucketInput } else { $suggestedBucket }

if (-not $bucketName) {
    Write-Host "❌ Bucket name is required" -ForegroundColor Red
    exit 1
}

# Verify bucket exists
try {
    aws s3api head-bucket --bucket $bucketName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ S3 bucket verified: $bucketName" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Cannot verify bucket $bucketName (may not exist or no access)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Warning: Cannot verify bucket $bucketName" -ForegroundColor Yellow
}

# Verify ECR repository
try {
    aws ecr describe-repositories --repository-names gameforge-sdxl-service --region us-east-1 >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ECR repository verified: gameforge-sdxl-service" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: ECR repository gameforge-sdxl-service not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Warning: Cannot verify ECR repository" -ForegroundColor Yellow
}

# Create configuration
$region = "us-east-1"
$config = @{
    AWS_ACCOUNT_ID = $accountId
    REGION = $region
    S3_BUCKET = $bucketName
    ECR_REPOSITORY = "gameforge-sdxl-service"
    ECR_URI = "$accountId.dkr.ecr.$region.amazonaws.com/gameforge-sdxl-service"
    LOG_GROUP = "/aws/ecs/gameforge-sdxl"
    SETUP_TYPE = "manual"
    DEPLOYMENT_DATE = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$config | ConvertTo-Json -Depth 2 | Out-File -FilePath "aws-config.json" -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuration saved to aws-config.json" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Phase A Configuration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Account ID: $($config.AWS_ACCOUNT_ID)" -ForegroundColor White
Write-Host "Region: $($config.REGION)" -ForegroundColor White
Write-Host "S3 Bucket: $($config.S3_BUCKET)" -ForegroundColor White
Write-Host "ECR Repository: $($config.ECR_REPOSITORY)" -ForegroundColor White
Write-Host "ECR URI: $($config.ECR_URI)" -ForegroundColor White
Write-Host "Log Group: $($config.LOG_GROUP)" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Phase A Manual Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload models: .\Upload-Models.ps1" -ForegroundColor White
Write-Host "2. Build container: docker build -t gameforge-sdxl-service ." -ForegroundColor White
Write-Host "3. Deploy to ECS" -ForegroundColor White

# Clean up
Remove-Item "suggested-config.json" -ErrorAction SilentlyContinue
