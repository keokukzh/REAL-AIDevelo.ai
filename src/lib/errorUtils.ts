/**
 * Utility functions for error handling
 */

/**
 * Represents a complex error object (e.g., from gRPC or structured APIs)
 */
interface StructuredError {
  code?: string | number;
  message?: string;
  details?: unknown;
  error?: string | StructuredError;
}

/**
 * Represents an Axios or fetch API error response
 */
interface ApiError {
  response?: {
    data?: {
      error?: string | StructuredError;
      message?: string;
      code?: string | number;
      details?: unknown;
      title?: string;
      type?: string;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

/**
 * User-friendly error message with solution suggestions
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  solution?: string;
  actionLabel?: string;
  action?: () => void;
  retryable?: boolean;
}

/**
 * Maps technical error patterns to user-friendly messages
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  title: string;
  message: string;
  solution: string;
  retryable: boolean;
}> = [
  // Network errors
  {
    pattern: /Failed to fetch|NetworkError|Network request failed|ECONNREFUSED|ENOTFOUND/i,
    title: 'Verbindungsproblem',
    message: 'Die Verbindung zum Server konnte nicht hergestellt werden.',
    solution: 'Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    retryable: true,
  },
  {
    pattern: /timeout|ETIMEDOUT/i,
    title: 'Zeitüberschreitung',
    message: 'Die Anfrage hat zu lange gedauert.',
    solution: 'Bitte versuchen Sie es in einem Moment erneut. Falls das Problem weiterhin besteht, könnte der Server überlastet sein.',
    retryable: true,
  },
  // Authentication errors
  {
    pattern: /401|Unauthorized|Invalid.*token|Session.*expired/i,
    title: 'Anmeldung erforderlich',
    message: 'Ihre Sitzung ist abgelaufen oder ungültig.',
    solution: 'Bitte melden Sie sich erneut an.',
    retryable: false,
  },
  {
    pattern: /403|Forbidden|Zugriff verweigert/i,
    title: 'Zugriff verweigert',
    message: 'Sie haben keine Berechtigung für diese Aktion.',
    solution: 'Bitte kontaktieren Sie Ihren Administrator, wenn Sie Zugriff benötigen.',
    retryable: false,
  },
  // Not found errors
  {
    pattern: /404|Not Found|nicht gefunden/i,
    title: 'Nicht gefunden',
    message: 'Die angeforderte Ressource wurde nicht gefunden.',
    solution: 'Die Seite oder Ressource existiert möglicherweise nicht mehr oder wurde verschoben.',
    retryable: false,
  },
  // Validation errors
  {
    pattern: /422|Validation.*failed|ZodError|Ungültige/i,
    title: 'Ungültige Eingabe',
    message: 'Die eingegebenen Daten sind nicht korrekt.',
    solution: 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
    retryable: false,
  },
  // Rate limiting
  {
    pattern: /429|Too many requests|Rate limit/i,
    title: 'Zu viele Anfragen',
    message: 'Sie haben zu viele Anfragen in kurzer Zeit gestellt.',
    solution: 'Bitte warten Sie einen Moment und versuchen Sie es dann erneut.',
    retryable: true,
  },
  // Server errors
  {
    pattern: /500|Internal Server Error|Server.*error/i,
    title: 'Serverfehler',
    message: 'Auf dem Server ist ein Fehler aufgetreten.',
    solution: 'Unser Team wurde automatisch benachrichtigt. Bitte versuchen Sie es in ein paar Minuten erneut.',
    retryable: true,
  },
  // Service unavailable (503)
  {
    pattern: /503|Service.*unavailable|temporarily.*unavailable/i,
    title: 'Service vorübergehend nicht verfügbar',
    message: 'Der Service ist vorübergehend nicht verfügbar.',
    solution: 'Bitte versuchen Sie es in einem Moment erneut. Der Service wird automatisch neu versucht.',
    retryable: true,
  },
  // Calendar errors
  {
    pattern: /Calendar|Kalender.*verbinden|OAuth.*failed/i,
    title: 'Kalender-Verbindung fehlgeschlagen',
    message: 'Die Verbindung zu Ihrem Kalender konnte nicht hergestellt werden.',
    solution: 'Bitte überprüfen Sie Ihre Kalender-Berechtigungen und versuchen Sie es erneut.',
    retryable: true,
  },
  // Phone/Twilio errors
  {
    pattern: /Twilio|Phone|Telefon.*verbinden|Webhook/i,
    title: 'Telefon-Verbindung fehlgeschlagen',
    message: 'Die Telefon-Verbindung konnte nicht hergestellt werden.',
    solution: 'Bitte überprüfen Sie Ihre Twilio-Konfiguration in den Einstellungen.',
    retryable: true,
  },
  // Database errors
  {
    pattern: /Database|Supabase|Connection.*failed|ECONNREFUSED.*database/i,
    title: 'Datenbankfehler',
    message: 'Die Verbindung zur Datenbank konnte nicht hergestellt werden.',
    solution: 'Bitte versuchen Sie es in einem Moment erneut. Falls das Problem weiterhin besteht, kontaktieren Sie den Support.',
    retryable: true,
  },
];

/**
 * Extracts a user-friendly error message from various error formats
 * @param error - The error object (can be Axios error, Error, string, or unknown)
 * @param defaultMessage - Default message if error cannot be extracted
 * @returns A string error message
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Unbekannter Fehler'): string {
  const userFriendly = extractUserFriendlyError(error, defaultMessage);
  return userFriendly.message;
}

/**
 * Extracts a user-friendly error with title, message, and solution
 * @param error - The error object
 * @param defaultMessage - Default message if error cannot be extracted
 * @returns UserFriendlyError object
 */
export function extractUserFriendlyError(
  error: unknown,
  defaultMessage = 'Ein unerwarteter Fehler ist aufgetreten',
): UserFriendlyError {
  if (!error) {
    return {
      title: 'Fehler',
      message: defaultMessage,
      solution: 'Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.',
      retryable: true,
    };
  }

  let errorMessage = '';
  let statusCode: number | undefined;

  // Handle Axios/API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError;
    const errorData = apiError.response?.data;
    statusCode = apiError.response?.status;

    if (errorData) {
      // RFC 7807 Problem Details format
      if (typeof errorData.title === 'string') {
        errorMessage = errorData.title;
      } else if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.error && typeof errorData.error === 'object') {
        const nestedError = errorData.error as { message?: string; error?: string };
        errorMessage = nestedError.message || nestedError.error || JSON.stringify(errorData.error);
      }
    }

    if (!errorMessage && apiError.message) {
      errorMessage = apiError.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Try to match error message to known patterns
  const matchedPattern = ERROR_PATTERNS.find((pattern) => pattern.pattern.test(errorMessage));

  if (matchedPattern) {
    return {
      title: matchedPattern.title,
      message: matchedPattern.message,
      solution: matchedPattern.solution,
      retryable: matchedPattern.retryable,
    };
  }

  // Handle status codes if no pattern matched
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return {
          title: 'Ungültige Anfrage',
          message: 'Die Anfrage konnte nicht verarbeitet werden.',
          solution: 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
          retryable: false,
        };
      case 401:
        return {
          title: 'Anmeldung erforderlich',
          message: 'Ihre Sitzung ist abgelaufen.',
          solution: 'Bitte melden Sie sich erneut an.',
          retryable: false,
        };
      case 403:
        return {
          title: 'Zugriff verweigert',
          message: 'Sie haben keine Berechtigung für diese Aktion.',
          solution: 'Bitte kontaktieren Sie Ihren Administrator.',
          retryable: false,
        };
      case 404:
        return {
          title: 'Nicht gefunden',
          message: 'Die angeforderte Ressource wurde nicht gefunden.',
          solution: 'Die Seite existiert möglicherweise nicht mehr.',
          retryable: false,
        };
      case 429:
        return {
          title: 'Zu viele Anfragen',
          message: 'Sie haben zu viele Anfragen gestellt.',
          solution: 'Bitte warten Sie einen Moment und versuchen Sie es erneut.',
          retryable: true,
        };
      case 500:
      case 502:
      case 503:
        return {
          title: 'Serverfehler',
          message: 'Auf dem Server ist ein Fehler aufgetreten.',
          solution: 'Unser Team wurde benachrichtigt. Bitte versuchen Sie es in ein paar Minuten erneut.',
          retryable: true,
        };
    }
  }

  // Fallback: return user-friendly version of the error message
  return {
    title: 'Fehler aufgetreten',
    message: errorMessage || defaultMessage,
    solution: 'Bitte versuchen Sie es erneut. Falls das Problem weiterhin besteht, kontaktieren Sie den Support.',
    retryable: true,
  };
}
