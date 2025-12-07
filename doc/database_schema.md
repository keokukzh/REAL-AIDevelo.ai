# Database Schema Documentation

Phase: MVP / V1 (Using TypeScript Interfaces + Mock/Future PostgreSQL)

## 1. VoiceAgent

The core entity representing a Swiss AI Voice Agent.

```typescript
type VoiceAgentStatus = 'draft' | 'created' | 'testing' | 'live' | 'archived';

interface VoiceAgent {
  id: string; // UUID
  elevenLabsAgentId: string; // The ID from ElevenLabs API
  businessProfile: BusinessProfile;
  config: AgentConfig;
  status: VoiceAgentStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. BusinessProfile

Stores company specific data used for System Prompt generation.

```typescript
interface BusinessProfile {
  companyName: string;
  industry: string;
  location: {
    country: 'CH' | 'DE' | 'AT'; // Restricted to DACH, focus CH
    city: string;
    street?: string; // Optional for MVP
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  openingHours: Record<string, string>; // e.g. { "Mon-Fri": "08:00-18:00" }
  specialInstructions?: string; // e.g. "We are closed on Bank Holidays"
}
```

## 3. AgentConfig

Technical configuration for the Voice Agent.

```typescript
interface AgentConfig {
  systemPrompt: string; // The generated prompt
  primaryLocale: string; // e.g. 'de-CH'
  fallbackLocales: string[]; // e.g. ['en-US', 'fr-CH']
  
  elevenLabs: {
    voiceId: string;
    modelId: string; // e.g. 'eleven_turbo_v2_5'
    stability?: number;
    similarityBoost?: number;
  };
  
  tools?: AgentTool[]; // Future: Calendar, SMS capabilities
}
```

## 4. Future Tables (SQL)

### `agents`

| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| eleven_labs_id | VARCHAR | External ID |
| company_name | VARCHAR | |
| status | ENUM | |
| created_at | TIMESTAMP | |

### `agent_configs`

| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| agent_id | UUID | FK -> agents.id |
| system_prompt | TEXT | |
| voice_id | VARCHAR | |

### `call_logs` (Planned)

| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| agent_id | UUID | FK -> agents.id |
| duration_seconds | INT | |
| recording_url | VARCHAR | |
| sentiment | VARCHAR | |
