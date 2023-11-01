# Use Node.js 20 as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port your application will run on
EXPOSE 3000

# Command to start your NestJS application
CMD ["node", "dist/main.js"]