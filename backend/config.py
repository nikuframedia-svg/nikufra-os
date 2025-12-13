"""Configuration management for the backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/nelo_db")

# Data paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_RAW_DIR = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
FOLHA_IA_PATH = os.getenv("FOLHA_IA_PATH", str(DATA_RAW_DIR / "Folha_IA.xlsx"))


