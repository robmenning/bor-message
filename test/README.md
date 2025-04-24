# Kafka Testing Tools

This directory contains scripts for testing the Kafka messaging functionality of the bor-message service.

## Prerequisites

- Node.js and NPM installed
- `ts-node` installed globally (`npm install -g ts-node typescript`)
- Kafka broker running and accessible (either locally or specified via environment variables)

## Test Scripts

### 1. `test-kafka.sh` - Main Testing Script

This shell script provides a convenient way to test both producing and consuming Kafka messages.

#### Usage:

```bash
./test-kafka.sh [command] [options]
```

#### Commands:

- `produce` - Send a test message to a Kafka topic
- `consume` - Listen for messages from Kafka topics
- `help` - Show help message

#### Examples:

**Send an ETL job request:**
```bash
./test-kafka.sh produce -t bor-etl-jobs -k job-123 -m '{"jobId": "test-123", "type": "data-import", "parameters": {"source": "test-db"}}'
```

**Listen to ETL status updates:**
```bash
./test-kafka.sh consume -t bor-etl-status
```

### 2. Direct Usage of TypeScript Scripts

If you prefer, you can also use the TypeScript scripts directly:

#### Producer:

```bash
npx ts-node test/kafka-producer.ts [topic] [message] [key]
```

Example:
```bash
npx ts-node test/kafka-producer.ts bor-etl-jobs '{"jobId": "test-123", "type": "data-import"}' "job-123"
```

#### Consumer:

```bash
npx ts-node test/kafka-consumer.ts [topic1,topic2,...] [group-id]
```

Example:
```bash
npx ts-node test/kafka-consumer.ts bor-etl-jobs,bor-etl-status test-consumer-group
```

## Environment Variables

You can configure the Kafka connection using the following environment variables:

- `KAFKA_BROKER` - Kafka broker address (default: `localhost:9092`)

## Testing Workflow

### 1. Start the bor-message service

Make sure the bor-message service is running:

```bash
cd /path/to/bor-message
npm run dev
```

### 2. Open a terminal to monitor messages

```bash
cd /path/to/bor-message
./test/test-kafka.sh consume -t bor-etl-jobs,bor-etl-status
```

### 3. Send test messages from another terminal

```bash
cd /path/to/bor-message
./test/test-kafka.sh produce -t bor-etl-jobs -m '{"jobId": "test-123", "type": "data-import"}'
```

### 4. Send status updates to simulate ETL job completion

```bash
./test/test-kafka.sh produce -t bor-etl-status -m '{"jobId": "test-123", "status": "completed", "details": {"runtime": 12.5}}'
```

## Docker Testing

When testing with the bor-message service running in Docker, you'll need to specify the correct broker address:

```bash
# For connecting to Kafka from the host to the container
./test/test-kafka.sh consume -b localhost:4630

# For producing messages
./test/test-kafka.sh produce -b localhost:4630 -t bor-etl-jobs -m '{"jobId": "test-456", "type": "data-export"}'
```

For services inside the Docker network, they would use the internal docker port: `bor-message:9092`. 