# Docker Compose Setup Guide

This document explains how to run the osmo-x API using the newly added Docker Compose files. Multiple configurations allow flexible setups with Redis and Postgres.

## Docker Compose Files

| File                       | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `docker-compose.api.yml`   | Starts only the osmo-x API container        |
| `docker-compose.redis.yml` | Starts the API along with a Redis container |
| `docker-compose.db.yml`    | Starts the API with a Postgres container    |


## Commands to Start Each Setup

### API only:

  ```shell
  docker compose -f docker-compose.api.yml up -d
  ```

### API + Redis:

  ```shell
  docker compose -f docker-compose.redis.yml up -d
  ```

### API + Postgres:

  ```shell
  docker compose -f docker-compose.db.yml up -d
  ```

## Environment Variable Configuration for Docker Compose Setups

### GLOBAL (Used in ALL Docker Compose setups)

```env
DB_TYPE=postgres
```

### API only:

  ```env
  #### Database Configuration
  DB_HOST=host.docker.internal # or <IP-ADDRESS-USED-TO-REACH-YOUR-HOST-MACHINE>
  DB_PORT=5432 # Set the port used by postgres of your local machine
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  DB_NAME=osmox_db
  DB_DOCKER_PORT=5433 # IGNORE. Will not be used for current setup

  #### Redis Configuration
  REDIS_HOST=host.docker.internal # or <IP-ADDRESS-USED-TO-REACH-YOUR-HOST-MACHINE>
  REDIS_PORT=6379 # Set the port used by redis of your local machine
  REDIS_DOCKER_PORT=6397 # IGNORE. Will not be used for current setup
  ```

### API + Redis:

  ```env
  #### Database Configuration
  DB_HOST=osmox-postgres # or <IP-ADDRESS-USED-TO-REACH-YOUR-HOST-MACHINE>
  DB_PORT=5432 # Set the port used by postgres of your local machine
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  DB_NAME=osmox_db
  DB_DOCKER_PORT=5433 # IGNORE. Will not be used for current setup

  #### Redis Configuration
  REDIS_HOST=osmox-redis
  REDIS_PORT=6379
  REDIS_DOCKER_PORT=6397
  ```

### API + Postgres:

  ```env
  #### Database Configuration
  DB_HOST=osmox-postgres
  DB_PORT=5432
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  DB_NAME=osmox_db
  DB_DOCKER_PORT=5433

  #### Redis Configuration
  REDIS_HOST=host.docker.internal # or <IP-ADDRESS-USED-TO-REACH-YOUR-HOST-MACHINE>
  REDIS_PORT=6379 # Set the port used by redis of your local machine
  REDIS_DOCKER_PORT=6397 # IGNORE. Will not be used for current setup
  ```

## Notes for Linux Users

* To fetch your machine’s LAN IP (needed when connecting the API container to a locally running DB/Redis), run:

    ```shell
    hostname -I | awk '{print $1}'
    ```

* Use this IP as your DB_HOST or REDIS_HOST inside Docker, instead of localhost.
* On Mac and Windows, you may alternatively use:

    ```shell
    host.docker.internal
    ```

## Commands to Stop and Remove Each Setup

### Remove API only:

  ```shell
  docker compose -f docker-compose.api.yml down -v
  ```

### Remove API + Redis:

  ```shell
  docker compose -f docker-compose.redis.yml down -v
  ```

### Remove API + Postgres:

  ```shell
  docker compose -f docker-compose.db.yml down -v
  ```
