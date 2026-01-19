/**
 * Configuration for allowed postMessage origins
 * Used for OAuth callbacks and cross-origin communication
 * 
 * SECURITY: Only exact origin matches are allowed (no substring matching)
 */

/**
 * Get list of allowed origins for postMessage validation
 * Origins are loaded from environment variables or defaults
 */
export const getAllowedOrigins = (): string[] => {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || globalThis.location.origin;
  
  // Build allowed origins list
  const origins: string[] = [
    frontendUrl,
    globalThis.location.origin, // Current origin
  ];

  // Add production origins if in production
  if (import.meta.env.PROD) {
    origins.push(
      'https://aidevelo.ai',
      'https://www.aidevelo.ai',
      'https://real-aidevelo-ai.onrender.com',
    );
  }

  // Add development origins if in development
  if (import.meta.env.DEV) {
    origins.push('http://localhost:5173', 'http://localhost:3000');
  }

  // Remove duplicates and filter out empty strings
  return Array.from(new Set(origins.filter(Boolean)));
};

/**
 * Strict origin validation - only exact matches allowed
 * This prevents XSS attacks via postMessage
 * 
 * @param origin - The origin to validate
 * @returns true if origin is in the allowed list
 */
export const isAllowedOrigin = (origin: string): boolean => {
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};
