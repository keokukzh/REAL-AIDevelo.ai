# Use Node.js LTS
FROM node:20-alpine AS base

# Workspace directory
WORKDIR /app

# Copy server package files (from server/ directory in build context)
COPY server/package*.json ./
COPY server/.npmrc ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy server source
COPY server/ ./

# Copy shared types into server/shared (needed for TypeScript compilation)
# This makes the import path consistent: ../../shared from src/models
COPY shared ./shared

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY server/.npmrc ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/db ./db

# Copy node_modules from base to use ts-node for migrations  
COPY --from=base /app/node_modules ./node_modules

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:5000/health || exit 1

# Start application
CMD ["node", "dist/app.js"]
