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

   # Node env
   NODE_ENV=development

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
