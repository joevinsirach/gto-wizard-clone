#!/usr/bin/env python3
"""
Startup script for GTO Solver gRPC service.

This script properly configures the Python path to import generated protobuf
modules and starts the gRPC server.

Usage:
    python start_grpc_server.py [--port PORT] [--workers N]

Environment variables:
    GRPC_PORT: Port to listen on (default: 50051)
    GRPC_MAX_WORKERS: Max thread pool workers (default: 10)
    REDIS_URL: Redis connection URL
    DATABASE_URL: PostgreSQL connection URL
"""

import os
import sys
import argparse
import logging
import signal
import threading

# Set up paths - import from proto directory
PROTO_DIR = os.path.join(os.path.dirname(__file__), 'proto')
SOLVER_DIR = os.path.dirname(__file__)
PACKAGES_DIR = os.path.join(os.path.dirname(SOLVER_DIR), 'packages', 'poker-core', 'src')

# Ensure proto directory is in path for imports
if PROTO_DIR not in sys.path:
    sys.path.insert(0, PROTO_DIR)

if SOLVER_DIR not in sys.path:
    sys.path.insert(0, SOLVER_DIR)

if PACKAGES_DIR not in sys.path:
    sys.path.insert(0, PACKAGES_DIR)

# Now we can import the generated protobuf modules
from solver_pb2_grpc import add_SolverServiceServicer_to_server
import grpc
from concurrent import futures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
GRPC_PORT = int(os.environ.get("GRPC_PORT", "50051"))
MAX_WORKERS = int(os.environ.get("GRPC_MAX_WORKERS", "10"))
SHUTDOWN_TIMEOUT = 30  # seconds


def create_server():
    """Create and configure the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    
    # Import the servicer from service.py
    from service import SolverServicer
    add_SolverServiceServicer_to_server(SolverServicer(), server)
    
    address = f'[::]:{GRPC_PORT}'
    server.add_insecure_port(address)
    
    return server


def serve():
    """Start the gRPC server."""
    logger.info(f"Starting GTO Solver gRPC server...")
    logger.info(f"Proto directory: {PROTO_DIR}")
    logger.info(f"Python path: {sys.path[:3]}")
    
    # Create server
    server = create_server()
    
    # Start server
    server.start()
    logger.info(f"Solver gRPC server started on port {GRPC_PORT}")
    logger.info(f"Max workers: {MAX_WORKERS}")
    
    # Set up signal handlers for graceful shutdown
    shutdown_event = threading.Event()
    
    def handle_shutdown(signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        server.stop(grace=SHUTDOWN_TIMEOUT)
        shutdown_event.set()
    
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    
    # Block until shutdown
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        server.stop(grace=SHUTDOWN_TIMEOUT)
    
    logger.info("gRPC server shut down")


def main():
    """Main entry point with argument parsing."""
    parser = argparse.ArgumentParser(description='Start GTO Solver gRPC server')
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=50051,
        help='Port to listen on (default: 50051)'
    )
    parser.add_argument(
        '--workers', '-w',
        type=int,
        default=10,
        help='Max thread workers (default: 10)'
    )
    
    args = parser.parse_args()
    
    global GRPC_PORT, MAX_WORKERS
    GRPC_PORT = args.port
    MAX_WORKERS = args.workers
    
    logger.info("=" * 50)
    logger.info("GTO Solver gRPC Service")
    logger.info("=" * 50)
    logger.info(f"Port: {GRPC_PORT}")
    logger.info(f"Workers: {MAX_WORKERS}")
    logger.info(f"Redis: {os.environ.get('REDIS_URL', 'redis://localhost:6379')}")
    logger.info(f"Database: {os.environ.get('DATABASE_URL', 'postgresql://localhost:5432/gto_wizard')[:50]}...")
    logger.info("=" * 50)
    
    serve()


if __name__ == "__main__":
    main()