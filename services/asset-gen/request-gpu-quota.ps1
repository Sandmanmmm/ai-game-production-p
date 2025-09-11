# AWS CLI Service Quota Request Script
# Request GPU instance quota increase

# Set region
$env:AWS_DEFAULT_REGION = "us-west-2"

Write-Host "Requesting GPU Instance Quota Increase..." -ForegroundColor Cyan

# Request quota increase for G and VT instances
aws service-quotas request-service-quota-increase `
  --service-code ec2 `
  --quota-code L-DB2E81BA `
  --desired-value 8 `
  --region us-west-2

Write-Host "Quota increase request submitted!" -ForegroundColor Green
Write-Host "Check status with: aws service-quotas list-requested-service-quota-change-history --region us-west-2" -ForegroundColor Yellow
