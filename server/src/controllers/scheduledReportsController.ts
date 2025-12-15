import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { BadRequestError, InternalServerError, NotFoundError } from '../utils/errors';
import { resolveLocationId } from '../utils/locationIdResolver';
import { supabaseAdmin } from '../services/supabaseDb';
import { buildReportPdfBuffer } from '../services/scheduledReportService';
import { sendMail } from '../services/emailService';
import { computeNextRunAt } from '../services/scheduledReportService';
import { ReportFilters } from '../utils/pdfReportGenerator';

/**
 * GET /api/reports/scheduled
 * List scheduled reports for location
 */
export const listScheduledReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    const { data: reports, error } = await supabaseAdmin
      .from('scheduled_reports')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ScheduledReports] Error listing reports:', error);
      return next(new InternalServerError('Failed to list scheduled reports'));
    }

    return res.json({
      success: true,
      data: reports || [],
    });
  } catch (error: any) {
    console.error('[ScheduledReports] Error in listScheduledReports:', error);
    return next(new InternalServerError('Failed to list scheduled reports'));
  }
};

/**
 * POST /api/reports/scheduled
 * Create a new scheduled report
 */
export const createScheduledReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    const { frequency, timezone, recipients, filters, enabled } = req.body;

    // Validation
    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return next(new BadRequestError('frequency must be daily, weekly, or monthly'));
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return next(new BadRequestError('recipients must be a non-empty array'));
    }
    if (!recipients.every((r: any) => typeof r === 'string' && r.includes('@'))) {
      return next(new BadRequestError('All recipients must be valid email addresses'));
    }

    const now = new Date();
    const nextRunAt = computeNextRunAt(frequency, timezone || 'Europe/Zurich', now);

    const { data: report, error } = await supabaseAdmin
      .from('scheduled_reports')
      .insert({
        location_id: locationId,
        enabled: enabled !== false,
        frequency,
        timezone: timezone || 'Europe/Zurich',
        recipients,
        filters: filters || {},
        next_run_at: nextRunAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[ScheduledReports] Error creating report:', error);
      return next(new InternalServerError('Failed to create scheduled report'));
    }

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[ScheduledReports] Error in createScheduledReport:', error);
    return next(new InternalServerError('Failed to create scheduled report'));
  }
};

/**
 * PATCH /api/reports/scheduled/:id
 * Update a scheduled report
 */
export const updateScheduledReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const reportId = req.params.id;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Verify report belongs to location
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('scheduled_reports')
      .select('*')
      .eq('id', reportId)
      .eq('location_id', locationId)
      .single();

    if (fetchError || !existing) {
      return next(new NotFoundError('Scheduled report not found'));
    }

    // Build update object
    const updates: any = {};
    if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;
    if (req.body.frequency) {
      if (!['daily', 'weekly', 'monthly'].includes(req.body.frequency)) {
        return next(new BadRequestError('frequency must be daily, weekly, or monthly'));
      }
      updates.frequency = req.body.frequency;
      // Recompute next_run_at if frequency changed
      if (req.body.frequency !== existing.frequency) {
        const now = new Date();
        updates.next_run_at = computeNextRunAt(req.body.frequency, existing.timezone, now).toISOString();
      }
    }
    if (req.body.timezone) updates.timezone = req.body.timezone;
    if (req.body.recipients) {
      if (!Array.isArray(req.body.recipients) || req.body.recipients.length === 0) {
        return next(new BadRequestError('recipients must be a non-empty array'));
      }
      if (!req.body.recipients.every((r: any) => typeof r === 'string' && r.includes('@'))) {
        return next(new BadRequestError('All recipients must be valid email addresses'));
      }
      updates.recipients = req.body.recipients;
    }
    if (req.body.filters !== undefined) updates.filters = req.body.filters;

    const { data: report, error } = await supabaseAdmin
      .from('scheduled_reports')
      .update(updates)
      .eq('id', reportId)
      .eq('location_id', locationId)
      .select()
      .single();

    if (error) {
      console.error('[ScheduledReports] Error updating report:', error);
      return next(new InternalServerError('Failed to update scheduled report'));
    }

    return res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[ScheduledReports] Error in updateScheduledReport:', error);
    return next(new InternalServerError('Failed to update scheduled report'));
  }
};

/**
 * DELETE /api/reports/scheduled/:id
 * Delete a scheduled report
 */
export const deleteScheduledReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const reportId = req.params.id;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Verify report belongs to location
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('scheduled_reports')
      .select('id')
      .eq('id', reportId)
      .eq('location_id', locationId)
      .single();

    if (fetchError || !existing) {
      return next(new NotFoundError('Scheduled report not found'));
    }

    const { error } = await supabaseAdmin
      .from('scheduled_reports')
      .delete()
      .eq('id', reportId)
      .eq('location_id', locationId);

    if (error) {
      console.error('[ScheduledReports] Error deleting report:', error);
      return next(new InternalServerError('Failed to delete scheduled report'));
    }

    return res.json({
      success: true,
      message: 'Scheduled report deleted',
    });
  } catch (error: any) {
    console.error('[ScheduledReports] Error in deleteScheduledReport:', error);
    return next(new InternalServerError('Failed to delete scheduled report'));
  }
};

/**
 * POST /api/reports/scheduled/:id/test
 * Send a test report immediately (rate-limited)
 */
export const testScheduledReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const reportId = req.params.id;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Fetch report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from('scheduled_reports')
      .select('*')
      .eq('id', reportId)
      .eq('location_id', locationId)
      .single();

    if (fetchError || !report) {
      return next(new NotFoundError('Scheduled report not found'));
    }

    // Generate PDF
    const pdfBuffer = await buildReportPdfBuffer(locationId, report.filters as ReportFilters);

    // Determine date range
    const dateTo = (report.filters as any)?.dateTo || new Date().toISOString().split('T')[0];
    const dateFrom = (report.filters as any)?.dateTo || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    })();

    const subject = `Test Analytics Report - ${dateFrom} to ${dateTo}`;
    const text = `This is a test analytics report.\n\nPeriod: ${dateFrom} to ${dateTo}\nLocation ID: ${locationId}`;

    // Send email
    const emailResult = await sendMail({
      to: report.recipients,
      subject,
      text,
      attachments: [{
        filename: `analytics_report_test_${locationId}_${dateFrom}_${dateTo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    if (!emailResult.success) {
      return next(new InternalServerError(`Failed to send test email: ${emailResult.error}`));
    }

    return res.json({
      success: true,
      message: 'Test report sent successfully',
    });
  } catch (error: any) {
    console.error('[ScheduledReports] Error in testScheduledReport:', error);
    return next(new InternalServerError('Failed to send test report'));
  }
};
