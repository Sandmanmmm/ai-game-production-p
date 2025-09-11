# Deploy Optimized SDXL Service to AWS ECS Fargate
# This script upgrades the existing service with CPU-optimized SDXL model
Write-Host "🚀 GameForge SDXL Optimized Deployment - CPU Version" -ForegroundColor Cyan

# Configuration
$CLUSTER_NAME = "gameforge-cluster"
$SERVICE_NAME = "gameforge-sdxl-service"
$TASK_FAMILY = "gameforge-sdxl-optimized-task"
$LOG_GROUP = "/ecs/gameforge-sdxl-optimized"
$REGION = "us-east-1"

# Function to check if AWS CLI is installed and configured
function Test-AWSConfiguration {
    Write-Host "🔍 Checking AWS CLI configuration..." -ForegroundColor Yellow
    
    try {
        $awsTest = aws sts get-caller-identity 2>$null | ConvertFrom-Json
        if ($awsTest) {
            Write-Host "✅ AWS CLI configured for account: $($awsTest.Account)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ AWS CLI not configured or not installed" -ForegroundColor Red
        Write-Host "Please run: aws configure" -ForegroundColor Yellow
        return $false
    }
    return $false
}

# Function to create CloudWatch Log Group if it doesn't exist
function New-CloudWatchLogGroup {
    param([string]$LogGroup)
    
    Write-Host "🔍 Checking CloudWatch Log Group: $LogGroup" -ForegroundColor Yellow
    
    try {
        $logGroups = aws logs describe-log-groups --log-group-name-prefix $LogGroup --region $REGION | ConvertFrom-Json
        $exists = $logGroups.logGroups | Where-Object { $_.logGroupName -eq $LogGroup }
        
        if (-not $exists) {
            Write-Host "📝 Creating CloudWatch Log Group..." -ForegroundColor Yellow
            aws logs create-log-group --log-group-name $LogGroup --region $REGION
            Write-Host "✅ Log Group created: $LogGroup" -ForegroundColor Green
        }
        else {
            Write-Host "✅ Log Group already exists: $LogGroup" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Failed to create/check log group: $_" -ForegroundColor Red
        return $false
    }
    return $true
}

# Function to register new task definition
function Register-OptimizedTaskDefinition {
    Write-Host "📋 Registering optimized task definition..." -ForegroundColor Yellow
    
    try {
        $taskDefPath = "ecs-task-definition-optimized.json"
        if (-not (Test-Path $taskDefPath)) {
            Write-Host "❌ Task definition file not found: $taskDefPath" -ForegroundColor Red
            return $null
        }
        
        $result = aws ecs register-task-definition --cli-input-json file://$taskDefPath --region $REGION | ConvertFrom-Json
        
        if ($result.taskDefinition) {
            Write-Host "✅ Task definition registered: $($result.taskDefinition.family):$($result.taskDefinition.revision)" -ForegroundColor Green
            return $result.taskDefinition
        }
        else {
            Write-Host "❌ Failed to register task definition" -ForegroundColor Red
            return $null
        }
    }
    catch {
        Write-Host "❌ Error registering task definition: $_" -ForegroundColor Red
        return $null
    }
}

# Function to update existing ECS service
function Update-OptimizedECSService {
    param([object]$TaskDefinition)
    
    Write-Host "🔄 Updating ECS Service with optimized task definition..." -ForegroundColor Yellow
    
    try {
        $taskDefArn = $TaskDefinition.taskDefinitionArn
        
        # Update the service to use new task definition
        $result = aws ecs update-service `
            --cluster $CLUSTER_NAME `
            --service $SERVICE_NAME `
            --task-definition $taskDefArn `
            --force-new-deployment `
            --region $REGION | ConvertFrom-Json
        
        if ($result.service) {
            Write-Host "✅ Service update initiated successfully" -ForegroundColor Green
            return $result.service
        }
        else {
            Write-Host "❌ Failed to update service" -ForegroundColor Red
            return $null
        }
    }
    catch {
        Write-Host "❌ Error updating service: $_" -ForegroundColor Red
        return $null
    }
}

# Function to wait for deployment to complete
function Wait-ForOptimizedDeployment {
    param([string]$ServiceName)
    
    Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
    Write-Host "This may take 5-10 minutes for the model to load..." -ForegroundColor Cyan
    
    $maxAttempts = 40
    $attempt = 0
    
    do {
        $attempt++
        Write-Host "🔍 Checking deployment status... (Attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        
        try {
            $service = aws ecs describe-services --cluster $CLUSTER_NAME --services $ServiceName --region $REGION | ConvertFrom-Json
            $serviceDetails = $service.services[0]
            
            $runningCount = $serviceDetails.runningCount
            $desiredCount = $serviceDetails.desiredCount
            $status = $serviceDetails.status
            
            # Check deployment status
            $deployments = $serviceDetails.deployments
            $primaryDeployment = $deployments | Where-Object { $_.status -eq "PRIMARY" }
            
            if ($primaryDeployment -and $primaryDeployment.runningCount -eq $primaryDeployment.desiredCount -and $status -eq "ACTIVE") {
                Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
                Write-Host "📊 Service Status:" -ForegroundColor Cyan
                Write-Host "  - Running Tasks: $runningCount/$desiredCount" -ForegroundColor White
                Write-Host "  - Service Status: $status" -ForegroundColor White
                return $true
            }
            
            Write-Host "⏳ Status: $status, Tasks: $runningCount/$desiredCount" -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
        catch {
            Write-Host "⚠️ Error checking service status: $_" -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
        
    } while ($attempt -lt $maxAttempts)
    
    Write-Host "⚠️ Deployment check timed out. Service may still be starting..." -ForegroundColor Yellow
    return $false
}

# Function to get service endpoint
function Get-ServiceEndpoint {
    Write-Host "🔍 Getting service endpoint..." -ForegroundColor Yellow
    
    try {
        # Get service details
        $service = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION | ConvertFrom-Json
        $serviceDetails = $service.services[0]
        
        # Get task ARNs
        $tasks = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $REGION | ConvertFrom-Json
        
        if ($tasks.taskArns -and $tasks.taskArns.Count -gt 0) {
            # Get task details
            $taskDetails = aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $tasks.taskArns[0] --region $REGION | ConvertFrom-Json
            $task = $taskDetails.tasks[0]
            
            # Get ENI ID from network interfaces
            $networkInterfaces = $task.attachments | Where-Object { $_.type -eq "ElasticNetworkInterface" }
            if ($networkInterfaces) {
                $eniId = ($networkInterfaces[0].details | Where-Object { $_.name -eq "networkInterfaceId" }).value
                
                if ($eniId) {
                    # Get public IP from ENI
                    $eni = aws ec2 describe-network-interfaces --network-interface-ids $eniId --region $REGION | ConvertFrom-Json
                    $publicIp = $eni.NetworkInterfaces[0].Association.PublicIp
                    
                    if ($publicIp) {
                        $endpoint = "http://${publicIp}:8080"
                        Write-Host "🌐 Service Endpoint: $endpoint" -ForegroundColor Green
                        return $endpoint
                    }
                }
            }
        }
        
        Write-Host "⚠️ Could not determine service endpoint" -ForegroundColor Yellow
        return $null
    }
    catch {
        Write-Host "❌ Error getting service endpoint: $_" -ForegroundColor Red
        return $null
    }
}

# Function to test optimized service
function Test-OptimizedService {
    param([string]$Endpoint)
    
    if (-not $Endpoint) {
        Write-Host "⚠️ No endpoint available for testing" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🧪 Testing Optimized SDXL Service..." -ForegroundColor Cyan
    
    # Test health endpoint
    Write-Host "🔍 Testing health endpoint..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-RestMethod -Uri "$Endpoint/health" -Method Get -TimeoutSec 30
        Write-Host "✅ Health Check Response:" -ForegroundColor Green
        Write-Host ($healthResponse | ConvertTo-Json -Depth 3) -ForegroundColor White
        
        if ($healthResponse.status -eq "healthy") {
            Write-Host "✅ Service is healthy and ready!" -ForegroundColor Green
        }
        elseif ($healthResponse.status -eq "loading") {
            Write-Host "⏳ Service is still loading the model..." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️ Health check failed: $_" -ForegroundColor Yellow
        Write-Host "Service may still be starting up..." -ForegroundColor Cyan
    }
    
    # Test model status
    Write-Host "🔍 Testing model status endpoint..." -ForegroundColor Yellow
    try {
        $statusResponse = Invoke-RestMethod -Uri "$Endpoint/model-status" -Method Get -TimeoutSec 30
        Write-Host "✅ Model Status Response:" -ForegroundColor Green
        Write-Host ($statusResponse | ConvertTo-Json -Depth 3) -ForegroundColor White
    }
    catch {
        Write-Host "⚠️ Model status check failed: $_" -ForegroundColor Yellow
        Write-Host "Model may still be loading..." -ForegroundColor Cyan
    }
    
    # Test image generation (if service is ready)
    Write-Host "🎨 Testing image generation..." -ForegroundColor Yellow
    try {
        $generateRequest = @{
            prompt = "a futuristic game character, digital art style"
            width = 512
            height = 512
            steps = 20
            guidance_scale = 7.5
        }
        
        $generateResponse = Invoke-RestMethod -Uri "$Endpoint/generate" -Method Post -Body ($generateRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 180
        
        if ($generateResponse.image) {
            Write-Host "✅ Image generation successful!" -ForegroundColor Green
            Write-Host "📊 Generation Metadata:" -ForegroundColor Cyan
            Write-Host ($generateResponse.metadata | ConvertTo-Json -Depth 2) -ForegroundColor White
            Write-Host "🖼️ Generated image size: $($generateResponse.image.Length) characters (base64)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️ Image generation test failed: $_" -ForegroundColor Yellow
        Write-Host "This is normal if the model is still loading..." -ForegroundColor Cyan
    }
}

# Main deployment process
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  GameForge SDXL CPU Optimization Deployment" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

# Check AWS configuration
if (-not (Test-AWSConfiguration)) {
    exit 1
}

# Create CloudWatch Log Group
if (-not (New-CloudWatchLogGroup -LogGroup $LOG_GROUP)) {
    exit 1
}

# Register optimized task definition
$taskDefinition = Register-OptimizedTaskDefinition
if (-not $taskDefinition) {
    exit 1
}

# Update ECS service
$service = Update-OptimizedECSService -TaskDefinition $taskDefinition
if (-not $service) {
    exit 1
}

# Wait for deployment
$deploymentSuccess = Wait-ForOptimizedDeployment -ServiceName $SERVICE_NAME

# Get service endpoint
$endpoint = Get-ServiceEndpoint

# Test the optimized service
Test-OptimizedService -Endpoint $endpoint

# Final summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       🎉 OPTIMIZATION DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "📋 Task Definition: $($taskDefinition.family):$($taskDefinition.revision)" -ForegroundColor White
Write-Host "🏗️ Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "🌐 Endpoint: $endpoint" -ForegroundColor White
Write-Host "🔧 Model: Segmind/SSD-1B (CPU-optimized SDXL)" -ForegroundColor White
Write-Host "⚡ Optimizations: Model caching, attention slicing, torch compile" -ForegroundColor White
Write-Host "💾 Memory: 16GB Fargate task" -ForegroundColor White

if ($deploymentSuccess) {
    Write-Host "✅ CPU-optimized SDXL service deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Deployment may still be in progress. Check AWS console." -ForegroundColor Yellow
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 5-10 minutes for model to fully load" -ForegroundColor White
Write-Host "2. Test: curl $endpoint/health" -ForegroundColor White
Write-Host "3. Monitor logs in CloudWatch: $LOG_GROUP" -ForegroundColor White
Write-Host "4. For GPU version, run: ./Deploy-GPU-Production.ps1" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
