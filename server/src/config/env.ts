import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'NODE_ENV'
] as const;

const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or environment configuration.`
    );
  }
};

// Validate on import
validateEnv();

export const config = {
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY!,
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:5173' // Vite default port
  ],
  isProduction: process.env.NODE_ENV === 'production'
};

