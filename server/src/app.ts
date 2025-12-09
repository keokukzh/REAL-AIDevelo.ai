import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
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
import { createServer } from 'http';

const app = express();

// Security Middleware
app.use(helmet());

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

// Apply rate limiting to API routes (except health check)
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/elevenlabs', elevenLabsRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/onboarding', onboardingAIAssistantRoutes);
app.use('/api/voice-agent', voiceAgentRoutes);

// Error Handling
app.use(errorHandler);

// Start Server
if (require.main === module) {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for voice agent
  setupWebSocketServer(httpServer);
  
  httpServer.listen(config.port, () => {
    console.log(`[AIDevelo Server] Running on http://localhost:${config.port}`);
    console.log(`[AIDevelo Server] Environment: ${config.nodeEnv}`);
    console.log(`[AIDevelo Server] Allowed Origins: ${config.allowedOrigins.join(', ')}`);
    console.log(`[AIDevelo Server] WebSocket server ready for voice-agent connections`);
  });
}

export default app;
