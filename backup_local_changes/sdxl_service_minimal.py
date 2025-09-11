"""
GameForge SDXL Minimal Service - Quick Deploy Version
Lightweight FastAPI service for testing ECS deployment
"""

import os
import logging
from typing import Optional
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64
import io
from PIL import Image, ImageDraw

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GameForge SDXL Minimal Service",
    description="Lightweight test service for ECS deployment",
    version="1.0.0"
)

# Request models
class ImageGenerationRequest(BaseModel):
    prompt: str
    width: int = 512
    height: int = 512

class ImageGenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    error: Optional[str] = None
    metadata: dict = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GameForge SDXL Minimal Service", 
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "GameForge SDXL Minimal",
        "version": "1.0.0"
    }

@app.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate a placeholder image (for testing deployment)"""
    try:
        logger.info(f"Generating placeholder image: {request.prompt[:50]}...")
        
        # Create a simple placeholder image
        image = Image.new('RGB', (request.width, request.height), color='lightblue')
        draw = ImageDraw.Draw(image)
        
        # Add text to the image
        text = f"Prompt: {request.prompt[:30]}..."
        draw.text((10, 10), text, fill='darkblue')
        draw.text((10, 30), f"Size: {request.width}x{request.height}", fill='darkblue')
        draw.text((10, 50), "SDXL Service Ready", fill='darkgreen')
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        logger.info("Placeholder image generated successfully")
        
        return ImageGenerationResponse(
            success=True,
            image_base64=image_base64,
            metadata={
                "width": request.width,
                "height": request.height,
                "type": "placeholder",
                "service": "minimal"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return ImageGenerationResponse(
            success=False,
            error=str(e)
        )

@app.get("/status")
async def get_status():
    """Get service status"""
    return {
        "service": "GameForge SDXL Minimal",
        "version": "1.0.0",
        "status": "running",
        "deployment": "test",
        "ready": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
