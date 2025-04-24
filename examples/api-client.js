/**
 * Example client to demonstrate how to interact with the BOR Message Service API
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:4430/api';

/**
 * Submit an ETL job request
 * @param {string} jobType - The type of ETL job to run
 * @param {string} userId - The ID of the user submitting the job
 * @param {object} parameters - Additional job parameters
 * @returns {Promise<object>} - Job submission response
 */
async function submitEtlJob(jobType, userId, parameters = {}) {
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
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit ETL job: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting ETL job:', error);
    throw error;
  }
}

/**
 * Update an ETL job status
 * @param {string} jobId - The ID of the job to update
 * @param {string} status - The new status (STARTED, RUNNING, COMPLETED, FAILED)
 * @param {number} progress - Optional progress percentage
 * @param {object} result - Optional result data
 * @param {string} error - Optional error message
 * @returns {Promise<object>} - Status update response
 */
async function updateEtlJobStatus(jobId, status, progress, result = null, error = null) {
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
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ETL job status: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating ETL job status:', error);
    throw error;
  }
}

/**
 * Check the health of the BOR Message Service
 * @returns {Promise<object>} - Health check response
 */
async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

// Example usage
async function runExample() {
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