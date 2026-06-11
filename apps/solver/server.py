"""
gRPC Solver Server

Runs as a separate service from FastAPI to handle:
- Long-running CFR solves via Celery
- ICM calculations
- Strategy storage and retrieval
- Progress streaming via Redis pub/sub

Port: 50051 (configurable via GRPC_PORT env var)
"""

import os
import sys
import logging
import signal
import time
from concurrent import futures

import grpc

# Add solver paths
# solver dir is current dir, no path insert needed
# path removed — gto-poker is pip-installed

# Add solver dir to path for internal imports
_solver_dir = os.path.dirname(os.path.abspath(__file__))
if _solver_dir not in sys.path:
    sys.path.insert(0, _solver_dir)

# Add proto directory to path
import sys
import os
_proto_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proto')
if _proto_dir not in sys.path:
    sys.path.insert(0, _proto_dir)

import solver_pb2_grpc
from service import SolverServicer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
GRPC_PORT = int(os.environ.get("GRPC_PORT", "50051"))
MAX_WORKERS = int(os.environ.get("GRPC_MAX_WORKERS", "10"))
SHUTDOWN_TIMEOUT = 30  # seconds


def serve():
    """Start the gRPC server."""
    # Create server with thread pool
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    
    # Add servicer
    solver_pb2_grpc.add_SolverServiceServicer_to_server(
        SolverServicer(),
        server
    )
    
    # Bind to port
    address = f'[::]:{GRPC_PORT}'
    server.add_insecure_port(address)
    
    # Start server
    server.start()
    
    logger.info(f"Solver gRPC server started on port {GRPC_PORT}")
    logger.info(f"Max workers: {MAX_WORKERS}")
    
    # Register signal handlers for graceful shutdown
    def handle_shutdown(signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        server.stop(grace=SHUTDOWN_TIMEOUT)
    
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    
    # Wait for termination
    server.wait_for_termination()
    logger.info("gRPC server shut down")


def main():
    """Main entry point."""
    logger.info("Starting GTO Solver gRPC server...")
    
    # Log environment (sanitized)
    logger.info(f"GRPC_PORT: {os.environ.get('GRPC_PORT', '50051')}")
    logger.info(f"REDIS_URL: {os.environ.get('REDIS_URL', 'redis://localhost:6379')[:50]}...")
    logger.info(f"DATABASE_URL: {os.environ.get('DATABASE_URL', 'postgresql://localhost:5432/gto_wizard')[:50]}...")
    
    serve()


if __name__ == "__main__":
    main()