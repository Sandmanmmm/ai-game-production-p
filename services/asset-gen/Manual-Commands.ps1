# GameForge AWS Phase A - Manual Commands (No Admin Required)
# Copy and paste these commands one by one

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GameForge AWS Phase A - Manual Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate a unique suffix for the bucket
$randomSuffix = -join ((1..8) | ForEach-Object {Get-Random -input ([char[]]"abcdefghijklmnopqrstuvwxyz0123456789")})

Write-Host "STEP 1: Verify AWS CLI Installation" -ForegroundColor Yellow
Write-Host "aws --version" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 2: Configure AWS Credentials" -ForegroundColor Yellow  
Write-Host "aws configure" -ForegroundColor Green
Write-Host "(You'll need your AWS Access Key ID, Secret Key, region=us-east-1, format=json)" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 3: Test AWS Connection" -ForegroundColor Yellow
Write-Host "aws sts get-caller-identity" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 4: Create S3 Bucket (copy this exact command)" -ForegroundColor Yellow
$bucketCommand = "aws s3api create-bucket --bucket gameforge-models-$randomSuffix --region us-east-1"
Write-Host $bucketCommand -ForegroundColor Green
Write-Host ""

Write-Host "STEP 5: Create ECR Repository" -ForegroundColor Yellow
Write-Host "aws ecr create-repository --repository-name gameforge-sdxl-service --region us-east-1" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 6: Create CloudWatch Log Group" -ForegroundColor Yellow
Write-Host "aws logs create-log-group --log-group-name /aws/ecs/gameforge-sdxl --region us-east-1" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 7: Save Your Configuration" -ForegroundColor Yellow
Write-Host "After running the above commands successfully, run:" -ForegroundColor White
Write-Host ".\Save-Config.ps1" -ForegroundColor Green
Write-Host ""

# Save the bucket name for later use
$config = @{
    SUGGESTED_BUCKET_NAME = "gameforge-models-$randomSuffix"
    TIMESTAMP = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$config | ConvertTo-Json | Out-File "suggested-config.json" -Encoding UTF8

Write-Host "Generated unique bucket name: gameforge-models-$randomSuffix" -ForegroundColor Magenta
Write-Host "This name has been saved to suggested-config.json" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copy and paste each command above!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
