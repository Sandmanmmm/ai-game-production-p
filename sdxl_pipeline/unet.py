# SDXL Pipeline - UNet Module
# Production-ready UNet for RTX 4090
# Version: 2.0.0

"""
SDXL UNet Module

High-performance UNet implementation with RTX 4090 optimizations.
Includes noise scheduling, guidance, and memory-efficient processing.
"""

import torch
import torch.nn.functional as F
from diffusers import UNet2DConditionModel
from diffusers.schedulers import (
    DDPMScheduler, DDIMScheduler, EulerDiscreteScheduler,
    DPMSolverMultistepScheduler, LMSDiscreteScheduler
)
import logging
from typing import Dict, Optional, Union, List
import numpy as np
from tqdm import tqdm

from . import BaseSDXLModule, PipelineConfig, performance_monitor, model_cache

logger = logging.getLogger(__name__)


class NoiseSchedulerManager:
    """Manages different noise schedulers for optimal quality"""
    
    SCHEDULERS = {
        "ddpm": DDPMScheduler,
        "ddim": DDIMScheduler,
        "euler": EulerDiscreteScheduler,
        "dpm": DPMSolverMultistepScheduler,
        "lms": LMSDiscreteScheduler
    }
    
    # Optimal settings for each scheduler
    SCHEDULER_CONFIGS = {
        "ddpm": {"num_train_timesteps": 1000, "beta_schedule": "linear"},
        "ddim": {"num_train_timesteps": 1000, "beta_schedule": "linear"},
        "euler": {"num_train_timesteps": 1000, "beta_schedule": "scaled_linear"},
        "dpm": {"num_train_timesteps": 1000, "beta_schedule": "linear"},
        "lms": {"num_train_timesteps": 1000, "beta_schedule": "linear"}
    }
    
    @staticmethod
    def create_scheduler(scheduler_type: str, model_id: str):
        """Create optimized scheduler"""
        if scheduler_type not in NoiseSchedulerManager.SCHEDULERS:
            scheduler_type = "euler"  # Default to Euler
        
        scheduler_class = NoiseSchedulerManager.SCHEDULERS[scheduler_type]
        config = NoiseSchedulerManager.SCHEDULER_CONFIGS[scheduler_type]
        
        try:
            scheduler = scheduler_class.from_pretrained(
                model_id,
                subfolder="scheduler",
                **config
            )
            logger.info(f"Created {scheduler_type} scheduler")
            return scheduler
        except Exception as e:
            logger.warning(f"Failed to load {scheduler_type} scheduler: {e}")
            # Fallback to Euler
            return EulerDiscreteScheduler.from_pretrained(
                model_id,
                subfolder="scheduler"
            )


class GuidanceController:
    """Controls classifier-free guidance for optimal quality"""
    
    @staticmethod
    def apply_guidance(noise_pred_uncond: torch.Tensor,
                      noise_pred_text: torch.Tensor,
                      guidance_scale: float) -> torch.Tensor:
        """Apply classifier-free guidance"""
        return noise_pred_uncond + guidance_scale * (noise_pred_text - noise_pred_uncond)
    
    @staticmethod
    def dynamic_guidance(step: int, total_steps: int,
                        base_scale: float = 7.5,
                        high_scale: float = 15.0,
                        low_scale: float = 5.0) -> float:
        """Dynamic guidance scaling for better results"""
        # Higher guidance in early steps, lower in final steps
        progress = step / total_steps
        if progress < 0.3:
            return high_scale
        elif progress > 0.8:
            return low_scale
        else:
            # Linear interpolation
            return base_scale
    
    @staticmethod
    def prepare_guidance_inputs(prompt_embeds: torch.Tensor,
                               negative_embeds: torch.Tensor,
                               batch_size: int = 1) -> torch.Tensor:
        """Prepare concatenated embeddings for guidance"""
        # Duplicate embeddings for classifier-free guidance
        prompt_embeds = prompt_embeds.repeat(batch_size, 1, 1)
        negative_embeds = negative_embeds.repeat(batch_size, 1, 1)
        
        # Concatenate for single forward pass
        return torch.cat([negative_embeds, prompt_embeds])


