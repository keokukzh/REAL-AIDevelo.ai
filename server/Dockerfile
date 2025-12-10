# Use Node.js LTS
FROM node:20-alpine AS base

# Workspace directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy source
COPY . .

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
COPY --from=base /app/scripts ./scripts

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:5000/health || exit 1

# Start application
CMD ["node", "dist/app.js"]
