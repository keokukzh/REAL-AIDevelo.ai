import dotenv from 'dotenv';

dotenv.config();

const validateEnv = () => {
  // Add validation for critical environment variables here if needed
};

// Validate on import (non-blocking)
validateEnv();

export const voiceAgentConfig = {
  // LLM Configuration
  llm: {
    provider: (process.env.LLM_PROVIDER || 'openai') as
      | 'openai'
      | 'anthropic'
      | 'deepseek'
      | 'vllm',
    apiKey:
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.VLLM_API_KEY ||
      '',
    model: process.env.LLM_MODEL || process.env.VLLM_MODEL || 'gpt-4o-mini',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    vllmBaseUrl: process.env.VLLM_BASE_URL || 'http://vllm:8000/v1',
  },

  // ASR Configuration
  asr: {
    provider: (process.env.ASR_PROVIDER || 'openai_realtime') as
      | 'openai_realtime'
      | 'deepgram'
      | 'assemblyai',
    openaiRealtimeApiKey: process.env.OPENAI_API_KEY || '', // Reuses OpenAI key
    deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
    assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY || '',
  },

  // TTS Configuration
  tts: {
    azureSpeechKey: process.env.AZURE_SPEECH_KEY || '',
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'switzerlandnorth',
    defaultVoice: process.env.AZURE_DEFAULT_VOICE || 'de-CH-LeniNeural',
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
      clientId:
        process.env.GOOGLE_OAUTH_CLIENT_ID ||
        process.env.GOOGLE_CALENDAR_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        '',
      clientSecret:
        process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET ||
        '',
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
