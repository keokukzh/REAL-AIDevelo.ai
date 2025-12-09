# Voice Agent Service

A comprehensive voice agent service with RAG (Retrieval-Augmented Generation), real-time voice pipeline (ASR → LLM → TTS), and tool integration (Calendar, CRM, Notifications).

## Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ WebSocket/HTTP
       ▼
┌─────────────────────────────────┐
│  Voice Agent Service            │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Session  │  │   Routes     │ │
│  │ Manager  │  │  (HTTP/WS)   │ │
│  └────┬─────┘  └──────┬───────┘ │
│       │              │           │
│  ┌────▼──────────────▼──────┐  │
│  │     Voice Pipeline       │  │
│  │  ASR → LLM → TTS         │  │
│  └────┬─────────────────────┘  │
│       │                          │
│  ┌────▼──────┐  ┌──────────────┐ │
│  │   RAG     │  │    Tools     │ │
│  │  Query    │  │  (Calendar,  │ │
│  │           │  │   CRM, etc)  │ │
│  └────┬──────┘  └──────────────┘ │
└───────┼──────────────────────────┘
        │
   ┌────▼─────┐  ┌──────────┐
   │ Qdrant   │  │ OpenAI   │
   │ (Vector) │  │ Realtime │
   └──────────┘  └──────────┘
```

## Features

- **RAG (Retrieval-Augmented Generation)**: Per-customer document indexing and retrieval
- **Real-time Voice Pipeline**: OpenAI Realtime API for ASR, configurable LLM, ElevenLabs for TTS
- **Multi-Provider LLM Support**: OpenAI, Anthropic, DeepSeek
- **Tool Integration**: Calendar (Google/Outlook), CRM (webhooks), Notifications (SMS/Email)
- **Session Management**: Call session tracking and conversation history
- **WebSocket Support**: Real-time bidirectional audio streaming

## Setup

### 1. Install Dependencies

Dependencies are already installed in the server package. Required packages:
- `@qdrant/js-client-rest` - Vector database client
- `openai` - OpenAI API client
- `@anthropic-ai/sdk` - Anthropic API client
- `ws` - WebSocket support
- `@types/ws` - TypeScript types for WebSocket

### 2. Environment Variables

Add the following to your `server/.env` file:

```env
# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional
DEEPSEEK_API_KEY=your_deepseek_api_key     # Optional
LLM_MODEL=gpt-4o-mini

# ASR Configuration
ASR_PROVIDER=openai_realtime
# Uses OPENAI_API_KEY for OpenAI Realtime

# TTS Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_DEFAULT_VOICE=21m00Tcm4TlvDq8ikWAM

# Vector DB Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key  # Optional for local
EMBEDDING_MODEL=text-embedding-3-small

# Calendar Configuration (Optional)
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret

# Notification Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_PORT=587

