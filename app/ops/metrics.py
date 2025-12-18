"""
Prometheus metrics instrumentation.
"""
from prometheus_client import Counter, Histogram, Gauge
from functools import wraps
import time

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Database metrics
db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['query_type']
)

db_connections = Gauge(
    'db_connections_active',
    'Active database connections'
)

# Ingestion metrics
ingestion_rows_processed = Counter(
    'ingestion_rows_processed_total',
    'Total rows processed',
    ['sheet_name', 'status']
)

ingestion_duration = Histogram(
    'ingestion_duration_seconds',
    'Ingestion duration',
    ['sheet_name']
)

# Cache metrics
cache_hits = Counter(
    'cache_hits_total',
    'Cache hits',
    ['cache_key']
)

cache_misses = Counter(
    'cache_misses_total',
    'Cache misses',
    ['cache_key']
)


def track_request_time(func):
    """Decorator to track request time."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            status = 'success'
            return result
        except Exception as e:
            status = 'error'
            raise
        finally:
            duration = time.time() - start_time
            http_request_duration.labels(
                method=kwargs.get('method', 'GET'),
                endpoint=func.__name__
            ).observe(duration)
    return wrapper


def track_db_query(query_type: str):
    """Context manager to track database query time."""
    class QueryTracker:
        def __enter__(self):
            self.start_time = time.time()
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            db_query_duration.labels(query_type=query_type).observe(duration)
    
    return QueryTracker()

