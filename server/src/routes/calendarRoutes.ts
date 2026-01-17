import { Router, Request, Response, NextFunction } from 'express';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin } from '../services/supabaseDb';
import {
  ensureUserRow,
  ensureOrgForUser,
  ensureDefaultLocation,
} from '../repositories/provisioningRepository';
import { BadRequestError, InternalServerError } from '../utils/errors';

const router = Router();

/**
 * GET /api/calendar/events
 * Fetch calendar events for the current user
 */
router.get(
  '/events',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Preflight check
      const { checkDbPreflight } = await import('../services/dbPreflight.js');
      const preflight = await checkDbPreflight();
      if (!preflight.ok) {
        return res.status(500).json({
          success: false,
          error: 'Datenbank-Schema unvollständig',
          message: `Fehlende Tabellen: ${preflight.missing.join(', ')}. Bitte führen Sie die Datenbank-Migrationen aus.`,
        });
      }

      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { start, end, locationId } = req.query;

      // Get user and location
      const user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const _location = locationId
        ? { id: locationId as string }
        : await ensureDefaultLocation(org.id);

      let query = supabaseAdmin.from('calendar_events').select('*').eq('user_id', user.id);

      if (start) {
        query = query.gte('start_time', start as string);
      }
      if (end) {
        query = query.lte('end_time', end as string);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Map to frontend format
      const events = (data || []).map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start_time,
        end: e.end_time,
        allDay: e.all_day,
        description: e.description,
        attendees: e.attendees,
        createdBy: e.created_by,
        linkedCallId: e.linked_call_id,
        googleEventId: e.google_event_id,
        color: e.color,
        recurrenceRule: e.recurrence_rule,
      }));

      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
