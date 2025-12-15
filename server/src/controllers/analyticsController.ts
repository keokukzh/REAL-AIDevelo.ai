import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { resolveLocationId } from '../utils/locationIdResolver';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, serializeError, redact } from '../utils/logger';

/**
 * GET /api/analytics/calls/summary
 * Get aggregated call statistics for a location
 */
export const getCallsSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      console.log(`[AnalyticsController] Summary: resolved locationId=${locationId} from source=${resolution.source}`);
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

    // Build query with filters
    let query = supabaseAdmin
      .from('call_logs')
      .select('*', { count: 'exact' })
      .eq('location_id', locationId);

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
    const { data: calls, error, count } = await query;

    if (error) {
      logger.error('analytics.summary.fetch_failed', error, redact({
        locationId,
      }), req);
      return next(new InternalServerError('Failed to fetch call statistics'));
    }

    const queryDuration = Date.now() - startTime;
    logger.info('analytics.summary.query_completed', redact({
      locationId,
      rows: count || 0,
      durationMs: queryDuration,
    }), req);

    if (!calls || calls.length === 0) {
      return res.json({
        success: true,
        data: {
          totals: {
            calls: 0,
            completed: 0,
            failed: 0,
            busy: 0,
            noAnswer: 0,
            ringing: 0,
            queued: 0,
          },
          avgDurationSec: 0,
          transcriptCoverageRate: 0,
          ragUsageRate: 0,
          ragAverages: {
            avgQueries: 0,
            avgResults: 0,
            avgInjectedChars: 0,
          },
          elevenCoverageRate: 0,
        },
      });
    }

    // Calculate aggregates
    const totals = {
      calls: calls.length,
      completed: calls.filter((c: any) => c.outcome === 'completed' || c.outcome === 'success').length,
      failed: calls.filter((c: any) => c.outcome === 'failed' || c.outcome === 'error').length,
      busy: calls.filter((c: any) => c.outcome === 'busy').length,
      noAnswer: calls.filter((c: any) => c.outcome === 'no-answer' || c.outcome === 'no_answer').length,
      ringing: calls.filter((c: any) => c.outcome === 'ringing').length,
      queued: calls.filter((c: any) => c.outcome === 'queued').length,
    };

    // Average duration
    const durations = calls
      .map((c: any) => c.duration_sec)
      .filter((d: any) => d !== null && d !== undefined && typeof d === 'number');
    const avgDurationSec = durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 0;

    // Transcript coverage
    const callsWithTranscript = calls.filter((c: any) => {
      const notes = c.notes_json || {};
      const transcript = notes.transcript || notes.transcription || '';
      return transcript.length > 0;
    });
    const transcriptCoverageRate = calls.length > 0 ? callsWithTranscript.length / calls.length : 0;

    // RAG usage rate
    const callsWithRag = calls.filter((c: any) => {
      const notes = c.notes_json || {};
      const rag = notes.rag || {};
      return rag.enabled === true && (rag.totalQueries || 0) > 0;
    });
    const ragUsageRate = calls.length > 0 ? callsWithRag.length / calls.length : 0;

    // RAG averages (only for calls with RAG)
    const ragQueries: number[] = [];
    const ragResults: number[] = [];
    const ragInjectedChars: number[] = [];

    calls.forEach((c: any) => {
      const notes = c.notes_json || {};
      const rag = notes.rag || {};
      if (rag.enabled === true && rag.totalQueries > 0) {
        ragQueries.push(rag.totalQueries || 0);
        ragResults.push(rag.totalResults || 0);
        ragInjectedChars.push(rag.totalInjectedChars || 0);
      }
    });

    const ragAverages = {
      avgQueries: ragQueries.length > 0 ? ragQueries.reduce((a, b) => a + b, 0) / ragQueries.length : 0,
      avgResults: ragResults.length > 0 ? ragResults.reduce((a, b) => a + b, 0) / ragResults.length : 0,
      avgInjectedChars: ragInjectedChars.length > 0 ? ragInjectedChars.reduce((a, b) => a + b, 0) / ragInjectedChars.length : 0,
    };

    // ElevenLabs coverage
    const callsWithEleven = calls.filter((c: any) => {
      const notes = c.notes_json || {};
      return notes.elevenConversationId && notes.elevenConversationId.length > 0;
    });
    const elevenCoverageRate = calls.length > 0 ? callsWithEleven.length / calls.length : 0;

    return res.json({
      success: true,
      data: {
        totals,
        avgDurationSec: Math.round(avgDurationSec * 100) / 100, // Round to 2 decimals
        transcriptCoverageRate: Math.round(transcriptCoverageRate * 10000) / 100, // Percentage with 2 decimals
        ragUsageRate: Math.round(ragUsageRate * 10000) / 100,
        ragAverages: {
          avgQueries: Math.round(ragAverages.avgQueries * 100) / 100,
          avgResults: Math.round(ragAverages.avgResults * 100) / 100,
          avgInjectedChars: Math.round(ragAverages.avgInjectedChars * 100) / 100,
        },
        elevenCoverageRate: Math.round(elevenCoverageRate * 10000) / 100,
      },
    });
  } catch (error: any) {
    logger.error('analytics.summary.error', error, redact({}), req);
    return next(new InternalServerError('Failed to calculate call statistics'));
  }
};

/**
 * GET /api/analytics/calls/top-sources
 * Get top RAG sources across all calls for a location
 */
export const getTopSources = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      logger.info('analytics.topsources.location_resolved', redact({
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
    const limit = parseInt(req.query.limit as string || '10', 10);

    // Build base query
    let query = supabaseAdmin
      .from('call_logs')
      .select('notes_json')
      .eq('location_id', locationId)
      .not('notes_json', 'is', null);

    // Date filters
    if (dateFrom) {
      query = query.gte('started_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('started_at', dateTo);
    }

    const startTime = Date.now();
    const { data: calls, error } = await query;

    if (error) {
      logger.error('analytics.topsources.fetch_failed', error, redact({
        locationId,
      }), req);
      return next(new InternalServerError('Failed to fetch call data'));
    }

    const queryDuration = Date.now() - startTime;
    logger.info('analytics.topsources.query_completed', redact({
      locationId,
      rows: calls?.length || 0,
      durationMs: queryDuration,
    }), req);

    if (!calls || calls.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
        },
      });
    }

    // Aggregate topSources from all calls
    const sourceMap = new Map<string, {
      documentId: string;
      title?: string;
      fileName?: string;
      scores: number[];
      count: number;
    }>();

    calls.forEach((call: any) => {
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

    // Convert to array and calculate averages
    const items = Array.from(sourceMap.values())
      .map((entry) => ({
        documentId: entry.documentId,
        title: entry.title,
        fileName: entry.fileName,
        count: entry.count,
        avgScore: entry.scores.length > 0
          ? Math.round((entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length) * 1000) / 1000
          : 0,
      }))
      .sort((a, b) => {
        // Sort by count descending, then by avgScore descending
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.avgScore - a.avgScore;
      })
      .slice(0, limit);

    return res.json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error: any) {
    logger.error('analytics.topsources.error', error, redact({}), req);
    return next(new InternalServerError('Failed to calculate top sources'));
  }
};
