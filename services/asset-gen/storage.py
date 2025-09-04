# Storage Manager - Handles file storage and management
import os
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import aiofiles
import uuid
from datetime import datetime
from PIL import Image
import io

from fastapi import UploadFile
from config import Settings
from models import GeneratedAsset

logger = logging.getLogger(__name__)

class StorageManager:
    """Manages file storage for generated assets and reference images"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_path = Path(settings.output_dir)
        
        # Storage directories
        self.assets_dir = self.base_path / "assets"
        self.thumbnails_dir = self.base_path / "thumbnails"
        self.references_dir = self.base_path / "references"
        self.models_dir = self.base_path / "models"
        self.temp_dir = self.base_path / "temp"
        
        # URL generation
        self.base_url = f"http://{settings.host}:{settings.port}/static"
    
    async def initialize(self):
        """Initialize storage directories"""
        try:
            # Create directories
            directories = [
                self.assets_dir,
                self.thumbnails_dir,
                self.references_dir,
                self.models_dir,
                self.temp_dir
            ]
            
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                logger.info(f"📁 Storage directory ready: {directory}")
            
            logger.info("✅ Storage manager initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize storage: {e}")
            raise
    
    async def save_generated_asset(self, asset: GeneratedAsset) -> GeneratedAsset:
        """Save a generated asset to storage"""
        try:
            # Get the processed image from the asset (added by AI pipeline)
            if not hasattr(asset, 'processed_image'):
                raise ValueError("Asset has no processed image to save")
            
            image = asset.processed_image
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_id = str(uuid.uuid4())[:8]
            filename = f"{timestamp}_{file_id}_{asset.filename}"
            
            # Save paths
            asset_path = self.assets_dir / filename
            thumbnail_path = self.thumbnails_dir / f"thumb_{filename}"
            
            # Save main asset
            await self._save_image(image, asset_path, asset.format)
            
            # Generate and save thumbnail
            thumbnail = await self._generate_thumbnail(image)
            await self._save_image(thumbnail, thumbnail_path, "png")
            
            # Calculate file size
            file_size = asset_path.stat().st_size
            
            # Update asset with storage info
            asset.url = f"{self.base_url}/assets/{filename}"
            asset.thumbnail_url = f"{self.base_url}/thumbnails/thumb_{filename}"
            asset.filename = filename
            asset.file_size = file_size
            
            # Remove the processed image to avoid serialization issues
            delattr(asset, 'processed_image')
            
            logger.info(f"💾 Saved asset: {filename} ({file_size} bytes)")
            return asset
            
        except Exception as e:
            logger.error(f"❌ Failed to save asset: {e}")
            raise
    
    async def save_reference_image(self, upload_file: UploadFile) -> str:
        """Save uploaded reference image"""
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_id = str(uuid.uuid4())[:8]
            original_name = upload_file.filename or "reference"
            filename = f"{timestamp}_{file_id}_{original_name}"
            
            file_path = self.references_dir / filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await upload_file.read()
                await f.write(content)
            
            # Validate it's a valid image
            try:
                image = Image.open(file_path)
                image.verify()
            except Exception:
                # Delete invalid file
                file_path.unlink(missing_ok=True)
                raise ValueError("Invalid image file")
            
            file_url = f"{self.base_url}/references/{filename}"
            logger.info(f"📸 Saved reference image: {filename}")
            
            return file_url
            
        except Exception as e:
            logger.error(f"❌ Failed to save reference image: {e}")
            raise
    
    async def get_asset_path(self, asset_id: str) -> Optional[str]:
        """Get local path for asset download"""
        try:
            # Search for asset file
            for file_path in self.assets_dir.glob(f"*{asset_id}*"):
                if file_path.is_file():
                    return str(file_path)
            
            # Also check by exact filename
            asset_path = self.assets_dir / asset_id
            if asset_path.exists():
                return str(asset_path)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Failed to get asset path: {e}")
            return None
    
    async def delete_asset(self, asset_id: str) -> bool:
        """Delete an asset and its thumbnail"""
        try:
            deleted = False
            
            # Delete main asset
            for file_path in self.assets_dir.glob(f"*{asset_id}*"):
                if file_path.is_file():
                    file_path.unlink()
                    deleted = True
                    logger.info(f"🗑️ Deleted asset: {file_path.name}")
            
            # Delete thumbnail
            for file_path in self.thumbnails_dir.glob(f"*{asset_id}*"):
                if file_path.is_file():
                    file_path.unlink()
                    logger.info(f"🗑️ Deleted thumbnail: {file_path.name}")
            
            return deleted
            
        except Exception as e:
            logger.error(f"❌ Failed to delete asset: {e}")
            return False
    
    async def cleanup_temp_files(self, max_age_hours: int = 24):
        """Clean up temporary files older than specified age"""
        try:
            cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
            cleaned_count = 0
            
            for temp_file in self.temp_dir.glob("*"):
                if temp_file.is_file() and temp_file.stat().st_mtime < cutoff_time:
                    temp_file.unlink()
                    cleaned_count += 1
            
            if cleaned_count > 0:
                logger.info(f"🧹 Cleaned up {cleaned_count} temporary files")
            
        except Exception as e:
            logger.error(f"❌ Failed to cleanup temp files: {e}")
    
    async def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage usage statistics"""
        try:
            stats = {}
            
            # Count files and sizes in each directory
            for name, directory in {
                "assets": self.assets_dir,
                "thumbnails": self.thumbnails_dir,
                "references": self.references_dir,
                "models": self.models_dir,
                "temp": self.temp_dir
            }.items():
                if directory.exists():
                    files = list(directory.glob("*"))
                    file_count = len([f for f in files if f.is_file()])
                    total_size = sum(f.stat().st_size for f in files if f.is_file())
                    
                    stats[name] = {
                        "file_count": file_count,
                        "total_size_bytes": total_size,
                        "total_size_mb": round(total_size / (1024 * 1024), 2)
                    }
                else:
                    stats[name] = {"file_count": 0, "total_size_bytes": 0, "total_size_mb": 0}
            
            # Total stats
            total_files = sum(s["file_count"] for s in stats.values())
            total_size = sum(s["total_size_bytes"] for s in stats.values())
            
            stats["total"] = {
                "file_count": total_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "total_size_gb": round(total_size / (1024 * 1024 * 1024), 2)
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to get storage stats: {e}")
            return {}
    
    async def health_check(self) -> bool:
        """Check if storage is accessible"""
        try:
            # Test write access
            test_file = self.temp_dir / f"health_check_{uuid.uuid4()}.txt"
            
            async with aiofiles.open(test_file, 'w') as f:
                await f.write("health check")
            
            # Test read access
            async with aiofiles.open(test_file, 'r') as f:
                content = await f.read()
            
            # Cleanup test file
            test_file.unlink()
            
            return content == "health check"
            
        except Exception as e:
            logger.error(f"❌ Storage health check failed: {e}")
            return False
    
    async def _save_image(self, image: Image.Image, file_path: Path, format: str):
        """Save PIL image to file"""
        # Convert format
        if format.lower() == "jpg":
            format = "JPEG"
        
        # Save image
        with io.BytesIO() as buffer:
            image.save(buffer, format=format.upper())
            buffer.seek(0)
            
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(buffer.getvalue())
    
    async def _generate_thumbnail(self, image: Image.Image, size: tuple = (256, 256)) -> Image.Image:
        """Generate thumbnail from image"""
        # Create thumbnail maintaining aspect ratio
        thumbnail = image.copy()
        thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Create new image with consistent size and white background
        thumb_image = Image.new('RGB', size, 'white')
        
        # Center the thumbnail
        thumb_width, thumb_height = thumbnail.size
        x = (size[0] - thumb_width) // 2
        y = (size[1] - thumb_height) // 2
        
        thumb_image.paste(thumbnail, (x, y))
        
        return thumb_image
