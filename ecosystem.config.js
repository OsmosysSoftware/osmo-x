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
