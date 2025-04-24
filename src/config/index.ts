import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'development'
    ? '.env.development'
    : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default {
  // Kafka configuration
  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID || 'bor-message-client',
    groupId: process.env.KAFKA_GROUP_ID || 'bor-message-group',
  },
  
  // Topics
  topics: {
    etlJobs: process.env.KAFKA_TOPIC_ETL_JOBS || 'bor-etl-jobs',
    etlStatus: process.env.KAFKA_TOPIC_ETL_STATUS || 'bor-etl-status',
  },
  
  // Service configuration
  service: {
    port: parseInt(process.env.PORT || '4430', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}; 