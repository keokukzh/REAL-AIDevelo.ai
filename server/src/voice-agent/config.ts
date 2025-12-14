import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'ELEVENLABS_API_KEY',
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

export const voiceAgentConfig = {
  // LLM Configuration
  llm: {
    provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'deepseek',
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  },

  // ASR Configuration
  asr: {
    provider: (process.env.ASR_PROVIDER || 'openai_realtime') as 'openai_realtime' | 'deepgram' | 'assemblyai',
    openaiRealtimeApiKey: process.env.OPENAI_API_KEY || '', // Reuses OpenAI key
    deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
    assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY || '',
  },

  // TTS Configuration
  tts: {
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY!,
    defaultVoice: process.env.ELEVENLABS_DEFAULT_VOICE || '21m00Tcm4TlvDq8ikWAM',
  },

  // Vector DB Configuration
  vectorDb: {
    provider: 'qdrant',
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
    qdrantApiKey: process.env.QDRANT_API_KEY || '',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingProvider: 'openai', // Use OpenAI for embeddings
    embeddingApiKey: process.env.OPENAI_API_KEY || '',
  },

  // Calendar Configuration
  calendar: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    },
    outlook: {
      clientId: process.env.OUTLOOK_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
    },
  },

  // Notification Configuration
  notifications: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
    },
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // RAG Configuration
  rag: {
    enabled: process.env.ENABLE_RAG !== 'false', // Default true, can be disabled with ENABLE_RAG=false
    maxChunks: parseInt(process.env.RAG_MAX_CHUNKS || '5', 10),
    maxChars: parseInt(process.env.RAG_MAX_CHARS || '2500', 10),
    maxCharsPerChunk: parseInt(process.env.RAG_MAX_CHARS_PER_CHUNK || '500', 10),
  },

  // Media Streams Configuration
  mediaStreams: {
    enabled: process.env.ENABLE_MEDIA_STREAMS === 'true', // Default false, must be explicitly enabled
  },
};


