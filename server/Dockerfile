# Use Node.js LTS
FROM node:20-alpine AS base

# Workspace directory
WORKDIR /app

# Copy package files
COPY package*.json ./
# Copy .npmrc if it exists (optional - will fail silently if not present)
COPY .npmrc ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy server source
COPY . ./

# Copy shared types into src/shared (needed for TypeScript compilation)
# IMPORTANT: Build context MUST be repo root (not server/)
# For Render/Railway: Set Root Directory to "." (repo root), not "server"
# Then Dockerfile path should be: server/Dockerfile
COPY ../shared ./src/shared

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

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
