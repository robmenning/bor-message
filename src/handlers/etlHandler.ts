import { EachMessagePayload } from 'kafkajs';
import logger from '../utils/logger';
import kafkaService from '../services/kafka';
import config from '../config';

/**
 * Represents the structure of an ETL job request
 */
interface EtlJobRequest {
  jobId: string;
  jobType: string;
  userId: string;
  parameters: Record<string, any>;
  timestamp: string;
}

/**
 * Represents the structure of an ETL job status update
 */
interface EtlJobStatus {
  jobId: string;
  status: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  result?: any;
  error?: string;
  timestamp: string;
}

/**
 * Process ETL job requests
 */
export async function handleEtlJobRequest(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;
  const messageValue = message.value?.toString();
  
  if (!messageValue) {
    logger.warn(`Received empty message on topic ${topic}, partition ${partition}`);
    return;
  }
  
  try {
    const jobRequest: EtlJobRequest = JSON.parse(messageValue);
    
    logger.info(`Processing ETL job request: ${jobRequest.jobId} (${jobRequest.jobType})`);
    
    // Here we would typically forward the request to the ETL service
    // For this example, we'll just log it and simulate a successful job start
    
    // Publish a status update indicating the job has started
    await kafkaService.publish(config.topics.etlStatus, {
      jobId: jobRequest.jobId,
      status: 'STARTED',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`ETL job ${jobRequest.jobId} request processed`);
  } catch (error) {
    logger.error(`Failed to process ETL job request: ${error}`);
  }
}

/**
 * Process ETL job status updates
 */
export async function handleEtlJobStatus(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;
  const messageValue = message.value?.toString();
  
  if (!messageValue) {
    logger.warn(`Received empty message on topic ${topic}, partition ${partition}`);
    return;
  }
  
  try {
    const statusUpdate: EtlJobStatus = JSON.parse(messageValue);
    
    logger.info(`Received ETL job status update: ${statusUpdate.jobId} - ${statusUpdate.status}`);
    
    // Here you would typically:
    // 1. Store the status update in a database
    // 2. Notify any clients waiting for updates (e.g. via WebSockets)
    
    // For demonstration purposes, we're just logging the update
    if (statusUpdate.status === 'COMPLETED') {
      logger.info(`ETL job ${statusUpdate.jobId} completed successfully`);
    } else if (statusUpdate.status === 'FAILED') {
      logger.error(`ETL job ${statusUpdate.jobId} failed: ${statusUpdate.error}`);
    }
  } catch (error) {
    logger.error(`Failed to process ETL job status update: ${error}`);
  }
} 