class SDXLUNet(BaseSDXLModule):
    """SDXL UNet with RTX 4090 optimizations"""
    
    def __init__(self, config: PipelineConfig):
        super().__init__(config)
        
        self.unet = None
        self.scheduler = None
        self.guidance_controller = GuidanceController()
        self.scheduler_manager = NoiseSchedulerManager()
        
        # Performance settings
        self.use_dynamic_guidance = True
        self.scheduler_type = "euler"  # Best for quality/speed balance
        
    def load(self):
        """Load UNet with RTX 4090 optimizations"""
        performance_monitor.start_timer("unet_load")
        
        try:
            self._setup_memory_management()
            
            # Load UNet from cache or disk
            cache_key = f"unet_{self.config.model_id}_{self.dtype}"
            self.unet = model_cache.get(cache_key)
            
            if self.unet is None:
                self.logger.info("Loading SDXL UNet...")
                self.unet = UNet2DConditionModel.from_pretrained(
                    self.config.model_id,
                    subfolder="unet",
                    torch_dtype=self.dtype,
                    use_safetensors=True
                ).to(self.device)
                
                # Apply RTX 4090 optimizations
                self.unet = self._optimize_model(self.unet)
                model_cache.put(cache_key, self.unet)
            
            # Load scheduler
            self.scheduler = self.scheduler_manager.create_scheduler(
                self.scheduler_type, self.config.model_id
            )
            
            self.logger.info("UNet loaded successfully")
            self._log_model_info()
            
        except Exception as e:
            self.logger.error(f"Failed to load UNet: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("unet_load")
            self.logger.info(f"UNet loading took {duration:.2f}s")
    
    def _log_model_info(self):
        """Log UNet model information"""
        if self.unet:
            total_params = sum(p.numel() for p in self.unet.parameters())
            trainable_params = sum(p.numel() for p in self.unet.parameters() if p.requires_grad)
            
            self.logger.info(f"UNet parameters: {total_params:,} total, {trainable_params:,} trainable")
            self.logger.info(f"UNet dtype: {next(self.unet.parameters()).dtype}")
            self.logger.info(f"Scheduler: {type(self.scheduler).__name__}")
    
    def prepare_latents(self, batch_size: int = 1, height: int = 1024, 
                       width: int = 1024, generator: torch.Generator = None) -> torch.Tensor:
        """Prepare initial noise latents"""
        # SDXL uses 8x downsampling
        latent_height = height // 8
        latent_width = width // 8
        
        shape = (batch_size, self.unet.config.in_channels, latent_height, latent_width)
        
        # Generate random latents
        if generator is not None:
            latents = torch.randn(shape, generator=generator, device=self.device, dtype=self.dtype)
        else:
            latents = torch.randn(shape, device=self.device, dtype=self.dtype)
        
        # Scale by scheduler's init noise sigma
        latents = latents * self.scheduler.init_noise_sigma
        
        self.logger.debug(f"Prepared latents shape: {latents.shape}")
        return latents
    
    def denoise_step(self, latents: torch.Tensor, timestep: torch.Tensor,
                    prompt_embeds: torch.Tensor, negative_embeds: torch.Tensor,
                    guidance_scale: float = 7.5, step_num: int = 0,
                    total_steps: int = 25) -> torch.Tensor:
        """Perform single denoising step with optimizations"""
        
        # Prepare guidance inputs
        encoder_hidden_states = self.guidance_controller.prepare_guidance_inputs(
            prompt_embeds, negative_embeds, latents.shape[0]
        )
        
        # Expand latents for classifier-free guidance
        latent_input = torch.cat([latents] * 2)
        latent_input = self.scheduler.scale_model_input(latent_input, timestep)
        
        # UNet forward pass
        with torch.no_grad():
            noise_pred = self.unet(
                latent_input,
                timestep,
                encoder_hidden_states=encoder_hidden_states,
                return_dict=False
            )[0]
        
        # Apply classifier-free guidance
        noise_pred_uncond, noise_pred_text = noise_pred.chunk(2)
        
        # Use dynamic guidance if enabled
        if self.use_dynamic_guidance:
            guidance_scale = self.guidance_controller.dynamic_guidance(
                step_num, total_steps, guidance_scale
            )
        
        noise_pred = self.guidance_controller.apply_guidance(
            noise_pred_uncond, noise_pred_text, guidance_scale
        )
        
        # Scheduler step
        latents = self.scheduler.step(noise_pred, timestep, latents, return_dict=False)[0]
        
        return latents
    
    def denoise(self, latents: torch.Tensor, prompt_embeds: torch.Tensor,
               negative_embeds: torch.Tensor, num_inference_steps: int = 25,
               guidance_scale: float = 7.5, callback=None) -> torch.Tensor:
        """Full denoising process with progress tracking"""
        performance_monitor.start_timer("denoising")
        
        try:
            # Set timesteps
            self.scheduler.set_timesteps(num_inference_steps, device=self.device)
            timesteps = self.scheduler.timesteps
            
            self.logger.info(f"Starting denoising: {num_inference_steps} steps")
            
            # Denoising loop with progress bar
            with tqdm(enumerate(timesteps), total=len(timesteps), desc="Denoising") as pbar:
                for i, timestep in pbar:
                    # Perform denoising step
                    latents = self.denoise_step(
                        latents, timestep, prompt_embeds, negative_embeds,
                        guidance_scale, i, len(timesteps)
                    )
                    
                    # Update progress
                    pbar.set_postfix({
                        'step': f"{i+1}/{len(timesteps)}",
                        'guidance': f"{guidance_scale:.1f}",
                        'memory': f"{torch.cuda.memory_allocated()/1024**3:.1f}GB"
                    })
                    
                    # Call callback if provided
                    if callback:
                        callback(i, timestep, latents)
                    
                    # Memory cleanup every few steps
                    if i % 5 == 0:
                        torch.cuda.empty_cache()
            
            self.logger.info("Denoising completed successfully")
            return latents
            
        except Exception as e:
            self.logger.error(f"Denoising failed: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("denoising")
            self.logger.info(f"Denoising took {duration:.2f}s")
    
    def process(self, prompt_embeds: torch.Tensor, negative_embeds: torch.Tensor,
               height: int = 1024, width: int = 1024,
               num_inference_steps: int = 25, guidance_scale: float = 7.5,
               generator: torch.Generator = None, callback=None) -> torch.Tensor:
        """Complete UNet processing pipeline"""
        
        # Prepare initial latents
        latents = self.prepare_latents(
            batch_size=1, height=height, width=width, generator=generator
        )
        
        # Perform denoising
        latents = self.denoise(
            latents, prompt_embeds, negative_embeds,
            num_inference_steps, guidance_scale, callback
        )
        
        return latents
    
    def benchmark(self, num_runs: int = 5) -> Dict[str, float]:
        """Benchmark UNet performance"""
        self.logger.info(f"Running UNet benchmark ({num_runs} runs)...")
        
        # Create test inputs
        batch_size = 1
        height, width = 1024, 1024
        latent_height, latent_width = height // 8, width // 8
        
        test_latents = torch.randn(
            batch_size, 4, latent_height, latent_width,
            device=self.device, dtype=self.dtype
        )
        
        test_embeds = torch.randn(
            batch_size, 77, 2048,  # SDXL embedding size
            device=self.device, dtype=self.dtype
        )
        
        # Benchmark single steps
        times = []
        for i in range(num_runs):
            start_time = torch.cuda.Event(enable_timing=True)
            end_time = torch.cuda.Event(enable_timing=True)
            
            start_time.record()
            self.denoise_step(
                test_latents, torch.tensor([500], device=self.device),
                test_embeds, test_embeds, 7.5, 0, 25
            )
            end_time.record()
            
            torch.cuda.synchronize()
            elapsed = start_time.elapsed_time(end_time) / 1000.0
            times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        # Estimate full generation time
        estimated_full_time = avg_time * self.config.num_inference_steps
        
        results = {
            "step_time_avg": avg_time,
            "step_time_min": min_time,
            "step_time_max": max_time,
            "estimated_full_time": estimated_full_time,
            "steps_per_second": 1.0 / avg_time
        }
        
        self.logger.info(f"UNet benchmark results: {results}")
        return results
    
    def get_model_info(self) -> Dict[str, any]:
        """Get UNet model information"""
        if self.unet:
            return {
                "in_channels": self.unet.config.in_channels,
                "out_channels": self.unet.config.out_channels,
                "cross_attention_dim": self.unet.config.cross_attention_dim,
                "attention_head_dim": self.unet.config.attention_head_dim,
                "transformer_layers_per_block": self.unet.config.transformer_layers_per_block,
                "dtype": str(next(self.unet.parameters()).dtype),
                "device": str(next(self.unet.parameters()).device),
                "scheduler": type(self.scheduler).__name__
            }
        return {}


def create_unet(config: PipelineConfig = None) -> SDXLUNet:
    """Factory function to create optimized UNet"""
    if config is None:
        from . import get_optimal_rtx4090_config
        config = get_optimal_rtx4090_config()
    
    unet = SDXLUNet(config)
    unet.load()
    return unet


if __name__ == "__main__":
    # Test the UNet
    logging.basicConfig(level=logging.INFO)
    
    from . import get_optimal_rtx4090_config
    config = get_optimal_rtx4090_config()
    
    unet = create_unet(config)
    
    # Print model info
    info = unet.get_model_info()
    print(f"UNet info: {info}")
    
    # Run benchmark
    unet.benchmark(3)
