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
  currentWebsiteUrl: z.string().url('Ungültige URL').optional().or(z.literal('')),
  message: z.string().min(12, 'Nachricht muss mindestens 12 Zeichen lang sein'),
}).refine((data) => {
  // If redesign is selected, currentWebsiteUrl is optional but should be valid if provided
  if (data.requestType === 'redesign' && data.currentWebsiteUrl) {
    try {
      new URL(data.currentWebsiteUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Bitte geben Sie eine gültige URL ein',
  path: ['currentWebsiteUrl'],
});

/**
 * TypeScript type inferred from Zod schema
 */
export type WebdesignContactRequest = z.infer<typeof webdesignContactSchema>;


