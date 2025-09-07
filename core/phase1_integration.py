# Phase 1 Integration - Core Engine Stabilization
# Integrates all Phase 1 fixes into GameForge system

import asyncio
import logging
import redis.asyncio as redis
from pathlib import Path

# Import Phase 1 components
from .enhanced_ai_pipeline import EnhancedAIPipeline
from .enhanced_queue_manager import EnhancedQueueManager
from .error_handling import initialize_error_handling, ErrorHandler, global_error_handler
from .migrations import initialize_migrations, run_pending_migrations

logger = logging.getLogger(__name__)


class Phase1Integration:
    """Integration manager for Phase 1 core stabilization"""
    
    def __init__(self, 
                 redis_url: str = "redis://localhost:6379",
                 db_path: str = "gameforge.db",
                 migrations_dir: str = "migrations"):
        self.redis_url = redis_url
        self.db_path = db_path
        self.migrations_dir = migrations_dir
        
        # Components
        self.redis_client = None
        self.ai_pipeline = None
        self.queue_manager = None
        self.error_handler = None
        self.migrator = None
        
    async def initialize(self) -> bool:
        """Initialize all Phase 1 components"""
        try:
            logger.info("🚀 Initializing Phase 1 Core Engine Stabilization...")
            
            # 1. Initialize Redis connection
            await self._initialize_redis()
            
            # 2. Initialize error handling system
            await self._initialize_error_handling()
            
            # 3. Initialize database migrations
            await self._initialize_migrations()
            
            # 4. Initialize enhanced AI pipeline
            await self._initialize_ai_pipeline()
            
            # 5. Initialize enhanced queue manager
            await self._initialize_queue_manager()
            
            # 6. Run health checks
            if await self._run_health_checks():
                logger.info("✅ Phase 1 initialization completed successfully")
                return True
            else:
                logger.error("❌ Phase 1 health checks failed")
                return False
                
        except Exception as e:
            logger.error(f"❌ Phase 1 initialization failed: {e}")
            if global_error_handler:
                await global_error_handler.handle_error(e)
            return False
    
    async def _initialize_redis(self):
        """Initialize Redis connection"""
        logger.info("🔧 Initializing Redis connection...")
        self.redis_client = redis.from_url(self.redis_url)
        
        # Test connection
        await self.redis_client.ping()
        logger.info("✅ Redis connection established")
    
    async def _initialize_error_handling(self):
        """Initialize centralized error handling"""
        logger.info("🔧 Initializing error handling system...")
        initialize_error_handling(self.redis_client)
        self.error_handler = global_error_handler
        logger.info("✅ Error handling system initialized")
    
    async def _initialize_migrations(self):
        """Initialize database migration system"""
        logger.info("🔧 Initializing database migrations...")
        
        # Ensure migrations directory exists
        Path(self.migrations_dir).mkdir(exist_ok=True)
        
        # Initialize migrator
        self.migrator = initialize_migrations(self.db_path, self.migrations_dir)
        
        # Run pending migrations
        logger.info("📋 Checking for pending migrations...")
        migration_success = await run_pending_migrations()
        
        if migration_success:
            logger.info("✅ Database migrations completed")
        else:
            logger.warning("⚠️ Some migrations failed - check logs")
    
    async def _initialize_ai_pipeline(self):
        """Initialize enhanced AI pipeline"""
        logger.info("🔧 Initializing enhanced AI pipeline...")
        
        # Create AI pipeline with GPU memory management
        self.ai_pipeline = EnhancedAIPipeline(
            redis_client=self.redis_client,
            model_cache_size=3,  # Keep 3 models in cache
            memory_threshold=0.8,  # Alert at 80% GPU memory usage
            cleanup_threshold=0.9  # Force cleanup at 90% usage
        )
        
        # Initialize the pipeline
        await self.ai_pipeline.initialize()
        logger.info("✅ Enhanced AI pipeline initialized")
    
    async def _initialize_queue_manager(self):
        """Initialize enhanced queue manager"""
        logger.info("🔧 Initializing enhanced queue manager...")
        
        # Create queue manager with rate limiting
        self.queue_manager = EnhancedQueueManager(
            redis_client=self.redis_client,
            max_queue_size=1000,
            rate_limit_per_minute=60,
            dead_letter_enabled=True
        )
        
        # Initialize the queue manager
        await self.queue_manager.initialize()
        logger.info("✅ Enhanced queue manager initialized")
    
    async def _run_health_checks(self) -> bool:
        """Run health checks on all components"""
        logger.info("🏥 Running Phase 1 health checks...")
        
        checks_passed = 0
        total_checks = 4
        
        # Check Redis
        try:
            await self.redis_client.ping()
            logger.info("✅ Redis health check passed")
            checks_passed += 1
        except Exception as e:
            logger.error(f"❌ Redis health check failed: {e}")
        
        # Check AI Pipeline
        try:
            if self.ai_pipeline and hasattr(self.ai_pipeline, 'is_healthy'):
                if await self.ai_pipeline.is_healthy():
                    logger.info("✅ AI Pipeline health check passed")
                    checks_passed += 1
                else:
                    logger.error("❌ AI Pipeline health check failed")
            else:
                logger.info("✅ AI Pipeline initialized (no health check)")
                checks_passed += 1
        except Exception as e:
            logger.error(f"❌ AI Pipeline health check failed: {e}")
        
        # Check Queue Manager
        try:
            if self.queue_manager and hasattr(self.queue_manager, 'is_healthy'):
                if await self.queue_manager.is_healthy():
                    logger.info("✅ Queue Manager health check passed")
                    checks_passed += 1
                else:
                    logger.error("❌ Queue Manager health check failed")
            else:
                logger.info("✅ Queue Manager initialized (no health check)")
                checks_passed += 1
        except Exception as e:
            logger.error(f"❌ Queue Manager health check failed: {e}")
        
        # Check Error Handler
        try:
            if self.error_handler:
                logger.info("✅ Error Handler health check passed")
                checks_passed += 1
            else:
                logger.error("❌ Error Handler not initialized")
        except Exception as e:
            logger.error(f"❌ Error Handler health check failed: {e}")
        
        success_rate = checks_passed / total_checks
        logger.info(f"🏥 Health checks completed: {checks_passed}/{total_checks} "
                   f"({success_rate:.1%})")
        
        return success_rate >= 0.75  # 75% success rate required
    
    async def get_system_status(self) -> dict:
        """Get comprehensive system status"""
        status = {
            "phase_1_status": "operational",
            "components": {},
            "metrics": {},
            "errors": []
        }
        
        try:
            # Redis status
            try:
                await self.redis_client.ping()
                status["components"]["redis"] = "healthy"
            except Exception as e:
                status["components"]["redis"] = f"unhealthy: {e}"
                status["errors"].append(f"Redis: {e}")
            
            # AI Pipeline status
            if self.ai_pipeline:
                try:
                    memory_info = await self.ai_pipeline.get_memory_info()
                    status["components"]["ai_pipeline"] = "healthy"
                    status["metrics"]["gpu_memory_usage"] = memory_info.get("usage_percent", 0)
                except Exception as e:
                    status["components"]["ai_pipeline"] = f"unhealthy: {e}"
                    status["errors"].append(f"AI Pipeline: {e}")
            else:
                status["components"]["ai_pipeline"] = "not_initialized"
            
            # Queue Manager status
            if self.queue_manager:
                try:
                    queue_stats = await self.queue_manager.get_queue_stats()
                    status["components"]["queue_manager"] = "healthy"
                    status["metrics"]["queue_size"] = queue_stats.get("total_jobs", 0)
                    status["metrics"]["pending_jobs"] = queue_stats.get("pending", 0)
                except Exception as e:
                    status["components"]["queue_manager"] = f"unhealthy: {e}"
                    status["errors"].append(f"Queue Manager: {e}")
            else:
                status["components"]["queue_manager"] = "not_initialized"
            
            # Error Handler status
            status["components"]["error_handler"] = "healthy" if self.error_handler else "not_initialized"
            
            # Overall status
            unhealthy_components = [k for k, v in status["components"].items() 
                                  if not v.startswith("healthy")]
            
            if not unhealthy_components:
                status["phase_1_status"] = "fully_operational"
            elif len(unhealthy_components) <= 1:
                status["phase_1_status"] = "degraded"
            else:
                status["phase_1_status"] = "critical"
            
        except Exception as e:
            status["phase_1_status"] = "error"
            status["errors"].append(f"Status check failed: {e}")
        
        return status
    
    async def shutdown(self):
        """Gracefully shutdown all components"""
        logger.info("🛑 Shutting down Phase 1 components...")
        
        try:
            # Shutdown queue manager
            if self.queue_manager:
                await self.queue_manager.shutdown()
                logger.info("✅ Queue Manager shutdown complete")
            
            # Shutdown AI pipeline
            if self.ai_pipeline:
                await self.ai_pipeline.shutdown()
                logger.info("✅ AI Pipeline shutdown complete")
            
            # Close Redis connection
            if self.redis_client:
                await self.redis_client.close()
                logger.info("✅ Redis connection closed")
            
            logger.info("✅ Phase 1 shutdown completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")
            if self.error_handler:
                await self.error_handler.handle_error(e)


