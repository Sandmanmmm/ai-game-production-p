# SDXL Pipeline - Core Base Module
# Production-ready modular SDXL implementation for RTX 4090
# Version: 2.0.0

"""
Core SDXL Pipeline Module - Base Classes and Utilities

This module provides the foundational classes and utilities for the
production-ready SDXL pipeline optimized for RTX 4090.
"""

import torch
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPUMode(Enum):
    """GPU acceleration modes"""
    AUTO = "auto"
    CUDA = "cuda"
    CPU = "cpu"
    MPS = "mps"  # Apple Silicon

class PrecisionMode(Enum):
    """Model precision modes"""
    FP16 = "fp16"
    FP32 = "fp32"
    BF16 = "bf16"

@dataclass
class PipelineConfig:
    """Configuration for SDXL Pipeline"""
    # Device Configuration
    device: str = "cuda"
    gpu_mode: GPUMode = GPUMode.AUTO
    precision: PrecisionMode = PrecisionMode.FP16
    
    # RTX 4090 Optimizations
    enable_memory_efficient_attention: bool = True
    enable_xformers: bool = True
    enable_torch_compile: bool = True
    memory_fraction: float = 0.9
    
    # Pipeline Settings
    num_inference_steps: int = 25
    guidance_scale: float = 7.5
    width: int = 1024
    height: int = 1024
    
    # Performance Settings
    batch_size: int = 1
    max_sequence_length: int = 77
    
    # Model Settings
    model_id: str = "stabilityai/stable-diffusion-xl-base-1.0"
    refiner_id: str = "stabilityai/stable-diffusion-xl-refiner-1.0"
    use_refiner: bool = True
    
    # Safety and Quality
    enable_safety_checker: bool = True
    enable_watermark: bool = False
    
    # Cache Settings
    enable_model_cpu_offload: bool = False
    enable_sequential_cpu_offload: bool = False
    
    # RTX 4090 Specific
    cuda_memory_fraction: float = 0.95
    torch_deterministic: bool = False

