# GameForge SDXL GPU Production Deployment
# Deploy optimized SDXL with model caching, fp16, and xFormers to GPU instances

param(
    [string]$Region = "us-east-1",
    [string]$ClusterName = "gameforge-sdxl-gpu-cluster", 
    [string]$ServiceName = "gameforge-sdxl-gpu-service",
    [string]$TaskFamily = "gameforge-sdxl-production-task",
    [switch]$CreateCluster = $false,
    [switch]$UpdateService = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "INFO" { "Cyan" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-Prerequisites {
    Write-Log "INFO" "Checking prerequisites..."
    
    # Check AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        throw "AWS CLI not found. Please install AWS CLI."
    }
    
    # Check AWS credentials
    try {
        $null = aws sts get-caller-identity
        Write-Log "INFO" "AWS credentials verified"
    }
    catch {
        throw "AWS credentials not configured. Run 'aws configure' first."
    }
    
    Write-Log "SUCCESS" "Prerequisites satisfied"
}

function New-ECSGPUCluster {
    param([string]$ClusterName)
    
    Write-Log "INFO" "Creating GPU-enabled ECS cluster: $ClusterName"
    
    # Create cluster
    $cluster = aws ecs create-cluster --cluster-name $ClusterName --region $Region | ConvertFrom-Json
    Write-Log "INFO" "Cluster created: $($cluster.cluster.clusterArn)"
    
    # Create launch template for GPU instances
    $launchTemplateData = @{
        ImageId = "ami-0c02fb55956c7d316"  # ECS-optimized AMI with GPU support
        InstanceType = "g4dn.xlarge"
        IamInstanceProfile = @{
            Name = "ecsInstanceRole"
        }
        SecurityGroupIds = @("sg-0b7e1f61bac368fbc")
        UserData = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(@"
#!/bin/bash
echo ECS_CLUSTER=$ClusterName >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
yum update -y
yum install -y nvidia-docker2
systemctl restart docker
systemctl restart ecs
"@))
    } | ConvertTo-Json -Depth 10
    
    # Create launch template
    Write-Log "INFO" "Creating launch template for GPU instances..."
    $launchTemplate = aws ec2 create-launch-template `
        --launch-template-name "gameforge-sdxl-gpu-template" `
        --launch-template-data $launchTemplateData `
        --region $Region | ConvertFrom-Json
        
    Write-Log "INFO" "Launch template created: $($launchTemplate.LaunchTemplate.LaunchTemplateId)"
    
    # Create Auto Scaling Group
    Write-Log "INFO" "Creating Auto Scaling Group..."
    $asgConfig = @{
        AutoScalingGroupName = "gameforge-sdxl-asg"
        LaunchTemplate = @{
            LaunchTemplateId = $launchTemplate.LaunchTemplate.LaunchTemplateId
            Version = '$Latest'
        }
        MinSize = 1
        MaxSize = 3
        DesiredCapacity = 1
        VPCZoneIdentifier = "subnet-03cc0890aa6b1bcfa,subnet-0018c0b26961aa3ba"
        Tags = @(
            @{
                Key = "Project"
                Value = "GameForge"
                PropagateAtLaunch = $true
                ResourceId = "gameforge-sdxl-asg"
                ResourceType = "auto-scaling-group"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $tempAsgFile = [System.IO.Path]::GetTempFileName()
    $asgConfig | Out-File -FilePath $tempAsgFile -Encoding ASCII
    
    try {
        aws autoscaling create-auto-scaling-group --cli-input-json "file://$tempAsgFile" --region $Region
        Write-Log "SUCCESS" "Auto Scaling Group created"
    }
    finally {
        Remove-Item $tempAsgFile -Force -ErrorAction SilentlyContinue
    }
    
    # Create capacity provider
    Write-Log "INFO" "Creating ECS capacity provider..."
    $capacityProvider = @{
        name = "gameforge-gpu-capacity-provider"
        autoScalingGroupProvider = @{
            autoScalingGroupArn = "arn:aws:autoscaling:${Region}:927588814706:autoScalingGroup:*:autoScalingGroupName/gameforge-sdxl-asg"
            managedScaling = @{
                status = "ENABLED"
                targetCapacity = 80
                minimumScalingStepSize = 1
                maximumScalingStepSize = 10
            }
            managedTerminationProtection = "DISABLED"
        }
        tags = @(
            @{
                key = "Project"
                value = "GameForge"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $tempCapacityFile = [System.IO.Path]::GetTempFileName()
    $capacityProvider | Out-File -FilePath $tempCapacityFile -Encoding ASCII
    
    try {
        aws ecs create-capacity-provider --cli-input-json "file://$tempCapacityFile" --region $Region
        Write-Log "SUCCESS" "Capacity provider created"
    }
    finally {
        Remove-Item $tempCapacityFile -Force -ErrorAction SilentlyContinue
    }
    
    # Associate capacity provider with cluster
    aws ecs put-cluster-capacity-providers `
        --cluster $ClusterName `
        --capacity-providers "gameforge-gpu-capacity-provider" `
        --default-capacity-provider-strategy capacityProvider="gameforge-gpu-capacity-provider",weight=1 `
        --region $Region
        
    Write-Log "SUCCESS" "GPU cluster setup complete"
}

function Register-TaskDefinition {
    Write-Log "INFO" "Registering GPU-optimized task definition..."
    
    # Create CloudWatch log group
    try {
        aws logs create-log-group --log-group-name "/ecs/gameforge-sdxl-production" --region $Region
        Write-Log "INFO" "CloudWatch log group created"
    }
    catch {
        Write-Log "WARN" "Log group may already exist"
    }
    
    # Register task definition
    $taskDefPath = "$PSScriptRoot\ecs-task-definition-gpu.json"
    if (-not (Test-Path $taskDefPath)) {
        throw "GPU task definition file not found: $taskDefPath"
    }
    
    $taskDef = aws ecs register-task-definition --cli-input-json "file://$taskDefPath" --region $Region | ConvertFrom-Json
    Write-Log "SUCCESS" "Task definition registered: $($taskDef.taskDefinition.taskDefinitionArn)"
    
    return $taskDef.taskDefinition.revision
}

function Invoke-GPUServiceDeployment {
    param([string]$TaskRevision)
    
    Write-Log "INFO" "Deploying GPU SDXL service..."
    
    # Check if service exists
    try {
        $existingService = aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $Region | ConvertFrom-Json
        if ($existingService.services -and $existingService.services.Count -gt 0) {
            Write-Log "INFO" "Updating existing service..."
            $service = aws ecs update-service `
                --cluster $ClusterName `
                --service $ServiceName `
                --task-definition "${TaskFamily}:${TaskRevision}" `
                --desired-count 1 `
                --region $Region | ConvertFrom-Json
        }
        else {
            throw "Service not found"
        }
    }
    catch {
        Write-Log "INFO" "Creating new service..."
        $service = aws ecs create-service `
            --cluster $ClusterName `
            --service-name $ServiceName `
            --task-definition "${TaskFamily}:${TaskRevision}" `
            --desired-count 1 `
            --capacity-provider-strategy capacityProvider="gameforge-gpu-capacity-provider",weight=1 `
            --region $Region | ConvertFrom-Json
    }
    
    Write-Log "SUCCESS" "Service deployed: $($service.service.serviceArn)"
    return $service.service
}

