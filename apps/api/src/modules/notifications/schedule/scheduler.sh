#!/bin/bash

SCRIPT_PATH="$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )"
ENV=$SCRIPT_PATH/../../../../.env
SCHEDULE_TIME=5

source "${SCRIPT_PATH}/../../../../.env"

BASE_URL="http://localhost:${SERVER_PORT}/notifications"

add_notifications_to_queue() {
  curl -X POST "${BASE_URL}/queue" -H "Content-Type: application/json" -d '{}'
}

get_provider_confirmation() {
  curl -X POST "${BASE_URL}/confirm" -H "Content-Type: application/json" -d '{}'
}

while true; do
  add_notifications_to_queue
  get_provider_confirmation
  sleep $SCHEDULE_TIME
done