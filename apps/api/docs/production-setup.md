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

**Environment Variables:** Set the necessary environment variables on your production server. These variables include database configuration, server settings, and any other variables your application requires. Create the `.env` file and ensure that it is properly configured with production values.

  ```bash
  cp .env.example .env
  ```

Check the `.env.example` file for the required environment variables and ensure all necessary values are set correctly in the `.env` file.

Make sure to replace the example values with appropriate values as per your setup and configuration. Default server Port is `3000`, you can update it if you want to use a different port of your choice. Update `NODE_ENV` "production" for deployment.

Values that you should ideally update as required for your production setup:
- `SERVER_PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `API_KEY_SECRET`
- `JWT_SECRET`

## Building and Preparing

**Build the Application:** Before starting the server, build OsmoX by running:

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

Before using Docker, ensure you've configured the environment variables in your `.env` file correctly. Update values such as `NODE_ENV`, `SERVER_PORT`, `MARIADB_DOCKER_PORT`, `REDIS_DOCKER_PORT`, `REDIS_HOST`, and `DB_HOST` as required for your Docker setup.

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
