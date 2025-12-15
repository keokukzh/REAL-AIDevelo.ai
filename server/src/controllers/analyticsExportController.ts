import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { resolveLocationId } from '../utils/locationIdResolver';
import { supabaseAdmin } from '../services/supabaseDb';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
      console.error(`[AnalyticsExport] Error fetching calls for CSV:`, error);
      return next(new InternalServerError('Failed to fetch call data'));
    }

    const queryDuration = Date.now() - startTime;
    const rowsExported = calls?.length || 0;
    console.log(`[AnalyticsExport] CSV locationId=${locationId} rowsExported=${rowsExported} duration=${queryDuration}ms`);

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
    console.error(`[AnalyticsExport] Error in exportCallsCsv:`, error);
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
      console.log(`[AnalyticsExport] PDF: resolved locationId=${locationId} from source=${resolution.source}`);
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

    // Fetch summary data (reuse logic from analyticsController)
    let summaryQuery = supabaseAdmin
      .from('call_logs')
      .select('*', { count: 'exact' })
      .eq('location_id', locationId);

    if (dateFrom) summaryQuery = summaryQuery.gte('started_at', dateFrom);
    if (dateTo) summaryQuery = summaryQuery.lte('started_at', dateTo);
    if (direction && (direction === 'inbound' || direction === 'outbound')) {
      summaryQuery = summaryQuery.eq('direction', direction);
    }
    if (outcome) {
      summaryQuery = summaryQuery.eq('outcome', outcome);
    }

    const { data: calls, error: summaryError, count } = await summaryQuery;

    if (summaryError) {
      console.error(`[AnalyticsExport] Error fetching calls for PDF:`, summaryError);
      return next(new InternalServerError('Failed to fetch call data'));
    }

    // Calculate summary (same logic as analyticsController)
    const totals = calls ? {
      calls: calls.length,
      completed: calls.filter((c: any) => c.outcome === 'completed' || c.outcome === 'success').length,
      failed: calls.filter((c: any) => c.outcome === 'failed' || c.outcome === 'error').length,
      busy: calls.filter((c: any) => c.outcome === 'busy').length,
      noAnswer: calls.filter((c: any) => c.outcome === 'no-answer' || c.outcome === 'no_answer').length,
      ringing: calls.filter((c: any) => c.outcome === 'ringing').length,
      queued: calls.filter((c: any) => c.outcome === 'queued').length,
    } : {
      calls: 0,
      completed: 0,
      failed: 0,
      busy: 0,
      noAnswer: 0,
      ringing: 0,
      queued: 0,
    };

    const durations = calls
      ? calls.map((c: any) => c.duration_sec).filter((d: any) => d !== null && d !== undefined && typeof d === 'number')
      : [];
    const avgDurationSec = durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 0;

    const callsWithTranscript = calls
      ? calls.filter((c: any) => {
          const notes = c.notes_json || {};
          const transcript = notes.transcript || notes.transcription || '';
          return transcript.length > 0;
        })
      : [];
    const transcriptCoverageRate = totals.calls > 0 ? (callsWithTranscript.length / totals.calls) * 100 : 0;

    const callsWithRag = calls
      ? calls.filter((c: any) => {
          const notes = c.notes_json || {};
          const rag = notes.rag || {};
          return rag.enabled === true && (rag.totalQueries || 0) > 0;
        })
      : [];
    const ragUsageRate = totals.calls > 0 ? (callsWithRag.length / totals.calls) * 100 : 0;

    const callsWithEleven = calls
      ? calls.filter((c: any) => {
          const notes = c.notes_json || {};
          return notes.elevenConversationId && notes.elevenConversationId.length > 0;
        })
      : [];
    const elevenCoverageRate = totals.calls > 0 ? (callsWithEleven.length / totals.calls) * 100 : 0;

    // Fetch top sources
    let topSourcesQuery = supabaseAdmin
      .from('call_logs')
      .select('notes_json')
      .eq('location_id', locationId)
      .not('notes_json', 'is', null);

    if (dateFrom) topSourcesQuery = topSourcesQuery.gte('started_at', dateFrom);
    if (dateTo) topSourcesQuery = topSourcesQuery.lte('started_at', dateTo);

    const { data: callsForSources } = await topSourcesQuery;

    const sourceMap = new Map<string, {
      documentId: string;
      title?: string;
      fileName?: string;
      scores: number[];
      count: number;
    }>();

    if (callsForSources) {
      callsForSources.forEach((call: any) => {
        const notes = call.notes_json || {};
        const rag = notes.rag || {};
        const topSources = rag.topSources || [];

        if (Array.isArray(topSources)) {
          topSources.forEach((source: any) => {
            const docId = source.documentId || 'unknown';
            const key = docId;

            if (!sourceMap.has(key)) {
              sourceMap.set(key, {
                documentId: docId,
                title: source.title,
                fileName: source.fileName,
                scores: [],
                count: 0,
              });
            }

            const entry = sourceMap.get(key)!;
            if (source.score !== undefined && typeof source.score === 'number') {
              entry.scores.push(source.score);
            }
            entry.count += 1;
          });
        }
      });
    }

    const topSources = Array.from(sourceMap.values())
      .map((entry) => ({
        documentId: entry.documentId,
        title: entry.title,
        fileName: entry.fileName,
        count: entry.count,
        avgScore: entry.scores.length > 0
          ? entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
          : 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.avgScore - a.avgScore;
      })
      .slice(0, limitSources);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const dateFromStr = dateFrom || 'all';
    const dateToStr = dateTo || 'all';
    const filename = `analytics_report_${locationId}_${dateFromStr}_${dateToStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Location ID: ${locationId}`, { align: 'center' });
    doc.text(`Period: ${dateFromStr} to ${dateToStr}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(11);

    if (totals.calls === 0) {
      doc.text('No data available for the selected period.');
    } else {
      doc.text(`Total Calls: ${totals.calls}`);
      doc.text(`Completed: ${totals.completed} | Failed: ${totals.failed} | Busy: ${totals.busy} | No Answer: ${totals.noAnswer}`);
      doc.moveDown();
      doc.text(`Average Duration: ${Math.round(avgDurationSec)}s`);
      doc.text(`Transcript Coverage: ${transcriptCoverageRate.toFixed(1)}%`);
      doc.text(`RAG Usage Rate: ${ragUsageRate.toFixed(1)}%`);
      doc.text(`ElevenLabs Coverage: ${elevenCoverageRate.toFixed(1)}%`);
    }

    doc.moveDown(2);

    // Top Sources Section
    if (topSources.length > 0) {
      doc.fontSize(16).text('Top RAG Sources', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      // Table header
      const tableTop = doc.y;
      const colWidths = [150, 120, 100, 60, 60];
      doc.text('Title', 50, tableTop);
      doc.text('File', 200, tableTop);
      doc.text('Doc ID', 320, tableTop);
      doc.text('Count', 420, tableTop, { align: 'right' });
      doc.text('Avg Score', 480, tableTop, { align: 'right' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      topSources.forEach((source) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.text(source.title || '-', 50, doc.y, { width: colWidths[0] });
        doc.text(source.fileName || '-', 200, doc.y, { width: colWidths[1] });
        doc.text(source.documentId.substring(0, 20) + '...', 320, doc.y, { width: colWidths[2] });
        doc.text(String(source.count), 420, doc.y, { width: colWidths[3], align: 'right' });
        doc.text(source.avgScore.toFixed(3), 480, doc.y, { width: colWidths[4], align: 'right' });
        doc.moveDown(0.8);
      });
    } else {
      doc.fontSize(16).text('Top RAG Sources', { underline: true });
      doc.moveDown();
      doc.fontSize(11);
      doc.text('No RAG sources found.');
    }

    const pdfStartTime = Date.now();
    doc.end();

    // Note: Duration will be logged after PDF is fully written
    doc.on('end', () => {
      const duration = Date.now() - pdfStartTime;
      console.log(`[AnalyticsExport] PDF locationId=${locationId} duration=${duration}ms`);
    });
  } catch (error: any) {
    console.error(`[AnalyticsExport] Error in exportReportPdf:`, error);
    return next(new InternalServerError('Failed to export PDF report'));
  }
};
