"""
WebSocket connection manager for real-time solver progress streaming.

Manages WebSocket connections with:
- Connection/disconnection handling
- Job-based room subscriptions
- Progress broadcasting
"""

import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any, Callable
from datetime import datetime

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionState:
    """Holds state for a single WebSocket connection."""
    
    def __init__(self, websocket: WebSocket, job_id: Optional[str] = None):
        self.websocket = websocket
        self.job_id = job_id
        self.connected_at = datetime.utcnow()


class WebSocketManager:
    """
    WebSocket connection manager for solver progress streaming.
    
    Features:
    - Multiple simultaneous connections
    - Job-based subscription rooms
    - Automatic reconnection handling
    - Progress event broadcasting
    """
    
    def __init__(self):
        """Initialize the WebSocket manager."""
        # Map of job_id -> set of connections subscribed to that job
        self._rooms: Dict[str, Set[ConnectionState]] = {}
        # All active connections
        self._connections: Dict[WebSocket, ConnectionState] = {}
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, job_id: Optional[str] = None) -> bool:
        """
        Accept a new WebSocket connection and optionally subscribe to a job.
        
        Args:
            websocket: FastAPI WebSocket instance
            job_id: Optional job ID to subscribe to
        
        Returns:
            True if connection successful
        """
        try:
            await websocket.accept()
            
            state = ConnectionState(websocket, job_id)
            
            async with self._lock:
                self._connections[websocket] = state
                
                if job_id:
                    if job_id not in self._rooms:
                        self._rooms[job_id] = set()
                    self._rooms[job_id].add(state)
            
            logger.info(f"WebSocket connected (job_id={job_id})")
            
            # Send welcome message
            await websocket.send_json({
                "type": "connected",
                "job_id": job_id,
                "timestamp": datetime.utcnow().isoformat(),
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}")
            return False
    
    async def disconnect(self, websocket: WebSocket):
        """
        Handle WebSocket disconnection.
        
        Args:
            websocket: The WebSocket that disconnected
        """
        async with self._lock:
            state = self._connections.pop(websocket, None)
            
            if state and state.job_id:
                room = self._rooms.get(state.job_id)
                if room:
                    room.discard(state)
                    if not room:
                        del self._rooms[state.job_id]
        
        logger.info(f"WebSocket disconnected (job_id={state.job_id if state else None})")
    
    async def subscribe(self, websocket: WebSocket, job_id: str):
        """
        Subscribe a connection to a job's progress updates.
        
        Args:
            websocket: WebSocket connection to subscribe
            job_id: Job ID to subscribe to
        """
        async with self._lock:
            state = self._connections.get(websocket)
            if state:
                # Remove from old room
                if state.job_id:
                    old_room = self._rooms.get(state.job_id)
                    if old_room:
                        old_room.discard(state)
                
                # Add to new room
                state.job_id = job_id
                if job_id not in self._rooms:
                    self._rooms[job_id] = set()
                self._rooms[job_id].add(state)
                
                logger.info(f"WebSocket subscribed to job {job_id}")
    
    async def unsubscribe(self, websocket: WebSocket):
        """
        Unsubscribe a connection from its current job.
        
        Args:
            websocket: WebSocket connection to unsubscribe
        """
        async with self._lock:
            state = self._connections.get(websocket)
            if state and state.job_id:
                room = self._rooms.get(state.job_id)
                if room:
                    room.discard(state)
                    if not room:
                        del self._rooms[state.job_id]
                state.job_id = None
                
                logger.info("WebSocket unsubscribed from job")
    
    async def broadcast_to_job(self, job_id: str, message: Dict[str, Any]):
        """
        Broadcast a message to all connections subscribed to a job.
        
        Args:
            job_id: Job ID to broadcast to
            message: Message data to send
        """
        room = self._rooms.get(job_id, set())
        disconnected = []
        
        for state in room:
            try:
                await state.websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.append(state)
        
        # Clean up disconnected clients
        for state in disconnected:
            await self.disconnect(state.websocket)
    
    async def send_to_connection(self, websocket: WebSocket, message: Dict[str, Any]):
        """
        Send a message to a specific WebSocket connection.
        
        Args:
            websocket: Target WebSocket
            message: Message data to send
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send to WebSocket: {e}")
            await self.disconnect(websocket)
    
    async def broadcast_all(self, message: Dict[str, Any]):
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: Message data to send
        """
        disconnected = []
        
        async with self._lock:
            for websocket in self._connections:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append(websocket)
        
        # Clean up disconnected
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    @property
    def connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self._connections)
    
    def get_room_size(self, job_id: str) -> int:
        """Get number of connections subscribed to a job."""
        return len(self._rooms.get(job_id, set()))
    
    async def handle_solver_progress(self, job_id: str, progress_data: Dict[str, Any]):
        """
        Handle incoming solver progress update.
        
        Called by the Redis pub/sub subscriber to broadcast progress.
        
        Args:
            job_id: Job ID
            progress_data: Progress update data
        """
        message = {
            "type": "solve:progress",
            "job_id": job_id,
            **progress_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        await self.broadcast_to_job(job_id, message)
    
    async def handle_solver_complete(self, job_id: str, result_data: Dict[str, Any]):
        """
        Handle solver completion.
        
        Args:
            job_id: Job ID
            result_data: Final result data
        """
        message = {
            "type": "solve:complete",
            "job_id": job_id,
            **result_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        await self.broadcast_to_job(job_id, message)


# Global WebSocket manager instance
_ws_manager: Optional[WebSocketManager] = None


def get_websocket_manager() -> WebSocketManager:
    """Get singleton WebSocketManager instance."""
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = WebSocketManager()
    return _ws_manager
