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
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/calendar/${provider}/callback`;

    if (provider === 'google') {
      const { authUrl, state } = calendarService.getGoogleAuthUrl(redirectUri);
      res.json({
        success: true,
        data: { authUrl, state },
      });
    } else if (provider === 'outlook') {
      const { authUrl, state } = calendarService.getOutlookAuthUrl(redirectUri);
      res.json({
        success: true,
        data: { authUrl, state },
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

    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/calendar/${provider}/callback`;

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
              }, window.location.origin);
              window.close();
            } else {
              window.location.href = '/onboarding';
            }
          </script>
          <p>Kalender erfolgreich verbunden. Sie können dieses Fenster schließen.</p>
        </body>
      </html>
    `);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
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
                message: '${errorMessage}'
              }, window.location.origin);
              window.close();
            } else {
              window.location.href = '/onboarding?error=calendar_connection_failed';
            }
          </script>
          <p>Fehler beim Verbinden des Kalenders: ${errorMessage}</p>
        </body>
      </html>
    `);
  }
});

export default router;