function Wait-ForService {
    param([string]$ServiceArn)
    
    Write-Log "INFO" "Waiting for service to become stable..."
    
    $maxWaitTime = 600  # 10 minutes
    $waitTime = 0
    $interval = 30
    
    do {
        Start-Sleep $interval
        $waitTime += $interval
        
        $service = aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $Region | ConvertFrom-Json
        $serviceStatus = $service.services[0]
        
        Write-Log "INFO" "Service status: Running=$($serviceStatus.runningCount), Pending=$($serviceStatus.pendingCount), Desired=$($serviceStatus.desiredCount)"
        
        if ($serviceStatus.runningCount -eq $serviceStatus.desiredCount -and $serviceStatus.pendingCount -eq 0) {
            Write-Log "SUCCESS" "Service is stable!"
            return $serviceStatus
        }
        
        if ($waitTime -ge $maxWaitTime) {
            Write-Log "WARN" "Service deployment timed out"
            break
        }
        
    } while ($true)
    
    return $null
}

function Get-ServiceEndpoint {
    param([object]$ServiceStatus)
    
    if (-not $ServiceStatus -or $ServiceStatus.runningCount -eq 0) {
        Write-Log "ERROR" "No running tasks found"
        return $null
    }
    
    # Get running tasks
    $tasks = aws ecs list-tasks --cluster $ClusterName --service-name $ServiceName --desired-status RUNNING --region $Region | ConvertFrom-Json
    
    if ($tasks.taskArns.Count -eq 0) {
        Write-Log "ERROR" "No running tasks found"
        return $null
    }
    
    # Get task details
    $taskDetails = aws ecs describe-tasks --cluster $ClusterName --tasks $tasks.taskArns[0] --region $Region | ConvertFrom-Json
    $task = $taskDetails.tasks[0]
    
    # Get container instance details
    $containerInstance = aws ecs describe-container-instances --cluster $ClusterName --container-instances $task.containerInstanceArn --region $Region | ConvertFrom-Json
    $ec2InstanceId = $containerInstance.containerInstances[0].ec2InstanceId
    
    # Get EC2 instance public IP
    $ec2Details = aws ec2 describe-instances --instance-ids $ec2InstanceId --region $Region | ConvertFrom-Json
    $publicIp = $ec2Details.Reservations[0].Instances[0].PublicIpAddress
    
    if ($publicIp) {
        $endpoint = "http://${publicIp}:8080"
        Write-Log "SUCCESS" "Service endpoint: $endpoint"
        Write-Log "INFO" "Health check: $endpoint/health"
        Write-Log "INFO" "Generate endpoint: $endpoint/generate"
        return $endpoint
    }
    else {
        Write-Log "ERROR" "Could not determine public IP"
        return $null
    }
}

