import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { ensureDefaultLocation, ensureOrgForUser, ensureUserRow } from '../services/supabaseDb';
import { resolveLocationId } from '../utils/locationIdResolver';
import { createCalendarTool } from '../voice-agent/tools/calendarTool';

const router = Router();

/**
 * POST /api/dev/calendar/check-availability
 * Dev-only endpoint to test check_availability tool
 * Only available when NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/check-availability', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        console.log(`[DevCalendarRoutes] Resolved locationId=${locationId} from source=${resolution.source}`);
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
      console.error('[DevCalendarRoutes] Error in check-availability:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });

  /**
   * POST /api/dev/calendar/create-appointment
   * Dev-only endpoint to test create_appointment tool
   * Only available when NODE_ENV !== 'production'
   */
  router.post('/create-appointment', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        console.log(`[DevCalendarRoutes] Resolved locationId=${locationId} from source=${resolution.source}`);
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

      // Call create_appointment
      const result = await calendarTool.createAppointment(req.body, 'google');

      res.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    } catch (error: any) {
      console.error('[DevCalendarRoutes] Error in create-appointment:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });
}

export default router;
