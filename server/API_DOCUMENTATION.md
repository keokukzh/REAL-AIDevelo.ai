# AIDevelo.ai API Documentation

## Overview

The AIDevelo.ai API provides a RESTful interface for managing AI Voice Agents for Swiss SMEs. The API enables you to create, manage, and test voice agents that integrate with ElevenLabs for natural voice synthesis.

## Base URL

- **Development:** `http://localhost:5000/api`
- **Production:** `https://api.aidevelo.ai/api` (when deployed)

## Interactive Documentation

The API includes interactive Swagger UI documentation available at:

- **Development:** `http://localhost:5000/api-docs`
- **Production:** `https://api.aidevelo.ai/api-docs` (when deployed)

The Swagger UI allows you to:
- Browse all available endpoints
- View request/response schemas
- Test API endpoints directly from the browser
- See example requests and responses

## Authentication

**⚠️ Important:** Currently, the API does not require authentication. This should be implemented before production deployment.

## Rate Limiting

All API endpoints are rate-limited to:
- **100 requests per 15 minutes** per IP address

When the rate limit is exceeded, you will receive a `429 Too Many Requests` response.

## API Endpoints

### Agents

#### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "businessProfile": {
    "companyName": "Müller Sanitär AG",
    "industry": "Handwerk / Sanitär",
    "website": "https://www.mueller-sanitaer.ch",
    "location": {
      "country": "CH",
      "city": "Zürich"
    },
    "contact": {
      "phone": "+41 44 123 45 67",
      "email": "info@mueller-sanitaer.ch"
    },
    "openingHours": {
      "Mon-Fri": "08:00-18:00",
      "Sat": "09:00-12:00"
    }
  },
  "config": {
    "primaryLocale": "de-CH",
    "fallbackLocales": ["en-US"],
    "elevenLabs": {
      "voiceId": "21m00Tcm4TlvDq8ikWAM",
      "modelId": "eleven_turbo_v2_5"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "elevenLabsAgentId": "agent_abc123",
    "businessProfile": { ... },
    "config": { ... },
    "status": "production_ready",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get All Agents
```http
GET /api/agents
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "elevenLabsAgentId": "agent_abc123",
      "businessProfile": {
        "companyName": "Müller Sanitär AG",
        ...
      },
      "config": { ... },
      "status": "production_ready",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Agent by ID
```http
GET /api/agents/{id}
```

**Parameters:**
- `id` (path, required): Agent UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    ...
  }
}
```

### ElevenLabs Integration

#### Get Available Voices
```http
GET /api/elevenlabs/voices?locale=de
```

**Query Parameters:**
- `locale` (optional): Locale code for filtering (default: `de`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade"
    },
    {
      "voice_id": "EXAVITQu4vr4xnSDxMaL",
      "name": "Sarah",
      "category": "premade"
    }
  ]
}
```

### Testing

#### Run Automated Test
```http
POST /api/tests/{agentId}/run
```

**Parameters:**
- `agentId` (path, required): Agent UUID to test

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "123e4567-e89b-12d3-a456-426614174000",
    "timestamp": "2024-01-15T10:30:00Z",
    "score": 95,
    "passed": true,
    "details": [
      {
        "case": "Greeting",
        "status": "passed",
        "latencyMs": 450
      },
      {
        "case": "Opening Hours Inquiry",
        "status": "passed",
        "latencyMs": 600
      },
      {
        "case": "Appointment Booking flow",
        "status": "passed",
        "latencyMs": 800
      }
    ]
  }
}
```

### Health Check

#### Health Status
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details (for validation errors)
  }
}
```

### Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error or invalid request
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Validation Errors

When validation fails, the `details` field contains an array of validation errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["businessProfile", "companyName"],
      "message": "Company name is required"
    },
    {
      "path": ["businessProfile", "contact", "email"],
      "message": "Invalid email address"
    }
  ]
}
```

## Data Models

### BusinessProfile

