# SDXL Pipeline - Text Encoder Module
# Production-ready text encoding for RTX 4090
# Version: 2.0.0

"""
SDXL Text Encoder Module

Handles dual text encoding (CLIP + OpenCLIP) with RTX 4090 optimizations.
Includes prompt embellishment, negative prompting, and memory optimization.
"""

import torch
import torch.nn as nn
from transformers import CLIPTextModel, CLIPTokenizer
from transformers import CLIPTextModelWithProjection
import logging
from typing import List, Tuple, Optional, Dict
import re

from . import BaseSDXLModule, PipelineConfig, performance_monitor, model_cache

logger = logging.getLogger(__name__)


class PromptProcessor:
    """Advanced prompt processing and embellishment"""
    
    # Style presets for game assets
    GAME_STYLES = {
        "fantasy": "fantasy art, magical, mystical, epic, detailed, high quality",
        "sci-fi": "science fiction, futuristic, cyberpunk, high-tech, detailed",
        "realistic": "photorealistic, detailed, high resolution, professional",
        "cartoon": "cartoon style, animated, colorful, stylized",
        "pixel": "pixel art, 8-bit, retro gaming, pixelated",
        "concept": "concept art, detailed, professional, game development"
    }
    
    # Quality enhancers
    QUALITY_TERMS = [
        "high quality", "detailed", "professional", "masterpiece",
        "4k", "8k", "ultra detailed", "sharp focus", "cinematic"
    ]
    
    # Negative prompts for better quality
    DEFAULT_NEGATIVE = [
        "blurry", "low quality", "pixelated", "artifact", "jpeg",
        "watermark", "signature", "text", "logo", "deformed", "ugly"
    ]
    
    @staticmethod
    def enhance_prompt(prompt: str, style: str = "fantasy", 
                      quality: bool = True) -> str:
        """Enhance prompt for better game asset generation"""
        enhanced = prompt.strip()
        
        # Add style if specified
        if style in PromptProcessor.GAME_STYLES:
            style_terms = PromptProcessor.GAME_STYLES[style]
            enhanced = f"{enhanced}, {style_terms}"
        
        # Add quality terms
        if quality:
            quality_terms = ", ".join(PromptProcessor.QUALITY_TERMS[:3])
            enhanced = f"{enhanced}, {quality_terms}"
        
        return enhanced
    
    @staticmethod
    def get_negative_prompt(additional_negative: List[str] = None) -> str:
        """Get comprehensive negative prompt"""
        negative_terms = PromptProcessor.DEFAULT_NEGATIVE.copy()
        if additional_negative:
            negative_terms.extend(additional_negative)
        return ", ".join(negative_terms)
    
    @staticmethod
    def clean_prompt(prompt: str) -> str:
        """Clean and normalize prompt"""
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', prompt.strip())
        
        # Remove duplicate commas
        cleaned = re.sub(r',+', ',', cleaned)
        
        # Remove leading/trailing commas
        cleaned = cleaned.strip(', ')
        
        return cleaned


