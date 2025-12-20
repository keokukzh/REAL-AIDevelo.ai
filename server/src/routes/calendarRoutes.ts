import { Router, Request, Response, NextFunction } from 'express';
import { calendarService } from '../services/calendarService';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest, verifySupabaseAuth } from '../middleware/supabaseAuth';
import { ensureDefaultLocation, ensureOrgForUser, ensureUserRow } from '../services/supabaseDb';
import { createSignedState, verifySignedState } from '../utils/oauthState';
import { resolveLocationId } from '../utils/locationIdResolver';
import { createCalendarTool } from '../voice-agent/tools/calendarTool';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /calendar/{provider}/auth:
 *   get:
 *     summary: Get OAuth URL for calendar provider
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 */
router.get('/:provider/auth', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // This should never happen if verifySupabaseAuth middleware is applied correctly
    // But add defensive check with proper 401 response
    if (!req.supabaseUser) {
      console.error('[CalendarRoutes] User not authenticated - middleware may have failed', {
        hasAuthHeader: !!req.headers.authorization,
        authHeaderPrefix: req.headers.authorization?.substring(0, 20) || 'none',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please log in to connect your calendar',
      });
    }

    const { provider } = req.params;
    const { supabaseUserId, email } = req.supabaseUser;

    // Ensure user, org, location exist
    const user = await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Use PUBLIC_BASE_URL (backend URL) for OAuth redirect, not FRONTEND_URL
    // Google will redirect back to the backend callback endpoint
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 
                         (process.env.NODE_ENV === 'production' 
                           ? 'https://real-aidevelo-ai.onrender.com'
                           : 'http://localhost:5000');
    // Remove trailing slash if present
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/calendar/${provider}/callback`;

    // Create signed state with locationId
    const state = createSignedState({ locationId: location.id, provider: provider as 'google' | 'outlook' });

    // Log for debugging
    console.log('[CalendarRoutes] OAuth redirect URI:', redirectUri);
    console.log('[CalendarRoutes] Location ID:', location.id);

    if (provider === 'google') {
      const { authUrl } = calendarService.getGoogleAuthUrl(redirectUri, location.id);
      res.json({
        success: true,
        data: { 
          authUrl, 
          state,
          // Include redirect URI in response for debugging
          redirectUri,
        },
      });
    } else if (provider === 'outlook') {
      const { authUrl } = calendarService.getOutlookAuthUrl(redirectUri, location.id);
      res.json({
        success: true,
        data: { 
          authUrl, 
          state,
          redirectUri,
        },
      });
    } else {
      return next(new BadRequestError('Ungültiger Provider. Unterstützt: google, outlook'));
    }
  } catch (error) {
    console.error('[CalendarRoutes] Error generating auth URL:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Fehler beim Generieren der OAuth-URL';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Provide more specific error messages for common issues
      if (error.message.includes('ensureUserRow') || error.message.includes('create organization') || error.message.includes('create user')) {
        errorMessage = 'Fehler beim Erstellen des Benutzers oder der Organisation';
      } else if (error.message.includes('ensureOrgForUser') || error.message.includes('Organization not found')) {
        errorMessage = 'Fehler beim Abrufen der Organisation';
      } else if (error.message.includes('ensureDefaultLocation') || error.message.includes('create location')) {
        errorMessage = 'Fehler beim Erstellen des Standorts';
      } else if (error.message.includes('GOOGLE_OAUTH_CLIENT_ID')) {
        errorMessage = 'Google OAuth ist nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in den Environment Variables.';
      }
    }
    
    next(new InternalServerError(errorMessage));
  }
});

/**
 * @swagger
 * /calendar/{provider}/callback:
 *   get:
 *     summary: Handle OAuth callback
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calendar connected successfully
 */
router.get('/:provider/callback', async (req: Request, res: Response, next: NextFunction) => {
  // Note: Callback route does NOT require auth (called by Google OAuth)
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return next(new BadRequestError('Code und State sind erforderlich'));
    }

    // Verify signed state (extracts locationId and provider)
    let stateData: { locationId: string; provider: 'google' | 'outlook' };
    try {
      stateData = verifySignedState(state);
    } catch (error) {
      console.error('[CalendarRoutes] Invalid state:', error);
      return next(new BadRequestError('Ungültiger OAuth-State'));
    }

    if (stateData.provider !== provider) {
      return next(new BadRequestError(`Provider mismatch: expected ${provider}, got ${stateData.provider}`));
    }

    // Use the same redirect URI that was used in the auth request
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 
                         (process.env.NODE_ENV === 'production' 
                           ? 'https://real-aidevelo-ai.onrender.com'
                           : 'http://localhost:5000');
    // Remove trailing slash if present
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/calendar/${provider}/callback`;

    // Exchange code for tokens
    let token;
    if (provider === 'google') {
      token = await calendarService.exchangeGoogleCode(code, redirectUri);
    } else if (provider === 'outlook') {
      token = await calendarService.exchangeOutlookCode(code, redirectUri);
    } else {
      return next(new BadRequestError('Ungültiger Provider'));
    }

    // Store token in database (encrypted)
    await calendarService.storeToken(stateData.locationId, token);

    console.log(`[CalendarRoutes] Stored token for locationId=${stateData.locationId}, provider=${provider}`);

    // Get frontend URL for postMessage targetOrigin
    // In production, FRONTEND_URL must be set; in dev, allow fallback
    let frontendUrl = process.env.FRONTEND_URL || 'https://aidevelo.ai';
    if (!frontendUrl || frontendUrl === '') {
      if (process.env.NODE_ENV === 'production') {
        // Fallback to aidevelo.ai if not set
        console.warn('[CalendarRoutes] FRONTEND_URL not set, using https://aidevelo.ai as fallback');
        frontendUrl = 'https://aidevelo.ai';
      } else {
        // Dev fallback: use '*' for postMessage (less secure but allows testing)
        console.warn('[CalendarRoutes] FRONTEND_URL not set, using "*" as postMessage targetOrigin (dev only)');
        frontendUrl = '*';
      }
    }
    
    // Remove trailing slash
    frontendUrl = frontendUrl.replace(/\/$/, '');
    
    // Return HTML that posts message to parent window
    // Try multiple origins to handle Chrome security warnings
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kalender verbunden</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            (function() {
              const successData = {
                type: 'calendar-oauth-success',
                provider: '${provider}'
              };
              
              // Try to send postMessage to parent window
              if (window.opener && !window.opener.closed) {
                try {
                  // Try multiple target origins to handle different scenarios
                  const targetOrigins = [
                    '${frontendUrl}',
                    'https://aidevelo.ai',
                    'https://www.aidevelo.ai',
                    '*'
                  ];
                  
                  // Send to all possible origins (postMessage accepts array in some browsers)
                  targetOrigins.forEach(origin => {
                    try {
                      window.opener.postMessage(successData, origin);
                    } catch (e) {
                      console.warn('[CalendarCallback] Failed to postMessage to', origin, e);
                    }
                  });
                  
                  // Also try without origin restriction (less secure but works if origin check fails)
                  try {
                    window.opener.postMessage(successData, '*');
                  } catch (e) {
                    console.warn('[CalendarCallback] Failed to postMessage with *', e);
                  }
                  
                  console.log('[CalendarCallback] postMessage sent, closing window');
                  
                  // Close window after a short delay to ensure message is sent
                  setTimeout(function() {
                    window.close();
                  }, 500);
                } catch (error) {
                  console.error('[CalendarCallback] Error sending postMessage:', error);
                  // Fallback: redirect to dashboard
                  window.location.href = '${frontendUrl}/dashboard?calendar=connected';
                }
              } else {
                // No opener window (e.g., Chrome blocked it) - redirect to dashboard
                console.log('[CalendarCallback] No opener window, redirecting to dashboard');
                window.location.href = '${frontendUrl}/dashboard?calendar=connected';
              }
            })();
          </script>
          <p>Kalender erfolgreich verbunden. Sie können dieses Fenster schließen.</p>
          <p><a href="${frontendUrl}/dashboard">Zum Dashboard</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    // Log detailed error for debugging
    console.error('[CalendarRoutes] OAuth callback error:', error);
    
    // Log error details for debugging
    if (error instanceof Error) {
      console.error('[CalendarRoutes] Error name:', error.name);
      console.error('[CalendarRoutes] Error message:', error.message);
      console.error('[CalendarRoutes] Error stack:', error.stack);
    }
    
    // Check for axios errors (from exchangeGoogleCode)
    let axiosError: any = null;
    if ((error as any)?.response) {
      axiosError = (error as any).response;
      console.error('[CalendarRoutes] Axios error response:', {
        status: axiosError.status,
        statusText: axiosError.statusText,
        data: axiosError.data,
      });
    }
    
    // Extract meaningful error message
    let errorMessage = 'Unbekannter Fehler beim Verbinden des Kalenders';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide user-friendly messages for common errors
      if (error.message.includes('TOKEN_ENCRYPTION_KEY')) {
        errorMessage = 'TOKEN_ENCRYPTION_KEY fehlt oder ist ungültig. Bitte setze diese Variable in Render Environment Variables. Siehe docs/TOKEN_ENCRYPTION_KEY_SETUP.md';
      } else if (error.message.includes('refreshToken is required')) {
        errorMessage = 'Google OAuth hat keinen Refresh Token zurückgegeben. Bitte versuche es erneut.';
      } else if (error.message.includes('Failed to exchange Google authorization code')) {
        // Extract Google API error details
        if (axiosError?.data?.error_description) {
          errorMessage = `Google OAuth Fehler: ${axiosError.data.error_description}`;
        } else if (axiosError?.data?.error) {
          errorMessage = `Google OAuth Fehler: ${axiosError.data.error}`;
        } else {
          errorMessage = error.message;
        }
      } else if (error.message.includes('exchangeGoogleCode') || error.message.includes('exchangeOutlookCode')) {
        errorMessage = 'Fehler beim Austausch des OAuth-Codes. Bitte versuche es erneut.';
      } else if (error.message.includes('storeToken') || error.message.includes('database')) {
        errorMessage = 'Fehler beim Speichern des Kalender-Tokens. Bitte überprüfe die Datenbankverbindung.';
      } else if (error.message.includes('GOOGLE_OAUTH_CLIENT_ID') || error.message.includes('GOOGLE_OAUTH_CLIENT_SECRET')) {
        errorMessage = 'Google OAuth ist nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID und GOOGLE_OAUTH_CLIENT_SECRET in Render Environment Variables.';
      } else if (error.message.includes('Invalid state') || error.message.includes('Ungültiger OAuth-State')) {
        errorMessage = 'Ungültiger OAuth-State. Bitte versuche es erneut.';
      } else if (error.message.includes('Code und State sind erforderlich')) {
        errorMessage = 'OAuth-Callback fehlt erforderliche Parameter. Bitte versuche es erneut.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (axiosError) {
      // Handle axios errors
      if (axiosError.status === 400) {
        errorMessage = `Google OAuth Fehler: ${axiosError.data?.error_description || axiosError.data?.error || 'Ungültige Anfrage'}`;
      } else if (axiosError.status === 401) {
        errorMessage = 'Google OAuth Authentifizierung fehlgeschlagen. Bitte überprüfe GOOGLE_OAUTH_CLIENT_ID und GOOGLE_OAUTH_CLIENT_SECRET.';
      } else if (axiosError.status === 403) {
        errorMessage = 'Google OAuth Zugriff verweigert. Bitte überprüfe die OAuth-Konfiguration.';
      } else {
        errorMessage = `Google OAuth Fehler (${axiosError.status}): ${axiosError.data?.error_description || axiosError.data?.error || axiosError.statusText}`;
      }
    }
    
    // Log the error with context
    logger.error('calendar.oauth.callback_failed', error, {
      provider: req.params.provider,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
    });
    
    let frontendUrl = process.env.FRONTEND_URL || 'https://aidevelo.ai';
    if (!frontendUrl || frontendUrl === '') {
      if (process.env.NODE_ENV === 'production') {
        console.error('[CalendarRoutes] FATAL: FRONTEND_URL missing in production');
        frontendUrl = 'https://aidevelo.ai'; // Fallback
      } else {
        frontendUrl = '*';
      }
    }
    
    // Remove trailing slash
    frontendUrl = frontendUrl.replace(/\/$/, '');
    
    // Escape single quotes and newlines for JavaScript string
    const escapedMessage = errorMessage
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fehler</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            (function() {
              const errorData = {
                type: 'calendar-oauth-error',
                message: '${escapedMessage}'
              };
              
              // Try to send postMessage to parent window
              if (window.opener && !window.opener.closed) {
                try {
                  // Try multiple target origins
                  const targetOrigins = [
                    '${frontendUrl}',
                    'https://aidevelo.ai',
                    'https://www.aidevelo.ai',
                    '*'
                  ];
                  
                  targetOrigins.forEach(origin => {
                    try {
                      window.opener.postMessage(errorData, origin);
                    } catch (e) {
                      console.warn('[CalendarCallback] Failed to postMessage to', origin, e);
                    }
                  });
                  
                  // Also try without origin restriction
                  try {
                    window.opener.postMessage(errorData, '*');
                  } catch (e) {
                    console.warn('[CalendarCallback] Failed to postMessage with *', e);
                  }
                  
                  console.log('[CalendarCallback] Error postMessage sent, closing window');
                  
                  setTimeout(function() {
                    window.close();
                  }, 500);
                } catch (err) {
                  console.error('[CalendarCallback] Error sending postMessage:', err);
                  // Fallback: redirect to dashboard with error
                  window.location.href = '${frontendUrl}/dashboard?error=calendar_connection_failed&msg=' + encodeURIComponent('${escapedMessage}');
                }
              } else {
                // No opener window - redirect to dashboard
                console.log('[CalendarCallback] No opener window, redirecting to dashboard with error');
                window.location.href = '${frontendUrl}/dashboard?error=calendar_connection_failed&msg=' + encodeURIComponent('${escapedMessage}');
              }
            })();
          </script>
          <p>Fehler beim Verbinden des Kalenders: ${errorMessage}</p>
          <p><a href="${frontendUrl}/dashboard">Zum Dashboard</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * @swagger
 * /calendar/{provider}/disconnect:
 *   delete:
 *     summary: Disconnect calendar integration
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     responses:
 *       200:
 *         description: Calendar disconnected successfully
 */
router.delete('/:provider/disconnect', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // This should never happen if verifySupabaseAuth middleware is applied correctly
    if (!req.supabaseUser) {
      console.error('[CalendarRoutes] User not authenticated - middleware may have failed');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please log in to disconnect your calendar',
      });
    }

    const { provider } = req.params;
    const { supabaseUserId, email } = req.supabaseUser;

    // Ensure user, org, location exist
    const user = await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Delete calendar integration
    const { error } = await require('../services/supabaseDb').supabaseAdmin
      .from('google_calendar_integrations')
      .delete()
      .eq('location_id', location.id)
      .eq('provider', provider);

    if (error) {
      throw error;
    }

    console.log(`[CalendarRoutes] Disconnected calendar for locationId=${location.id}, provider=${provider}`);

    res.json({
      success: true,
      message: 'Kalender erfolgreich getrennt',
    });
  } catch (error) {
    console.error('[CalendarRoutes] Error disconnecting calendar:', error);
    next(new InternalServerError('Fehler beim Trennen des Kalenders'));
  }
});

