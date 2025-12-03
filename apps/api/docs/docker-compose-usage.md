# Docker Compose Setup Guide

This document explains how to run the osmo-x API using the newly added Docker Compose files. Multiple configurations allow flexible setups with Redis and Postgres.

## Docker Compose Files

| File | Purpose |
|------|---------|
|`docker-compose.api.yml`| Starts only the osmo-x API container |
|`docker-compose.redis.yml`| Starts the API along with a Redis container |
|`docker-compose.db.yml`| Starts the API with a Postgres container |


## Commands to Start Each Setup
* ### API only:
    ```shell
    docker compose -f docker-compose.api.yml up -d
    ```
* ### API + Redis:
    ```shell
    docker compose -f docker-compose.redis.yml up -d
    ```
* ### API + Postgres:
    ```shell
    docker compose -f docker-compose.db.yml up -d
    ```


## Environment Variable Configuration for Docker Compose Setups

* ### GLOBAL (Used in ALL Docker Compose setups)
  * ```DB_TYPE=postgres```

* ### API only:
  * #### Database Configuration
    * ```DB_HOST=host.docker.internal```
    * ```DB_PORT=5432```
    * ```DB_USERNAME=your_username```
    * ```DB_PASSWORD=your_password```
    * ```DB_NAME=osmox_db```
    * ```DB_DOCKER_PORT=5433```

  * #### Redis Configuration
    * ```REDIS_HOST=host.docker.internal```
    * ```REDIS_PORT=6379```
    * ```REDIS_DOCKER_PORT=6397```

* ### API + Redis:
  * #### Database Configuration 
    * ```DB_HOST=osmox-postgres```
    * ```DB_PORT=5432```
    * ```DB_USERNAME=your_username```
    * ```DB_PASSWORD=your_password```
    * ```DB_NAME=osmox_db```
    * ```DB_DOCKER_PORT=5433```

  * #### Redis Configuration
    * ```REDIS_HOST=osmox-redis```
    * ```REDIS_PORT=6379```
    * ```REDIS_DOCKER_PORT=6397```

* ### API + Postgres:
  * #### Database Configuration 
    * ```DB_HOST=osmox-postgres```
    * ```DB_PORT=5432```
    * ```DB_USERNAME=your_username```
    * ```DB_PASSWORD=your_password```
    * ```DB_NAME=osmox_db```
    * ```DB_DOCKER_PORT=5433```


## Notes for Linux Users
