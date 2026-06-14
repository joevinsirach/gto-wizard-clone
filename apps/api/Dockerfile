FROM python:3.12-slim
WORKDIR /app

# Copy and install API deps
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy and install shared poker-core package
COPY packages/poker-core /tmp/poker-core
RUN pip install --no-cache-dir /tmp/poker-core

# Copy API source
COPY apps/api/ .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
