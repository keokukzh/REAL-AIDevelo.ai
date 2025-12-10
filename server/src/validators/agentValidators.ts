import { z } from 'zod';

/**
 * Validation schemas for agent-related endpoints
 */

export const BusinessProfileSchema = z.object({
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters')
    .trim(),
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
    email: z.string()
      .email('Invalid email address')
      .min(1, 'Email is required')
  }),
  openingHours: z.record(z.string(), z.string()).optional()
});

export const AgentConfigSchema = z.object({
  primaryLocale: z.string()
    .min(2, 'Primary locale is required')
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Invalid locale format (expected: de-CH)'),
  fallbackLocales: z.array(z.string())
    .min(0)
    .max(5, 'Maximum 5 fallback locales allowed'),
  systemPrompt: z.string()
    .max(5000, 'System prompt must be less than 5000 characters')
    .optional(),
  elevenLabs: z.object({
    voiceId: z.string()
      .min(1, 'Voice ID is required')
      .max(50, 'Invalid voice ID format'),
    modelId: z.string()
      .min(1, 'Model ID is required')
      .max(50, 'Invalid model ID format')
  })
});

export const CreateAgentSchema = z.object({
  businessProfile: BusinessProfileSchema,
  config: AgentConfigSchema
});

export const AgentIdParamSchema = z.object({
  id: z.string().uuid('Invalid agent ID format')
});

