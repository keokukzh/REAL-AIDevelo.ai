import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  userId: z.string().optional(),
});

export const registerSchema = loginSchema;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

