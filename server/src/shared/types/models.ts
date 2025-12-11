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
  openingHours: Record<string, string>;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  createdAt: Date;
}

export interface AgentConfig {
  primaryLocale: string;
  fallbackLocales: string[];
  systemPrompt?: string;
  recordingConsent?: boolean;
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
  phoneNumberId?: string;
  providerSid?: string;
  status: 'unassigned' | 'assigned' | 'active' | 'inactive';
  assignedAt?: Date;
  capabilities?: {
    voice: boolean;
    sms?: boolean;
  };
}

export interface VoiceCloning {
  voiceId?: string;
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
  id: string;
  elevenLabsAgentId?: string;
  userId?: string;
  metadata?: AgentMetadata;
  businessProfile: BusinessProfile;
  config: AgentConfig;
  subscription?: Subscription;
  telephony?: Telephony;
  voiceCloning?: VoiceCloning;
  status:
    | 'draft'
    | 'configuring'
    | 'creating'
    | 'creation_failed'
    | 'production_ready'
    | 'inactive'
    | 'pending_activation'
    | 'active'
    | 'live';
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  planId: string;
  planName: string;
  customerEmail: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  purchaseId: string;
  agentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PhoneNumber {
  id: string;
  providerSid: string;
  number: string;
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
    avgDuration: number;
    avgSatisfaction?: number;
    callsByDay: Array<{
      date: string;
      count: number;
    }>;
    callsByHour: Array<{
      hour: number;
      count: number;
    }>;
    successRate: number;
  };
}

export interface CallHistory {
  id: string;
  agentId: string;
  phoneNumber?: string;
  callerNumber?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
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

