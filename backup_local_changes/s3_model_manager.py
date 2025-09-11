# S3 Model Manager for SDXL Service
# Handles downloading and caching models from S3

import os
import json
import logging
import asyncio
from typing import Dict, List, Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import aiofiles
from pathlib import Path

logger = logging.getLogger(__name__)

class S3ModelManager:
    """Manages SDXL model downloads and caching from S3"""
    
    def __init__(self, 
                 bucket_name: str = "gameforge-models",
                 cache_dir: str = "/app/models",
                 region: str = "us-east-1"):
        self.bucket_name = bucket_name
        self.cache_dir = Path(cache_dir)
        self.region = region
        self.s3_client = None
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
    async def initialize(self) -> bool:
        """Initialize S3 client and verify connectivity"""
        try:
            # Initialize S3 client
            self.s3_client = boto3.client('s3', region_name=self.region)
            
            # Test connectivity
            await self._test_s3_connectivity()
            logger.info("✅ S3 Model Manager initialized successfully")
            return True
            
        except NoCredentialsError:
            logger.error("❌ AWS credentials not configured")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to initialize S3 Model Manager: {e}")
            return False
    
    async def _test_s3_connectivity(self):
        """Test S3 connectivity by listing bucket"""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, 
                lambda: self.s3_client.head_bucket(Bucket=self.bucket_name)
            )
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                raise Exception(f"S3 bucket '{self.bucket_name}' not found")
            elif error_code == '403':
                raise Exception(f"Access denied to S3 bucket '{self.bucket_name}'")
            else:
                raise Exception(f"S3 connectivity test failed: {e}")
    
    async def download_model(self, model_name: str, force_download: bool = False) -> str:
        """Download model from S3 to local cache"""
        model_cache_path = self.cache_dir / model_name
        
        # Check if model already exists locally
        if model_cache_path.exists() and not force_download:
            logger.info(f"📦 Model {model_name} already cached locally")
            return str(model_cache_path)
        
        logger.info(f"📥 Downloading model {model_name} from S3...")
        
        try:
            # Create model directory
            model_cache_path.mkdir(parents=True, exist_ok=True)
            
            # List all objects with the model prefix
            s3_prefix = f"{model_name}/"
            loop = asyncio.get_event_loop()
            
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket_name,
                Prefix=s3_prefix
            )
            
            download_tasks = []
            total_files = 0
            
            for page in page_iterator:
                if 'Contents' not in page:
                    continue
                    
                for obj in page['Contents']:
                    s3_key = obj['Key']
                    local_path = model_cache_path / s3_key[len(s3_prefix):]
                    
                    # Create parent directories
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Schedule download
                    task = self._download_file(s3_key, local_path)
                    download_tasks.append(task)
                    total_files += 1
            
            if total_files == 0:
                raise Exception(f"No files found for model {model_name} in S3")
            
            logger.info(f"📥 Downloading {total_files} files for {model_name}...")
            
            # Download all files concurrently (with limit)
            semaphore = asyncio.Semaphore(5)  # Limit concurrent downloads
            
            async def limited_download(task):
                async with semaphore:
                    return await task
            
            download_results = await asyncio.gather(
                *[limited_download(task) for task in download_tasks],
                return_exceptions=True
            )
            
            # Check for failures
            failed_downloads = [r for r in download_results if isinstance(r, Exception)]
            if failed_downloads:
                logger.error(f"❌ {len(failed_downloads)} files failed to download")
                for error in failed_downloads[:5]:  # Show first 5 errors
                    logger.error(f"   {error}")
                raise Exception(f"Failed to download {len(failed_downloads)} files")
            
            logger.info(f"✅ Successfully downloaded model {model_name}")
            return str(model_cache_path)
            
        except Exception as e:
            logger.error(f"❌ Failed to download model {model_name}: {e}")
            # Cleanup partial download
            if model_cache_path.exists():
                import shutil
                shutil.rmtree(model_cache_path, ignore_errors=True)
            raise
    
    async def _download_file(self, s3_key: str, local_path: Path):
        """Download a single file from S3"""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.s3_client.download_file(
                    self.bucket_name, s3_key, str(local_path)
                )
            )
            logger.debug(f"✅ Downloaded {s3_key}")
            
        except Exception as e:
            logger.error(f"❌ Failed to download {s3_key}: {e}")
            raise
    
    async def get_model_manifest(self) -> Optional[Dict]:
        """Get model manifest from S3"""
        try:
            manifest_key = "model-manifest.json"
            local_manifest = self.cache_dir / "manifest.json"
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.s3_client.download_file(
                    self.bucket_name, manifest_key, str(local_manifest)
                )
            )
            
            async with aiofiles.open(local_manifest, 'r') as f:
                manifest_data = await f.read()
                return json.loads(manifest_data)
                
        except Exception as e:
            logger.warning(f"⚠️ Could not load model manifest: {e}")
            return None
    
    async def list_available_models(self) -> List[str]:
        """List available models in S3 bucket"""
        try:
            loop = asyncio.get_event_loop()
            
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket_name,
                Delimiter='/'
            )
            
            models = set()
            for page in page_iterator:
                if 'CommonPrefixes' in page:
                    for prefix in page['CommonPrefixes']:
                        model_name = prefix['Prefix'].rstrip('/')
                        if model_name and model_name != 'model-manifest.json':
                            models.add(model_name)
            
            return list(models)
            
        except Exception as e:
            logger.error(f"❌ Failed to list available models: {e}")
            return []
    
    async def verify_model_integrity(self, model_name: str) -> bool:
        """Verify downloaded model integrity"""
        model_path = self.cache_dir / model_name
        if not model_path.exists():
            return False
        
        # Check for essential SDXL files
        essential_files = [
            "model_index.json",
            "unet/config.json", 
            "vae/config.json",
            "text_encoder/config.json",
            "text_encoder_2/config.json"
        ]
        
        for file_path in essential_files:
            if not (model_path / file_path).exists():
                logger.warning(f"⚠️ Missing essential file: {file_path}")
                return False
        
        logger.info(f"✅ Model {model_name} integrity verified")
        return True
    
    def get_model_path(self, model_name: str) -> str:
        """Get local path for cached model"""
        return str(self.cache_dir / model_name)

# Global S3 model manager instance
s3_model_manager: Optional[S3ModelManager] = None

async def get_s3_model_manager() -> S3ModelManager:
    """Get or create S3 model manager instance"""
    global s3_model_manager
    
    if s3_model_manager is None:
        bucket_name = os.getenv('S3_MODEL_BUCKET', 'gameforge-models')
        cache_dir = os.getenv('MODEL_CACHE_DIR', '/app/models')
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        
        s3_model_manager = S3ModelManager(bucket_name, cache_dir, region)
        await s3_model_manager.initialize()
    
    return s3_model_manager
