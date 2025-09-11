# Check current GPU quota status
Write-Host "Checking GPU Instance Quotas..." -ForegroundColor Cyan

# Check current quota
aws service-quotas get-service-quota --service-code ec2 --quota-code L-DB2E81BA --region us-west-2

# Check quota request history
Write-Host "`nChecking quota request history..." -ForegroundColor Cyan
aws service-quotas list-requested-service-quota-change-history --service-code ec2 --region us-west-2 --query "RequestedQuotas[?QuotaCode=='L-DB2E81BA']"

Write-Host "`nIf quota is approved, you can now launch GPU instances!" -ForegroundColor Green
