"""
Arq worker for background jobs.
"""
from arq import create_pool
from arq.connections import RedisSettings
from arq.worker import Worker
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import DATABASE_URL
import structlog

logger = structlog.get_logger()


class WorkerSettings:
    """Arq worker settings."""
    redis_settings = RedisSettings(host='localhost', port=6379, database=0)
    functions = [
        'app.workers.jobs.refresh_mvs_incremental',
        'app.workers.jobs.compute_kpi_snapshots_incremental',
        'app.workers.jobs.reconcile_orphans',
        'app.workers.jobs.backfill_ofch_event_time',
        'app.workers.jobs.backfill_faseof_derived_columns',
        'app.workers.jobs.compute_aggregates_incremental',
        'app.workers.jobs.compute_agg_wip_current',
        'app.workers.jobs.ensure_partitions_ahead',
        'app.workers.jobs.partition_health_report',
    ]
    max_jobs = 10
    job_timeout = 300  # 5 minutes

