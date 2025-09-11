import os
import json
from huggingface_hub import snapshot_download
import sys

def download_sdxl_model(cache_dir="./models"):
    """Download SDXL model from HuggingFace"""
    model_id = "stabilityai/stable-diffusion-xl-base-1.0"
    
    print(f"📥 Downloading {model_id}...")
    print("This will take 20-30 minutes depending on your internet connection...")
    
    try:
        # Download the model
        model_path = snapshot_download(
            repo_id=model_id,
            cache_dir=cache_dir,
            local_dir=os.path.join(cache_dir, "stable-diffusion-xl-base-1.0"),
            local_dir_use_symlinks=False
        )
        
        print(f"✅ Model downloaded to: {model_path}")
        return model_path
    
    except Exception as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_sdxl_model()
