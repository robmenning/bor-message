import express, { Request, Response } from 'express';
import kafkaService from '../services/kafka';
import logger from '../utils/logger';
import config from '../config';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Submit an ETL job request
 */
router.post('/etl/job', async (req: Request, res: Response) => {
  try {
    const { jobType, userId, parameters } = req.body;
    
    if (!jobType || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: jobType, userId'
      });
    }
    
    const jobId = `etl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const jobRequest = {
      jobId,
      jobType,
      userId,
      parameters: parameters || {},
      timestamp: new Date().toISOString()
    };
    
    await kafkaService.publish(config.topics.etlJobs, jobRequest, jobId);
    
    logger.info(`ETL job request submitted: ${jobId}`);
    
    res.status(202).json({
      message: 'ETL job request submitted successfully',
      jobId
    });
  } catch (error) {
    logger.error(`Failed to submit ETL job request: ${error}`);
    res.status(500).json({
      error: 'Failed to submit ETL job request'
    });
  }
});

/**
 * Submit an ETL job status update
 * This endpoint would typically be called by the ETL service
 */
router.post('/etl/status', async (req: Request, res: Response) => {
  try {
    const { jobId, status, progress, result, error } = req.body;
    
    if (!jobId || !status) {
      return res.status(400).json({
        error: 'Missing required fields: jobId, status'
      });
    }
    
    const allowedStatuses = ['STARTED', 'RUNNING', 'COMPLETED', 'FAILED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status: ${status}. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }
    
    const statusUpdate = {
      jobId,
      status,
      progress,
      result,
      error,
      timestamp: new Date().toISOString()
    };
    
    await kafkaService.publish(config.topics.etlStatus, statusUpdate, jobId);
    
    logger.info(`ETL job status update published: ${jobId} - ${status}`);
    
    res.status(202).json({
      message: 'ETL job status update published successfully'
    });
  } catch (error) {
    logger.error(`Failed to publish ETL job status update: ${error}`);
    res.status(500).json({
      error: 'Failed to publish ETL job status update'
    });
  }
});

export default router; 