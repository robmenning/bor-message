#!/usr/bin/env ts-node

/**
 * Kafka Consumer Test Script
 * 
 * This script consumes messages from Kafka topics to verify the functionality
 * of the bor-message service.
 * 
 * Usage:
 * npx ts-node test/kafka-consumer.ts [topic1,topic2,...] [group-id]
 * 
 * Examples:
 * - Listen to the ETL jobs topic:
 *   npx ts-node test/kafka-consumer.ts bor-etl-jobs test-consumer-group
 * 
 * - Listen to multiple topics:
 *   npx ts-node test/kafka-consumer.ts bor-etl-jobs,bor-etl-status test-consumer-group
 */

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get command-line arguments
const [,, topicsArg = '', groupId = 'bor-message-test-consumer'] = process.argv;

if (!topicsArg) {
  console.error('Error: At least one topic is required');
  console.log('Usage: npx ts-node test/kafka-consumer.ts [topic1,topic2,...] [group-id]');
  process.exit(1);
}

// Parse topics
const topics = topicsArg.split(',').map(t => t.trim()).filter(Boolean);

// Default config
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const clientId = 'bor-message-test-consumer';

console.log(`Kafka Test Consumer`);
console.log(`Broker: ${kafkaBroker}`);
console.log(`Group ID: ${groupId}`);
console.log(`Topics: ${topics.join(', ')}`);
console.log(`Press Ctrl+C to exit\n`);

// Create Kafka client
const kafka = new Kafka({
  clientId,
  brokers: [kafkaBroker],
});

/**
 * Consume messages from Kafka
 */
async function consumeMessages() {
  // Create consumer
  const consumer = kafka.consumer({ groupId });
  
  try {
    console.log('Connecting to Kafka...');
    await consumer.connect();
    console.log('Connected to Kafka!');
    
    // Subscribe to all topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`Subscribed to topic: ${topic}`);
    }
    
    // Start consuming
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const timestamp = message.timestamp 
          ? new Date(parseInt(message.timestamp)).toISOString()
          : new Date().toISOString();
        
        const key = message.key ? message.key.toString() : '(none)';
        let value = '(empty)';
        
        if (message.value) {
          try {
            // Try to parse as JSON
            const jsonValue = JSON.parse(message.value.toString());
            value = JSON.stringify(jsonValue, null, 2);
          } catch (e) {
            // If not JSON, show as string
            value = message.value.toString();
          }
        }
        
        console.log(`\n[${timestamp}] New message from topic: ${topic} (partition: ${partition})`);
        console.log(`Key: ${key}`);
        console.log(`Value: ${value}`);
      },
    });
    
    console.log('Consumer started. Waiting for messages...');
    
    // Keep the process running until explicitly terminated
    process.on('SIGINT', async () => {
      console.log('\nDisconnecting consumer...');
      await consumer.disconnect();
      console.log('Consumer disconnected. Exiting.');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error in consumer:', error);
    await consumer.disconnect();
    process.exit(1);
  }
}

// Run the consumer
consumeMessages().catch(console.error); 