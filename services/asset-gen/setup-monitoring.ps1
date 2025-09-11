# CloudWatch Alarms Setup for GameForge GPU Service
# Creates essential monitoring alarms for GPU service

param(
    [string]$Region = "us-west-2",
    [string]$ClusterName = "gameforge-gpu-cluster",
    [string]$ServiceName = "gameforge-sdxl-gpu-service"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up CloudWatch Alarms for GPU Service..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Set region
$env:AWS_DEFAULT_REGION = $Region

Write-Host "Creating CPU utilization alarm..." -ForegroundColor Cyan
try {
    aws cloudwatch put-metric-alarm `
        --alarm-name "GameForge-GPU-HighCPU" `
        --alarm-description "High CPU utilization on GPU service" `
        --metric-name CPUUtilization `
        --namespace AWS/ECS `
        --statistic Average `
        --period 300 `
        --threshold 80 `
        --comparison-operator GreaterThanThreshold `
        --dimensions Name=ServiceName,Value=$ServiceName Name=ClusterName,Value=$ClusterName `
        --evaluation-periods 2 `
        --alarm-actions "arn:aws:sns:$Region:927588814706:gameforge-alerts" `
        --region $Region 2>$null
    
    Write-Host "CPU alarm created successfully" -ForegroundColor Green
} catch {
    Write-Host "CPU alarm creation failed (may need SNS topic)" -ForegroundColor Yellow
}

Write-Host "Creating Memory utilization alarm..." -ForegroundColor Cyan
try {
    aws cloudwatch put-metric-alarm `
        --alarm-name "GameForge-GPU-HighMemory" `
        --alarm-description "High memory utilization on GPU service" `
        --metric-name MemoryUtilization `
        --namespace AWS/ECS `
        --statistic Average `
        --period 300 `
        --threshold 90 `
        --comparison-operator GreaterThanThreshold `
        --dimensions Name=ServiceName,Value=$ServiceName Name=ClusterName,Value=$ClusterName `
        --evaluation-periods 2 `
        --region $Region 2>$null
    
    Write-Host "Memory alarm created successfully" -ForegroundColor Green
} catch {
    Write-Host "Memory alarm creation failed" -ForegroundColor Yellow
}

Write-Host "Creating Service running tasks alarm..." -ForegroundColor Cyan
try {
    aws cloudwatch put-metric-alarm `
        --alarm-name "GameForge-GPU-NoRunningTasks" `
        --alarm-description "No running tasks in GPU service" `
        --metric-name RunningTaskCount `
        --namespace AWS/ECS `
        --statistic Average `
        --period 60 `
        --threshold 1 `
        --comparison-operator LessThanThreshold `
        --dimensions Name=ServiceName,Value=$ServiceName Name=ClusterName,Value=$ClusterName `
        --evaluation-periods 3 `
        --region $Region 2>$null
    
    Write-Host "Running tasks alarm created successfully" -ForegroundColor Green
} catch {
    Write-Host "Running tasks alarm creation failed" -ForegroundColor Yellow
}

Write-Host "`nCloudWatch Alarms Setup Summary:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Service: $ServiceName" -ForegroundColor White
Write-Host "Cluster: $ClusterName" -ForegroundColor White

Write-Host "`nMonitoring Features:" -ForegroundColor Cyan
Write-Host "- High CPU utilization (>80%)" -ForegroundColor White
Write-Host "- High memory utilization (>90%)" -ForegroundColor White  
Write-Host "- Service availability monitoring" -ForegroundColor White

Write-Host "`nCloudWatch Setup Complete!" -ForegroundColor Green
