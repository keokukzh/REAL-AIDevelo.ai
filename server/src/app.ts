import { setupObservability } from './config/observability';
import { config } from './config/env';
import { initSentry } from './config/sentry';
import { StructuredLoggingService } from './services/loggingService';
import { initDatabaseStack } from './loaders/databaseInit';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import axios from 'axios';

// Middlewares
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import {
  corsMiddleware,
  optionsHandler,
  helmetMiddleware,
  varyOriginMiddleware,
} from './middleware/security';
import { timeoutMiddleware } from './middleware/timeout';
import { cacheMiddleware } from './middleware/cache';
import { queryMonitorMiddleware } from './middleware/queryMonitor';
import { attachApiVersionHeader, deprecationWarningMiddleware } from './middleware/apiVersion';
import { devBypassAuth } from './middleware/devBypassAuth';
import { attachBackendSha } from './middleware/backendSha';
import {
  generalLimiter,
  authLimiter,
  voiceAgentLimiter,
  webhookLimiter,
  publicLimiter,
} from './middleware/rateLimiter';

// Consolidated Routes
import apiV1Router from './routes/index';
// Setup services
import { setupWebSocketServer } from './voice-agent/routes/voiceAgentRoutes';
import { PERFORMANCE } from './config/constants';
import stripeRoutes from './routes/stripeRoutes';
import stripeWebhookRouter from './routes/stripeWebhook';
import subscriptionRoutes from './routes/subscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import { registerSyncJobs, scheduleDailySync, scheduleStatusChecks } from './jobs/syncJobs';

// --- Initialization ---
initSentry();
setupObservability();
console.log('[Startup] Sentry and Observability initialized');

// Initialize DB stack (async, but we don't block app creation)
console.log('[Startup] Initializing database stack...');
initDatabaseStack().catch((err) => {
  StructuredLoggingService.error('Critical DB init failure', err);
});
console.log('[Startup] app creation started');
const app = express();

// --- Security & Config ---
app.disable('x-powered-by');
if (config.isProduction) app.set('trust proxy', 1);

app.use(helmetMiddleware);
app.options('*', optionsHandler);
app.use(corsMiddleware);
app.use(varyOriginMiddleware);
app.use(attachBackendSha);

// --- Rate Limiting ---
// General Rate Limiter for all API routes
app.use('/api/', generalLimiter);

// Tiered Rate Limiters
app.use('/api/auth/', authLimiter);
app.use('/api/voice/', voiceAgentLimiter);
app.use('/api/v1/voice/', voiceAgentLimiter); // Support v1 versioned calls
app.use('/api/stripe/webhook', webhookLimiter); // Specific for Stripe webhooks
app.use('/api/public/', publicLimiter);
app.get('/health', publicLimiter); // Protect health checks

// --- Compression & Body Parsing ---
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['accept']?.includes('application/json')) return compression.filter(req, res);
      return false;
    },
  }),
);

// --- Stripe Webhook (MUST be before express.json()) ---
app.use('/api/stripe', stripeWebhookRouter);
app.use('/api/v1/stripe', stripeWebhookRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- JSON Content-Type Enforcement ---
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (!res.getHeader('Content-Type'))
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

// --- Logging & Monitoring ---
app.use(timeoutMiddleware);
app.use(queryMonitorMiddleware);
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use((req, res, next) => {
  StructuredLoggingService.logRequest(req);
  next();
});

// Performance Logging
app.use((req, res, next) => {
  const startTime = Date.now();
  (req as any).startTime = startTime;
  const originalEnd = res.end.bind(res);

  (res as any).end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    StructuredLoggingService.logRequestComplete(req, res.statusCode, duration);
    res.setHeader('X-Response-Time', `${duration}ms`);

    if (duration > PERFORMANCE.SLOW_REQUEST_THRESHOLD_MS) {
      StructuredLoggingService.warn('Slow request detected', { duration, path: req.path }, req);
    }
    return originalEnd.apply(res, args as any);
  };
  next();
});

// --- Auth Middleware (Dev Bypass) ---
if (config.devBypassAuth && !config.isProduction) {
  StructuredLoggingService.warn('Dev bypass auth ENABLED');
  app.use('/api', devBypassAuth);
}

// --- Documentation ---
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'AIDevelo API' }),
);

// --- Routes ---
// Versioned API
app.use('/api/v1', attachApiVersionHeader, apiV1Router);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
// Legacy Shim
app.use('/api', deprecationWarningMiddleware, attachApiVersionHeader, apiV1Router);

// Public Health
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) =>
  res.json({ ok: true, version: process.env.RENDER_GIT_COMMIT || 'dev' }),
);

app.get('/health/ready', async (req, res) => {
  // Simplified readiness check
  res.json({ ready: true, note: 'Deep checks moved to monitoring service' });
});

// Static Files
if (config.isProduction) {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Error Handling
app.use(errorHandler);

// --- Server Entry Point ---
if (require.main === module) {
  const httpServer = createServer(app);
  setupWebSocketServer(httpServer);

  // Graceful Shutdown
  const cleanup = () => {
    StructuredLoggingService.info('Cleaning up...');
    try {
      require('./services/twilioMediaStream').twilioVoiceService.cleanup();
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
    process.exit(0);
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Background Jobs
  console.log('[Startup] Registering sync jobs...');
  registerSyncJobs();
  console.log('[Startup] Scheduling daily sync...');
  scheduleDailySync();
  console.log('[Startup] Scheduling status checks...');
  scheduleStatusChecks();

  console.log(`[Startup] Attempting to listen on port ${config.port}...`);
  httpServer.listen(config.port, '0.0.0.0', () => {
    StructuredLoggingService.info(`Server ready on port ${config.port}`);
    console.log(`🚀 Server ready on port ${config.port}`);
  });
}

export default app;
