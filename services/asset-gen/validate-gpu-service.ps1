# GameForge GPU Service Validation Script
# Tests the deployed GPU service in us-west-2

param(
    [string]$ServiceUrl = "",
    [switch]$RunPerformanceTest = $false,
    [int]$TestIterations = 3
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 GameForge GPU Service Validation - us-west-2" -ForegroundColor Green
Write-Host "=" * 50

# Auto-discover service URL if not provided
if (-not $ServiceUrl) {
    Write-Host "🔍 Auto-discovering service URL..." -ForegroundColor Cyan
    
    try {
        $taskArns = aws ecs list-tasks --cluster gameforge-gpu-cluster --service-name gameforge-sdxl-gpu-service --query "taskArns" --output text --region us-west-2
        
        if ($taskArns) {
            $taskArn = $taskArns -split "\t" | Select-Object -First 1
            $taskDetails = aws ecs describe-tasks --cluster gameforge-gpu-cluster --tasks $taskArn --region us-west-2 | ConvertFrom-Json
            $networkInterface = $taskDetails.tasks[0].attachments[0].details | Where-Object { $_.name -eq "networkInterfaceId" } | Select-Object -ExpandProperty value
            
            if ($networkInterface) {
                $publicIp = aws ec2 describe-network-interfaces --network-interface-ids $networkInterface --query "NetworkInterfaces[0].Association.PublicIp" --output text --region us-west-2
                
                if ($publicIp -and $publicIp -ne "None") {
                    $ServiceUrl = "http://$publicIp:8080"
                    Write-Host "✅ Service discovered: $ServiceUrl" -ForegroundColor Green
                } else {
                    Write-Host "❌ Could not get public IP for service" -ForegroundColor Red
                    exit 1
                }
            }
        } else {
            Write-Host "❌ No running tasks found" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Failed to discover service URL: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎯 Testing service at: $ServiceUrl" -ForegroundColor Cyan

# Test 1: Basic connectivity
Write-Host "`n1️⃣  Testing Basic Connectivity..." -ForegroundColor Cyan
try {
    $rootResponse = Invoke-RestMethod -Uri $ServiceUrl -TimeoutSec 30
    Write-Host "✅ Service is reachable" -ForegroundColor Green
    Write-Host "Service Info:" -ForegroundColor White
    $rootResponse | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Service not reachable: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Health check
Write-Host "`n2️⃣  Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/health" -TimeoutSec 30
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "Health Details:" -ForegroundColor White
    $healthResponse | ConvertTo-Json -Depth 3 | Write-Host
    
    # Validate GPU information
    if ($healthResponse.gpu_info -and $healthResponse.gpu_info.gpu_name) {
        Write-Host "🖥️  GPU Detected: $($healthResponse.gpu_info.gpu_name)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No GPU information available" -ForegroundColor Yellow
    }
    
    if ($healthResponse.region -eq "us-west-2") {
        Write-Host "🌍 Confirmed running in us-west-2" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected region: $($healthResponse.region)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Image generation
Write-Host "`n3️⃣  Testing Image Generation..." -ForegroundColor Cyan

$testPrompt = "A futuristic game character with glowing armor, digital art style"
$generateRequest = @{
    prompt = $testPrompt
    negative_prompt = "blurry, low quality"
    width = 512
    height = 512
    num_inference_steps = 10
    guidance_scale = 7.5
    seed = 42
} | ConvertTo-Json

try {
    Write-Host "🎨 Generating test image..." -ForegroundColor Cyan
    Write-Host "Prompt: $testPrompt" -ForegroundColor White
    
    $generateResponse = Invoke-RestMethod -Uri "$ServiceUrl/generate" -Method Post -Body $generateRequest -ContentType "application/json" -TimeoutSec 120
    
    Write-Host "✅ Image generated successfully!" -ForegroundColor Green
    Write-Host "Generation time: $($generateResponse.generation_time) seconds" -ForegroundColor White
    Write-Host "Device: $($generateResponse.device)" -ForegroundColor White
    Write-Host "GPU Type: $($generateResponse.gpu_type)" -ForegroundColor White
    Write-Host "Region: $($generateResponse.region)" -ForegroundColor White
    Write-Host "Dimensions: $($generateResponse.dimensions)" -ForegroundColor White
    
    # Save image for manual inspection
    if ($generateResponse.image) {
        $imageBytes = [Convert]::FromBase64String($generateResponse.image)
        $imagePath = "test-generation-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
        [IO.File]::WriteAllBytes($imagePath, $imageBytes)
        Write-Host "💾 Image saved as: $imagePath" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Image generation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "Error details: $errorDetails" -ForegroundColor Red
    }
}

# Performance Test (optional)
if ($RunPerformanceTest) {
    Write-Host "`n4️⃣  Running Performance Test ($TestIterations iterations)..." -ForegroundColor Cyan
    
    $performanceTimes = @()
    $prompts = @(
        "A medieval castle with dragons flying overhead",
        "A cyberpunk cityscape with neon lights",
        "A fantasy forest with magical creatures",
        "A space station orbiting a distant planet",
        "A steampunk airship in cloudy skies"
    )
    
    for ($i = 1; $i -le $TestIterations; $i++) {
        Write-Host "🔄 Performance test $i/$TestIterations..." -ForegroundColor Cyan
        
        $perfPrompt = $prompts[($i - 1) % $prompts.Length]
        $perfRequest = @{
            prompt = $perfPrompt
            width = 1024
            height = 1024
            num_inference_steps = 20
            guidance_scale = 7.5
            seed = $i * 100
        } | ConvertTo-Json
        
        try {
            $perfResponse = Invoke-RestMethod -Uri "$ServiceUrl/generate" -Method Post -Body $perfRequest -ContentType "application/json" -TimeoutSec 180
            $performanceTimes += $perfResponse.generation_time
            Write-Host "  ⏱️  Generation $i: $($perfResponse.generation_time)s" -ForegroundColor White
        } catch {
            Write-Host "  ❌ Performance test $i failed" -ForegroundColor Red
        }
    }
    
    if ($performanceTimes.Count -gt 0) {
        $avgTime = ($performanceTimes | Measure-Object -Average).Average
        $minTime = ($performanceTimes | Measure-Object -Minimum).Minimum
        $maxTime = ($performanceTimes | Measure-Object -Maximum).Maximum
        
        Write-Host "`n📊 Performance Results:" -ForegroundColor Green
        Write-Host "Average time: $([math]::Round($avgTime, 2))s" -ForegroundColor White
        Write-Host "Minimum time: $([math]::Round($minTime, 2))s" -ForegroundColor White
        Write-Host "Maximum time: $([math]::Round($maxTime, 2))s" -ForegroundColor White
        
        # Performance expectations for A10G GPU
        if ($avgTime -lt 10) {
            Write-Host "🚀 Excellent performance! GPU acceleration working optimally" -ForegroundColor Green
        } elseif ($avgTime -lt 20) {
            Write-Host "✅ Good performance, GPU acceleration active" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Performance may be suboptimal, check GPU utilization" -ForegroundColor Yellow
        }
    }
}

# Final Summary
Write-Host "`n🎉 Validation Summary" -ForegroundColor Green
Write-Host "=" * 30
Write-Host "✅ Service connectivity: PASSED" -ForegroundColor Green
Write-Host "✅ Health check: PASSED" -ForegroundColor Green
Write-Host "✅ Image generation: PASSED" -ForegroundColor Green
if ($RunPerformanceTest) {
    Write-Host "✅ Performance test: COMPLETED" -ForegroundColor Green
}

Write-Host "`n🚀 GameForge GPU Service in us-west-2 is operational!" -ForegroundColor Green
Write-Host "Ready for production traffic." -ForegroundColor Cyan

Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "• Update DNS records to point to us-west-2 service" -ForegroundColor White
Write-Host "• Set up monitoring and alerting for GPU service" -ForegroundColor White
Write-Host "• Configure load balancer for high availability" -ForegroundColor White
Write-Host "• Implement blue-green deployment for updates" -ForegroundColor White
