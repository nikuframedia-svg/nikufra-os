"""
Cache versionado com singleflight para evitar stampede.
"""
from typing import Optional, Any, Callable
import redis
import json
import hashlib
import asyncio
import time
import structlog

logger = structlog.get_logger()

# Global singleflight locks (in-memory)
_singleflight_locks = {}
_singleflight_results = {}


class VersionedCache:
    """Cache versionado com singleflight."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0", db_url: str = None):
        """
        Initialize versioned cache.
        
        Args:
            redis_url: Redis URL
            db_url: Database URL (para ler cache_version)
        """
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
            self.redis_client.ping()  # Test connection
        except Exception as e:
            self.redis_client = None
            logger.warning("redis_not_available", message=f"Redis not available (optional), caching disabled: {str(e)}")
        
        self.db_url = db_url
        self._cache_version = None
    
    def get_cache_version(self) -> int:
        """Get current cache version from DB."""
        if self._cache_version is not None:
            return self._cache_version
        
        if not self.db_url:
            return 1
        
        from sqlalchemy import create_engine, text
        engine = create_engine(self.db_url)
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT cache_version FROM ops_cache_version LIMIT 1"))
                row = result.fetchone()
                if row:
                    self._cache_version = int(row[0])
                    return self._cache_version
        except:
            pass
        
        return 1
    
    def increment_cache_version(self):
        """Increment cache version (after ingestion, backfill, etc.)."""
        if not self.db_url:
            return
        
        from sqlalchemy import create_engine, text
        engine = create_engine(self.db_url)
        
        try:
            with engine.connect() as conn:
                conn.execute(text("UPDATE ops_cache_version SET cache_version = cache_version + 1"))
                conn.commit()
            self._cache_version = None  # Invalidate cache
            logger.info("cache_version_incremented")
        except Exception as e:
            logger.error("cache_version_increment_failed", error=str(e))
    
    def _make_key(self, endpoint: str, params: dict) -> str:
        """Make cache key with version."""
        cache_version = self.get_cache_version()
        params_str = json.dumps(params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        return f"{endpoint}:v{cache_version}:{params_hash}"
    
    def get(
        self,
        endpoint: str,
        params: dict,
        ttl: int = 60
    ) -> Optional[Any]:
        """
        Get from cache.
        
        Args:
            endpoint: Endpoint name
            params: Parameters dict
            ttl: TTL in seconds
        
        Returns:
            Cached value or None
        """
        if not self.redis_client:
            return None
        
        key = self._make_key(endpoint, params)
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning("cache_get_error", error=str(e))
        
        return None
    
    def set(
        self,
        endpoint: str,
        params: dict,
        value: Any,
        ttl: int = 60
    ):
        """
        Set cache value.
        
        Args:
            endpoint: Endpoint name
            params: Parameters dict
            value: Value to cache
            ttl: TTL in seconds
        """
        if not self.redis_client:
            return
        
        key = self._make_key(endpoint, params)
        
        try:
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
        except Exception as e:
            logger.warning("cache_set_error", error=str(e))
    
    def get_or_compute(
        self,
        endpoint: str,
        params: dict,
        compute_func: Callable[[], Any],
        ttl: int = 60,
        stale_ttl: int = 5
    ) -> Any:
        """
        Get from cache or compute with singleflight.
        
        Args:
            endpoint: Endpoint name
            params: Parameters dict
            compute_func: Function to compute value if cache miss
            ttl: TTL in seconds
            stale_ttl: Stale TTL (return stale while computing)
        
        Returns:
            Cached or computed value
        """
        # Try cache first
        cached = self.get(endpoint, params, ttl)
        if cached is not None:
            return cached
        
        # Singleflight: check if already computing
        key = self._make_key(endpoint, params)
        lock_key = f"{key}:lock"
        
        # Check in-memory lock
        if lock_key in _singleflight_locks:
            # Wait for result (with timeout)
            start = time.time()
            while lock_key in _singleflight_locks and time.time() - start < stale_ttl:
                time.sleep(0.1)
            
            # Check if result is ready
            if lock_key in _singleflight_results:
                result = _singleflight_results.pop(lock_key)
                _singleflight_locks.pop(lock_key, None)
                return result
        
        # Acquire lock
        _singleflight_locks[lock_key] = True
        
        try:
            # Compute value
            result = compute_func()
            
            # Cache it
            self.set(endpoint, params, result, ttl)
            
            # Store result for other waiters
            _singleflight_results[lock_key] = result
            
            return result
        finally:
            # Release lock after a short delay (for other waiters)
            time.sleep(0.1)
            _singleflight_locks.pop(lock_key, None)
            _singleflight_results.pop(lock_key, None)
    
    def invalidate(self, pattern: str = "*"):
        """
        Invalidate cache by pattern.
        
        Args:
            pattern: Redis pattern (default: all)
        """
        if not self.redis_client:
            return
        
        try:
            # Increment version (invalidates all keys with old version)
            self.increment_cache_version()
        except Exception as e:
            logger.warning("cache_invalidate_error", error=str(e))


# Singleton
_cache_instance = None

def get_cache(db_url: str = None) -> VersionedCache:
    """Get or create cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = VersionedCache(db_url=db_url)
    return _cache_instance

