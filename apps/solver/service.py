import grpc
from concurrent import futures
import solver_pb2
import solver_pb2_grpc
import threading
import time

class SolverServicer(solver_pb2_grpc.SolverServicer):
    def __init__(self):
        self.jobs = {}
        self.lock = threading.Lock()
    
    def SubmitSolve(self, request, context):
        job_id = f"job_{len(self.jobs)}"
        with self.lock:
            self.jobs[job_id] = {"status": "running", "progress": 0}
        
        # Simulate solve progress
        def run_solve():
            for i in range(10):
                time.sleep(0.5)
                with self.lock:
                    self.jobs[job_id]["progress"] = (i + 1) * 10
        
        thread = threading.Thread(target=run_solve)
        thread.start()
        
        return solver_pb2.SolveResponse(
            job_id=job_id,
            status="running",
            progress=0,
            strategy=[]
        )
    
    def GetSolveStatus(self, request, context):
        job_id = request.job_id
        with self.lock:
            job = self.jobs.get(job_id, {"status": "unknown", "progress": 0})
        return solver_pb2.SolveResponse(
            job_id=job_id,
            status=job["status"],
            progress=job["progress"],
            strategy=[]
        )
