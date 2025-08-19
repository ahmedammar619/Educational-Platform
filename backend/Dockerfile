# 1. Base image
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# 2. Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 3. Copy source code and build
COPY . .
RUN npm run build
RUN npm rebuild bcrypt --build-from-source

# 4. Production image
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only dist and node_modules from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

CMD ["node", "dist/main.js"]
