# Agent Tracing Setup Guide

This guide explains how to set up and visualize the AIDevelo.ai agent using OpenTelemetry tracing.

## Overview

The AIDevelo.ai backend now includes built-in OpenTelemetry tracing support that automatically instruments:
- HTTP requests and responses
- Express middleware execution
- Database operations
- LLM API calls
- Voice agent workflows
- Tool executions

## Configuration

### Environment Variables

The tracing endpoint is configurable via environment variables:

```env
# .env or system environment
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4319
```

**Default**: `http://localhost:4319` (HTTP/REST endpoint for OTLP)

### Tracing Architecture

The setup uses:
- **SDK**: OpenTelemetry Node.js SDK (`@opentelemetry/sdk-node`)
- **Exporter**: OTLP HTTP Exporter (`@opentelemetry/exporter-trace-otlp-http`)
- **Instrumentations**: Auto-instrumentations for Node.js (`@opentelemetry/auto-instrumentations-node`)
- **Service Name**: `aidevelo-agent-api`
- **Version**: `1.0.0`

## Starting the Server with Tracing

### Prerequisites

1. Ensure your OTLP collector is running on `http://localhost:4319`
   - This could be Jaeger, OpenObserve, or any OTEL-compatible collector

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

### Start Development Server

```bash
cd server
npm run dev
```

The server will initialize OpenTelemetry tracing on startup:
```
[Observability] OpenTelemetry tracing initialized with OTLP endpoint: http://localhost:4319
```

## Viewing Traces

Once traces are sent to your OTLP collector, you can view them in:

1. **Jaeger UI** (if using Jaeger): http://localhost:16686
2. **OpenObserve UI** (if using OpenObserve): http://localhost:5080
3. **Other OTEL visualization tools** - Configure according to your setup

### What Gets Traced

All incoming requests to the voice agent API are automatically traced:
- `POST /api/voice-agent/query` - Text query endpoint
- `POST /api/voice-agent/ingest` - Document ingestion
- `POST /api/voice-agent/session` - Session management
- WebSocket connections at `/api/voice-agent/call-session`

Traces include:
- Request/response details
- Execution duration
- Nested operation spans (RAG queries, LLM calls, tool execution)
- Error information when operations fail

## Configuration Details

### Observability Module

Located in `server/src/config/observability.ts`:

```typescript
import { setupObservability } from './config/observability';
setupObservability('http://localhost:4319');
```

Features:
- Automatic service resource detection
- Semantic resource attributes (service name, version)
- Graceful shutdown handling
- Error handling and logging

### Initialization Order

The tracing setup **must** be initialized before any other imports or middleware. The app.ts file ensures this by:
1. Importing and calling `setupObservability()` first
2. Then importing all other dependencies
3. Allowing auto-instrumentations to capture all subsequent operations

## Production Deployment

For production, configure the endpoint to your hosted OTLP collector:

```env
NODE_ENV=production
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector.example.com:4319
```

## Troubleshooting

### Traces not appearing

1. **Check OTLP endpoint connectivity**:
   ```bash
   curl -X POST http://localhost:4319/v1/traces -H "Content-Type: application/json" -d "{}"
   ```

2. **Verify endpoint in logs**:
   Look for: `[Observability] OpenTelemetry tracing initialized with OTLP endpoint: ...`

3. **Check server console** for any error messages during startup

4. **Validate collector is receiving data**:
   - Check your OTEL collector's logs for incoming trace submissions

### High resource usage

- OpenTelemetry tracing adds minimal overhead
- For production with high traffic, consider sampling traces
- Adjustable in the observability module (not currently enabled, can be added)

## References

- [OpenTelemetry Node.js Documentation](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/)
- [OTLP Specification](https://opentelemetry.io/docs/reference/specification/protocol/exporter/)
- [Auto-instrumentations](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/packages/auto-instrumentations-node)

## Next Steps

After setting up tracing:

1. Start your OTLP collector (Jaeger, OpenObserve, etc.)
2. Run the backend: `npm run dev`
3. Make requests to the voice agent API
4. View traces in your collector's UI
5. Analyze agent flow, identify bottlenecks, and optimize performance
