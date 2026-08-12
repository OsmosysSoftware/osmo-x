#!/bin/bash

source ".env"

SCHEDULE_TIME_IN_SECONDS="${SCHEDULE_TIME_IN_SECONDS:-5}"

BASE_URL="http://localhost:${SERVER_PORT}${GLOBAL_API_PREFIX}/notifications"
ARCHIVE_URL="http://localhost:${SERVER_PORT}${GLOBAL_API_PREFIX}/archived-notifications"
WEBHOOK_URL="http://localhost:${SERVER_PORT}${GLOBAL_API_PREFIX}/webhooks"

ARCHIVE_INTERVAL_IN_SECONDS="${ARCHIVE_INTERVAL_IN_SECONDS:-3600}"
DELETE_INTERVAL_IN_SECONDS="${DELETE_INTERVAL_IN_SECONDS:-86400}"
WEBHOOK_LOG_CLEANUP_INTERVAL_IN_SECONDS="${WEBHOOK_LOG_CLEANUP_INTERVAL_IN_SECONDS:-86400}"

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

cleanup_webhook_logs() {
  curl -X DELETE "${WEBHOOK_URL}/logs/cleanup"
}

last_archive_run=$(date +%s)
last_delete_run=$(date +%s)
last_webhook_log_cleanup_run=$(date +%s)

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

  # Check if it's time to run the webhook log cleanup function
  if (( (current_time - last_webhook_log_cleanup_run) >= WEBHOOK_LOG_CLEANUP_INTERVAL_IN_SECONDS )); then
    cleanup_webhook_logs
    last_webhook_log_cleanup_run=$current_time
  fi

  sleep $SCHEDULE_TIME_IN_SECONDS
done
