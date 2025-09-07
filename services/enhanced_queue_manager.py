# Enhanced Redis Queue Management System
# Phase 1: Core Engine Stabilization - Redis Queue Overflow Fix

import asyncio
import redis.asyncio as redis
import json
import logging
import time
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class QueuePriority(Enum):
    """Queue priority levels"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    URGENT = 3

class JobStatus(Enum):
    """Job status states"""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

@dataclass
class QueueJob:
    """Queue job representation"""
    job_id: str
    user_id: str
    job_type: str
    payload: Dict[str, Any]
    priority: QueuePriority
    status: JobStatus
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3
    timeout_seconds: int = 300
    error_message: Optional[str] = None
    progress: float = 0.0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class RateLimiter:
    """Advanced rate limiting with user-based limits"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.limits = {
            "requests_per_minute": 10,
            "requests_per_hour": 100,
            "requests_per_day": 500,
            "concurrent_jobs": 3
        }
        
    async def check_rate_limit(self, user_id: str) -> tuple[bool, str]:
        """Check if user is within rate limits"""
        now = datetime.now()
        
        # Check minute limit
        minute_key = f"rate_limit:minute:{user_id}:{now.strftime('%Y-%m-%d:%H:%M')}"
        minute_count = await self.redis.get(minute_key)
        if minute_count and int(minute_count) >= self.limits["requests_per_minute"]:
            return False, "Rate limit exceeded: too many requests per minute"
        
        # Check hour limit
        hour_key = f"rate_limit:hour:{user_id}:{now.strftime('%Y-%m-%d:%H')}"
        hour_count = await self.redis.get(hour_key)
        if hour_count and int(hour_count) >= self.limits["requests_per_hour"]:
            return False, "Rate limit exceeded: too many requests per hour"
        
        # Check day limit
        day_key = f"rate_limit:day:{user_id}:{now.strftime('%Y-%m-%d')}"
        day_count = await self.redis.get(day_key)
        if day_count and int(day_count) >= self.limits["requests_per_day"]:
            return False, "Rate limit exceeded: too many requests per day"
        
        # Check concurrent jobs
        concurrent_jobs = await self.get_concurrent_jobs(user_id)
        if concurrent_jobs >= self.limits["concurrent_jobs"]:
            return False, "Rate limit exceeded: too many concurrent jobs"
        
        return True, "OK"
    
    async def increment_rate_limit(self, user_id: str):
        """Increment rate limit counters"""
        now = datetime.now()
        
        # Increment counters with expiration
        minute_key = f"rate_limit:minute:{user_id}:{now.strftime('%Y-%m-%d:%H:%M')}"
        hour_key = f"rate_limit:hour:{user_id}:{now.strftime('%Y-%m-%d:%H')}"
        day_key = f"rate_limit:day:{user_id}:{now.strftime('%Y-%m-%d')}"
        
        pipe = self.redis.pipeline()
        pipe.incr(minute_key)
        pipe.expire(minute_key, 60)
        pipe.incr(hour_key)
        pipe.expire(hour_key, 3600)
        pipe.incr(day_key)
        pipe.expire(day_key, 86400)
        await pipe.execute()
    
    async def get_concurrent_jobs(self, user_id: str) -> int:
        """Get count of concurrent jobs for user"""
        pattern = f"job:*:user:{user_id}:status:processing"
        keys = await self.redis.keys(pattern)
        return len(keys)

