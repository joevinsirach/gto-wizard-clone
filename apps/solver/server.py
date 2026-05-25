import grpc
from concurrent import futures
import solver_pb2_grpc
import service

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    solver_pb2_grpc.add_SolverServicer_to_server(service.SolverServicer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Solver gRPC server running on port 50051")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
