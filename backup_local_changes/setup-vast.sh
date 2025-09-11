#!/bin/bash
# Vast.ai Instance Setup Script
# Run this on your Vast.ai instance after SSH connection

set -e

echo "🚀 GameForge SDXL - Vast.ai Setup Script"
echo "========================================"

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker Compose if not available
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install git if not available
if ! command -v git &> /dev/null; then
    echo "📚 Installing Git..."
    apt-get install -y git curl wget
fi

# Clone repository (replace with your actual repository)
echo "📥 Cloning GameForge repository..."
if [ -d "GameForge" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd GameForge
    git pull
    cd ..
else
    # Replace with your actual GitHub repository URL
    git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge
fi

# Navigate to service directory
cd GameForge/services/asset-gen

# Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p outputs/{assets,thumbnails,references,temp}
mkdir -p models/{lora,checkpoints}

# Check GPU availability
echo "🔍 Checking GPU availability..."
nvidia-smi

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose-vast.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:8000/health; then
    echo "✅ Service is healthy and ready!"
    echo ""
    echo "🌐 Service Access Information:"
    echo "================================"
    echo "Health Check: http://$(curl -s ifconfig.me):8000/health"
    echo "API Docs: http://$(curl -s ifconfig.me):8000/docs"
    echo ""
    echo "📝 Test Generation Command:"
    echo 'curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"fantasy knight character, pixel art style\",
    \"asset_type\": \"character_design\",
    \"style\": \"pixel_art\",
    \"width\": 512,
    \"height\": 512
  }"'
    echo ""
    echo "🎯 Your GameForge SDXL service is ready for development!"
else
    echo "❌ Health check failed. Checking logs..."
    docker-compose -f docker-compose-vast.yml logs
fi

echo ""
echo "🔧 Useful Commands:"
echo "==================="
echo "View logs: docker-compose -f docker-compose-vast.yml logs -f"
echo "Stop services: docker-compose -f docker-compose-vast.yml down"
echo "Restart services: docker-compose -f docker-compose-vast.yml restart"
echo "Check GPU usage: watch nvidia-smi"
