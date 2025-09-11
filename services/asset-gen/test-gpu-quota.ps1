# Test GPU Instance Launch
# Simple test to check if GPU quota has been increased

param(
    [string]$Region = "us-west-2"
)

Write-Host "Testing GPU Instance Launch Capability..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Set region
$env:AWS_DEFAULT_REGION = $Region

Write-Host "Attempting to launch g5.xlarge instance (dry-run)..." -ForegroundColor Cyan

try {
    # Try dry-run first
    aws ec2 run-instances `
        --image-id ami-090343e712263b4bd `
        --instance-type g5.xlarge `
        --security-group-ids sg-0baab5055121ef1a9 `
        --subnet-id subnet-023085c5b218b5ec6 `
        --iam-instance-profile Name=gameforge-gpu-instance-profile `
        --user-data file://user-data.txt `
        --dry-run `
        --region $Region 2>$null
    
    Write-Host "SUCCESS: GPU quota appears to be available!" -ForegroundColor Green
    Write-Host "You can now launch GPU instances." -ForegroundColor Green
    
} catch {
    $errorMessage = $_.Exception.Message
    
    if ($errorMessage -match "VcpuLimitExceeded") {
        Write-Host "GPU quota still not approved" -ForegroundColor Yellow
        Write-Host "Current vCPU limit for GPU instances: 0" -ForegroundColor Yellow
        Write-Host "Please wait for quota increase approval" -ForegroundColor Yellow
    } elseif ($errorMessage -match "DryRunOperation") {
        Write-Host "SUCCESS: GPU quota is available!" -ForegroundColor Green
        Write-Host "The dry-run succeeded, meaning you can launch GPU instances" -ForegroundColor Green
    } else {
        Write-Host "Other error occurred: $errorMessage" -ForegroundColor Red
    }
}

Write-Host "`nGPU Quota Test Complete!" -ForegroundColor Green
