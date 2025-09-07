# Enhanced AI Pipeline with GPU Memory Management
# Phase 1: Core Engine Stabilization - GPU Memory Leak Fixes

import torch
import gc
import logging
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import asyncio
import time
from datetime import datetime
import numpy as np
from PIL import Image
import io
import json
import weakref
from contextlib import contextmanager
import threading
import psutil

# Diffusers imports
from diffusers import (
    DiffusionPipeline,
    StableDiffusionXLPipeline,
    StableDiffusionXLImg2ImgPipeline,
    AutoPipelineForText2Image,
    DPMSolverMultistepScheduler,
    EulerAncestralDiscreteScheduler,
    DDIMScheduler
)
from diffusers.utils import load_image
from peft import PeftModel, LoraConfig, get_peft_model

# Transformers
from transformers import CLIPTokenizer, CLIPTextModel

from config import Settings
from models import GenerationRequest, GeneratedAsset, ModelInfo, AssetType, StyleType

logger = logging.getLogger(__name__)

class GPUMemoryMonitor:
    """Advanced GPU memory monitoring and management"""
    
    def __init__(self):
        self.peak_memory = 0
        self.allocations = []
        self.memory_threshold = 0.9  # 90% threshold
        self.cleanup_threshold = 0.8  # 80% cleanup threshold
        self.lock = threading.Lock()
        
    def get_memory_stats(self) -> Dict[str, float]:
        """Get current GPU memory statistics"""
        if not torch.cuda.is_available():
            return {"available": 0, "used": 0, "total": 0, "percentage": 0}
        
        allocated = torch.cuda.memory_allocated() / 1024**3  # GB
        reserved = torch.cuda.memory_reserved() / 1024**3   # GB
        total = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
        
        return {
            "allocated_gb": round(allocated, 2),
            "reserved_gb": round(reserved, 2),
            "total_gb": round(total, 2),
            "usage_percentage": round((allocated / total) * 100, 1),
            "peak_gb": round(self.peak_memory / 1024**3, 2)
        }
    
    def check_memory_pressure(self) -> bool:
        """Check if memory pressure is high"""
        if not torch.cuda.is_available():
            return False
            
        stats = self.get_memory_stats()
        return stats["usage_percentage"] > (self.memory_threshold * 100)
    
    def force_cleanup(self):
        """Force aggressive memory cleanup"""
        with self.lock:
            logger.warning("🧹 Forcing GPU memory cleanup due to pressure")
            
            # Clear CUDA cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            
            # Force garbage collection
            gc.collect()
            
            # Log memory stats after cleanup
            stats = self.get_memory_stats()
            logger.info(f"📊 Memory after cleanup: {stats['usage_percentage']}% used")

    @contextmanager
    def monitor_memory(self, operation_name: str):
        """Context manager to monitor memory usage during operations"""
        if not torch.cuda.is_available():
            yield
            return
            
        start_memory = torch.cuda.memory_allocated()
        start_time = time.time()
        
        try:
            yield
        finally:
            end_memory = torch.cuda.memory_allocated()
            end_time = time.time()
            
            memory_diff = (end_memory - start_memory) / 1024**2  # MB
            duration = end_time - start_time
            
            logger.info(f"🧠 {operation_name}: {memory_diff:+.1f}MB in {duration:.2f}s")
            
            # Update peak memory
            current_memory = torch.cuda.memory_allocated()
            if current_memory > self.peak_memory:
                self.peak_memory = current_memory
            
            # Check for memory pressure
            if self.check_memory_pressure():
                logger.warning(f"⚠️ High memory pressure after {operation_name}")

