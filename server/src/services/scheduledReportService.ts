import { supabaseAdmin } from './supabaseDb';
import { generateReportPdfBuffer, ReportFilters } from '../utils/pdfReportGenerator';
import { sendMail } from './emailService';
import { logger, serializeError, redact } from '../utils/logger';

const ENABLE_SCHEDULED_REPORTS = process.env.ENABLE_SCHEDULED_REPORTS === 'true'; // Default false

export interface ScheduledReport {
  id: string;
  location_id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  recipients: string[];
  filters: ReportFilters;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Compute next run time based on frequency and timezone
 */
export function computeNextRunAt(
  frequency: 'daily' | 'weekly' | 'monthly',
  timezone: string,
  now: Date = new Date()
): Date {
  // Simple implementation: use UTC for now, timezone support can be enhanced later
  const next = new Date(now);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(8, 0, 0, 0); // 8 AM
      break;
    case 'weekly':
      // Next Monday at 8 AM
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      next.setHours(8, 0, 0, 0);
      break;
    case 'monthly':
      // First day of next month at 8 AM
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(8, 0, 0, 0);
      break;
  }

  return next;
}

/**
 * Run all due scheduled reports
 */
export async function runDueReports(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (!ENABLE_SCHEDULED_REPORTS) {
    console.warn('[ScheduledReports] Scheduled reports disabled (ENABLE_SCHEDULED_REPORTS=false)');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const startTime = Date.now();
  const now = new Date();

  // Fetch enabled reports where next_run_at <= now
  const { data: dueReports, error } = await supabaseAdmin
    .from('scheduled_reports')
    .select('*')
    .eq('enabled', true)
    .lte('next_run_at', now.toISOString())
    .order('next_run_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('reports.scheduled.fetch_failed', error, redact({}));
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (!dueReports || dueReports.length === 0) {
    logger.info('reports.scheduled.none_due', redact({}));
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const report of dueReports) {
    try {
      await runSingleReport(report as ScheduledReport);
      succeeded++;
    } catch (error: any) {
      logger.error('reports.scheduled.run_failed', error, redact({
        reportId: report.id,
        locationId: report.location_id,
      }));
      failed++;
    }
  }

  const duration = Date.now() - startTime;
  logger.info('reports.scheduled.completed', redact({
    processed: dueReports.length,
    succeeded,
    failed,
    durationMs: duration,
  }));

  return {
    processed: dueReports.length,
    succeeded,
    failed,
  };
}

/**
 * Run a single scheduled report
 */
async function runSingleReport(report: ScheduledReport): Promise<void> {
  const now = new Date();

  // Generate PDF
  const pdfBuffer = await generateReportPdfBuffer(report.location_id, report.filters);

  // Determine date range from filters or use default (last 7 days)
  const dateTo = report.filters.dateTo || new Date().toISOString().split('T')[0];
  const dateFrom = report.filters.dateFrom || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  const frequencyLabel = report.frequency === 'daily' ? 'Daily' : report.frequency === 'weekly' ? 'Weekly' : 'Monthly';
  const subject = `${frequencyLabel} Analytics Report - ${dateFrom} to ${dateTo}`;
  const text = `Your ${frequencyLabel.toLowerCase()} analytics report is attached.\n\nPeriod: ${dateFrom} to ${dateTo}\nLocation ID: ${report.location_id}`;

  // Send email
  const emailResult = await sendMail({
    to: report.recipients,
    subject,
    text,
    attachments: [{
      filename: `analytics_report_${report.location_id}_${dateFrom}_${dateTo}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });

  if (!emailResult.success) {
    throw new Error(`Failed to send email: ${emailResult.error}`);
  }

  // Update last_run_at and next_run_at
  const nextRunAt = computeNextRunAt(report.frequency, report.timezone, now);

  const { error: updateError } = await supabaseAdmin
    .from('scheduled_reports')
    .update({
      last_run_at: now.toISOString(),
      next_run_at: nextRunAt.toISOString(),
    })
    .eq('id', report.id);

  if (updateError) {
    logger.error('reports.scheduled.update_failed', updateError, redact({
      reportId: report.id,
      locationId: report.location_id,
    }));
    // Don't throw - email was sent successfully
  }
}

/**
 * Build report PDF buffer (for test endpoint)
 */
export async function buildReportPdfBuffer(
  locationId: string,
  filters: ReportFilters
): Promise<Buffer> {
  return generateReportPdfBuffer(locationId, filters);
}