class DeadLetterQueue:
    """Dead letter queue for failed jobs"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.dlq_key = "dead_letter_queue"
        self.max_age_days = 7
    
    async def add_failed_job(self, job: QueueJob, error: str):
        """Add failed job to dead letter queue"""
        dlq_entry = {
            "job_id": job.job_id,
            "user_id": job.user_id,
            "job_type": job.job_type,
            "failed_at": datetime.now().isoformat(),
            "error": error,
            "retry_count": job.retry_count,
            "original_payload": job.payload
        }
        
        await self.redis.lpush(self.dlq_key, json.dumps(dlq_entry))
        
        # Maintain DLQ size (keep last 1000 entries)
        await self.redis.ltrim(self.dlq_key, 0, 999)
        
        logger.error(f"💀 Job {job.job_id} added to dead letter queue: {error}")
    
    async def get_failed_jobs(self, user_id: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get failed jobs from dead letter queue"""
        entries = await self.redis.lrange(self.dlq_key, 0, limit - 1)
        failed_jobs = []
        
        for entry in entries:
            try:
                job_data = json.loads(entry)
                if user_id is None or job_data.get("user_id") == user_id:
                    failed_jobs.append(job_data)
            except json.JSONDecodeError:
                continue
        
        return failed_jobs
    
    async def cleanup_old_entries(self):
        """Clean up old entries from DLQ"""
        cutoff_date = datetime.now() - timedelta(days=self.max_age_days)
        entries = await self.redis.lrange(self.dlq_key, 0, -1)
        
        valid_entries = []
        for entry in entries:
            try:
                job_data = json.loads(entry)
                failed_at = datetime.fromisoformat(job_data["failed_at"])
                if failed_at > cutoff_date:
                    valid_entries.append(entry)
            except (json.JSONDecodeError, ValueError, KeyError):
                continue
        
        # Replace DLQ with cleaned entries
        pipe = self.redis.pipeline()
        pipe.delete(self.dlq_key)
        if valid_entries:
            pipe.lpush(self.dlq_key, *valid_entries)
        await pipe.execute()