# CRM Configuration (Optional)
CRM_WEBHOOK_URL=your_crm_webhook_url
```

### 3. Start Qdrant (Vector Database)

For local development:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

Or use Qdrant Cloud: https://cloud.qdrant.io

## API Endpoints

### HTTP Endpoints

#### POST `/api/voice-agent/query`
Text query endpoint for webchat.

**Request:**
```json
{
  "customerId": "customer-123",
  "query": "What are your opening hours?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "We are open Monday to Friday from 9:00 to 17:00.",
    "toolCalls": [],
    "ragContext": ["Relevant context chunks..."]
  }
}
```

#### POST `/api/voice-agent/ingest`
Document ingestion endpoint.

**Request:**
```json
{
  "customerId": "customer-123",
  "documents": [
    {
      "content": "Document text content...",
      "fileName": "document.pdf",
      "fileType": "pdf",
      "metadata": {}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "indexed": 15,
    "documentIds": ["doc-id-1"]
  }
}
```

#### GET `/api/voice-agent/session/:sessionId`
Get session information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "customerId": "customer-123",
    "agentId": "agent-id",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "context": {
      "conversationHistory": []
    }
  }
}
```

#### POST `/api/voice-agent/call-session`
Create a new call session.

**Request:**
```json
{
  "customerId": "customer-123",
  "agentId": "agent-id",
  "metadata": {}
}
```

#### DELETE `/api/voice-agent/call-session/:sessionId`
End a call session.

### WebSocket Endpoint

#### WS `/api/voice-agent/call-session?sessionId=xxx&customerId=xxx&agentId=xxx`

Real-time bidirectional audio streaming for voice calls.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:5000/api/voice-agent/call-session?sessionId=xxx&customerId=xxx&agentId=xxx');

// Send audio data
ws.send(audioBuffer);

// Receive audio data
ws.onmessage = (event) => {
  const audioBuffer = event.data;
  // Play audio
};
```

## Usage Examples

### WebChat Integration

```typescript
import { useVoiceAgentChat } from '../hooks/useVoiceAgentChat';

function ChatComponent() {
  const { messages, isLoading, sendMessage } = useVoiceAgentChat({
    customerId: 'customer-123',
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value);
          }
        }}
      />
    </div>
  );
}
```

### Document Ingestion

```typescript
const response = await fetch('/api/voice-agent/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-123',
    documents: [
      {
        content: 'Your document text here...',
        fileName: 'info.txt',
      },
    ],
  }),
});
```

## Architecture Components

### RAG (Retrieval-Augmented Generation)

- **Vector Store** (`rag/vectorStore.ts`): Qdrant client, embedding generation, chunking
- **Ingestion** (`rag/ingest.ts`): Document processing and indexing
- **Query** (`rag/query.ts`): RAG retrieval and reranking
- **Prompt Templates** (`rag/promptTemplates.ts`): System/user prompt construction

### Voice Pipeline

- **OpenAI Realtime** (`voice/openaiRealtime.ts`): WebSocket client for ASR
- **Session Management** (`voice/session.ts`): Call session tracking
- **Handlers** (`voice/handlers.ts`): ASR → LLM → TTS pipeline

### LLM Abstraction

- **Provider** (`llm/provider.ts`): Multi-provider support (OpenAI, Anthropic, DeepSeek)
- **Chat** (`llm/chat.ts`): Chat completion with tool calling

### Tools

- **Calendar** (`tools/calendarTool.ts`): Google/Outlook calendar integration
- **CRM** (`tools/crmTool.ts`): Lead creation via webhooks
- **Notifications** (`tools/notificationTool.ts`): SMS/Email sending
- **Registry** (`tools/toolRegistry.ts`): Tool registration and execution

## Development

### Running the Service

The voice agent service is integrated into the main Express app. Start the server:

```bash
cd server
npm run dev
```

### Testing

1. **Test RAG Query:**
   ```bash
   curl -X POST http://localhost:5000/api/voice-agent/query \
     -H "Content-Type: application/json" \
     -d '{"customerId":"test","query":"Hello"}'
   ```

2. **Test Document Ingestion:**
   ```bash
   curl -X POST http://localhost:5000/api/voice-agent/ingest \
     -H "Content-Type: application/json" \
     -d '{"customerId":"test","documents":[{"content":"Test document"}]}'
   ```

## TODOs / Future Improvements

- [ ] Add PDF/DOCX text extraction (currently expects raw text)
- [ ] Implement proper OAuth2 flow for Google/Outlook Calendar
- [ ] Add email sending with nodemailer
- [ ] Implement reranking model for RAG
- [ ] Add conversation memory/context management
- [ ] Implement proper error recovery and retry logic
- [ ] Add monitoring and logging
- [ ] Add unit and integration tests
- [ ] Migrate from in-memory session store to database
- [ ] Add rate limiting per customer
- [ ] Implement voice activity detection (VAD)
- [ ] Add support for multiple languages

## Notes

- The service uses in-memory session storage. For production, migrate to a database.
- Calendar and notification tools are placeholders and need proper OAuth2/SMTP implementation.
- Document ingestion currently expects raw text. Add PDF/DOCX parsing for production.
- WebSocket audio streaming needs proper audio format handling (PCM, Opus, etc.).


