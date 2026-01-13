import dotenv from 'dotenv';
import crypto from 'crypto';
import { StructuredLoggingService } from '../services/loggingService';

dotenv.config();

// Generate secure random secret (64 bytes = 512 bits)
const generateSecret = () => crypto.randomBytes(64).toString('hex');

// Base required env vars in any environment
const requiredEnvVars = ['NODE_ENV'] as const;

// Additional required variables for production runtime
// Note: TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SECRET must be set (validated in validateEnv)
const productionRequiredEnvVars = [
  'AZURE_SPEECH_KEY',
  'DEEPSEEK_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TWILIO_STREAM_TOKEN',
  // TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SECRET (validated separately)
];

// Optional env vars (with defaults) - computed after validateEnv sets defaults
const getOptionalEnvVars = () => ({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4000',
  // Dev bypass auth (only in development/test, NEVER in production)
  DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH || 'false',
  DEV_SEED_USER_EMAIL: process.env.DEV_SEED_USER_EMAIL || 'dev@aidevelo.local',
  DEV_SEED_USER_ID: process.env.DEV_SEED_USER_ID || '00000000-0000-0000-0000-000000000001',
  // LEGACY: DATABASE_URL - Old pg-pool based database connection
  // New code should use Supabase client directly (see supabaseDb.ts)
  // Kept for backward compatibility with legacy routes/repositories
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_STREAM_TOKEN: process.env.TWILIO_STREAM_TOKEN || '',
  // Twilio API Key (optional, preferred over Auth Token for better security)
  TWILIO_API_KEY_SID: process.env.TWILIO_API_KEY_SID || '',
  TWILIO_API_KEY_SECRET: process.env.TWILIO_API_KEY_SECRET || '',
  // Azure Speech Services
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || '',
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || 'westeurope',
  // DeepSeek LLM
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  // LEGACY: REDIS_URL - Not currently used, kept for future use
  REDIS_URL: process.env.REDIS_URL || '',
  // OPTIONAL: OTEL_EXPORTER_OTLP_ENDPOINT - Observability endpoint
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319',
  // OPTIONAL: KNOWLEDGE_API_KEY - Knowledge base feature
  KNOWLEDGE_API_KEY: process.env.KNOWLEDGE_API_KEY || '',
  // LEGACY: JWT_SECRET - Old JWT-based auth (legacy routes)
  // New routes use Supabase Auth. Kept for backward compatibility.
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-jwt-secret'),
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    (process.env.NODE_ENV === 'production' ? generateSecret() : 'dev-refresh-secret'),
  // Canonical env vars (standardized naming)
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
  TOOL_SHARED_SECRET: process.env.TOOL_SHARED_SECRET || '',
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY || '',
  // Google OAuth (canonical naming)
  GOOGLE_OAUTH_CLIENT_ID:
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CALENDAR_CLIENT_ID ||
    '',
  GOOGLE_OAUTH_CLIENT_SECRET:
    process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    '',
  GOOGLE_OAUTH_REDIRECT_URL: process.env.GOOGLE_OAUTH_REDIRECT_URL || '',
  // SMTP Email (for scheduled reports)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  // Scheduled Reports
  ENABLE_SCHEDULED_REPORTS: process.env.ENABLE_SCHEDULED_REPORTS || 'false',
  CRON_SECRET: process.env.CRON_SECRET || '',
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX || '10',
  VOICE_AGENT_RATE_LIMIT_MAX: process.env.VOICE_AGENT_RATE_LIMIT_MAX || '50',
  // Microsoft 365 OAuth
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || '',
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || '',
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || 'common',
  MICROSOFT_REDIRECT_URI: process.env.MICROSOFT_REDIRECT_URI || '',
  // Analytics Export
  ENABLE_ANALYTICS_EXPORT: process.env.ENABLE_ANALYTICS_EXPORT !== 'false',
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
      console.warn(
        '⚠️  JWT_SECRET not set - generated secure random secret (this will change on restart)',
      );
      console.warn('   For production, set JWT_SECRET in environment variables for persistence.');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      const secret = generateSecret();
      process.env.JWT_REFRESH_SECRET = secret;
      StructuredLoggingService.warn(
        'JWT_REFRESH_SECRET not set - generated secure random secret (this will change on restart). For production, set JWT_REFRESH_SECRET in environment variables for persistence.',
      );
    }
    // Generate TOKEN_ENCRYPTION_KEY if missing in production (32 bytes base64 encoded)
    if (
      !process.env.TOKEN_ENCRYPTION_KEY ||
      process.env.TOKEN_ENCRYPTION_KEY === '' ||
      process.env.TOKEN_ENCRYPTION_KEY.includes('placeholder') ||
      process.env.TOKEN_ENCRYPTION_KEY.includes('change-me')
    ) {
      const key = crypto.randomBytes(32).toString('base64');
      process.env.TOKEN_ENCRYPTION_KEY = key;
      StructuredLoggingService.warn(
        'TOKEN_ENCRYPTION_KEY not set - generated secure random key (this will change on restart). For production, set TOKEN_ENCRYPTION_KEY in environment variables. Generate a key: openssl rand -base64 32. WARNING: Encrypted calendar tokens will not be decryptable after restart if key changes.',
      );
    }
  }

  // Check for Azure/DeepSeek credentials
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const isAzureKeyPlaceholder = !azureKey || azureKey === '' || azureKey.includes('placeholder');

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const isDeepseekKeyPlaceholder =
    !deepseekKey || deepseekKey === '' || deepseekKey.includes('placeholder');

  // Check for TOKEN_ENCRYPTION_KEY (now auto-generated if missing in production)
  const tokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
  const isTokenKeyMissing =
    !tokenEncryptionKey ||
    tokenEncryptionKey === '' ||
    tokenEncryptionKey.includes('placeholder') ||
    tokenEncryptionKey.includes('change-me');

  if (process.env.NODE_ENV === 'production') {
    // In production we require the important secrets to be set — fail fast if missing
    const missing = productionRequiredEnvVars.filter(
      (v) =>
        !process.env[v] || process.env[v] === '' || (process.env[v] || '').includes('placeholder'),
    );
    if (missing.length > 0) {
      StructuredLoggingService.warn(
        `⚠️  Missing environment variables for production: ${missing.join(', ')}. The server will continue to start, but some features may not work. Configure these in your production environment.`,
      );
    }

    // Validate Twilio credentials
    const hasAuthToken = !!(
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_AUTH_TOKEN !== '' &&
      !process.env.TWILIO_AUTH_TOKEN.includes('placeholder')
    );
    const hasApiKey = !!(
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_API_KEY_SID !== '' &&
      process.env.TWILIO_API_KEY_SECRET !== '' &&
      !process.env.TWILIO_API_KEY_SID.includes('placeholder') &&
      !process.env.TWILIO_API_KEY_SECRET.includes('placeholder')
    );

    if (!hasAuthToken && !hasApiKey) {
      StructuredLoggingService.warn(
        '⚠️  Missing Twilio credentials. Voice calling features will not work.',
      );
    }

    // Validate TOKEN_ENCRYPTION_KEY (should be set by now if auto-generated)
    if (isTokenKeyMissing) {
      StructuredLoggingService.warn(
        '⚠️  TOKEN_ENCRYPTION_KEY is missing. Calendar tokens will not be persisted across restarts.',
      );
    } else {
      StructuredLoggingService.info(
        'Calendar encryption enabled (TOKEN_ENCRYPTION_KEY configured)',
      );
    }

    if (!isAzureKeyPlaceholder) {
      StructuredLoggingService.info('Azure Speech Services configured');
    }
    if (!isDeepseekKeyPlaceholder) {
      StructuredLoggingService.info('DeepSeek LLM configured');
    }
  } else {
    // Development: Warn but do not block startup
    if (isAzureKeyPlaceholder) {
      StructuredLoggingService.warn('WARNING: AZURE_SPEECH_KEY not set.');
    }
    if (isDeepseekKeyPlaceholder) {
      StructuredLoggingService.warn('WARNING: DEEPSEEK_API_KEY not set.');
    }

    // In development, warn about TOKEN_ENCRYPTION_KEY but don't fail
    if (isTokenKeyMissing) {
      StructuredLoggingService.warn(
        'WARNING: TOKEN_ENCRYPTION_KEY not set or using placeholder. Calendar token encryption will fall back to in-memory storage (not persisted). For production, set TOKEN_ENCRYPTION_KEY (32 bytes: openssl rand -base64 32).',
      );
    } else {
      StructuredLoggingService.info(
        'Calendar encryption enabled (TOKEN_ENCRYPTION_KEY configured)',
      );
    }
  }
};

