"""
GameForge SDXL Image Generation Service
GPU-enabled FastAPI service for Stable Diffusion XL image generation
"""

import os
import sys
import torch
import logging
from typing import Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from diffusers import StableDiffusionXLPipeline
import io
import base64
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GameForge SDXL Service",
    description="GPU-accelerated Stable Diffusion XL image generation service",
    version="1.0.0"
)

# Global variables for pipeline
pipeline = None
device = None

# Request models
class ImageGenerationRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    width: int = 1024
    height: int = 1024
    num_inference_steps: int = 20
    guidance_scale: float = 7.5
    seed: Optional[int] = None

class ImageGenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    error: Optional[str] = None
    metadata: dict = {}

def initialize_pipeline():
    """Initialize the SDXL pipeline with GPU support"""
    global pipeline, device
    
    try:
        # Check CUDA availability
        if torch.cuda.is_available():
            device = "cuda"
            logger.info(f"CUDA available. Using GPU: {torch.cuda.get_device_name()}")
        else:
            device = "cpu"
            logger.warning("CUDA not available. Using CPU (will be slow)")
        
        # Model path - can be local or HuggingFace model ID
        model_path = os.getenv("MODEL_PATH", "/app/models/stable-diffusion-xl-base-1.0")
        
        # Try to load local model first, fallback to HuggingFace
        if os.path.exists(model_path):
            logger.info(f"Loading local model from: {model_path}")
            pipeline = StableDiffusionXLPipeline.from_pretrained(
                model_path,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                use_safetensors=True,
                variant="fp16" if device == "cuda" else None
            )
        else:
            logger.info("Loading model from HuggingFace Hub")
            pipeline = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                use_safetensors=True,
                variant="fp16" if device == "cuda" else None
            )
        
        # Move pipeline to device
        pipeline = pipeline.to(device)
        
        # Enable memory efficient attention if using GPU
        if device == "cuda":
            try:
                pipeline.enable_xformers_memory_efficient_attention()
                logger.info("XFormers memory efficient attention enabled")
            except Exception as e:
                logger.warning(f"Could not enable XFormers: {e}")
        
        logger.info("SDXL Pipeline initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize pipeline: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Initialize the pipeline when the service starts"""
    logger.info("Starting GameForge SDXL Service...")
    success = initialize_pipeline()
    if not success:
        logger.error("Failed to initialize SDXL pipeline")
        sys.exit(1)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GameForge SDXL Service", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global pipeline, device
    
    status = {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "device": device,
        "cuda_available": torch.cuda.is_available()
    }
    
    if torch.cuda.is_available():
        status["gpu_memory"] = {
            "allocated": torch.cuda.memory_allocated(),
            "reserved": torch.cuda.memory_reserved()
        }
    
    return status

@app.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate an image using SDXL"""
    global pipeline
    
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        logger.info(f"Generating image with prompt: {request.prompt[:50]}...")
        
        # Set seed for reproducibility
        if request.seed is not None:
            torch.manual_seed(request.seed)
        
        # Generate image
        with torch.autocast(device):
            image = pipeline(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
            ).images[0]
        
        # Convert image to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        logger.info("Image generated successfully")
        
        return ImageGenerationResponse(
            success=True,
            image_base64=image_base64,
            metadata={
                "width": request.width,
                "height": request.height,
                "steps": request.num_inference_steps,
                "guidance_scale": request.guidance_scale,
                "seed": request.seed,
                "device": device
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return ImageGenerationResponse(
            success=False,
            error=str(e)
        )

@app.get("/models")
async def list_models():
    """List available models"""
    models = []
    model_path = os.getenv("MODEL_PATH", "/app/models")
    
    if os.path.exists(model_path):
        for item in os.listdir(model_path):
            if os.path.isdir(os.path.join(model_path, item)):
                models.append(item)
    
    return {"models": models, "default": "stable-diffusion-xl-base-1.0"}

@app.get("/status")
async def get_status():
    """Get detailed service status"""
    global pipeline, device
    
    return {
        "service": "GameForge SDXL",
        "version": "1.0.0",
        "pipeline_loaded": pipeline is not None,
        "device": device,
        "cuda_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "model_path": os.getenv("MODEL_PATH", "/app/models")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