class EnhancedModelCache:
    """Enhanced model caching with memory pressure management"""
    
    def __init__(self, max_models: int = 2, memory_monitor: GPUMemoryMonitor = None):
        self.cache: Dict[str, Any] = {}
        self.usage_times: Dict[str, datetime] = {}
        self.memory_sizes: Dict[str, int] = {}  # Track memory usage per model
        self.max_models = max_models
        self.memory_monitor = memory_monitor or GPUMemoryMonitor()
        self.lock = threading.Lock()
    
    def get(self, model_id: str) -> Optional[Any]:
        """Get model from cache with memory check"""
        with self.lock:
            if model_id in self.cache:
                self.usage_times[model_id] = datetime.now()
                logger.debug(f"🎯 Cache hit for model: {model_id}")
                return self.cache[model_id]
            
            logger.debug(f"🔍 Cache miss for model: {model_id}")
            return None
    
    def put(self, model_id: str, model: Any):
        """Add model to cache with intelligent eviction"""
        with self.lock:
            # Measure model memory footprint
            start_memory = torch.cuda.memory_allocated() if torch.cuda.is_available() else 0
            
            # Check if we need to evict models first
            self._ensure_cache_space()
            
            # Add to cache
            self.cache[model_id] = model
            self.usage_times[model_id] = datetime.now()
            
            # Track memory usage
            if torch.cuda.is_available():
                memory_used = torch.cuda.memory_allocated() - start_memory
                self.memory_sizes[model_id] = memory_used
                logger.info(f"🧠 Cached model {model_id}: {memory_used / 1024**2:.1f}MB")
            
    def _ensure_cache_space(self):
        """Ensure we have space in cache, evicting if necessary"""
        # Check memory pressure first
        if self.memory_monitor.check_memory_pressure():
            logger.warning("⚠️ High memory pressure - performing aggressive eviction")
            self._evict_all_except_newest()
            return
        
        # Normal LRU eviction
        while len(self.cache) >= self.max_models:
            oldest_id = min(self.usage_times.keys(), key=lambda k: self.usage_times[k])
            self._evict(oldest_id)
    
    def _evict(self, model_id: str):
        """Evict specific model with proper cleanup"""
        if model_id in self.cache:
            memory_freed = self.memory_sizes.get(model_id, 0)
            
            # Remove references
            del self.cache[model_id]
            del self.usage_times[model_id]
            if model_id in self.memory_sizes:
                del self.memory_sizes[model_id]
            
            # Force cleanup
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info(f"🗑️ Evicted model {model_id}: freed {memory_freed / 1024**2:.1f}MB")
    
    def _evict_all_except_newest(self):
        """Emergency eviction - keep only the most recently used model"""
        if not self.cache:
            return
            
        # Find the newest model
        newest_id = max(self.usage_times.keys(), key=lambda k: self.usage_times[k])
        
        # Evict all others
        to_evict = [mid for mid in self.cache.keys() if mid != newest_id]
        for model_id in to_evict:
            self._evict(model_id)
        
        # Force aggressive cleanup
        self.memory_monitor.force_cleanup()
    
    def clear(self):
        """Clear all cached models"""
        with self.lock:
            self.cache.clear()
            self.usage_times.clear()
            self.memory_sizes.clear()
            
            # Aggressive cleanup
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            
            logger.info("🧹 Cleared all cached models")

