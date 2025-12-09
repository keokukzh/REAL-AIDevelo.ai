import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'NODE_ENV'
] as const;

// Optional env vars (with defaults)
const optionalEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

const validateEnv = () => {
  // Check for NODE_ENV (required)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  // Check for ELEVENLABS_API_KEY - just warn if missing, don't block startup
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === '' || apiKey.includes('your_') || apiKey.includes('placeholder')) {
    console.warn('\n⚠️  WARNING: ELEVENLABS_API_KEY not set or using placeholder.');
    console.warn('   The server will start, but voice generation will not work.');
    console.warn('   Please set a real ELEVENLABS_API_KEY in your .env file.');
    console.warn('   Get your API key from: https://elevenlabs.io/app/settings/api-keys\n');
    
    // Set a placeholder to prevent errors, but mark it as invalid
    if (!apiKey || apiKey === '') {
      process.env.ELEVENLABS_API_KEY = 'PLACEHOLDER_FOR_TESTING';
    }
  } else {
    console.log('✅ ElevenLabs API key configured');
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
    'http://localhost:5173', // Vite default port
    'https://aidevelo.ai', // Production frontend
    'https://www.aidevelo.ai' // Production frontend with www
  ],
  isProduction: process.env.NODE_ENV === 'production',
  stripeSecretKey: optionalEnvVars.STRIPE_SECRET_KEY,
  stripeWebhookSecret: optionalEnvVars.STRIPE_WEBHOOK_SECRET,
  frontendUrl: optionalEnvVars.FRONTEND_URL,
};

