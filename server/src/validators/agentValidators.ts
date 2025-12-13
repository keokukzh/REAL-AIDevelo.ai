import { z } from 'zod';

/**
 * Validation schemas for agent-related endpoints
 */

export const BusinessProfileSchema = z.object({
  companyName: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .transform((val) => val?.trim() || 'Unnamed Agent'),
  industry: z.string()
    .min(1, 'Industry is required')
    .max(50, 'Industry must be less than 50 characters'),
  website: z.union([
    z.string().url('Invalid website URL'),
    z.string().length(0),
    z.undefined()
  ]).optional(),
  location: z.object({
    country: z.literal('CH'),
    city: z.string()
      .min(1, 'City is required')
      .max(50, 'City must be less than 50 characters')
      .trim()
  }),
  contact: z.object({
    phone: z.union([
      z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format'),
      z.string().length(0),
      z.undefined()
    ]).optional(),
    // Email can be blank; when provided and non-empty it must be valid
    email: z.preprocess(
      (val) => typeof val === 'string' ? val.trim() : val,
      z.union([
        z.string().email('Invalid email address'),
        z.string().length(0),
        z.undefined()
      ])
    ).optional()
  }),
  openingHours: z.record(z.string(), z.string()).optional()
});

export const AgentConfigSchema = z.object({
  primaryLocale: z.string()
    .min(2, 'Primary locale is required')
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Invalid locale format (expected: de-CH)'),
  fallbackLocales: z.array(z.string())
    .min(0)
    .max(5, 'Maximum 5 fallback locales allowed')
    .optional()
    .default([]),
  recordingConsent: z.boolean().optional().default(false),
  systemPrompt: z.string()
    .max(5000, 'System prompt must be less than 5000 characters')
    .optional(),
  elevenLabs: z.object({
    voiceId: z.string()
      .min(1, 'Voice ID is required')
      .max(50, 'Invalid voice ID format')
      .default('21m00Tcm4TlvDq8ikWAM'),
    modelId: z.string()
      .min(1, 'Model ID is required')
      .max(50, 'Invalid model ID format')
      .default('eleven_turbo_v2_5')
  }).optional().default({
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    modelId: 'eleven_turbo_v2_5'
  })
});

export const CreateAgentSchema = z.object({
  businessProfile: BusinessProfileSchema,
  config: AgentConfigSchema
})
// allow extra optional fields (subscription, voiceCloning, purchaseId, etc.) to pass through
.passthrough();

export const AgentIdParamSchema = z.object({
  id: z.string().uuid('Invalid agent ID format')
});

