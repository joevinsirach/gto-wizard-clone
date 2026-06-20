"""Normalize DATABASE_URL for SQLAlchemy (asyncpg driver) vs raw asyncpg."""

from __future__ import annotations

import os


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    # Repo root: apps/api/services -> ../../../
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    load_dotenv(os.path.join(repo_root, ".env"))


_load_dotenv()


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "").strip()


def sqlalchemy_url(url: str | None = None) -> str:
    """Return a URL suitable for SQLAlchemy create_async_engine."""
    url = (url or get_database_url()).strip()
    if not url:
        return ""
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def asyncpg_url(url: str | None = None) -> str:
    """Return a URL suitable for asyncpg.connect / create_pool."""
    url = (url or get_database_url()).strip()
    if not url:
        return ""
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url
