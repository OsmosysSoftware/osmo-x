# Use Node.js 20 as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Set NODE_ENV environment variable
ENV NODE_ENV=production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN npm ci --only=production && npm cache clean --force

# Install Nest CLI globally
RUN npm install -g @nestjs/cli

# Copy the rest of the application code to the container
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port your application will run on
EXPOSE 3000

# Command to start your NestJS application
## sh: This runs the Bourne shell
## -c: Tells sh to run the following string as a command
## ./scheduler.sh: Runs scheduler.sh in the background
## exec node dist/src/main.js: Replaces the sh process with the node process.
CMD ["sh", "-c", "./scheduler.sh & exec node dist/src/main.js"]
