# SDXL Pipeline - VAE Module
# Production-ready VAE for RTX 4090
# Version: 2.0.0

"""
SDXL VAE Module

High-performance VAE implementation with RTX 4090 optimizations.
Handles encoding/decoding between pixel space and latent space.
"""

import torch
import torch.nn.functional as F
from diffusers import AutoencoderKL
import logging
from typing import Dict, Tuple, Optional
from PIL import Image
import numpy as np

from . import BaseSDXLModule, PipelineConfig, performance_monitor, model_cache

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Advanced image processing utilities"""
    
    @staticmethod
    def preprocess_image(image: Image.Image, target_size: Tuple[int, int] = (1024, 1024)) -> torch.Tensor:
        """Preprocess PIL image to tensor"""
        # Resize if needed
        if image.size != target_size:
            image = image.resize(target_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to tensor and normalize
        image_array = np.array(image, dtype=np.float32) / 255.0
        image_tensor = torch.from_numpy(image_array).permute(2, 0, 1)  # HWC -> CHW
        
        # Normalize to [-1, 1] range
        image_tensor = (image_tensor - 0.5) * 2.0
        
        return image_tensor.unsqueeze(0)  # Add batch dimension
    
    @staticmethod
    def postprocess_image(tensor: torch.Tensor) -> Image.Image:
        """Convert tensor to PIL image"""
        # Remove batch dimension and move to CPU
        if tensor.dim() == 4:
            tensor = tensor.squeeze(0)
        tensor = tensor.cpu()
        
        # Denormalize from [-1, 1] to [0, 1]
        tensor = (tensor / 2.0 + 0.5).clamp(0, 1)
        
        # Convert to numpy array
        image_array = tensor.permute(1, 2, 0).numpy()  # CHW -> HWC
        image_array = (image_array * 255).astype(np.uint8)
        
        # Convert to PIL Image
        return Image.fromarray(image_array)
    
    @staticmethod
    def apply_quality_enhancement(image: Image.Image) -> Image.Image:
        """Apply quality enhancement filters"""
        # This is a placeholder for advanced post-processing
        # Could include sharpening, noise reduction, etc.
        return image
    
    @staticmethod
    def validate_image_size(width: int, height: int) -> Tuple[int, int]:
        """Validate and adjust image dimensions for SDXL"""
        # SDXL works best with multiples of 64
        width = (width // 64) * 64
        height = (height // 64) * 64
        
        # Ensure minimum size
        width = max(width, 512)
        height = max(height, 512)
        
        # Ensure maximum size for memory constraints
        max_size = 1536  # RTX 4090 can handle larger sizes
        width = min(width, max_size)
        height = min(height, max_size)
        
        return width, height


class SDXLVAE(BaseSDXLModule):
    """SDXL VAE with RTX 4090 optimizations"""
    
    def __init__(self, config: PipelineConfig):
        super().__init__(config)
        
        self.vae = None
        self.image_processor = ImageProcessor()
        
        # VAE scaling factors for SDXL
        self.vae_scale_factor = 8  # SDXL VAE downsamples by 8x
        self.vae_scaling_factor = 0.13025  # SDXL VAE scaling factor
        
    def load(self):
        """Load VAE with RTX 4090 optimizations"""
        performance_monitor.start_timer("vae_load")
        
        try:
            self._setup_memory_management()
            
            # Load VAE from cache or disk
            cache_key = f"vae_{self.config.model_id}_{self.dtype}"
            self.vae = model_cache.get(cache_key)
            
            if self.vae is None:
                self.logger.info("Loading SDXL VAE...")
                self.vae = AutoencoderKL.from_pretrained(
                    self.config.model_id,
                    subfolder="vae",
                    torch_dtype=self.dtype,
                    use_safetensors=True
                ).to(self.device)
                
                # Apply RTX 4090 optimizations
                self.vae = self._optimize_model(self.vae)
                model_cache.put(cache_key, self.vae)
            
            self.logger.info("VAE loaded successfully")
            self._log_model_info()
            
        except Exception as e:
            self.logger.error(f"Failed to load VAE: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("vae_load")
            self.logger.info(f"VAE loading took {duration:.2f}s")
    
    def _log_model_info(self):
        """Log VAE model information"""
        if self.vae:
            total_params = sum(p.numel() for p in self.vae.parameters())
            
            self.logger.info(f"VAE parameters: {total_params:,}")
            self.logger.info(f"VAE dtype: {next(self.vae.parameters()).dtype}")
            self.logger.info(f"VAE scale factor: {self.vae_scale_factor}")
            self.logger.info(f"VAE scaling factor: {self.vae_scaling_factor}")
    
    def encode(self, images: torch.Tensor) -> torch.Tensor:
        """Encode images to latent space"""
        performance_monitor.start_timer("vae_encode")
        
        try:
            # Ensure correct device and dtype
            images = images.to(device=self.device, dtype=self.dtype)
            
            # Encode to latent space
            with torch.no_grad():
                latent_dist = self.vae.encode(images).latent_dist
                latents = latent_dist.sample()
                
                # Apply VAE scaling
                latents = latents * self.vae_scaling_factor
            
            self.logger.debug(f"Encoded images shape {images.shape} to latents shape {latents.shape}")
            return latents
            
        except Exception as e:
            self.logger.error(f"VAE encoding failed: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("vae_encode")
            self.logger.debug(f"VAE encoding took {duration:.3f}s")
    
    def decode(self, latents: torch.Tensor) -> torch.Tensor:
        """Decode latents to image space"""
        performance_monitor.start_timer("vae_decode")
        
        try:
            # Ensure correct device and dtype
            latents = latents.to(device=self.device, dtype=self.dtype)
            
            # Unscale latents
            latents = latents / self.vae_scaling_factor
            
            # Decode to image space
            with torch.no_grad():
                images = self.vae.decode(latents).sample
            
            self.logger.debug(f"Decoded latents shape {latents.shape} to images shape {images.shape}")
            return images
            
        except Exception as e:
            self.logger.error(f"VAE decoding failed: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("vae_decode")
            self.logger.debug(f"VAE decoding took {duration:.3f}s")
    
    def encode_image(self, image: Image.Image, target_size: Tuple[int, int] = None) -> torch.Tensor:
        """Encode PIL image to latents"""
        if target_size is None:
            target_size = (self.config.width, self.config.height)
        
        # Validate dimensions
        target_size = self.image_processor.validate_image_size(*target_size)
        
        # Preprocess image
        image_tensor = self.image_processor.preprocess_image(image, target_size)
        
        # Encode to latents
        return self.encode(image_tensor)
    
    def decode_to_image(self, latents: torch.Tensor, enhance: bool = True) -> Image.Image:
        """Decode latents to PIL image"""
        # Decode to tensor
        image_tensor = self.decode(latents)
        
        # Postprocess to PIL image
        image = self.image_processor.postprocess_image(image_tensor)
        
        # Apply enhancement if requested
        if enhance:
            image = self.image_processor.apply_quality_enhancement(image)
        
        return image
    
    def process(self, latents: torch.Tensor, enhance: bool = True) -> Image.Image:
        """Main processing function - decode latents to image"""
        return self.decode_to_image(latents, enhance)
    
    def test_roundtrip(self, image: Image.Image) -> Tuple[Image.Image, Dict[str, float]]:
        """Test encode/decode roundtrip for quality validation"""
        self.logger.info("Testing VAE roundtrip...")
        
        start_time = torch.cuda.Event(enable_timing=True)
        encode_end = torch.cuda.Event(enable_timing=True)
        decode_end = torch.cuda.Event(enable_timing=True)
        
        start_time.record()
        
        # Encode
        latents = self.encode_image(image)
        encode_end.record()
        
        # Decode
        reconstructed = self.decode_to_image(latents)
        decode_end.record()
        
        torch.cuda.synchronize()
        
        encode_time = start_time.elapsed_time(encode_end) / 1000.0
        decode_time = encode_end.elapsed_time(decode_end) / 1000.0
        total_time = start_time.elapsed_time(decode_end) / 1000.0
        
        metrics = {
            "encode_time": encode_time,
            "decode_time": decode_time,
            "total_time": total_time
        }
        
        self.logger.info(f"Roundtrip metrics: {metrics}")
        return reconstructed, metrics
    
    def benchmark(self, num_runs: int = 5) -> Dict[str, float]:
        """Benchmark VAE performance"""
        self.logger.info(f"Running VAE benchmark ({num_runs} runs)...")
        
        # Create test latents
        batch_size = 1
        channels = 4  # SDXL VAE latent channels
        height = self.config.height // self.vae_scale_factor
        width = self.config.width // self.vae_scale_factor
        
        test_latents = torch.randn(
            batch_size, channels, height, width,
            device=self.device, dtype=self.dtype
        )
        
        # Benchmark decode (most common operation)
        decode_times = []
        for i in range(num_runs):
            start_time = torch.cuda.Event(enable_timing=True)
            end_time = torch.cuda.Event(enable_timing=True)
            
            start_time.record()
            self.decode(test_latents)
            end_time.record()
            
            torch.cuda.synchronize()
            elapsed = start_time.elapsed_time(end_time) / 1000.0
            decode_times.append(elapsed)
        
        # Create test image for encode benchmark
        test_image = torch.randn(
            batch_size, 3, self.config.height, self.config.width,
            device=self.device, dtype=self.dtype
        )
        
        # Benchmark encode
        encode_times = []
        for i in range(num_runs):
            start_time = torch.cuda.Event(enable_timing=True)
            end_time = torch.cuda.Event(enable_timing=True)
            
            start_time.record()
            self.encode(test_image)
            end_time.record()
            
            torch.cuda.synchronize()
            elapsed = start_time.elapsed_time(end_time) / 1000.0
            encode_times.append(elapsed)
        
        results = {
            "decode_time_avg": sum(decode_times) / len(decode_times),
            "decode_time_min": min(decode_times),
            "decode_time_max": max(decode_times),
            "encode_time_avg": sum(encode_times) / len(encode_times),
            "encode_time_min": min(encode_times),
            "encode_time_max": max(encode_times),
            "decode_fps": 1.0 / (sum(decode_times) / len(decode_times)),
            "encode_fps": 1.0 / (sum(encode_times) / len(encode_times))
        }
        
        self.logger.info(f"VAE benchmark results: {results}")
        return results
    
    def get_model_info(self) -> Dict[str, any]:
        """Get VAE model information"""
        if self.vae:
            return {
                "in_channels": self.vae.config.in_channels,
                "out_channels": self.vae.config.out_channels,
                "latent_channels": self.vae.config.latent_channels,
                "scale_factor": self.vae_scale_factor,
                "scaling_factor": self.vae_scaling_factor,
                "dtype": str(next(self.vae.parameters()).dtype),
                "device": str(next(self.vae.parameters()).device)
            }
        return {}


def create_vae(config: PipelineConfig = None) -> SDXLVAE:
    """Factory function to create optimized VAE"""
    if config is None:
        from . import get_optimal_rtx4090_config
        config = get_optimal_rtx4090_config()
    
    vae = SDXLVAE(config)
    vae.load()
    return vae


if __name__ == "__main__":
    # Test the VAE
    logging.basicConfig(level=logging.INFO)
    
    from . import get_optimal_rtx4090_config
    config = get_optimal_rtx4090_config()
    
    vae = create_vae(config)
    
    # Print model info
    info = vae.get_model_info()
    print(f"VAE info: {info}")
    
    # Run benchmark
    vae.benchmark(3)
