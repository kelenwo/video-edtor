.PHONY: build run test clean docker-build docker-run docker-stop help

# Default target
all: help

# Build the application
build:
	@echo "Building video processor..."
	go build -o video-processor *.go

# Run the application locally
run: build
	@echo "Starting video processor server..."
	./video-processor

# Run in development mode with hot reload
dev:
	@echo "Starting development server..."
	go run *.go

# Run tests
test:
	@echo "Running tests..."
	go test ./...

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f video-processor
	rm -rf outputs/*
	rm -rf temp/*

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	docker build -t video-processor .

# Run with Docker Compose
docker-run:
	@echo "Starting with Docker Compose..."
	docker-compose up --build

# Stop Docker Compose
docker-stop:
	@echo "Stopping Docker Compose..."
	docker-compose down

# Run Docker container
docker-run-single:
	@echo "Running Docker container..."
	docker run -p 8080:8080 \
		-v $(PWD)/outputs:/app/outputs \
		-v $(PWD)/temp:/app/temp \
		video-processor

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod download

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Lint code
lint:
	@echo "Linting code..."
	golangci-lint run

# Generate documentation
docs:
	@echo "Generating documentation..."
	godoc -http=:6060

# Test API endpoints
test-api:
	@echo "Testing API endpoints..."
	@echo "Testing basic processing..."
	curl -X POST http://localhost:8080/api/process \
		-H "Content-Type: application/json" \
		-d @sample_project.json
	@echo ""
	@echo "Testing status endpoint..."
	curl http://localhost:8080/api/status?project_id=sample-project-123

# Check FFmpeg installation
check-ffmpeg:
	@echo "Checking FFmpeg installation..."
	@if command -v ffmpeg >/dev/null 2>&1; then \
		echo "FFmpeg is installed:"; \
		ffmpeg -version | head -1; \
	else \
		echo "FFmpeg is not installed. Please install FFmpeg first."; \
		exit 1; \
	fi

# Setup development environment
setup: check-ffmpeg deps
	@echo "Setting up development environment..."
	mkdir -p outputs temp
	@echo "Development environment ready!"

# Production build
prod-build:
	@echo "Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o video-processor *.go

# Install locally
install: build
	@echo "Installing video processor..."
	sudo cp video-processor /usr/local/bin/
	@echo "Video processor installed to /usr/local/bin/"

# Uninstall
uninstall:
	@echo "Uninstalling video processor..."
	sudo rm -f /usr/local/bin/video-processor
	@echo "Video processor uninstalled"

# Show help
help:
	@echo "Video Processing Engine - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  setup        - Setup development environment"
	@echo "  build        - Build the application"
	@echo "  run          - Build and run locally"
	@echo "  dev          - Run in development mode"
	@echo "  test         - Run tests"
	@echo "  fmt          - Format code"
	@echo "  lint         - Lint code"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  docker-stop  - Stop Docker Compose"
	@echo "  docker-run-single - Run single Docker container"
	@echo ""
	@echo "Testing:"
	@echo "  test-api     - Test API endpoints"
	@echo "  check-ffmpeg - Check FFmpeg installation"
	@echo ""
	@echo "Production:"
	@echo "  prod-build   - Build for production"
	@echo "  install      - Install locally"
	@echo "  uninstall    - Uninstall"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean        - Clean build artifacts"
	@echo "  deps         - Install dependencies"
	@echo "  docs         - Generate documentation"
	@echo ""
	@echo "Example usage:"
	@echo "  make setup && make dev"
	@echo "  make docker-run"
	@echo "  make test-api" 