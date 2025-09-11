"""
GameForge Asset Generation Service - Simplified Version
FastAPI service f      # Initialize SDXL Pi          # Initialize SDXL Pipeline (lazy loading to avoid blocking server startup)
    print("🔧 SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")nitialize SDXL Pipeline (lazy loading to avoid blocking server startup)
    print("🔧 SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")
    
    yieldnitialize SDXL Pipeline (lazy loading to avoid blocking server startup)
    print("🔧 SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")ine (lazy loading to avoid blocking server startup)
    print("📝 SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")
    
    try:
        yield  # This is where the app runs
    except Exception as e:
        print(f"❌ Error during app execution: {e}")
        raise
    finally:
        # Cleanup
        print("🔄 Shutting down Asset Generation Service...")
        if redis_client:
            try:
                await redis_client.close()
            except Exception as e:
                print(f"⚠️ Error closing Redis connection: {e}")
        
        # Clear GPU memory
        if sdxl_pipeline and GPU_AVAILABLE:
            try:
                del sdxl_pipeline
                torch.cuda.empty_cache()
            except Exception as e:
                print(f"⚠️ Error clearing GPU memory: {e}")SDXL Pipeline (lazy loading to avoid blocking server startup)
    print("📝 SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")basic AI asset generation (without LoRA for now)
"""
import os
import asyncio
from typing import List, Optional, Dict, Any, Tuple, Union
from contextlib import asynccontextmanager
import base64
import io
import uuid
from datetime import datetime

import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import redis.asyncio as redis
import torch
from diffusers.pipelines.stable_diffusion_xl.pipeline_stable_diffusion_xl import StableDiffusionXLPipeline
from PIL import Image, ImageDraw, ImageFont
import json

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", "8000"))
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")
GPU_AVAILABLE = torch.cuda.is_available()
DEVICE = "cuda" if GPU_AVAILABLE else "cpu"

# Global state
redis_client = None
sdxl_pipeline = None

# Enhanced API Models with Examples
class SimpleAssetRequest(BaseModel):
    """🎨 Asset Generation Request"""
    prompt: str = Field(
        ...,
        description="🖼️ Creative prompt for your asset - be descriptive!",
        min_length=10,
        max_length=500
    )
    asset_type: str = Field(
        default="sprite", 
        description="🎯 Type of game asset: sprite, tileset, background, ui_element"
    )
    width: int = Field(
        default=512, 
        ge=64, 
        le=1024,
        description="📐 Image width in pixels (64-1024)"
    )
    height: int = Field(
        default=512, 
        ge=64, 
        le=1024,
        description="📐 Image height in pixels (64-1024)"
    )
    num_variants: int = Field(
        default=2, 
        ge=1, 
        le=4,
        description="🔢 Number of variations to generate (1-4)"
    )
    project_id: str = Field(
        ...,
        description="📁 Your project identifier"
    )
    user_id: str = Field(
        ...,
        description="👤 Your user identifier"
    )

    class Config:
        schema_extra = {
            "example": {
                "prompt": "medieval castle background, fantasy style, detailed architecture",
                "asset_type": "background", 
                "width": 1024,
                "height": 512,
                "num_variants": 2,
                "project_id": "rpg-game",
                "user_id": "gamedev123"
            }
        }

class SimpleAssetResponse(BaseModel):
    """✨ Asset Generation Response"""
    asset_id: str = Field(description="🆔 Unique asset identifier")
    request_id: str = Field(description="📋 Request tracking ID")
    status: str = Field(description="📊 Current status: queued, processing, completed, failed")
    image_urls: List[str] = Field(description="🖼️ Direct URLs to generated images")
    metadata: Dict[str, Any] = Field(description="📋 Additional asset information")
    created_at: datetime = Field(description="⏰ Generation timestamp")

class ImageMetadata(BaseModel):
    """📊 Detailed Image Information"""
    filename: str = Field(description="📄 Image filename")
    url: str = Field(description="🔗 Direct download URL")
    width: int = Field(description="📐 Image width")
    height: int = Field(description="📐 Image height")
    size_bytes: int = Field(description="💾 File size in bytes")
    prompt: str = Field(description="🎨 Original generation prompt")
    seed: Optional[int] = Field(description="🌱 Random seed used")
    generation_time: float = Field(description="⏱️ Time taken to generate")
    url: str
    width: int
    height: int
    size_bytes: int
    prompt: str
    seed: Optional[int]
    generation_time: float

