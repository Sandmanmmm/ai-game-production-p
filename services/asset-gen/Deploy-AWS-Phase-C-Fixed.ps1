# GameForge SDXL Service AWS Deployment Script - Phase C: Container Build & ECS Deployment
# Production-ready script for GPU-enabled Docker container deployment to AWS ECS
# Version: 1.0
# Date: 2025-09-02

param(
    [string]$Region = "us-east-1",
    [string]$ClusterName = "gameforge-sdxl-cluster",
    [string]$ServiceName = "gameforge-sdxl-service",
    [string]$TaskFamily = "gameforge-sdxl-task"
)

# Set strict mode for production
Set-StrictMode -Version Latest

# Production logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

# Test prerequisites
function Test-Prerequisites {
    Write-Log "Testing deployment prerequisites"
    
    # Test AWS CLI
    try {
        & aws --version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "AWS CLI not available"
        }
        Write-Log "AWS CLI available"
    }
    catch {
        throw "AWS CLI is required but not installed or not in PATH"
    }
    
    # Test Docker
    try {
        & docker --version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not available"
        }
        Write-Log "Docker available"
    }
    catch {
        throw "Docker is required but not installed or not in PATH"
    }
    
    # Test configuration file
    if (-not (Test-Path "aws-config.json")) {
        throw "aws-config.json not found. Please run Phase A deployment first."
    }
    
    Write-Log "All prerequisites satisfied"
}

# Load AWS configuration
function Get-AWSConfiguration {
    Write-Log "Loading AWS configuration"
    
    try {
        $config = Get-Content "aws-config.json" | ConvertFrom-Json
        
        $awsConfig = @{
            Region = $config.region
            BucketName = $config.s3_bucket.Replace("s3://", "")
            ECRRepo = $config.ecr_repository
            AccountId = $config.AWS_ACCOUNT_ID
        }
        
        Write-Log "Configuration loaded successfully"
        return $awsConfig
    }
    catch {
        throw "Failed to load AWS configuration: $($_.Exception.Message)"
    }
}

# Build Docker image
function Invoke-DockerImageBuild {
    param([hashtable]$Config)
    
    Write-Log "Building Docker image for SDXL service"
    
    try {
        $dockerArgs = @(
            "build",
            "-t", "gameforge-sdxl:latest",
            "-f", "Dockerfile.minimal",
            "."
        )
        
        & docker @dockerArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        Write-Log "Docker image built successfully"
    }
    catch {
        throw "Failed to build Docker image: $($_.Exception.Message)"
    }
}

# Push image to ECR
function Push-ToECR {
    param([hashtable]$Config)
    
    Write-Log "Authenticating with ECR and pushing image"
    
    try {
        # Login to ECR
        $loginCmd = "aws ecr get-login-password --region $($Config.Region)"
        $loginPassword = Invoke-Expression $loginCmd
        
        if ([string]::IsNullOrEmpty($loginPassword)) {
            throw "Failed to get ECR login password"
        }
        
        $loginArgs = @(
            "login",
            "--username", "AWS",
            "--password-stdin",
            "$($Config.AccountId).dkr.ecr.$($Config.Region).amazonaws.com"
        )
        
        $loginPassword | & docker @loginArgs
        if ($LASTEXITCODE -ne 0) {
            throw "ECR login failed"
        }
        
        # Tag image
        $tagArgs = @(
            "tag",
            "gameforge-sdxl:latest",
            "$($Config.ECRRepo):latest"
        )
        
        & docker @tagArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Docker tag failed"
        }
        
        # Push image
        $pushArgs = @(
            "push",
            "$($Config.ECRRepo):latest"
        )
        
        & docker @pushArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Docker push failed"
        }
        
        Write-Log "Image pushed to ECR successfully"
    }
    catch {
        throw "Failed to push to ECR: $($_.Exception.Message)"
    }
}

# Create ECS cluster
function New-ECSCluster {
    param([hashtable]$Config)
    
    Write-Log "Creating ECS cluster: $ClusterName"
    
    try {
        # Check if cluster already exists
        $clusterData = & aws ecs describe-clusters --clusters $ClusterName --region $($Config.Region) | ConvertFrom-Json
        
        if ($clusterData.clusters -and $clusterData.clusters.Count -gt 0) {
            if ($clusterData.clusters[0].status -eq "ACTIVE") {
                Write-Log "Cluster $ClusterName already exists and is active"
                return
            }
        }
        
        # Create cluster
        $createClusterArgs = @(
            "ecs", "create-cluster",
            "--cluster-name", $ClusterName,
            "--capacity-providers", "EC2",
            "--region", $($Config.Region)
        )
        
        & aws @createClusterArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create ECS cluster"
        }
        
        Write-Log "ECS cluster created successfully"
    }
    catch {
        throw "Failed to create ECS cluster: $($_.Exception.Message)"
    }
}

