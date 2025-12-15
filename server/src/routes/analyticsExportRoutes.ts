import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { exportCallsCsv, exportReportPdf } from '../controllers/analyticsExportController';

const router = Router();

/**
 * GET /api/analytics/exports/calls.csv
 * Export calls as CSV
 */
router.get('/calls.csv', verifySupabaseAuth, exportCallsCsv);

/**
 * GET /api/analytics/exports/report.pdf
 * Export analytics report as PDF
 */
router.get('/report.pdf', verifySupabaseAuth, exportReportPdf);

export default router;
