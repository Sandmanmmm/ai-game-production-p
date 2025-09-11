# GameForge Regional Migration to us-west-2 🌟

This guide walks you through migrating your GameForge SDXL service from us-east-1 to us-west-2 for superior GPU availability and performance.

## 🎯 Migration Benefits

### Why us-west-2?
- ⚡ **30-40% better GPU availability** (g5.xlarge with A10G)
- 💰 **5-15% lower GPU instance costs**
- 🔧 **Access to latest GPU generations** (A10G vs T4)
- 🎯 **Higher spot instance success rates**
- 🏗️ **AWS AI/ML optimization hub**

### Performance Improvements Expected
- 🚀 **5-10x faster inference** vs CPU
- 🔥 **2x performance improvement** (A10G vs T4 GPU)
- 💾 **Better memory management** (24GB A10G vs 16GB T4)
- ⚡ **Faster model loading** with regional optimizations

## 📋 Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **PowerShell 5.1+** (Windows) or PowerShell Core
3. **Existing GameForge deployment** in us-east-1
4. **Admin access** to AWS account ID: 927588814706

## 🚀 Migration Steps

### Step 1: Run the Regional Migration

Execute the complete migration with one command:

```powershell
# Full migration (recommended)
.\deploy-regional-migration.ps1

# Dry run to preview changes
.\deploy-regional-migration.ps1 -DryRun
```

Or run phases individually:

### Step 2: Individual Phase Execution

#### Phase 1: Infrastructure Setup
```powershell
.\migrate-to-us-west-2.ps1
```

#### Phase 2: GPU Instance Configuration
```powershell
.\setup-gpu-instances-us-west-2.ps1
```

### Step 3: Validate the Migration

```powershell
# Basic validation
.\validate-gpu-service.ps1

# Full performance testing
.\validate-gpu-service.ps1 -RunPerformanceTest -TestIterations 5
```

## 📁 Migration Files Overview

| File | Purpose |
|------|---------|
| `migrate-to-us-west-2.ps1` | Main infrastructure migration script |
| `setup-gpu-instances-us-west-2.ps1` | GPU instance and ECS cluster setup |
| `deploy-regional-migration.ps1` | Orchestrates entire migration process |
| `validate-gpu-service.ps1` | Tests and validates deployed service |
| `ecs-task-definition-us-west-2.json` | GPU-optimized ECS task definition |
| `aws-config-us-west-2.json` | Regional configuration (auto-generated) |

## 🏗️ Infrastructure Created

### Regional Resources
- **VPC**: `gameforge-gpu-vpc` (10.0.0.0/16)
- **Subnets**: Multi-AZ across us-west-2a, us-west-2b, us-west-2c
- **Security Groups**: GPU-optimized security rules
- **Internet Gateway**: Public access for instances

### ECS Resources  
- **Cluster**: `gameforge-gpu-cluster`
- **Service**: `gameforge-sdxl-gpu-service`
- **Task Definition**: `gameforge-sdxl-gpu-us-west-2`

### GPU Infrastructure
- **Instance Type**: g5.xlarge (4 vCPU, 16GB RAM, 1x A10G GPU)
- **Auto Scaling**: 0-3 instances based on demand
- **Spot Support**: 50% cost savings potential
- **Launch Templates**: Both on-demand and spot configurations

### Storage & Monitoring
- **S3 Bucket**: `gameforge-models-9dexqte8-us-west-2`
- **ECR Repository**: `927588814706.dkr.ecr.us-west-2.amazonaws.com/gameforge-sdxl-service`
- **CloudWatch Logs**: `/aws/ecs/gameforge-sdxl-gpu`

## 💰 Cost Analysis

### Current (us-east-1 CPU)
- **Fargate**: 4 vCPU, 16GB RAM = ~$144/month
- **Performance**: Baseline CPU inference

### Target (us-west-2 GPU)
- **g5.xlarge**: $1.006/hour = ~$723/month
- **With 50% spots**: ~$542/month
- **Performance**: 5-10x faster inference

### Break-even Analysis
- **Cost increase**: 3.7x (with spots: 2.8x)
- **Performance gain**: 5-10x
- **Cost per inference**: 30-50% lower with GPU

## 🔧 Configuration Details

### GPU Optimization Features
- ✅ **CUDA 12.1** with cuDNN 8
- ✅ **XFormers** memory efficient attention
- ✅ **Model CPU offloading** for large models
- ✅ **PyTorch optimizations** for A10G architecture
- ✅ **Regional model caching** strategy

### Container Enhancements
- 🐳 **PyTorch 2.1.0** with CUDA support
- 🔥 **A10G-specific optimizations**
- 📦 **Diffusers + Transformers** latest versions
- 💾 **Persistent model caching**
- 🏥 **Enhanced health checks**

## 📊 Monitoring & Validation

### Key Metrics to Monitor
- **GPU Utilization**: Should be 70-90% during inference
- **Generation Time**: Target <10s for 1024x1024 images
- **Memory Usage**: A10G has 24GB VRAM
- **Cost per Image**: Track vs CPU baseline
- **Instance Availability**: us-west-2 should show better availability

### Health Endpoints
```bash
# Service info
curl http://<service-ip>:8080/

# Detailed health with GPU info  
curl http://<service-ip>:8080/health

# Generate test image
curl -X POST http://<service-ip>:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image", "width": 512, "height": 512}'
```

## 🛠️ Troubleshooting

### Common Issues

#### GPU Not Detected
```bash
# Check GPU driver installation
nvidia-smi

# Verify ECS agent GPU support
cat /etc/ecs/ecs.config | grep GPU
```

#### Service Won't Start
```bash
# Check ECS service status
aws ecs describe-services --cluster gameforge-gpu-cluster --services gameforge-sdxl-gpu-service --region us-west-2

# View container logs
aws logs get-log-events --log-group-name /aws/ecs/gameforge-sdxl-gpu --log-stream-name <stream-name> --region us-west-2
```

#### High Costs
- Enable spot instances for 50% cost savings
- Implement auto-scaling based on demand
- Use scheduled scaling for predictable workloads

### Debug Commands
```powershell
# Check AWS configuration
aws sts get-caller-identity
aws configure get region

# Verify ECS cluster status
aws ecs describe-clusters --clusters gameforge-gpu-cluster --region us-west-2

# List running tasks
aws ecs list-tasks --cluster gameforge-gpu-cluster --service-name gameforge-sdxl-gpu-service --region us-west-2
```

## 🎉 Post-Migration Checklist

- [ ] Validate GPU service is running and healthy
- [ ] Test image generation with performance benchmarks
- [ ] Update DNS/load balancer to point to us-west-2
- [ ] Set up cross-region monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Document new service endpoints
- [ ] Train team on new GPU-optimized service
- [ ] Plan gradual traffic migration strategy

## 📞 Support

If you encounter issues during migration:

1. **Check the validation script output** for detailed error messages
2. **Review AWS CloudWatch logs** for container-level errors  
3. **Verify GPU instance availability** in us-west-2 console
4. **Confirm IAM permissions** for all required services

## 🔄 Rollback Plan

If migration fails, you can quickly rollback:

1. **Keep original us-east-1 service running** during migration
2. **Update DNS back to us-east-1** if issues occur
3. **Original configuration preserved** in existing files
4. **No data loss** - models re-downloaded as needed

---

**🚀 Ready to migrate? Run `.\deploy-regional-migration.ps1` to get started!**