router.post(
  '/events',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const {
        title,
        description,
        start,
        end,
        allDay,
        recurrenceRule,
        attendees,
        reminders,
        linkedCallId,
        createdBy,
      } = req.body;

      if (!title?.trim() || !start || !end) {
        return next(new BadRequestError('Titel, Start und Ende sind erforderlich'));
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return next(new BadRequestError('Ungültiges Datumsformat'));
      }

      if (endDate <= startDate) {
        return next(new BadRequestError('Das Ende des Termins muss nach dem Start liegen'));
      }

      const user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      const insertData = {
        user_id: user.id,
        location_id: location.id,
        title: title.trim(),
        description: description || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        all_day: allDay || false,
        recurrence_rule: recurrenceRule || null,
        attendees: attendees || [],
        reminders: reminders || [],
        linked_call_id: linkedCallId || null,
        created_by: createdBy || 'user',
        color: createdBy === 'agent' ? '#3b82f6' : '#6b7280',
      };

      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Calendar] Insert error:', error);
        throw error;
      }

      if (!data) {
        // Handle mock mode where data might be missing but error is null
        console.warn('[Calendar] No data returned from insert (possibly mock mode)');
        return res.status(201).json({
          success: true,
          data: {
            id: 'mock-id-' + Date.now(),
            title: insertData.title,
            start: insertData.start_time,
            end: insertData.end_time,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          start: data.start_time,
          end: data.end_time,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/calendar/events/:id
 * Update a calendar event
 */
router.put(
  '/events/:id',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { id } = req.params;
      const { title, description, start, end, allDay, recurrenceRule, attendees, reminders } =
        req.body;

      const user = await ensureUserRow(supabaseUserId, email);

      // Build update object
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (start !== undefined) updateData.start_time = start;
      if (end !== undefined) updateData.end_time = end;
      if (allDay !== undefined) updateData.all_day = allDay;
      if (recurrenceRule !== undefined) updateData.recurrence_rule = recurrenceRule;
      if (attendees !== undefined) updateData.attendees = attendees;
      if (reminders !== undefined) updateData.reminders = reminders;

      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          start: data.start_time,
          end: data.end_time,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/calendar/events/:id
 * Delete a calendar event
 */
router.delete(
  '/events/:id',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { id } = req.params;

      const user = await ensureUserRow(supabaseUserId, email);

      const { error } = await supabaseAdmin
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/sync
 * Sync calendar with Google Calendar
 */
router.post(
  '/sync',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;

      const user = await ensureUserRow(supabaseUserId, email);

      // TODO: Implement actual Google Calendar sync
      // For now, just log the sync attempt
      const { error } = await supabaseAdmin.from('calendar_sync_log').insert({
        user_id: user.id,
        sync_type: 'manual',
        events_synced: 0,
        conflicts: 0,
        errors: [],
      });

      if (error) console.warn('Failed to log sync:', error);

      res.json({
        success: true,
        data: {
          eventsSynced: 0,
          conflicts: 0,
          errors: 0,
          message: 'Sync completed (Google Calendar integration pending)',
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/calendar/availability
 * Get available time slots for a given date
 */
router.get(
  '/availability',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { date } = req.query;

      if (!date) {
        return next(new BadRequestError('date is required'));
      }

      const user = await ensureUserRow(supabaseUserId, email);

      // Get events for the day
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: events } = await supabaseAdmin
        .from('calendar_events')
        .select('start_time, end_time')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('end_time', endOfDay.toISOString());

      // Get user preferences
      const { data: prefs } = await supabaseAdmin
        .from('user_calendar_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const businessStart = prefs?.business_hours_start || '08:00';
      const businessEnd = prefs?.business_hours_end || '18:00';
      const slotDuration = prefs?.default_event_duration || 30;

      // Calculate available slots
      const busySlots = (events || []).map((e) => ({
        start: new Date(e.start_time),
        end: new Date(e.end_time),
      }));

      // Generate available slots (simplified)
      const availableSlots: { start: string; end: string }[] = [];
      const dayStart = new Date(date as string);
      const [startHour, startMin] = businessStart.split(':').map(Number);
      const [endHour, endMin] = businessEnd.split(':').map(Number);

      dayStart.setHours(startHour, startMin, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(endHour, endMin, 0, 0);

      let currentSlot = new Date(dayStart);
      while (currentSlot < dayEnd) {
        const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

        // Check if slot overlaps with busy slots
        const isOverlapping = busySlots.some(
          (busy) =>
            (currentSlot >= busy.start && currentSlot < busy.end) ||
            (slotEnd > busy.start && slotEnd <= busy.end) ||
            (currentSlot <= busy.start && slotEnd >= busy.end),
        );

        if (!isOverlapping && slotEnd <= dayEnd) {
          availableSlots.push({
            start: currentSlot.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        currentSlot = slotEnd;
      }

      res.json({ success: true, data: availableSlots });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/agent-access
 * Log and execute agent calendar access
 */
router.post(
  '/agent-access',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { eventId, action } = req.body;

      if (!action || !['read', 'create', 'update', 'delete'].includes(action)) {
        return next(new BadRequestError('Valid action required: read, create, update, delete'));
      }

      const user = await ensureUserRow(supabaseUserId, email);

      // Check permissions
      const { data: prefs } = await supabaseAdmin
        .from('user_calendar_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const permissions = {
        read: prefs?.agent_can_read ?? true,
        create: prefs?.agent_can_create ?? true,
        update: prefs?.agent_can_update ?? true,
        delete: prefs?.agent_can_delete ?? false,
      };

      if (!permissions[action as keyof typeof permissions]) {
        return res.status(403).json({
          success: false,
          error: `Agent is not permitted to ${action} calendar events`,
        });
      }

      res.json({
        success: true,
        data: { permitted: true, action, eventId },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/sync
 * Manually trigger synchronization with external calendar providers
 */
router.post(
  '/sync',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;

      const _user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      // Check if there is a connection
      const { data: connection } = await supabaseAdmin
        .from('calendar_connections')
        .select('*')
        .eq('location_id', location.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!connection) {
        return res.json({
          success: true,
          message: 'Keine aktive Kalenderverbindung gefunden. Nur lokale Events synchronisiert.',
        });
      }

      // TODO: Implement actual Google/Outlook sync logic here
      // This will be added in the next step

      res.json({
        success: true,
        message: 'Synchronisierung erfolgreich gestartet',
      });
    } catch (error) {
      next(error);
    }
  },
);

// =============================================================================
// Google Calendar Route Aliases
// These routes match the frontend API calls to /calendar/google/*
// They delegate to the existing calendar functionality
// =============================================================================

/**
 * GET /api/calendar/google/events
 * Fetch Google Calendar events (alias for /events)
 */
router.get(
  '/google/events',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Preflight check
      const { checkDbPreflight } = await import('../services/dbPreflight.js');
      const preflight = await checkDbPreflight();
      if (!preflight.ok) {
        return res.status(500).json({
          success: false,
          error: 'Datenbank-Schema unvollständig',
          message: `Fehlende Tabellen: ${preflight.missing.join(', ')}. Bitte führen Sie die Datenbank-Migrationen aus.`,
        });
      }

      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { start, end, calendarId } = req.query;

      // Get user and location
      const user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      await ensureDefaultLocation(org.id); // Ensure location exists

      let query = supabaseAdmin.from('calendar_events').select('*').eq('user_id', user.id);

      if (start) {
        query = query.gte('start_time', start as string);
      }
      if (end) {
        query = query.lte('end_time', end as string);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Map to Google Calendar-like format expected by frontend
      const events = (data || []).map((e) => ({
        id: e.id,
        summary: e.title, // Google uses 'summary' instead of 'title'
        description: e.description,
        start: e.start_time,
        end: e.end_time,
        location: null,
        attendees: e.attendees || [],
        htmlLink: null,
        aiBooked: e.created_by === 'agent',
        calendarId: calendarId || 'primary',
      }));

      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/google/create-appointment
 * Create a new calendar event (alias for POST /events)
 */
router.post(
  '/google/create-appointment',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { summary, description, start, end, attendees, location, timezone, aiBooked } =
        req.body;

      if (!summary?.trim() || !start || !end) {
        return next(new BadRequestError('Summary, Start und Ende sind erforderlich'));
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return next(new BadRequestError('Ungültiges Datumsformat'));
      }

      if (endDate <= startDate) {
        return next(new BadRequestError('Das Ende des Termins muss nach dem Start liegen'));
      }

      const user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const locationObj = await ensureDefaultLocation(org.id);

      const insertData = {
        user_id: user.id,
        location_id: locationObj.id,
        title: summary.trim(),
        description: description || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        all_day: false,
        attendees: attendees || [],
        created_by: aiBooked ? 'agent' : 'user',
        color: aiBooked ? '#3b82f6' : '#6b7280',
      };

      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Calendar/Google] Insert error:', error);
        throw error;
      }

      if (!data) {
        return res.status(201).json({
          success: true,
          data: {
            eventId: 'mock-id-' + Date.now(),
            htmlLink: null,
            start: insertData.start_time,
            end: insertData.end_time,
            calendarId: 'primary',
          },
        });
      }

      res.status(201).json({
        success: true,
        data: {
          eventId: data.id,
          htmlLink: null,
          start: data.start_time,
          end: data.end_time,
          calendarId: 'primary',
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/calendar/google/events/:id
 * Update a calendar event (alias for PUT /events/:id)
 */
router.put(
  '/google/events/:id',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { id } = req.params;
      const { summary, description, start, end, attendees } = req.body;

      const user = await ensureUserRow(supabaseUserId, email);

      // Build update object
      const updateData: Record<string, unknown> = {};
      if (summary !== undefined) updateData.title = summary;
      if (description !== undefined) updateData.description = description;
      if (start !== undefined) updateData.start_time = start;
      if (end !== undefined) updateData.end_time = end;
      if (attendees !== undefined) updateData.attendees = attendees;

      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: {
          eventId: data.id,
          htmlLink: null,
          start: data.start_time,
          end: data.end_time,
          calendarId: 'primary',
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/calendar/google/events/:id
 * Delete a calendar event (alias for DELETE /events/:id)
 */
router.delete(
  '/google/events/:id',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const { id } = req.params;

      const user = await ensureUserRow(supabaseUserId, email);

      const { error } = await supabaseAdmin
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/calendar/google/check-availability
 * Check availability for a given date and return available time slots
 */
router.post(
  '/google/check-availability',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;
      const {
        date,
        businessHours = { from: '09:00', to: '17:00' },
        slotMinutes = 30,
        minNoticeMinutes = 60,
        timezone = 'Europe/Zurich',
        maxResults = 20,
      } = req.body;

      if (!date) {
        return next(new BadRequestError('Datum ist erforderlich'));
      }

      const user = await ensureUserRow(supabaseUserId, email);

      // Parse the date and business hours to create time range
      const [year, month, day] = date.split('-').map(Number);
      const [fromHour, fromMinute] = businessHours.from.split(':').map(Number);
      const [toHour, toMinute] = businessHours.to.split(':').map(Number);

      const rangeStart = new Date(year, month - 1, day, fromHour, fromMinute);
      const rangeEnd = new Date(year, month - 1, day, toHour, toMinute);

      // Get existing events for that day
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0).toISOString();
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59).toISOString();

      const { data: existingEvents, error } = await supabaseAdmin
        .from('calendar_events')
        .select('id, title, start_time, end_time')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay);

      if (error) throw error;

      // Generate available slots
      const slots: { start: string; end: string; label: string }[] = [];
      const now = new Date();
      const minNoticeTime = new Date(now.getTime() + minNoticeMinutes * 60 * 1000);
      let currentSlotStart = new Date(rangeStart);

      while (currentSlotStart < rangeEnd && slots.length < maxResults) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + slotMinutes * 60 * 1000);

        // Skip if slot ends after business hours
        if (currentSlotEnd > rangeEnd) break;

        // Skip if slot starts before minimum notice time
        if (currentSlotStart < minNoticeTime) {
          currentSlotStart = new Date(currentSlotStart.getTime() + slotMinutes * 60 * 1000);
          continue;
        }

        // Check for conflicts with existing events
        const hasConflict = (existingEvents || []).some((event) => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          return currentSlotStart < eventEnd && currentSlotEnd > eventStart;
        });

        if (!hasConflict) {
          const formatTime = (d: Date) =>
            d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
          slots.push({
            start: currentSlotStart.toISOString(),
            end: currentSlotEnd.toISOString(),
            label: `${formatTime(currentSlotStart)} - ${formatTime(currentSlotEnd)}`,
          });
        }

        currentSlotStart = new Date(currentSlotStart.getTime() + slotMinutes * 60 * 1000);
      }

      res.json({
        success: true,
        data: {
          timezone,
          range: {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
          },
          slots,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/calendar/google/auth
 * Initiate Google Calendar OAuth flow
 */
router.get(
  '/google/auth',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;

      // Get user's location
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      // Get the redirect URI
      const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://real-aidevelo-ai.onrender.com';
      const redirectUri = `${publicBaseUrl}/api/calendar/google/callback`;

      // Generate OAuth URL
      const { calendarService } = await import('../services/calendarService.js');
      const { authUrl, state } = calendarService.getGoogleAuthUrl(redirectUri, location.id);

      res.json({
        success: true,
        data: {
          authUrl,
          state,
        },
      });
    } catch (error) {
      console.error('[CalendarRoutes] Error generating auth URL:', error);
      next(error);
    }
  },
);

/**
 * GET /api/calendar/google/callback
 * Handle Google Calendar OAuth callback
 */
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error('[CalendarRoutes] OAuth error:', oauthError);
      return res.send(`
          <html>
            <body>
              <script>
                window.opener?.postMessage({ type: 'calendar-oauth-error', message: 'OAuth wurde abgelehnt: ${oauthError}' }, '*');
                window.close();
              </script>
              <p>OAuth fehlgeschlagen: ${oauthError}. Dieses Fenster kann geschlossen werden.</p>
            </body>
          </html>
        `);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter');
    }

    // Verify and decode state
    const { verifySignedState } = await import('../utils/oauthState.js');
    let stateData;
    try {
      stateData = verifySignedState(state as string);
    } catch (err) {
      console.error('[CalendarRoutes] Invalid state:', err);
      return res.send(`
          <html>
            <body>
              <script>
                window.opener?.postMessage({ type: 'calendar-oauth-error', message: 'Ungültiger State-Parameter' }, '*');
                window.close();
              </script>
              <p>Ungültiger State. Dieses Fenster kann geschlossen werden.</p>
            </body>
          </html>
        `);
    }

    const { locationId } = stateData;

    // Exchange code for tokens
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://real-aidevelo-ai.onrender.com';
    const redirectUri = `${publicBaseUrl}/api/calendar/google/callback`;

    const { calendarService } = await import('../services/calendarService.js');

    // Handle mock code (for testing without OAuth configured)
    if (code === 'mock_code') {
      console.log('[CalendarRoutes] Mock code detected, skipping token exchange');
      return res.send(`
          <html>
            <body>
              <script>
                window.opener?.postMessage({ type: 'calendar-oauth-error', message: 'OAuth nicht konfiguriert. Bitte GOOGLE_OAUTH_CLIENT_ID in Render setzen.' }, '*');
                window.close();
              </script>
              <p>OAuth nicht konfiguriert. Dieses Fenster kann geschlossen werden.</p>
            </body>
          </html>
        `);
    }

    const token = await calendarService.exchangeGoogleCode(code as string, redirectUri);

    // Store token
    await calendarService.storeToken(locationId, token);

    // Update location calendar status
    await supabaseAdmin
      .from('locations')
      .update({
        calendar_status: 'connected',
        calendar_provider: 'google',
        calendar_connected_email: token.email || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId);

    console.log('[CalendarRoutes] Google Calendar connected for location:', locationId);

    // Send success message to opener
    res.send(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'calendar-oauth-success' }, '*');
              window.close();
            </script>
            <p>Kalender erfolgreich verbunden! Dieses Fenster kann geschlossen werden.</p>
          </body>
        </html>
      `);
  } catch (error: any) {
    console.error('[CalendarRoutes] OAuth callback error:', error);
    res.send(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'calendar-oauth-error', message: 'Fehler beim Verbinden: ${error.message?.replace(/'/g, "\\'")}' }, '*');
              window.close();
            </script>
            <p>Fehler: ${error.message}. Dieses Fenster kann geschlossen werden.</p>
          </body>
        </html>
      `);
  }
});

/**
 * DELETE /api/calendar/google/disconnect
 * Disconnect Google Calendar
 */
router.delete(
  '/google/disconnect',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId, email } = req.supabaseUser;

      // Get user's location
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      // Delete calendar connection
      const { error: deleteError } = await supabaseAdmin
        .from('calendar_connections')
        .delete()
        .eq('location_id', location.id)
        .eq('provider', 'google');

      if (deleteError) {
        console.error('[CalendarRoutes] Error deleting calendar connection:', deleteError);
        throw deleteError;
      }

      // Update location calendar status
      await supabaseAdmin
        .from('locations')
        .update({
          calendar_status: 'not_connected',
          calendar_provider: null,
          calendar_connected_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', location.id);

      console.log('[CalendarRoutes] Google Calendar disconnected for location:', location.id);

      res.json({ success: true, message: 'Kalender erfolgreich getrennt' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
