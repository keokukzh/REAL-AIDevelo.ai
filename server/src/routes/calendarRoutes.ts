import { Router, Request, Response, NextFunction } from 'express';
import { calendarService } from '../services/calendarService';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { ensureDefaultLocation, ensureOrgForUser, ensureUserRow } from '../services/supabaseDb';
import { createSignedState, verifySignedState } from '../utils/oauthState';

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
router.get('/:provider/auth', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
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
router.delete('/:provider/disconnect', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
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

export default router;

