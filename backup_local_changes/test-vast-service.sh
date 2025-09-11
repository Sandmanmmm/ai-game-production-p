#!/bin/bash
# Quick test script for GameForge SDXL service on Vast.ai

echo "🧪 GameForge SDXL Service - Quick Test"
echo "====================================="

# Check if service is running
echo "1️⃣ Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Service is healthy"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo "❌ Service health check failed"
    exit 1
fi

echo ""
echo "2️⃣ Testing image generation..."

# Submit generation job
RESPONSE=$(curl -s -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fantasy knight character, pixel art style",
    "asset_type": "character_design", 
    "style": "pixel_art",
    "width": 512,
    "height": 512,
    "steps": 20,
    "guidance_scale": 7.5
  }')

echo "Generation Response:"
echo $RESPONSE | python3 -m json.tool

# Extract job ID
JOB_ID=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])" 2>/dev/null || echo "")

if [ -n "$JOB_ID" ]; then
    echo ""
    echo "3️⃣ Monitoring job progress..."
    echo "Job ID: $JOB_ID"
    
    # Monitor job for up to 2 minutes
    for i in {1..24}; do
        echo -n "⏳ Checking job status (${i}/24)... "
        
        JOB_STATUS=$(curl -s "http://localhost:8000/job/$JOB_ID" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
        echo "Status: $JOB_STATUS"
        
        if [ "$JOB_STATUS" = "completed" ]; then
            echo "✅ Job completed successfully!"
            curl -s "http://localhost:8000/job/$JOB_ID" | python3 -m json.tool
            break
        elif [ "$JOB_STATUS" = "failed" ]; then
            echo "❌ Job failed!"
            curl -s "http://localhost:8000/job/$JOB_ID" | python3 -m json.tool
            break
        fi
        
        sleep 5
    done
else
    echo "❌ Could not extract job ID from response"
fi

echo ""
echo "4️⃣ Checking generated assets..."
if [ -d "outputs/assets" ]; then
    ASSET_COUNT=$(ls outputs/assets/*.png 2>/dev/null | wc -l)
    echo "📁 Found $ASSET_COUNT generated assets in outputs/assets/"
    if [ $ASSET_COUNT -gt 0 ]; then
        echo "Latest assets:"
        ls -lt outputs/assets/*.png | head -3
    fi
else
    echo "📁 No assets directory found"
fi

echo ""
echo "5️⃣ GPU Usage:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits

echo ""
echo "🎯 Test completed! Your GameForge SDXL service on RTX 4090 is ready for development."
