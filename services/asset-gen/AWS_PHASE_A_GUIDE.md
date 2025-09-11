# AWS Phase A Deployment Guide
# Complete setup for GameForge SDXL service with GPU acceleration

## Overview
This deployment transitions GameForge's SDXL asset generation from CPU-based development to production AWS GPU infrastructure.

## Architecture
- **S3**: Model storage (stabilityai/stable-diffusion-xl-base-1.0)
- **ECR**: Docker container registry for SDXL service
- **ECS**: GPU-enabled container orchestration (p3.2xlarge instances)
- **IAM**: Secure role-based access control
- **CloudWatch**: Comprehensive logging and monitoring

## Prerequisites
- AWS CLI configured with admin permissions
- Docker Desktop installed and running
- PowerShell 5.1+ (Windows)
- Minimum 50GB free disk space for model downloads

## Phase A: Infrastructure Setup

### Step 1: Execute Infrastructure Deployment
```powershell
# Navigate to asset generation service
cd services\asset-gen

# Execute deployment script
.\Deploy-AWS.ps1

# Expected outputs:
# ✅ S3 bucket: gameforge-models-[random]
# ✅ ECR repository: gameforge-sdxl-service
# ✅ IAM role: GameForgeECSTaskRole
# ✅ CloudWatch log group: /aws/ecs/gameforge-sdxl
```

### Step 2: Upload SDXL Models
```powershell
# Upload models to S3 (this will take 20-30 minutes)
.\Upload-Models.ps1

# Expected outputs:
# ✅ Downloaded: stabilityai/stable-diffusion-xl-base-1.0
# ✅ Uploaded: stable-diffusion-xl-base-1.0/ (6.94GB)
# ✅ Created: model-manifest.json
```

### Step 3: Build and Push Container
```powershell
# Build Docker image
docker build -t gameforge-sdxl-service .

# Tag for ECR
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
docker tag gameforge-sdxl-service:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/gameforge-sdxl-service:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/gameforge-sdxl-service:latest
```

### Step 4: Deploy ECS Service
```powershell
# Create ECS cluster with GPU instances
aws ecs create-cluster --cluster-name gameforge-gpu-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service (this will provision p3.2xlarge instances)
aws ecs create-service \
    --cluster gameforge-gpu-cluster \
    --service-name gameforge-sdxl-service \
    --task-definition gameforge-sdxl-task:1 \
    --desired-count 1 \
    --launch-type EC2
```

## Environment Variables
The deployment automatically configures these critical environment variables:

```env
# Model configuration
BASE_MODEL_PATH=stable-diffusion-xl-base-1.0
MODEL_CACHE_DIR=/app/models
S3_MODEL_BUCKET=gameforge-models-[random]

# AWS configuration
AWS_DEFAULT_REGION=us-east-1
ECS_ENABLE_LOGGING=true

# Performance optimization
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

## GPU Instance Configuration
- **Instance Type**: p3.2xlarge
- **GPU**: 1x NVIDIA Tesla V100 (16GB VRAM)
- **vCPUs**: 8
- **RAM**: 61GB
- **Storage**: 100GB EBS GP2

## Model Loading Strategy
The service implements intelligent model loading:

1. **S3 First**: Attempts to load models from S3 bucket
2. **Local Cache**: Maintains persistent model cache in `/app/models`
3. **Fallback**: Falls back to HuggingFace Hub if S3 unavailable
4. **Integrity Checks**: Verifies model completeness before loading

## Cost Optimization
- **Auto Scaling**: ECS service scales based on request volume
- **Spot Instances**: Consider spot instances for cost reduction
- **Model Caching**: S3 model cache reduces download costs
- **CloudWatch**: Monitoring helps optimize resource usage

## Performance Expectations
With AWS GPU acceleration:
- **Generation Time**: 3-8 seconds (vs 45-120 seconds on CPU)
- **Throughput**: 450-900 images/hour (vs 30-80 images/hour on CPU)
- **Quality**: Full SDXL quality with 1024x1024 resolution
- **Concurrent Jobs**: 5-10 parallel generations

## Monitoring and Logs
All services log to CloudWatch:
```bash
# View service logs
aws logs tail /aws/ecs/gameforge-sdxl --follow

# Monitor GPU usage
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name GPUUtilization \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-01T01:00:00Z \
    --period 300 \
    --statistics Average
```

## Troubleshooting

### Common Issues
1. **GPU Memory**: Monitor VRAM usage, adjust batch sizes if needed
2. **Model Download**: Large models take time, monitor S3 transfer progress
3. **Instance Limits**: Check AWS service limits for p3 instances
4. **Network**: Ensure security groups allow inbound traffic on port 8000

### Health Checks
```bash
# Test service endpoint
curl http://[ECS-SERVICE-IP]:8000/health

# Expected response:
{
  "status": "healthy",
  "gpu_available": true,
  "models_loaded": 1,
  "memory_usage": "45%",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Next Steps: Phase B - Production Scaling
After Phase A completion:
1. **Load Balancer**: Add Application Load Balancer
2. **Auto Scaling**: Configure ECS auto scaling policies
3. **Multi-Region**: Deploy to multiple AWS regions
4. **CDN**: CloudFront distribution for generated assets
5. **Monitoring**: Enhanced CloudWatch dashboards

## Security Notes
- ECS task role has minimal required permissions
- S3 bucket uses server-side encryption
- Container images scanned for vulnerabilities
- VPC security groups restrict network access

## Estimated Timeline
- **Infrastructure Setup**: 15-20 minutes
- **Model Upload**: 30-45 minutes
- **Container Deployment**: 10-15 minutes
- **Total Phase A**: 1-1.5 hours

## Success Criteria
Phase A is complete when:
- [x] S3 bucket created with SDXL models
- [x] ECR repository contains service image
- [x] ECS service running on GPU instances
- [x] Health check returns "gpu_available": true
- [x] End-to-end generation test < 10 seconds

Execute `.\Deploy-AWS.ps1` to begin Phase A deployment.
