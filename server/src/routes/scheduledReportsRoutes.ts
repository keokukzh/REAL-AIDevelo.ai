import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import {
  listScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  testScheduledReport,
} from '../controllers/scheduledReportsController';

const router = Router();

router.get('/', verifySupabaseAuth, listScheduledReports);
router.post('/', verifySupabaseAuth, createScheduledReport);
router.patch('/:id', verifySupabaseAuth, updateScheduledReport);
router.delete('/:id', verifySupabaseAuth, deleteScheduledReport);
router.post('/:id/test', verifySupabaseAuth, testScheduledReport);

export default router;
