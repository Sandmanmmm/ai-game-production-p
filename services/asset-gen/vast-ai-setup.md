# GameForge SDXL Service - Vast.ai Deployment Guide

## Overview
Deploy the GameForge SDXL AI asset generation service on Vast.ai with RTX 4090 (24GB VRAM) for cost-effective development.

## Vast.ai Instance Specifications
- **GPU**: RTX 4090 (24GB VRAM) ✅ Reserved
- **CPU**: 8+ cores recommended
- **RAM**: 32GB+ recommended  
- **Storage**: 100GB+ for models and outputs
- **Docker**: Required (most Vast.ai instances support this)

## Pre-Deployment Checklist

### 1. Model Storage Strategy
- **Option A**: Download models on container start (slower first run, cheaper)
- **Option B**: Pre-cache models in custom image (faster start, more expensive)
- **Recommended**: Option A for development

### 2. Port Configuration
- **Main Service**: Port 8000 (FastAPI)
- **Redis**: Port 6379 (internal)
- **SSH**: Default Vast.ai SSH port

### 3. Environment Variables
```bash
# GPU Configuration
CUDA_VISIBLE_DEVICES=0
DEVICE=cuda

# Model Configuration
BASE_MODEL_PATH=segmind/SSD-1B
MODEL_CACHE_DIR=/tmp/models

# Service Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Storage
OUTPUT_DIR=/app/outputs
TEMP_DIR=/tmp

# Redis (local container)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Deployment Steps

### Step 1: Launch Vast.ai Instance
1. Go to Vast.ai console
2. Filter for RTX 4090 instances
3. Select instance with:
   - Docker support
   - 32GB+ RAM
   - 100GB+ storage
   - Reasonable $/hr price

### Step 2: Container Deployment Options

#### Option A: Direct Docker Run (Recommended for development)
```bash
# SSH into your Vast.ai instance
ssh root@your-vast-instance

# Clone your repository or upload your container
git clone https://github.com/YourUsername/GameForge.git
cd GameForge/services/asset-gen

# Build the container
docker build -t gameforge-sdxl-vast .

# Run with GPU support
docker run -d \
  --name gameforge-sdxl \
  --gpus all \
  -p 8000:8000 \
  -v $(pwd)/outputs:/app/outputs \
  -e CUDA_VISIBLE_DEVICES=0 \
  -e DEVICE=cuda \
  -e DEBUG=false \
  gameforge-sdxl-vast
```

#### Option B: Docker Compose (Better for development)
See `docker-compose-vast.yml` below.

### Step 3: Health Check & Testing
```bash
# Check container logs
docker logs gameforge-sdxl

# Test health endpoint
curl http://localhost:8000/health

# Test generation endpoint
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

## Performance Optimization for RTX 4090

### Memory Management
- **24GB VRAM**: Sufficient for SDXL + multiple models
- **Model Caching**: Cache 2-3 models simultaneously
- **Batch Processing**: Up to 4 images per batch

### Configuration Tweaks
```python
# In config.py - optimize for RTX 4090
max_cached_models: int = 3  # Increased from 2
max_batch_size: int = 6     # Increased from 4
enable_attention_slicing: bool = False  # Disable for 4090
enable_cpu_offload: bool = False        # Keep everything on GPU
```

## Cost Analysis
- **RTX 4090 on Vast.ai**: ~$0.20-$0.40/hour
- **vs AWS g5.xlarge**: ~$1.00/hour
- **Development savings**: 60-80% cost reduction

## Monitoring & Maintenance

### GPU Monitoring
```bash
# Check GPU usage
nvidia-smi

# Monitor in real-time
watch nvidia-smi
```

### Container Health
```bash
# Check service health
curl http://localhost:8000/health

# View logs
docker logs -f gameforge-sdxl
```

## Development Workflow

### 1. Code Changes
- Edit code locally
- Push to repository
- Pull changes on Vast.ai instance
- Rebuild container if needed

### 2. Model Testing
- Test new models through API
- Monitor VRAM usage
- Optimize batch sizes

### 3. Performance Tuning
- Experiment with different schedulers
- Test LoRA combinations
- Benchmark generation times

## Next Steps After Setup
1. **Frontend Integration**: Connect your frontend to Vast.ai instance
2. **Model Library**: Download and test various SDXL models
3. **LoRA Training**: Set up training pipeline for custom styles
4. **Backup Strategy**: Regular backup of generated assets
5. **Production Migration**: When ready, migrate to AWS with learnings

## Troubleshooting
- **OOM Errors**: Reduce batch size or enable CPU offload
- **Slow Model Loading**: Pre-cache frequently used models
- **Network Issues**: Check Vast.ai instance connectivity
- **CUDA Issues**: Verify GPU driver compatibility
