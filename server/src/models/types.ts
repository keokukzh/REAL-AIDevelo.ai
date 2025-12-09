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
  status: 'unassigned' | 'assigned' | 'active' | 'inactive';
  assignedAt?: Date;
}

export interface VoiceCloning {
  voiceId?: string; // ElevenLabs voice clone ID
  voiceName?: string;
  audioUrl?: string;
  createdAt?: Date;
}

export interface VoiceAgent {
  id: string; // Internal UUID
  elevenLabsAgentId?: string; // External ID from ElevenLabs API
  businessProfile: BusinessProfile;
  config: AgentConfig;
  subscription?: Subscription;
  telephony?: Telephony;
  voiceCloning?: VoiceCloning;
  status: 'draft' | 'configuring' | 'production_ready' | 'inactive' | 'pending_activation' | 'active' | 'live';
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
  id: string; // ElevenLabs phone number ID
  number: string; // E.164 format
  country: string;
  status: 'available' | 'assigned' | 'active' | 'inactive';
  agentId?: string;
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
