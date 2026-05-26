"""
Community spots API router.

Provides endpoints for:
- Creating, reading, updating, deleting community spots
- Liking spots
- Forking spots to user's account

Spots represent poker game situations (board, position, stack depth) with
associated GTO strategy data that can be shared with the community.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from apps.api.services.redis_service import RedisService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/spots", tags=["spots"])

# Redis key prefixes
SPOTS_KEY = "community:spots"
SPOT_KEY_PREFIX = "community:spot:"
SPOT_LIKES_PREFIX = "community:spot:likes:"
SPOT_FORKS_PREFIX = "community:spot:forks:"


def get_redis():
    """Get Redis service instance."""
    return RedisService()


def spot_key(spot_id: str) -> str:
    """Get Redis key for a spot."""
    return f"{SPOT_KEY_PREFIX}{spot_id}"


def spot_likes_key(spot_id: str) -> str:
    """Get Redis key for spot likes counter."""
    return f"{SPOT_LIKES_PREFIX}{spot_id}"


def spot_forks_key(spot_id: str) -> str:
    """Get Redis key for spot forks counter."""
    return f"{SPOT_FORKS_PREFIX}{spot_id}"


def spot_to_response(spot_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert spot dict to response format."""
    # Ensure tags is a list
    if spot_data.get("tags") is None:
        spot_data["tags"] = []
    return spot_data


