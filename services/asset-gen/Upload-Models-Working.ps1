# GameForge Phase B - Model Upload Script (Working Version)
# Downloads SDXL models from HuggingFace and uploads to S3

param(
    [string]$ConfigFile = "aws-config.json"
)

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    $colors = @{
        'Red' = 'Red'; 'Green' = 'Green'; 'Yellow' = 'Yellow'; 
        'Blue' = 'Blue'; 'Magenta' = 'Magenta'; 'Cyan' = 'Cyan'
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput Cyan "Starting Phase B: Model Upload"

# Load configuration
if (!(Test-Path $ConfigFile)) {
    Write-ColorOutput Red "Configuration file $ConfigFile not found. Run Phase A first."
    exit 1
}

$Config = Get-Content $ConfigFile | ConvertFrom-Json
$BucketName = $Config.S3_BUCKET
$Region = $Config.REGION

Write-ColorOutput Yellow "Configuration loaded:"
Write-ColorOutput White "  S3 Bucket: $BucketName"
Write-ColorOutput White "  Region: $Region"
Write-ColorOutput White ""

# Create models directory
$ModelsDir = "models"
if (!(Test-Path $ModelsDir)) {
    New-Item -ItemType Directory -Path $ModelsDir
    Write-ColorOutput Green "Created models directory"
}

Write-ColorOutput Yellow "Phase B will download and upload SDXL model (~7GB)"
Write-ColorOutput Yellow "This process takes approximately 30-45 minutes"
Write-ColorOutput Yellow "Press any key to continue or Ctrl+C to cancel..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-ColorOutput Cyan "Starting model download and upload..."

# Create Python script for HuggingFace download
$PythonScript = @'
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
'@

$PythonScript | Out-File -FilePath "download_models.py" -Encoding UTF8

# Run the Python download script
Write-ColorOutput Yellow "📥 Starting HuggingFace model download..."
python download_models.py

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Model download failed"
    exit 1
}

# Upload to S3
Write-ColorOutput Yellow "☁️ Uploading models to S3 bucket: $BucketName"

$ModelPath = "models/stable-diffusion-xl-base-1.0"
if (Test-Path $ModelPath) {
    Write-ColorOutput Yellow "Uploading SDXL model to S3..."
    aws s3 sync $ModelPath "s3://$BucketName/stable-diffusion-xl-base-1.0/" --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ SDXL model uploaded successfully!"
    } else {
        Write-ColorOutput Red "❌ Model upload failed"
        exit 1
    }
} else {
    Write-ColorOutput Red "❌ Model directory not found: $ModelPath"
    exit 1
}

# Create and upload manifest
$Manifest = @{
    models = @{
        "stable-diffusion-xl-base-1.0" = @{
            type = "diffusers"
            path = "stable-diffusion-xl-base-1.0"
            size_gb = 6.94
            uploaded = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
        }
    }
    bucket = $BucketName
    region = $Region
    created = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
}

$Manifest | ConvertTo-Json -Depth 3 | Out-File -FilePath "model-manifest.json" -Encoding UTF8
aws s3 cp "model-manifest.json" "s3://$BucketName/model-manifest.json" --region $Region

Write-ColorOutput Green ""
Write-ColorOutput Green "🎉 Phase B Complete - Model Upload Successful!"
Write-ColorOutput Green "📋 Summary:"
Write-ColorOutput White "  ✅ S3 Bucket: $BucketName"
Write-ColorOutput White "  ✅ SDXL Model: stable-diffusion-xl-base-1.0"
Write-ColorOutput White "  ✅ Manifest: s3://$BucketName/model-manifest.json"
Write-ColorOutput White "  ✅ Size: ~7GB uploaded"

Write-ColorOutput Cyan ""
Write-ColorOutput Cyan "🚀 Ready for Phase C: Container Build & Deploy"
Write-ColorOutput Yellow "Next steps:"
Write-ColorOutput White "  1. docker build -t gameforge-sdxl-service ."
Write-ColorOutput White "  2. Push to ECR and deploy to ECS"

# Cleanup
Remove-Item "download_models.py" -ErrorAction SilentlyContinue
Remove-Item "model-manifest.json" -ErrorAction SilentlyContinue

Write-ColorOutput Green "Phase B Model Upload Complete! 🎮"
