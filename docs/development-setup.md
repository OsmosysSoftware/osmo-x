# Development Setup

This document outlines the steps required to set up your NestJS project for development. By following these steps, you'll be able to run your application locally with the necessary environment variables and database configuration.

## Prerequisites

Before you begin, ensure that you have the following software installed on your machine:

### Node.js and npm
- **Node.js version 18 or higher is recommended.**

- **Windows:**
  1. Download the [Node.js installer](https://nodejs.org/).
  2. Run the installer and follow the prompts.

- **macOS:**
  1. Install [Homebrew](https://brew.sh/) (a package manager for macOS).
  2. Open a terminal and run:
     ```sh
     brew install node
     ```

- **Linux (Ubuntu/Debian):**
  1. Open a terminal and run:
     ```sh
     sudo apt update
     sudo apt install nodejs
     ```

- **Linux (Fedora):**
  1. Open a terminal and run:
     ```sh
     sudo dnf install nodejs
     ```

### Git

- **Windows:**
  Download the [Git installer](https://git-scm.com/).
  Run the installer and follow the prompts.

- **macOS:**
  Git should be pre-installed. You can check by running `git --version` in the terminal.

- **Linux (Ubuntu/Debian):**
  Open a terminal and run:
  ```sh
  sudo apt update
  sudo apt install git
  ```

- **Linux (Fedora):**
  Open a terminal and run:
  ```sh
  sudo dnf install git
  ```

## Getting Started

1. Clone the repository to your local machine:

   ```sh
   git clone https://github.com/OsmosysSoftware/osmo-notify.git
   cd osmo-notify
   ```

2. Install project dependencies:

   ```sh
   npm install
   ```

3. Create a .env file in the project root and add the required environment variables:
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
Make sure to replace your-password, your-database, your-smtp-username, and your-smtp-password with appropriate values. Server Port is `3000`, you can update it if you want to use a different port of your choice.

4. Set up the database:

   - Ensure your database server (e.g., MySQL) is running.
   - Run database migrations to create tables:

     ```sh
     npm run typeorm:migrate
     ```

5. Start the development server:

   ```sh
   npm run start:dev
   ```

   Your NestJS application will now be running locally at `http://localhost:3000`.