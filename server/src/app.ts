import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import agentRoutes from './routes/agentRoutes';
import elevenLabsRoutes from './routes/elevenLabsRoutes';
import testRoutes from './routes/testRoutes';

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
    
    if (origin && config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Body Parser
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/elevenlabs', elevenLabsRoutes);
app.use('/api/tests', testRoutes);

// Error Handling
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[AIDevelo Server] Running on http://localhost:${config.port}`);
    console.log(`[AIDevelo Server] Environment: ${config.nodeEnv}`);
    console.log(`[AIDevelo Server] Allowed Origins: ${config.allowedOrigins.join(', ')}`);
  });
}

export default app;
