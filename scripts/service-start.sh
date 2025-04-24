#!/bin/bash

# Exit on error
set -e

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create the bor-network if it doesn't exist
if ! docker network inspect bor-network > /dev/null 2>&1; then
    echo "Creating bor-network..."
    docker network create bor-network
fi

# Ensure environment files exist
if [ ! -f .env ] || [ ! -f .env.development ] || [ ! -f .env.production ]; then
    echo "Creating environment files..."
    ./scripts/setup-env.sh
fi

# Check if we have package-lock.json (needed for npm ci)
if [ ! -f package-lock.json ]; then
    echo "Creating package-lock.json..."
    npm install --package-lock-only
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down -v 2>/dev/null || true
docker rm -f bor-message bor-kafka bor-zookeeper 2>/dev/null || true

# Build and start the containers
echo "Starting BOR Message service..."
docker-compose build --no-cache
docker-compose up -d

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
READY=false
for i in {1..30}; do
    if docker exec bor-kafka kafka-topics --bootstrap-server kafka:29092 --list > /dev/null 2>&1; then
        echo "Kafka is ready!"
        READY=true
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "Timed out waiting for Kafka to be ready"
        echo "Check logs with: docker logs bor-kafka"
        exit 1
    fi
    
    echo "Still waiting... (Attempt $i of 30)"
    sleep 2
done

# Only proceed if Kafka is ready
if $READY; then
    # Create the required topics
    echo "Creating Kafka topics..."
    docker exec bor-kafka kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic bor-etl-jobs --partitions 3 --replication-factor 1
    docker exec bor-kafka kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic bor-etl-status --partitions 3 --replication-factor 1

    echo "BOR Message service started successfully!"
    echo "API is available at: http://localhost:4430/api"
    echo "To check the service logs: docker logs bor-message -f"
    echo "To check Kafka logs: docker logs bor-kafka -f"
    echo "To check Zookeeper logs: docker logs bor-zookeeper -f"
else
    echo "Failed to start Kafka properly. Please check Docker logs for issues."
    exit 1
fi 