@router.post("", response_model=Dict[str, Any], status_code=201)
async def create_spot(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new community spot.
    
    A spot represents a poker game situation with strategy data
    that can be shared with the community.
    """
    redis = get_redis()
    
    # Validate required fields
    if not request.get("title"):
        raise HTTPException(status_code=400, detail="title is required")
    if not request.get("strategy_json"):
        raise HTTPException(status_code=400, detail="strategy_json is required")
    
    # Generate spot ID
    import uuid
    spot_id = str(uuid.uuid4())
    
    # Prepare spot data
    spot_data = {
        "id": spot_id,
        "title": request.get("title"),
        "description": request.get("description"),
        "board": request.get("board", ""),
        "board_type": request.get("board_type", "flop"),
        "position": request.get("position", ""),
        "pot_size": request.get("pot_size", 0.0),
        "stack_depth": request.get("stack_depth", 100),
        "author": request.get("author", "anonymous"),
        "tags": request.get("tags", []),
        "strategy_json": request.get("strategy_json"),
        "likes": 0,
        "fork_count": 0,
        "parent_spot_id": None,
    }
    
    # Store spot in Redis
    await redis.set(spot_key(spot_id), json.dumps(spot_data))
    
    # Add to spots list
    await redis.zadd(SPOTS_KEY, {spot_id: float(time.time())})
    
    return spot_to_response(spot_data)


@router.get("", response_model=Dict[str, Any])
async def list_spots(
    board_type: Optional[str] = Query(None, description="Filter by board type"),
    position: Optional[str] = Query(None, description="Filter by position"),
    author: Optional[str] = Query(None, description="Filter by author"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    stack_depth_min: Optional[int] = Query(None, description="Minimum stack depth"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Results offset"),
) -> Dict[str, Any]:
    """
    List community spots with optional filters.
    
    Supports filtering by board_type, position, author, tags, and stack_depth.
    Results are ordered by creation date (newest first).
    """
    redis = get_redis()
    
    # Get all spot IDs sorted by creation time (newest first)
    spot_ids = await redis.zrevrange(SPOTS_KEY, 0, -1)
    
    spots = []
    for spot_id in spot_ids:
        spot_json = await redis.get(spot_key(spot_id))
        if not spot_json:
            continue
        
        spot_data = json.loads(spot_json)
        
        # Apply filters
        if board_type and spot_data.get("board_type") != board_type:
            continue
        if position and spot_data.get("position") != position:
            continue
        if author and spot_data.get("author") != author:
            continue
        if stack_depth_min and spot_data.get("stack_depth", 0) < stack_depth_min:
            continue
        if tags:
            filter_tags = set(tags.split(","))
            spot_tags = set(spot_data.get("tags", []))
            if not filter_tags.intersection(spot_tags):
                continue
        
        spots.append(spot_to_response(spot_data))
    
    total = len(spots)
    
    # Apply pagination
    spots = spots[offset:offset + limit]
    
    return {
        "spots": spots,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/{spot_id}", response_model=Dict[str, Any])
async def get_spot(spot_id: str) -> Dict[str, Any]:
    """Get a single spot by ID."""
    redis = get_redis()
    
    spot_json = await redis.get(spot_key(spot_id))
    if not spot_json:
        raise HTTPException(status_code=404, detail=f"Spot not found: {spot_id}")
    
    return spot_to_response(json.loads(spot_json))


@router.put("/{spot_id}", response_model=Dict[str, Any])
async def update_spot(spot_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing spot."""
    redis = get_redis()
    
    spot_json = await redis.get(spot_key(spot_id))
    if not spot_json:
        raise HTTPException(status_code=404, detail=f"Spot not found: {spot_id}")
    
    spot_data = json.loads(spot_json)
    
    # Update allowed fields
    update_fields = ["title", "description", "board", "board_type", "position", 
                    "pot_size", "stack_depth", "tags", "strategy_json"]
    for field in update_fields:
        if field in request:
            spot_data[field] = request[field]
    
    # Store updated spot
    await redis.set(spot_key(spot_id), json.dumps(spot_data))
    
    return spot_to_response(spot_data)


@router.delete("/{spot_id}")
async def delete_spot(spot_id: str) -> Dict[str, str]:
    """Delete a spot."""
    redis = get_redis()
    
    spot_json = await redis.get(spot_key(spot_id))
    if not spot_json:
        raise HTTPException(status_code=404, detail=f"Spot not found: {spot_id}")
    
    # Delete spot
    await redis.delete(spot_key(spot_id))
    await redis.delete(spot_likes_key(spot_id))
    await redis.delete(spot_forks_key(spot_id))
    
    # Remove from spots list
    await redis.zrem(SPOTS_KEY, spot_id)
    
    return {"status": "deleted", "id": spot_id}


@router.post("/{spot_id}/like", response_model=Dict[str, Any])
async def like_spot(spot_id: str) -> Dict[str, Any]:
    """
    Like a spot.
    
    Increments the like count for the spot. Each user should track
    their own liked spots to prevent duplicate likes.
    """
    redis = get_redis()
    
    spot_json = await redis.get(spot_key(spot_id))
    if not spot_json:
        raise HTTPException(status_code=404, detail=f"Spot not found: {spot_id}")
    
    spot_data = json.loads(spot_json)
    
    # Increment likes
    new_likes = (spot_data.get("likes") or 0) + 1
    spot_data["likes"] = new_likes
    
    # Store updated spot
    await redis.set(spot_key(spot_id), json.dumps(spot_data))
    
    return {
        "id": spot_id,
        "likes": new_likes,
        "message": f"Spot liked successfully. Total likes: {new_likes}",
    }


@router.post("/{spot_id}/fork", response_model=Dict[str, Any])
async def fork_spot(
    spot_id: str,
    author: str = Query("anonymous", description="Author for the forked spot")
) -> Dict[str, Any]:
    """
    Fork a spot to user's account.
    
    Creates a copy of the spot under a new author. The forked spot
    maintains a reference to its parent spot.
    """
    redis = get_redis()
    
    spot_json = await redis.get(spot_key(spot_id))
    if not spot_json:
        raise HTTPException(status_code=404, detail=f"Spot not found: {spot_id}")
    
    parent_spot = json.loads(spot_json)
    
    # Generate new spot ID
    import uuid
    new_spot_id = str(uuid.uuid4())
    
    # Increment fork count on parent
    parent_fork_count = (parent_spot.get("fork_count") or 0) + 1
    parent_spot["fork_count"] = parent_fork_count
    await redis.set(spot_key(spot_id), json.dumps(parent_spot))
    
    # Create forked spot
    forked_spot = {
        "id": new_spot_id,
        "title": f"{parent_spot.get('title', 'Spot')} (fork)",
        "description": parent_spot.get("description"),
        "board": parent_spot.get("board", ""),
        "board_type": parent_spot.get("board_type", "flop"),
        "position": parent_spot.get("position", ""),
        "pot_size": parent_spot.get("pot_size", 0.0),
        "stack_depth": parent_spot.get("stack_depth", 100),
        "author": author,
        "tags": parent_spot.get("tags", []),
        "strategy_json": parent_spot.get("strategy_json"),
        "likes": 0,
        "fork_count": 0,
        "parent_spot_id": spot_id,
    }
    
    # Store forked spot
    await redis.set(spot_key(new_spot_id), json.dumps(forked_spot))
    
    # Add to spots list
    await redis.zadd(SPOTS_KEY, {new_spot_id: float(time.time())})
    
    return {
        "id": new_spot_id,
        "parent_spot_id": spot_id,
        "message": f"Spot forked successfully by {author}",
    }


import time
