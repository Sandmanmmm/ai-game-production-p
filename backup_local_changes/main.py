# FastAPI Asset Generation Service
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import asyncio
import logging
import os
from typing import List, Optional, Dict, Any
import redis.asyncio as redis
import json
from datetime import datetime

from config import Settings
from models import (
    GenerationRequest, GenerationResponse, StylePackRequest, StylePackResponse,
    JobInfo, JobStatus, HealthResponse, ModelInfo, GeneratedAsset
)
from ai_pipeline import AIPipeline
from job_processor import JobProcessor
from storage import StorageManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
settings = Settings()
ai_pipeline: Optional[AIPipeline] = None
job_processor: Optional[JobProcessor] = None
storage_manager: Optional[StorageManager] = None
redis_client: Optional[redis.Redis] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global ai_pipeline, job_processor, storage_manager, redis_client
    
    try:
        logger.info("🚀 Starting Asset Generation Service...")
        
        # Initialize Redis connection
        redis_client = redis.from_url(
            f"redis://{settings.redis_host}:{settings.redis_port}",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("✅ Redis connected")
        
        # Initialize storage manager
        storage_manager = StorageManager(settings)
        await storage_manager.initialize()
        logger.info("✅ Storage manager initialized")
        
        # Initialize AI pipeline
        ai_pipeline = AIPipeline(settings)
        await ai_pipeline.initialize()
        logger.info("✅ AI pipeline initialized")
        
        # Initialize job processor
        job_processor = JobProcessor(ai_pipeline, storage_manager, redis_client)
        await job_processor.start()
        logger.info("✅ Job processor started")
        
        logger.info("🎮 Asset Generation Service ready!")
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    finally:
        # Cleanup
        logger.info("🔄 Shutting down Asset Generation Service...")
        
        if job_processor:
            await job_processor.stop()
            
        if ai_pipeline:
            await ai_pipeline.cleanup()
            
        if redis_client:
            await redis_client.close()
            
        logger.info("👋 Asset Generation Service stopped")

# Create FastAPI app
app = FastAPI(
    title="GameForge Asset Generation Service",
    description="AI-powered game asset generation with SDXL and LoRA",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health"""
    try:
        # Check Redis
        redis_connected = False
        if redis_client:
            try:
                await redis_client.ping()
                redis_connected = True
            except:
                pass
        
        # Check AI pipeline
        models_loaded = ai_pipeline is not None and ai_pipeline.is_ready()
        gpu_available = ai_pipeline.gpu_available if ai_pipeline else False
        
        # Get memory usage
        memory_usage = None
        if ai_pipeline:
            memory_usage = ai_pipeline.get_memory_usage()
        
        return HealthResponse(
            models_loaded=models_loaded,
            gpu_available=gpu_available,
            memory_usage=memory_usage,
            redis_connected=redis_connected,
            storage_accessible=storage_manager is not None and await storage_manager.health_check()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")

# Generate assets endpoint
@app.post("/generate", response_model=Dict[str, str])
async def generate_assets(request: GenerationRequest, background_tasks: BackgroundTasks):
    """Generate game assets"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        # Submit job to processor
        job_id = await job_processor.submit_generation_job(request)
        
        logger.info(f"🎨 Generation job submitted: {job_id}")
        
        return {
            "job_id": job_id,
            "status": "submitted",
            "message": "Asset generation job submitted successfully"
        }
        
    except Exception as e:
        logger.error(f"Generation request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Train style pack endpoint
@app.post("/train-style", response_model=Dict[str, str])
async def train_style_pack(request: StylePackRequest, background_tasks: BackgroundTasks):
    """Train a custom style pack (LoRA)"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        # Submit training job
        job_id = await job_processor.submit_training_job(request)
        
        logger.info(f"🎭 Style training job submitted: {job_id}")
        
        return {
            "job_id": job_id,
            "status": "submitted",
            "message": "Style pack training job submitted successfully"
        }
        
    except Exception as e:
        logger.error(f"Style training request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Job status endpoint
@app.get("/job/{job_id}", response_model=JobInfo)
async def get_job_status(job_id: str):
    """Get job status and progress"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        job_info = await job_processor.get_job_status(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return job_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Job results endpoint
@app.get("/job/{job_id}/results")
async def get_job_results(job_id: str):
    """Get job results"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        results = await job_processor.get_job_results(job_id)
        if not results:
            raise HTTPException(status_code=404, detail="Job results not found")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Cancel job endpoint
@app.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running job"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        success = await job_processor.cancel_job(job_id)
        if not success:
            raise HTTPException(status_code=404, detail="Job not found or cannot be cancelled")
        
        return {"message": "Job cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# List jobs endpoint
@app.get("/jobs")
async def list_jobs(
    status: Optional[JobStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """List jobs with optional filtering"""
    try:
        if not job_processor:
            raise HTTPException(status_code=503, detail="Service not ready")
        
        jobs = await job_processor.list_jobs(status=status, limit=limit, offset=offset)
        return {"jobs": jobs}
        
    except Exception as e:
        logger.error(f"Failed to list jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get model info endpoint
@app.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get information about loaded models"""
    try:
        if not ai_pipeline:
            raise HTTPException(status_code=503, detail="AI pipeline not ready")
        
        models = ai_pipeline.get_model_info()
        return models
        
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Load model endpoint
@app.post("/models/load")
async def load_model(model_id: str, model_type: str = "sdxl"):
    """Load a specific model"""
    try:
        if not ai_pipeline:
            raise HTTPException(status_code=503, detail="AI pipeline not ready")
        
        success = await ai_pipeline.load_model(model_id, model_type)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to load model")
        
        return {"message": f"Model {model_id} loaded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Unload model endpoint
@app.delete("/models/{model_id}")
async def unload_model(model_id: str):
    """Unload a specific model"""
    try:
        if not ai_pipeline:
            raise HTTPException(status_code=503, detail="AI pipeline not ready")
        
        success = await ai_pipeline.unload_model(model_id)
        if not success:
            raise HTTPException(status_code=404, detail="Model not found or cannot be unloaded")
        
        return {"message": f"Model {model_id} unloaded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unload model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Asset download endpoint
@app.get("/assets/{asset_id}")
async def download_asset(asset_id: str):
    """Download a generated asset"""
    try:
        if not storage_manager:
            raise HTTPException(status_code=503, detail="Storage not ready")
        
        file_path = await storage_manager.get_asset_path(asset_id)
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return FileResponse(
            file_path,
            media_type="application/octet-stream",
            filename=os.path.basename(file_path)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download asset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Upload reference images endpoint
@app.post("/upload-references")
async def upload_reference_images(files: List[UploadFile] = File(...)):
    """Upload reference images for style training"""
    try:
        if not storage_manager:
            raise HTTPException(status_code=503, detail="Storage not ready")
        
        uploaded_files = []
        for file in files:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}")
            
            # Save file
            file_path = await storage_manager.save_reference_image(file)
            uploaded_files.append({
                "filename": file.filename,
                "path": file_path,
                "size": file.size
            })
        
        return {
            "message": f"Uploaded {len(uploaded_files)} reference images",
            "files": uploaded_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload reference images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=1  # Single worker for GPU operations
    )
