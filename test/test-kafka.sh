#!/bin/bash

# Kafka Test Shell Script
# This script makes it easier to run Kafka producer and consumer tests

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_BROKER="localhost:9092"
DEFAULT_PRODUCER_TOPIC="bor-etl-jobs"
DEFAULT_CONSUMER_TOPICS="bor-etl-jobs,bor-etl-status"
DEFAULT_GROUP_ID="bor-test-group"

# Function to display usage information
show_usage() {
  echo -e "${BLUE}BOR Kafka Testing Script${NC}"
  echo
  echo "Usage:"
  echo "  ./test-kafka.sh [command] [options]"
  echo
  echo "Commands:"
  echo "  produce    - Send a test message to a Kafka topic"
  echo "  consume    - Listen for messages from Kafka topics"
  echo "  help       - Show this help message"
  echo
  echo "Options for 'produce':"
  echo "  -t, --topic TOPIC      Topic to send message to (default: $DEFAULT_PRODUCER_TOPIC)"
  echo "  -k, --key KEY          Message key (optional)"
  echo "  -m, --message MESSAGE  Message content (JSON string)"
  echo "  -b, --broker BROKER    Kafka broker address (default: $DEFAULT_BROKER)"
  echo
  echo "Options for 'consume':"
  echo "  -t, --topics TOPICS    Comma-separated list of topics (default: $DEFAULT_CONSUMER_TOPICS)"
  echo "  -g, --group GROUP_ID   Consumer group ID (default: $DEFAULT_GROUP_ID)"
  echo "  -b, --broker BROKER    Kafka broker address (default: $DEFAULT_BROKER)"
  echo
  echo "Examples:"
  echo "  # Send an ETL job request"
  echo "  ./test-kafka.sh produce -t bor-etl-jobs -k job-123 -m '{\"jobId\": \"test-123\", \"type\": \"data-import\"}'"
  echo
  echo "  # Listen to ETL status updates"
  echo "  ./test-kafka.sh consume -t bor-etl-status"
  echo
}

# Check if we have the necessary tools
check_prerequisites() {
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed.${NC}"
    echo "Please make sure Node.js and NPM are properly installed."
    exit 1
  fi
  
  if ! command -v ts-node &> /dev/null; then
    echo -e "${YELLOW}Warning: ts-node is not found. Installing it now...${NC}"
    npm install -g ts-node typescript
  fi
}

# Check that we are in the correct directory
ensure_correct_directory() {
  # Check if the script is being run from the project root directory
  if [[ ! -d "./test" ]]; then
    echo -e "${RED}Error: Please run this script from the project root directory.${NC}"
    exit 1
  fi
}

# Run producer with the given parameters
run_producer() {
  local topic="$DEFAULT_PRODUCER_TOPIC"
  local key=""
  local message=""
  local broker="$DEFAULT_BROKER"
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -t|--topic)
        topic="$2"
        shift 2
        ;;
      -k|--key)
        key="$2"
        shift 2
        ;;
      -m|--message)
        message="$2"
        shift 2
        ;;
      -b|--broker)
        broker="$2"
        shift 2
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
    esac
  done
  
  # Verify required parameters
  if [[ -z "$message" ]]; then
    echo -e "${RED}Error: Message is required${NC}"
    echo "Use -m or --message to specify the message content"
    exit 1
  fi
  
  # Set environment variable for broker
  export KAFKA_BROKER="$broker"
  
  # Run the producer script
  echo -e "${GREEN}Sending message to topic '$topic'...${NC}"
  npx ts-node test/kafka-producer.ts "$topic" "$message" "$key"
}

# Run consumer with the given parameters
run_consumer() {
  local topics="$DEFAULT_CONSUMER_TOPICS"
  local group_id="$DEFAULT_GROUP_ID"
  local broker="$DEFAULT_BROKER"
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -t|--topics)
        topics="$2"
        shift 2
        ;;
      -g|--group)
        group_id="$2"
        shift 2
        ;;
      -b|--broker)
        broker="$2"
        shift 2
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
    esac
  done
  
  # Set environment variable for broker
  export KAFKA_BROKER="$broker"
  
  # Run the consumer script
  echo -e "${GREEN}Starting consumer for topics: $topics${NC}"
  npx ts-node test/kafka-consumer.ts "$topics" "$group_id"
}

# Main script execution
main() {
  ensure_correct_directory
  check_prerequisites
  
  if [[ $# -eq 0 || "$1" == "help" ]]; then
    show_usage
    exit 0
  fi
  
  command="$1"
  shift
  
  case "$command" in
    produce)
      run_producer "$@"
      ;;
    consume)
      run_consumer "$@"
      ;;
    *)
      echo -e "${RED}Unknown command: $command${NC}"
      show_usage
      exit 1
      ;;
  esac
}

# Run the main function
main "$@" 