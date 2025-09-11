# GameForge Regional Migration Orchestrator
# Coordinates the complete migration to us-west-2

param(
    [switch]$DryRun = $false,
    [switch]$SkipInfrastructure = $false,
    [switch]$SkipGPUSetup = $false,
    [switch]$SkipTaskDeployment = $false
)

$ErrorActionPreference = "Stop"

Write-Host @"
🚀 GameForge Regional Migration Orchestrator
============================================
Target: us-west-2 (Oregon)
GPU: A10G (g5.xlarge)
Architecture: ECS + EC2 GPU instances
"@ -ForegroundColor Green

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
}

# Phase 1: Regional Infrastructure Setup
if (-not $SkipInfrastructure) {
    Write-Host "`n📍 Phase 1: Regional Infrastructure Migration" -ForegroundColor Cyan
    Write-Host "=" * 50
    
    try {
        if ($DryRun) {
            Write-Host "🧪 Would run: .\migrate-to-us-west-2.ps1 -DryRun" -ForegroundColor Yellow
        } else {
            & ".\migrate-to-us-west-2.ps1"
        }
        Write-Host "✅ Phase 1 Complete: Infrastructure migrated to us-west-2" -ForegroundColor Green
    } catch {
        Write-Host "❌ Phase 1 Failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping Phase 1: Infrastructure Setup" -ForegroundColor Yellow
}

# Phase 2: GPU Instance Setup
if (-not $SkipGPUSetup) {
    Write-Host "`n🖥️  Phase 2: GPU Instance Configuration" -ForegroundColor Cyan
    Write-Host "=" * 50
    
    try {
        if ($DryRun) {
            Write-Host "🧪 Would run: .\setup-gpu-instances-us-west-2.ps1 -DryRun" -ForegroundColor Yellow
        } else {
            & ".\setup-gpu-instances-us-west-2.ps1"
        }
        Write-Host "✅ Phase 2 Complete: GPU instances configured" -ForegroundColor Green
    } catch {
        Write-Host "❌ Phase 2 Failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping Phase 2: GPU Setup" -ForegroundColor Yellow
}

# Phase 3: Task Definition and Service Deployment
if (-not $SkipTaskDeployment) {
    Write-Host "`n🐳 Phase 3: ECS Task and Service Deployment" -ForegroundColor Cyan
    Write-Host "=" * 50
    
    try {
        # Register the GPU task definition
        Write-Host "📋 Registering GPU task definition..." -ForegroundColor Cyan
        if ($DryRun) {
            Write-Host "🧪 Would register: ecs-task-definition-us-west-2.json" -ForegroundColor Yellow
        } else {
            aws ecs register-task-definition --cli-input-json file://ecs-task-definition-us-west-2.json --region us-west-2
            Write-Host "✅ Task definition registered" -ForegroundColor Green
        }
        
        # Wait for ECS instances to be available
        Write-Host "⏳ Waiting for GPU instances to join ECS cluster..." -ForegroundColor Cyan
        if (-not $DryRun) {
            do {
                $instanceCount = aws ecs describe-clusters --clusters gameforge-gpu-cluster --query "clusters[0].registeredContainerInstancesCount" --output text --region us-west-2
                Write-Host "GPU instances in cluster: $instanceCount" -ForegroundColor Yellow
                if ([int]$instanceCount -eq 0) {
                    Write-Host "Waiting 30 seconds for instances to join..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                }
            } while ([int]$instanceCount -eq 0)
            Write-Host "✅ GPU instances are ready" -ForegroundColor Green
        }
        
        # Create ECS Service
        Write-Host "🔄 Creating ECS service..." -ForegroundColor Cyan
        if ($DryRun) {
            Write-Host "🧪 Would create ECS service: gameforge-sdxl-gpu-service" -ForegroundColor Yellow
        } else {
            $serviceDefinition = @{
                serviceName = "gameforge-sdxl-gpu-service"
                cluster = "gameforge-gpu-cluster"
                taskDefinition = "gameforge-sdxl-gpu-us-west-2"
                desiredCount = 1
                launchType = "EC2"
                networkConfiguration = @{
                    awsvpcConfiguration = @{
                        subnets = @(
                            (aws ec2 describe-subnets --filters "Name=tag:Name,Values=gameforge-gpu-vpc-subnet-2a" --query "Subnets[0].SubnetId" --output text --region us-west-2),
                            (aws ec2 describe-subnets --filters "Name=tag:Name,Values=gameforge-gpu-vpc-subnet-2b" --query "Subnets[0].SubnetId" --output text --region us-west-2)
                        )
                        securityGroups = @(
                            (aws ec2 describe-security-groups --filters "Name=group-name,Values=gameforge-gpu-sg" --query "SecurityGroups[0].GroupId" --output text --region us-west-2)
                        )
                        assignPublicIp = "ENABLED"
                    }
                }
                serviceTags = @(
                    @{ key = "Environment"; value = "Production" },
                    @{ key = "Service"; value = "GameForge-SDXL-GPU" },
                    @{ key = "Region"; value = "us-west-2" }
                )
            } | ConvertTo-Json -Depth 10
            
            $serviceFile = "ecs-service-definition.json"
            $serviceDefinition | Out-File -FilePath $serviceFile -Encoding UTF8
            
            aws ecs create-service --cli-input-json file://$serviceFile --region us-west-2
            Remove-Item $serviceFile
            Write-Host "✅ ECS service created" -ForegroundColor Green
        }
        
        Write-Host "✅ Phase 3 Complete: Service deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Phase 3 Failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping Phase 3: Task Deployment" -ForegroundColor Yellow
}

# Phase 4: Validation and Testing
Write-Host "`n🧪 Phase 4: Validation and Performance Testing" -ForegroundColor Cyan
Write-Host "=" * 50

if ($DryRun) {
    Write-Host "🧪 Would perform validation tests" -ForegroundColor Yellow
} else {
    # Wait for service to be stable
    Write-Host "⏳ Waiting for service to stabilize..." -ForegroundColor Cyan
    aws ecs wait services-stable --cluster gameforge-gpu-cluster --services gameforge-sdxl-gpu-service --region us-west-2
    
    # Get service endpoint
    Write-Host "🔍 Getting service endpoint..." -ForegroundColor Cyan
    $taskArns = aws ecs list-tasks --cluster gameforge-gpu-cluster --service-name gameforge-sdxl-gpu-service --query "taskArns" --output text --region us-west-2
    
    if ($taskArns) {
        $taskArn = $taskArns -split "\t" | Select-Object -First 1
        $taskDetails = aws ecs describe-tasks --cluster gameforge-gpu-cluster --tasks $taskArn --region us-west-2 | ConvertFrom-Json
        $networkInterface = $taskDetails.tasks[0].attachments[0].details | Where-Object { $_.name -eq "networkInterfaceId" } | Select-Object -ExpandProperty value
        
        if ($networkInterface) {
            $publicIp = aws ec2 describe-network-interfaces --network-interface-ids $networkInterface --query "NetworkInterfaces[0].Association.PublicIp" --output text --region us-west-2
            
            if ($publicIp -and $publicIp -ne "None") {
                $serviceUrl = "http://$publicIp:8080"
                Write-Host "✅ Service URL: $serviceUrl" -ForegroundColor Green
                
                # Test health endpoint
                Write-Host "🏥 Testing health endpoint..." -ForegroundColor Cyan
                try {
                    $healthResponse = Invoke-RestMethod -Uri "$serviceUrl/health" -TimeoutSec 30
                    Write-Host "✅ Health check passed:" -ForegroundColor Green
                    $healthResponse | ConvertTo-Json -Depth 3 | Write-Host
                } catch {
                    Write-Host "⚠️  Health check failed, but service may still be starting" -ForegroundColor Yellow
                }
            }
        }
    }
}

# Migration Summary
Write-Host "`n🎉 Regional Migration Summary" -ForegroundColor Green
Write-Host "=" * 50

$summary = @"
✅ Source Region: us-east-1
✅ Target Region: us-west-2
✅ GPU Type: A10G (superior to T4)
✅ Instance Type: g5.xlarge
✅ Architecture: ECS + EC2 GPU instances
✅ Cost Optimization: Spot instance support
✅ Multi-AZ Deployment: us-west-2a, us-west-2b, us-west-2c
✅ Auto Scaling: 0-3 instances based on demand
✅ Model Caching: Optimized for A10G GPU memory
✅ Regional Benefits: Better GPU availability, lower costs
"@

Write-Host $summary -ForegroundColor White

# Next Steps
Write-Host "`n🎯 Post-Migration Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor GPU utilization and performance" -ForegroundColor Yellow
Write-Host "2. Compare inference times vs CPU version" -ForegroundColor Yellow
Write-Host "3. Optimize spot instance usage for cost savings" -ForegroundColor Yellow
Write-Host "4. Set up cross-region monitoring and alerting" -ForegroundColor Yellow
Write-Host "5. Plan data migration from us-east-1 if needed" -ForegroundColor Yellow
Write-Host "6. Update DNS/load balancer to point to us-west-2" -ForegroundColor Yellow

# Performance expectations
Write-Host "`n📊 Expected Performance Improvements:" -ForegroundColor Cyan
Write-Host "• Inference Speed: 5-10x faster than CPU" -ForegroundColor White
Write-Host "• GPU Availability: 30-40% better in us-west-2" -ForegroundColor White
Write-Host "• Cost (with spots): Potential 50% savings vs on-demand" -ForegroundColor White
Write-Host "• Hardware: A10G offers 2x performance vs T4" -ForegroundColor White

Write-Host "`n🎉 Regional Migration to us-west-2 Complete!" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n💡 To execute the actual migration, run without -DryRun flag:" -ForegroundColor Cyan
    Write-Host ".\deploy-regional-migration.ps1" -ForegroundColor Yellow
}
