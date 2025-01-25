# Production Setup

This document outlines the steps required to set up OsmoX for production. Following these steps will ensure that your application is configured properly for a production environment.

## Prerequisites

Before setting up OsmoX for production, ensure you have the following prerequisites with the specified versions:

- **NVM (Node Version Manager):** Use NVM to manage Node.js versions.
- **Node.js** Node.js v20.x or higher.
- **Git:** Git v2.x or higher.
- **MariaDB:** MariaDB v10.x or higher.
- **Redis:** Redis v6.x or higher
- **PM2 (Process Manager):** PM2 v5.x or higher.
- **Docker:** Docker v26.1.2
- **Docker Compose:** Docker Compose v2.1.1

These prerequisites are essential for deploying and running OsmoX in an environment.

Make sure Redis and MariaDB server are up and running.

## Server Configuration

1. **Environment Variables:** Set the necessary environment variables on your production server. These variables include database configuration, server settings, and any other variables your application requires. Create the `.env` file and ensure that it is properly configured with production values.

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
  NODE_ENV=production # Use "development" for graphql playground to work

  # Notification configuration
  MAX_RETRY_COUNT=3 # Max retry count, default is 3
  ARCHIVE_LIMIT=1000 # Max notifications to archive, default is 1000
  ARCHIVE_INTERVAL=3600 # Interval (in seconds) for archiving notifications, default 3600 (every 1 hour)

  # Dhilog configuration
  DHILOG_LOG_TYPE=Exceptions # Custom "Log types" value defined on Dhilog portal
  DHILOG_LOG_LEVEL=error # Log level, default is error
  DHILOG_API_ENDPOINT=https://api.dhilog.com/log # Dhilog log api url
  DHILOG_API_TOKEN=your-slogger-token # Dhilog api token
  ENABLE_DHILOG=false # Default set to false

  # Log configuration
  LOG_LEVEL=info # Log level, default is info
  COMBINED_LOG_MAX_SIZE=150m # Max file size for combined logs. Set 0 for no size limit, default 150m
  ERROR_LOG_MAX_SIZE=20m # Max file size for error logs. Set 0 for no size limit, default 20m

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

Make sure to replace the above example values with appropriate values as per your setup and configuration. Server Port is `3000`, you can update it if you want to use a different port of your choice.

## Building and Preparing

1. **Build the Application:** Before starting the server, build OsmoX by running:

   ```sh
   npm run build
   ```

  This command compiles your TypeScript code into JavaScript and generates the necessary build files.

## Starting the Server
### Using PM2
1. **PM2 Configuration:** Create an ecosystem.config.js (or .ts) file to configure PM2. This file defines settings such as the application name, entry point, and other options. For example:

  ```js
  module.exports = {
    apps: [
      {
        name: 'OsmoX', // Name of your application
        script: 'dist/main.js', // Path to the compiled NestJS entry file
        instances: 1, // Use max to Automatically scale instances based on CPU cores
        autorestart: true, // Auto-restart if the app crashes
        watch: false, // Watch for file changes (disable for production)
        max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
        env: {
          NODE_ENV: 'production', // Set the environment to production
        },
      },
    ],
  };
  ```

2. **Start the Application with PM2:** Use PM2 to start your application:

  ```sh
  pm2 start ecosystem.config.js
  ```

To ensure your application starts on system boot:

  ```sh
  pm2 startup
  ```

Follow instruction given by the command if any.

Save pm2 config:

  ```sh
  pm2 save
  ```
### Using Docker

**Step 1: Update Environment Variables**

Before using Docker, ensure you've configured the environment variables in your `.env` file correctly. Update values such as `MARIADB_DOCKER_PORT`, `REDIS_DOCKER_PORT`, `REDIS_HOST`, and `DB_HOST` as required for your Docker setup.

**Step 2: Build your docker container**

```bash
docker-compose build
```

**Step 3: Start the Docker Containers**

To start your application within Docker containers, run the following command:

```bash
docker-compose up -d
```

**Step 4: Database Migrations (First-Time Setup)**

For the first-time setup, you need to run database migrations to create the required database tables. Execute the following command:

```bash
docker exec -it osmox-api npm run typeorm:run-migration
```

**Step 5: Update Environment Variables**

If you need to update any environment variable values:

1. Update the values in your `.env` file.

2. Stop the running containers:

   ```bash
   docker-compose stop
   ```

3. Rebuild the Docker containers with the updated environment variables:

   ```bash
   docker-compose build
   ```

4. Start the Docker containers again:

   ```bash
   docker-compose up -d
   ```

With these steps, your application should be up and running in Docker with the updated environment variables.

For details on using the application and making API calls, refer to our [Usage Guide](usage-guide.md).
