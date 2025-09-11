# GameForge GPU Service Deployment Script
# Deploys the ECS service once GPU instances are available

param(
    [string]$Region = "us-west-2",
    [string]$ClusterName = "gameforge-gpu-cluster",
    [switch]$WaitForInstances = $true,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "GameForge GPU Service Deployment" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "Cluster: $ClusterName" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual deployment will be made" -ForegroundColor Yellow
}

# Set region
$env:AWS_DEFAULT_REGION = $Region

# Check if GPU instances are available
Write-Host "`nChecking GPU instance availability..." -ForegroundColor Cyan

if ($WaitForInstances) {
    do {
        $instanceCount = aws ecs describe-clusters --clusters $ClusterName --query "clusters[0].registeredContainerInstancesCount" --output text --region $Region
        Write-Host "GPU instances in cluster: $instanceCount" -ForegroundColor White
        
        if ([int]$instanceCount -eq 0) {
            Write-Host "Waiting for GPU instances to join cluster..." -ForegroundColor Yellow
            Write-Host "Note: Make sure GPU quota is approved and instances are launched" -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        }
    } while ([int]$instanceCount -eq 0)
    
    Write-Host "GPU instances are available!" -ForegroundColor Green
}

# Check if task definition is registered
Write-Host "`nVerifying task definition..." -ForegroundColor Cyan
try {
    $taskDef = aws ecs describe-task-definition --task-definition gameforge-sdxl-gpu-us-west-2 --region $Region | ConvertFrom-Json
    Write-Host "Task definition found: $($taskDef.taskDefinition.taskDefinitionArn)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Task definition not found. Please register it first." -ForegroundColor Red
    exit 1
}

# Deploy the service
Write-Host "`nDeploying GPU service..." -ForegroundColor Cyan

if (-not $DryRun) {
    try {
        aws ecs create-service --cli-input-json file://ecs-service-definition.json --region $Region
        Write-Host "Service deployment initiated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Service deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Would deploy service using: ecs-service-definition.json" -ForegroundColor Yellow
}

# Wait for service to be stable
if (-not $DryRun) {
    Write-Host "`nWaiting for service to stabilize..." -ForegroundColor Cyan
    Write-Host "This may take 5-10 minutes for GPU model loading..." -ForegroundColor Yellow
    
    aws ecs wait services-stable --cluster $ClusterName --services gameforge-sdxl-gpu-service --region $Region
    Write-Host "Service is stable!" -ForegroundColor Green
}

# Get service endpoint
Write-Host "`nRetrieving service endpoint..." -ForegroundColor Cyan
if (-not $DryRun) {
    try {
        $taskArns = aws ecs list-tasks --cluster $ClusterName --service-name gameforge-sdxl-gpu-service --query "taskArns" --output text --region $Region
        
        if ($taskArns) {
            $taskArn = $taskArns -split "\t" | Select-Object -First 1
            $taskDetails = aws ecs describe-tasks --cluster $ClusterName --tasks $taskArn --region $Region | ConvertFrom-Json
            $eni = $taskDetails.tasks[0].attachments[0].details | Where-Object { $_.name -eq "networkInterfaceId" } | Select-Object -ExpandProperty value
            
            if ($eni) {
                $publicIp = aws ec2 describe-network-interfaces --network-interface-ids $eni --query "NetworkInterfaces[0].Association.PublicIp" --output text --region $Region
                
                if ($publicIp -and $publicIp -ne "None") {
                    $serviceUrl = "http://$publicIp:8080"
                    Write-Host "Service URL: $serviceUrl" -ForegroundColor Green
                    Write-Host "Health check: $serviceUrl/health" -ForegroundColor Green
                    Write-Host "API docs: $serviceUrl/docs" -ForegroundColor Green
                } else {
                    Write-Host "Could not retrieve public IP" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        Write-Host "Could not retrieve service endpoint" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`nDeployment Summary:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Task Definition: gameforge-sdxl-gpu-us-west-2:1" -ForegroundColor White
Write-Host "Service: gameforge-sdxl-gpu-service" -ForegroundColor White
Write-Host "Cluster: $ClusterName" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "GPU Type: A10G (g5.xlarge)" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Test the service endpoint" -ForegroundColor White
Write-Host "2. Run performance benchmarks" -ForegroundColor White  
Write-Host "3. Monitor GPU utilization" -ForegroundColor White
Write-Host "4. Update DNS to point to us-west-2" -ForegroundColor White

Write-Host "`nGPU Service Deployment Complete!" -ForegroundColor Green
