// Initialize observability (must be first import)
import { setupObservability } from './config/observability';
import { config } from './config/env';
import { initializeDatabase, testConnection } from './services/database';
setupObservability(config.otlpExporterEndpoint);

// Initialize database connection with improved error handling
// NOTE: New code uses Supabase client directly (supabaseDb.ts) - DATABASE_URL is legacy for old routes
let dbInitialized = false;
if (config.databaseUrl) {
  try {
    // Check if DATABASE_URL points to old/invalid project (pdxdgfxhpyefqyouotat)
    const isOldProject = config.databaseUrl.includes('pdxdgfxhpyefqyouotat');
    if (isOldProject) {
      console.warn('[Database] ⚠️  DATABASE_URL points to old Supabase project (pdxdgfxhpyefqyouotat)');
      console.warn('[Database] ⚠️  Skipping legacy database connection - new code uses Supabase client directly');
      console.warn('[Database] ⚠️  Remove DATABASE_URL from Render environment variables to avoid ENOTFOUND errors');
      dbInitialized = false;
    } else {
      console.log('[Startup] Initializing legacy database connection...');
      const databaseUrl = config.databaseUrl.replace(/:[^:@]+@/, ':****@');
      console.log('[Startup] DATABASE_URL:', databaseUrl);
      
      // Validate connection string format
      if (!config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.startsWith('postgres://')) {
        console.error('[Database] ❌ Invalid DATABASE_URL format - must start with postgresql:// or postgres://');
        console.warn('[Database] ⚠️  Skipping legacy database connection');
        dbInitialized = false;
      } else {
        try {
          initializeDatabase();
          
          // Test connection with more retries and better error reporting
          testConnection(8).then(async (connected) => {
            dbInitialized = connected;
            if (connected) {
              console.log('[Database] ✅ Legacy connection successful and ready');
            } else {
              console.error('[Database] ❌ Connection test failed after retries');
              console.error('[Database] Troubleshooting:');
              console.error('[Database]   1. Verify DATABASE_URL is correct in environment variables');
              console.error('[Database]   2. Ensure PostgreSQL service is running and accessible');
              console.error('[Database]   3. Verify network connectivity and firewall rules');
              console.error('[Database]   4. Check Supabase/Neon/Render dashboard for connection issues');
              console.warn('[Database] ⚠️  Server will continue - new code uses Supabase client directly');
            }
          }).catch((err) => {
            console.error('[Database] ❌ Connection error:', err.message);
            console.warn('[Database] ⚠️  Server will continue - new code uses Supabase client directly');
            dbInitialized = false;
          });
        } catch (initError) {
          console.error('[Database] ❌ Failed to initialize legacy connection:', (initError as Error).message);
          console.warn('[Database] ⚠️  Server will continue - new code uses Supabase client directly');
          dbInitialized = false;
        }
      }
    }
  } catch (error) {
    console.error('[Database] ❌ Failed to initialize:', (error as Error).message);
    console.warn('[Database] ⚠️  Server will continue - new code uses Supabase client directly');
    dbInitialized = false;
  }
} else {
  console.log('[Database] ℹ️  DATABASE_URL not set - using Supabase client directly (recommended)');
  console.log('[Database] ℹ️  Legacy Agent/Purchase features require DATABASE_URL, but new routes use Supabase client');
}

import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import {
  corsMiddleware,
  optionsHandler,
  helmetMiddleware,
  rateLimitMiddleware,
  varyOriginMiddleware,
} from './middleware/security';
import { timeoutMiddleware } from './middleware/timeout';
import { cacheMiddleware } from './middleware/cache';
import { StructuredLoggingService } from './services/loggingService';
import agentRoutes from './routes/agentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import dbRoutes from './routes/dbRoutes';
import debugRoutes from './routes/debugRoutes';
import elevenLabsRoutes from './routes/elevenLabsRoutes';
import testRoutes from './routes/testRoutes';
import authRoutes from './routes/authRoutes';
import enterpriseRoutes from './routes/enterpriseRoutes';
import calendarRoutes from './routes/calendarRoutes';
import devCalendarRoutes from './routes/devCalendarRoutes';
import devRagRoutes from './routes/devRagRoutes';
import ragRoutes from './routes/ragRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import onboardingAIAssistantRoutes from './routes/onboardingAIAssistantRoutes';
import voiceAgentRoutes, { setupWebSocketServer } from './voice-agent/routes/voiceAgentRoutes';
import voiceRoutes from './routes/voiceRoutes';
import telephonyRoutes from './routes/telephonyRoutes';
import phoneRoutes from './routes/phoneRoutes';
import callsRoutes from './routes/callsRoutes';
import syncRoutes from './routes/syncRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import privacyRoutes from './routes/privacyRoutes';
import twilioRoutes from './routes/twilioRoutes';
import { attachApiVersionHeader, deprecationWarningMiddleware } from './middleware/apiVersion';
import { createServer } from 'http';
import axios from 'axios';
import { requireAuth } from './middleware/auth';
import { devBypassAuth } from './middleware/devBypassAuth';
import { verifySupabaseAuth } from './middleware/supabaseAuth';

