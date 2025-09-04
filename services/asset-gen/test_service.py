#!/usr/bin/env python3
"""
Simple startup script for the Asset Generation Service
Tests basic initialization without full GPU operations
"""

import asyncio
import logging
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_service():
    """Test service initialization"""
    try:
        logger.info("🧪 Testing Asset Generation Service initialization...")
        
        # Test imports
        logger.info("📦 Testing imports...")
        from config import Settings
        from models import GenerationRequest, AssetType, StyleType, QualityLevel
        logger.info("✅ Core imports successful")
        
        # Test settings
        logger.info("⚙️ Testing settings...")
        settings = Settings()
        logger.info(f"✅ Settings loaded - Debug mode: {settings.debug}")
        logger.info(f"📂 Output directory: {settings.output_dir}")
        logger.info(f"🔧 Base model: {settings.base_model_path}")
        
        # Test storage directories creation
        logger.info("📁 Testing storage setup...")
        from storage import StorageManager
        storage = StorageManager(settings)
        await storage.initialize()
        logger.info("✅ Storage manager initialized")
        
        # Test Redis connection (if available)
        logger.info("🔗 Testing Redis connection...")
        try:
            import redis.asyncio as redis
            redis_client = redis.from_url(
                f"redis://{settings.redis_host}:{settings.redis_port}",
                decode_responses=True
            )
            await redis_client.ping()
            logger.info("✅ Redis connection successful")
            await redis_client.close()
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed (this is OK for testing): {e}")
        
        # Test model validation
        logger.info("🤖 Testing request models...")
        test_request = GenerationRequest(
            prompt="test knight character",
            asset_type=AssetType.CHARACTER_DESIGN,
            style=StyleType.PIXEL_ART
        )
        logger.info(f"✅ Generated test request: {test_request.request_id}")
        
        logger.info("🎉 All basic tests passed! Service is ready for startup.")
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    success = await test_service()
    
    if success:
        logger.info("✅ Asset Generation Service validation complete!")
        logger.info("🚀 You can now start the service with:")
        logger.info("   python main.py")
        sys.exit(0)
    else:
        logger.error("❌ Validation failed - check errors above")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