class SimpleProgressUpdate(BaseModel):
    request_id: str
    status: str
    progress: float
    current_step: str
    error_message: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global redis_client, sdxl_pipeline
    
    print("🚀 Starting GameForge Asset Generation Service")
    print(f"🔧 Device: {DEVICE}")
    print(f"🎮 GPU Available: {GPU_AVAILABLE}")
    
    # Initialize Redis connection
    redis_client = redis.from_url(REDIS_URL)
    
    try:
        # Test Redis connection
        await redis_client.ping()
        print("✅ Redis connection established")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        print("📝 Service will work without Redis for testing")
    
    # Initialize SDXL Pipeline (lazy loading to avoid blocking server startup)
    print("� SDXL model will be loaded on first request")
    print("✅ Service ready to accept requests")
    
    yield
    
    # Cleanup
    print("🔄 Shutting down Asset Generation Service...")
    if redis_client:
        await redis_client.close()
    
    # Clear GPU memory
    if sdxl_pipeline and GPU_AVAILABLE:
        del sdxl_pipeline
        torch.cuda.empty_cache()

# Create FastAPI app
app = FastAPI(
    title="🎮 GameForge Asset Generation Service",
    description="""
    ## AI-Powered Game Asset Generation API

    Transform your game development with **Stable Diffusion XL**! Generate high-quality sprites, backgrounds, 
    UI elements, and tilesets using simple text prompts.

    ### 🚀 Features
    - **Real SDXL Generation**: Powered by Stable Diffusion XL for professional quality
    - **Multiple Asset Types**: Sprites, backgrounds, UI elements, tilesets
    - **Binary Streaming**: Optimized image delivery via URLs (no base64!)
    - **Batch Generation**: Create multiple variants in one request
    - **Real-time Progress**: WebSocket integration for live updates

    ### 🔗 Quick Start
    1. **Load Model**: `POST /load-model` (required first step)
    2. **Generate Assets**: `POST /generate` with your creative prompt
    3. **Check Status**: `GET /status/{request_id}` for progress
    4. **Download Images**: Access via returned URLs

    ### 💡 Pro Tips
    - Use descriptive prompts: "pixel art fantasy sword sprite, isolated on transparent background"
    - Specify style: "medieval", "sci-fi", "cartoon", "realistic"
    - Include quality keywords: "high quality", "detailed", "professional"
    
    ---
    *Built with ❤️ for game developers*
    """,
    version="2.0.0-sdxl",
    contact={
        "name": "GameForge Team",
        "url": "https://github.com/Sandmanmmm/ai-game-production-p",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving generated assets
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

async def publish_progress(update: SimpleProgressUpdate):
    """Publish progress update to Redis for WebSocket broadcast"""
    try:
        if redis_client:
            await redis_client.publish(
                f"asset_progress:{update.request_id}",
                update.json()
            )
            print(f"📡 Published progress: {update.current_step} ({update.progress:.0%})")
    except Exception as e:
        print(f"⚠️ Error publishing progress: {e}")

async def load_sdxl_pipeline():
    """Load SDXL pipeline on demand"""
    global sdxl_pipeline
    
    if sdxl_pipeline is not None:
        return sdxl_pipeline
    
    try:
        print("📥 Loading Stable Diffusion XL model...")
        if GPU_AVAILABLE:
            print("🎮 Using GPU acceleration")
            sdxl_pipeline = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16,
                use_safetensors=True,
                cache_dir=MODEL_CACHE_DIR
            ).to(DEVICE)
            
            # Memory optimizations
            sdxl_pipeline.enable_model_cpu_offload()
            sdxl_pipeline.enable_vae_slicing()
            sdxl_pipeline.enable_attention_slicing(1)
        else:
            print("💻 Using CPU (slower generation)")
            sdxl_pipeline = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float32,
                cache_dir=MODEL_CACHE_DIR
            )
        
        print("✅ SDXL pipeline loaded successfully")
        return sdxl_pipeline
        
    except Exception as e:
        print(f"⚠️ Failed to load SDXL model: {e}")
        print("📝 Falling back to placeholder generation")
        sdxl_pipeline = None
        return None

