import { z } from 'zod';

/**
 * Zod schema for webdesign contact request validation
 */
export const webdesignContactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  company: z.string().optional(),
  requestType: z.enum(['new', 'redesign'], {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Anfrageart' }),
  }),
  message: z.string().min(12, 'Nachricht muss mindestens 12 Zeichen lang sein'),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type WebdesignContactRequest = z.infer<typeof webdesignContactSchema>;


