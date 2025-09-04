# Job Processor - Handles async job execution
import asyncio
import logging
import json
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import redis.asyncio as redis

from config import Settings
from models import (
    GenerationRequest, StylePackRequest, JobInfo, JobStatus, JobProgress,
    GenerationResponse, StylePackResponse, GeneratedAsset
)
from ai_pipeline import AIPipeline
from storage import StorageManager

logger = logging.getLogger(__name__)

class JobProcessor:
    """Handles async job processing for asset generation and training"""
    
    def __init__(self, ai_pipeline: AIPipeline, storage_manager: StorageManager, redis_client: redis.Redis):
        self.ai_pipeline = ai_pipeline
        self.storage_manager = storage_manager
        self.redis_client = redis_client
        
        # Job tracking
        self.active_jobs: Dict[str, asyncio.Task] = {}
        self.job_queue = asyncio.Queue()
        
        # Worker settings
        self.max_concurrent_jobs = 2  # Limit concurrent GPU operations
        self.workers: List[asyncio.Task] = []
        self.running = False
        
        # Redis keys
        self.job_key_prefix = "job:"
        self.job_result_prefix = "result:"
        self.job_list_key = "jobs:list"
    
    async def start(self):
        """Start job processing workers"""
        if self.running:
            return
        
        self.running = True
        logger.info(f"🚀 Starting {self.max_concurrent_jobs} job workers...")
        
        # Start worker tasks
        for i in range(self.max_concurrent_jobs):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        logger.info("✅ Job processor started")
    
    async def stop(self):
        """Stop job processing"""
        if not self.running:
            return
        
        logger.info("🛑 Stopping job processor...")
        self.running = False
        
        # Cancel all workers
        for worker in self.workers:
            worker.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        
        # Cancel active jobs
        for job_id, task in self.active_jobs.items():
            task.cancel()
            await self._update_job_status(job_id, JobStatus.CANCELLED)
        
        self.workers.clear()
        self.active_jobs.clear()
        
        logger.info("✅ Job processor stopped")
    
    async def _worker(self, worker_name: str):
        """Worker that processes jobs from the queue"""
        logger.info(f"👷 Worker {worker_name} started")
        
        try:
            while self.running:
                try:
                    # Get job from queue (wait max 1 second)
                    job_data = await asyncio.wait_for(self.job_queue.get(), timeout=1.0)
                    
                    job_id = job_data["job_id"]
                    job_type = job_data["type"]
                    
                    logger.info(f"🎯 Worker {worker_name} processing job {job_id} ({job_type})")
                    
                    # Update job status
                    await self._update_job_status(job_id, JobStatus.PROCESSING)
                    
                    try:
                        # Process based on job type
                        if job_type == "generation":
                            await self._process_generation_job(job_id, job_data["request"])
                        elif job_type == "training":
                            await self._process_training_job(job_id, job_data["request"])
                        else:
                            raise ValueError(f"Unknown job type: {job_type}")
                        
                        # Mark as completed
                        await self._update_job_status(job_id, JobStatus.COMPLETED)
                        logger.info(f"✅ Job {job_id} completed by {worker_name}")
                        
                    except Exception as e:
                        logger.error(f"❌ Job {job_id} failed: {e}")
                        await self._update_job_status(job_id, JobStatus.FAILED, error=str(e))
                    
                    finally:
                        # Remove from active jobs
                        if job_id in self.active_jobs:
                            del self.active_jobs[job_id]
                        
                        # Mark queue task as done
                        self.job_queue.task_done()
                        
                except asyncio.TimeoutError:
                    # No job available, continue loop
                    continue
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Worker {worker_name} error: {e}")
                    await asyncio.sleep(1)
        
        except asyncio.CancelledError:
            pass
        
        logger.info(f"👋 Worker {worker_name} stopped")
    
    async def submit_generation_job(self, request: GenerationRequest) -> str:
        """Submit asset generation job"""
        job_id = str(uuid.uuid4())
        
        # Store job info
        job_info = JobInfo(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.now()
        )
        
        await self._store_job_info(job_id, job_info)
        
        # Add to processing queue
        job_data = {
            "job_id": job_id,
            "type": "generation",
            "request": request
        }
        
        await self.job_queue.put(job_data)
        
        # Track active job
        task = asyncio.create_task(self._track_job(job_id))
        self.active_jobs[job_id] = task
        
        logger.info(f"📝 Generation job submitted: {job_id}")
        return job_id
    
    async def submit_training_job(self, request: StylePackRequest) -> str:
        """Submit style pack training job"""
        job_id = str(uuid.uuid4())
        
        # Store job info
        job_info = JobInfo(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.now()
        )
        
        await self._store_job_info(job_id, job_info)
        
        # Add to processing queue
        job_data = {
            "job_id": job_id,
            "type": "training",
            "request": request
        }
        
        await self.job_queue.put(job_data)
        
        # Track active job
        task = asyncio.create_task(self._track_job(job_id))
        self.active_jobs[job_id] = task
        
        logger.info(f"📝 Training job submitted: {job_id}")
        return job_id
    
    async def _process_generation_job(self, job_id: str, request: GenerationRequest):
        """Process asset generation job"""
        try:
            logger.info(f"🎨 Processing generation job {job_id}")
            
            # Update progress
            await self._update_progress(job_id, 10, "Loading model...", 1, 4)
            
            # Ensure correct model is loaded
            if request.model_id and request.model_id != self.ai_pipeline.current_model_id:
                await self.ai_pipeline.load_model(request.model_id)
            
            # Update progress
            await self._update_progress(job_id, 30, "Generating assets...", 2, 4)
            
            # Generate assets
            assets = await self.ai_pipeline.generate_assets(request)
            
            # Update progress
            await self._update_progress(job_id, 70, "Saving assets...", 3, 4)
            
            # Save assets to storage
            saved_assets = []
            for asset in assets:
                # Save the image
                saved_asset = await self.storage_manager.save_generated_asset(asset)
                saved_assets.append(saved_asset)
            
            # Update progress
            await self._update_progress(job_id, 100, "Completed", 4, 4)
            
            # Create response
            response = GenerationResponse(
                request_id=request.request_id,
                status="completed",
                assets=saved_assets,
                total_generated=len(saved_assets),
                successful=len(saved_assets),
                failed=0,
                total_processing_time=sum(asset.processing_time for asset in saved_assets)
            )
            
            # Store results
            await self._store_job_results(job_id, response.dict())
            
            logger.info(f"✅ Generation job {job_id} completed - {len(saved_assets)} assets")
            
        except Exception as e:
            logger.error(f"❌ Generation job {job_id} failed: {e}")
            raise
    
    async def _process_training_job(self, job_id: str, request: StylePackRequest):
        """Process style pack training job"""
        try:
            logger.info(f"🎭 Processing training job {job_id}")
            
            # Update progress
            await self._update_progress(job_id, 10, "Preparing training data...", 1, 5)
            
            # This is a placeholder for actual LoRA training implementation
            # In a real implementation, this would:
            # 1. Download/validate reference images
            # 2. Preprocess images
            # 3. Set up LoRA training pipeline
            # 4. Train the model
            # 5. Save the trained weights
            
            await asyncio.sleep(2)  # Simulate preparation
            
            # Update progress
            await self._update_progress(job_id, 30, "Training LoRA model...", 2, 5)
            
            # Simulate training steps
            training_steps = request.training_steps
            for step in range(0, training_steps, max(1, training_steps // 10)):
                if not self.running:  # Check if cancelled
                    raise asyncio.CancelledError()
                
                progress = 30 + (step / training_steps) * 50
                await self._update_progress(
                    job_id, 
                    progress, 
                    f"Training step {step}/{training_steps}",
                    step, 
                    training_steps
                )
                await asyncio.sleep(0.1)  # Simulate training time
            
            # Update progress
            await self._update_progress(job_id, 85, "Saving model...", 4, 5)
            
            # Create placeholder response
            style_pack_id = str(uuid.uuid4())
            response = StylePackResponse(
                style_pack_id=style_pack_id,
                name=request.name,
                status="completed",
                model_path=f"/models/lora/{style_pack_id}.safetensors",
                checkpoint_path=f"/models/lora/{style_pack_id}_checkpoint.safetensors",
                final_loss=0.15,  # Placeholder
                training_time=300.0,  # Placeholder
                preview_images=[]  # Would contain preview image URLs
            )
            
            # Update progress
            await self._update_progress(job_id, 100, "Training completed", 5, 5)
            
            # Store results
            await self._store_job_results(job_id, response.dict())
            
            logger.info(f"✅ Training job {job_id} completed - Style pack: {request.name}")
            
        except Exception as e:
            logger.error(f"❌ Training job {job_id} failed: {e}")
            raise
    
    async def _track_job(self, job_id: str):
        """Track job execution (placeholder for more sophisticated tracking)"""
        try:
            while job_id in self.active_jobs:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass
    
    async def get_job_status(self, job_id: str) -> Optional[JobInfo]:
        """Get job status"""
        try:
            job_data = await self.redis_client.get(f"{self.job_key_prefix}{job_id}")
            if not job_data:
                return None
            
            job_info_dict = json.loads(job_data)
            return JobInfo(**job_info_dict)
            
        except Exception as e:
            logger.error(f"Failed to get job status {job_id}: {e}")
            return None
    
    async def get_job_results(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job results"""
        try:
            result_data = await self.redis_client.get(f"{self.job_result_prefix}{job_id}")
            if not result_data:
                return None
            
            return json.loads(result_data)
            
        except Exception as e:
            logger.error(f"Failed to get job results {job_id}: {e}")
            return None
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a job"""
        try:
            # Cancel active task if exists
            if job_id in self.active_jobs:
                task = self.active_jobs[job_id]
                task.cancel()
                
                # Update status
                await self._update_job_status(job_id, JobStatus.CANCELLED)
                
                logger.info(f"🚫 Job {job_id} cancelled")
                return True
            
            # Check if job exists and is pending
            job_info = await self.get_job_status(job_id)
            if job_info and job_info.status == JobStatus.PENDING:
                await self._update_job_status(job_id, JobStatus.CANCELLED)
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel job {job_id}: {e}")
            return False
    
    async def list_jobs(
        self, 
        status: Optional[JobStatus] = None, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[JobInfo]:
        """List jobs with optional filtering"""
        try:
            # Get all job IDs
            job_ids = await self.redis_client.lrange(self.job_list_key, 0, -1)
            
            jobs = []
            for job_id in job_ids[offset:offset + limit]:
                job_info = await self.get_job_status(job_id)
                if job_info:
                    if status is None or job_info.status == status:
                        jobs.append(job_info)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to list jobs: {e}")
            return []
    
    async def _store_job_info(self, job_id: str, job_info: JobInfo):
        """Store job information in Redis"""
        try:
            # Store job info
            await self.redis_client.set(
                f"{self.job_key_prefix}{job_id}",
                json.dumps(job_info.dict(), default=str),
                ex=86400  # Expire after 24 hours
            )
            
            # Add to job list
            await self.redis_client.lpush(self.job_list_key, job_id)
            
            # Limit job list size
            await self.redis_client.ltrim(self.job_list_key, 0, 999)
            
        except Exception as e:
            logger.error(f"Failed to store job info {job_id}: {e}")
    
    async def _update_job_status(self, job_id: str, status: JobStatus, error: Optional[str] = None):
        """Update job status"""
        try:
            job_info = await self.get_job_status(job_id)
            if not job_info:
                return
            
            job_info.status = status
            
            if status == JobStatus.PROCESSING and not job_info.started_at:
                job_info.started_at = datetime.now()
            elif status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                job_info.completed_at = datetime.now()
            
            if error:
                job_info.error = error
            
            await self._store_job_info(job_id, job_info)
            
        except Exception as e:
            logger.error(f"Failed to update job status {job_id}: {e}")
    
    async def _update_progress(
        self, 
        job_id: str, 
        percentage: float, 
        message: str,
        current_step: Optional[int] = None,
        total_steps: Optional[int] = None
    ):
        """Update job progress"""
        try:
            job_info = await self.get_job_status(job_id)
            if not job_info:
                return
            
            progress = JobProgress(
                percentage=percentage,
                stage="processing",
                message=message,
                current_step=current_step,
                total_steps=total_steps
            )
            
            job_info.progress = progress
            await self._store_job_info(job_id, job_info)
            
        except Exception as e:
            logger.error(f"Failed to update job progress {job_id}: {e}")
    
    async def _store_job_results(self, job_id: str, results: Dict[str, Any]):
        """Store job results"""
        try:
            await self.redis_client.set(
                f"{self.job_result_prefix}{job_id}",
                json.dumps(results, default=str),
                ex=86400  # Expire after 24 hours
            )
            
        except Exception as e:
            logger.error(f"Failed to store job results {job_id}: {e}")
