"""
Celery application configuration for GTO Wizard Clone.

Background task queue for long-running solver jobs with Redis broker.
"""

import os
from celery import Celery

# Redis URL from environment
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "gto_solver",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["apps.worker.tasks"],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3000,  # 50 min soft limit
    worker_prefetch_multiplier=1,  # One task per worker at a time
    worker_max_tasks_per_child=50,  # Recycle workers after 50 tasks
    task_acks_late=True,  # Acknowledge after task completes
    task_reject_on_worker_lost=True,
    result_expires=86400,  # Results expire after 24 hours
)

# Redis pub/sub channel prefix
PROGRESS_CHANNEL_PREFIX = "solver:progress:"


def get_progress_channel(job_id: str) -> str:
    """Get Redis pub/sub channel name for a job's progress updates."""
    return f"{PROGRESS_CHANNEL_PREFIX}{job_id}"
