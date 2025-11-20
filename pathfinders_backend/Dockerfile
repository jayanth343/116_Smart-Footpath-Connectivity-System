# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY best.pt .
COPY ultralytics/ ./ultralytics/

# Create uploads directory
RUN mkdir -p backend/uploads

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV MALLOC_TRIM_THRESHOLD_=100000
ENV MALLOC_MMAP_THRESHOLD_=100000

# Expose port
EXPOSE 8080

# Run with optimized gunicorn settings for Cloud Run
# Single worker to minimize memory, multiple threads for concurrency
CMD exec gunicorn --bind 0.0.0.0:8080 app:app \
    --workers 1 \
    --threads 4 \
    --worker-class gthread \
    --timeout 300 \
    --keep-alive 5 \
    --max-requests 50 \
    --max-requests-jitter 10 \
    --log-level info \
    --access-logfile - \
    --error-logfile -