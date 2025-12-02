# Docker Compose Setup Guide

This document explains how to run the osmo-x API using the newly added Docker Compose files. Multiple configurations allow flexible setups with Redis and Postgres.

## Docker Compose Files

| File | Purpose |
|------|---------|
|`docker-compose.api.yml`| Starts only the osmo-x API container |
|`docker-compose.redis.yml`| Starts the API along with a Redis container |
|`docker-compose.db.yml`| Starts the API with a Postgres container |


## Commands to Start Each Setup
* API only:
    ```json
    docker compose -f docker-compose.api.yml up -d
    ```
* API + Redis:
    ```json
    docker compose -f docker-compose.redis.yml up -d
    ```
* API + Postgres:
    ```json
    docker compose -f docker-compose.db.yml up -d
    ```

## Environment Variables
Update the following variables in the .env file before running the Docker Compose setups. Example values are provided to understand the usage (replace with actual values for your setup):

### Database Configuration
* `DB_TYPE` – Type of database (`postgres`)
* `DB_HOST` – Hostname of the Postgres container (`osmox-postgres` for Docker)
* `DB_PORT` – Database port (`5432`)
* `DB_USERNAME` – Database username (`username`)
* `DB_PASSWORD` – Database password (`password`)
* `DB_NAME` – Database name (`osmox_db`)

### Redis Configuration
* `REDIS_HOST` – Hostname of Redis container (`osmox-redis`)
* `REDIS_PORT` – Redis port (`6379`)

## Notes for Linux Users

