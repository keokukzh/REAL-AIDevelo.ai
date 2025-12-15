import { Router, Request, Response, NextFunction } from 'express';
import { runDueReports } from '../services/scheduledReportService';

const router = Router();

const ENABLE_SCHEDULED_REPORTS = process.env.ENABLE_SCHEDULED_REPORTS === 'true';
const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * POST /api/cron/reports/run
 * Cron endpoint to trigger scheduled report runs
 * Protected by x-cron-secret header (no JWT auth)
 */
router.post('/reports/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Feature flag check
    if (!ENABLE_SCHEDULED_REPORTS) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled reports disabled',
        message: 'Scheduled reports are disabled (ENABLE_SCHEDULED_REPORTS=false)',
      });
    }

    // Secret check
    const providedSecret = req.headers['x-cron-secret'] as string | undefined;
    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      console.warn('[CronRoutes] Invalid or missing cron secret');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing x-cron-secret header',
      });
    }

    // Parse optional limit
    const limit = parseInt(req.body?.limit as string || '10', 10);

    // Run due reports
    const result = await runDueReports(limit);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[CronRoutes] Error running scheduled reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to run scheduled reports',
    });
  }
});

export default router;
