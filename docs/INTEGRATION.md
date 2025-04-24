# BOR Message Service Integration Guide

This guide explains how other services in the BOR system can integrate with the messaging service.

## Overview

The BOR Message Service acts as a middleware layer that enables asynchronous communication between different parts of the system. It uses Kafka as the underlying message broker.

## Integration Scenarios

### 1. Web App (bor-app) to ETL Service (bor-etl)

The typical flow for ETL job requests:

1. User clicks "Start ETL Job" in the web app
2. Web app calls API endpoint to request job execution
3. API publishes message to `bor-etl-jobs` topic
4. ETL service consumes message and processes the job
5. ETL service publishes status updates to `bor-etl-status` topic
6. Web app receives updates and displays progress/completion to user

### 2. Direct API Integration

Services can directly interact with the messaging service API:

```
POST /api/etl/job    # Submit a job request
POST /api/etl/status # Update job status
```

See the [examples directory](../examples/) for client implementation samples.

## Message Format

### ETL Job Request

```json
{
  "jobId": "etl-1234567890",
  "jobType": "IMPORT_DATA",
  "userId": "user123",
  "parameters": {
    "sourceFile": "example.csv",
    "targetTable": "transactions"
  },
  "timestamp": "2023-01-01T12:00:00.000Z"
}
```

### ETL Job Status Update

```json
{
  "jobId": "etl-1234567890",
  "status": "COMPLETED",
  "progress": 100,
  "result": {
    "rowsProcessed": 1500,
    "warnings": []
  },
  "error": null,
  "timestamp": "2023-01-01T12:05:00.000Z"
}
```

## Integration Methods

### Method 1: Direct Kafka Integration

Services can directly connect to Kafka and subscribe to topics:

```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'your-service-client',
  brokers: ['kafka:29092']
});

const consumer = kafka.consumer({ groupId: 'your-service-group' });
await consumer.connect();
await consumer.subscribe({ topic: 'bor-etl-status' });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const statusUpdate = JSON.parse(message.value.toString());
    // Process status update
  }
});
```

### Method 2: REST API Integration

Services can use the REST API to publish messages:

```typescript
async function submitJob() {
  const response = await fetch('http://bor-message:4430/api/etl/job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobType: 'IMPORT_DATA',
      userId: 'user123',
      parameters: { /* job parameters */ }
    })
  });
  
  return await response.json();
}
```

## Connection Details

### Development Environment

- REST API: `http://localhost:4430/api`
- Kafka Broker: `localhost:9092` (external), `kafka:29092` (internal Docker network)

### Staging Environment

- REST API: `http://localhost:4530/api`
- Kafka Broker: `localhost:9092` (external), `kafka:29092` (internal Docker network)

### Production Environment

- REST API: `http://localhost:4630/api`
- Kafka Broker: `localhost:9092` (external), `kafka:29092` (internal Docker network)

## Error Handling

Services integrating with the messaging service should implement:

1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Circuit Breaking**: Detect when the messaging service is unavailable
3. **Dead Letter Queues**: Handle messages that can't be processed
4. **Monitoring**: Track message delivery success/failure rates

## Monitoring

To monitor the messaging service:

- Check container logs: `docker logs bor-message`
- Health endpoint: `GET /api/health`
- Kafka topics status: `docker exec bor-kafka kafka-topics --bootstrap-server kafka:29092 --list` 