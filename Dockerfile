# Multi-stage build for AIDevelo.ai
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY package*.json ./
RUN npm ci --only=production=false

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Copy backend package files
COPY server/package*.json ./
RUN npm ci --only=production=false

# Copy backend source
COPY server/tsconfig.json ./
COPY server/src ./src

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for backend
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy built backend files
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/src ./src

# Copy frontend build to serve from backend (or use nginx)
COPY --from=frontend-builder /app/dist ./public

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/server' >> /app/start.sh && \
    echo 'node dist/app.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start backend server
CMD ["/app/start.sh"]

