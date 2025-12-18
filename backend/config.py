"""Configuration management for the backend."""
import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

# Detect if running in Docker (check /.dockerenv OR IN_DOCKER env var)
IN_DOCKER = os.path.exists("/.dockerenv") or os.getenv("IN_DOCKER", "").lower() in ("true", "1", "yes")

# Database - PostgreSQL REQUIRED (no SQLite fallback)
# STRICT, DETERMINISTIC SELECTION:
# 1. If DATABASE_URL is set: use it, always.
# 2. Else if IN_DOCKER: require DATABASE_URL_DOCKER
# 3. Else (host): require DATABASE_URL_HOST
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_URL_HOST = os.getenv("DATABASE_URL_HOST")
DATABASE_URL_DOCKER = os.getenv("DATABASE_URL_DOCKER")

execution_mode = "docker" if IN_DOCKER else "host"

if DATABASE_URL:
    # Priority 1: explicit DATABASE_URL always wins
    pass
elif IN_DOCKER:
    # Priority 2: in Docker, require DATABASE_URL_DOCKER
    if not DATABASE_URL_DOCKER:
        raise RuntimeError(
            f"Running in Docker (execution_mode={execution_mode}) but DATABASE_URL_DOCKER is not set.\n"
            "Set DATABASE_URL_DOCKER=postgresql://user:pass@db:5432/dbname in docker-compose.yml or environment."
        )
    DATABASE_URL = DATABASE_URL_DOCKER
else:
    # Priority 3: on host, require DATABASE_URL_HOST
    if not DATABASE_URL_HOST:
        raise RuntimeError(
            f"Running on host (execution_mode={execution_mode}) but DATABASE_URL_HOST is not set.\n"
            "Set DATABASE_URL_HOST=postgresql://user:pass@localhost:5432/dbname in .env or environment."
        )
    DATABASE_URL = DATABASE_URL_HOST

# Validate DATABASE_URL format
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is required. PostgreSQL 15+ only. SQLite is not supported.\n"
        "Configure DATABASE_URL or set DATABASE_URL_HOST (for local) and DATABASE_URL_DOCKER (for containers)."
    )

if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "DATABASE_URL points to SQLite. PostgreSQL 15+ only. SQLite is not supported."
    )

# Accept postgresql:// and postgresql+psycopg2://
if not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg2://")):
    raise RuntimeError(
        f"Unsupported DATABASE_URL scheme. Use PostgreSQL 15+. Got: {DATABASE_URL[:50]}"
    )

# Parse and log connection info (DO NOT print password)
parsed = urlparse(DATABASE_URL)
db_host = parsed.hostname or "unknown"
db_port = parsed.port or 5432
db_name = parsed.path.lstrip("/") or "unknown"

# Log startup info (safe - no password)
print(f"[CONFIG] execution_mode={execution_mode}, db_host={db_host}, db_port={db_port}, db_name={db_name}")

# Validate host (fail-fast if in Docker and using localhost)
if IN_DOCKER:
    if parsed.hostname in ("localhost", "127.0.0.1"):
        raise RuntimeError(
            f"Running in Docker but DATABASE_URL uses {parsed.hostname}. "
            "Use service name 'db' instead. Set DATABASE_URL_DOCKER=postgresql://...@db:5432/nelo_db"
        )

# Data paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_RAW_DIR = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
FOLHA_IA_PATH = os.getenv("FOLHA_IA_PATH", str(DATA_RAW_DIR / "Folha_IA.xlsx"))


