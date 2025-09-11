"""
GameForge Asset Generation Service
A FastAPI service for AI-powered game asset generation using SDXL + LoRA
"""
import os
import asyncio
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis
import torch
from diffusers import StableDiffusionXLPipeline, DiffusionPipeline
from PIL import Image
import io
import uuid
import json
from datetime import datetime

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
GPU_AVAILABLE = torch.cuda.is_available()
DEVICE = "cuda" if GPU_AVAILABLE else "cpu"
MODEL_CACHE_DIR = "./models"

# Global state
pipelines = {}
redis_client = None

# Pydantic Models
class AssetRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, distorted"
    style_pack_id: Optional[str] = None
    asset_type: str = Field(..., description="sprite, tileset, background, ui_element, etc.")
    width: int = 512
    height: int = 512
    num_variants: int = 4
    guidance_scale: float = 7.5
    num_inference_steps: int = 20
    seed: Optional[int] = None
    project_id: str
    user_id: str
    batch_id: Optional[str] = None

class AssetResponse(BaseModel):
    asset_id: str
    request_id: str
    status: str
    images: List[str]  # Base64 encoded images
    metadata: Dict[str, Any]
    created_at: datetime

class ProgressUpdate(BaseModel):
    request_id: str
    status: str  # queued, processing, post_processing, completed, failed
    progress: float  # 0.0 to 1.0
    current_step: str
    estimated_time_remaining: Optional[int] = None
    error_message: Optional[str] = None

class StylePackInfo(BaseModel):
    style_pack_id: str
    name: str
    model_path: str
    lora_weights: Optional[str] = None
    trigger_words: List[str] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global pipelines, redis_client
    
    print("🚀 Starting Asset Generation Service...")
    print(f"🔧 Device: {DEVICE}")
    print(f"🎮 GPU Available: {GPU_AVAILABLE}")
    
    # Initialize Redis connection
    redis_client = redis.from_url(REDIS_URL)
    
    # Load base SDXL model
    print("📥 Loading Stable Diffusion XL model...")
    try:
        if GPU_AVAILABLE:
            pipelines["sdxl_base"] = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16,
                use_safetensors=True,
                cache_dir=MODEL_CACHE_DIR
            ).to(DEVICE)
            
            # Enable memory efficient attention
            pipelines["sdxl_base"].enable_model_cpu_offload()
            pipelines["sdxl_base"].enable_vae_slicing()
        else:
            # CPU fallback (much slower)
            pipelines["sdxl_base"] = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float32,
                cache_dir=MODEL_CACHE_DIR
            )
        
        print("✅ SDXL model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading SDXL model: {e}")
        # Fall back to a smaller model for development
        pipelines["sdxl_base"] = None
    
    yield
    
    # Cleanup
    print("🔄 Shutting down Asset Generation Service...")
    if redis_client:
        await redis_client.close()

