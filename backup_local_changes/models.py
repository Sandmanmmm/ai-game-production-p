# Asset Generation Data Models
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
import uuid
from datetime import datetime

class AssetType(str, Enum):
    CHARACTER_DESIGN = "character-design"
    ENVIRONMENT_ART = "environment-art"
    PROP_DESIGN = "prop-design"
    UI_ELEMENT = "ui-element"
    CONCEPT_ART = "concept-art"

class StyleType(str, Enum):
    PIXEL_ART = "pixel-art"
    HAND_DRAWN = "hand-drawn"
    REALISTIC = "realistic"
    CARTOON = "cartoon"
    MINIMALIST = "minimalist"

class QualityLevel(str, Enum):
    DRAFT = "draft"
    STANDARD = "standard"
    HIGH = "high"
    PRODUCTION = "production"

class AssetFormat(str, Enum):
    PNG = "png"
    WEBP = "webp"
    SVG = "svg"
    JPG = "jpg"

# Request Models
class GenerationRequest(BaseModel):
    """Main asset generation request"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    
    # Asset Configuration
    asset_type: AssetType
    style: Optional[StyleType] = None
    quality: QualityLevel = QualityLevel.STANDARD
    
    # Generation Parameters
    width: int = Field(512, ge=64, le=2048)
    height: int = Field(512, ge=64, le=2048)
    num_images: int = Field(1, ge=1, le=16)
    steps: int = Field(20, ge=1, le=150)
    guidance_scale: float = Field(7.5, ge=1.0, le=30.0)
    seed: Optional[int] = Field(None, ge=0)
    
    # Model Configuration
    model_id: Optional[str] = None
    lora_weights: Optional[List[str]] = None
    lora_scales: Optional[List[float]] = None
    
    # Output Configuration
    format: AssetFormat = AssetFormat.PNG
    transparent_background: bool = True
    optimize_for_game: bool = True
    
    # Post-processing
    apply_sprite_optimization: bool = False
    apply_tileset_optimization: bool = False
    remove_background: bool = False
    
    # Metadata
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    @validator('lora_scales')
    def validate_lora_scales(cls, v, values):
        if v and 'lora_weights' in values:
            lora_weights = values.get('lora_weights', [])
            if len(v) != len(lora_weights):
                raise ValueError("Number of LoRA scales must match number of LoRA weights")
        return v

class StylePackRequest(BaseModel):
    """Style pack training request"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    base_model: str = "stabilityai/stable-diffusion-xl-base-1.0"
    
    # Training Images
    reference_images: List[str] = Field(..., min_length=5, max_length=100)
    
    # Training Configuration
    training_steps: int = Field(1000, ge=100, le=5000)
    learning_rate: float = Field(1e-4, ge=1e-6, le=1e-2)
    batch_size: int = Field(1, ge=1, le=8)
    resolution: int = Field(512, ge=256, le=1024)
    
    # LoRA Configuration
    lora_rank: int = Field(16, ge=4, le=128)
    lora_alpha: int = Field(32, ge=8, le=256)
    lora_dropout: float = Field(0.1, ge=0.0, le=0.5)
    
    # Output
    output_name: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None

# Response Models
class GeneratedAsset(BaseModel):
    """Single generated asset"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    thumbnail_url: Optional[str] = None
    filename: str
    
    # Technical Details
    width: int
    height: int
    format: str
    file_size: int
    
    # Generation Details
    prompt: str
    negative_prompt: Optional[str] = None
    seed: int
    steps: int
    guidance_scale: float
    model_used: str
    
    # Quality Metrics
    quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    processing_time: float
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GenerationResponse(BaseModel):
    """Response from asset generation"""
    request_id: str
    status: Literal["completed", "failed", "processing"]
    
    # Results
    assets: List[GeneratedAsset] = Field(default_factory=list)
    
    # Summary
    total_generated: int = 0
    successful: int = 0
    failed: int = 0
    
    # Performance
    total_processing_time: float = 0.0
    average_quality_score: Optional[float] = None
    
    # Error Information
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    
    # Metadata
    completed_at: datetime = Field(default_factory=datetime.now)

class StylePackResponse(BaseModel):
    """Response from style pack training"""
    style_pack_id: str
    name: str
    status: Literal["training", "completed", "failed"]
    
    # Training Results
    model_path: Optional[str] = None
    checkpoint_path: Optional[str] = None
    
    # Metrics
    final_loss: Optional[float] = None
    training_time: Optional[float] = None
    
    # Preview
    preview_images: List[str] = Field(default_factory=list)
    
    # Error Information
    error_message: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

# Job Queue Models
class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobProgress(BaseModel):
    """Job progress information"""
    percentage: float = Field(ge=0.0, le=100.0)
    stage: str
    message: str
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    estimated_time_remaining: Optional[float] = None

class JobInfo(BaseModel):
    """Job information"""
    job_id: str
    status: JobStatus
    progress: Optional[JobProgress] = None
    
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Health Check Models
class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Service Status
    models_loaded: bool = False
    gpu_available: bool = False
    memory_usage: Optional[Dict[str, float]] = None
    
    # Dependencies
    redis_connected: bool = False
    storage_accessible: bool = False
    
    # Performance
    average_response_time: Optional[float] = None
    total_requests: int = 0
    
class ModelInfo(BaseModel):
    """Information about loaded models"""
    model_id: str
    model_type: str
    loaded: bool
    memory_usage: Optional[float] = None
    last_used: Optional[datetime] = None
