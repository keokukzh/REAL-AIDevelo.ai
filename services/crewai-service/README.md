# CrewAI Content Generation Service

A standalone FastAPI service that uses CrewAI's multi-agent framework to generate high-quality content for the AIDevelo.ai platform.

## Features

- **Multi-Agent Content Generation**: Uses Researcher, Writer, and Editor agents working together
- **Multiple Content Types**: Marketing content, agent prompts, documentation, and reports
- **YAML Configuration**: Easy customization of agents and tasks without code changes
- **REST API**: Simple HTTP interface for integration with Node.js backend
- **Language Support**: Supports multiple languages (de-CH, en-US, fr-CH)

## Architecture

```
┌─────────────────┐
│  Node.js Backend│
│  (Express API)  │
└────────┬─────────┘
         │ HTTP POST
         │ /generate
         ▼
┌─────────────────────────────┐
│  CrewAI Service              │
│  (FastAPI)                   │
│  ┌────────────────────────┐ │
│  │ Content Generation Crew│ │
│  │ - Researcher Agent     │ │
│  │ - Writer Agent         │ │
│  │ - Editor Agent         │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

## Content Types

1. **Marketing Content**: Blog posts, social media posts, email campaigns, landing page copy
2. **Agent Prompts**: System prompts, greeting templates, conversation scripts, FAQ responses
3. **Documentation**: User guides, API documentation, help articles, tutorials
4. **Reports**: Call analysis summaries, business insights, performance reports, lead summaries

## API Endpoints

### POST /generate

Generate content using the CrewAI multi-agent system.

**Request:**
```json
{
  "type": "marketing",
  "topic": "AI Voice Agents for Swiss SMEs",
  "format": "blog-post",
  "context": {
    "industry": "barbershop",
    "language": "de-CH"
  },
  "language": "de-CH"
}
```

**Response:**
```json
{
  "content": "Generated content...",
  "metadata": {
    "topic": "...",
    "content_type": "marketing",
    "format": "blog-post",
    "language": "de-CH",
    "token_usage": {...}
  }
}
```

### GET /health

Health check endpoint.

### GET /types

List available content types and formats.

## Environment Variables

- `CREWAI_LLM_PROVIDER`: LLM provider (openai, anthropic) - default: openai
- `CREWAI_MODEL`: Model name - default: gpt-4o
- `CREWAI_LLM_API_KEY`: API key for LLM provider (or use OPENAI_API_KEY)
- `CREWAI_STORAGE_DIR`: Directory for CrewAI memory storage - default: /app/storage
- `PORT`: Service port - default: 8000

## Development

### Local Setup

```bash
cd services/crewai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker build -t aidevelo-crewai ./services/crewai-service
docker run -p 8004:8000 \
  -e CREWAI_LLM_API_KEY=your_key \
  aidevelo-crewai
```

## Configuration

Agents and tasks are configured via YAML files:
- `config/agents.yaml`: Agent definitions (roles, goals, backstories)
- `config/tasks.yaml`: Task definitions (descriptions, expected outputs)

Modify these files to customize agent behavior without changing code.

## Integration

The service is integrated with the Node.js backend via `server/src/services/crewaiService.ts`.

Example usage:
```typescript
import { crewaiService } from './services/crewaiService';

const result = await crewaiService.generateMarketingContent(
  'AI Voice Agents',
  'blog-post',
  { industry: 'barbershop' },
  'de-CH'
);
```