# Main execution
try {
    Write-Log "INFO" "Starting GameForge SDXL GPU Production Deployment"
    Write-Log "INFO" "Region: $Region"
    Write-Log "INFO" "Cluster: $ClusterName"
    Write-Log "INFO" "Service: $ServiceName"
    Write-Log "INFO" "=================================================="
    
    Test-Prerequisites
    
    if ($CreateCluster) {
        New-ECSGPUCluster -ClusterName $ClusterName
    }
    
    $taskRevision = Register-TaskDefinition
    $service = Invoke-GPUServiceDeployment -TaskRevision $taskRevision
    
    Write-Log "INFO" "Waiting for service deployment..."
    $serviceStatus = Wait-ForService -ServiceArn $service.serviceArn
    
    if ($serviceStatus) {
        $endpoint = Get-ServiceEndpoint -ServiceStatus $serviceStatus
        
        if ($endpoint) {
            Write-Log "SUCCESS" "============================================="
            Write-Log "SUCCESS" "GPU SDXL DEPLOYMENT COMPLETED SUCCESSFULLY!"
            Write-Log "SUCCESS" "============================================="
            Write-Log "INFO" "Endpoint: $endpoint"
            Write-Log "INFO" "Instance Type: g4dn.xlarge (GPU-enabled)"
            Write-Log "INFO" "Features: fp16, xFormers, model caching"
            Write-Log "INFO" "============================================="
        }
    }
    
}
catch {
    Write-Log "ERROR" "DEPLOYMENT FAILED: $($_.Exception.Message)"
    throw
}