class SDXLTextEncoder(BaseSDXLModule):
    """SDXL Dual Text Encoder with RTX 4090 optimizations"""
    
    def __init__(self, config: PipelineConfig):
        super().__init__(config)
        
        self.text_encoder = None
        self.text_encoder_2 = None
        self.tokenizer = None
        self.tokenizer_2 = None
        
        self.prompt_processor = PromptProcessor()
        
    def load(self):
        """Load dual text encoders with optimizations"""
        performance_monitor.start_timer("text_encoder_load")
        
        try:
            self._setup_memory_management()
            
            # Load first text encoder (CLIP)
            cache_key_1 = f"text_encoder_1_{self.config.model_id}"
            self.text_encoder = model_cache.get(cache_key_1)
            
            if self.text_encoder is None:
                self.logger.info("Loading CLIP text encoder...")
                self.text_encoder = CLIPTextModel.from_pretrained(
                    self.config.model_id,
                    subfolder="text_encoder",
                    torch_dtype=self.dtype,
                    use_safetensors=True
                ).to(self.device)
                
                self.text_encoder = self._optimize_model(self.text_encoder)
                model_cache.put(cache_key_1, self.text_encoder)
            
            # Load tokenizer
            self.tokenizer = CLIPTokenizer.from_pretrained(
                self.config.model_id,
                subfolder="tokenizer",
                use_fast=False
            )
            
            # Load second text encoder (OpenCLIP)
            cache_key_2 = f"text_encoder_2_{self.config.model_id}"
            self.text_encoder_2 = model_cache.get(cache_key_2)
            
            if self.text_encoder_2 is None:
                self.logger.info("Loading OpenCLIP text encoder...")
                self.text_encoder_2 = CLIPTextModelWithProjection.from_pretrained(
                    self.config.model_id,
                    subfolder="text_encoder_2",
                    torch_dtype=self.dtype,
                    use_safetensors=True
                ).to(self.device)
                
                self.text_encoder_2 = self._optimize_model(self.text_encoder_2)
                model_cache.put(cache_key_2, self.text_encoder_2)
            
            # Load second tokenizer
            self.tokenizer_2 = CLIPTokenizer.from_pretrained(
                self.config.model_id,
                subfolder="tokenizer_2",
                use_fast=False
            )
            
            self.logger.info("Text encoders loaded successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to load text encoders: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("text_encoder_load")
            self.logger.info(f"Text encoder loading took {duration:.2f}s")
    
    def encode_prompt(self, prompt: str, negative_prompt: str = None,
                     style: str = "fantasy", enhance: bool = True) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode prompts using dual text encoders"""
        performance_monitor.start_timer("text_encoding")
        
        try:
            # Enhance prompts if requested
            if enhance:
                prompt = self.prompt_processor.enhance_prompt(prompt, style)
                if negative_prompt is None:
                    negative_prompt = self.prompt_processor.get_negative_prompt()
            
            # Clean prompts
            prompt = self.prompt_processor.clean_prompt(prompt)
            if negative_prompt:
                negative_prompt = self.prompt_processor.clean_prompt(negative_prompt)
            
            # Encode with first text encoder
            prompt_embeds_1, negative_embeds_1 = self._encode_with_clip(
                prompt, negative_prompt
            )
            
            # Encode with second text encoder
            prompt_embeds_2, negative_embeds_2 = self._encode_with_openclip(
                prompt, negative_prompt
            )
            
            # Concatenate embeddings
            prompt_embeds = torch.cat([prompt_embeds_1, prompt_embeds_2], dim=-1)
            negative_embeds = torch.cat([negative_embeds_1, negative_embeds_2], dim=-1)
            
            self.logger.debug(f"Encoded prompt: '{prompt[:50]}...'")
            self.logger.debug(f"Prompt embeddings shape: {prompt_embeds.shape}")
            
            return prompt_embeds, negative_embeds
            
        except Exception as e:
            self.logger.error(f"Prompt encoding failed: {e}")
            raise
        
        finally:
            duration = performance_monitor.end_timer("text_encoding")
            self.logger.debug(f"Text encoding took {duration:.3f}s")
    
    def _encode_with_clip(self, prompt: str, negative_prompt: str = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode with CLIP text encoder"""
        # Tokenize prompt
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            truncation=True,
            return_tensors="pt"
        ).input_ids.to(self.device)
        
        # Encode
        with torch.no_grad():
            prompt_embeds = self.text_encoder(text_inputs)[0]
        
        # Encode negative prompt
        if negative_prompt:
            negative_inputs = self.tokenizer(
                negative_prompt,
                padding="max_length",
                max_length=self.tokenizer.model_max_length,
                truncation=True,
                return_tensors="pt"
            ).input_ids.to(self.device)
            
            with torch.no_grad():
                negative_embeds = self.text_encoder(negative_inputs)[0]
        else:
            negative_embeds = torch.zeros_like(prompt_embeds)
        
        return prompt_embeds, negative_embeds
    
    def _encode_with_openclip(self, prompt: str, negative_prompt: str = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode with OpenCLIP text encoder"""
        # Tokenize prompt
        text_inputs = self.tokenizer_2(
            prompt,
            padding="max_length",
            max_length=self.tokenizer_2.model_max_length,
            truncation=True,
            return_tensors="pt"
        ).input_ids.to(self.device)
        
        # Encode
        with torch.no_grad():
            prompt_embeds = self.text_encoder_2(text_inputs)[0]
        
        # Encode negative prompt
        if negative_prompt:
            negative_inputs = self.tokenizer_2(
                negative_prompt,
                padding="max_length",
                max_length=self.tokenizer_2.model_max_length,
                truncation=True,
                return_tensors="pt"
            ).input_ids.to(self.device)
            
            with torch.no_grad():
                negative_embeds = self.text_encoder_2(negative_inputs)[0]
        else:
            negative_embeds = torch.zeros_like(prompt_embeds)
        
        return prompt_embeds, negative_embeds
    
    def process(self, prompt: str, negative_prompt: str = None, 
               style: str = "fantasy", enhance: bool = True) -> Dict[str, torch.Tensor]:
        """Process prompt and return embeddings"""
        prompt_embeds, negative_embeds = self.encode_prompt(
            prompt, negative_prompt, style, enhance
        )
        
        return {
            "prompt_embeds": prompt_embeds,
            "negative_prompt_embeds": negative_embeds,
            "original_prompt": prompt,
            "processed_prompt": self.prompt_processor.enhance_prompt(prompt, style) if enhance else prompt
        }
    
    def get_embeddings_info(self) -> Dict[str, any]:
        """Get information about embedding dimensions"""
        if self.text_encoder and self.text_encoder_2:
            return {
                "clip_dim": self.text_encoder.config.hidden_size,
                "openclip_dim": self.text_encoder_2.config.hidden_size,
                "total_dim": self.text_encoder.config.hidden_size + self.text_encoder_2.config.hidden_size,
                "max_length": self.tokenizer.model_max_length
            }
        return {}
    
    def benchmark(self, num_runs: int = 10) -> Dict[str, float]:
        """Benchmark text encoding performance"""
        self.logger.info(f"Running text encoding benchmark ({num_runs} runs)...")
        
        test_prompts = [
            "a fantasy sword with magical runes",
            "futuristic laser gun, sci-fi weapon",
            "medieval castle, stone walls, detailed architecture",
            "dragon breathing fire, epic fantasy creature"
        ]
        
        times = []
        for i in range(num_runs):
            start_time = torch.cuda.Event(enable_timing=True)
            end_time = torch.cuda.Event(enable_timing=True)
            
            prompt = test_prompts[i % len(test_prompts)]
            
            start_time.record()
            self.encode_prompt(prompt)
            end_time.record()
            
            torch.cuda.synchronize()
            elapsed = start_time.elapsed_time(end_time) / 1000.0  # Convert to seconds
            times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        results = {
            "average_time": avg_time,
            "min_time": min_time,
            "max_time": max_time,
            "throughput": 1.0 / avg_time  # prompts per second
        }
        
        self.logger.info(f"Benchmark results: {results}")
        return results


def create_text_encoder(config: PipelineConfig = None) -> SDXLTextEncoder:
    """Factory function to create optimized text encoder"""
    if config is None:
        from . import get_optimal_rtx4090_config
        config = get_optimal_rtx4090_config()
    
    encoder = SDXLTextEncoder(config)
    encoder.load()
    return encoder


if __name__ == "__main__":
    # Test the text encoder
    logging.basicConfig(level=logging.INFO)
    
    from . import get_optimal_rtx4090_config
    config = get_optimal_rtx4090_config()
    
    encoder = create_text_encoder(config)
    
    # Test encoding
    result = encoder.process("a magical sword glowing with blue energy")
    print(f"Embedding shape: {result['prompt_embeds'].shape}")
    print(f"Processed prompt: {result['processed_prompt']}")
    
    # Run benchmark
    encoder.benchmark(5)
