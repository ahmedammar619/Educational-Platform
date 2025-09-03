# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting Educational Platform API..."' >> /app/start.sh && \
    echo 'echo "📍 Working directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "📁 Files in dist/:"' >> /app/start.sh && \
    echo 'ls -la dist/' >> /app/start.sh && \
    echo 'echo "🌐 Starting server..."' >> /app/start.sh && \
    echo 'exec node dist/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start the application using the startup script
CMD ["/app/start.sh"]