def generate_with_sdxl(prompt: str, negative_prompt: str, width: int, height: int, num_steps: int = 20, guidance_scale: float = 7.5, seed: Optional[int] = None) -> Image.Image:
    """Generate image using SDXL pipeline"""
    global sdxl_pipeline
    
    if not sdxl_pipeline:
        raise Exception("SDXL pipeline not loaded yet - use /health endpoint to check status")
    
    # Set up generator with seed
    generator = torch.Generator(device=DEVICE)
    if seed is not None:
        generator.manual_seed(seed)
    
    # Generate image
    with torch.autocast(DEVICE) if GPU_AVAILABLE else torch.no_grad():
        result = sdxl_pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_steps,
            guidance_scale=guidance_scale,
            generator=generator
        )
    
    # Extract image from result - SDXL returns a StableDiffusionXLPipelineOutput object
    try:
        # Try to access .images attribute (most common case)
        images = getattr(result, 'images', None)
        if images and len(images) > 0:
            image = images[0]
            if isinstance(image, Image.Image):
                return image
        
        # If that fails, result might be a tuple/list
        if isinstance(result, (tuple, list)) and len(result) > 0:
            first_item = result[0]
            if isinstance(first_item, Image.Image):
                return first_item
        
        # Fallback: create placeholder if all else fails
        print("⚠️ Could not extract image from SDXL result, using placeholder")
        return create_placeholder_image(width, height, "sprite", f"SDXL: {prompt}")
        
    except Exception as e:
        print(f"⚠️ Error extracting SDXL result: {e}, using placeholder")
        return create_placeholder_image(width, height, "sprite", f"Error: {prompt}")

def create_placeholder_image(width: int, height: int, asset_type: str, prompt: str) -> Image.Image:
    """Create a placeholder image for testing"""
    # Create image with colored background
    colors = {
        "sprite": (76, 175, 80),      # Green
        "tileset": (33, 150, 243),    # Blue
        "background": (255, 152, 0),   # Orange
        "ui_element": (156, 39, 176),  # Purple
        "icon": (244, 67, 54)         # Red
    }
    
    color: Tuple[int, int, int] = colors.get(asset_type, (96, 125, 139))  # Default blue-grey  
    image = Image.new('RGB', (width, height))
    # Fill with color
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, width, height], fill=color)
    
    # Add text
    try:
        # Try to use a font, fallback to default if not available
        font = ImageFont.load_default()
        text = f"{asset_type.title()}\n{prompt[:30]}"
        
        # Calculate text position
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Add text with outline for visibility
        for adj_x, adj_y in [(-1,-1), (-1,1), (1,-1), (1,1)]:
            draw.text((x+adj_x, y+adj_y), text, font=font, fill="black", anchor="lt")
        draw.text((x, y), text, font=font, fill="white", anchor="lt")
        
    except Exception as e:
        print(f"⚠️ Text rendering error: {e}")
    
    return image

def save_image(image: Image.Image, request_id: str, variant_index: int) -> tuple[str, str]:
    """Save image to disk and return filename and URL"""
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{request_id}_v{variant_index}_{timestamp}.png"
    filepath = os.path.join("assets", filename)
    
    # Ensure assets directory exists
    os.makedirs("assets", exist_ok=True)
    
    # Save image
    image.save(filepath, "PNG", optimize=True)
    
    # Return filename and URL
    url = f"/assets/{filename}"
    return filename, url

def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return base64.b64encode(buffer.getvalue()).decode()

