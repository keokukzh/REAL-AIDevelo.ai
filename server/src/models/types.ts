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

export interface VoiceAgent {
  id: string; // Internal UUID
  elevenLabsAgentId?: string; // External ID from ElevenLabs API
  businessProfile: BusinessProfile;
  config: AgentConfig;
  status: 'draft' | 'configuring' | 'production_ready' | 'inactive' | 'active' | 'live';
  createdAt: Date;
  updatedAt: Date;
}
