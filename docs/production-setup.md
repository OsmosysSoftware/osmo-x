# Production Setup

This document outlines the steps required to set up Osmo-Notify for production. Following these steps will ensure that your application is configured properly for a production environment.

## Prerequisites

Before setting up Osmo-Notify for production, ensure you have the following prerequisites with the specified versions:

- **NVM (Node Version Manager):** Use NVM to manage Node.js versions.
- **Node.js** Node.js v18.x or higher.
- **Git:** Git v2.x or higher.
- **MariaDB:** MariaDB v10.x or higher.
- **Redis:** Redis v6.x or higher
- **PM2 (Process Manager):** PM2 v5.x or higher.

These prerequisites are essential for deploying and running Osmo-Notify in a environment.

## Server Configuration

1. **Environment Variables:** Set the necessary environment variables on your production server. These variables include database configuration, SMTP settings, and any other variables your application requires. Ensure the `.env` file is properly configured with production values.

```env
# Server
SERVER_PORT=3000

# Database configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_NAME=your-database

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

Make sure to replace `your-password`, `your-database`, `your-smtp-username`, and `your-smtp-password` with appropriate values. Server Port is `3000`, you can update it if you want to use a different port of your choice.

## Building and Preparing

1. **Build the Application:** Before starting the server, build Osmo-Notify by running:

   ```sh
   npm run build
   ```

   This command compiles your TypeScript code into JavaScript and generates the necessary build files.

## Starting the Server

1. **PM2 Configuration:** Create an ecosystem.config.js (or .ts) file to configure PM2. This file defines settings such as the application name, entry point, and other options. For example:

```js
module.exports = {
  apps: [
    {
      name: 'osmo-notify', // Name of your application
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

For details on using the application and making API calls, refer to our [Usage Guide](usage-guide.md).