async def generate_asset_variants(request: SimpleAssetRequest, request_id: str):
    """Generate asset variants using SDXL or placeholder"""
    try:
        # Progress: Starting
        await publish_progress(SimpleProgressUpdate(
            request_id=request_id,
            status="processing",
            progress=0.1,
            current_step="Starting asset generation"
        ))
        
        image_urls = []
        generation_method = "sdxl" if sdxl_pipeline else "placeholder"
        
        for i in range(request.num_variants):
            # Update progress
            progress = 0.2 + (0.7 * (i / request.num_variants))
            await publish_progress(SimpleProgressUpdate(
                request_id=request_id,
                status="processing",
                progress=progress,
                current_step=f"Generating variant {i+1}/{request.num_variants} using {generation_method.upper()}"
            ))
            
            if sdxl_pipeline:
                try:
                    # Use SDXL for real generation
                    image = generate_with_sdxl(
                        prompt=request.prompt,
                        negative_prompt=f"blurry, low quality, distorted, {request.asset_type}",
                        width=request.width,
                        height=request.height,
                        seed=hash(request.prompt + str(i)) % 2147483647  # Generate consistent seed
                    )
                    print(f"✅ Generated SDXL image {i+1}/{request.num_variants}")
                except Exception as e:
                    print(f"⚠️ SDXL generation failed for variant {i+1}: {e}")
                    # Fallback to placeholder
                    image = create_placeholder_image(
                        request.width, 
                        request.height, 
                        request.asset_type, 
                        f"SDXL Error: {request.prompt} - Variant {i+1}"
                    )
            else:
                # Use placeholder generation
                image = create_placeholder_image(
                    request.width, 
                    request.height, 
                    request.asset_type, 
                    f"{request.prompt} - Variant {i+1}"
                )
            
            # Save image to disk and get URL
            filename, url = save_image(image, request_id, i)
            image_urls.append(url)
            
            # Small delay to show progress (remove in production)
            await asyncio.sleep(0.1)
        
        # Save result
        response = SimpleAssetResponse(
            asset_id=str(uuid.uuid4()),
            request_id=request_id,
            status="completed",
            image_urls=image_urls,
            metadata={
                "prompt": request.prompt,
                "asset_type": request.asset_type,
                "width": request.width,
                "height": request.height,
                "num_variants": request.num_variants,
                "generation_method": generation_method,
                "device": DEVICE,
                "gpu_available": GPU_AVAILABLE
            },
            created_at=datetime.utcnow()
        )
        
        # Store in Redis
        if redis_client:
            await redis_client.set(
                f"asset_result:{request_id}",
                response.json(),
                ex=3600
            )
        
        # Final progress
        await publish_progress(SimpleProgressUpdate(
            request_id=request_id,
            status="completed",
            progress=1.0,
            current_step=f"Asset generation complete using {generation_method.upper()}"
        ))
        
        print(f"✅ Asset generation completed: {request_id} using {generation_method}")
        
    except Exception as e:
        await publish_progress(SimpleProgressUpdate(
            request_id=request_id,
            status="failed",
            progress=0.0,
            current_step="Generation failed",
            error_message=str(e)
        ))
        print(f"❌ Asset generation failed: {e}")

# API Routes
@app.get("/", 
         summary="🏠 Service Information",
         description="Get basic service information and current status",
         tags=["🔍 Service Info"])
async def root():
    """
    ## Service Overview
    
    Welcome to the GameForge Asset Generation Service! This endpoint provides:
    - Service status and version information
    - Current AI model loaded (SDXL vs placeholder)
    - Hardware capabilities (GPU/CPU mode)
    - Connection status to supporting services
    """
    return {
        "service": "🎮 GameForge Asset Generation Service",
        "version": "2.0.0-sdxl",
        "status": "🟢 running",
        "mode": "🤖 sdxl" if sdxl_pipeline else "🔧 placeholder",
        "device": DEVICE,
        "gpu_available": GPU_AVAILABLE,
        "model_loaded": "Stable Diffusion XL" if sdxl_pipeline else "None",
        "docs": "Visit /docs for full API documentation"
    }

@app.get("/health",
         summary="💚 Health Check",
         description="Comprehensive service health status including all dependencies",
         tags=["🔍 Service Info"])
async def health_check():
    """Health check endpoint"""
    redis_status = "connected"
    if redis_client:
        try:
            await redis_client.ping()
        except:
            redis_status = "disconnected"
    else:
        redis_status = "not_configured"
    
    return {
        "status": "healthy",
        "service": "asset-generation",
        "redis": redis_status,
        "generation_method": "sdxl" if sdxl_pipeline else "placeholder",
        "device": DEVICE,
        "gpu_available": GPU_AVAILABLE,
        "model_status": "loaded" if sdxl_pipeline else "not_loaded",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/load-model",
          summary="🚀 Load SDXL Model", 
          description="Initialize the Stable Diffusion XL pipeline for AI generation",
          tags=["🤖 AI Model Management"])
async def load_model():
    """
    ## Load AI Model
    
    **⚠️ Required First Step!** Before generating any assets, you must load the SDXL model.
    
    This endpoint will:
    - Download Stable Diffusion XL (10.3GB) if not cached
    - Initialize the AI pipeline on available hardware (GPU/CPU)
    - Enable real AI asset generation
    
    **Note:** This may take 5-10 minutes on first run for model download.
    """
    try:
        pipeline = await load_sdxl_pipeline()
        if pipeline:
            return {
                "status": "success",
                "message": "SDXL model loaded successfully",
                "model": "Stable Diffusion XL",
                "device": DEVICE
            }
        else:
            return {
                "status": "error",
                "message": "Failed to load SDXL model",
                "fallback": "placeholder generation"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error loading model: {str(e)}"
        }

@app.post("/generate", 
          response_model=SimpleAssetResponse,
          summary="🎨 Generate Game Assets",
          description="Create stunning game assets using AI-powered Stable Diffusion XL",
          tags=["🎮 Asset Generation"])
