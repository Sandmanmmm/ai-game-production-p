"""
Core asset generation logic and pipeline management
"""
import asyncio
import io
import base64
import uuid
import torch
from typing import List, Optional, Dict, Any
from PIL import Image, ImageOps, ImageFilter
import numpy as np
from datetime import datetime

from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline
from diffusers import AutoencoderKL, UNet2DConditionModel, DDIMScheduler
from transformers import CLIPTextModel, CLIPTextModelWithProjection, CLIPTokenizer

from models import (
    AssetGenerationRequest, 
    AssetGenerationResponse, 
    ProgressUpdate, 
    GenerationStatus,
    AssetType
)

class AssetGenerationService:
    """Core service for AI asset generation"""
    
    def __init__(self, device: str = "cuda", model_cache_dir: str = "./models"):
        self.device = device
        self.model_cache_dir = model_cache_dir
        self.pipelines = {}
        self.is_initialized = False
        
        # Generation statistics
        self.total_generations = 0
        self.successful_generations = 0
        
    async def initialize(self):
        """Initialize all AI models and pipelines"""
        if self.is_initialized:
            return
            
        print(f"🤖 Initializing Asset Generation Service on {self.device}")
        
        try:
            # Load main SDXL pipeline
            await self._load_sdxl_pipeline()
            
            # Load refiner if available
            await self._load_sdxl_refiner()
            
            # Initialize post-processing models
            await self._initialize_post_processors()
            
            self.is_initialized = True
            print("✅ Asset Generation Service initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to initialize Asset Generation Service: {e}")
            raise
    
    async def _load_sdxl_pipeline(self):
        """Load the main SDXL generation pipeline"""
        print("📥 Loading Stable Diffusion XL base model...")
        
        if self.device == "cuda":
            self.pipelines["sdxl_base"] = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16,
                use_safetensors=True,
                cache_dir=self.model_cache_dir,
                variant="fp16"
            ).to(self.device)
            
            # Memory optimizations
            self.pipelines["sdxl_base"].enable_model_cpu_offload()
            self.pipelines["sdxl_base"].enable_vae_slicing()
            self.pipelines["sdxl_base"].enable_attention_slicing(1)
        else:
            # CPU fallback
            self.pipelines["sdxl_base"] = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float32,
                cache_dir=self.model_cache_dir
            )
        
        print("✅ SDXL base pipeline loaded")
    
    async def _load_sdxl_refiner(self):
        """Load SDXL refiner for higher quality outputs"""
        try:
            print("📥 Loading SDXL refiner...")
            
            if self.device == "cuda":
                self.pipelines["sdxl_refiner"] = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                    "stabilityai/stable-diffusion-xl-refiner-1.0",
                    torch_dtype=torch.float16,
                    use_safetensors=True,
                    cache_dir=self.model_cache_dir,
                    variant="fp16"
                ).to(self.device)
                
                self.pipelines["sdxl_refiner"].enable_model_cpu_offload()
                self.pipelines["sdxl_refiner"].enable_vae_slicing()
            
            print("✅ SDXL refiner loaded")
        except Exception as e:
            print(f"⚠️ Could not load SDXL refiner: {e}")
            self.pipelines["sdxl_refiner"] = None
    
    async def _initialize_post_processors(self):
        """Initialize post-processing tools"""
        print("🔧 Initializing post-processing tools...")
        
        # Background removal model (placeholder)
        # In production, you'd load something like REMBG or U²-Net
        self.background_remover = None
        
        # Upscaling model (placeholder)
        # In production, you'd load Real-ESRGAN or similar
        self.upscaler = None
        
        print("✅ Post-processing tools initialized")
    
    async def generate_asset(
        self, 
        request: AssetGenerationRequest,
        progress_callback: Optional[callable] = None
    ) -> AssetGenerationResponse:
        """Generate asset from request"""
        start_time = datetime.utcnow()
        request_id = str(uuid.uuid4())
        
        try:
            self.total_generations += 1
            
            # Progress: Starting
            if progress_callback:
                await progress_callback(ProgressUpdate(
                    request_id=request_id,
                    status=GenerationStatus.PROCESSING,
                    progress=0.0,
                    current_step="Starting asset generation",
                    step_number=0,
                    total_steps=request.num_variants
                ))
            
            # Load style pack if specified
            if request.style_pack_id:
                await self._load_style_pack(request.style_pack_id)
            
            # Generate variants
            images = []
            for i in range(request.num_variants):
                if progress_callback:
                    await progress_callback(ProgressUpdate(
                        request_id=request_id,
                        status=GenerationStatus.PROCESSING,
                        progress=(i / request.num_variants) * 0.8,
                        current_step=f"Generating variant {i+1}/{request.num_variants}",
                        step_number=i + 1,
                        total_steps=request.num_variants
                    ))
                
                image = await self._generate_single_image(request, i)
                
                # Post-process based on asset type
                if request.post_process:
                    image = await self._post_process_image(image, request.asset_type)
                
                # Convert to base64
                image_b64 = self._image_to_base64(image)
                images.append(image_b64)
            
            # Final processing
            if progress_callback:
                await progress_callback(ProgressUpdate(
                    request_id=request_id,
                    status=GenerationStatus.POST_PROCESSING,
                    progress=0.9,
                    current_step="Finalizing assets",
                    step_number=request.num_variants,
                    total_steps=request.num_variants
                ))
            
            # Create thumbnails
            thumbnails = [self._create_thumbnail(img_b64) for img_b64 in images]
            
            # Success
            self.successful_generations += 1
            end_time = datetime.utcnow()
            generation_time = (end_time - start_time).total_seconds()
            
            if progress_callback:
                await progress_callback(ProgressUpdate(
                    request_id=request_id,
                    status=GenerationStatus.COMPLETED,
                    progress=1.0,
                    current_step="Asset generation complete",
                    step_number=request.num_variants,
                    total_steps=request.num_variants
                ))
            
            return AssetGenerationResponse(
                asset_id=str(uuid.uuid4()),
                request_id=request_id,
                status=GenerationStatus.COMPLETED,
                images=images,
                thumbnails=thumbnails,
                metadata={
                    "prompt": request.prompt,
                    "asset_type": request.asset_type.value,
                    "style_pack_id": request.style_pack_id,
                    "generation_params": {
                        "width": request.width,
                        "height": request.height,
                        "guidance_scale": request.guidance_scale,
                        "steps": request.num_inference_steps,
                        "seed": request.seed,
                        "use_refiner": request.use_refiner
                    },
                    "post_processing": request.post_process
                },
                created_at=start_time,
                completed_at=end_time,
                generation_time=generation_time
            )
            
        except Exception as e:
            if progress_callback:
                await progress_callback(ProgressUpdate(
                    request_id=request_id,
                    status=GenerationStatus.FAILED,
                    progress=0.0,
                    current_step="Generation failed",
                    error_message=str(e)
                ))
            
            raise Exception(f"Asset generation failed: {e}")
    
    async def _generate_single_image(self, request: AssetGenerationRequest, variant_index: int) -> Image.Image:
        """Generate a single image variant"""
        pipeline = self.pipelines.get("sdxl_base")
        if not pipeline:
            raise Exception("SDXL pipeline not available")
        
        # Set up generator with seed
        generator = torch.Generator(device=self.device)
        if request.seed is not None:
            generator.manual_seed(request.seed + variant_index)
        
        # Generate base image
        with torch.autocast(self.device):
            result = pipeline(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                guidance_scale=request.guidance_scale,
                num_inference_steps=request.num_inference_steps,
                generator=generator
            )
        
        image = result.images[0]
        
        # Use refiner if available and requested
        if request.use_refiner and self.pipelines.get("sdxl_refiner"):
            image = await self._refine_image(image, request, generator)
        
        return image
    
    async def _refine_image(self, image: Image.Image, request: AssetGenerationRequest, generator) -> Image.Image:
        """Apply SDXL refiner for higher quality"""
        refiner = self.pipelines.get("sdxl_refiner")
        if not refiner:
            return image
        
        with torch.autocast(self.device):
            refined = refiner(
                prompt=request.prompt,
                image=image,
                num_inference_steps=request.num_inference_steps // 2,
                strength=0.3,  # Light refinement
                generator=generator
            )
        
        return refined.images[0]
    
    async def _load_style_pack(self, style_pack_id: str):
        """Load LoRA weights for style pack"""
        # TODO: Implement LoRA loading
        # This would load custom trained weights for consistent style
        print(f"🎨 Loading style pack: {style_pack_id}")
        pass
    
    async def _post_process_image(self, image: Image.Image, asset_type: AssetType) -> Image.Image:
        """Apply asset-type specific post-processing"""
        if asset_type == AssetType.SPRITE:
            return await self._process_sprite(image)
        elif asset_type == AssetType.TILESET:
            return await self._process_tileset(image)
        elif asset_type == AssetType.UI_ELEMENT:
            return await self._process_ui_element(image)
        elif asset_type == AssetType.ICON:
            return await self._process_icon(image)
        else:
            return image
    
    async def _process_sprite(self, image: Image.Image) -> Image.Image:
        """Process sprite - remove background, ensure proper alpha"""
        # Convert to RGBA
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # TODO: Implement proper background removal
        # For now, just ensure transparency
        return image
    
    async def _process_tileset(self, image: Image.Image) -> Image.Image:
        """Process tileset - ensure tileable"""
        # TODO: Implement tileable processing
        # This would ensure edges wrap seamlessly
        return image
    
    async def _process_ui_element(self, image: Image.Image) -> Image.Image:
        """Process UI element - clean edges, proper sizing"""
        # Apply slight blur reduction for crisp UI elements
        image = image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
        return image
    
    async def _process_icon(self, image: Image.Image) -> Image.Image:
        """Process icon - square aspect, clean edges"""
        # Ensure square aspect ratio
        size = max(image.size)
        square_image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Center the image
        x = (size - image.size[0]) // 2
        y = (size - image.size[1]) // 2
        square_image.paste(image, (x, y))
        
        return square_image
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        return base64.b64encode(buffer.getvalue()).decode()
    
    def _create_thumbnail(self, image_b64: str, size: tuple = (256, 256)) -> str:
        """Create thumbnail from base64 image"""
        # Decode base64 to image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create thumbnail
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Convert back to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        return base64.b64encode(buffer.getvalue()).decode()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get generation statistics"""
        success_rate = (self.successful_generations / self.total_generations * 100) if self.total_generations > 0 else 0
        
        return {
            "total_generations": self.total_generations,
            "successful_generations": self.successful_generations,
            "success_rate": success_rate,
            "pipelines_loaded": list(self.pipelines.keys()),
            "device": self.device,
            "is_initialized": self.is_initialized
        }
