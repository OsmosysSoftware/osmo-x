# Development Setup

This document outlines the steps required to set up your OsmoX for development. By following these steps, you'll be able to run your application locally with the necessary environment variables and database configuration.

## Prerequisites

Before setting up OsmoX for development, ensure you have the following prerequisites with the specified versions:

- **NVM (Node Version Manager):** Use NVM to manage Node.js versions.
- **Node.js** Node.js v20.x or higher. Can be installed via `nvm` using `nvm install 20` and used with `nvm use 20`.
- **Git:** Git v2.x or higher.
- **MariaDB:** MariaDB v10.x or higher.
- **Redis:** Redis v6.x or higher

These prerequisites are essential for deploying and running OsmoX in an environment.

Please make sure to have these versions installed on your development server before proceeding with the setup.

Make sure Redis and MariaDB server are up and running.

```bash
sudo systemctl status redis
sudo systemctl status mariadb
```

## Getting Started

1. Clone the repository to your local machine:

   ```sh
   git clone https://github.com/OsmosysSoftware/osmo-x.git
   cd osmo-x/apps/api
   ```

2. Install project dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the project root and add the required environment variables:

   ```env
   # Server
   SERVER_PORT=3000
   REQUEST_MAX_SIZE=50mb # Max Size of Request, Default is 50mb
   CLEANUP_IDLE_RESOURCES=false # Cleans up idle queues if inactive for the specified duration, default false
   IDLE_TIMEOUT=30m # How long the queue should be idle before being considered for deletion, default 30m
   CLEANUP_INTERVAL=7d # Frequency for running the cleanup, use formats from https://github.com/vercel/ms, default 7d
   JWT_SECRET=your-strong-secret-key-here # A strong secret key for signing your JWTs. This should be a long, random string.
   JWT_EXPIRES_IN=30d # Common formats are '60s', '10m', '1h', '1d', etc
   SALT_ROUNDS=10 # Number of salt rounds for bcrypt
   API_KEY_SECRET=your-secret # Replace with a strong, unique secret for API authentication

   # Node env
   NODE_ENV=development

   # Notification configuration
   MAX_RETRY_COUNT=3 # Max retry count, default is 3

   # Log Level
   LOG_LEVEL=info # Log level, default is info

   # Database configuration
   DB_TYPE=mysql
   DB_HOST=localhost # use value as osmox-mariadb in docker
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your-password
   DB_NAME=your-database
   MARIADB_DOCKER_PORT=3307 # (required only if using docker)

   # Redis configuration
   REDIS_HOST=127.0.0.1 # use value as osmox-redis in docker
   REDIS_PORT=6379
   REDIS_DOCKER_PORT=6397 # (required only if using docker)

   # Docker env
   COMPOSE_PROJECT_NAME=osmox-api  # Add your project name here.
   ```

   Alternatively, use the `.env.example` file instead.

   Make sure to replace the above example values with appropriate values as per your setup and configuration. Server Port is `3000`, you can update it if you want to use a different port of your choice.

4. Set up the database:

   Ensure your database server (e.g., MariaDB) is running.

   Run database migrations to create tables:

   ```sh
   npm run typeorm:run-migration
   ```

5. Start the development server:

   ```sh
   npm run start:dev
   ```

   OsmoX will now be running locally at `http://localhost:3000`.
