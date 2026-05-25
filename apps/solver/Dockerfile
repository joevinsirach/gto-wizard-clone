FROM python:3.12-slim

WORKDIR /app

# Install system deps for C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY apps/solver/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY apps/solver/ .

# Expose gRPC port
EXPOSE 50051

# Run solver service
CMD ["python", "-m", "solver.service"]