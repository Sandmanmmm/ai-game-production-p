# GameForge SDXL - Vast.ai RTX 4090 Deployment Guide

## Your Instance Details
- **Instance ID**: 25599851
- **Host**: 3483
- **GPU**: RTX 4090 (24GB VRAM)
- **CPU**: Intel Core i5-10400F (12 cores)
- **RAM**: 32GB available
- **Storage**: 32GB SSD

## Step 1: Connect to Your Instance

### Option A: SSH Connection
The SSH connection format for Vast.ai is usually one of these:
```bash
ssh -p 3483 root@ssh.vast.ai
# or
ssh root@ssh3483.vast.ai
# or check your Vast.ai console for the exact SSH command
```

### Option B: Vast.ai Web Terminal (Recommended)
1. Go to https://vast.ai/console/instances/
2. Find your instance (25599851)
3. Click "CONNECT" to open web terminal

## Step 2: Quick Deployment

Once connected to your instance, run this single command:

```bash
curl -sSL https://raw.githubusercontent.com/Sandmanmmm/ai-game-production-p/main/services/asset-gen/quick-deploy-vast.sh -o deploy.sh && chmod +x deploy.sh && ./deploy.sh
```

This script will:
- ✅ Check GPU availability (RTX 4090)
- ✅ Install Docker if needed
- ✅ Clone GameForge repository
- ✅ Build optimized container for RTX 4090
- ✅ Start Redis + GameForge SDXL service
- ✅ Perform health checks
- ✅ Provide access URLs

## Step 3: Manual Deployment (Alternative)

If you prefer manual setup:

```bash
# 1. Check GPU
nvidia-smi

# 2. Install dependencies
apt-get update && apt-get install -y git curl docker-compose

# 3. Clone repository
git clone https://github.com/Sandmanmmm/ai-game-production-p.git GameForge
cd GameForge/services/asset-gen

# 4. Create storage directories
mkdir -p outputs/{assets,thumbnails,references,temp}

# 5. Start services
docker-compose -f docker-compose-vast.yml up -d --build

# 6. Wait for startup (first time takes 5-10 mins)
sleep 300

# 7. Test health
curl http://localhost:8000/health
```

## Step 4: Test Your Service

### Health Check
```bash
curl http://localhost:8000/health
```

### Generate Test Image
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fantasy knight character, pixel art style",
    "asset_type": "character_design",
    "style": "pixel_art",
    "width": 512,
    "height": 512
  }'
```

### Monitor GPU Usage
```bash
watch nvidia-smi
```

## Step 5: Access Your Service

Your service will be available at:
- **Health Check**: `http://YOUR_VAST_IP:8000/health`
- **API Docs**: `http://YOUR_VAST_IP:8000/docs`
- **Interactive API**: `http://YOUR_VAST_IP:8000/redoc`

To find your external IP:
```bash
curl ifconfig.me
```

## RTX 4090 Optimizations Applied

Your service is configured for optimal RTX 4090 performance:
- **Model Cache**: 3 models (vs 2 default) - uses 24GB VRAM efficiently
- **Batch Size**: 6 images (vs 4 default) - faster bulk generation
- **No CPU Offload**: Everything runs on GPU for maximum speed
- **Fast Model**: Using segmind/SSD-1B for quicker generation
- **Mixed Precision**: Enabled for better performance

## Monitoring Commands

```bash
# View service logs
docker-compose -f docker-compose-vast.yml logs -f gameforge-sdxl

# Check container status
docker ps

# GPU monitoring
nvidia-smi

# Restart service
docker-compose -f docker-compose-vast.yml restart

# Stop service
docker-compose -f docker-compose-vast.yml down
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose-vast.yml logs

# Rebuild
docker-compose -f docker-compose-vast.yml down
docker-compose -f docker-compose-vast.yml up -d --build
```

### Out of Memory Errors
```bash
# Check VRAM usage
nvidia-smi

# Reduce batch size in config if needed
```

### Network Issues
```bash
# Check if port 8000 is open
netstat -tulpn | grep 8000

# Test local connection
curl http://localhost:8000/health
```

## Cost Optimization Tips

- **Monitor Usage**: Your RTX 4090 costs ~$0.20-$0.40/hour
- **Stop When Idle**: Use `docker-compose down` when not developing
- **Batch Operations**: Generate multiple assets at once for efficiency

## Next Steps

1. **Frontend Integration**: Connect your frontend to this Vast.ai endpoint
2. **Model Experimentation**: Try different SDXL models and LoRAs
3. **Custom Training**: Set up LoRA training for your game's art style
4. **Performance Tuning**: Optimize for your specific use cases

Your GameForge SDXL service on RTX 4090 is ready for serious AI game development! 🎮🚀
