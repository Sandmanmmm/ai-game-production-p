"""
GameForge SDXL Service - Production Optimized
Real Stable Diffusion XL with model caching, fp16, and xFormers optimization
"""

import os
import io
import base64
import asyncio
import logging
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import uvicorn
from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model caching
MODEL_CACHE: Dict[str, Any] = {}
MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"
REFINER_ID = "stabilityai/stable-diffusion-xl-refiner-1.0"

class ImageRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt to avoid")
    width: Optional[int] = Field(1024, ge=256, le=1536, description="Image width")
    height: Optional[int] = Field(1024, ge=256, le=1536, description="Image height")
    steps: Optional[int] = Field(25, ge=10, le=100, description="Number of denoising steps")
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0, description="CFG scale")
    use_refiner: Optional[bool] = Field(False, description="Use SDXL refiner for higher quality")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")

class ImageResponse(BaseModel):
    image: str = Field(..., description="Base64 encoded image")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")

class ModelStatus(BaseModel):
    loaded: bool
    model_id: str
    device: str
    memory_usage: Dict[str, float]
    optimizations: Dict[str, bool]

def get_device_info():
    """Get device information and memory usage"""
    if torch.cuda.is_available():
        device = "cuda"
        memory_allocated = torch.cuda.memory_allocated() / 1024**3  # GB
        memory_reserved = torch.cuda.memory_reserved() / 1024**3   # GB
        memory_total = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
        
        return {
            "device": device,
            "memory": {
                "allocated_gb": round(memory_allocated, 2),
                "reserved_gb": round(memory_reserved, 2),
                "total_gb": round(memory_total, 2),
                "free_gb": round(memory_total - memory_reserved, 2)
            }
        }
    else:
        return {
            "device": "cpu",
            "memory": {
                "allocated_gb": 0.0,
                "reserved_gb": 0.0,
                "total_gb": 0.0,
                "free_gb": 0.0
            }
        }

async def load_sdxl_models():
    """Load and optimize SDXL models with caching"""
    global MODEL_CACHE
    
    if "base_pipeline" in MODEL_CACHE:
        logger.info("Models already loaded from cache")
        return
    
    logger.info("Loading SDXL base model...")
    
    try:
        # Determine device and dtype
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        
        logger.info(f"Using device: {device}, dtype: {dtype}")
        
        # Load base pipeline with optimizations
        base_pipeline = StableDiffusionXLPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
            use_safetensors=True,
            variant="fp16" if device == "cuda" else None
        )
        
        # Apply optimizations
        optimizations = {
            "fp16": False,
            "xformers": False,
            "cpu_offload": False,
            "sequential_cpu_offload": False
        }
        
        if device == "cuda":
            # Enable fp16
            base_pipeline = base_pipeline.to(device, dtype=dtype)
            optimizations["fp16"] = True
            
            # Try to enable xFormers
            try:
                base_pipeline.enable_xformers_memory_efficient_attention()
                optimizations["xformers"] = True
                logger.info("✅ xFormers enabled for memory efficiency")
            except Exception as e:
                logger.warning(f"⚠️ xFormers not available: {e}")
            
            # Enable model CPU offload if memory is limited
            try:
                if torch.cuda.get_device_properties(0).total_memory < 16 * 1024**3:  # < 16GB
                    base_pipeline.enable_model_cpu_offload()
                    optimizations["cpu_offload"] = True
                    logger.info("✅ CPU offload enabled for memory optimization")
            except Exception as e:
                logger.warning(f"⚠️ CPU offload failed: {e}")
        else:
            base_pipeline = base_pipeline.to(device)
            logger.info("Running on CPU - optimizations limited")
        
        MODEL_CACHE["base_pipeline"] = base_pipeline
        MODEL_CACHE["device"] = device
        MODEL_CACHE["dtype"] = dtype
        MODEL_CACHE["optimizations"] = optimizations
        
        logger.info("✅ SDXL base model loaded and optimized successfully")
        
        # Optional: Load refiner (memory permitting)
        if device == "cuda" and torch.cuda.get_device_properties(0).total_memory > 12 * 1024**3:
            try:
                logger.info("Loading SDXL refiner model...")
                refiner_pipeline = StableDiffusionXLPipeline.from_pretrained(
                    REFINER_ID,
                    torch_dtype=dtype,
                    use_safetensors=True,
                    variant="fp16"
                )
                refiner_pipeline = refiner_pipeline.to(device)
                if optimizations["xformers"]:
                    refiner_pipeline.enable_xformers_memory_efficient_attention()
                
                MODEL_CACHE["refiner_pipeline"] = refiner_pipeline
                logger.info("✅ SDXL refiner model loaded")
            except Exception as e:
                logger.warning(f"⚠️ Refiner loading failed: {e}")
        
        # Log memory usage
        device_info = get_device_info()
        logger.info(f"Memory usage: {device_info['memory']}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load SDXL models: {e}")
        raise HTTPException(status_code=500, detail=f"Model loading failed: {str(e)}")

