import { z } from 'zod';

/**
 * Zod schema for support contact request validation
 */
export const supportContactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  subject: z.string().min(1, 'Betreff ist erforderlich'),
  message: z.string().min(12, 'Nachricht muss mindestens 12 Zeichen lang sein'),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type SupportContactRequest = z.infer<typeof supportContactSchema>;
