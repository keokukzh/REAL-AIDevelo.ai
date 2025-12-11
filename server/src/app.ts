// Initialize observability (must be first import)
import { setupObservability } from './config/observability';
import { config } from './config/env';
import { initializeDatabase, testConnection } from './services/database';
setupObservability(config.otlpExporterEndpoint);

// Initialize database connection and run migrations
if (config.databaseUrl) {
  try {
    console.log('[Startup] Initializing database connection...');
    const databaseUrl = config.databaseUrl.replace(/:[^:@]+@/, ':****@');
    console.log('[Startup] DATABASE_URL:', databaseUrl);
    
    initializeDatabase();
    
    // Test connection and run migrations asynchronously (don't block startup)
    testConnection().then(async (connected) => {
      if (connected) {
        console.log('[Database] ✅ Connection successful and ready');
      } else {
        console.error('[Database] ❌ Connection test failed after retries - check DATABASE_URL and network');
      }
    }).catch((err) => {
      console.error('[Database] ❌ Connection error:', err.message);
    });
  } catch (error) {
    console.error('[Database] ❌ Failed to initialize:', (error as Error).message);
  }
} else {
  console.warn('[Database] ⚠️  DATABASE_URL not set - Agent/Purchase features will not work!');
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import agentRoutes from './routes/agentRoutes';
import elevenLabsRoutes from './routes/elevenLabsRoutes';
import testRoutes from './routes/testRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoutes';
import enterpriseRoutes from './routes/enterpriseRoutes';
import calendarRoutes from './routes/calendarRoutes';
import onboardingAIAssistantRoutes from './routes/onboardingAIAssistantRoutes';
import voiceAgentRoutes, { setupWebSocketServer } from './voice-agent/routes/voiceAgentRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import voiceRoutes from './routes/voiceRoutes';
import telephonyRoutes from './routes/telephonyRoutes';
import syncRoutes from './routes/syncRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import privacyRoutes from './routes/privacyRoutes';
import { attachApiVersionHeader, deprecationWarningMiddleware } from './middleware/apiVersion';
import { createServer } from 'http';
import axios from 'axios';
import { requireAuth } from './middleware/auth';

const app = express();

// Security: don't reveal server stack
app.disable('x-powered-by');

// Security Middleware — stricter defaults in production
if (config.isProduction) {
  app.set('trust proxy', 1); // behind load balancer / proxy
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https:']
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
} else {
  app.use(helmet());
}

// Explicit OPTIONS handler BEFORE CORS - respond immediately to avoid Railway timeout
app.options('*', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  const isAllowed =
    !origin ||
    origin === 'https://aidevelo.ai' ||
    origin.endsWith('.aidevelo.ai') ||
    origin.endsWith('.pages.dev') ||
    origin.endsWith('.railway.app') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// CORS Configuration - Allow all Cloudflare Pages and Railway origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin matches allowed patterns
    const isAllowed =
      origin === 'https://aidevelo.ai' ||
      origin.endsWith('.aidevelo.ai') ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.railway.app') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(null, false); // Don't throw error, just reject
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes (except health check and OPTIONS preflight).
// Keep the option to extend to a redis-backed store later for distributed deployments.
app.use((req, res, next) => {
  // Skip rate limiting for OPTIONS (CORS preflight) and health checks
  if (req.method === 'OPTIONS' || req.path === '/health') {
    return next();
  }
  if (req.path.startsWith('/api/') && req.path !== '/api') {
    return limiter(req, res, next);
  }
  next();
});

// Logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Body Parser
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Request logging middleware (after body parser)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health checks to reduce noise
  if (req.path === '/health') {
    return next();
  }
  console.log('[Request]', {
    method: req.method,
    path: req.path,
    url: req.url,
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });
  next();
});

// Serve static files from frontend build (in production)
if (config.isProduction) {
  const path = require('path');
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
}

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
      payments: '/api/payments',
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
  // This is what Railway uses to verify the container is alive
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Routes: Register all routes under a versioned router (v1) and keep top-level /api as a compat shim
const v1Router = express.Router();

v1Router.use('/agents', agentRoutes); // Auth applied per-route in agentRoutes
v1Router.use('/elevenlabs', elevenLabsRoutes);
v1Router.use('/tests', testRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/purchases', requireAuth, purchaseRoutes);
v1Router.use('/voice', requireAuth, voiceRoutes);
v1Router.use('/telephony', requireAuth, telephonyRoutes);
v1Router.use('/sync', requireAuth, syncRoutes);
v1Router.use('/knowledge', requireAuth, knowledgeRoutes);
v1Router.use('/privacy', privacyRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/enterprise', enterpriseRoutes);
v1Router.use('/calendar', calendarRoutes);
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

  // Register and start background jobs
  const { registerSyncJobs, scheduleDailySync, scheduleStatusChecks } = require('./jobs/syncJobs');
  registerSyncJobs();
  scheduleDailySync();
  scheduleStatusChecks();

  const runMigrations = async () => {
    if (!config.databaseUrl) {
      console.warn('[Database] ⚠️  DATABASE_URL not set. Database features will be unavailable.');
      console.warn('[Database] Set DATABASE_PRIVATE_URL or DATABASE_URL in Railway Variables.');
      return;
    }

    const path = require('path');
    const fs = require('fs');
    const { getPool } = require('./services/database');

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
      client = await pool.connect();
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
          await client.query('ROLLBACK');
          console.error(`[Database] [Startup] ❌ Failed to apply ${name}:`, err.message);
          throw err;
        }
      }

      console.log('[Database] [Startup] ✅ All migrations completed successfully');
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
  };

  void start();
}

export default app;