class BaseSDXLModule(ABC):
    """Base class for all SDXL pipeline modules"""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.device = self._setup_device()
        self.dtype = self._setup_dtype()
        self.logger = logging.getLogger(self.__class__.__name__)
        
    def _setup_device(self) -> torch.device:
        """Setup optimal device for RTX 4090"""
        if self.config.gpu_mode == GPUMode.AUTO:
            if torch.cuda.is_available():
                device = torch.device("cuda")
                # RTX 4090 specific optimizations
                if torch.cuda.get_device_capability()[0] >= 8:  # Ampere+
                    torch.backends.cuda.matmul.allow_tf32 = True
                    torch.backends.cudnn.allow_tf32 = True
                self.logger.info(f"Using CUDA device: {torch.cuda.get_device_name()}")
            elif torch.backends.mps.is_available():
                device = torch.device("mps")
                self.logger.info("Using MPS device")
            else:
                device = torch.device("cpu")
                self.logger.info("Using CPU device")
        else:
            device = torch.device(self.config.gpu_mode.value)
            
        return device
    
    def _setup_dtype(self) -> torch.dtype:
        """Setup optimal data type"""
        if self.config.precision == PrecisionMode.FP16:
            return torch.float16
        elif self.config.precision == PrecisionMode.BF16:
            return torch.bfloat16
        else:
            return torch.float32
    
    def _optimize_model(self, model: torch.nn.Module) -> torch.nn.Module:
        """Apply RTX 4090 specific optimizations"""
        try:
            # Enable memory efficient attention
            if self.config.enable_memory_efficient_attention:
                if hasattr(model, 'enable_attention_slicing'):
                    model.enable_attention_slicing()
                    self.logger.info("Enabled attention slicing")
            
            # Enable XFormers if available
            if self.config.enable_xformers:
                try:
                    model.enable_xformers_memory_efficient_attention()
                    self.logger.info("Enabled XFormers memory efficient attention")
                except Exception as e:
                    self.logger.warning(f"Could not enable XFormers: {e}")
            
            # Torch compile for RTX 4090
            if self.config.enable_torch_compile and hasattr(torch, 'compile'):
                try:
                    model = torch.compile(model, mode="reduce-overhead")
                    self.logger.info("Enabled torch.compile optimization")
                except Exception as e:
                    self.logger.warning(f"Could not enable torch.compile: {e}")
            
            return model
            
        except Exception as e:
            self.logger.error(f"Model optimization failed: {e}")
            return model
    
    def _setup_memory_management(self):
        """Setup memory management for RTX 4090"""
        if torch.cuda.is_available():
            # Set memory fraction for RTX 4090 (24GB)
            torch.cuda.set_per_process_memory_fraction(self.config.cuda_memory_fraction)
            
            # Empty cache
            torch.cuda.empty_cache()
            
            # Log memory stats
            if torch.cuda.is_available():
                memory_allocated = torch.cuda.memory_allocated() / 1024**3
                memory_reserved = torch.cuda.memory_reserved() / 1024**3
                total_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                
                self.logger.info(f"GPU Memory - Allocated: {memory_allocated:.2f}GB, "
                               f"Reserved: {memory_reserved:.2f}GB, "
                               f"Total: {total_memory:.2f}GB")
    
    def cleanup(self):
        """Cleanup resources"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
    
    @abstractmethod
    def load(self):
        """Load the module"""
        pass
    
    @abstractmethod
    def process(self, *args, **kwargs):
        """Process input through the module"""
        pass

class PerformanceMonitor:
    """Monitor pipeline performance"""
    
    def __init__(self):
        self.metrics = {}
        self.start_times = {}
    
    def start_timer(self, name: str):
        """Start timing an operation"""
        self.start_times[name] = time.time()
    
    def end_timer(self, name: str):
        """End timing an operation"""
        if name in self.start_times:
            duration = time.time() - self.start_times[name]
            if name not in self.metrics:
                self.metrics[name] = []
            self.metrics[name].append(duration)
            del self.start_times[name]
            return duration
        return None
    
    def get_average_time(self, name: str) -> float:
        """Get average time for an operation"""
        if name in self.metrics and self.metrics[name]:
            return sum(self.metrics[name]) / len(self.metrics[name])
        return 0.0
    
    def get_metrics(self) -> Dict[str, float]:
        """Get all performance metrics"""
        return {
            name: self.get_average_time(name) 
            for name in self.metrics.keys()
        }
    
    def log_gpu_memory(self):
        """Log current GPU memory usage"""
        if torch.cuda.is_available():
            memory_allocated = torch.cuda.memory_allocated() / 1024**3
            memory_reserved = torch.cuda.memory_reserved() / 1024**3
            logger.info(f"GPU Memory - Allocated: {memory_allocated:.2f}GB, "
                       f"Reserved: {memory_reserved:.2f}GB")

class ModelCache:
    """Intelligent model caching system"""
    
    def __init__(self, max_cache_size: int = 3):
        self.cache = {}
        self.access_times = {}
        self.max_cache_size = max_cache_size
    
    def get(self, key: str):
        """Get model from cache"""
        if key in self.cache:
            self.access_times[key] = time.time()
            return self.cache[key]
        return None
    
    def put(self, key: str, model):
        """Put model in cache with LRU eviction"""
        if len(self.cache) >= self.max_cache_size:
            # Remove least recently used
            oldest_key = min(self.access_times.keys(), 
                           key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
            torch.cuda.empty_cache()  # Clean up GPU memory
        
        self.cache[key] = model
        self.access_times[key] = time.time()
    
    def clear(self):
        """Clear all cached models"""
        self.cache.clear()
        self.access_times.clear()
        torch.cuda.empty_cache()

# Global instances
performance_monitor = PerformanceMonitor()
model_cache = ModelCache()

def get_optimal_rtx4090_config() -> PipelineConfig:
    """Get optimal configuration for RTX 4090"""
    return PipelineConfig(
        device="cuda",
        gpu_mode=GPUMode.CUDA,
        precision=PrecisionMode.FP16,
        enable_memory_efficient_attention=True,
        enable_xformers=True,
        enable_torch_compile=True,
        memory_fraction=0.9,
        cuda_memory_fraction=0.95,
        num_inference_steps=25,
        guidance_scale=7.5,
        width=1024,
        height=1024,
        batch_size=1,
        enable_safety_checker=True,
        enable_model_cpu_offload=False,
        enable_sequential_cpu_offload=False
    )

def log_system_info():
    """Log system information for debugging"""
    logger.info("=== System Information ===")
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        logger.info(f"CUDA version: {torch.version.cuda}")
        logger.info(f"GPU count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            logger.info(f"GPU {i}: {props.name} ({props.total_memory / 1024**3:.1f}GB)")
            logger.info(f"GPU {i}: Compute capability {props.major}.{props.minor}")
    
    logger.info("=== Configuration ===")

if __name__ == "__main__":
    log_system_info()
    config = get_optimal_rtx4090_config()
    logger.info(f"Optimal RTX 4090 config created: {config}")
