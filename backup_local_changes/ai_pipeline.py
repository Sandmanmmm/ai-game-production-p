# AI Pipeline - Core SDXL + LoRA inference engine
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
import os

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
from s3_model_manager import get_s3_model_manager

logger = logging.getLogger(__name__)

class ModelCache:
    """Smart model caching system"""
    
    def __init__(self, max_models: int = 3):
        self.cache: Dict[str, Any] = {}
        self.usage_times: Dict[str, datetime] = {}
        self.max_models = max_models
    
    def get(self, model_id: str) -> Optional[Any]:
        """Get model from cache"""
        if model_id in self.cache:
            self.usage_times[model_id] = datetime.now()
            return self.cache[model_id]
        return None
    
    def put(self, model_id: str, model: Any):
        """Add model to cache with LRU eviction"""
        # Evict if cache is full
        while len(self.cache) >= self.max_models:
            oldest_id = min(self.usage_times.keys(), key=lambda k: self.usage_times[k])
            self._evict(oldest_id)
        
        self.cache[model_id] = model
        self.usage_times[model_id] = datetime.now()
        logger.info(f"🧠 Cached model: {model_id}")
    
    def _evict(self, model_id: str):
        """Evict model from cache"""
        if model_id in self.cache:
            del self.cache[model_id]
            del self.usage_times[model_id]
            # Force garbage collection
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info(f"🗑️ Evicted model: {model_id}")
    
    def clear(self):
        """Clear all cached models"""
        self.cache.clear()
        self.usage_times.clear()
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

