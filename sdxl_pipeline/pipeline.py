# SDXL Pipeline - Main Pipeline Module
# Production-ready orchestrator for RTX 4090
# Version: 2.0.0

"""
SDXL Main Pipeline

Complete SDXL pipeline orchestrator that combines all modules.
Optimized for RTX 4090 with advanced features and monitoring.
"""

import torch
import logging
from typing import Dict, List, Optional, Union, Callable
from PIL import Image
import time
import hashlib
import json
from pathlib import Path

from . import (
    BaseSDXLModule, PipelineConfig, performance_monitor, 
    model_cache, get_optimal_rtx4090_config
)
from .text_encoder import SDXLTextEncoder
from .unet import SDXLUNet
from .vae import SDXLVAE

logger = logging.getLogger(__name__)


class GenerationParams:
    """Parameters for image generation"""
    
    def __init__(self, 
                 prompt: str,
                 negative_prompt: str = None,
                 width: int = 1024,
                 height: int = 1024,
                 num_inference_steps: int = 25,
                 guidance_scale: float = 7.5,
                 style: str = "fantasy",
                 enhance_prompt: bool = True,
                 seed: int = None,
                 scheduler: str = "euler"):
        
        self.prompt = prompt
        self.negative_prompt = negative_prompt
        self.width = width
        self.height = height
        self.num_inference_steps = num_inference_steps
        self.guidance_scale = guidance_scale
        self.style = style
        self.enhance_prompt = enhance_prompt
        self.seed = seed
        self.scheduler = scheduler
        
        # Validate and adjust parameters
        self._validate_params()
    
    def _validate_params(self):
        """Validate and adjust generation parameters"""
        # Ensure dimensions are multiples of 64
        self.width = (self.width // 64) * 64
        self.height = (self.height // 64) * 64
        
        # Clamp values to reasonable ranges
        self.width = max(512, min(1536, self.width))
        self.height = max(512, min(1536, self.height))
        self.num_inference_steps = max(10, min(100, self.num_inference_steps))
        self.guidance_scale = max(1.0, min(20.0, self.guidance_scale))
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for caching/logging"""
        return {
            "prompt": self.prompt,
            "negative_prompt": self.negative_prompt,
            "width": self.width,
            "height": self.height,
            "num_inference_steps": self.num_inference_steps,
            "guidance_scale": self.guidance_scale,
            "style": self.style,
            "enhance_prompt": self.enhance_prompt,
            "seed": self.seed,
            "scheduler": self.scheduler
        }
    
    def get_cache_key(self) -> str:
        """Generate cache key for this generation"""
        params_str = json.dumps(self.to_dict(), sort_keys=True)
        return hashlib.md5(params_str.encode()).hexdigest()


class GenerationResult:
    """Result of image generation with metadata"""
    
    def __init__(self, image: Image.Image, params: GenerationParams,
                 generation_time: float, metrics: Dict):
        self.image = image
        self.params = params
        self.generation_time = generation_time
        self.metrics = metrics
        self.timestamp = time.time()
    
    def save(self, filepath: Union[str, Path], include_metadata: bool = True):
        """Save image with metadata"""
        filepath = Path(filepath)
        
        # Save image
        self.image.save(filepath)
        
        # Save metadata if requested
        if include_metadata:
            metadata_path = filepath.with_suffix('.json')
            metadata = {
                "params": self.params.to_dict(),
                "generation_time": self.generation_time,
                "metrics": self.metrics,
                "timestamp": self.timestamp
            }
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)


class SDXLPipeline(BaseSDXLModule):
    """Complete SDXL Pipeline with RTX 4090 optimizations"""
    
    def __init__(self, config: PipelineConfig = None):
        if config is None:
            config = get_optimal_rtx4090_config()
        
        super().__init__(config)
        
        # Pipeline components
        self.text_encoder = None
        self.unet = None
        self.vae = None
        
        # Generation cache
        self.result_cache = {}
        self.max_cache_size = 10
        
        # Callbacks
        self.progress_callback = None
        self.step_callback = None
        
    def load(self):
        """Load all pipeline components"""
        performance_monitor.start_timer("pipeline_load")
        
        try:
            self._setup_memory_management()
            
            self.logger.info("Loading SDXL Pipeline components...")
            
            # Load text encoder
            self.logger.info("Loading text encoder...")
            self.text_encoder = SDXLTextEncoder(self.config)
            self.text_encoder.load()
            
            # Load UNet
            self.logger.info("Loading UNet...")
            self.unet = SDXLUNet(self.config)
            self.unet.load()
            
            # Load VAE
            self.logger.info("Loading VAE...")
            self.vae = SDXLVAE(self.config)
            self.vae.load()
            
            self.logger.info("SDXL Pipeline loaded successfully")
            self._log_pipeline_info()
            
        except Exception as e:
            self.logger.error(f"Failed to load pipeline: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("pipeline_load")
            self.logger.info(f"Pipeline loading took {duration:.2f}s")
    
    def _log_pipeline_info(self):
        """Log pipeline information"""
        total_params = 0
        
        if self.text_encoder and self.text_encoder.text_encoder:
            te_params = sum(p.numel() for p in self.text_encoder.text_encoder.parameters())
            total_params += te_params
            
        if self.text_encoder and self.text_encoder.text_encoder_2:
            te2_params = sum(p.numel() for p in self.text_encoder.text_encoder_2.parameters())
            total_params += te2_params
            
        if self.unet and self.unet.unet:
            unet_params = sum(p.numel() for p in self.unet.unet.parameters())
            total_params += unet_params
            
        if self.vae and self.vae.vae:
            vae_params = sum(p.numel() for p in self.vae.vae.parameters())
            total_params += vae_params
        
        self.logger.info(f"Total pipeline parameters: {total_params:,}")
        
        if torch.cuda.is_available():
            memory_allocated = torch.cuda.memory_allocated() / 1024**3
            self.logger.info(f"GPU memory allocated: {memory_allocated:.2f}GB")
    
    def generate(self, params: Union[GenerationParams, Dict, str]) -> GenerationResult:
        """Generate image from parameters"""
        # Parse parameters
        if isinstance(params, str):
            params = GenerationParams(prompt=params)
        elif isinstance(params, dict):
            params = GenerationParams(**params)
        
        # Check cache
        cache_key = params.get_cache_key()
        if cache_key in self.result_cache:
            self.logger.info("Returning cached result")
            return self.result_cache[cache_key]
        
        performance_monitor.start_timer("generation_total")
        generation_start = time.time()
        
        try:
            self.logger.info(f"Generating image: '{params.prompt[:50]}...'")
            
            # Set seed for reproducibility
            if params.seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(params.seed)
            else:
                generator = None
            
            # Text encoding
            self.logger.info("Encoding text...")
            text_result = self.text_encoder.process(
                params.prompt,
                params.negative_prompt,
                params.style,
                params.enhance_prompt
            )
            
            prompt_embeds = text_result["prompt_embeds"]
            negative_embeds = text_result["negative_prompt_embeds"]
            
            # Progress callback setup
            def step_callback(step, timestep, latents):
                if self.step_callback:
                    self.step_callback(step, timestep, latents)
                if self.progress_callback:
                    progress = (step + 1) / params.num_inference_steps
                    self.progress_callback(progress, step + 1, params.num_inference_steps)
            
            # UNet processing (denoising)
            self.logger.info("Generating latents...")
            latents = self.unet.process(
                prompt_embeds,
                negative_embeds,
                params.height,
                params.width,
                params.num_inference_steps,
                params.guidance_scale,
                generator,
                step_callback
            )
            
            # VAE decoding
            self.logger.info("Decoding to image...")
            image = self.vae.process(latents, enhance=True)
            
            # Calculate metrics
            generation_time = time.time() - generation_start
            metrics = {
                "generation_time": generation_time,
                "steps_per_second": params.num_inference_steps / generation_time,
                **performance_monitor.get_metrics()
            }
            
            # Create result
            result = GenerationResult(image, params, generation_time, metrics)
            
            # Cache result
            self._cache_result(cache_key, result)
            
            self.logger.info(f"Generation completed in {generation_time:.2f}s")
            return result
            
        except Exception as e:
            self.logger.error(f"Generation failed: {e}")
            raise
        
        finally:
            performance_monitor.end_timer("generation_total")
            self.cleanup()
    
    def _cache_result(self, cache_key: str, result: GenerationResult):
        """Cache generation result with LRU eviction"""
        if len(self.result_cache) >= self.max_cache_size:
            # Remove oldest entry
            oldest_key = min(self.result_cache.keys(),
                           key=lambda k: self.result_cache[k].timestamp)
            del self.result_cache[oldest_key]
        
        self.result_cache[cache_key] = result
    
    def generate_batch(self, params_list: List[Union[GenerationParams, Dict, str]]) -> List[GenerationResult]:
        """Generate multiple images"""
        results = []
        total = len(params_list)
        
        self.logger.info(f"Generating {total} images...")
        
        for i, params in enumerate(params_list):
            self.logger.info(f"Generating image {i+1}/{total}")
            
            if self.progress_callback:
                self.progress_callback(i / total, i, total)
            
            try:
                result = self.generate(params)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Failed to generate image {i+1}: {e}")
                results.append(None)
        
        if self.progress_callback:
            self.progress_callback(1.0, total, total)
        
        return results
    
    def process(self, prompt: str, **kwargs) -> Image.Image:
        """Simple interface for single image generation"""
        params = GenerationParams(prompt=prompt, **kwargs)
        result = self.generate(params)
        return result.image
    
    def benchmark(self, num_runs: int = 3) -> Dict[str, float]:
        """Comprehensive pipeline benchmark"""
        self.logger.info(f"Running pipeline benchmark ({num_runs} runs)...")
        
        test_prompts = [
            "a fantasy sword with magical runes, detailed, high quality",
            "futuristic robot, sci-fi, cyberpunk, highly detailed",
            "medieval castle at sunset, epic fantasy landscape"
        ]
        
        times = []
        for i in range(num_runs):
            prompt = test_prompts[i % len(test_prompts)]
            params = GenerationParams(
                prompt=prompt,
                num_inference_steps=20,  # Faster for benchmark
                width=1024,
                height=1024
            )
            
            start_time = time.time()
            result = self.generate(params)
            end_time = time.time()
            
            times.append(end_time - start_time)
            self.logger.info(f"Run {i+1}/{num_runs}: {times[-1]:.2f}s")
        
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        # Component benchmarks
        te_bench = self.text_encoder.benchmark(5)
        unet_bench = self.unet.benchmark(5)
        vae_bench = self.vae.benchmark(5)
        
        results = {
            "full_generation_avg": avg_time,
            "full_generation_min": min_time,
            "full_generation_max": max_time,
            "images_per_minute": 60.0 / avg_time,
            "text_encoding_avg": te_bench["average_time"],
            "unet_step_avg": unet_bench["step_time_avg"],
            "vae_decode_avg": vae_bench["decode_time_avg"]
        }
        
        self.logger.info(f"Pipeline benchmark results: {results}")
        return results
    
    def get_system_info(self) -> Dict:
        """Get comprehensive system information"""
        info = {
            "device": str(self.device),
            "dtype": str(self.dtype),
            "config": self.config.__dict__,
            "pytorch_version": torch.__version__,
            "performance_metrics": performance_monitor.get_metrics()
        }
        
        if torch.cuda.is_available():
            info["cuda_info"] = {
                "version": torch.version.cuda,
                "device_count": torch.cuda.device_count(),
                "current_device": torch.cuda.current_device(),
                "device_name": torch.cuda.get_device_name(),
                "memory_allocated": torch.cuda.memory_allocated() / 1024**3,
                "memory_reserved": torch.cuda.memory_reserved() / 1024**3,
                "max_memory": torch.cuda.get_device_properties(0).total_memory / 1024**3
            }
        
        # Component info
        if self.text_encoder:
            info["text_encoder"] = self.text_encoder.get_embeddings_info()
        if self.unet:
            info["unet"] = self.unet.get_model_info()
        if self.vae:
            info["vae"] = self.vae.get_model_info()
        
        return info
    
    def set_progress_callback(self, callback: Callable[[float, int, int], None]):
        """Set progress callback function"""
        self.progress_callback = callback
    
    def set_step_callback(self, callback: Callable[[int, torch.Tensor, torch.Tensor], None]):
        """Set step callback function"""
        self.step_callback = callback


def create_pipeline(config: PipelineConfig = None) -> SDXLPipeline:
    """Factory function to create optimized SDXL pipeline"""
    pipeline = SDXLPipeline(config)
    pipeline.load()
    return pipeline


if __name__ == "__main__":
    # Test the complete pipeline
    logging.basicConfig(level=logging.INFO)
    
    # Create and test pipeline
    pipeline = create_pipeline()
    
    # Generate test image
    result = pipeline.generate(GenerationParams(
        prompt="a magical sword glowing with blue energy",
        style="fantasy",
        num_inference_steps=25
    ))
    
    print(f"Generated {result.image.size} image in {result.generation_time:.2f}s")
    
    # Run benchmark
    benchmark_results = pipeline.benchmark(2)
    print(f"Benchmark: {benchmark_results['images_per_minute']:.1f} images/minute")
    
    # Print system info
    system_info = pipeline.get_system_info()
    print(f"System: {system_info['cuda_info']['device_name']} with {system_info['cuda_info']['max_memory']:.1f}GB")
