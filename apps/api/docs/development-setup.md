# Development Setup

This document outlines the steps required to set up your OsmoX for development. By following these steps, you'll be able to run your application locally with the necessary environment variables and database configuration.

## Prerequisites

Before setting up OsmoX for development, ensure you have the following prerequisites with the specified versions:

- **NVM (Node Version Manager):** Use NVM to manage Node.js versions.
- **Node.js** Node.js v20.x or higher. Can be installed via `nvm` using `nvm install 20` and used with `nvm use 20`.
- **Git:** Git v2.x or higher.
- **PostgreSQL:** PostgreSQL v16.x or higher.
- **Redis:** Redis v6.x or higher

These prerequisites are essential for deploying and running OsmoX in an environment.

Please make sure to have these versions installed on your development server before proceeding with the setup.

Make sure Redis and PostgreSQL server are up and running.

```bash
sudo systemctl status redis
sudo systemctl status postgresql
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

3. Create a `.env` file in the project root and add the required environment variables. Copy the example environment configuration file and modify it with your specific settings:

   ```bash
   cp .env.example .env
   ```

   Check the `.env.example` file for the required environment variables and ensure all necessary values are set correctly in the `.env` file.

   Make sure to replace the example values with appropriate values as per your setup and configuration. Update values such as `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, database credentials and `REDIS_HOST` as required for your local setup. Default server Port is `3000`, you can update it if you want to use a different port of your choice.

4. Set up the database:

   Ensure your database server (e.g., PostgreSQL) is running.

   Run database migrations to create tables:

   ```sh
   npm run typeorm:run-migration
   ```

5. Start the development server:

   ```sh
   npm run start:dev
   ```

   OsmoX will now be running locally at `http://localhost:3000`.

## Start the scheduler script

Start the [scheduler script](../scheduler.sh) on Terminal(Linux/Unix) or Git-Bash(Windows):

```sh
# Ensure API directory is active
cd osmo-x/apps/api
# Start scheduler script
./scheduler.sh
```

This script will periodically call OsmoX APIs that facilitate the following processes:
- Processing of all `Pending` notifications
- Provider Confirmation of all `Awaiting Confirmation` notifications
- Archiving of all completed notifications in `notify_notifications` table

## ALTERNATIVELY - Dockerize the application and use local database instead of dockerized database

Follow this guide to [Dockerize the application and use local db instead of dockerized db](./use-local-db-instead-of-dockerized-db/README.md)

## Use the application

For details on using the application and making API calls, refer to our [Usage Guide](usage-guide.md).