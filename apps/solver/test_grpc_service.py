#!/usr/bin/env python3
"""
Test script for GTO Solver gRPC service.
Verifies the server can start and handle basic requests.
"""

import sys
import time

# Add proto directory to path
PROTO_DIR = '/tmp/gto-wizard-clone/apps/solver/proto'
sys.path.insert(0, PROTO_DIR)

import grpc
from solver_pb2 import HealthRequest, ICMRequest, GetStrategyRequest
from solver_pb2_grpc import SolverServiceStub

def test_grpc_server():
    """Test that the gRPC server is running and responding."""
    server_address = 'localhost:50051'
    
    print(f"Connecting to gRPC server at {server_address}...")
    
    try:
        # Create channel
        channel = grpc.insecure_channel(server_address)
        
        # Create stub
        stub = SolverServiceStub(channel)
        
        # Set timeout
        timeout = 5.0
        
        # Test 1: Health check
        print("\n[1] Testing HealthCheck...")
        try:
            response = stub.HealthCheck(
                HealthRequest(service="solver"),
                timeout=timeout
            )
            print(f"    Health check: {response.healthy}")
            print(f"    Status: {response.status}")
            print(f"    Details: {dict(response.details)}")
        except grpc.RpcError as e:
            print(f"    Health check failed: {e.code()} - {e.details()}")
        
        # Test 2: ICM calculation
        print("\n[2] Testing CalculateICM...")
        try:
            icm_request = ICMRequest(
                stacks=[5000, 3000, 2000],
                prize_pool=100.0,
            )
            response = stub.CalculateICM(icm_request, timeout=timeout)
            print(f"    Total prize pool: {response.total_prize_pool}")
            print(f"    Number of results: {len(response.results)}")
            for r in response.results:
                print(f"    Player {r.player}: equity={r.equity:.4f}, chip_equity={r.chip_equity:.4f}")
        except grpc.RpcError as e:
            print(f"    ICM calculation failed: {e.code()} - {e.details()}")
        
        # Test 3: GetStrategy
        print("\n[3] Testing GetStrategy...")
        try:
            strategy_request = GetStrategyRequest(
                game_type="nlh",
                board="Kd7h2c",
                stack_depth=100,
                street="flop",
                players=2,
            )
            response = stub.GetStrategy(strategy_request, timeout=timeout)
            print(f"    Status: {response.status}")
            print(f"    Key: {response.key}")
        except grpc.RpcError as e:
            print(f"    GetStrategy failed: {e.code()} - {e.details()}")
        
        print("\n[gRPC service is working!]")
        channel.close()
        return True
        
    except grpc.RpcError as e:
        print(f"\nConnection failed: {e.code()} - {e.details()}")
        return False
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        return False


if __name__ == '__main__':
    # Wait for server to start
    print("Waiting for gRPC server to be ready...")
    time.sleep(2)
    
    success = test_grpc_server()
    sys.exit(0 if success else 1)