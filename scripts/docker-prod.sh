#!/bin/bash

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

# Default environment
ENV=${1:-"production"}
PORT=${2:-"4630"}

if [ "$ENV" = "development" ]; then
    PORT=4430
elif [ "$ENV" = "staging" ]; then
    PORT=4530
fi

# Stop and remove existing containers
echo "Stopping existing containers..."
docker stop bor-zookeeper bor-kafka bor-message 2>/dev/null || true
docker rm bor-zookeeper bor-kafka bor-message 2>/dev/null || true

# Start Zookeeper
echo "Starting Zookeeper..."
docker run -d --name bor-zookeeper \
    --network bor-network \
    -e ZOOKEEPER_CLIENT_PORT=2181 \
    -e ZOOKEEPER_TICK_TIME=2000 \
    confluentinc/cp-zookeeper:7.4.3

# Wait for Zookeeper to start
sleep 5

# Start Kafka
echo "Starting Kafka..."
docker run -d --name bor-kafka \
    --network bor-network \
    -p 9092:9092 \
    -e KAFKA_BROKER_ID=1 \
    -e KAFKA_ZOOKEEPER_CONNECT=bor-zookeeper:2181 \
    -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://bor-kafka:29092,PLAINTEXT_HOST://localhost:9092 \
    -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT \
    -e KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT \
    -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
    confluentinc/cp-kafka:7.4.3

# Wait for Kafka to start
echo "Waiting for Kafka to be ready..."
for i in {1..30}; do
    if docker exec bor-kafka kafka-topics --bootstrap-server bor-kafka:29092 --list > /dev/null 2>&1; then
        echo "Kafka is ready!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "Timed out waiting for Kafka to be ready"
        exit 1
    fi
    
    echo "Still waiting..."
    sleep 2
done

# Create the required topics
echo "Creating Kafka topics..."
docker exec bor-kafka kafka-topics --bootstrap-server bor-kafka:29092 --create --if-not-exists --topic bor-etl-jobs --partitions 3 --replication-factor 1
docker exec bor-kafka kafka-topics --bootstrap-server bor-kafka:29092 --create --if-not-exists --topic bor-etl-status --partitions 3 --replication-factor 1

# Build the BOR Message service
echo "Building BOR Message service..."
docker build -t bor-message:latest .

# Start the BOR Message service
echo "Starting BOR Message service..."
docker run -d --name bor-message \
    --network bor-network \
    -p ${PORT}:${PORT} \
    -e NODE_ENV=${ENV} \
    -e KAFKA_BROKER=bor-kafka:29092 \
    -e PORT=${PORT} \
    bor-message:latest

echo "BOR Message service started successfully!"
echo "API is available at: http://localhost:${PORT}/api"
echo "To check the logs: docker logs bor-message -f" 