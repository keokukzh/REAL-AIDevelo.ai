import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Generate secure random secret (64 bytes = 512 bits)
const generateSecret = () => crypto.randomBytes(64).toString('hex');

// Base required env vars in any environment
const requiredEnvVars = [
  'NODE_ENV'
] as const;

// Additional required variables for production runtime
const productionRequiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // JWT secrets removed - will be auto-generated if missing
];

// Optional env vars (with defaults) - computed after validateEnv sets defaults
const getOptionalEnvVars = () => ({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Railway: DATABASE_PRIVATE_URL has priority for private networking
  DATABASE_URL: process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319',
  KNOWLEDGE_API_KEY: process.env.KNOWLEDGE_API_KEY || '',
  // JWT secrets: use process.env (which will have generated values from validateEnv if missing)
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-jwt-secret'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-refresh-secret'),
});

const validateEnv = () => {
  // Check for NODE_ENV (required)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  // Generate JWT secrets if missing in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      const secret = generateSecret();
      process.env.JWT_SECRET = secret;
      console.warn('⚠️  JWT_SECRET not set - generated secure random secret (this will change on restart)');
      console.warn('   For production, set JWT_SECRET in Railway environment variables for persistence.');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      const secret = generateSecret();
      process.env.JWT_REFRESH_SECRET = secret;
      console.warn('⚠️  JWT_REFRESH_SECRET not set - generated secure random secret (this will change on restart)');
      console.warn('   For production, set JWT_REFRESH_SECRET in Railway environment variables for persistence.');
    }
  }
  
  // Check for ELEVENLABS_API_KEY (warning in dev, required in production)
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const isApiKeyPlaceholder = !apiKey || apiKey === '' || apiKey.includes('your_') || apiKey.includes('placeholder') || apiKey === 'PLACEHOLDER_FOR_TESTING';

  if (process.env.NODE_ENV === 'production') {
    // In production we require the important secrets to be set — fail fast if missing
    const missing = productionRequiredEnvVars.filter(v => !process.env[v] || process.env[v] === '' || (process.env[v] || '').includes('placeholder'));
    if (missing.length > 0) {
      console.error('\n🚨 Missing required environment variables for production:', missing.join(', '));
      console.error('   The server will exit. Please configure these in your production environment (do not commit them in git).\n');
      process.exit(1);
    }

    // If API key exists and looks ok, log confirmation
    if (!isApiKeyPlaceholder) {
      console.log('✅ ElevenLabs API key configured');
    }
  } else {
    // Development: Warn but do not block startup
    if (isApiKeyPlaceholder) {
      console.warn('\n⚠️  WARNING: ELEVENLABS_API_KEY not set or using placeholder.');
      console.warn('   The server will start, but voice generation will not work.');
      console.warn('   Please set a real ELEVENLABS_API_KEY in your .env file.');
      console.warn('   Get your API key from: https://elevenlabs.io/app/settings/api-keys\n');
      // Provide developer-friendly placeholder to avoid runtime crashes in dev
      if (!apiKey || apiKey === '') process.env.ELEVENLABS_API_KEY = 'PLACEHOLDER_FOR_TESTING';
    } else {
      console.log('✅ ElevenLabs API key configured');
    }
  }
};

// Validate on import (this will set JWT secrets in process.env if missing)
validateEnv();

// Get optional env vars after validation
const optionalEnvVars = getOptionalEnvVars();

const apiKey = process.env.ELEVENLABS_API_KEY || '';
const isApiKeyValid = apiKey && !apiKey.includes('your_') && !apiKey.includes('placeholder') && apiKey !== 'PLACEHOLDER_FOR_TESTING';

export const config = {
  elevenLabsApiKey: apiKey,
  isElevenLabsConfigured: isApiKeyValid,
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4000', // Vite dev port
    'http://localhost:5173', // Vite default port
    'https://aidevelo.ai', // Production frontend
    'https://www.aidevelo.ai', // Production frontend with www
    'https://real-aideveloai-production.up.railway.app', // Production backend host
    'https://*.pages.dev', // Cloudflare Pages
    'https://*.railway.app', // Railway preview deployments
  ],
  isProduction: process.env.NODE_ENV === 'production',
  stripeSecretKey: optionalEnvVars.STRIPE_SECRET_KEY,
  stripeWebhookSecret: optionalEnvVars.STRIPE_WEBHOOK_SECRET,
  frontendUrl: optionalEnvVars.FRONTEND_URL,
  databaseUrl: optionalEnvVars.DATABASE_URL,
  redisUrl: optionalEnvVars.REDIS_URL,
  otlpExporterEndpoint: optionalEnvVars.OTEL_EXPORTER_OTLP_ENDPOINT,
  knowledgeApiKey: optionalEnvVars.KNOWLEDGE_API_KEY,
  jwtSecret: optionalEnvVars.JWT_SECRET,
  jwtRefreshSecret: optionalEnvVars.JWT_REFRESH_SECRET,
};