/**
 * POST /api/calendar/google/check-availability
 * Admin endpoint to check calendar availability (auth required)
 */
router.post('/google/check-availability', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[CalendarRoutes] Admin check-availability: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Create calendar tool
    const calendarTool = createCalendarTool(locationId);

    // Call check_availability
    const result = await calendarTool.checkAvailability(req.body, 'google');

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error in admin check-availability:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
});

/**
 * POST /api/calendar/google/create-appointment
 * Admin endpoint to create appointment (auth required)
 */
router.post('/google/create-appointment', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[CalendarRoutes] Admin create-appointment: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Validate required fields
    if (!req.body.summary || !req.body.start || !req.body.end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: summary, start, end',
      });
    }

    // Create calendar tool
    const calendarTool = createCalendarTool(locationId);

    // Mark as AI-booked if this is called from the voice agent
    // (can be determined by checking if there's a specific header or flag)
    const isAIBooked = req.body.aiBooked === true || req.body.aiBooked === 'true';
    const appointmentInput = {
      ...req.body,
      aiBooked: isAIBooked,
    };

    // Call create_appointment
    const result = await calendarTool.createAppointment(appointmentInput, 'google');

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error in admin create-appointment:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
});

/**
 * @swagger
 * /calendar/google/events:
 *   get:
 *     summary: List calendar events within a date range
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date/time in ISO 8601 format
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date/time in ISO 8601 format
 *       - in: query
 *         name: calendarId
 *         required: false
 *         schema:
 *           type: string
 *         description: "Calendar ID (default: 'primary')"
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 */
router.get('/google/events', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[CalendarRoutes] List events: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Get query parameters
    const { start, end, calendarId } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: start and end',
        message: 'Both start and end date/time are required in ISO 8601 format',
      });
    }

    // Parse dates
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Start and end must be valid ISO 8601 date/time strings',
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Start date must be before end date',
      });
    }

    // Create calendar tool
    const calendarTool = createCalendarTool(locationId);

    // List events
    const events = await calendarTool.listEvents(
      startDate,
      endDate,
      'google',
      (calendarId as string) || 'primary'
    );

    // Transform events to API response format (convert Date objects to ISO strings)
    const eventsResponse = events.map(event => ({
      id: event.id || '',
      summary: event.summary || event.title,
      description: event.description,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      location: event.location,
      attendees: event.attendees?.map(email => ({ email })) || [],
      htmlLink: event.htmlLink,
      aiBooked: event.aiBooked || false,
      calendarId: event.calendarId || 'primary',
    }));

    res.json({
      success: true,
      data: eventsResponse,
    });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error listing events:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
});

