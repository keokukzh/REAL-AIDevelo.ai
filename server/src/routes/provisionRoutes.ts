/**
 * Provisioning Routes
 * Handles agent provisioning for new tenants
 */

import { Router, Request, Response } from 'express';
import { provisioningService } from '../services/provisioningService';
import { logger, redact } from '../utils/logger';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

/**
 * POST /api/provision/activate
 * Manually trigger provisioning for a location
 */
router.post('/activate', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { location_id, template_slug } = req.body;

    if (!location_id) {
      return res.status(400).json({ error: 'location_id required' });
    }

    const result = await provisioningService.provisionDefaultAgent(
      location_id,
      template_slug || 'default-de-ch'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message || 'Provisioning failed',
      });
    }

    logger.info('provision.activated', redact({ location_id, agent_id: result.agentId }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('provision.activate_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/provision/status/:locationId
 * Check provisioning status for a location
 */
router.get('/status/:locationId', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    const status = await provisioningService.getProvisioningStatus(locationId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('provision.status_error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