def cleanup_memory():
    """Clean up GPU memory"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        gc.collect()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - load models on startup"""
    logger.info("🚀 Starting GameForge SDXL Service...")
    await load_sdxl_models()
    yield
    logger.info("💤 Shutting down GameForge SDXL Service...")
    cleanup_memory()

# Create FastAPI app with lifespan
app = FastAPI(
    title="GameForge SDXL Service - Production",
    version="2.0.0",
    description="Production-optimized Stable Diffusion XL service with model caching and GPU acceleration",
    lifespan=lifespan
)

@app.get("/health")
async def health():
    """Health check endpoint"""
    device_info = get_device_info()
    models_loaded = len(MODEL_CACHE) > 0
    
    return {
        "status": "healthy" if models_loaded else "loading",
        "version": "2.0.0",
        "service": "sdxl-production",
        "models_loaded": models_loaded,
        "device": device_info["device"],
        "memory": device_info["memory"]
    }

@app.get("/model-status", response_model=ModelStatus)
async def get_model_status():
    """Get detailed model status and optimization info"""
    if not MODEL_CACHE:
        raise HTTPException(status_code=503, detail="Models not loaded yet")
    
    device_info = get_device_info()
    
    return ModelStatus(
        loaded=True,
        model_id=MODEL_ID,
        device=MODEL_CACHE.get("device", "unknown"),
        memory_usage=device_info["memory"],
        optimizations=MODEL_CACHE.get("optimizations", {})
    )

@app.post("/generate", response_model=ImageResponse)
async def generate_image(request: ImageRequest, background_tasks: BackgroundTasks):
    """Generate image using Stable Diffusion XL"""
    
    if "base_pipeline" not in MODEL_CACHE:
        raise HTTPException(status_code=503, detail="SDXL model not loaded yet")
    
    try:
        pipeline = MODEL_CACHE["base_pipeline"]
        device = MODEL_CACHE["device"]
        
        # Set random seed if provided
        generator = None
        if request.seed is not None:
            generator = torch.Generator(device=device).manual_seed(request.seed)
        
        logger.info(f"Generating image: '{request.prompt[:50]}...' ({request.width}x{request.height})")
        
        # Generate base image
        with torch.inference_mode():
            result = pipeline(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale,
                generator=generator,
                output_type="pil"
            )
        
        image = result.images[0]
        
        # Optional refiner pass
        if request.use_refiner and "refiner_pipeline" in MODEL_CACHE:
            logger.info("Applying refiner for enhanced quality...")
            refiner = MODEL_CACHE["refiner_pipeline"]
            refiner_steps = max(10, request.steps // 2) if request.steps else 15
            with torch.inference_mode():
                image = refiner(
                    prompt=request.prompt,
                    negative_prompt=request.negative_prompt,
                    image=image,
                    num_inference_steps=refiner_steps,
                    denoising_start=0.8,
                    generator=generator
                ).images[0]
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", quality=95)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Schedule memory cleanup
        background_tasks.add_task(cleanup_memory)
        
        # Generate metadata
        metadata = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt,
            "width": request.width,
            "height": request.height,
            "steps": request.steps,
            "guidance_scale": request.guidance_scale,
            "seed": request.seed,
            "use_refiner": request.use_refiner,
            "model": MODEL_ID,
            "device": device,
            "optimizations": MODEL_CACHE.get("optimizations", {}),
            "format": "PNG"
        }
        
        logger.info(f"✅ Image generated successfully ({len(img_base64)} chars)")
        
        return ImageResponse(
            image=img_base64,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"❌ Image generation failed: {e}")
        cleanup_memory()  # Clean up on error
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/reload-models")
async def reload_models():
    """Reload models (admin endpoint)"""
    global MODEL_CACHE
    logger.info("Reloading models...")
    
    # Clear cache
    MODEL_CACHE.clear()
    cleanup_memory()
    
    # Reload models
    await load_sdxl_models()
    
    return {"status": "success", "message": "Models reloaded"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        access_log=True,
        log_level="info"
    )
