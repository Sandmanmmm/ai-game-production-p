# GameForge Enhanced Generation Engine - Main Application
# FastAPI server for production deployment

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import uvicorn

# Import our enhanced generation engine
from enhanced_generation_engine import (
    create_enhanced_engine,
    GenerationRequest,
    AssetType,
    QualityTier,
    GeneratedAsset
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GameForge Enhanced Generation Engine",
    description="Production-ready AI asset generation for game development",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instance
generation_engine = None

# Pydantic models for API
class GenerationRequestAPI(BaseModel):
    asset_type: str
    prompt: str
    quality_tier: str = "pc"
    style_reference: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    batch_size: int = 1
    variations: int = 1
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    priority: int = 5

class GenerationResponse(BaseModel):
    success: bool
    message: str
    assets: List[Dict[str, Any]]
    generation_time: float
    stats: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    details: Dict[str, Any]

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the generation engine on startup"""
    global generation_engine
    
    logger.info("🚀 Starting GameForge Enhanced Generation Engine...")
    
    try:
        # Configuration for production
        config = {
            "output_dir": os.getenv("OUTPUT_DIR", "./generated_assets"),
            "cache_dir": os.getenv("CACHE_DIR", "./asset_cache"),
            "max_workers": int(os.getenv("MAX_WORKERS", "4")),
            "storage": os.getenv("STORAGE_BACKEND", "local"),
        }
        
        # Create engine
        generation_engine = create_enhanced_engine(config)
        
        # Initialize models
        await generation_engine.initialize_models()
        
        logger.info("✅ Enhanced Generation Engine initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize generation engine: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down Enhanced Generation Engine...")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        if generation_engine:
            health_data = await generation_engine.health_check()
            return HealthResponse(
                status="healthy",
                details=health_data
            )
        else:
            return HealthResponse(
                status="unhealthy",
                details={"error": "Generation engine not initialized"}
            )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            details={"error": str(e)}
        )

# Asset generation endpoint
@app.post("/generate", response_model=GenerationResponse)
async def generate_assets(
    request: GenerationRequestAPI,
    background_tasks: BackgroundTasks
):
    """Generate assets based on request"""
    start_time = asyncio.get_event_loop().time()
    
    try:
        if not generation_engine:
            raise HTTPException(status_code=503, detail="Generation engine not available")
        
        # Convert API request to internal request
        generation_request = GenerationRequest(
            asset_type=AssetType(request.asset_type),
            prompt=request.prompt,
            quality_tier=QualityTier(request.quality_tier),
            style_reference=request.style_reference,
            parameters=request.parameters or {},
            batch_size=request.batch_size,
            variations=request.variations,
            user_id=request.user_id,
            project_id=request.project_id,
            priority=request.priority
        )
        
        logger.info(f"🎨 Generating {request.asset_type} assets: '{request.prompt}'")
        
        # Generate assets
        assets = await generation_engine.generate_asset(generation_request)
        
        # Convert to API response format
        asset_data = []
        for asset in assets:
            asset_data.append({
                "asset_id": asset.asset_id,
                "asset_type": asset.asset_type.value,
                "file_path": asset.file_path,
                "thumbnail_path": asset.thumbnail_path,
                "metadata": asset.metadata,
                "quality_metrics": asset.quality_metrics,
                "file_size": asset.file_size,
                "format": asset.format,
                "created_at": asset.created_at.isoformat()
            })
        
        # Get current stats
        stats = await generation_engine.get_generation_stats()
        
        generation_time = asyncio.get_event_loop().time() - start_time
        
        logger.info(f"✅ Generated {len(assets)} assets in {generation_time:.2f}s")
        
        return GenerationResponse(
            success=True,
            message=f"Successfully generated {len(assets)} assets",
            assets=asset_data,
            generation_time=generation_time,
            stats=stats
        )
        
    except ValueError as e:
        logger.error(f"❌ Invalid request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# Get asset file
@app.get("/assets/{asset_id}")
async def get_asset_file(asset_id: str, file_type: str = "main"):
    """Serve generated asset files"""
    try:
        if not generation_engine:
            raise HTTPException(status_code=503, detail="Generation engine not available")
        
        # Construct file path based on asset_id and file_type
        if file_type == "thumbnail":
            file_path = generation_engine.output_dir / f"{asset_id}_thumb.jpg"
        else:
            # Look for the main asset file
            possible_extensions = ['.png', '.jpg', '.obj', '.wav', '.gltf']
            file_path = None
            
            for ext in possible_extensions:
                potential_path = generation_engine.output_dir / f"{asset_id}_diffuse{ext}"
                if potential_path.exists():
                    file_path = potential_path
                    break
                    
                potential_path = generation_engine.output_dir / f"{asset_id}{ext}"
                if potential_path.exists():
                    file_path = potential_path
                    break
        
        if file_path and file_path.exists():
            return FileResponse(
                path=str(file_path),
                filename=file_path.name,
                media_type="application/octet-stream"
            )
        else:
            raise HTTPException(status_code=404, detail="Asset file not found")
            
    except Exception as e:
        logger.error(f"❌ Failed to serve asset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get generation statistics
@app.get("/stats")
async def get_stats():
    """Get generation engine statistics"""
    try:
        if not generation_engine:
            raise HTTPException(status_code=503, detail="Generation engine not available")
        
        stats = await generation_engine.get_generation_stats()
        return stats
        
    except Exception as e:
        logger.error(f"❌ Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# List supported asset types
@app.get("/asset-types")
async def get_asset_types():
    """Get list of supported asset types"""
    return {
        "asset_types": [asset_type.value for asset_type in AssetType],
        "quality_tiers": [tier.value for tier in QualityTier]
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "GameForge Enhanced Generation Engine",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "assets": "/assets/{asset_id}",
            "stats": "/stats",
            "asset_types": "/asset-types",
            "docs": "/docs"
        }
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "detail": str(exc)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "Check server logs"}
    )

# Main entry point
if __name__ == "__main__":
    # Configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8080"))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"🌟 Starting server on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        log_level=log_level,
        reload=False,  # Disable in production
        workers=1      # Single worker for now due to GPU limitations
    )