class EnhancedQueueManager:
    """Enhanced queue manager with overflow protection and monitoring"""
    
    def __init__(self, redis_client: redis.Redis, max_queue_size: int = 1000):
        self.redis = redis_client
        self.max_queue_size = max_queue_size
        self.rate_limiter = RateLimiter(redis_client)
        self.dlq = DeadLetterQueue(redis_client)
        
        # Queue keys by priority
        self.queue_keys = {
            QueuePriority.URGENT: "queue:urgent",
            QueuePriority.HIGH: "queue:high", 
            QueuePriority.NORMAL: "queue:normal",
            QueuePriority.LOW: "queue:low"
        }
        
        # Monitoring
        self.stats = {
            "jobs_queued": 0,
            "jobs_processed": 0,
            "jobs_failed": 0,
            "queue_overflows": 0
        }
        
        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._monitor_task: Optional[asyncio.Task] = None
        
    async def initialize(self):
        """Initialize queue manager"""
        # Start background tasks
        self._cleanup_task = asyncio.create_task(self._background_cleanup())
        self._monitor_task = asyncio.create_task(self._monitor_queues())
        
        logger.info("✅ Enhanced Queue Manager initialized")
    
    async def enqueue_job(self, 
                         user_id: str, 
                         job_type: str, 
                         payload: Dict[str, Any],
                         priority: QueuePriority = QueuePriority.NORMAL,
                         delay_seconds: int = 0) -> tuple[bool, str, Optional[str]]:
        """Enqueue job with rate limiting and overflow protection"""
        
        # Check rate limits
        allowed, reason = await self.rate_limiter.check_rate_limit(user_id)
        if not allowed:
            logger.warning(f"⚠️ Rate limit exceeded for user {user_id}: {reason}")
            return False, reason, None
        
        # Check queue overflow
        total_queue_size = await self._get_total_queue_size()
        if total_queue_size >= self.max_queue_size:
            self.stats["queue_overflows"] += 1
            logger.error(f"💥 Queue overflow: {total_queue_size}/{self.max_queue_size}")
            return False, "Queue is full, please try again later", None
        
        # Create job
        job_id = str(uuid.uuid4())
        now = datetime.now()
        scheduled_at = now + timedelta(seconds=delay_seconds) if delay_seconds > 0 else None
        
        job = QueueJob(
            job_id=job_id,
            user_id=user_id,
            job_type=job_type,
            payload=payload,
            priority=priority,
            status=JobStatus.QUEUED,
            created_at=now,
            scheduled_at=scheduled_at
        )
        
        # Store job data
        job_key = f"job:{job_id}"
        await self.redis.hset(job_key, mapping={
            "data": json.dumps(asdict(job), default=str),
            "user_id": user_id,
            "status": job.status.value
        })
        await self.redis.expire(job_key, 86400)  # 24 hour TTL
        
        # Add to appropriate queue
        queue_key = self.queue_keys[priority]
        if delay_seconds > 0:
            # Use sorted set for delayed jobs
            delay_queue_key = f"{queue_key}:delayed"
            score = time.time() + delay_seconds
            await self.redis.zadd(delay_queue_key, {job_id: score})
        else:
            await self.redis.lpush(queue_key, job_id)
        
        # Update rate limits and stats
        await self.rate_limiter.increment_rate_limit(user_id)
        self.stats["jobs_queued"] += 1
        
        # Add user job tracking
        user_jobs_key = f"user:{user_id}:jobs"
        await self.redis.sadd(user_jobs_key, job_id)
        await self.redis.expire(user_jobs_key, 86400)
        
        logger.info(f"📥 Job {job_id} queued for user {user_id} (priority: {priority.name})")
        return True, "Job queued successfully", job_id
    
    async def dequeue_job(self, timeout: int = 5) -> Optional[QueueJob]:
        """Dequeue job from highest priority queue"""
        # Check delayed jobs first
        await self._process_delayed_jobs()
        
        # Try each priority queue in order
        for priority in [QueuePriority.URGENT, QueuePriority.HIGH, QueuePriority.NORMAL, QueuePriority.LOW]:
            queue_key = self.queue_keys[priority]
            
            # Blocking pop with timeout
            result = await self.redis.brpop(queue_key, timeout=timeout)
            if result:
                _, job_id = result
                job_data = await self._get_job_data(job_id)
                if job_data:
                    # Update status to processing
                    await self._update_job_status(job_id, JobStatus.PROCESSING)
                    return job_data
        
        return None
    
    async def _process_delayed_jobs(self):
        """Move delayed jobs to active queues when ready"""
        now = time.time()
        
        for priority in QueuePriority:
            delay_queue_key = f"{self.queue_keys[priority]}:delayed"
            
            # Get ready jobs (score <= now)
            ready_jobs = await self.redis.zrangebyscore(delay_queue_key, 0, now)
            
            if ready_jobs:
                # Move to active queue
                queue_key = self.queue_keys[priority]
                pipe = self.redis.pipeline()
                
                for job_id in ready_jobs:
                    pipe.lpush(queue_key, job_id)
                    pipe.zrem(delay_queue_key, job_id)
                
                await pipe.execute()
                logger.debug(f"⏰ Moved {len(ready_jobs)} delayed jobs to {priority.name} queue")
    
    async def _get_job_data(self, job_id: str) -> Optional[QueueJob]:
        """Get job data from Redis"""
        job_key = f"job:{job_id}"
        job_data = await self.redis.hget(job_key, "data")
        
        if job_data:
            try:
                data = json.loads(job_data)
                # Convert datetime strings back to datetime objects
                data["created_at"] = datetime.fromisoformat(data["created_at"])
                if data["scheduled_at"]:
                    data["scheduled_at"] = datetime.fromisoformat(data["scheduled_at"])
                if data["started_at"]:
                    data["started_at"] = datetime.fromisoformat(data["started_at"])
                if data["completed_at"]:
                    data["completed_at"] = datetime.fromisoformat(data["completed_at"])
                
                # Convert enums
                data["priority"] = QueuePriority(data["priority"])
                data["status"] = JobStatus(data["status"])
                
                return QueueJob(**data)
            except (json.JSONDecodeError, ValueError, TypeError) as e:
                logger.error(f"❌ Failed to parse job data for {job_id}: {e}")
                return None
        
        return None
    
    async def _update_job_status(self, job_id: str, status: JobStatus, error: str = None):
        """Update job status in Redis"""
        job_key = f"job:{job_id}"
        job_data = await self._get_job_data(job_id)
        
        if job_data:
            job_data.status = status
            
            if status == JobStatus.PROCESSING:
                job_data.started_at = datetime.now()
            elif status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                job_data.completed_at = datetime.now()
                
            if error:
                job_data.error_message = error
            
            # Update in Redis
            await self.redis.hset(job_key, mapping={
                "data": json.dumps(asdict(job_data), default=str),
                "status": status.value
            })
            
            # Update user job tracking if completed/failed
            if status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                user_jobs_key = f"user:{job_data.user_id}:jobs"
                await self.redis.srem(user_jobs_key, job_id)
    
    async def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Mark job as completed"""
        await self._update_job_status(job_id, JobStatus.COMPLETED)
        self.stats["jobs_processed"] += 1
        
        # Store result
        result_key = f"job:{job_id}:result"
        await self.redis.set(result_key, json.dumps(result), ex=86400)
        
        logger.info(f"✅ Job {job_id} completed successfully")
    
    async def fail_job(self, job_id: str, error: str, retry: bool = True):
        """Mark job as failed and optionally retry"""
        job_data = await self._get_job_data(job_id)
        if not job_data:
            return
        
        job_data.retry_count += 1
        
        if retry and job_data.retry_count <= job_data.max_retries:
            # Retry with exponential backoff
            delay = min(300, 10 * (2 ** job_data.retry_count))  # Max 5 minutes
            
            success, reason, new_job_id = await self.enqueue_job(
                user_id=job_data.user_id,
                job_type=job_data.job_type,
                payload=job_data.payload,
                priority=job_data.priority,
                delay_seconds=delay
            )
            
            if success:
                logger.warning(f"🔄 Job {job_id} retrying as {new_job_id} (attempt {job_data.retry_count})")
                await self._update_job_status(job_id, JobStatus.CANCELLED, f"Retrying: {error}")
                return
        
        # Final failure
        await self._update_job_status(job_id, JobStatus.FAILED, error)
        await self.dlq.add_failed_job(job_data, error)
        self.stats["jobs_failed"] += 1
        
        logger.error(f"❌ Job {job_id} failed permanently: {error}")
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get comprehensive queue statistics"""
        queue_sizes = {}
        for priority, queue_key in self.queue_keys.items():
            size = await self.redis.llen(queue_key)
            delayed_size = await self.redis.zcard(f"{queue_key}:delayed")
            queue_sizes[priority.name.lower()] = {
                "active": size,
                "delayed": delayed_size,
                "total": size + delayed_size
            }
        
        total_size = sum(q["total"] for q in queue_sizes.values())
        
        return {
            "queue_sizes": queue_sizes,
            "total_queued": total_size,
            "max_queue_size": self.max_queue_size,
            "queue_utilization": (total_size / self.max_queue_size) * 100,
            "stats": self.stats.copy(),
            "dlq_size": await self.redis.llen(self.dlq.dlq_key)
        }
    
    async def _get_total_queue_size(self) -> int:
        """Get total number of jobs across all queues"""
        total = 0
        for priority, queue_key in self.queue_keys.items():
            total += await self.redis.llen(queue_key)
            total += await self.redis.zcard(f"{queue_key}:delayed")
        return total
    
    async def _background_cleanup(self):
        """Background cleanup task"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                # Clean up expired jobs
                await self._cleanup_expired_jobs()
                
                # Clean up old DLQ entries
                await self.dlq.cleanup_old_entries()
                
                logger.debug("🧹 Background cleanup completed")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background cleanup error: {e}")
    
    async def _monitor_queues(self):
        """Background queue monitoring"""
        while True:
            try:
                await asyncio.sleep(60)  # Monitor every minute
                
                stats = await self.get_queue_stats()
                
                # Log warnings for high queue utilization
                if stats["queue_utilization"] > 80:
                    logger.warning(f"⚠️ High queue utilization: {stats['queue_utilization']:.1f}%")
                
                # Log DLQ size if significant
                if stats["dlq_size"] > 10:
                    logger.warning(f"💀 Dead letter queue has {stats['dlq_size']} failed jobs")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Queue monitoring error: {e}")
    
    async def _cleanup_expired_jobs(self):
        """Clean up expired jobs"""
        cutoff = datetime.now() - timedelta(hours=24)
        
        # Find expired jobs
        pattern = "job:*"
        async for key in self.redis.scan_iter(match=pattern):
            job_data = await self.redis.hget(key, "data")
            if job_data:
                try:
                    data = json.loads(job_data)
                    created_at = datetime.fromisoformat(data["created_at"])
                    if created_at < cutoff:
                        await self.redis.delete(key)
                        await self.redis.delete(f"{key}:result")
                except (json.JSONDecodeError, ValueError, KeyError):
                    # Invalid job data, delete it
                    await self.redis.delete(key)
    
    async def shutdown(self):
        """Shutdown queue manager"""
        logger.info("🔄 Shutting down Enhanced Queue Manager...")
        
        # Cancel background tasks
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        if self._monitor_task and not self._monitor_task.done():
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("✅ Enhanced Queue Manager shutdown complete")
