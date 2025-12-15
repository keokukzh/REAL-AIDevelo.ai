import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { supabaseAdmin } from '../services/supabaseDb';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  direction?: 'inbound' | 'outbound';
  outcome?: string;
  limitSources?: number;
}

export interface ReportSummary {
  totals: {
    calls: number;
    completed: number;
    failed: number;
    busy: number;
    noAnswer: number;
    ringing: number;
    queued: number;
  };
  avgDurationSec: number;
  transcriptCoverageRate: number;
  ragUsageRate: number;
  elevenCoverageRate: number;
}

export interface TopSource {
  documentId: string;
  title?: string;
  fileName?: string;
  count: number;
  avgScore: number;
}

/**
 * Fetch and calculate report summary data
 */
export async function fetchReportSummary(
  locationId: string,
  filters: ReportFilters
): Promise<ReportSummary> {
  let summaryQuery = supabaseAdmin
    .from('call_logs')
    .select('*', { count: 'exact' })
    .eq('location_id', locationId);

  if (filters.dateFrom) summaryQuery = summaryQuery.gte('started_at', filters.dateFrom);
  if (filters.dateTo) summaryQuery = summaryQuery.lte('started_at', filters.dateTo);
  if (filters.direction && (filters.direction === 'inbound' || filters.direction === 'outbound')) {
    summaryQuery = summaryQuery.eq('direction', filters.direction);
  }
  if (filters.outcome) {
    summaryQuery = summaryQuery.eq('outcome', filters.outcome);
  }

  const { data: calls, error: summaryError } = await summaryQuery;

  if (summaryError) {
    throw new Error(`Failed to fetch calls: ${summaryError.message}`);
  }

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

  return {
    totals,
    avgDurationSec,
    transcriptCoverageRate,
    ragUsageRate,
    elevenCoverageRate,
  };
}

/**
 * Fetch top RAG sources
 */
export async function fetchTopSources(
  locationId: string,
  filters: ReportFilters
): Promise<TopSource[]> {
  let topSourcesQuery = supabaseAdmin
    .from('call_logs')
    .select('notes_json')
    .eq('location_id', locationId)
    .not('notes_json', 'is', null);

  if (filters.dateFrom) topSourcesQuery = topSourcesQuery.gte('started_at', filters.dateFrom);
  if (filters.dateTo) topSourcesQuery = topSourcesQuery.lte('started_at', filters.dateTo);

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

  const limitSources = filters.limitSources || 10;
  return Array.from(sourceMap.values())
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
}

/**
 * Generate PDF report as Buffer (for email attachments)
 */
export async function generateReportPdfBuffer(
  locationId: string,
  filters: ReportFilters
): Promise<Buffer> {
  const [summary, topSources] = await Promise.all([
    fetchReportSummary(locationId, filters),
    fetchTopSources(locationId, filters),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const dateFromStr = filters.dateFrom || 'all';
    const dateToStr = filters.dateTo || 'all';

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

    if (summary.totals.calls === 0) {
      doc.text('No data available for the selected period.');
    } else {
      doc.text(`Total Calls: ${summary.totals.calls}`);
      doc.text(`Completed: ${summary.totals.completed} | Failed: ${summary.totals.failed} | Busy: ${summary.totals.busy} | No Answer: ${summary.totals.noAnswer}`);
      doc.moveDown();
      doc.text(`Average Duration: ${Math.round(summary.avgDurationSec)}s`);
      doc.text(`Transcript Coverage: ${summary.transcriptCoverageRate.toFixed(1)}%`);
      doc.text(`RAG Usage Rate: ${summary.ragUsageRate.toFixed(1)}%`);
      doc.text(`ElevenLabs Coverage: ${summary.elevenCoverageRate.toFixed(1)}%`);
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

    doc.end();
  });
}

/**
 * Generate PDF report and pipe to response stream (for HTTP downloads)
 */
export async function generateReportPdfStream(
  locationId: string,
  filters: ReportFilters,
  res: NodeJS.WritableStream
): Promise<void> {
  const [summary, topSources] = await Promise.all([
    fetchReportSummary(locationId, filters),
    fetchTopSources(locationId, filters),
  ]);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  const dateFromStr = filters.dateFrom || 'all';
  const dateToStr = filters.dateTo || 'all';

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

  if (summary.totals.calls === 0) {
    doc.text('No data available for the selected period.');
  } else {
    doc.text(`Total Calls: ${summary.totals.calls}`);
    doc.text(`Completed: ${summary.totals.completed} | Failed: ${summary.totals.failed} | Busy: ${summary.totals.busy} | No Answer: ${summary.totals.noAnswer}`);
    doc.moveDown();
    doc.text(`Average Duration: ${Math.round(summary.avgDurationSec)}s`);
    doc.text(`Transcript Coverage: ${summary.transcriptCoverageRate.toFixed(1)}%`);
    doc.text(`RAG Usage Rate: ${summary.ragUsageRate.toFixed(1)}%`);
    doc.text(`ElevenLabs Coverage: ${summary.elevenCoverageRate.toFixed(1)}%`);
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

  doc.end();
}
