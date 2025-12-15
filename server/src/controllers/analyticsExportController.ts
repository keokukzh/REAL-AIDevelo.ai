import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { resolveLocationId } from '../utils/locationIdResolver';
import { supabaseAdmin } from '../services/supabaseDb';
import { generateReportPdfStream } from '../utils/pdfReportGenerator';
import { logger, serializeError, redact } from '../utils/logger';

const ENABLE_ANALYTICS_EXPORT = process.env.ENABLE_ANALYTICS_EXPORT !== 'false'; // Default true

/**
 * Escape CSV field value
 */
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/analytics/exports/calls.csv
 * Export calls as CSV
 */
export const exportCallsCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!ENABLE_ANALYTICS_EXPORT) {
      return res.status(404).json({
        success: false,
        error: 'Export disabled',
        message: 'Analytics export is disabled',
      });
    }

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
      console.log(`[AnalyticsExport] CSV: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Parse query parameters
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const direction = req.query.direction as string | undefined;
    const outcome = req.query.outcome as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '5000', 10), 10000); // Max 10000

    // Build query
    let query = supabaseAdmin
      .from('call_logs')
      .select('call_sid, direction, outcome, started_at, ended_at, duration_sec, from_e164, to_e164, notes_json')
      .eq('location_id', locationId)
      .limit(limit);

    // Date filters
    if (dateFrom) {
      query = query.gte('started_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('started_at', dateTo);
    }

    // Direction filter
    if (direction && (direction === 'inbound' || direction === 'outbound')) {
      query = query.eq('direction', direction);
    }

    // Outcome filter
    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    const startTime = Date.now();
    const { data: calls, error } = await query;

    if (error) {
      logger.error('analytics.export.csv.fetch_failed', error, redact({
        locationId,
      }), req);
      return next(new InternalServerError('Failed to fetch call data'));
    }

    const queryDuration = Date.now() - startTime;
    const rowsExported = calls?.length || 0;
    logger.info('analytics.export.csv.completed', redact({
      locationId,
      rowsExported,
      durationMs: queryDuration,
    }), req);

    // Generate filename
    const dateFromStr = dateFrom || 'all';
    const dateToStr = dateTo || 'all';
    const filename = `calls_${locationId}_${dateFromStr}_${dateToStr}.csv`;

    // Set headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // CSV Header
    const headers = [
      'callSid',
      'direction',
      'outcome',
      'startedAt',
      'endedAt',
      'durationSec',
      'from',
      'to',
      'transcriptLen',
      'ragEnabled',
      'ragTotalQueries',
      'ragTotalResults',
      'ragTotalInjectedChars',
      'elevenConversationId',
    ];
    res.write(headers.map(escapeCsvField).join(',') + '\n');

    // CSV Rows
    if (calls && calls.length > 0) {
      for (const call of calls) {
        const notes = call.notes_json || {};
        const transcript = notes.transcript || notes.transcription || '';
        const rag = notes.rag || {};
        const elevenConversationId = notes.elevenConversationId || '';

        const row = [
          call.call_sid || '',
          call.direction || '',
          call.outcome || '',
          call.started_at || '',
          call.ended_at || '',
          call.duration_sec || '',
          call.from_e164 || '',
          call.to_e164 || '',
          transcript.length,
          rag.enabled === true ? 'true' : 'false',
          rag.totalQueries || 0,
          rag.totalResults || 0,
          rag.totalInjectedChars || 0,
          elevenConversationId,
        ];
        res.write(row.map(escapeCsvField).join(',') + '\n');
      }
    }

    res.end();
  } catch (error: any) {
    logger.error('analytics.export.csv.error', error, redact({}), req);
    return next(new InternalServerError('Failed to export calls CSV'));
  }
};

/**
 * GET /api/analytics/exports/report.pdf
 * Export analytics report as PDF
 */
export const exportReportPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!ENABLE_ANALYTICS_EXPORT) {
      return res.status(404).json({
        success: false,
        error: 'Export disabled',
        message: 'Analytics export is disabled',
      });
    }

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
      logger.info('analytics.export.pdf.location_resolved', redact({
        locationId,
        source: resolution.source,
      }), req);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Parse query parameters
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const direction = req.query.direction as string | undefined;
    const outcome = req.query.outcome as string | undefined;
    const limitSources = parseInt(req.query.limitSources as string || '10', 10);

    const filters = {
      dateFrom,
      dateTo,
      direction: direction as 'inbound' | 'outbound' | undefined,
      outcome,
      limitSources,
    };

    const dateFromStr = dateFrom || 'all';
    const dateToStr = dateTo || 'all';
    const filename = `analytics_report_${locationId}_${dateFromStr}_${dateToStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const pdfStartTime = Date.now();
    await generateReportPdfStream(locationId, filters, res);
    const duration = Date.now() - pdfStartTime;
    logger.info('analytics.export.pdf.completed', redact({
      locationId,
      durationMs: duration,
    }), req);
  } catch (error: any) {
    logger.error('analytics.export.pdf.error', error, redact({}), req);
    return next(new InternalServerError('Failed to export PDF report'));
  }
};
