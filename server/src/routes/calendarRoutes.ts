import { Router, Request, Response, NextFunction } from 'express';
import { calendarService } from '../services/calendarService';
import { BadRequestError, InternalServerError } from '../utils/errors';

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
router.get('/:provider/auth', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    // Use PUBLIC_BASE_URL (backend URL) for OAuth redirect, not FRONTEND_URL
    // Google will redirect back to the backend callback endpoint
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 
                         (process.env.NODE_ENV === 'production' 
                           ? 'https://real-aidevelo-ai.onrender.com'
                           : 'http://localhost:5000');
    // Remove trailing slash if present
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/calendar/${provider}/callback`;

    // Log for debugging
    console.log('[CalendarRoutes] OAuth redirect URI:', redirectUri);
    console.log('[CalendarRoutes] PUBLIC_BASE_URL:', process.env.PUBLIC_BASE_URL || 'not set');
    console.log('[CalendarRoutes] NODE_ENV:', process.env.NODE_ENV);

    if (provider === 'google') {
      const { authUrl, state } = calendarService.getGoogleAuthUrl(redirectUri);
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
      const { authUrl, state } = calendarService.getOutlookAuthUrl(redirectUri);
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
    next(new InternalServerError('Fehler beim Generieren der OAuth-URL'));
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
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return next(new BadRequestError('Code und State sind erforderlich'));
    }

    // Validate state
    const stateData = calendarService.validateState(state);
    if (!stateData || stateData.provider !== provider) {
      return next(new BadRequestError('Ungültiger OAuth-State'));
    }

    // Use the same redirect URI that was used in the auth request
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 
                         (process.env.NODE_ENV === 'production' 
                           ? 'https://real-aidevelo-ai.onrender.com'
                           : 'http://localhost:5000');
    // Remove trailing slash if present
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/calendar/${provider}/callback`;

    let token;
    if (provider === 'google') {
      token = await calendarService.exchangeGoogleCode(code, redirectUri);
    } else if (provider === 'outlook') {
      token = await calendarService.exchangeOutlookCode(code, redirectUri);
    } else {
      return next(new BadRequestError('Ungültiger Provider'));
    }

    // In production, associate token with user session
    // For now, just return success
    const userId = 'temp_user'; // Would come from session
    calendarService.storeToken(userId, token);

    // Get frontend URL for redirect
    const frontendUrl = process.env.FRONTEND_URL || 'https://aidevelo.ai';
    
    // Return HTML that posts message to parent window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kalender verbunden</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'calendar-oauth-success',
                provider: '${provider}'
              }, '${frontendUrl}');
              window.close();
            } else {
              window.location.href = '${frontendUrl}/dashboard';
            }
          </script>
          <p>Kalender erfolgreich verbunden. Sie können dieses Fenster schließen.</p>
        </body>
      </html>
    `);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const frontendUrl = process.env.FRONTEND_URL || 'https://aidevelo.ai';
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fehler</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'calendar-oauth-error',
                message: '${errorMessage.replace(/'/g, "\\'")}'
              }, '${frontendUrl}');
              window.close();
            } else {
              window.location.href = '${frontendUrl}/dashboard?error=calendar_connection_failed';
            }
          </script>
          <p>Fehler beim Verbinden des Kalenders: ${errorMessage}</p>
        </body>
      </html>
    `);
  }
});

export default router;