# Create FastAPI app
app = FastAPI(
    title="GameForge Asset Generation Service",
    description="AI-powered game asset generation with SDXL and LoRA support",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def publish_progress(update: ProgressUpdate):
    """Publish progress update to Redis for WebSocket broadcast"""
    try:
        await redis_client.publish(
            f"asset_progress:{update.request_id}",
            update.json()
        )
    except Exception as e:
        print(f"Error publishing progress: {e}")

async def process_asset_generation(request: AssetRequest, request_id: str):
    """Main asset generation pipeline"""
    try:
        # Update progress: Starting
        await publish_progress(ProgressUpdate(
            request_id=request_id,
            status="processing",
            progress=0.1,
            current_step="Initializing generation pipeline"
        ))
        
        # Get the appropriate pipeline
        pipeline = pipelines.get("sdxl_base")
        if not pipeline:
            raise Exception("SDXL pipeline not available")
        
        # Apply LoRA weights if style pack specified
        if request.style_pack_id:
            await publish_progress(ProgressUpdate(
                request_id=request_id,
                status="processing", 
                progress=0.2,
                current_step="Loading style pack weights"
            ))
            # TODO: Load LoRA weights for style pack
            pass
        
        # Generate images
        await publish_progress(ProgressUpdate(
            request_id=request_id,
            status="processing",
            progress=0.3,
            current_step=f"Generating {request.num_variants} variants"
        ))
        
        images = []
        for i in range(request.num_variants):
            # Set seed for reproducibility
            generator = torch.Generator(device=DEVICE)
            if request.seed:
                generator.manual_seed(request.seed + i)
            
            # Generate image
            with torch.autocast(DEVICE):
                result = pipeline(
                    prompt=request.prompt,
                    negative_prompt=request.negative_prompt,
                    width=request.width,
                    height=request.height,
                    guidance_scale=request.guidance_scale,
                    num_inference_steps=request.num_inference_steps,
                    generator=generator
                ).images[0]
            
            # Post-process image based on asset type
            processed_image = await post_process_asset(result, request.asset_type)
            
            # Convert to base64
            buffer = io.BytesIO()
            processed_image.save(buffer, format="PNG")
            import base64
            image_b64 = base64.b64encode(buffer.getvalue()).decode()
            images.append(image_b64)
            
            # Update progress
            progress = 0.3 + (0.6 * (i + 1) / request.num_variants)
            await publish_progress(ProgressUpdate(
                request_id=request_id,
                status="processing",
                progress=progress,
                current_step=f"Generated variant {i+1}/{request.num_variants}"
            ))
        
        # Save to asset library
        await publish_progress(ProgressUpdate(
            request_id=request_id,
            status="post_processing",
            progress=0.9,
            current_step="Saving to asset library"
        ))
        
        # Create response
        response = AssetResponse(
            asset_id=str(uuid.uuid4()),
            request_id=request_id,
            status="completed",
            images=images,
            metadata={
                "prompt": request.prompt,
                "asset_type": request.asset_type,
                "style_pack_id": request.style_pack_id,
                "generation_params": {
                    "width": request.width,
                    "height": request.height,
                    "guidance_scale": request.guidance_scale,
                    "steps": request.num_inference_steps,
                    "seed": request.seed
                }
            },
            created_at=datetime.utcnow()
        )
        
        # Store result in Redis
        await redis_client.set(
            f"asset_result:{request_id}",
            response.json(),
            ex=3600  # Expire after 1 hour
        )
        
        # Final progress update
        await publish_progress(ProgressUpdate(
            request_id=request_id,
            status="completed",
            progress=1.0,
            current_step="Asset generation complete"
        ))
        
    except Exception as e:
        # Handle errors
        await publish_progress(ProgressUpdate(
            request_id=request_id,
            status="failed",
            progress=0.0,
            current_step="Generation failed",
            error_message=str(e)
        ))
        print(f"Asset generation failed: {e}")

async def post_process_asset(image: Image.Image, asset_type: str) -> Image.Image:
    """Post-process generated image based on asset type"""
    if asset_type == "sprite":
        # Remove background, add alpha channel
        return await remove_background(image)
    elif asset_type == "tileset":
        # Ensure tileable
        return await make_tileable(image)
    elif asset_type == "ui_element":
        # Apply UI-specific processing
        return await process_ui_element(image)
    else:
        return image

async def remove_background(image: Image.Image) -> Image.Image:
    """Remove background from sprite (placeholder implementation)"""
    # TODO: Implement proper background removal
    # For now, just ensure RGBA mode
    return image.convert("RGBA")

async def make_tileable(image: Image.Image) -> Image.Image:
    """Make image tileable (placeholder implementation)"""
    # TODO: Implement tileable processing
    return image

async def process_ui_element(image: Image.Image) -> Image.Image:
    """Process UI element (placeholder implementation)"""
    # TODO: Implement UI-specific processing
    return image

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "asset-generation",
        "gpu_available": GPU_AVAILABLE,
        "models_loaded": list(pipelines.keys())
    }

@app.post("/generate", response_model=AssetResponse)
async def generate_assets(request: AssetRequest, background_tasks: BackgroundTasks):
    """Generate game assets from text prompt"""
    request_id = str(uuid.uuid4())
    
    # Start generation in background
    background_tasks.add_task(process_asset_generation, request, request_id)
    
    # Return immediate response
    return AssetResponse(
        asset_id="",  # Will be set when generation completes
        request_id=request_id,
        status="queued",
        images=[],
        metadata={"prompt": request.prompt},
        created_at=datetime.utcnow()
    )

@app.get("/status/{request_id}")
async def get_generation_status(request_id: str):
    """Get generation status and result"""
    # Check if result is ready
    result = await redis_client.get(f"asset_result:{request_id}")
    if result:
        return json.loads(result)
    
    return {"status": "processing", "request_id": request_id}

@app.get("/style-packs")
async def list_style_packs():
    """List available style packs"""
    # TODO: Implement style pack listing from database
    return {
        "style_packs": [
            {
                "id": "pixel_art",
                "name": "Pixel Art Style",
                "description": "Classic 16-bit pixel art style"
            },
            {
                "id": "watercolor",
                "name": "Watercolor Style", 
                "description": "Soft watercolor painting style"
            }
        ]
    }

@app.post("/style-packs/{style_pack_id}/generate")
async def generate_with_style_pack(
    style_pack_id: str,
    request: AssetRequest,
    background_tasks: BackgroundTasks
):
    """Generate assets using a specific style pack"""
    request.style_pack_id = style_pack_id
    return await generate_assets(request, background_tasks)

if __name__ == "__main__":
    # For development only
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
