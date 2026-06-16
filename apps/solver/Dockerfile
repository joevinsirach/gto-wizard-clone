# Final stage
FROM python:3.12-slim

WORKDIR /app

# Install system deps for C extensions and PokerHandEvaluator C++ library
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    cmake \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install deps
COPY apps/solver/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install phevaluator (hand evaluator pip package) instead of local PokerHandEvaluator
RUN pip install --no-cache-dir phevaluator

# Install gto-poker (shared poker-core library) — needs to be installed first
# so service.py can import gto_poker
COPY packages/poker-core/ /tmp/poker-core/
RUN pip install --no-cache-dir /tmp/poker-core/ && rm -rf /tmp/poker-core/

# Copy source
COPY apps/solver/ .

# Expose gRPC port
EXPOSE 50051

# Run solver service
CMD ["python", "start_grpc_server.py"]
