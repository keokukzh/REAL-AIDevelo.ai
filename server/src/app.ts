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
import enterpriseRoutes from './routes/enterpriseRoutes';
import calendarRoutes from './routes/calendarRoutes';
import onboardingAIAssistantRoutes from './routes/onboardingAIAssistantRoutes';
import voiceAgentRoutes, { setupWebSocketServer } from './voice-agent/routes/voiceAgentRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import voiceRoutes from './routes/voiceRoutes';
import telephonyRoutes from './routes/telephonyRoutes';
import syncRoutes from './routes/syncRoutes';
import { attachApiVersionHeader, deprecationWarningMiddleware } from './middleware/apiVersion';
import { createServer } from 'http';
import axios from 'axios';

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

// CORS Configuration - Restrict to allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && !config.isProduction) {
      return callback(null, true);
    }
    
    // Allow if origin is in allowed list
    if (origin && config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!origin) {
      // Allow requests with no origin in development
      callback(null, true);
    } else {
      // Log the rejected origin for debugging
      console.warn(`[CORS] Rejected origin: ${origin}. Allowed origins: ${config.allowedOrigins.join(', ')}`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
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

// Apply rate limiting to API routes (except health check). Keep the option to extend to a
// redis-backed store later for distributed deployments.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api') {
    return limiter(req, res, next);
  }
  next();
});

// Logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Body Parser
app.use(express.json({ limit: '10mb' })); // Limit payload size

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
      agents: '/api/agents',
      elevenlabs: '/api/elevenlabs',
      calendar: '/api/calendar',
      payments: '/api/payments',
      enterprise: '/api/enterprise',
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
      agents: '/api/agents',
      elevenlabs: '/api/elevenlabs',
      calendar: '/api/calendar',
      payments: '/api/payments',
      enterprise: '/api/enterprise',
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

v1Router.use('/agents', agentRoutes);
v1Router.use('/elevenlabs', elevenLabsRoutes);
v1Router.use('/tests', testRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/purchases', purchaseRoutes);
v1Router.use('/voice', voiceRoutes);
v1Router.use('/telephony', telephonyRoutes);
v1Router.use('/sync', syncRoutes);
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
  
  httpServer.listen(config.port, async () => {
    console.log(`[AIDevelo Server] Running on http://localhost:${config.port}`);
    console.log(`[AIDevelo Server] Environment: ${config.nodeEnv}`);
    console.log(`[AIDevelo Server] Allowed Origins: ${config.allowedOrigins.join(', ')}`);
    console.log(`[AIDevelo Server] WebSocket server ready for voice-agent connections`);
    console.log(`[AIDevelo Server] Background sync jobs registered and scheduled`);
    
    // Run migrations on startup if database is configured
    if (config.databaseUrl) {
      // Run migrations asynchronously (don't block server startup)
      (async () => {
        try {
          // Import and run migrations directly
          const path = require('path');
          const fs = require('fs');
          const { Client } = require('pg');
          
          // Use DATABASE_PRIVATE_URL if available (Railway private network)
          const dbUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL || config.databaseUrl;
          console.log('[Database] Using database URL:', dbUrl.replace(/:[^:@]+@/, ':****@').split('@')[1] || 'database');
          
          // In Docker, migrations are in /app/db/migrations
          // In development, they're in ../../db/migrations from dist/
          const migrationsDir = fs.existsSync('/app/db/migrations') 
            ? '/app/db/migrations'
            : path.join(__dirname, '../../db/migrations');
          
          if (!fs.existsSync(migrationsDir)) {
            console.warn('[Database] Migrations directory not found:', migrationsDir);
            return;
          }

          const client = new Client({ 
            connectionString: dbUrl,
            connectionTimeoutMillis: 30000, // 30 seconds for Railway
            ssl: config.isProduction ? { rejectUnauthorized: false } : false,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
          });
          
          console.log('[Database] Attempting to connect...');
          
          // Retry logic for connection
          let retries = 3;
          let connected = false;
          while (retries > 0 && !connected) {
            try {
              await client.connect();
              connected = true;
              console.log('[Database] ✅ Connected successfully');
            } catch (connectError: any) {
              retries--;
              if (retries > 0) {
                console.warn(`[Database] Connection attempt failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
              } else {
                throw connectError;
              }
            }
          }
          
          // Create migrations table
          await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
              id SERIAL PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          `);

          // Read and apply migrations
          const files = fs.readdirSync(migrationsDir)
            .filter((f: string) => f.endsWith('.sql'))
            .sort();
          
          console.log(`[Database] Found ${files.length} migration files`);
          
          for (const file of files) {
            const name = file;
            const res = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
            if (res.rows.length > 0) {
              console.log(`[Database] Skipping already-applied: ${name}`);
              continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            console.log(`[Database] Applying ${name}...`);
            try {
              await client.query('BEGIN');
              await client.query(sql);
              await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
              await client.query('COMMIT');
              console.log(`[Database] ✅ Applied ${name}`);
            } catch (err: any) {
              await client.query('ROLLBACK');
              console.error(`[Database] ❌ Failed to apply ${name}:`, err.message);
              throw err;
            }
          }

          await client.end();
          console.log('[Database] ✅ All migrations completed');
        } catch (migrationError: any) {
          console.error('[Database] ❌ Migration failed:', migrationError.message);
          console.error('[Database] Error details:', {
            code: migrationError.code,
            errno: migrationError.errno,
            syscall: migrationError.syscall,
            hostname: migrationError.hostname,
            port: migrationError.port,
          });
          // Don't exit - server can still run with in-memory storage
        }
      })();
    } else {
      console.warn('[Database] ⚠️  DATABASE_URL not set. Database features will be unavailable.');
      console.warn('[Database] Set DATABASE_PRIVATE_URL or DATABASE_URL in Railway Variables.');
    }
  });
}

export default app;
