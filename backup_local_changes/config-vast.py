# Vast.ai Configuration Optimizations for RTX 4090
# Update config.py with these optimized settings for development

import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Service Configuration
    service_name: str = "asset-gen"
    debug: bool = False  # Set to False for better performance
    host: str = "0.0.0.0"
    port: int = 8000
    
    # AI Model Configuration - Optimized for RTX 4090
    base_model_path: str = "segmind/SSD-1B"  # Faster than full SDXL
    refiner_model_path: str = "stabilityai/stable-diffusion-xl-refiner-1.0"
    vae_model_path: str = "madebyollin/sdxl-vae-fp16-fix"
    
    # Custom Models Directory
    custom_models_dir: str = "./models"
    lora_models_dir: str = "./models/lora"
    checkpoints_dir: str = "./models/checkpoints"
    
    # Generation Settings - RTX 4090 Optimized
    default_width: int = 512
    default_height: int = 512
    default_steps: int = 20
    default_guidance_scale: float = 7.5
    max_batch_size: int = 6  # Increased for 4090's 24GB VRAM
    
    # Model Management - RTX 4090 Optimized
    max_cached_models: int = 3  # Can cache more models with 24GB VRAM
    scheduler: str = "dpm"  # dpm, euler_a, ddim
    
    # Hardware Configuration - RTX 4090 Specific
    device: str = "cuda"
    enable_attention_slicing: bool = False  # Disable for better performance on 4090
    enable_cpu_offload: bool = False        # Keep everything on GPU for speed
    use_safetensors: bool = True
    
    # Storage Configuration
    output_dir: str = "/app/outputs"
    temp_dir: str = "/tmp"
    
    # Redis Configuration
    redis_host: str = "redis"  # Use Docker service name
    redis_port: int = 6379
    redis_db: int = 1
    
    # Database Configuration
    database_url: Optional[str] = None
    
    # API Keys
    huggingface_token: Optional[str] = None
    replicate_token: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "asset_gen.log"
    
    # S3/AWS Configuration (disabled for Vast.ai)
    use_s3: bool = False
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    s3_bucket: Optional[str] = None
    s3_region: str = "us-east-1"
    
    # Security
    api_key: Optional[str] = None
    allowed_hosts: List[str] = ["*"]  # Open for development
    
    class Config:
        env_file = ".env"
        env_prefix = "ASSET_GEN_"

# Performance optimizations for RTX 4090
RTX_4090_OPTIMIZATIONS = {
    "memory_fraction": 0.95,  # Use 95% of VRAM (22.8GB out of 24GB)
    "mixed_precision": True,   # Enable mixed precision for better performance
    "compile_model": True,     # Use torch.compile for faster inference
    "batch_scheduling": True,  # Enable batch scheduling for multiple requests
}