# Register task definition
function Register-TaskDefinition {
    param([hashtable]$Config)
    
    Write-Log "Registering ECS task definition"
    
    try {
        $taskDefinition = @{
            family = $TaskFamily
            networkMode = "awsvpc"
            requiresCompatibilities = @("EC2")
            cpu = "2048"
            memory = "8192"
            executionRoleArn = "arn:aws:iam::$($Config.AccountId):role/ecsTaskExecutionRole"
            taskRoleArn = "arn:aws:iam::$($Config.AccountId):role/ecsTaskRole"
            containerDefinitions = @(
                @{
                    name = "gameforge-sdxl"
                    image = "$($Config.ECRRepo):latest"
                    essential = $true
                    memory = 8192
                    cpu = 2048
                    portMappings = @(
                        @{
                            containerPort = 8000
                            hostPort = 0
                            protocol = "tcp"
                        }
                    )
                    resourceRequirements = @(
                        @{
                            type = "GPU"
                            value = "1"
                        }
                    )
                    logConfiguration = @{
                        logDriver = "awslogs"
                        options = @{
                            "awslogs-group" = "/aws/ecs/gameforge-sdxl"
                            "awslogs-region" = $($Config.Region)
                            "awslogs-stream-prefix" = "ecs"
                        }
                    }
                    environment = @(
                        @{
                            name = "CUDA_VISIBLE_DEVICES"
                            value = "0"
                        }
                        @{
                            name = "MODEL_PATH"
                            value = "/app/models"
                        }
                    )
                }
            )
        }
        
        $taskDefJson = $taskDefinition | ConvertTo-Json -Depth 10
        $tempFile = [System.IO.Path]::GetTempFileName()
        $taskDefJson | Out-File -FilePath $tempFile -Encoding UTF8
        
        $registerArgs = @(
            "ecs", "register-task-definition",
            "--cli-input-json", "file://$tempFile",
            "--region", $($Config.Region)
        )
        
        & aws @registerArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to register task definition"
        }
        
        Remove-Item $tempFile -Force
        Write-Log "Task definition registered successfully"
    }
    catch {
        throw "Failed to register task definition: $($_.Exception.Message)"
    }
}

# Create security group
function New-SecurityGroup {
    param([hashtable]$Config)
    
    Write-Log "Creating security group for ECS service"
    
    try {
        # Get VPC ID
        $vpcData = & aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $($Config.Region) | ConvertFrom-Json
        if (-not $vpcData.Vpcs -or $vpcData.Vpcs.Count -eq 0) {
            throw "No default VPC found"
        }
        
        $VpcId = $vpcData.Vpcs[0].VpcId
        Write-Log "Using VPC: $VpcId"
        
        # Check if security group already exists
        $sgData = & aws ec2 describe-security-groups --filters "Name=group-name,Values=gameforge-sdxl-sg" --region $($Config.Region) | ConvertFrom-Json
        
        if ($sgData.SecurityGroups -and $sgData.SecurityGroups.Count -gt 0) {
            $SecurityGroupId = $sgData.SecurityGroups[0].GroupId
            Write-Log "Security group already exists: $SecurityGroupId"
            return $SecurityGroupId
        }
        
        # Create security group
        $createSgArgs = @(
            "ec2", "create-security-group",
            "--group-name", "gameforge-sdxl-sg",
            "--description", "Security group for GameForge SDXL service",
            "--vpc-id", $VpcId,
            "--region", $($Config.Region)
        )
        
        $sgResult = & aws @createSgArgs | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create security group"
        }
        
        $SecurityGroupId = $sgResult.GroupId
        
        # Add inbound rules
        $inboundArgs = @(
            "ec2", "authorize-security-group-ingress",
            "--group-id", $SecurityGroupId,
            "--protocol", "tcp",
            "--port", "8000",
            "--cidr", "0.0.0.0/0",
            "--region", $($Config.Region)
        )
        
        & aws @inboundArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to add inbound rule"
        }
        
        Write-Log "Security group created: $SecurityGroupId"
        return $SecurityGroupId
    }
    catch {
        throw "Failed to create security group: $($_.Exception.Message)"
    }
}

