# Use Node.js LTS
FROM node:20-alpine AS base

# Workspace directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Tracing stage - includes OpenTelemetry packages for optional tracing
FROM base AS tracing
RUN npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-metrics @opentelemetry/resources @opentelemetry/semantic-conventions
