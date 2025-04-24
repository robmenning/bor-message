/**
 * TypeScript example client to demonstrate how to interact with the BOR Message Service API
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:4430/api';

// Types
type JobType = 'IMPORT_DATA' | 'EXPORT_DATA' | 'TRANSFORM_DATA' | 'VALIDATE_DATA';
type JobStatus = 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface JobRequest {
  jobType: JobType;
  userId: string;
  parameters?: Record<string, any>;
}

interface JobResponse {
  message: string;
  jobId: string;
}

interface StatusUpdate {
  jobId: string;
  status: JobStatus;
  progress?: number;
  result?: any;
  error?: string;
}

interface StatusResponse {
  message: string;
}

interface HealthResponse {
  status: string;
}

/**
 * Submit an ETL job request
 * @param jobType - The type of ETL job to run
 * @param userId - The ID of the user submitting the job
 * @param parameters - Additional job parameters
 * @returns Job submission response
 */
async function submitEtlJob(
  jobType: JobType, 
  userId: string, 
  parameters: Record<string, any> = {}
): Promise<JobResponse> {
  try {
    const response = await fetch(`${BASE_URL}/etl/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobType,
        userId,
        parameters
      } as JobRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit ETL job: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as JobResponse;
  } catch (error) {
    console.error('Error submitting ETL job:', error);
    throw error;
  }
}

/**
 * Update an ETL job status
 * @param jobId - The ID of the job to update
 * @param status - The new status
 * @param progress - Optional progress percentage
 * @param result - Optional result data
 * @param error - Optional error message
 * @returns Status update response
 */
async function updateEtlJobStatus(
  jobId: string, 
  status: JobStatus, 
  progress?: number, 
  result?: any, 
  error?: string
): Promise<StatusResponse> {
  try {
    const response = await fetch(`${BASE_URL}/etl/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        status,
        progress,
        result,
        error
      } as StatusUpdate)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ETL job status: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as StatusResponse;
  } catch (error) {
    console.error('Error updating ETL job status:', error);
    throw error;
  }
}

/**
 * Check the health of the BOR Message Service
 * @returns Health check response
 */
async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as HealthResponse;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

// Example usage
async function runExample(): Promise<void> {
  try {
    // Check health
    console.log('Checking service health...');
    const healthStatus = await checkHealth();
    console.log('Health check result:', healthStatus);
    
    // Submit ETL job
    console.log('\nSubmitting ETL job...');
    const jobSubmission = await submitEtlJob(
      'IMPORT_DATA',
      'user123',
      {
        sourceFile: 'example.csv',
        targetTable: 'transactions'
      }
    );
    
    console.log('Job submission result:', jobSubmission);
    const { jobId } = jobSubmission;
    
    // Simulate ETL job progress updates
    console.log('\nSimulating job progress updates...');
    
    // Job started
    console.log('Updating job status to STARTED...');
    await updateEtlJobStatus(jobId, 'STARTED', 0);
    
    // Job running (50% complete)
    console.log('Updating job status to RUNNING (50%)...');
    await updateEtlJobStatus(jobId, 'RUNNING', 50);
    
    // Job complete
    console.log('Updating job status to COMPLETED...');
    await updateEtlJobStatus(
      jobId,
      'COMPLETED',
      100,
      {
        rowsProcessed: 1500,
        warnings: []
      }
    );
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
} 