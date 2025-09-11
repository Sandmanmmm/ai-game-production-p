#!/usr/bin/env python3
"""
GameForge SDXL Optimized Service
CPU-optimized with model caching and real SDXL
"""

import os
import io
import base64
import asyncio
import logging
import gc
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import uvicorn
from diffusers import StableDiffusionXLPipeline, DiffusionPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model cache
MODEL_CACHE: Dict[str, Any] = {}

# Use a smaller, faster SDXL model for CPU inference
MODEL_ID = "segmind/SSD-1B"  # Smaller SDXL-based model, faster inference

class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500, description="Text prompt")
    negative_prompt: Optional[str] = Field(None, max_length=500)
    width: Optional[int] = Field(512, ge=256, le=1024)
    height: Optional[int] = Field(512, ge=256, le=1024)
    steps: Optional[int] = Field(20, ge=10, le=30)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=15.0)
    seed: Optional[int] = Field(None, ge=0, le=2147483647)

class ImageResponse(BaseModel):
    image: str = Field(..., description="Base64 encoded PNG image")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")

class ModelStatus(BaseModel):
    loaded: bool
    model_id: str
    device: str
    memory_usage: Dict[str, float]
    optimizations: Dict[str, bool]

def get_memory_info():
    """Get memory usage information"""
    try:
        import psutil
        memory = psutil.virtual_memory()
        return {
            "total_gb": round(memory.total / 1024**3, 2),
            "available_gb": round(memory.available / 1024**3, 2),
            "used_gb": round(memory.used / 1024**3, 2),
            "percent": memory.percent
        }
    except ImportError:
        return {"total_gb": 0, "available_gb": 0, "used_gb": 0, "percent": 0}

async def load_optimized_model():
    """Load optimized SDXL model with CPU optimizations"""
    global MODEL_CACHE
    
    if "pipeline" in MODEL_CACHE:
        logger.info("Model already loaded from cache")
        return
    
    logger.info(f"Loading optimized model: {MODEL_ID}...")
    
    try:
        # Load with CPU optimizations
        pipeline = DiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32,  # Use float32 for CPU
            use_safetensors=True,
            safety_checker=None,  # Disable safety checker for faster inference
            requires_safety_checker=False
        )
        
        # CPU optimizations
        pipeline = pipeline.to("cpu")
        
        # Enable memory efficient attention if available
        optimizations = {
            "memory_efficient_attention": False,
            "cpu_offload": True,
            "safety_checker_disabled": True,
            "torch_compile": False
        }
        
        try:
            pipeline.enable_attention_slicing()
            optimizations["attention_slicing"] = True
            logger.info("✅ Attention slicing enabled")
        except Exception as e:
            logger.warning(f"⚠️ Attention slicing failed: {e}")
            optimizations["attention_slicing"] = False
        
        # Try torch compile for faster inference (PyTorch 2.0+)
        try:
            if hasattr(torch, "compile"):
                pipeline.unet = torch.compile(pipeline.unet, mode="reduce-overhead", fullgraph=True)
                optimizations["torch_compile"] = True
                logger.info("✅ Torch compile enabled")
        except Exception as e:
            logger.warning(f"⚠️ Torch compile failed: {e}")
        
        MODEL_CACHE["pipeline"] = pipeline
        MODEL_CACHE["model_id"] = MODEL_ID
        MODEL_CACHE["device"] = "cpu"
        MODEL_CACHE["optimizations"] = optimizations
        
        logger.info("✅ Optimized model loaded successfully")
        
        # Log memory usage
        memory_info = get_memory_info()
        logger.info(f"Memory usage: {memory_info}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        raise HTTPException(status_code=500, detail=f"Model loading failed: {str(e)}")

def cleanup_memory():
    """Clean up memory"""
    gc.collect()
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("🚀 Starting GameForge Optimized SDXL Service...")
    await load_optimized_model()
    yield
    logger.info("💤 Shutting down service...")
    cleanup_memory()

# Create FastAPI app
app = FastAPI(
    title="GameForge SDXL Optimized Service",
    version="2.1.0",
    description="CPU-optimized SDXL service with model caching and fast inference",
    lifespan=lifespan
)

@app.get("/health")
async def health():
    """Health check endpoint"""
    memory_info = get_memory_info()
    models_loaded = "pipeline" in MODEL_CACHE
    
    return {
        "status": "healthy" if models_loaded else "loading",
        "version": "2.1.0",
        "service": "sdxl-optimized",
        "models_loaded": models_loaded,
        "device": "cpu",
        "memory": memory_info
    }

@app.get("/model-status", response_model=ModelStatus)
async def get_model_status():
    """Get detailed model status"""
    if "pipeline" not in MODEL_CACHE:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    memory_info = get_memory_info()
    
    return ModelStatus(
        loaded=True,
        model_id=MODEL_CACHE["model_id"],
        device=MODEL_CACHE["device"],
        memory_usage=memory_info,
        optimizations=MODEL_CACHE.get("optimizations", {})
    )

@app.post("/generate", response_model=ImageResponse)
async def generate_image(request: ImageRequest, background_tasks: BackgroundTasks):
    """Generate image using optimized SDXL model"""
    
    if "pipeline" not in MODEL_CACHE:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        pipeline = MODEL_CACHE["pipeline"]
        
        # Set random seed
        generator = torch.Generator("cpu").manual_seed(request.seed) if request.seed is not None else None
        
        logger.info(f"Generating: '{request.prompt[:50]}...' ({request.width}x{request.height}, {request.steps} steps)")
        
        # Generate image with CPU optimization
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
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_memory)
        
        # Create metadata
        metadata = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt,
            "width": request.width,
            "height": request.height,
            "steps": request.steps,
            "guidance_scale": request.guidance_scale,
            "seed": request.seed,
            "model": MODEL_CACHE["model_id"],
            "device": "cpu",
            "optimizations": MODEL_CACHE.get("optimizations", {}),
            "format": "PNG",
            "inference_type": "cpu-optimized"
        }
        
        logger.info(f"✅ Generated successfully ({len(img_base64)} chars)")
        
        return ImageResponse(
            image=img_base64,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"❌ Generation failed: {e}")
        cleanup_memory()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/reload-model")
async def reload_model():
    """Reload the model (admin endpoint)"""
    global MODEL_CACHE
    
    logger.info("Reloading model...")
    MODEL_CACHE.clear()
    cleanup_memory()
    
    await load_optimized_model()
    
    return {"status": "success", "message": "Model reloaded"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    logger.info(f"Starting optimized SDXL service on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        access_log=True,
        log_level="info"
    )
