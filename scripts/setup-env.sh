#!/bin/bash

# Create logs directory
mkdir -p logs

# Create base .env file
cat > .env << EOL
# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=bor-message-client
KAFKA_GROUP_ID=bor-message-group

# Topics
KAFKA_TOPIC_ETL_JOBS=bor-etl-jobs
KAFKA_TOPIC_ETL_STATUS=bor-etl-status

# Service Configuration
PORT=4430
NODE_ENV=development

# Logging
LOG_LEVEL=info
EOL

# Create development environment
cat > .env.development << EOL
# Kafka Configuration
KAFKA_BROKER=kafka:29092
KAFKA_CLIENT_ID=bor-message-client-dev
KAFKA_GROUP_ID=bor-message-group-dev

# Topics
KAFKA_TOPIC_ETL_JOBS=bor-etl-jobs
KAFKA_TOPIC_ETL_STATUS=bor-etl-status

# Service Configuration
PORT=4430
NODE_ENV=development

# Logging
LOG_LEVEL=debug
EOL

# Create production environment
cat > .env.production << EOL
# Kafka Configuration
KAFKA_BROKER=kafka:29092
KAFKA_CLIENT_ID=bor-message-client-prod
KAFKA_GROUP_ID=bor-message-group-prod

# Topics
KAFKA_TOPIC_ETL_JOBS=bor-etl-jobs
KAFKA_TOPIC_ETL_STATUS=bor-etl-status

# Service Configuration
PORT=4630
NODE_ENV=production

# Logging
LOG_LEVEL=info
EOL

echo "Environment files created successfully!"
