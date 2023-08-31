# Production Setup

This document outlines the steps required to set up your NestJS project for production. Following these steps will ensure that your application is configured properly for a production environment.

## Prerequisites

Before you begin the production setup, make sure you have the following software and steps completed:

### Node.js and npm

Ensure that you have Node.js and npm installed on your production server. You can install them using the methods described in the [Development Setup](development-setup.md) document.

### PM2 (Process Manager)

Install [PM2](https://pm2.keymetrics.io/), a process manager for Node.js applications, on your production server:

```sh
npm install -g pm2
```

## Server Configuration

1. **Node.js and npm:** Ensure that you have Node.js and npm installed on your production server. You can install them using the methods described in the [Development Setup](development-setup.md) document.

2. **Environment Variables:** Set the necessary environment variables on your production server. These variables include database configuration, SMTP settings, and any other variables your application requires. Ensure the `.env` file is properly configured.

3. **Database Configuration:** If you're using a separate production database server, update the database configuration in the `.env` file to point to the production database.

## Building and Preparing

1. **Build the Application:** Before starting the server, build your NestJS application by running:

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
      name: 'osmo-notification', // Name of your application
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





