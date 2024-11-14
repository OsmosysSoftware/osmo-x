#!/bin/bash

SCHEDULE_TIME=5

source ".env"

BASE_URL="http://localhost:${SERVER_PORT}/notifications"

ARCHIVE_URL="http://localhost:${SERVER_PORT}/archived-notifications"
ARCHIVE_INTERVAL_SCHEDULE_TIME="${ARCHIVE_INTERVAL:-3600}"

add_notifications_to_queue() {
  curl -X POST "${BASE_URL}/queue" -H "Content-Type: application/json" -d '{}'
}

get_provider_confirmation() {
  curl -X POST "${BASE_URL}/confirm" -H "Content-Type: application/json" -d '{}'
}

move_completed_notifications_to_archive() {
  curl -X POST "${ARCHIVE_URL}/archive" -H "Content-Type: application/json" -d '{}'
}

last_run_notifications=$(date +%s)
last_run_archived_notifications=$(date +%s)

while true; do
  current_time=$(date +%s)

  if (( (current_time - last_run_notifications) >= SCHEDULE_TIME )); then
    add_notifications_to_queue
    get_provider_confirmation
    last_run_notifications=$current_time
  fi

  if (( (current_time - last_run_archived_notifications) >= ARCHIVE_INTERVAL_SCHEDULE_TIME )); then
    move_completed_notifications_to_archive
    last_run_archived_notifications=$current_time
  fi

  sleep 1
done