class EnhancedAIPipeline:
    """Enhanced AI Pipeline with proper memory management"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.device = self._get_device()
        self.dtype = torch.float16 if self.device.type == "cuda" else torch.float32
        
        # Enhanced memory management
        self.memory_monitor = GPUMemoryMonitor()
        self.model_cache = EnhancedModelCache(
            max_models=settings.max_cached_models, 
            memory_monitor=self.memory_monitor
        )
        
        # Pipeline management
        self.current_pipeline: Optional[DiffusionPipeline] = None
        self.current_model_id: str = ""
        
        # LoRA management with cleanup
        self.lora_cache: Dict[str, Any] = {}
        self.active_loras: List[str] = []
        
        # Performance tracking
        self.generation_count = 0
        self.total_time = 0.0
        self.error_count = 0
        
        # Background cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
        
        logger.info(f"🚀 Enhanced AI Pipeline initialized on {self.device}")
    
    def _get_device(self) -> torch.device:
        """Smart device selection with fallback"""
        if torch.cuda.is_available():
            device = torch.device("cuda")
            # Log GPU info
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🎮 Using GPU: {gpu_name} ({gpu_memory:.1f}GB)")
            return device
        else:
            logger.warning("⚠️ CUDA not available, using CPU")
            return torch.device("cpu")
    
    async def initialize(self):
        """Initialize the pipeline with proper resource management"""
        try:
            with self.memory_monitor.monitor_memory("Pipeline initialization"):
                # Start background memory monitoring
                self._cleanup_task = asyncio.create_task(self._background_cleanup())
                
                # Load default model
                await self._load_model(self.settings.default_model_id)
                
                logger.info("✅ Enhanced AI Pipeline ready")
                
        except Exception as e:
            logger.error(f"❌ Pipeline initialization failed: {e}")
            self.error_count += 1
            raise
    
    async def _background_cleanup(self):
        """Background task for memory cleanup"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                if self.memory_monitor.check_memory_pressure():
                    logger.info("🧹 Background cleanup triggered")
                    self.memory_monitor.force_cleanup()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background cleanup error: {e}")
    
    async def generate_assets(self, request: GenerationRequest) -> List[GeneratedAsset]:
        """Generate assets with enhanced memory management"""
        operation_name = f"Generate {request.num_images} assets"
        
        try:
            with self.memory_monitor.monitor_memory(operation_name):
                if not self.current_pipeline:
                    raise ValueError("No model loaded")
                
                logger.info(f"🎨 Generating {request.num_images} assets: {request.prompt[:50]}...")
                start_time = time.time()
                
                # Pre-generation memory check
                if self.memory_monitor.check_memory_pressure():
                    logger.warning("⚠️ Memory pressure detected before generation")
                    self.memory_monitor.force_cleanup()
                
                # Load LoRA if specified
                if request.lora_weights:
                    await self._load_loras_with_cleanup(request.lora_weights, request.lora_scales)
                
                # Enhanced prompt
                enhanced_prompt = self._enhance_prompt(request)
                
                # Generate with memory monitoring
                results = await self._generate_with_memory_management(request, enhanced_prompt)
                
                # Process results with cleanup
                assets = await self._process_results_with_cleanup(results, request, enhanced_prompt, start_time)
                
                # Update statistics
                generation_time = time.time() - start_time
                self.generation_count += request.num_images
                self.total_time += generation_time
                
                # Post-generation cleanup
                await self._post_generation_cleanup()
                
                logger.info(f"✅ Generated {len(assets)} assets in {generation_time:.2f}s")
                return assets
                
        except Exception as e:
            logger.error(f"❌ Asset generation failed: {e}")
            self.error_count += 1
            
            # Emergency cleanup on error
            self.memory_monitor.force_cleanup()
            raise
    
    async def _generate_with_memory_management(self, request: GenerationRequest, enhanced_prompt: str):
        """Generate images with memory monitoring"""
        # Set seed for reproducibility
        generator = None
        if request.seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(request.seed)
        
        # Generate with monitoring
        try:
            results = self.current_pipeline(
                prompt=enhanced_prompt,
                negative_prompt=request.negative_prompt,
                num_images_per_prompt=request.num_images,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale,
                width=request.width,
                height=request.height,
                generator=generator,
                output_type="pil"
            )
            return results
            
        except torch.cuda.OutOfMemoryError as e:
            logger.error("💥 CUDA Out of Memory during generation!")
            
            # Emergency cleanup
            self.memory_monitor.force_cleanup()
            self.model_cache.clear()
            
            raise RuntimeError("GPU out of memory during generation. Try reducing image size or batch size.") from e
    
    async def _post_generation_cleanup(self):
        """Cleanup after generation"""
        # Clear any temporary tensors
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Clear LoRA cache if needed
        if len(self.lora_cache) > 3:  # Keep max 3 LoRAs
            oldest_lora = min(self.lora_cache.keys())
            del self.lora_cache[oldest_lora]
            logger.debug(f"🗑️ Evicted oldest LoRA: {oldest_lora}")
        
        gc.collect()
    
    async def _load_loras_with_cleanup(self, lora_weights: List[str], lora_scales: Optional[List[float]]):
        """Load LoRAs with proper cleanup"""
        for i, lora_path in enumerate(lora_weights):
            scale = lora_scales[i] if lora_scales else 1.0
            
            # Check memory before loading
            if self.memory_monitor.check_memory_pressure():
                logger.warning("⚠️ Memory pressure - clearing LoRA cache")
                self.lora_cache.clear()
                self.memory_monitor.force_cleanup()
            
            await self.load_lora(lora_path, scale)
    
    async def cleanup(self):
        """Comprehensive cleanup on shutdown"""
        logger.info("🧹 Cleaning up Enhanced AI Pipeline...")
        
        # Cancel background tasks
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # Clear all caches
        self.model_cache.clear()
        self.lora_cache.clear()
        
        # Clear pipeline
        self.current_pipeline = None
        
        # Final memory cleanup
        self.memory_monitor.force_cleanup()
        
        logger.info("✅ Enhanced AI Pipeline cleanup complete")
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """Get comprehensive memory usage statistics"""
        stats = self.memory_monitor.get_memory_stats()
        
        # Add pipeline-specific stats
        stats.update({
            "cached_models": len(self.model_cache.cache),
            "cached_loras": len(self.lora_cache),
            "generation_count": self.generation_count,
            "error_count": self.error_count,
            "avg_generation_time": self.total_time / max(1, self.generation_count)
        })
        
        return stats
    
    def is_ready(self) -> bool:
        """Check if pipeline is ready for generation"""
        return (
            self.current_pipeline is not None and 
            not self.memory_monitor.check_memory_pressure()
        )

    # ... (continuing with other methods like _enhance_prompt, load_lora, etc.)
    # ... (implement remaining methods from original with memory management)