/**
 * @swagger
 * /calendar/google/events/{eventId}:
 *   put:
 *     summary: Update a calendar event
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
router.put('/google/events/:eventId', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const { eventId } = req.params;
    const { calendarId } = req.query;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[CalendarRoutes] Update event: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Validate required fields
    if (!req.body.summary || !req.body.start || !req.body.end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: summary, start, end',
      });
    }

    // Create calendar tool
    const calendarTool = createCalendarTool(locationId);

    // Update event
    const result = await calendarTool.updateEvent(
      eventId,
      {
        summary: req.body.summary,
        start: req.body.start,
        end: req.body.end,
        description: req.body.description,
        attendees: req.body.attendees,
        location: req.body.location,
        timezone: req.body.timezone || 'Europe/Zurich',
        calendarId: (calendarId as string) || 'primary',
      },
      'google',
      (calendarId as string) || 'primary'
    );

    if (result.success && result.data) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to update event',
      });
    }
  } catch (error: any) {
    console.error('[CalendarRoutes] Error updating event:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
});

/**
 * @swagger
 * /calendar/google/events/{eventId}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */
router.delete('/google/events/:eventId', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const { eventId } = req.params;
    const { calendarId } = req.query;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[CalendarRoutes] Delete event: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Create calendar tool
    const calendarTool = createCalendarTool(locationId);

    // Delete event
    const result = await calendarTool.deleteEvent(
      eventId,
      'google',
      (calendarId as string) || 'primary'
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete event',
      });
    }
  } catch (error: any) {
    console.error('[CalendarRoutes] Error deleting event:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
});

export default router;

