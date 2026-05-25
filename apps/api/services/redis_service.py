"""
Redis service for pub/sub and caching.

Handles:
- Solver progress pub/sub via Redis channels
- Job status caching
- WebSocket broadcast integration
"""

import json
import logging
import os
import threading
from typing import Any, Callable, Dict, Optional

import redis

logger = logging.getLogger(__name__)

# Redis connection configuration
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
PROGRESS_CHANNEL_PREFIX = "solver:progress:"


class RedisService:
    """
    Redis service for pub/sub and caching.
    
    Provides:
    - Pub/sub for solver progress updates
    - Job status caching
    - Channel subscription management
    """
    
    _instance: Optional["RedisService"] = None
    _lock = threading.Lock()
    
    def __init__(self):
        """Initialize Redis connection pool."""
        self._pool = redis.ConnectionPool.from_url(
            REDIS_URL,
            decode_responses=True,
            max_connections=50,
        )
        self._client: Optional[redis.Redis] = None
        self._pubsub_client: Optional[redis.Redis] = None
        self._subscriptions: Dict[str, Callable] = {}
        self._listener_thread: Optional[threading.Thread] = None
        self._running = False
    
    @classmethod
    def get_instance(cls) -> "RedisService":
        """Get singleton instance of RedisService."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client from pool."""
        if self._client is None:
            self._client = redis.Redis(connection_pool=self._pool)
        return self._client
    
    @property
    def pubsub_client(self) -> redis.Redis:
        """Get separate Redis client for pub/sub subscriptions."""
        if self._pubsub_client is None:
            self._pubsub_client = redis.Redis(connection_pool=self._pool)
        return self._pubsub_client
    
    def get_progress_channel(self, job_id: str) -> str:
        """Get pub/sub channel name for job progress."""
        return f"{PROGRESS_CHANNEL_PREFIX}{job_id}"
    
    def publish_progress(
        self,
        job_id: str,
        progress: int,
        status: str,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Publish solver progress to Redis pub/sub.
        
        Args:
            job_id: Unique job identifier
            progress: Progress percentage (0-100)
            status: Job status (queued, running, complete, error)
            extra_data: Additional data to include in the message
        
        Returns:
            Number of subscribers that received the message
        """
        import time
        
        channel = self.get_progress_channel(job_id)
        message = {
            "job_id": job_id,
            "progress": progress,
            "status": status,
            "timestamp": time.time(),
        }
        if extra_data:
            message.update(extra_data)
        
        try:
            # Publish to channel
            subscribers = self.client.publish(channel, json.dumps(message))
            
            # Also cache the latest status
            self.client.set(
                f"job:status:{job_id}",
                json.dumps(message),
                ex=86400,  # 24 hour expiry
            )
            
            logger.debug(f"Published progress to {channel}: {status} @ {progress}%")
            return subscribers
            
        except Exception as e:
            logger.error(f"Failed to publish progress for {job_id}: {e}")
            raise
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached job status from Redis.
        
        Args:
            job_id: Job identifier
        
        Returns:
            Job status dict or None if not found
        """
        try:
            status_json = self.client.get(f"job:status:{job_id}")
            if status_json:
                return json.loads(status_json)
            
            result_json = self.client.get(f"job:result:{job_id}")
            if result_json:
                return json.loads(result_json)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get job status for {job_id}: {e}")
            return None
    
    def set_job_result(self, job_id: str, result: Dict[str, Any], ttl: int = 86400):
        """
        Cache job result in Redis.
        
        Args:
            job_id: Job identifier
            result: Result data to cache
            ttl: Time-to-live in seconds (default 24 hours)
        """
        try:
            self.client.set(
                f"job:result:{job_id}",
                json.dumps(result),
                ex=ttl,
            )
        except Exception as e:
            logger.error(f"Failed to cache job result for {job_id}: {e}")
            raise
    
    def subscribe_to_progress(
        self,
        job_id: str,
        callback: Callable[[Dict[str, Any]], None],
    ):
        """
        Subscribe to progress updates for a specific job.
        
        Args:
            job_id: Job identifier to subscribe to
            callback: Function to call when progress is received
        """
        channel = self.get_progress_channel(job_id)
        self._subscriptions[channel] = callback
        
        # Start listener thread if not running
        if not self._running:
            self._start_listener()
    
    def unsubscribe_from_progress(self, job_id: str):
        """
        Unsubscribe from progress updates for a job.
        
        Args:
            job_id: Job identifier to unsubscribe from
        """
        channel = self.get_progress_channel(job_id)
        if channel in self._subscriptions:
            del self._subscriptions[channel]
    
    def _start_listener(self):
        """Start the pub/sub listener thread."""
        if self._running:
            return
        
        self._running = True
        self._listener_thread = threading.Thread(
            target=self._listen_for_updates,
            daemon=True,
        )
        self._listener_thread.start()
        logger.info("Started Redis pub/sub listener thread")
    
    def _listen_for_updates(self):
        """Listen for updates on subscribed channels."""
        pubsub = self.pubsub_client.pubsub()
        
        try:
            # Subscribe to all subscribed channels
            if self._subscriptions:
                pubsub.subscribe(list(self._subscriptions.keys()))
                
                for message in pubsub.listen():
                    if not self._running:
                        break
                    
                    if message["type"] == "message":
                        channel = message["channel"]
                        try:
                            data = json.loads(message["data"])
                            callback = self._subscriptions.get(channel)
                            if callback:
                                callback(data)
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON in pub/sub message: {message['data']}")
                            
        except Exception as e:
            logger.error(f"Error in pub/sub listener: {e}")
        finally:
            pubsub.close()
    
    def close(self):
        """Close Redis connections and stop listener."""
        self._running = False
        if self._listener_thread:
            self._listener_thread.join(timeout=2)
        if self._client:
            self._client.close()
        if self._pubsub_client:
            self._pubsub_client.close()


def get_redis_service() -> RedisService:
    """Get singleton RedisService instance."""
    return RedisService.get_instance()
