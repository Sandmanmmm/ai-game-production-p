# Deploy Optimized SDXL Service - Simplified Approach
Write-Host "🚀 GameForge SDXL Optimized Deployment" -ForegroundColor Cyan

$CLUSTER_NAME = "gameforge-cluster"
$SERVICE_NAME = "gameforge-sdxl-service" 
$LOG_GROUP = "/ecs/gameforge-sdxl-optimized"
$REGION = "us-east-1"

# Check AWS CLI
Write-Host "🔍 Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsTest = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    Write-Host "✅ AWS CLI configured for account: $($awsTest.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured" -ForegroundColor Red
    exit 1
}

# Create CloudWatch Log Group
Write-Host "📝 Creating CloudWatch Log Group..." -ForegroundColor Yellow
try {
    aws logs create-log-group --log-group-name $LOG_GROUP --region $REGION 2>$null
    Write-Host "✅ Log Group ready: $LOG_GROUP" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Log Group may already exist" -ForegroundColor Cyan
}

# Register task definition
Write-Host "📋 Registering optimized task definition..." -ForegroundColor Yellow
$taskResult = aws ecs register-task-definition --cli-input-json file://ecs-task-definition-optimized.json --region $REGION | ConvertFrom-Json

if ($taskResult.taskDefinition) {
    $taskArn = $taskResult.taskDefinition.taskDefinitionArn
    Write-Host "✅ Task registered: $($taskResult.taskDefinition.family):$($taskResult.taskDefinition.revision)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to register task definition" -ForegroundColor Red
    exit 1
}

# Update service
Write-Host "🔄 Updating ECS Service..." -ForegroundColor Yellow
$updateResult = aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $taskArn --force-new-deployment --region $REGION | ConvertFrom-Json

if ($updateResult.service) {
    Write-Host "✅ Service update initiated" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update service" -ForegroundColor Red
    exit 1
}

# Wait for deployment (simplified)
Write-Host "⏳ Waiting for deployment (this may take 5-10 minutes)..." -ForegroundColor Yellow
$maxWait = 20
for ($i = 1; $i -le $maxWait; $i++) {
    Write-Host "🔍 Checking deployment status... ($i/$maxWait)" -ForegroundColor Yellow
    
    $service = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION | ConvertFrom-Json
    $serviceInfo = $service.services[0]
    $runningCount = $serviceInfo.runningCount
    $desiredCount = $serviceInfo.desiredCount
    
    Write-Host "📊 Tasks: $runningCount/$desiredCount" -ForegroundColor Cyan
    
    if ($runningCount -eq $desiredCount -and $runningCount -gt 0) {
        Write-Host "✅ Deployment completed!" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 30
}

# Get endpoint
Write-Host "🔍 Getting service endpoint..." -ForegroundColor Yellow
$tasks = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $REGION | ConvertFrom-Json

if ($tasks.taskArns -and $tasks.taskArns.Count -gt 0) {
    $taskDetails = aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $tasks.taskArns[0] --region $REGION | ConvertFrom-Json
    $task = $taskDetails.tasks[0]
    
    $networkInterfaces = $task.attachments | Where-Object { $_.type -eq "ElasticNetworkInterface" }
    if ($networkInterfaces) {
        $eniId = ($networkInterfaces[0].details | Where-Object { $_.name -eq "networkInterfaceId" }).value
        
        if ($eniId) {
            $eni = aws ec2 describe-network-interfaces --network-interface-ids $eniId --region $REGION | ConvertFrom-Json
            $publicIp = $eni.NetworkInterfaces[0].Association.PublicIp
            
            if ($publicIp) {
                $endpoint = "http://${publicIp}:8080"
                Write-Host "🌐 Service Endpoint: $endpoint" -ForegroundColor Green
                
                # Test health endpoint
                Write-Host "🧪 Testing service..." -ForegroundColor Yellow
                try {
                    Start-Sleep -Seconds 10  # Give service time to start
                    $healthResponse = Invoke-RestMethod -Uri "$endpoint/health" -Method Get -TimeoutSec 30
                    Write-Host "✅ Health Check: $($healthResponse.status)" -ForegroundColor Green
                    Write-Host ($healthResponse | ConvertTo-Json -Depth 2) -ForegroundColor White
                } catch {
                    Write-Host "⚠️ Service may still be starting: $_" -ForegroundColor Yellow
                }
            }
        }
    }
}

# Summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🔧 Model: Segmind/SSD-1B (CPU-optimized SDXL)" -ForegroundColor White
Write-Host "⚡ Features: Model caching, attention slicing" -ForegroundColor White  
Write-Host "💾 Memory: 16GB Fargate task" -ForegroundColor White
Write-Host "🌐 Endpoint: $endpoint" -ForegroundColor White
Write-Host "📝 Logs: CloudWatch $LOG_GROUP" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Note: Model loading may take 5-10 minutes!" -ForegroundColor Yellow
