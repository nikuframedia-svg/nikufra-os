"""
API Key authentication for production endpoints.
"""
from typing import Optional
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
import os
import structlog

logger = structlog.get_logger()

# API Key header
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# Get API key from environment
API_KEY = os.getenv("API_KEY", "dev-key-change-in-production")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"


def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER)) -> str:
    """
    Verify API key.
    
    Args:
        api_key: API key from header
    
    Returns:
        API key if valid
    
    Raises:
        HTTPException: If API key is invalid
    """
    if not REQUIRE_API_KEY:
        # In development, allow requests without key
        return api_key or "dev"
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Provide X-API-Key header."
        )
    
    if api_key != API_KEY:
        logger.warning("invalid_api_key_attempt", provided_key=api_key[:8] + "...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return api_key


def get_api_key_dependency(required: bool = True):
    """
    Get API key dependency.
    
    Args:
        required: Whether API key is required
    
    Returns:
        Dependency function
    """
    if required and REQUIRE_API_KEY:
        return Security(verify_api_key)
    else:
        # Return a no-op dependency
        def no_op(api_key: Optional[str] = Security(API_KEY_HEADER)) -> Optional[str]:
            return api_key
        return no_op
