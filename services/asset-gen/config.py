# Environment Configuration for Asset Generation Service
import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Service Configuration
    service_name: str = "asset-gen"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    
    # AI Model Configuration
    base_model_path: str = "stabilityai/stable-diffusion-xl-base-1.0"
    refiner_model_path: str = "stabilityai/stable-diffusion-xl-refiner-1.0"
    vae_model_path: str = "madebyollin/sdxl-vae-fp16-fix"
    
    # Custom Models Directory
    custom_models_dir: str = "./models"
    lora_models_dir: str = "./models/lora"
    checkpoints_dir: str = "./models/checkpoints"
    
    # Generation Settings
    default_width: int = 512
    default_height: int = 512
    default_steps: int = 20
    default_guidance_scale: float = 7.5
    max_batch_size: int = 4
    max_cached_models: int = 2
    scheduler: str = "dpm"  # dpm, euler_a, ddim
    
    # Hardware Configuration
    device: str = "cuda" if os.name != 'nt' else "cpu"  # Use CPU on Windows for development
    enable_attention_slicing: bool = True
    enable_cpu_offload: bool = True
    use_safetensors: bool = True
    
    # Storage Configuration
    output_dir: str = "./outputs"
    temp_dir: str = "./temp"
    
    # Redis Configuration (for job queue)
    redis_host: str = "localhost"
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
    
    # Security
    api_key: Optional[str] = None
    allowed_hosts: List[str] = ["localhost", "127.0.0.1"]
    
    class Config:
        env_file = ".env"
        env_prefix = "ASSET_GEN_"

# Global settings instance
settings = Settings()
