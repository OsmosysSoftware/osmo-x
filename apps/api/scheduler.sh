#!/bin/bash

SCHEDULE_TIME_IN_SECONDS="${SCHEDULE_TIME_IN_SECONDS:-5}"

source ".env"

BASE_URL="http://localhost:${SERVER_PORT}/notifications"
ARCHIVE_URL="http://localhost:${SERVER_PORT}/archived-notifications"

ARCHIVE_INTERVAL="${ARCHIVE_INTERVAL:-3600}"

add_notifications_to_queue() {
  curl -X POST "${BASE_URL}/queue" -H "Content-Type: application/json" -d '{}'
}

get_provider_confirmation() {
  curl -X POST "${BASE_URL}/confirm" -H "Content-Type: application/json" -d '{}'
}

move_completed_notifications_to_archive() {
  curl -X POST "${ARCHIVE_URL}/archive" -H "Content-Type: application/json" -d '{}'
}

last_archive_run=$(date +%s)

while true; do
  add_notifications_to_queue
  get_provider_confirmation

  current_time=$(date +%s)

  # Check if it's time to run the archive function
  if (( (current_time - last_archive_run) >= ARCHIVE_INTERVAL )); then
    move_completed_notifications_to_archive
    last_archive_run=$current_time
  fi

  sleep $SCHEDULE_TIME_IN_SECONDS
done