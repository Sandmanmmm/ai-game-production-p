# Centralized Error Handling System
# Phase 1: Core Engine Stabilization - Error Handling Fix

import logging
import traceback
import sys
import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Callable, Type, Union
from datetime import datetime, timedelta
from contextlib import contextmanager, asynccontextmanager
from functools import wraps
from enum import Enum
import redis.asyncio as redis
from dataclasses import dataclass, asdict
import uuid


class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories for classification"""
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    RESOURCE = "resource"
    NETWORK = "network"
    DATABASE = "database"
    AI_MODEL = "ai_model"
    GPU_MEMORY = "gpu_memory"
    QUEUE = "queue"
    SYSTEM = "system"
    UNKNOWN = "unknown"


@dataclass
class ErrorContext:
    """Error context information"""
    error_id: str
    timestamp: datetime
    severity: ErrorSeverity
    category: ErrorCategory
    message: str
    exception_type: str
    stack_trace: str
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class ErrorAggregator:
    """Aggregate and analyze error patterns"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.error_patterns: Dict[str, int] = {}
        
    async def track_error(self, error_context: ErrorContext):
        """Track error for pattern analysis"""
        # Create error pattern key
        pattern_key = f"{error_context.category.value}:{error_context.exception_type}"
        
        # Track in Redis with time window
        hour_key = f"errors:hour:{datetime.now().strftime('%Y-%m-%d:%H')}:{pattern_key}"
        day_key = f"errors:day:{datetime.now().strftime('%Y-%m-%d')}:{pattern_key}"
        
        pipe = self.redis.pipeline()
        pipe.incr(hour_key)
        pipe.expire(hour_key, 3600)  # 1 hour TTL
        pipe.incr(day_key)
        pipe.expire(day_key, 86400)  # 24 hour TTL
        await pipe.execute()
        
        # Check for error spikes
        await self._check_error_spikes(pattern_key)
    
    async def _check_error_spikes(self, pattern_key: str):
        """Check for unusual error spikes"""
        hour_key = f"errors:hour:{datetime.now().strftime('%Y-%m-%d:%H')}:{pattern_key}"
        count = await self.redis.get(hour_key)
        
        if count and int(count) > 10:  # More than 10 errors of same type per hour
            logger.warning(f"🚨 Error spike detected: {pattern_key} - {count} occurrences this hour")
    
    async def get_error_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get error statistics for the specified time period"""
        stats = {
            "total_errors": 0,
            "by_category": {},
            "by_severity": {},
            "top_errors": []
        }
        
        # Get all error keys for the time period
        pattern = f"errors:hour:*"
        error_counts = {}
        
        async for key in self.redis.scan_iter(match=pattern):
            count = await self.redis.get(key)
            if count:
                # Parse the key to extract pattern
                parts = key.split(":", 3)
                if len(parts) == 4:
                    pattern_key = parts[3]
                    error_counts[pattern_key] = error_counts.get(pattern_key, 0) + int(count)
        
        # Aggregate statistics
        stats["total_errors"] = sum(error_counts.values())
        
        # Top errors
        sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
        stats["top_errors"] = sorted_errors[:10]
        
        return stats


class EnhancedLogger:
    """Enhanced logger with structured logging"""
    
    def __init__(self, name: str, redis_client: Optional[redis.Redis] = None):
        self.logger = logging.getLogger(name)
        self.redis = redis_client
        self.error_aggregator = ErrorAggregator(redis_client) if redis_client else None
        
        # Setup structured logging format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s - '
            '[%(filename)s:%(lineno)d] - %(funcName)s()'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler for errors
        file_handler = logging.FileHandler('gameforge_errors.log')
        file_handler.setLevel(logging.ERROR)
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        self.logger.setLevel(logging.INFO)
    
    async def log_error(self, 
                       error: Exception, 
                       severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                       category: ErrorCategory = ErrorCategory.UNKNOWN,
                       user_id: Optional[str] = None,
                       request_id: Optional[str] = None,
                       endpoint: Optional[str] = None,
                       metadata: Optional[Dict[str, Any]] = None):
        """Log error with enhanced context"""
        
        error_context = ErrorContext(
            error_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            severity=severity,
            category=category,
            message=str(error),
            exception_type=type(error).__name__,
            stack_trace=traceback.format_exc(),
            user_id=user_id,
            request_id=request_id,
            endpoint=endpoint,
            metadata=metadata or {}
        )
        
        # Log to standard logger
        log_message = self._format_error_message(error_context)
        
        if severity == ErrorSeverity.CRITICAL:
            self.logger.critical(log_message)
        elif severity == ErrorSeverity.HIGH:
            self.logger.error(log_message)
        elif severity == ErrorSeverity.MEDIUM:
            self.logger.warning(log_message)
        else:
            self.logger.info(log_message)
        
        # Store in Redis for analysis
        if self.redis:
            await self._store_error_context(error_context)
            
        # Track patterns
        if self.error_aggregator:
            await self.error_aggregator.track_error(error_context)
    
    def _format_error_message(self, context: ErrorContext) -> str:
        """Format error message with context"""
        parts = [
            f"[{context.error_id}]",
            f"[{context.severity.value.upper()}]",
            f"[{context.category.value}]",
            context.message
        ]
        
        if context.user_id:
            parts.append(f"user:{context.user_id}")
        if context.request_id:
            parts.append(f"request:{context.request_id}")
        if context.endpoint:
            parts.append(f"endpoint:{context.endpoint}")
            
        return " - ".join(parts)
    
    async def _store_error_context(self, context: ErrorContext):
        """Store error context in Redis"""
        error_key = f"error:{context.error_id}"
        await self.redis.hset(error_key, mapping={
            "data": json.dumps(asdict(context), default=str),
            "severity": context.severity.value,
            "category": context.category.value,
            "timestamp": context.timestamp.isoformat()
        })
        await self.redis.expire(error_key, 604800)  # 7 days TTL


class ErrorHandler:
    """Centralized error handler with recovery strategies"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.enhanced_logger = EnhancedLogger("GameForgeErrorHandler", redis_client)
        self.recovery_strategies: Dict[ErrorCategory, Callable] = {}
        self.circuit_breakers: Dict[str, Dict] = {}
        
        # Register default recovery strategies
        self._register_default_strategies()
    
    def _register_default_strategies(self):
        """Register default error recovery strategies"""
        self.recovery_strategies[ErrorCategory.GPU_MEMORY] = self._handle_gpu_memory_error
        self.recovery_strategies[ErrorCategory.QUEUE] = self._handle_queue_error
        self.recovery_strategies[ErrorCategory.DATABASE] = self._handle_database_error
        self.recovery_strategies[ErrorCategory.NETWORK] = self._handle_network_error
    
    async def handle_error(self, 
                          error: Exception,
                          category: ErrorCategory = ErrorCategory.UNKNOWN,
                          severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                          context: Optional[Dict[str, Any]] = None,
                          should_retry: bool = True) -> bool:
        """
        Handle error with automatic recovery
        Returns True if error was handled and operation should continue
        """
        
        # Extract context information
        user_id = context.get("user_id") if context else None
        request_id = context.get("request_id") if context else None
        endpoint = context.get("endpoint") if context else None
        
        # Log the error
        await self.enhanced_logger.log_error(
            error=error,
            severity=severity,
            category=category,
            user_id=user_id,
            request_id=request_id,
            endpoint=endpoint,
            metadata=context
        )
        
        # Check circuit breaker
        if self._is_circuit_open(category.value):
            self.enhanced_logger.logger.warning(f"🔐 Circuit breaker open for {category.value}")
            return False
        
        # Attempt recovery
        recovery_successful = False
        if should_retry and category in self.recovery_strategies:
            try:
                recovery_successful = await self.recovery_strategies[category](error, context)
                if recovery_successful:
                    self.enhanced_logger.logger.info(f"🔧 Recovery successful for {category.value}")
                else:
                    self._increment_circuit_breaker(category.value)
            except Exception as recovery_error:
                await self.enhanced_logger.log_error(
                    error=recovery_error,
                    severity=ErrorSeverity.HIGH,
                    category=ErrorCategory.SYSTEM,
                    metadata={"original_error": str(error), "recovery_attempt": True}
                )
                self._increment_circuit_breaker(category.value)
        
        return recovery_successful
    
    async def _handle_gpu_memory_error(self, error: Exception, context: Optional[Dict]) -> bool:
        """Handle GPU memory errors"""
        try:
            import torch
            import gc
            
            # Force GPU memory cleanup
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            
            gc.collect()
            
            self.enhanced_logger.logger.info("🧹 GPU memory cleaned up")
            return True
            
        except Exception as e:
            self.enhanced_logger.logger.error(f"Failed to clean GPU memory: {e}")
            return False
    
    async def _handle_queue_error(self, error: Exception, context: Optional[Dict]) -> bool:
        """Handle queue-related errors"""
        # For queue errors, we typically want to retry with exponential backoff
        # This is handled by the queue manager itself
        return False
    
    async def _handle_database_error(self, error: Exception, context: Optional[Dict]) -> bool:
        """Handle database errors"""
        # Database connection errors might recover with a new connection
        # This would need to be implemented based on the specific database setup
        return False
    
    async def _handle_network_error(self, error: Exception, context: Optional[Dict]) -> bool:
        """Handle network errors"""
        # Network errors might recover with retry after delay
        await asyncio.sleep(1)  # Brief delay
        return True  # Suggest retry
    
    def _is_circuit_open(self, service: str) -> bool:
        """Check if circuit breaker is open for a service"""
        if service not in self.circuit_breakers:
            return False
        
        breaker = self.circuit_breakers[service]
        now = time.time()
        
        # Reset if enough time has passed
        if now - breaker["last_failure"] > breaker.get("reset_timeout", 300):  # 5 minutes
            self.circuit_breakers[service] = {"failures": 0, "last_failure": 0}
            return False
        
        return breaker["failures"] >= breaker.get("threshold", 5)
    
    def _increment_circuit_breaker(self, service: str):
        """Increment circuit breaker failure count"""
        if service not in self.circuit_breakers:
            self.circuit_breakers[service] = {"failures": 0, "last_failure": 0}
        
        self.circuit_breakers[service]["failures"] += 1
        self.circuit_breakers[service]["last_failure"] = time.time()
        
        if self.circuit_breakers[service]["failures"] >= 5:
            self.enhanced_logger.logger.warning(f"🔐 Circuit breaker opened for {service}")


