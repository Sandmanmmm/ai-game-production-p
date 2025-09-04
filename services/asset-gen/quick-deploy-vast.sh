#!/bin/bash
# GameForge SDXL Quick Deploy Script for Vast.ai RTX 4090
# This script will set up your GameForge SDXL service on your RTX 4090 instance

set -e

echo "🚀 GameForge SDXL - Vast.ai RTX 4090 Quick Deploy"
echo "================================================="
echo ""
echo "Instance Details:"
echo "- Instance ID: 25599851"
echo "- RTX 4090 (24GB VRAM)"
echo "- 12 CPU cores"
echo "- 32GB storage"
echo ""

# Check if we're on the right system
if ! nvidia-smi &>/dev/null; then
    echo "❌ NVIDIA GPU not detected. Make sure you're on the Vast.ai instance."
    exit 1
fi

echo "✅ NVIDIA GPU detected"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Update system packages
echo ""
echo "📦 Updating system packages..."
apt-get update -qq
apt-get install -y git curl wget docker-compose

# Check Docker
if ! docker --version &>/dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

echo "✅ Docker ready: $(docker --version)"

# Clone GameForge repository
echo ""
echo "📥 Cloning GameForge repository..."
if [ -d "GameForge" ]; then
    echo "Repository exists, updating..."
    cd GameForge && git pull && cd ..
else
    git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge
fi

# Navigate to service directory
cd GameForge/services/asset-gen

# Create necessary directories
echo ""
echo "📁 Creating storage directories..."
mkdir -p outputs/{assets,thumbnails,references,temp}
mkdir -p models/{lora,checkpoints}

# Show current directory structure
echo ""
echo "📋 Service files check:"
for file in main.py Dockerfile requirements.txt docker-compose-vast.yml; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

# Build and start services
echo ""
echo "🏗️ Building GameForge SDXL service..."
echo "This may take 5-10 minutes for first time setup..."

# Check if docker-compose-vast.yml exists, create if not
if [ ! -f "docker-compose-vast.yml" ]; then
    echo "Creating docker-compose-vast.yml..."
    cat > docker-compose-vast.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  gameforge-sdxl:
    build: .
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./outputs:/app/outputs
      - ./models:/app/models
      - model_cache:/tmp/models
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - DEVICE=cuda
      - BASE_MODEL_PATH=segmind/SSD-1B
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=false
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MAX_CACHED_MODELS=3
      - MAX_BATCH_SIZE=6
    depends_on:
      - redis
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  redis_data:
  model_cache:
EOF
fi

# Start the services
docker-compose -f docker-compose-vast.yml up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo ""
echo "🏥 Performing health check..."
for i in {1..10}; do
    if curl -sf http://localhost:8000/health > /dev/null; then
        echo "✅ Service is healthy!"
        break
    else
        echo "⏳ Attempt $i/10 - waiting for service..."
        sleep 10
    fi
done

# Show final status
echo ""
echo "🎯 GameForge SDXL Deployment Status:"
echo "===================================="

if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ Service: RUNNING"
    echo "✅ GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader)"
    echo "✅ VRAM: $(nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits)"
    
    # Get external IP for access
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    echo ""
    echo "🌐 Access URLs:"
    echo "Health Check: http://$EXTERNAL_IP:8000/health"
    echo "API Documentation: http://$EXTERNAL_IP:8000/docs"
    echo "Interactive API: http://$EXTERNAL_IP:8000/redoc"
    
    echo ""
    echo "🧪 Test Generation Command:"
    echo "curl -X POST http://localhost:8000/generate \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{"
    echo "    \"prompt\": \"fantasy knight character, pixel art style\","
    echo "    \"asset_type\": \"character_design\","
    echo "    \"style\": \"pixel_art\","
    echo "    \"width\": 512,"
    echo "    \"height\": 512"
    echo "  }'"
    
else
    echo "❌ Service: FAILED"
    echo ""
    echo "Checking logs..."
    docker-compose -f docker-compose-vast.yml logs --tail=20
fi

echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "View logs: docker-compose -f docker-compose-vast.yml logs -f"
echo "Restart: docker-compose -f docker-compose-vast.yml restart"
echo "Stop: docker-compose -f docker-compose-vast.yml down"
echo "GPU usage: watch nvidia-smi"
echo ""
echo "🎮 Your GameForge SDXL service is ready on RTX 4090!"