# Get subnet IDs
function Get-SubnetIds {
    param([hashtable]$Config)
    
    Write-Log "Getting subnet IDs for service deployment"
    
    try {
        $subnetData = & aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --region $($Config.Region) | ConvertFrom-Json
        
        if (-not $subnetData.Subnets -or $subnetData.Subnets.Count -eq 0) {
            throw "No default subnets found"
        }
        
        $subnetIds = $subnetData.Subnets | ForEach-Object { $_.SubnetId }
        $subnetString = $subnetIds -join ","
        
        Write-Log "Found subnets: $subnetString"
        return $subnetString
    }
    catch {
        throw "Failed to get subnet IDs: $($_.Exception.Message)"
    }
}

# Deploy ECS service
function Invoke-ECSServiceDeployment {
    param([hashtable]$Config, [string]$SecurityGroupId, [string]$SubnetString)
    
    Write-Log "Deploying ECS service: $ServiceName"
    
    try {
        # Check if service already exists
        $serviceData = & aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $($Config.Region) | ConvertFrom-Json
        
        if ($serviceData.services -and $serviceData.services.Count -gt 0 -and $serviceData.services[0].status -eq "ACTIVE") {
            Write-Log "Service $ServiceName already exists and is active"
            
            # Update service with new task definition
            $updateArgs = @(
                "ecs", "update-service",
                "--cluster", $ClusterName,
                "--service", $ServiceName,
                "--task-definition", $TaskFamily,
                "--region", $($Config.Region)
            )
            
            & aws @updateArgs
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to update ECS service"
            }
            
            Write-Log "Service updated successfully"
            return
        }
        
        # Create new service
        $networkConfig = "awsvpcConfiguration={subnets=$SubnetString,securityGroups=$SecurityGroupId,assignPublicIp=ENABLED}"
        $createServiceArgs = @(
            "ecs", "create-service",
            "--cluster", $ClusterName,
            "--service-name", $ServiceName,
            "--task-definition", $TaskFamily,
            "--desired-count", "1",
            "--launch-type", "EC2",
            "--network-configuration", $networkConfig,
            "--region", $($Config.Region)
        )
        
        & aws @createServiceArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create ECS service"
        }
        
        Write-Log "ECS service created successfully"
    }
    catch {
        throw "Failed to deploy ECS service: $($_.Exception.Message)"
    }
}

# Main deployment function
function Invoke-PhaseC {
    Write-Log "Starting GameForge SDXL AWS Deployment - Phase C"
    Write-Log "Region: $Region"
    Write-Log "Cluster: $ClusterName"
    Write-Log "Service: $ServiceName"
    Write-Log "Task Family: $TaskFamily"
    Write-Log ("=" * 60)
    
    try {
        # Step 1: Test prerequisites
        Test-Prerequisites
        
        # Step 2: Load configuration
        $config = Get-AWSConfiguration
        
        # Step 3: Build Docker image
        Invoke-DockerImageBuild -Config $config
        
        # Step 4: Push to ECR
        Push-ToECR -Config $config
        
        # Step 5: Create ECS cluster
        New-ECSCluster -Config $config
        
        # Step 6: Register task definition
        Register-TaskDefinition -Config $config
        
        # Step 7: Create security group
        $securityGroupId = New-SecurityGroup -Config $config
        
        # Step 8: Get subnet IDs
        $subnetString = Get-SubnetIds -Config $config
        
        # Step 9: Deploy ECS service
        Invoke-ECSServiceDeployment -Config $config -SecurityGroupId $securityGroupId -SubnetString $subnetString
        
        Write-Log ("=" * 60)
        Write-Log "DEPLOYMENT COMPLETED SUCCESSFULLY" -Level "SUCCESS"
        Write-Log "ECS Cluster: $ClusterName"
        Write-Log "ECS Service: $ServiceName"
        Write-Log "Task Definition: $TaskFamily"
        Write-Log ("=" * 60)
        Write-Log "Next steps:"
        Write-Log "1. Monitor service: aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $Region"
        Write-Log "2. Check logs: aws logs describe-log-streams --log-group-name /aws/ecs/gameforge-sdxl --region $Region"
        Write-Log "3. Scale service: aws ecs update-service --cluster $ClusterName --service $ServiceName --desired-count 2 --region $Region"
    }
    catch {
        Write-Log "DEPLOYMENT FAILED: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

# Execute main deployment
if ($MyInvocation.InvocationName -ne '.') {
    Invoke-PhaseC
}