const app = express();

// Security: don't reveal server stack
app.disable('x-powered-by');

// Security Middleware — consolidated from security.ts
if (config.isProduction) {
  app.set('trust proxy', 1); // behind load balancer / proxy
}

app.use(helmetMiddleware);
app.options('*', optionsHandler);
app.use(corsMiddleware);
app.use(varyOriginMiddleware);
app.use(rateLimitMiddleware);

// Compression (for JSON responses)
app.use(compression({ 
  filter: (req: Request, res: Response) => {
    // Only compress JSON responses
    if (req.headers['accept']?.includes('application/json') || 
        res.getHeader('content-type')?.toString().includes('application/json')) {
      return compression.filter(req, res);
    }
    return false;
  }
}));

// Request timeout middleware
app.use(timeoutMiddleware);

// Logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Structured request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  StructuredLoggingService.logRequest(req);
  next();
});

// Body Parser
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Ensure Content-Type is set for JSON responses (prevents CORB issues)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to always set Content-Type
  res.json = function(body: any) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return originalJson(body);
  };
  
  next();
});

// Response logging middleware (after body parser)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to log completion
  const originalEnd = res.end.bind(res);
  (res as any).end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const duration = Date.now() - startTime;
    StructuredLoggingService.logRequestComplete(req, res.statusCode, duration);
    
    // Handle Express res.end() overloads
    if (typeof encoding === 'function') {
      // res.end(cb) or res.end(chunk, cb)
      return originalEnd(chunk, encoding);
    } else if (encoding && typeof chunk === 'string') {
      // res.end(chunk, encoding, cb)
      return originalEnd(chunk, encoding, cb);
    } else if (chunk) {
      // res.end(chunk, cb)
      return originalEnd(chunk, cb);
    } else {
      // res.end(cb)
      return originalEnd(cb);
    }
  };
  
  next();
});

// Serve static files from frontend build (in production)
if (config.isProduction) {
  const path = require('path');
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
}

// HTTP Response Cache Middleware (for public GET endpoints)
app.use(cacheMiddleware);

// API Documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AIDevelo.ai API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'AIDevelo API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      apiDocs: '/api-docs',
      auth: '/api/auth',
      agents: '/api/agents',
      elevenlabs: '/api/elevenlabs',
      calendar: '/api/calendar',
      enterprise: '/api/enterprise',
      telephony: '/api/telephony',
      onboarding: '/api/onboarding',
      voiceAgent: '/api/voice-agent'
    }
  });
});

// Health Check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00Z
 */
app.get('/health', (req: Request, res: Response) => {
  // Simple liveness check — responds immediately without any database/external calls
  // Used by Render for health checks
  // Add backend version header (no secrets)
  res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
  res.setHeader('Content-Type', 'application/json');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API health endpoint
// Get backend version from environment (Render sets RENDER_GIT_COMMIT)
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

app.get('/api/health', (req: Request, res: Response) => {
  // Add backend version header (no secrets)
  res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
  res.setHeader('Content-Type', 'application/json');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Readiness check — validate connectivity to required upstream systems (best-effort)
app.get('/health/ready', async (req: Request, res: Response) => {
  const checks: Record<string, any> = { server: { ok: true } };

  // Qdrant check (voice-agent vector DB)
  try {
    // Do best-effort check via voice-agent config (if available)
    const { voiceAgentConfig } = require('./voice-agent/config');
    const qdrantUrl = voiceAgentConfig?.vectorDb?.qdrantUrl;
    if (qdrantUrl) {
      const response = await axios.get(`${qdrantUrl.replace(/\/$/, '')}/collections`, { timeout: 2000 });
      checks.qdrant = { ok: response.status === 200 };
    } else {
      checks.qdrant = { ok: false, reason: 'qdrant not configured' };
    }
  } catch (err: any) {
    checks.qdrant = { ok: false, reason: err?.message || String(err) };
  }

  // Redis connectivity - optional check if configured
  try {
    const { config: appConfig } = require('./config/env');
    if (appConfig?.redisUrl) {
      // Try to load ioredis only if installed
      let Redis: any;
      try { Redis = require('ioredis'); } catch (e) { Redis = null; }
      if (Redis) {
        const client = new Redis(appConfig.redisUrl);
        const pong = await client.ping();
        checks.redis = { ok: pong === 'PONG' };
        await client.quit();
      } else {
        checks.redis = { ok: false, reason: 'ioredis not installed' };
      }
    } else {
      checks.redis = { ok: false, reason: 'redis not configured' };
    }
  } catch (err: any) {
    checks.redis = { ok: false, reason: err?.message || String(err) };
  }

  // If any mandatory check failed, return 503
  const ready = Object.values(checks).every((c: any) => c.ok === true);
  res.status(ready ? 200 : 503).json({ ready, checks });
});

// API root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'AIDevelo API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      agents: '/api/agents',
      elevenlabs: '/api/elevenlabs',
      calendar: '/api/calendar',
      payments: '/api/payments',
      enterprise: '/api/enterprise',
      telephony: '/api/telephony',
      onboarding: '/api/onboarding',
      voiceAgent: '/api/voice-agent'
    }
  });
});

