#!/bin/bash

echo "Stopping BOR Message service..."
docker-compose down

echo "Removing containers..."
docker rm -f bor-message bor-kafka bor-zookeeper 2>/dev/null || true

echo "BOR Message service stopped successfully!" 