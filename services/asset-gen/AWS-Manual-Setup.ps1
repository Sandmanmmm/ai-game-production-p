# GameForge AWS Phase A - Manual Setup Instructions
# Step-by-step guide for AWS infrastructure setup

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "GameForge AWS Phase A - Manual Setup Guide" -ForegroundColor Cyan  
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Install AWS CLI" -ForegroundColor Yellow
Write-Host "Download and install AWS CLI v2 from:" -ForegroundColor White
Write-Host "https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Green
Write-Host ""
Write-Host "After installation, restart PowerShell and verify:" -ForegroundColor White
Write-Host "aws --version" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 2: Configure AWS Credentials" -ForegroundColor Yellow
Write-Host "Run the following command and provide your AWS credentials:" -ForegroundColor White
Write-Host "aws configure" -ForegroundColor Gray
Write-Host ""
Write-Host "You will need:" -ForegroundColor White
Write-Host "- AWS Access Key ID" -ForegroundColor White
Write-Host "- AWS Secret Access Key" -ForegroundColor White
Write-Host "- Default region name (e.g., us-east-1)" -ForegroundColor White
Write-Host "- Default output format (json)" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Create S3 Bucket" -ForegroundColor Yellow
Write-Host "Replace 'your-unique-suffix' with random characters:" -ForegroundColor White
Write-Host 'aws s3api create-bucket --bucket gameforge-models-your-unique-suffix --region us-east-1' -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 4: Create ECR Repository" -ForegroundColor Yellow
Write-Host "aws ecr create-repository --repository-name gameforge-sdxl-service --region us-east-1" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 5: Create CloudWatch Log Group" -ForegroundColor Yellow
Write-Host "aws logs create-log-group --log-group-name /aws/ecs/gameforge-sdxl --region us-east-1" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 6: Get Account Information" -ForegroundColor Yellow
Write-Host "aws sts get-caller-identity --query Account --output text" -ForegroundColor Gray
Write-Host ""

Write-Host "After completing these steps manually, you can:" -ForegroundColor Green
Write-Host "1. Upload models with: .\Upload-Models.ps1" -ForegroundColor White
Write-Host "2. Build Docker container: docker build -t gameforge-sdxl-service ." -ForegroundColor White
Write-Host "3. Deploy to ECS" -ForegroundColor White
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "For automated setup (requires Admin rights):" -ForegroundColor Cyan
Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
Write-Host "Then run: .\Setup-AWS.ps1" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
