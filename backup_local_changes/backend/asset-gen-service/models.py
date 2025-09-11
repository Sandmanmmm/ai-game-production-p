"""
Asset Generation Models and Data Structures
"""
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

class AssetType(str, Enum):
    SPRITE = "sprite"
    TILESET = "tileset" 
    BACKGROUND = "background"
    UI_ELEMENT = "ui_element"
    ICON = "icon"
    PORTRAIT = "portrait"
    EFFECT = "effect"
    PARTICLE = "particle"

class GenerationStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    POST_PROCESSING = "post_processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AssetGenerationRequest(BaseModel):
    """Request model for asset generation"""
    prompt: str = Field(..., description="Text description of the asset to generate")
    negative_prompt: Optional[str] = Field(
        default="blurry, low quality, distorted, deformed",
        description="What to avoid in generation"
    )
    style_pack_id: Optional[str] = Field(default=None, description="Style pack to apply")
    asset_type: AssetType = Field(..., description="Type of asset to generate")
    
    # Generation parameters
    width: int = Field(default=512, ge=64, le=2048, description="Image width")
    height: int = Field(default=512, ge=64, le=2048, description="Image height")
    num_variants: int = Field(default=4, ge=1, le=16, description="Number of variants")
    guidance_scale: float = Field(default=7.5, ge=1.0, le=20.0, description="CFG scale")
    num_inference_steps: int = Field(default=20, ge=10, le=100, description="Sampling steps")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")
    
    # Metadata
    project_id: str = Field(..., description="Project this asset belongs to")
    user_id: str = Field(..., description="User requesting the asset")
    batch_id: Optional[str] = Field(default=None, description="Batch this request belongs to")
    tags: List[str] = Field(default_factory=list, description="User-defined tags")
    
    # Advanced options
    use_refiner: bool = Field(default=True, description="Use SDXL refiner for higher quality")
    post_process: bool = Field(default=True, description="Apply asset-type specific post-processing")
    
    class Config:
        schema_extra = {
            "example": {
                "prompt": "medieval sword with blue gems, fantasy game weapon",
                "negative_prompt": "blurry, low quality, modern",
                "asset_type": "sprite",
                "width": 256,
                "height": 256,
                "num_variants": 4,
                "project_id": "proj_123",
                "user_id": "user_456",
                "tags": ["weapon", "medieval", "blue"]
            }
        }

class AssetGenerationResponse(BaseModel):
    """Response model for asset generation"""
    asset_id: str
    request_id: str
    status: GenerationStatus
    images: List[str] = Field(description="Base64 encoded images")
    thumbnails: List[str] = Field(default_factory=list, description="Base64 encoded thumbnails")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    completed_at: Optional[datetime] = None
    generation_time: Optional[float] = Field(default=None, description="Time in seconds")
    
    # Quality metrics
    quality_scores: Optional[Dict[str, float]] = Field(default=None)
    
    class Config:
        schema_extra = {
            "example": {
                "asset_id": "asset_789",
                "request_id": "req_123",
                "status": "completed",
                "images": ["base64_encoded_image_1", "base64_encoded_image_2"],
                "metadata": {
                    "prompt": "medieval sword",
                    "generation_params": {"width": 256, "height": 256}
                },
                "created_at": "2025-09-02T16:30:00Z",
                "generation_time": 15.7
            }
        }

class ProgressUpdate(BaseModel):
    """Real-time progress update"""
    request_id: str
    status: GenerationStatus
    progress: float = Field(ge=0.0, le=1.0, description="Progress from 0 to 1")
    current_step: str
    step_number: int = Field(default=0, description="Current step number")
    total_steps: int = Field(default=0, description="Total steps")
    estimated_time_remaining: Optional[int] = Field(default=None, description="ETA in seconds")
    error_message: Optional[str] = None
    
    # Performance metrics
    gpu_memory_used: Optional[float] = Field(default=None, description="GPU memory in GB")
    generation_speed: Optional[float] = Field(default=None, description="Steps per second")

class StylePackInfo(BaseModel):
    """Style pack information"""
    style_pack_id: str
    name: str
    description: Optional[str] = None
    model_path: str
    lora_weights: Optional[str] = None
    trigger_words: List[str] = Field(default_factory=list)
    
    # Training metadata
    training_images_count: int = 0
    training_completed_at: Optional[datetime] = None
    quality_score: Optional[float] = None
    
    # Usage statistics
    total_generations: int = 0
    last_used: Optional[datetime] = None
    
    class Config:
        schema_extra = {
            "example": {
                "style_pack_id": "pack_pixel_art",
                "name": "16-bit Pixel Art",
                "description": "Classic retro pixel art style",
                "model_path": "/models/pixel_art_lora.safetensors",
                "trigger_words": ["pixel art", "16bit", "retro"],
                "training_images_count": 150,
                "quality_score": 0.87
            }
        }

class BatchRequest(BaseModel):
    """Batch asset generation request"""
    batch_id: str
    name: str
    description: Optional[str] = None
    prompts: List[str] = Field(..., description="List of prompts for batch generation")
    
    @validator('prompts')
    def validate_prompts(cls, v):
        if len(v) < 1 or len(v) > 100:
            raise ValueError('prompts must contain between 1 and 100 items')
        return v
    
    # Common parameters for all assets in batch
    base_params: AssetGenerationRequest
    
    # Batch-specific options
    priority: int = Field(default=0, description="Batch priority (higher = more important)")
    auto_approve: bool = Field(default=False, description="Auto-approve generated assets")
    notification_webhook: Optional[str] = None
    
    # Status
    status: GenerationStatus = GenerationStatus.QUEUED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Progress tracking
    total_assets: int = 0
    completed_assets: int = 0
    failed_assets: int = 0

class AssetMetadata(BaseModel):
    """Extended asset metadata"""
    asset_id: str
    filename: str
    file_size: int
    mime_type: str
    dimensions: tuple[int, int]
    
    # Generation info
    prompt: str
    generation_params: Dict[str, Any]
    style_pack_used: Optional[str] = None
    
    # Quality metrics
    quality_score: Optional[float] = None
    has_transparency: bool = False
    dominant_colors: List[str] = Field(default_factory=list)
    
    # Usage info
    download_count: int = 0
    last_downloaded: Optional[datetime] = None
    
    # Organization
    tags: List[str] = Field(default_factory=list)
    collections: List[str] = Field(default_factory=list)
    is_favorite: bool = False

class GenerationConfig(BaseModel):
    """Service configuration"""
    # Model settings
    model_id: str = "stabilityai/stable-diffusion-xl-base-1.0"
    refiner_id: str = "stabilityai/stable-diffusion-xl-refiner-1.0"
    use_refiner: bool = True
    
    # Performance settings
    max_concurrent_generations: int = 2
    max_batch_size: int = 10
    gpu_memory_threshold: float = 0.9
    
    # Quality settings
    default_steps: int = 20
    max_steps: int = 100
    default_guidance: float = 7.5
    
    # Storage settings
    output_format: str = "PNG"
    compression_quality: int = 95
    thumbnail_size: tuple[int, int] = (256, 256)
    
    # Cache settings
    cache_models: bool = True
    cache_results_hours: int = 24
