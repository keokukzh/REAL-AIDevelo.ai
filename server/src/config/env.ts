import dotenv from 'dotenv';

dotenv.config();

// Base required env vars in any environment
const requiredEnvVars = [
  'NODE_ENV'
] as const;

// Additional required variables for production runtime
const productionRequiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

// Optional env vars (with defaults)
const optionalEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319',
};

const validateEnv = () => {
  // Check for NODE_ENV (required)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
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

// Validate on import
validateEnv();

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
};

