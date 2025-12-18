"""FastAPI application for ProdPlan 4.0 OS backend."""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import create_engine, text
import redis
import sys
import time
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "app"))

# Legacy routers (optional, for backward compatibility)
HAS_LEGACY_ROUTERS = False
try:
    from backend.api.routers import planning, inventory, bottlenecks, whatif, suggestions, chat, etl, insights
    HAS_LEGACY_ROUTERS = True
except ImportError:
    pass

from backend.config import DATABASE_URL

# Setup observability
try:
    from app.ops.metrics import http_requests_total, http_request_duration
    from app.ops.tracing import setup_tracing
    HAS_OBSERVABILITY = True
except ImportError:
    HAS_OBSERVABILITY = False

# Try to import new routers
try:
    from app.api.routers import prodplan, whatif, quality, smartinventory, ml, kpis, bottlenecks, ingestion
    HAS_NEW_ROUTERS = True
except ImportError:
    HAS_NEW_ROUTERS = False

# Check if auth is available
try:
    from app.ops.rate_limit import rate_limit
    HAS_AUTH = True
except ImportError:
    HAS_AUTH = False

app = FastAPI(title="ProdPlan 4.0 OS API", version="1.0.0")

# Setup tracing
if HAS_OBSERVABILITY:
    engine = create_engine(DATABASE_URL)
    setup_tracing(app=app, db_engine=engine)

# CORS middleware (strict in production)
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5174,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware (if auth available)
if HAS_AUTH:
    try:
        from app.ops.rate_limit import rate_limit_middleware
        @app.middleware("http")
        async def rate_limit_wrapper(request: Request, call_next):
            from app.ops.rate_limit import rate_limit
            try:
                rate_limit(request, "api", max_requests=100, window_seconds=60)
            except HTTPException:
                raise
            except:
                pass  # Skip if Redis not available
            return await call_next(request)
    except ImportError:
        pass

# Request metrics middleware
if HAS_OBSERVABILITY:
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        http_request_duration.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        return response

# Include new routers (PRODPLAN 4.0 OS)
if HAS_NEW_ROUTERS:
    app.include_router(prodplan.router, prefix="/api/prodplan", tags=["prodplan"])
    app.include_router(whatif.router, prefix="/api/whatif", tags=["whatif"])
    app.include_router(quality.router, prefix="/api/quality", tags=["quality"])
    app.include_router(smartinventory.router, prefix="/api/smartinventory", tags=["smartinventory"])
    app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
    app.include_router(kpis.router, prefix="/api/kpis", tags=["kpis"])
    app.include_router(bottlenecks.router, prefix="/api/prodplan", tags=["prodplan"])
    app.include_router(ingestion.router, prefix="/api/ingestion", tags=["ingestion"])

# Legacy routers (for backward compatibility, can be removed if not needed)
if HAS_LEGACY_ROUTERS:
    try:
        app.include_router(planning.router, prefix="/api/planning", tags=["planning"])
        app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
        app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
        app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
        app.include_router(etl.router, prefix="/api/etl", tags=["etl"])
        app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
    except Exception as e:
        # Legacy routers not available or error, skip
        import logging
        logging.warning(f"Legacy routers not available: {e}")

@app.get("/")
def root():
    return {"message": "ProdPlan 4.0 OS API", "status": "running"}

@app.get("/api/health")
def health():
    """Health check endpoint with DB and Redis status."""
    import os
    from urllib.parse import urlparse
    
    # Parse DATABASE_URL to extract connection info (safe - no password)
    parsed = urlparse(DATABASE_URL)
    db_host = parsed.hostname or "unknown"
    db_port = parsed.port or 5432
    db_name = parsed.path.lstrip("/") or "unknown"
    execution_mode = "docker" if os.path.exists("/.dockerenv") or os.getenv("IN_DOCKER", "").lower() in ("true", "1", "yes") else "host"
    
    status = {
        "status": "healthy",
        "db_connected": False,
        "redis_connected": False,
        "db_host": db_host,
        "db_port": db_port,
        "db_name": db_name,
        "execution_mode": execution_mode,
        "checks": {}
    }
    
    # Check database with actual roundtrip
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()  # Force execution
        status["checks"]["database"] = "ok"
        status["db_connected"] = True
    except Exception as e:
        error_msg = str(e)
        # Extract safe error code (no secrets)
        if "Connection refused" in error_msg:
            error_code = "CONNECTION_REFUSED"
        elif "authentication failed" in error_msg.lower():
            error_code = "AUTH_FAILED"
        elif "does not exist" in error_msg.lower():
            error_code = "DB_NOT_FOUND"
        else:
            error_code = "UNKNOWN_ERROR"
        
        status["checks"]["database"] = f"error: {error_code}"
        status["db_connected"] = False
        status["last_error"] = error_code
        status["status"] = "degraded"
    
    # Check Redis (optional - app works without it)
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        redis_client.ping()
        status["checks"]["redis"] = "ok"
        status["redis_connected"] = True
    except Exception as e:
        error_msg = str(e)
        # Extract safe error code
        if "Connection refused" in error_msg or "Error 61" in error_msg:
            error_code = "CONNECTION_REFUSED"
        else:
            error_code = "UNAVAILABLE"
        status["checks"]["redis"] = f"optional_unavailable: {error_code}"
        status["redis_connected"] = False
        # Redis is optional, don't degrade status if only Redis is down
        if status["db_connected"]:
            status["status"] = "healthy"  # Still healthy if DB is connected
        else:
            status["status"] = "degraded"
    
    return status

@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    if HAS_OBSERVABILITY:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    return Response(content="# Metrics not available\n", media_type="text/plain")

@app.get("/favicon.ico")
def favicon():
    """Return empty favicon to avoid 404 errors."""
    return Response(content=b"", media_type="image/x-icon")