// Basic runtime metrics endpoint (JSON) — useful for lightweight monitoring / health dashboards
app.get('/metrics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    pid: process.pid,
    memory: mem,
    timestamp: new Date().toISOString(),
  });
});

// Auth Middleware: Use dev bypass in dev, otherwise Supabase auth
// Dev bypass MUST be before routes to intercept all /api requests
if (process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
  console.log('⚠️  [DevBypassAuth] Dev bypass auth ENABLED - skipping Supabase token verification');
  app.use('/api', devBypassAuth);
} else {
  // Normal Supabase auth - applied per-route via verifySupabaseAuth middleware
  // (Routes will use verifySupabaseAuth individually)
}

// Routes: Register all routes under a versioned router (v1) and keep top-level /api as a compat shim
const v1Router = express.Router();

v1Router.use('/db', dbRoutes); // NO AUTH - Public preflight endpoint
v1Router.use('/debug', debugRoutes); // NO AUTH - Debug endpoint for env verification
v1Router.use('/agents', agentRoutes); // Auth applied per-route in agentRoutes
v1Router.use('/dashboard', dashboardRoutes); // Auth applied per-route
v1Router.use('/elevenlabs', elevenLabsRoutes);
v1Router.use('/tests', testRoutes);
v1Router.use('/voice', requireAuth, voiceRoutes);
v1Router.use('/telephony', requireAuth, telephonyRoutes);
v1Router.use('/phone', phoneRoutes); // Auth applied per-route
v1Router.use('/calls', callsRoutes); // Auth applied per-route
v1Router.use('/sync', requireAuth, syncRoutes);
v1Router.use('/knowledge', requireAuth, knowledgeRoutes);
v1Router.use('/privacy', privacyRoutes);
v1Router.use('/twilio', twilioRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/enterprise', enterpriseRoutes);
v1Router.use('/calendar', calendarRoutes);
v1Router.use('/rag', ragRoutes); // Auth applied per-route
v1Router.use('/analytics', analyticsRoutes); // Auth applied per-route
if (process.env.NODE_ENV !== 'production') {
  v1Router.use('/dev/calendar', devCalendarRoutes); // Dev-only endpoints
  v1Router.use('/dev/rag', devRagRoutes); // Dev-only RAG endpoints
}
v1Router.use('/onboarding', onboardingAIAssistantRoutes);
v1Router.use('/voice-agent', voiceAgentRoutes);

// Versioned API mount and compatibility shim
app.use('/api/v1', attachApiVersionHeader, v1Router);
// Keep historical /api/<resource> working but add a deprecation warning header
app.use('/api', deprecationWarningMiddleware, attachApiVersionHeader, v1Router);

// Serve frontend SPA (catch-all for client-side routing)
if (config.isProduction) {
  const path = require('path');
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Error Handling
app.use(errorHandler);

// Start Server
if (require.main === module) {
  const httpServer = createServer(app);

  // Setup WebSocket server for voice agent
  setupWebSocketServer(httpServer);

  // Graceful shutdown: cleanup Media Streams sessions and bridges
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, cleaning up...');
    const { twilioMediaStreamService } = require('./services/twilioMediaStreamService');
    const { elevenLabsBridgeService } = require('./services/elevenLabsBridgeService');
    twilioMediaStreamService.cleanup();
    elevenLabsBridgeService.cleanup();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, cleaning up...');
    const { twilioMediaStreamService } = require('./services/twilioMediaStreamService');
    const { elevenLabsBridgeService } = require('./services/elevenLabsBridgeService');
    twilioMediaStreamService.cleanup();
    elevenLabsBridgeService.cleanup();
    process.exit(0);
  });

  // Register and start background jobs
  const { registerSyncJobs, scheduleDailySync, scheduleStatusChecks } = require('./jobs/syncJobs');
  registerSyncJobs();
  scheduleDailySync();
  scheduleStatusChecks();

  const runMigrations = async () => {
    if (!config.databaseUrl) {
      console.log('[Database] ℹ️  DATABASE_URL not set - skipping legacy migrations');
      console.log('[Database] ℹ️  New code uses Supabase client directly (no migrations needed)');
      return;
    }

    // Check if DATABASE_URL points to old/invalid project
    if (config.databaseUrl.includes('pdxdgfxhpyefqyouotat')) {
      console.warn('[Database] ⚠️  DATABASE_URL points to old Supabase project (pdxdgfxhpyefqyouotat)');
      console.warn('[Database] ⚠️  Skipping migrations to avoid ENOTFOUND errors');
      console.warn('[Database] ⚠️  Remove DATABASE_URL from Render environment variables');
      return;
    }

    const path = require('path');
    const fs = require('fs');
    const { getPool, testConnection } = require('./services/database');

    // Wait for database connection before running migrations
    console.log('[Database] [Startup] Waiting for database connection...');
    let connected = false;
    for (let i = 0; i < 10; i++) {
      connected = await testConnection(3);
      if (connected) {
        break;
      }
      console.log(`[Database] [Startup] Waiting for database... (${i + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!connected) {
      console.error('[Database] [Startup] ❌ Cannot run migrations - database not connected');
      console.error('[Database] [Startup] Migrations will be skipped. Server will continue but database features may not work.');
      return;
    }

    console.log('[Database] [Startup] Starting migrations...');

    const migrationsDir = fs.existsSync('/app/db/migrations') 
      ? '/app/db/migrations'
      : path.join(__dirname, '../../db/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.warn('[Database] [Startup] Migrations directory not found:', migrationsDir);
      return;
    }

    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not available - check DATABASE_URL');
    }

    let client;
    try {
      // Get client with timeout
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]) as any;
      
      console.log('[Database] [Startup] ✅ Got client from pool');

      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);

      const files = fs.readdirSync(migrationsDir)
        .filter((f: string) => f.endsWith('.sql'))
        .sort();

      console.log(`[Database] [Startup] Found ${files.length} migration files`);

      for (const file of files) {
        const name = file;
        const res = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
        if (res.rows.length > 0) {
          console.log(`[Database] [Startup] Skipping already-applied: ${name}`);
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`[Database] [Startup] Applying ${name}...`);
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
          await client.query('COMMIT');
          console.log(`[Database] [Startup] ✅ Applied ${name}`);
        } catch (err: any) {
          await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
          console.error(`[Database] [Startup] ❌ Failed to apply ${name}:`, err.message);
          throw err;
        }
      }

      console.log('[Database] [Startup] ✅ All migrations completed successfully');
    } catch (error: any) {
      console.error('[Database] [Startup] ❌ Migration error:', error.message);
      // Don't throw - allow server to start even if migrations fail
    } finally {
      if (client) {
        client.release();
        console.log('[Database] [Startup] Client released back to pool');
      }
    }
  };

  const start = async () => {
    try {
      await runMigrations();
    } catch (err: any) {
      console.error('[Database] [Startup] Migration error:', err?.message || err);
    }

    httpServer.listen(config.port, '0.0.0.0', () => {
      console.log(`[AIDevelo Server] Running on http://0.0.0.0:${config.port}`);
      console.log(`[AIDevelo Server] Environment: ${config.nodeEnv}`);
      console.log(`[AIDevelo Server] Allowed Origins: ${config.allowedOrigins.join(', ')}`);
      console.log(`[AIDevelo Server] WebSocket server ready for voice-agent connections`);
      console.log(`[AIDevelo Server] Background sync jobs registered and scheduled`);
      console.log(`[AIDevelo Server] ✅ Server is READY for requests`);
    });

    // Error handling for httpServer
    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      console.error('[AIDevelo Server] ❌ Server error:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`[AIDevelo Server] Port ${config.port} is already in use`);
      }
    });
  };

  start().catch((err) => {
    console.error('[AIDevelo Server] ❌ Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