# Global integration instance
phase1_integration: Optional[Phase1Integration] = None


async def initialize_phase1(redis_url: str = "redis://localhost:6379",
                           db_path: str = "gameforge.db",
                           migrations_dir: str = "migrations") -> bool:
    """Initialize Phase 1 integration globally"""
    global phase1_integration
    
    phase1_integration = Phase1Integration(redis_url, db_path, migrations_dir)
    return await phase1_integration.initialize()


async def get_phase1_status() -> dict:
    """Get Phase 1 system status"""
    if not phase1_integration:
        return {"phase_1_status": "not_initialized", "error": "Phase 1 not initialized"}
    
    return await phase1_integration.get_system_status()


async def shutdown_phase1():
    """Shutdown Phase 1 integration"""
    if phase1_integration:
        await phase1_integration.shutdown()


# Health check endpoint for containers
async def health_check() -> dict:
    """Health check endpoint for container orchestration"""
    if not phase1_integration:
        return {
            "status": "unhealthy",
            "reason": "Phase 1 not initialized"
        }
    
    try:
        status = await phase1_integration.get_system_status()
        
        if status["phase_1_status"] in ["operational", "fully_operational"]:
            return {"status": "healthy", "details": status}
        elif status["phase_1_status"] == "degraded":
            return {"status": "degraded", "details": status}
        else:
            return {"status": "unhealthy", "details": status}
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "reason": f"Health check failed: {e}"
        }


if __name__ == "__main__":
    # Quick test of Phase 1 integration
    async def test_phase1():
        logger.info("🧪 Testing Phase 1 integration...")
        
        success = await initialize_phase1()
        if success:
            logger.info("✅ Phase 1 integration test passed")
            status = await get_phase1_status()
            logger.info(f"📊 System Status: {status['phase_1_status']}")
        else:
            logger.error("❌ Phase 1 integration test failed")
        
        await shutdown_phase1()
    
    asyncio.run(test_phase1())
