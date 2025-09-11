# Quick Deployment Script for Vast.ai Instance 25599851
# This script automates the entire GameForge SDXL setup

#!/bin/bash
set -e

echo "🚀 GameForge SDXL Deployment - Instance 25599851"
echo "RTX 4090 (24GB VRAM) - Optimized Configuration"
echo "=============================================="

# Check if we're root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (you should be root on Vast.ai)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y git curl wget htop nvtop

# Install Docker Compose if needed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verify GPU
echo "🔍 Checking GPU availability..."
nvidia-smi
if [ $? -ne 0 ]; then
    echo "❌ GPU not detected! Check your instance."
    exit 1
fi

# Clone repository
echo "📥 Cloning GameForge repository..."
if [ -d "GameForge" ]; then
    echo "Repository exists, pulling latest..."
    cd GameForge && git pull && cd ..
else
    git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge
fi

cd GameForge/services/asset-gen

# Setup directories
echo "📁 Creating storage directories..."
mkdir -p outputs/{assets,thumbnails,references,temp}
mkdir -p models/{lora,checkpoints}

# Use RTX 4090 optimized config
if [ -f "config-vast.py" ]; then
    echo "⚙️ Applying RTX 4090 optimizations..."
    cp config-vast.py config.py
fi

# Build and start services
echo "🏗️ Building and starting GameForge SDXL service..."
docker-compose -f docker-compose-vast.yml up -d --build

# Monitor startup
echo "⏳ Waiting for service initialization..."
echo "This may take 2-3 minutes for model downloads..."

# Wait and check health
for i in {1..36}; do
    sleep 10
    echo "Checking health attempt $i/36..."
    
    if curl -f http://localhost:8000/health 2>/dev/null; then
        echo "✅ Service is healthy!"
        break
    fi
    
    if [ $i -eq 36 ]; then
        echo "❌ Service failed to start. Checking logs..."
        docker-compose -f docker-compose-vast.yml logs
        exit 1
    fi
done

# Display service info
PUBLIC_IP=$(curl -s ifconfig.me)
echo ""
echo "🎉 GameForge SDXL Service Successfully Deployed!"
echo "============================================="
echo "Instance: 25599851 (RTX 4090)"
echo "Public IP: $PUBLIC_IP"
echo "SSH: ssh -p 3483 root@ssh3.vast.ai"
echo ""
echo "🌐 Service Endpoints:"
echo "Health: http://$PUBLIC_IP:8000/health"
echo "API Docs: http://$PUBLIC_IP:8000/docs" 
echo "Generate: http://$PUBLIC_IP:8000/generate"
echo ""
echo "🔧 Monitoring Commands:"
echo "GPU Usage: nvidia-smi"
echo "Service Logs: docker logs gameforge-sdxl"
echo "Service Status: docker-compose -f docker-compose-vast.yml ps"
echo ""
echo "📝 Test Generation:"
echo 'curl -X POST http://localhost:8000/generate \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"prompt\": \"fantasy knight, pixel art\", \"width\": 512, \"height\": 512}"'

# Run quick test
echo ""
echo "🧪 Running quick test..."
./test-vast-service.sh
