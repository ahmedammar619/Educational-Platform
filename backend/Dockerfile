# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode with hot reloading
CMD ["npm", "run", "start:dev"]
