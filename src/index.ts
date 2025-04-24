import app from './api/app';
import config from './config';
import logger from './utils/logger';
import kafkaService from './services/kafka';
import { handleEtlJobRequest, handleEtlJobStatus } from './handlers/etlHandler';

// Handle application shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await kafkaService.disconnect();
  process.exit(0);
});

// Initialize and start the application
async function startApp() {
  try {
    // Connect to Kafka
    await kafkaService.connect();
    
    // Register topic handlers
    kafkaService.registerTopicHandler(config.topics.etlJobs, handleEtlJobRequest);
    kafkaService.registerTopicHandler(config.topics.etlStatus, handleEtlJobStatus);
    
    // Start the Kafka consumer
    await kafkaService.startConsumer();
    
    // Start Express server
    const server = app.listen(config.service.port, () => {
      logger.info(`BOR Message service listening on port ${config.service.port}`);
      logger.info(`Environment: ${config.service.nodeEnv}`);
    });
    
    server.on('error', (err) => {
      logger.error(`Server error: ${err}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start application: ${error}`);
    process.exit(1);
  }
}

// Start the application
startApp().catch((error) => {
  logger.error(`Unexpected error during startup: ${error}`);
  process.exit(1);
}); 