class AIPipeline:
    """Core AI pipeline for asset generation"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.device = self._get_device()
        self.dtype = torch.float16 if self.device.type == "cuda" else torch.float32
        
        # Model management
        self.model_cache = ModelCache(max_models=settings.max_cached_models)
        self.current_pipeline: Optional[DiffusionPipeline] = None
        self.current_model_id: str = ""
        
        # LoRA management
        self.lora_cache: Dict[str, Any] = {}
        
        # Performance tracking
        self.generation_count = 0
        self.total_time = 0.0
        
        logger.info(f"🎮 AI Pipeline initialized on {self.device}")
    
    def _get_device(self) -> torch.device:
        """Determine the best device for inference"""
        if torch.cuda.is_available():
            device = torch.device("cuda")
            logger.info(f"🚀 Using GPU: {torch.cuda.get_device_name()}")
            logger.info(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB")
        else:
            device = torch.device("cpu")
            logger.info("⚠️ Using CPU (GPU not available)")
        return device
    
    async def initialize(self):
        """Initialize the pipeline with default model"""
        try:
            await self.load_model(self.settings.base_model_path)
            logger.info("✅ AI Pipeline ready")
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI pipeline: {e}")
            raise
    
    async def _resolve_model_path(self, model_id: str) -> str:
        """Resolve model path from local cache or S3"""
        try:
            # Check if it's already a local path
            if os.path.exists(model_id):
                return model_id
            
            # Check if it's a HuggingFace model ID (contains '/')
            if '/' in model_id and not model_id.startswith('/'):
                return model_id  # HuggingFace will download automatically
            
            # Try to get from S3
            s3_manager = await get_s3_model_manager()
            model_path = await s3_manager.download_model(model_id)
            
            # Verify model integrity
            if await s3_manager.verify_model_integrity(model_id):
                logger.info(f"✅ Model {model_id} ready from S3")
                return model_path
            else:
                raise Exception(f"Model {model_id} failed integrity check")
                
        except Exception as e:
            logger.warning(f"⚠️ S3 model loading failed: {e}, falling back to HuggingFace")
            return model_id  # Fallback to HuggingFace
    
    async def load_model(self, model_id: str, model_type: str = "sdxl") -> bool:
        """Load a specific model (from local cache or S3)"""
        try:
            # Check cache first
            cached_pipeline = self.model_cache.get(model_id)
            if cached_pipeline:
                self.current_pipeline = cached_pipeline
                self.current_model_id = model_id
                logger.info(f"📦 Loaded cached model: {model_id}")
                return True
            
            logger.info(f"⬇️ Loading model: {model_id}")
            start_time = time.time()
            
            # Determine model path
            model_path = await self._resolve_model_path(model_id)
            
            # Load pipeline based on model type
            if model_type == "sdxl":
                pipeline = StableDiffusionXLPipeline.from_pretrained(
                    model_path,
                    torch_dtype=self.dtype,
                    use_safetensors=True,
                    variant="fp16" if self.dtype == torch.float16 else None
                )
            else:
                # Fallback to auto pipeline
                pipeline = AutoPipelineForText2Image.from_pretrained(
                    model_path,
                    torch_dtype=self.dtype,
                    use_safetensors=True
                )
            
            # Optimize pipeline
            pipeline = pipeline.to(self.device)
            
            # Enable memory efficient attention
            if hasattr(pipeline, "enable_xformers_memory_efficient_attention"):
                try:
                    pipeline.enable_xformers_memory_efficient_attention()
                except:
                    logger.warning("xformers not available, using default attention")
            
            # Enable CPU offload if configured
            if self.settings.enable_cpu_offload and self.device.type == "cuda":
                pipeline.enable_sequential_cpu_offload()
            
            # Set scheduler
            if self.settings.scheduler == "dpm":
                pipeline.scheduler = DPMSolverMultistepScheduler.from_config(pipeline.scheduler.config)
            elif self.settings.scheduler == "euler_a":
                pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(pipeline.scheduler.config)
            elif self.settings.scheduler == "ddim":
                pipeline.scheduler = DDIMScheduler.from_config(pipeline.scheduler.config)
            
            # Cache the pipeline
            self.model_cache.put(model_id, pipeline)
            self.current_pipeline = pipeline
            self.current_model_id = model_id
            
            load_time = time.time() - start_time
            logger.info(f"✅ Model loaded in {load_time:.2f}s: {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model {model_id}: {e}")
            return False
    
    async def load_lora(self, lora_path: str, scale: float = 1.0) -> bool:
        """Load LoRA weights"""
        try:
            if not self.current_pipeline:
                raise ValueError("No base model loaded")
            
            # Check if LoRA is already cached
            cache_key = f"{lora_path}_{scale}"
            if cache_key in self.lora_cache:
                # Apply cached LoRA
                self.current_pipeline.load_lora_weights(lora_path)
                self.current_pipeline.fuse_lora(lora_scale=scale)
                logger.info(f"📦 Applied cached LoRA: {lora_path}")
                return True
            
            logger.info(f"⬇️ Loading LoRA: {lora_path}")
            
            # Load LoRA weights
            self.current_pipeline.load_lora_weights(lora_path)
            self.current_pipeline.fuse_lora(lora_scale=scale)
            
            # Cache LoRA info
            self.lora_cache[cache_key] = {
                "path": lora_path,
                "scale": scale,
                "loaded_at": datetime.now()
            }
            
            logger.info(f"✅ LoRA loaded: {lora_path} (scale: {scale})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load LoRA {lora_path}: {e}")
            return False
    
    async def generate_assets(self, request: GenerationRequest) -> List[GeneratedAsset]:
        """Generate assets based on request"""
        try:
            if not self.current_pipeline:
                raise ValueError("No model loaded")
            
            logger.info(f"🎨 Generating {request.num_images} assets: {request.prompt[:50]}...")
            start_time = time.time()
            
            # Load LoRA if specified
            if request.lora_weights:
                for i, lora_path in enumerate(request.lora_weights):
                    scale = request.lora_scales[i] if request.lora_scales else 1.0
                    await self.load_lora(lora_path, scale)
            
            # Enhance prompt based on asset type and style
            enhanced_prompt = self._enhance_prompt(request)
            
            # Set seed for reproducibility
            generator = None
            if request.seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(request.seed)
            
            # Generate images
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
            
            # Process results
            assets = []
            for i, image in enumerate(results.images):
                # Apply post-processing
                processed_image = await self._post_process_image(image, request)
                
                # Create asset info
                asset = GeneratedAsset(
                    url="",  # Will be set by storage manager
                    thumbnail_url="",
                    filename=f"asset_{request.request_id}_{i}.{request.format.value}",
                    width=processed_image.width,
                    height=processed_image.height,
                    format=request.format.value,
                    file_size=0,  # Will be calculated after saving
                    prompt=enhanced_prompt,
                    negative_prompt=request.negative_prompt,
                    seed=request.seed if request.seed else 0,
                    steps=request.steps,
                    guidance_scale=request.guidance_scale,
                    model_used=self.current_model_id,
                    quality_score=0.8,  # Placeholder quality score
                    processing_time=time.time() - start_time,
                    metadata={
                        "asset_type": request.asset_type.value,
                        "style": request.style.value if request.style else None,
                        "quality": request.quality.value,
                        "original_prompt": request.prompt
                    }
                )
                
                # Store the processed image for saving
                setattr(asset, 'processed_image', processed_image)
                assets.append(asset)
            
            generation_time = time.time() - start_time
            self.generation_count += request.num_images
            self.total_time += generation_time
            
            logger.info(f"✅ Generated {len(assets)} assets in {generation_time:.2f}s")
            return assets
            
        except Exception as e:
            logger.error(f"❌ Asset generation failed: {e}")
            raise
    
    def _enhance_prompt(self, request: GenerationRequest) -> str:
        """Enhance prompt based on asset type and style"""
        prompt = request.prompt
        
        # Add style-specific enhancements
        if request.style == StyleType.PIXEL_ART:
            prompt += ", pixel art style, 8-bit graphics, retro gaming"
        elif request.style == StyleType.HAND_DRAWN:
            prompt += ", hand drawn illustration, artistic sketch"
        elif request.style == StyleType.REALISTIC:
            prompt += ", photorealistic, detailed, high quality"
        elif request.style == StyleType.CARTOON:
            prompt += ", cartoon style, stylized, colorful"
        elif request.style == StyleType.MINIMALIST:
            prompt += ", minimalist design, clean, simple"
        
        # Add asset type specific enhancements
        if request.asset_type == AssetType.CHARACTER_DESIGN:
            prompt += ", character design, full body, game character"
        elif request.asset_type == AssetType.ENVIRONMENT_ART:
            prompt += ", environment art, landscape, game level"
        elif request.asset_type == AssetType.PROP_DESIGN:
            prompt += ", game prop, object design, isolated on white background"
        elif request.asset_type == AssetType.UI_ELEMENT:
            prompt += ", UI element, interface design, clean graphics"
        
        # Add quality enhancements
        if request.quality.value in ["high", "production"]:
            prompt += ", high quality, detailed, professional"
        
        # Add transparency hint if requested
        if request.transparent_background:
            prompt += ", transparent background, isolated"
        
        return prompt
    
    async def _post_process_image(self, image: Image.Image, request: GenerationRequest) -> Image.Image:
        """Apply post-processing to generated image"""
        try:
            processed = image.copy()
            
            # Remove background if requested
            if request.remove_background or request.transparent_background:
                processed = await self._remove_background(processed)
            
            # Apply sprite optimization
            if request.apply_sprite_optimization:
                processed = await self._optimize_for_sprite(processed)
            
            # Apply tileset optimization
            if request.apply_tileset_optimization:
                processed = await self._optimize_for_tileset(processed)
            
            # Convert format if needed
            if request.format.value == "png" and processed.mode != "RGBA":
                processed = processed.convert("RGBA")
            elif request.format.value in ["jpg", "jpeg"] and processed.mode != "RGB":
                processed = processed.convert("RGB")
            
            return processed
            
        except Exception as e:
            logger.warning(f"Post-processing failed: {e}")
            return image
    
    async def _remove_background(self, image: Image.Image) -> Image.Image:
        """Remove background using simple thresholding (placeholder)"""
        # This is a simple implementation - in production, use a proper background removal model
        try:
            # Convert to RGBA
            rgba_image = image.convert("RGBA")
            data = np.array(rgba_image)
            
            # Simple white background removal
            white_areas = (data[:, :, 0] > 240) & (data[:, :, 1] > 240) & (data[:, :, 2] > 240)
            data[white_areas] = [255, 255, 255, 0]
            
            return Image.fromarray(data, 'RGBA')
            
        except Exception as e:
            logger.warning(f"Background removal failed: {e}")
            return image
    
    async def _optimize_for_sprite(self, image: Image.Image) -> Image.Image:
        """Optimize image for sprite usage"""
        # Ensure power-of-2 dimensions for better GPU compatibility
        width, height = image.size
        
        # Find next power of 2
        new_width = 2 ** (width - 1).bit_length()
        new_height = 2 ** (height - 1).bit_length()
        
        if new_width != width or new_height != height:
            # Resize maintaining aspect ratio
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        return image
    
    async def _optimize_for_tileset(self, image: Image.Image) -> Image.Image:
        """Optimize image for tileset usage"""
        # Ensure dimensions are multiples of common tile sizes (16, 32, 64)
        width, height = image.size
        
        # Round to nearest multiple of 32
        new_width = ((width + 15) // 32) * 32
        new_height = ((height + 15) // 32) * 32
        
        if new_width != width or new_height != height:
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        return image
    
    def is_ready(self) -> bool:
        """Check if pipeline is ready for generation"""
        return self.current_pipeline is not None
    
    @property
    def gpu_available(self) -> bool:
        """Check if GPU is available"""
        return torch.cuda.is_available()
    
    def get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage"""
        memory_info = {}
        
        if torch.cuda.is_available():
            memory_info["gpu_allocated"] = torch.cuda.memory_allocated() / 1e9  # GB
            memory_info["gpu_cached"] = torch.cuda.memory_reserved() / 1e9  # GB
            memory_info["gpu_total"] = torch.cuda.get_device_properties(0).total_memory / 1e9  # GB
        
        # Get CPU memory usage (approximate)
        try:
            import psutil
            process = psutil.Process()
            memory_info["cpu_usage"] = process.memory_info().rss / 1e9  # GB
        except ImportError:
            pass
        
        return memory_info
    
    def get_model_info(self) -> List[ModelInfo]:
        """Get information about loaded models"""
        models = []
        
        for model_id in self.model_cache.cache.keys():
            models.append(ModelInfo(
                model_id=model_id,
                model_type="sdxl",
                loaded=True,
                last_used=self.model_cache.usage_times.get(model_id)
            ))
        
        return models
    
    async def unload_model(self, model_id: str) -> bool:
        """Unload a specific model"""
        try:
            if model_id in self.model_cache.cache:
                self.model_cache._evict(model_id)
                
                # Clear current pipeline if it's the unloaded model
                if self.current_model_id == model_id:
                    self.current_pipeline = None
                    self.current_model_id = ""
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to unload model {model_id}: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up AI Pipeline...")
        self.model_cache.clear()
        self.lora_cache.clear()
        self.current_pipeline = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        logger.info("✅ AI Pipeline cleanup complete")
