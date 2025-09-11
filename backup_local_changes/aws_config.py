# GameForge SDXL Service AWS Deployment Configuration

import os
from typing import Dict, Any

# AWS Configuration
AWS_CONFIG = {
    'region': 'us-east-1',
    'account_id': os.getenv('AWS_ACCOUNT_ID'),
    's3_bucket': 'gameforge-models',
    'ecr_repository': 'gameforge/sdxl-worker',
    'ecs_cluster': 'gameforge-cluster',
    'ecs_service': 'gameforge-sdxl-service',
    'task_definition': 'gameforge-sdxl-task'
}

# Model Configuration for S3
MODEL_CONFIG = {
    'sdxl_base': {
        's3_path': 's3://gameforge-models/sdxl-base/',
        'model_name': 'stabilityai/stable-diffusion-xl-base-1.0',
        'files': [
            'model_index.json',
            'scheduler/scheduler_config.json',
            'text_encoder/config.json',
            'text_encoder/pytorch_model.bin',
            'text_encoder_2/config.json', 
            'text_encoder_2/pytorch_model.bin',
            'tokenizer/tokenizer_config.json',
            'tokenizer/vocab.json',
            'tokenizer/merges.txt',
            'tokenizer_2/tokenizer_config.json',
            'tokenizer_2/vocab.json', 
            'tokenizer_2/merges.txt',
            'unet/config.json',
            'unet/diffusion_pytorch_model.safetensors',
            'vae/config.json',
            'vae/diffusion_pytorch_model.safetensors'
        ]
    },
    'lora_adapters': {
        's3_path': 's3://gameforge-models/lora-adapters/',
        'adapters': [
            'fantasy-weapons.safetensors',
            'medieval-style.safetensors',
            'game-assets.safetensors'
        ]
    }
}

# ECS Task Configuration
ECS_TASK_CONFIG = {
    'cpu': '2048',  # 2 vCPU
    'memory': '8192',  # 8 GB
    'gpu': '1',  # 1 GPU
    'instance_type': 'g4dn.xlarge',
    'desired_count': 1,
    'max_capacity': 3,
    'min_capacity': 1
}

# Environment Variables for Container
CONTAINER_ENV_VARS = {
    'MODEL_CACHE_DIR': '/app/models',
    'S3_MODEL_BUCKET': 'gameforge-models', 
    'AWS_DEFAULT_REGION': 'us-east-1',
    'REDIS_URL': 'redis://gameforge-redis.abc123.cache.amazonaws.com:6379',
    'LOG_LEVEL': 'INFO',
    'WORKERS': '2',
    'MAX_CONCURRENT_JOBS': '4'
}

def get_aws_config() -> Dict[str, Any]:
    """Get AWS configuration with environment variable validation"""
    config = AWS_CONFIG.copy()
    
    # Validate required environment variables
    required_env_vars = ['AWS_ACCOUNT_ID']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    return config

def get_ecr_image_uri() -> str:
    """Generate the full ECR image URI"""
    config = get_aws_config()
    return f"{config['account_id']}.dkr.ecr.{config['region']}.amazonaws.com/{config['ecr_repository']}:latest"

def get_model_s3_paths() -> Dict[str, str]:
    """Get S3 paths for all models"""
    return {
        model_name: config['s3_path'] 
        for model_name, config in MODEL_CONFIG.items()
    }
