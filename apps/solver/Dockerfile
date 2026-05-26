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

# Copy requirements
COPY apps/solver/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install PokerHandEvaluator with C++ extensions
# The phevaluator package has C++ code that gets compiled via cmake/setuptools
COPY /tmp/PokerHandEvaluator/python /tmp/phevaluator-src
RUN pip install --no-cache-dir /tmp/phevaluator-src

# Copy source
COPY apps/solver/ .

# Expose gRPC port
EXPOSE 50051

# Run solver service
CMD ["python", "-m", "solver.service"]
