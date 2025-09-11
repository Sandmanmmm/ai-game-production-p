# GameForge Model Upload Script - Upload SDXL models to S3
# This script downloads SDXL models from HuggingFace and uploads them to S3

param(
    [string]$BucketName = "gameforge-models",
    [string]$Region = "us-east-1",
    [switch]$SkipDownload = $false
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "📦 Starting SDXL Model Upload to S3"

# Create local model cache directory
$ModelCacheDir = ".\model-cache"
if (-not (Test-Path $ModelCacheDir)) {
    New-Item -ItemType Directory -Path $ModelCacheDir
}

# SDXL Model Configuration
$Models = @{
    "sdxl-base" = @{
        "huggingface_id" = "stabilityai/stable-diffusion-xl-base-1.0"
        "s3_prefix" = "sdxl-base"
        "files" = @(
            "model_index.json",
            "scheduler/scheduler_config.json",
            "text_encoder/config.json",
            "text_encoder/pytorch_model.bin",
            "text_encoder_2/config.json",
            "text_encoder_2/pytorch_model.bin", 
            "tokenizer/tokenizer_config.json",
            "tokenizer/vocab.json",
            "tokenizer/merges.txt",
            "tokenizer_2/tokenizer_config.json",
            "tokenizer_2/vocab.json",
            "tokenizer_2/merges.txt", 
            "unet/config.json",
            "unet/diffusion_pytorch_model.safetensors",
            "vae/config.json",
            "vae/diffusion_pytorch_model.safetensors"
        )
    }
}

# Check if Python and required packages are available
if (-not $SkipDownload) {
    Write-ColorOutput Yellow "🔍 Checking Python environment..."
    
    # Create a simple Python script to download models
    $DownloadScript = @"
import os
import sys
from huggingface_hub import snapshot_download
import shutil

def download_model(model_id, cache_dir, files):
    print(f"📥 Downloading {model_id}...")
    try:
        # Download specific files
        for file in files:
            print(f"  • Downloading {file}")
            snapshot_download(
                repo_id=model_id,
                cache_dir=cache_dir,
                allow_patterns=[file],
                local_dir=os.path.join(cache_dir, model_id.replace('/', '_')),
                local_dir_use_symlinks=False
            )
        print(f"✅ Successfully downloaded {model_id}")
        return True
    except Exception as e:
        print(f"❌ Failed to download {model_id}: {str(e)}")
        return False

# Download SDXL Base model
model_id = "stabilityai/stable-diffusion-xl-base-1.0"
cache_dir = "./model-cache"
files = [
    "model_index.json",
    "scheduler/scheduler_config.json", 
    "text_encoder/config.json",
    "text_encoder/pytorch_model.bin",
    "text_encoder_2/config.json",
    "text_encoder_2/pytorch_model.bin",
    "tokenizer/tokenizer_config.json",
    "tokenizer/vocab.json", 
    "tokenizer/merges.txt",
    "tokenizer_2/tokenizer_config.json",
    "tokenizer_2/vocab.json",
    "tokenizer_2/merges.txt",
    "unet/config.json",
    "unet/diffusion_pytorch_model.safetensors",
    "vae/config.json", 
    "vae/diffusion_pytorch_model.safetensors"
]

success = download_model(model_id, cache_dir, files)
sys.exit(0 if success else 1)
"@

    $DownloadScript | Out-File -FilePath "download_models.py" -Encoding UTF8
    
    Write-ColorOutput Yellow "📥 Downloading SDXL models from HuggingFace..."
    python download_models.py
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to download models. Please check your Python environment and huggingface_hub installation."
        Write-ColorOutput Yellow "💡 Try running: pip install huggingface_hub"
        exit 1
    }
    
    Remove-Item "download_models.py"
}

# Upload models to S3
Write-ColorOutput Yellow "☁️ Uploading models to S3..."

foreach ($ModelName in $Models.Keys) {
    $ModelConfig = $Models[$ModelName]
    $LocalPath = Join-Path $ModelCacheDir ($ModelConfig.huggingface_id -replace '/', '_')
    $S3Prefix = "s3://$BucketName/$($ModelConfig.s3_prefix)/"
    
    Write-ColorOutput Yellow "📤 Uploading $ModelName to $S3Prefix"
    
    if (Test-Path $LocalPath) {
        # Upload the entire model directory
        aws s3 sync $LocalPath $S3Prefix --region $Region --delete
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✅ Successfully uploaded $ModelName"
        } else {
            Write-ColorOutput Red "❌ Failed to upload $ModelName"
        }
    } else {
        Write-ColorOutput Yellow "⚠️ Local model path not found: $LocalPath"
        Write-ColorOutput Yellow "   Skipping $ModelName upload"
    }
}

# Create model manifest file
Write-ColorOutput Yellow "📝 Creating model manifest..."
$Manifest = @{
    "created_at" = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    "bucket" = $BucketName
    "region" = $Region
    "models" = $Models
}

$ManifestJson = $Manifest | ConvertTo-Json -Depth 5
$ManifestJson | Out-File -FilePath "model-manifest.json" -Encoding UTF8

# Upload manifest to S3
aws s3 cp model-manifest.json "s3://$BucketName/model-manifest.json" --region $Region

Write-ColorOutput Green "🎉 Model upload completed successfully!"
Write-ColorOutput Green "📋 Summary:"
Write-Output "  • S3 Bucket: $BucketName"
Write-Output "  • Models uploaded: $($Models.Keys -join ', ')"
Write-Output "  • Manifest: s3://$BucketName/model-manifest.json"

# Cleanup
Remove-Item "model-manifest.json" -ErrorAction SilentlyContinue

Write-ColorOutput Yellow "📝 Next Steps:"
Write-Output "  1. Verify model files in S3 console"
Write-Output "  2. Update ECS task definition to use S3 models"  
Write-Output "  3. Deploy ECS service with GPU instances"
