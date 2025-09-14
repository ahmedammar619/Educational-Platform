FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Accept build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Create startup script that checks NODE_ENV
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'if [ "$NODE_ENV" = "development" ]; then' >> /start.sh && \
    echo '  echo "Starting in development mode with hot reload..."' >> /start.sh && \
    echo '  npm run dev' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "Building and starting in production mode..."' >> /start.sh && \
    echo '  npm run build' >> /start.sh && \
    echo '  npx serve -s dist -l 3001' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    chmod +x /start.sh

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["/start.sh"]