// Validate on import (this will set JWT secrets in process.env if missing)
validateEnv();

// Get optional env vars after validation
const optionalEnvVars = getOptionalEnvVars();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:4000', // Vite dev port (canonical)
    'http://localhost:5173', // Vite default port (fallback)
    'https://aidevelo.ai', // Production frontend
    'https://www.aidevelo.ai', // Production frontend with www
    'https://*.pages.dev', // Cloudflare Pages
    'https://*.cloudflare.com', // Cloudflare Workers
  ],
  isProduction: process.env.NODE_ENV === 'production',
  stripeSecretKey: optionalEnvVars.STRIPE_SECRET_KEY,
  stripeWebhookSecret: optionalEnvVars.STRIPE_WEBHOOK_SECRET,
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
  twilioAuthToken: optionalEnvVars.TWILIO_AUTH_TOKEN,
  twilioStreamToken: optionalEnvVars.TWILIO_STREAM_TOKEN,
  twilioApiKeySid: optionalEnvVars.TWILIO_API_KEY_SID,
  twilioApiKeySecret: optionalEnvVars.TWILIO_API_KEY_SECRET,
  // Azure Speech Services
  azureSpeechKey: optionalEnvVars.AZURE_SPEECH_KEY,
  azureSpeechRegion: optionalEnvVars.AZURE_SPEECH_REGION,
  // DeepSeek LLM
  deepseekApiKey: optionalEnvVars.DEEPSEEK_API_KEY,
  // SMTP Email
  smtpHost: optionalEnvVars.SMTP_HOST,
  smtpPort: optionalEnvVars.SMTP_PORT,
  smtpUser: optionalEnvVars.SMTP_USER,
  smtpPass: optionalEnvVars.SMTP_PASS,
  smtpFrom: optionalEnvVars.SMTP_FROM,
  // Scheduled Reports
  enableScheduledReports: optionalEnvVars.ENABLE_SCHEDULED_REPORTS === 'true',
  cronSecret: optionalEnvVars.CRON_SECRET,
  // Dev bypass auth (only in development/test)
  devBypassAuth:
    process.env.DEV_BYPASS_AUTH === 'true' || process.env.ENABLE_DEV_BYPASS_AUTH === 'true',
  enableAnalyticsExport: optionalEnvVars.ENABLE_ANALYTICS_EXPORT,
  devSeedUserEmail: process.env.DEV_SEED_USER_EMAIL || 'dev@aidevelo.local',
  devSeedUserId: process.env.DEV_SEED_USER_ID || '00000000-0000-0000-0000-000000000001',
  // Rate Limiting
  rateLimitWindowMs: parseInt(optionalEnvVars.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMaxRequests: parseInt(optionalEnvVars.RATE_LIMIT_MAX_REQUESTS, 10),
  authRateLimitMax: parseInt(optionalEnvVars.AUTH_RATE_LIMIT_MAX, 10),
  voiceAgentRateLimitMax: parseInt(optionalEnvVars.VOICE_AGENT_RATE_LIMIT_MAX, 10),
  // Microsoft 365 OAuth
  microsoftClientId: optionalEnvVars.MICROSOFT_CLIENT_ID,
  microsoftClientSecret: optionalEnvVars.MICROSOFT_CLIENT_SECRET,
  microsoftTenantId: optionalEnvVars.MICROSOFT_TENANT_ID,
  microsoftRedirectUri: optionalEnvVars.MICROSOFT_REDIRECT_URI,
};
