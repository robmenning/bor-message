#!/usr/bin/env ts-node

/**
 * Kafka Producer Test Script
 * 
 * This script sends test messages to Kafka topics to verify the functionality
 * of the bor-message service.
 * 
 * Usage:
 * npx ts-node test/kafka-producer.ts [topic] [message] [key]
 * 
 * Examples:
 * - Send an ETL job request:
 *   npx ts-node test/kafka-producer.ts bor-etl-jobs '{"jobId": "test-123", "type": "data-import", "parameters": {"source": "test-db"}}' "job-123"
 * 
 * - Send an ETL job status update:
 *   npx ts-node test/kafka-producer.ts bor-etl-status '{"jobId": "test-123", "status": "completed", "details": {"runtime": 12.5, "records": 1500}}' "job-123"
 */

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get command-line arguments
const [,, topic = '', messageStr = '', key = ''] = process.argv;

if (!topic) {
  console.error('Error: Topic is required');
  console.log('Usage: npx ts-node test/kafka-producer.ts [topic] [message] [key]');
  process.exit(1);
}

if (!messageStr) {
  console.error('Error: Message is required');
  console.log('Usage: npx ts-node test/kafka-producer.ts [topic] [message] [key]');
  process.exit(1);
}

// Default config
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const clientId = 'bor-message-test-producer';

// Create Kafka client
const kafka = new Kafka({
  clientId,
  brokers: [kafkaBroker],
});

/**
 * Produce a message to Kafka
 */
async function produceMessage() {
  // Create producer
  const producer = kafka.producer();
  
  try {
    console.log(`Connecting to Kafka broker at ${kafkaBroker}...`);
    await producer.connect();
    console.log('Connected to Kafka!');
    
    // Parse message if it looks like JSON
    let message = messageStr;
    try {
      if (messageStr.trim().startsWith('{') || messageStr.trim().startsWith('[')) {
        // If message is already a JSON string, keep it as is
        message = messageStr;
      }
    } catch (e) {
      // If parsing fails, use the message as-is
      console.log('Message is not valid JSON, sending as string');
    }
    
    // Prepare message payload
    const messagePayload = {
      key: key || undefined,
      value: message,
    };
    
    console.log(`Sending message to topic '${topic}':`);
    console.log('Key:', key || '(none)');
    console.log('Message:', message);
    
    // Send message
    await producer.send({
      topic,
      messages: [messagePayload],
    });
    
    console.log('Message sent successfully!');
    
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    // Disconnect producer
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  }
}

// Run the producer
produceMessage().catch(console.error); 