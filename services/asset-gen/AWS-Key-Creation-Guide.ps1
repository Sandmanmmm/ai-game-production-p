# AWS Access Key Creation Guide
# Step-by-step instructions for creating AWS access keys

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Access Key Creation Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Go to AWS Console" -ForegroundColor Yellow
Write-Host "Open your web browser and go to:" -ForegroundColor White
Write-Host "https://aws.amazon.com/console/" -ForegroundColor Green
Write-Host "Sign in to your AWS account" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Navigate to IAM (Identity and Access Management)" -ForegroundColor Yellow
Write-Host "• In the AWS Console, search for 'IAM' in the search bar" -ForegroundColor White
Write-Host "• Click on 'IAM' service" -ForegroundColor White
Write-Host "• Or go directly to: https://console.aws.amazon.com/iam/" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 3: Create a New User for GameForge" -ForegroundColor Yellow
Write-Host "• Click on 'Users' in the left sidebar" -ForegroundColor White
Write-Host "• Click 'Create user' button" -ForegroundColor White
Write-Host "• Enter username: 'gameforge-sdxl-user'" -ForegroundColor Green
Write-Host "• Check 'Provide user access to the AWS Management Console' (optional)" -ForegroundColor Gray
Write-Host "• Click 'Next'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Attach Permissions" -ForegroundColor Yellow
Write-Host "• Select 'Attach policies directly'" -ForegroundColor White
Write-Host "• Search for and select these policies:" -ForegroundColor White
Write-Host "  ✓ AmazonS3FullAccess" -ForegroundColor Green
Write-Host "  ✓ AmazonECS_FullAccess" -ForegroundColor Green
Write-Host "  ✓ AmazonEC2ContainerRegistryFullAccess" -ForegroundColor Green
Write-Host "  ✓ CloudWatchLogsFullAccess" -ForegroundColor Green
Write-Host "  ✓ IAMFullAccess (needed for creating roles)" -ForegroundColor Green
Write-Host "• Click 'Next'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 5: Review and Create" -ForegroundColor Yellow
Write-Host "• Review the user details" -ForegroundColor White
Write-Host "• Click 'Create user'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 6: Create Access Keys" -ForegroundColor Yellow
Write-Host "• Click on the newly created user 'gameforge-sdxl-user'" -ForegroundColor White
Write-Host "• Go to the 'Security credentials' tab" -ForegroundColor White
Write-Host "• Scroll down to 'Access keys' section" -ForegroundColor White
Write-Host "• Click 'Create access key'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 7: Select Use Case" -ForegroundColor Yellow
Write-Host "• Select 'Command Line Interface (CLI)'" -ForegroundColor Green
Write-Host "• Check the confirmation checkbox" -ForegroundColor White
Write-Host "• Click 'Next'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 8: Add Description (Optional)" -ForegroundColor Yellow
Write-Host "• Add description: 'GameForge SDXL Service Access'" -ForegroundColor Green
Write-Host "• Click 'Create access key'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 9: IMPORTANT - Save Your Keys!" -ForegroundColor Red
Write-Host "• Copy the 'Access key ID'" -ForegroundColor White
Write-Host "• Copy the 'Secret access key'" -ForegroundColor White
Write-Host "• SAVE THESE SAFELY - You won't be able to see the secret again!" -ForegroundColor Red
Write-Host "• Download the .csv file as backup" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After Creating Keys, Come Back Here!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT: Configure AWS CLI" -ForegroundColor Yellow
Write-Host "Once you have your keys, run:" -ForegroundColor White
Write-Host "aws configure" -ForegroundColor Green
Write-Host ""
Write-Host "You'll be prompted for:" -ForegroundColor White
Write-Host "• AWS Access Key ID: [paste your access key]" -ForegroundColor Gray
Write-Host "• AWS Secret Access Key: [paste your secret key]" -ForegroundColor Gray
Write-Host "• Default region name: us-east-1" -ForegroundColor Gray
Write-Host "• Default output format: json" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Links:" -ForegroundColor Cyan
Write-Host "AWS Console: https://aws.amazon.com/console/" -ForegroundColor Blue
Write-Host "IAM Direct: https://console.aws.amazon.com/iam/" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Cyan
