# BOR Message Service

A lightweight Kafka-based messaging middleware service for the BOR system.

## Overview

The BOR Message Service facilitates asynchronous communication between different components of the BOR system. It provides a simple API for sending and receiving messages via Kafka topics.

Key features:
- Lightweight Kafka implementation with minimal dependencies
- Simple REST API for message publishing and subscription
- Support for ETL job request and status monitoring
- Easy deployment with Docker

## System Integration

This service is designed to integrate with other BOR system components:

- **bor-app (Next.js web app)**: Requests ETL job execution and displays status updates
- **bor-api (Express API)**: Coordinates with the messaging service to request jobs
- **bor-etl (ETL service)**: Processes ETL jobs and sends status updates back

## Port Configuration

This service uses the following port configuration:

| Environment | Port  | Docker Internal Port |
|-------------|-------|----------------------|
| Development | 4430  | 9092                 |
| Staging     | 4530  | 9092                 |
| Production  | 4630  | 9092                 |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)

### Initial Setup

Create the required environment files:

```bash
./scripts/setup-env.sh
```

### Using Docker

#### Development (with Docker Compose)

1. Start the service:

```bash
./scripts/service-start.sh
```

2. Stop the service:

```bash
./scripts/service-stop.sh
```

#### Production (without Docker Compose)

For environments that don't support Docker Compose:

```bash
# Start in production mode (default)
./scripts/docker-prod.sh

# Start in development mode
./scripts/docker-prod.sh development

# Start in staging mode
./scripts/docker-prod.sh staging

# Start with custom port
./scripts/docker-prod.sh production 4700
```

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Start Kafka locally (using Docker):

```bash
docker-compose up -d zookeeper kafka
```

3. Run the service in development mode:

```bash
npm run dev
```

## API Endpoints

### Health Check

```
GET /api/health
```

### Submit ETL Job Request

```
POST /api/etl/job
```

Request body:
```json
{
  "jobType": "IMPORT_DATA",
  "userId": "user123",
  "parameters": {
    "sourceFile": "example.csv",
    "targetTable": "transactions"
  }
}
```

### Submit ETL Job Status Update

```
POST /api/etl/status
```

Request body:
```json
{
  "jobId": "etl-1234567890",
  "status": "COMPLETED",
  "progress": 100,
  "result": {
    "rowsProcessed": 1500,
    "warnings": []
  }
}
```

## Kafka Topics

- **bor-etl-jobs**: Job requests from the web app or API to the ETL service
- **bor-etl-status**: Status updates from the ETL service back to the app

## Environment Variables

| Variable         | Description                             | Default               |
|------------------|-----------------------------------------|-----------------------|
| KAFKA_BROKER     | Kafka broker address                    | localhost:9092        |
| KAFKA_CLIENT_ID  | Kafka client ID                         | bor-message-client    |
| KAFKA_GROUP_ID   | Kafka consumer group ID                 | bor-message-group     |
| PORT             | Service API port                        | 4430                  |
| NODE_ENV         | Node environment                        | development           |
| LOG_LEVEL        | Log level (debug, info, warn, error)    | info                  |

## Troubleshooting

### Common Issues

#### Docker Build Failures

If you encounter Docker build failures, try these steps:

1. Clean your Docker environment:
   ```bash
   ./scripts/service-stop.sh
   docker system prune -f
   ```

2. Rebuild without cache:
   ```bash
   docker-compose build --no-cache
   ```

#### Kafka Connection Issues

If Kafka fails to connect:

1. Check Kafka logs:
   ```bash
   docker logs bor-kafka
   ```

2. Ensure the network is properly set up:
   ```bash
   docker network inspect bor-network
   ```

3. Try restarting just Kafka:
   ```bash
   docker-compose restart kafka
   ```

#### API Not Responding

If the API endpoint isn't responding:

1. Check the service logs:
   ```bash
   docker logs bor-message
   ```

2. Verify the service is running and health check is passing:
   ```bash
   docker ps
   curl http://localhost:4430/api/health
   ```

3. Ensure the port is correctly exposed:
   ```bash
   docker-compose ps
   ```

### Debug Mode

For more detailed logs, modify the `.env` or `.env.development` file to set:

```
LOG_LEVEL=debug
```

Then restart the service:
```bash
./scripts/service-stop.sh && ./scripts/service-start.sh
```
