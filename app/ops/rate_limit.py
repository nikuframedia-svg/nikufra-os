"""
Rate limiting using Redis.
"""
from typing import Optional
from fastapi import Request, HTTPException, status
import redis
import time
import structlog

logger = structlog.get_logger()

# Global Redis client
_redis_client = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url("redis://localhost:6379/0", decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
            _redis_client.ping()  # Test connection
        except Exception as e:
            _redis_client = None
            logger.warning("redis_not_available", message=f"Redis not available (optional), rate limiting disabled: {str(e)}")
    return _redis_client


def rate_limit(
    request: Request,
    key_prefix: str,
    max_requests: int = 100,
    window_seconds: int = 60
) -> None:
    """
    Rate limit by IP and API key.
    
    Args:
        request: FastAPI request
        key_prefix: Prefix for rate limit key
        max_requests: Maximum requests per window
        window_seconds: Time window in seconds
    
    Raises:
        HTTPException: If rate limit exceeded
    """
    redis_client = get_redis_client()
    if not redis_client:
        # No Redis, skip rate limiting
        return
    
    # Get identifier (IP or API key)
    api_key = request.headers.get("X-API-Key")
    identifier = api_key or request.client.host
    identifier_type = "api_key" if api_key else "ip"
    
    # Build key
    key = f"rate_limit:{key_prefix}:{identifier_type}:{identifier}"
    
    # Get current count
    current = redis_client.get(key)
    
    if current and int(current) >= max_requests:
        logger.warning(
            "rate_limit_exceeded",
            identifier=identifier[:8] + "..." if len(identifier) > 8 else identifier,
            identifier_type=identifier_type,
            key_prefix=key_prefix
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds"
        )
    
    # Increment counter
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    pipe.execute()


def rate_limit_middleware(key_prefix: str, max_requests: int = 100, window_seconds: int = 60):
    """
    Create rate limit middleware.
    
    Args:
        key_prefix: Prefix for rate limit key
        max_requests: Maximum requests per window
        window_seconds: Time window in seconds
    
    Returns:
        Middleware function
    """
    async def middleware(request: Request, call_next):
        try:
            rate_limit(request, key_prefix, max_requests, window_seconds)
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("rate_limit_error", error=str(e))
        
        response = await call_next(request)
        return response
    
    return middleware