async def generate_assets(request: SimpleAssetRequest, background_tasks: BackgroundTasks):
    """
    ## 🚀 AI Asset Generation
    
    Transform your creative vision into professional game assets! This endpoint uses 
    **Stable Diffusion XL** to generate high-quality sprites, backgrounds, UI elements, and more.
    
    ### 🎯 Asset Types Supported:
    - **sprite**: Characters, items, objects
    - **background**: Landscapes, scenes, environments  
    - **tileset**: Repeatable patterns and textures
    - **ui_element**: Buttons, icons, interface components
    
    ### 💡 Prompt Tips:
    - Be descriptive: "medieval fantasy knight sprite with blue armor"
    - Include style keywords: "pixel art", "hand-drawn", "realistic", "cartoon"
    - Specify quality: "high quality", "detailed", "professional"
    - Mention background: "isolated", "transparent background", "white background"
    
    ### ⚡ Process:
    1. Request is queued immediately (returns `request_id`)
    2. Generation runs in background using SDXL
    3. Images saved as PNG files 
    4. Use `/status/{request_id}` to check progress
    5. Access final images via returned URLs
    
    **⏱️ Generation Time:** 30s-2min per variant (CPU), 5-15s per variant (GPU)
    """
    request_id = str(uuid.uuid4())
    
    print(f"📝 Asset generation request: {request.prompt} ({request.asset_type})")
    
    # Start generation in background
    background_tasks.add_task(generate_asset_variants, request, request_id)
    
    # Return immediate response
    return SimpleAssetResponse(
        asset_id="",  # Will be set when generation completes
        request_id=request_id,
        status="queued",
        image_urls=[],
        metadata={"prompt": request.prompt, "asset_type": request.asset_type},
        created_at=datetime.utcnow()
    )

@app.get("/status/{request_id}",
         summary="📊 Check Generation Status",
         description="Monitor your asset generation progress and retrieve results",
         tags=["🎮 Asset Generation"])
async def get_generation_status(request_id: str):
    """
    ## 📈 Generation Progress Tracking
    
    Check the status of your asset generation request using the `request_id` 
    returned from the `/generate` endpoint.
    
    ### 📋 Possible Status Values:
    - **queued**: Request received, waiting to start
    - **processing**: AI is actively generating your assets  
    - **completed**: ✅ Generation finished, images ready!
    - **failed**: ❌ Something went wrong, check error message
    
    ### 🎯 When Complete:
    The response will include:
    - Direct URLs to your generated images
    - Metadata about each asset (dimensions, generation time, etc.)
    - Asset ID for future reference
    
    **💡 Tip:** Poll this endpoint every 10-15 seconds until status is "completed"
    """
    if redis_client:
        try:
            result = await redis_client.get(f"asset_result:{request_id}")
            if result:
                return json.loads(result)
        except Exception as e:
            print(f"⚠️ Error retrieving result: {e}")
    
    return {
        "request_id": request_id,
        "status": "processing",
        "message": "Generation in progress or result not found"
    }

@app.get("/image/{filename}",
         summary="🖼️ Download Generated Image",
         description="Direct access to generated image files with proper caching headers",
         tags=["📁 File Access"])
async def serve_image(filename: str):
    """Serve generated image files"""
    filepath = os.path.join("assets", filename)
    if os.path.exists(filepath):
        return FileResponse(
            filepath, 
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f"inline; filename={filename}"
            }
        )
    else:
        raise HTTPException(status_code=404, detail="Image not found")

@app.get("/test")
async def test_generation():
    """Test endpoint to verify service works"""
    test_request = SimpleAssetRequest(
        prompt="test medieval sword",
        asset_type="sprite",
        width=256,
        height=256,
        num_variants=2,
        project_id="test_project",
        user_id="test_user"
    )
    
    # Generate immediately (not in background)
    request_id = str(uuid.uuid4())
    await generate_asset_variants(test_request, request_id)
    
    # Return result
    if redis_client:
        result = await redis_client.get(f"asset_result:{request_id}")
        if result:
            return json.loads(result)
    
    return {"message": "Test generation completed", "request_id": request_id}

if __name__ == "__main__":
    print("🎮 GameForge Asset Generation Service")
    print("📝 Simplified version for testing infrastructure")
    print("🔧 SDXL integration will be added in next iteration")
    print(f"🌐 Starting server on port {SERVICE_PORT}")
    
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=SERVICE_PORT,
        reload=True,
        log_level="info"
    )
