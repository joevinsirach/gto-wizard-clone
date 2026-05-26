FROM python:3.12-slim

WORKDIR /app

# Copy requirements
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY apps/worker/ .

# Run celery worker
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]