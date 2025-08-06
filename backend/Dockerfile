FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod.old go.sum ./
RUN go mod download

COPY . .
RUN go build -o video-processor .

FROM ubuntu:22.04

# Install FFmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /app/outputs /app/temp

WORKDIR /app
COPY --from=builder /app/video-processor .

# Set environment variables
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV OUTPUT_DIR=/app/outputs
ENV TEMP_DIR=/app/temp
ENV PORT=8080

EXPOSE 8080

CMD ["./video-processor"] 