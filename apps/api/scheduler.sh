#!/bin/bash

source ".env"

SCHEDULE_TIME_IN_SECONDS="${SCHEDULE_TIME_IN_SECONDS:-5}"

BASE_URL="http://localhost:${SERVER_PORT}/notifications"
ARCHIVE_URL="http://localhost:${SERVER_PORT}/archived-notifications"

ARCHIVE_INTERVAL_IN_SECONDS="${ARCHIVE_INTERVAL_IN_SECONDS:-3600}"
DELETE_INTERVAL_IN_SECONDS="${DELETE_INTERVAL_IN_SECONDS:-2592000}"

add_notifications_to_queue() {
  curl -X POST "${BASE_URL}/queue" -H "Content-Type: application/json" -d '{}'
}

get_provider_confirmation() {
  curl -X POST "${BASE_URL}/confirm" -H "Content-Type: application/json" -d '{}'
}

move_completed_notifications_to_archive() {
  curl -X POST "${ARCHIVE_URL}/archive" -H "Content-Type: application/json" -d '{}'
}

delete_archived_notifications() {
  curl -X DELETE "${ARCHIVE_URL}/delete"
}

last_archive_run=$(date +%s)
last_delete_run=$(date +%s)

while true; do
  add_notifications_to_queue
  get_provider_confirmation

  current_time=$(date +%s)

  # Check if it's time to run the archive function
  if (( (current_time - last_archive_run) >= ARCHIVE_INTERVAL_IN_SECONDS )); then
    move_completed_notifications_to_archive
    last_archive_run=$current_time
  fi

  # Check if it's time to run the delete function
  if (( (current_time - last_delete_run) >= DELETE_INTERVAL_IN_SECONDS )); then
    delete_archived_notifications
    last_delete_run=$current_time
  fi

  sleep $SCHEDULE_TIME_IN_SECONDS
done