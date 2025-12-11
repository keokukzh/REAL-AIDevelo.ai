export interface BusinessProfile {
  companyName: string;
  industry: string;
  website?: string;
  location: {
    country: 'CH';
    city: string;
  };
  contact: {
      phone: string;
      email: string;
  };
  openingHours: Record<string, string>; // e.g., "Mon": "09:00-17:00"
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  createdAt: Date;
}

export interface AgentConfig {
  primaryLocale: string; // e.g. 'de-CH'
  fallbackLocales: string[];
  systemPrompt?: string;
  recordingConsent?: boolean; // Opt-in for call recording
  elevenLabs: {
    voiceId: string;
    modelId: string;
  };
}

export interface Subscription {
  planId: string;
  planName: string;
  purchaseId: string;
  purchasedAt: Date;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
}

export interface Telephony {
  phoneNumber?: string;
  phoneNumberId?: string; // ElevenLabs phone number ID
  providerSid?: string;
  status: 'unassigned' | 'assigned' | 'active' | 'inactive';
  assignedAt?: Date;
  capabilities?: {
    voice: boolean;
    sms?: boolean;
  };
}

export interface VoiceCloning {
  voiceId?: string; // ElevenLabs voice clone ID
  voiceName?: string;
  audioUrl?: string;
  createdAt?: Date;
}

export interface AgentMetadata {
  isDefaultAgent?: boolean;
  createdFrom?: string;
  userId?: string;
  userEmail?: string;
}

export interface VoiceAgent {
  id: string; // Internal UUID
  elevenLabsAgentId?: string; // External ID from ElevenLabs API
  userId?: string;
  metadata?: AgentMetadata;
  businessProfile: BusinessProfile;
  config: AgentConfig;
  subscription?: Subscription;
  telephony?: Telephony;
  voiceCloning?: VoiceCloning;
  status: 'draft' | 'configuring' | 'creating' | 'creation_failed' | 'production_ready' | 'inactive' | 'pending_activation' | 'active' | 'live';
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  planId: string;
  planName: string;
  customerEmail: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  purchaseId: string; // External purchase ID (e.g., from Stripe)
  agentId?: string; // Linked agent ID (set after onboarding)
  createdAt: Date;
  completedAt?: Date;
}

export interface PhoneNumber {
  id: string; // Internal UUID
  providerSid: string; // Provider-assigned SID
  number: string; // E.164 format
  country: string;
  status: 'available' | 'assigned' | 'active' | 'inactive';
  capabilities: {
    voice: boolean;
    sms?: boolean;
  };
  assignedAgentId?: string;
  metadata?: Record<string, any>;
}

export interface PhoneSettings {
  agentId: string;
  greetingMessage?: string;
  voicemailEnabled?: boolean;
  callRecordingEnabled?: boolean;
}

export interface PhoneStatus {
  phoneNumberId: string;
  status: 'available' | 'assigned' | 'active' | 'inactive';
  agentId?: string;
  lastCallAt?: Date;
}

// Agent Template Types
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  languageCode: string;
  industry: string;
  useCase: string[];
  icon: string;
  systemPrompt: string;
  voiceId: string;
  modelId: string;
  defaultSettings: {
    recordingConsent: boolean;
    openingHours: string;
    goals: string[];
  };
  tags: string[];
}

// Analytics Types
export interface AgentAnalytics {
  agentId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgDuration: number; // in seconds
    avgSatisfaction?: number; // 0-100
    callsByDay: Array<{
      date: string;
      count: number;
    }>;
    callsByHour: Array<{
      hour: number;
      count: number;
    }>;
    successRate: number; // percentage
  };
}

// Call History Types
export interface CallHistory {
  id: string;
  agentId: string;
  phoneNumber?: string;
  callerNumber?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'completed' | 'failed' | 'missed' | 'voicemail';
  transcript?: string;
  audioUrl?: string;
  recordingUrl?: string;
  metadata?: {
    satisfaction?: number;
    notes?: string;
    tags?: string[];
  };
}

// Knowledge / RAG ingestion
export type KnowledgeSourceType = 'upload' | 'url';
export type KnowledgeStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface KnowledgeDocument {
  id: string;
  agentId: string;
  sourceType: KnowledgeSourceType;
  title?: string;
  url?: string;
  locale?: string;
  tags?: string[];
  status: KnowledgeStatus;
  chunkCount?: number;
  error?: string;
  fileName?: string;
  fileType?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RAG Document Types
export interface RAGDocument {
  id: string;
  agentId: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'md';
  url?: string;
  fileSize?: number;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
  chunks?: RAGChunk[];
  error?: string;
}

export interface RAGChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  metadata?: Record<string, any>;
  embedding?: number[];
}