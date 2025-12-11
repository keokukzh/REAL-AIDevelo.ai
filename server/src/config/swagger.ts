import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AIDevelo.ai API',
      version: '1.0.0',
      description: `
# AIDevelo.ai API Documentation

RESTful API for managing AI Voice Agents for Swiss SMEs.

## Features
- Create and manage voice agents
- Integrate with ElevenLabs for voice synthesis
- Run automated tests on agents
- Swiss compliance (nDSG) focused

## Authentication
Currently, the API does not require authentication. **This should be implemented before production deployment.** Knowledge ingestion endpoints can be protected via \`KNOWLEDGE_API_KEY\` using the \`x-api-key\` header or a Bearer token.

## Rate Limiting
API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## Base URL
\`${config.isProduction ? 'https://api.aidevelo.ai' : `http://localhost:${config.port}`}\`

## Support
For support, please contact the development team.
      `,
      contact: {
        name: 'AIDevelo.ai Support',
        email: 'support@aidevelo.ai'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: config.isProduction 
          ? 'https://api.aidevelo.ai/api' 
          : `http://localhost:${config.port}/api`,
        description: config.isProduction ? 'Production server' : 'Development server'
      }
    ],
    tags: [
      {
        name: 'Agents',
        description: 'Operations for managing AI voice agents'
      },
      {
        name: 'ElevenLabs',
        description: 'Operations for ElevenLabs voice integration'
      },
      {
        name: 'Tests',
        description: 'Operations for running automated tests on agents'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Knowledge',
        description: 'Knowledge ingestion and retrieval'
      },
      {
        name: 'Telephony',
        description: 'Phone number assignment, activation, and webhooks'
      },
      {
        name: 'Payments',
        description: 'Payment and billing operations (Stripe)'
      },
      {
        name: 'Voice',
        description: 'Voice cloning and media endpoints'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details (validation errors, etc.)',
              additionalProperties: true
            }
          },
          required: ['success', 'error']
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          },
          required: ['success', 'data']
        },
        BusinessProfile: {
          type: 'object',
          required: ['companyName', 'industry', 'location', 'contact', 'openingHours'],
          properties: {
            companyName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Müller Sanitär AG',
              description: 'Company name'
            },
            industry: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              example: 'Handwerk / Sanitär',
              description: 'Industry sector'
            },
            website: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://www.mueller-sanitaer.ch',
              description: 'Company website URL'
            },
            location: {
              type: 'object',
              required: ['country', 'city'],
              properties: {
                country: {
                  type: 'string',
                  enum: ['CH'],
                  example: 'CH',
                  description: 'Country code (currently only CH supported)'
                },
                city: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  example: 'Zürich',
                  description: 'City name'
                }
              }
            },
            contact: {
              type: 'object',
              required: ['phone', 'email'],
              properties: {
                phone: {
                  type: 'string',
                  pattern: '^[\\d\\s\\+\\-\\(\\)]+$',
                  example: '+41 44 123 45 67',
                  description: 'Phone number'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'info@mueller-sanitaer.ch',
                  description: 'Email address'
                }
              }
            },
            openingHours: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              example: {
                'Mon-Fri': '08:00-18:00',
                'Sat': '09:00-12:00'
              },
              description: 'Opening hours by day/period'
            }
          }
        },
        AgentConfig: {
          type: 'object',
          required: ['primaryLocale', 'fallbackLocales', 'elevenLabs'],
          properties: {
            primaryLocale: {
              type: 'string',
              pattern: '^[a-z]{2}-[A-Z]{2}$',
              example: 'de-CH',
              description: 'Primary locale (language-country code)'
            },
            fallbackLocales: {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 5,
              example: ['en-US', 'fr-CH'],
              description: 'Fallback locales if primary is not available'
            },
            systemPrompt: {
              type: 'string',
              maxLength: 5000,
              nullable: true,
              example: 'You are a helpful assistant...',
              description: 'Custom system prompt (optional, will be generated if not provided)'
            },
            elevenLabs: {
              type: 'object',
              required: ['voiceId', 'modelId'],
              properties: {
                voiceId: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  example: '21m00Tcm4TlvDq8ikWAM',
                  description: 'ElevenLabs voice ID'
                },
                modelId: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  example: 'eleven_turbo_v2_5',
                  description: 'ElevenLabs model ID'
                }
              }
            }
          }
        },
        VoiceAgent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Internal agent ID (UUID)'
            },
            elevenLabsAgentId: {
              type: 'string',
              nullable: true,
              example: 'agent_abc123',
              description: 'External ElevenLabs agent ID'
            },
            businessProfile: {
              $ref: '#/components/schemas/BusinessProfile'
            },
            config: {
              $ref: '#/components/schemas/AgentConfig'
            },
            status: {
              type: 'string',
              enum: ['draft', 'configuring', 'production_ready', 'live'],
              example: 'production_ready',
              description: 'Agent status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'businessProfile', 'config', 'status', 'createdAt', 'updatedAt']
        },
        CreateAgentRequest: {
          type: 'object',
          required: ['businessProfile', 'config'],
          properties: {
            businessProfile: {
              $ref: '#/components/schemas/BusinessProfile'
            },
            config: {
              $ref: '#/components/schemas/AgentConfig'
            }
          }
        },
        Voice: {
          type: 'object',
          properties: {
            voice_id: {
              type: 'string',
              example: '21m00Tcm4TlvDq8ikWAM'
            },
            name: {
              type: 'string',
              example: 'Rachel'
            },
            category: {
              type: 'string',
              example: 'premade'
            }
          }
        },
        TestResult: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 95
            },
            passed: {
              type: 'boolean',
              example: true
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  case: {
                    type: 'string',
                    example: 'Greeting'
                  },
                  status: {
                    type: 'string',
                    example: 'passed'
                  },
                  latencyMs: {
                    type: 'number',
                    example: 450
                  }
                }
              }
            }
          }
        },
        KnowledgeDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a3d8e9b2-5f8c-4d2d-9c2c-1f9b2a1c3d4e' },
            agentId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            sourceType: { type: 'string', enum: ['upload', 'url'], example: 'upload' },
            title: { type: 'string', example: 'Pricing FAQ' },
            url: { type: 'string', format: 'uri', nullable: true, example: 'https://example.com/faq' },
            locale: { type: 'string', example: 'de-CH' },
            tags: { type: 'array', items: { type: 'string' }, example: ['pricing', 'faq'] },
            status: { type: 'string', enum: ['queued', 'processing', 'ready', 'failed'], example: 'ready' },
            chunkCount: { type: 'integer', example: 24 },
            error: { type: 'string', nullable: true, example: 'Failed to parse PDF' },
            fileName: { type: 'string', example: 'pricing.pdf' },
            fileType: { type: 'string', example: 'application/pdf' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-02-01T10:00:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-02-01T10:05:00Z' }
          }
        },
        KnowledgeJob: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/KnowledgeDocument' },
            message: { type: 'string', example: 'Upload queued for ingestion' }
          }
        },
        PhoneNumber: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '8c3c5f4e-2b7f-4f4f-9b4a-1a2b3c4d5e6f' },
            providerSid: { type: 'string', example: 'PNxxxxxxxx' },
            number: { type: 'string', example: '+41445556677' },
            country: { type: 'string', example: 'CH' },
            status: { type: 'string', enum: ['available', 'assigned', 'active', 'inactive'], example: 'assigned' },
            capabilities: {
              type: 'object',
              properties: {
                voice: { type: 'boolean', example: true },
                sms: { type: 'boolean', example: false }
              }
            },
            assignedAgentId: { type: 'string', format: 'uuid', nullable: true },
            metadata: { type: 'object', additionalProperties: true, nullable: true }
          }
        },
        PaymentSession: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', example: 'cs_test_a1B2C3D4E5' },
            url: { type: 'string', format: 'uri', example: 'https://checkout.stripe.com/c/pay/cs_test_a1B2C3D4E5' }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Validation failed',
                details: [
                  {
                    path: ['businessProfile', 'companyName'],
                    message: 'Company name is required'
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Agent not found'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Internal Server Error'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Too many requests from this IP, please try again later.'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/app.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);