# Global error handler instance
global_error_handler: Optional[ErrorHandler] = None


def initialize_error_handling(redis_client: Optional[redis.Redis] = None):
    """Initialize global error handling"""
    global global_error_handler
    global_error_handler = ErrorHandler(redis_client)
    
    # Set up global exception handler
    def handle_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        # Log unhandled exceptions
        asyncio.create_task(global_error_handler.handle_error(
            error=exc_value,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.CRITICAL,
            should_retry=False
        ))
    
    sys.excepthook = handle_exception


def error_boundary(category: ErrorCategory = ErrorCategory.UNKNOWN,
                   severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                   should_retry: bool = True,
                   fallback_return=None):
    """Decorator for error boundary with automatic handling"""
    
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if global_error_handler:
                    context = {
                        "function": func.__name__,
                        "args": str(args)[:200],  # Truncate long args
                        "kwargs": str(kwargs)[:200]
                    }
                    
                    handled = await global_error_handler.handle_error(
                        error=e,
                        category=category,
                        severity=severity,
                        context=context,
                        should_retry=should_retry
                    )
                    
                    if handled and should_retry:
                        # Retry the operation once
                        try:
                            return await func(*args, **kwargs)
                        except Exception as retry_error:
                            await global_error_handler.handle_error(
                                error=retry_error,
                                category=category,
                                severity=ErrorSeverity.HIGH,
                                context={**context, "retry_attempt": True},
                                should_retry=False
                            )
                
                # Return fallback or re-raise
                if fallback_return is not None:
                    return fallback_return
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # For sync functions, just log and re-raise
                if global_error_handler:
                    context = {
                        "function": func.__name__,
                        "args": str(args)[:200],
                        "kwargs": str(kwargs)[:200]
                    }
                    
                    # Use asyncio to run the async error handler
                    try:
                        loop = asyncio.get_event_loop()
                        loop.create_task(global_error_handler.handle_error(
                            error=e,
                            category=category,
                            severity=severity,
                            context=context,
                            should_retry=False
                        ))
                    except RuntimeError:
                        # No event loop, just log normally
                        logging.error(f"Error in {func.__name__}: {e}")
                
                if fallback_return is not None:
                    return fallback_return
                raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


@contextmanager
def error_context(category: ErrorCategory = ErrorCategory.UNKNOWN,
                  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                  **context_kwargs):
    """Context manager for error handling"""
    try:
        yield
    except Exception as e:
        if global_error_handler:
            asyncio.create_task(global_error_handler.handle_error(
                error=e,
                category=category,
                severity=severity,
                context=context_kwargs
            ))
        raise


# Create logger instance
logger = logging.getLogger(__name__)
