import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import config from '../config';
import logger from '../utils/logger';

class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private isConnected: boolean = false;
  private topicHandlers: Map<string, (payload: EachMessagePayload) => Promise<void>> = new Map();
  
  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: [config.kafka.broker],
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });
  }
  
  /**
   * Initialize the Kafka producer and consumer
   */
  async connect(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info('Kafka producer connected');
      
      // Initialize consumer
      this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
      await this.consumer.connect();
      logger.info('Kafka consumer connected');
      
      this.isConnected = true;
    } catch (error) {
      logger.error(`Failed to connect to Kafka: ${error}`);
      throw error;
    }
  }
  
  /**
   * Disconnect the Kafka producer and consumer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }
      
      if (this.consumer) {
        await this.consumer.disconnect();
        logger.info('Kafka consumer disconnected');
      }
      
      this.isConnected = false;
    } catch (error) {
      logger.error(`Failed to disconnect from Kafka: ${error}`);
      throw error;
    }
  }
  
  /**
   * Register a handler for a topic
   * This only registers the handler but doesn't subscribe yet
   * @param topic The topic to subscribe to
   * @param handler The message handler function
   */
  registerTopicHandler(topic: string, handler: (payload: EachMessagePayload) => Promise<void>): void {
    this.topicHandlers.set(topic, handler);
    logger.info(`Registered handler for topic: ${topic}`);
  }
  
  /**
   * Start consuming from all registered topics
   */
  async startConsumer(): Promise<void> {
    if (!this.consumer || !this.isConnected) {
      throw new Error('Kafka consumer is not connected');
    }
    
    if (this.topicHandlers.size === 0) {
      logger.warn('No topic handlers registered');
      return;
    }
    
    try {
      // Subscribe to all topics first
      for (const topic of this.topicHandlers.keys()) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`Subscribed to Kafka topic: ${topic}`);
      }
      
      // Then start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic } = payload;
          const handler = this.topicHandlers.get(topic);
          
          if (handler) {
            try {
              await handler(payload);
            } catch (error) {
              logger.error(`Error processing message from topic ${topic}: ${error}`);
            }
          } else {
            logger.warn(`No handler registered for topic ${topic}`);
          }
        }
      });
      
      logger.info('Kafka consumer started');
    } catch (error) {
      logger.error(`Failed to start Kafka consumer: ${error}`);
      throw error;
    }
  }
  
  /**
   * Publish a message to a Kafka topic
   * @param topic The topic to publish to
   * @param message The message to publish
   * @param key Optional message key
   */
  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }
    
    try {
      const messagePayload = {
        key: key ? key : undefined,
        value: typeof message === 'string' ? message : JSON.stringify(message)
      };
      
      await this.producer.send({
        topic,
        messages: [messagePayload]
      });
      
      logger.debug(`Published message to topic ${topic}`);
    } catch (error) {
      logger.error(`Failed to publish message to topic ${topic}: ${error}`);
      throw error;
    }
  }
}

// Create and export singleton instance
const kafkaService = new KafkaService();
export default kafkaService; 