```typescript
{
  companyName: string;        // 1-100 characters
  industry: string;            // 1-50 characters
  website?: string;           // Valid URL (optional)
  location: {
    country: "CH";            // Currently only CH supported
    city: string;              // 1-50 characters
  };
  contact: {
    phone: string;             // Valid phone format
    email: string;             // Valid email address
  };
  openingHours: {
    [key: string]: string;     // e.g., "Mon-Fri": "08:00-18:00"
  };
}
```

### AgentConfig

```typescript
{
  primaryLocale: string;      // Format: "de-CH" (language-country)
  fallbackLocales: string[];  // Max 5 locales
  systemPrompt?: string;      // Max 5000 characters (optional)
  elevenLabs: {
    voiceId: string;          // ElevenLabs voice ID
    modelId: string;          // ElevenLabs model ID
  };
}
```

### VoiceAgent

```typescript
{
  id: string;                 // UUID
  elevenLabsAgentId?: string; // External ElevenLabs ID
  businessProfile: BusinessProfile;
  config: AgentConfig;
  status: "draft" | "configuring" | "production_ready" | "live";
  createdAt: string;          // ISO 8601 date-time
  updatedAt: string;          // ISO 8601 date-time
}
```

## Examples

### cURL Examples

#### Create an Agent
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "businessProfile": {
      "companyName": "Müller Sanitär AG",
      "industry": "Handwerk / Sanitär",
      "location": {
        "country": "CH",
        "city": "Zürich"
      },
      "contact": {
        "phone": "+41 44 123 45 67",
        "email": "info@mueller-sanitaer.ch"
      },
      "openingHours": {
        "Mon-Fri": "08:00-18:00"
      }
    },
    "config": {
      "primaryLocale": "de-CH",
      "fallbackLocales": ["en-US"],
      "elevenLabs": {
        "voiceId": "21m00Tcm4TlvDq8ikWAM",
        "modelId": "eleven_turbo_v2_5"
      }
    }
  }'
```

#### Get All Agents
```bash
curl http://localhost:5000/api/agents
```

#### Get Agent by ID
```bash
curl http://localhost:5000/api/agents/123e4567-e89b-12d3-a456-426614174000
```

#### Get Available Voices
```bash
curl http://localhost:5000/api/elevenlabs/voices?locale=de
```

#### Run Test
```bash
curl -X POST http://localhost:5000/api/tests/123e4567-e89b-12d3-a456-426614174000/run
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```typescript
// Create an agent
const response = await fetch('http://localhost:5000/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    businessProfile: {
      companyName: 'Müller Sanitär AG',
      industry: 'Handwerk / Sanitär',
      location: {
        country: 'CH',
        city: 'Zürich'
      },
      contact: {
        phone: '+41 44 123 45 67',
        email: 'info@mueller-sanitaer.ch'
      },
      openingHours: {
        'Mon-Fri': '08:00-18:00'
      }
    },
    config: {
      primaryLocale: 'de-CH',
      fallbackLocales: ['en-US'],
      elevenLabs: {
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        modelId: 'eleven_turbo_v2_5'
      }
    }
  })
});

const data = await response.json();
```

#### Using Axios
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create an agent
const agent = await api.post('/agents', {
  businessProfile: { ... },
  config: { ... }
});
```

## Best Practices

1. **Always validate input** - The API validates all inputs, but you should also validate on the client side
2. **Handle errors gracefully** - Check the `success` field and handle errors appropriately
3. **Respect rate limits** - Implement exponential backoff if you hit rate limits
4. **Use appropriate HTTP methods** - GET for retrieval, POST for creation
5. **Include proper headers** - Always set `Content-Type: application/json` for POST requests

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **JSON:** `http://localhost:5000/api-docs/swagger.json`
- **YAML:** `http://localhost:5000/api-docs/swagger.yaml` (if configured)

You can use this specification to:
- Generate client SDKs
- Import into API testing tools (Postman, Insomnia)
- Generate documentation in other formats
- Validate API requests/responses

## Support

For API support or questions:
- Check the interactive Swagger UI documentation
- Review the OpenAPI specification
- Contact: support@aidevelo.ai

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Agent management endpoints
- ElevenLabs integration
- Automated testing endpoints
- Input validation with Zod
- Rate limiting
- Comprehensive error handling

