# GameForge SDXL Deployment to Vast.ai Instance 25599851
# RTX 4090 - Host 3483

# SSH Connection Command
ssh -p 3483 root@ssh3.vast.ai

# Once connected, run these commands:

# 1. Update system and install essentials
apt-get update && apt-get upgrade -y
apt-get install -y git curl wget htop

# 2. Install Docker Compose if not available
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. Verify GPU is available
nvidia-smi

# 4. Clone GameForge repository
git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge
cd GameForge/services/asset-gen

# 5. Create storage directories
mkdir -p outputs/{assets,thumbnails,references,temp}
mkdir -p models/{lora,checkpoints}

# 6. Copy RTX 4090 optimized config
cp config-vast.py config.py

# 7. Build and start the service
docker-compose -f docker-compose-vast.yml up -d --build

# 8. Wait for initialization (models need to download)
echo "Waiting for service to initialize (2-3 minutes)..."
sleep 120

# 9. Check service health
curl http://localhost:8000/health

# 10. Test generation
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fantasy knight character, pixel art style",
    "asset_type": "character_design",
    "style": "pixel_art",
    "width": 512,
    "height": 512,
    "steps": 20,
    "guidance_scale": 7.5
  }'
