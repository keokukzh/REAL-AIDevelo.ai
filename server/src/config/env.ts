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
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  // STRIPE/PAYMENT REMOVED - No longer required
  // 'STRIPE_SECRET_KEY',
  // 'STRIPE_WEBHOOK_SECRET',
  'TWILIO_STREAM_TOKEN',
];

// Optional env vars (with defaults) - computed after validateEnv sets defaults
const getOptionalEnvVars = () => ({
  // STRIPE/PAYMENT REMOVED
  // STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  // STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4000',
  // LEGACY: DATABASE_URL - Old pg-pool based database connection
  // New code should use Supabase client directly (see supabaseDb.ts)
  // Kept for backward compatibility with legacy routes/repositories
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TWILIO_STREAM_TOKEN: process.env.TWILIO_STREAM_TOKEN || '',
  // LEGACY: REDIS_URL - Not currently used, kept for future use
  REDIS_URL: process.env.REDIS_URL || '',
  // OPTIONAL: OTEL_EXPORTER_OTLP_ENDPOINT - Observability endpoint
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319',
  // OPTIONAL: KNOWLEDGE_API_KEY - Knowledge base feature
  KNOWLEDGE_API_KEY: process.env.KNOWLEDGE_API_KEY || '',
  // LEGACY: JWT_SECRET - Old JWT-based auth (legacy routes)
  // New routes use Supabase Auth. Kept for backward compatibility.
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-jwt-secret'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-refresh-secret'),
  // Canonical env vars (standardized naming)
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
  TOOL_SHARED_SECRET: process.env.TOOL_SHARED_SECRET || '',
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY || '',
  // Google OAuth (canonical naming)
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
  GOOGLE_OAUTH_REDIRECT_URL: process.env.GOOGLE_OAUTH_REDIRECT_URL || '',
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
      console.warn('   For production, set JWT_SECRET in environment variables for persistence.');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      const secret = generateSecret();
      process.env.JWT_REFRESH_SECRET = secret;
      console.warn('⚠️  JWT_REFRESH_SECRET not set - generated secure random secret (this will change on restart)');
      console.warn('   For production, set JWT_REFRESH_SECRET in environment variables for persistence.');
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
    'http://localhost:4000', // Vite dev port (canonical)
    'http://localhost:5173', // Vite default port (fallback)
    'https://aidevelo.ai', // Production frontend
    'https://www.aidevelo.ai', // Production frontend with www
    'https://*.pages.dev', // Cloudflare Pages
    'https://*.cloudflare.com', // Cloudflare Workers
  ],
  isProduction: process.env.NODE_ENV === 'production',
  // STRIPE/PAYMENT REMOVED
  // stripeSecretKey: optionalEnvVars.STRIPE_SECRET_KEY,
  // stripeWebhookSecret: optionalEnvVars.STRIPE_WEBHOOK_SECRET,
  frontendUrl: optionalEnvVars.FRONTEND_URL,
  databaseUrl: optionalEnvVars.DATABASE_URL,
  supabaseUrl: optionalEnvVars.SUPABASE_URL,
  supabaseServiceRoleKey: optionalEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  redisUrl: optionalEnvVars.REDIS_URL,
  otlpExporterEndpoint: optionalEnvVars.OTEL_EXPORTER_OTLP_ENDPOINT,
  knowledgeApiKey: optionalEnvVars.KNOWLEDGE_API_KEY,
  jwtSecret: optionalEnvVars.JWT_SECRET,
  jwtRefreshSecret: optionalEnvVars.JWT_REFRESH_SECRET,
  // Canonical env vars
  publicBaseUrl: optionalEnvVars.PUBLIC_BASE_URL,
  toolSharedSecret: optionalEnvVars.TOOL_SHARED_SECRET,
  tokenEncryptionKey: optionalEnvVars.TOKEN_ENCRYPTION_KEY,
  googleOAuthClientId: optionalEnvVars.GOOGLE_OAUTH_CLIENT_ID,
  googleOAuthClientSecret: optionalEnvVars.GOOGLE_OAUTH_CLIENT_SECRET,
  googleOAuthRedirectUrl: optionalEnvVars.GOOGLE_OAUTH_REDIRECT_URL,
  twilioStreamToken: optionalEnvVars.TWILIO_STREAM_TOKEN,
};

