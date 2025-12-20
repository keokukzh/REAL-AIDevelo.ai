/**
 * Tool Webhook Routes for ElevenLabs Conversational AI
 * 
 * These routes handle tool calls from ElevenLabs agents (calendar booking, etc.)
 * Protected by ElevenLabs webhook signature verification
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyElevenLabsWebhook } from '../../middleware/verifyElevenLabsWebhook';
import { resolveLocationId } from '../../utils/locationIdResolver';
import { createToolRegistry } from '../tools/toolRegistry';
import { BadRequestError, InternalServerError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/voice-agent/tools/calendar
 * 
 * Handles calendar tool calls from ElevenLabs agent:
 * - check_availability: Check available time slots
 * - create_appointment: Create calendar event
 * 
 * Expected request body from ElevenLabs:
 * {
 *   "tool_name": "calendar",
 *   "arguments": {
 *     "action": "check_availability" | "create_appointment",
 *     ... (other calendar-specific args)
 *   },
 *   "call_sid": "CA...", // Twilio Call SID (if available)
 *   "from_number": "+41...", // Caller phone number (if available)
 *   "to_number": "+41...", // Called number (if available)
 * }
 */
router.post('/calendar', verifyElevenLabsWebhook, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tool_name, arguments: toolArgs, call_sid, from_number, to_number } = req.body;

    if (tool_name !== 'calendar') {
      return next(new BadRequestError(`Unknown tool: ${tool_name}. Expected: calendar`));
    }

    if (!toolArgs || typeof toolArgs !== 'object') {
      return next(new BadRequestError('Missing or invalid arguments'));
    }

    const { action } = toolArgs;
    if (!action || (action !== 'check_availability' && action !== 'create_appointment')) {
      return next(new BadRequestError(`Invalid action: ${action}. Expected: check_availability or create_appointment`));
    }

    // Resolve locationId from call context
    // Priority: call_sid -> phone_number -> fail
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        callSid: call_sid,
        phoneNumber: from_number || to_number,
      });
      locationId = resolution.locationId;
      logger.info('tool_webhook.location_resolved', {
        locationId,
        source: resolution.source,
        callSid: call_sid || 'none',
        from: from_number || 'none',
        to: to_number || 'none',
      });
    } catch (error: any) {
      logger.error('tool_webhook.location_resolution_failed', error, {
        callSid: call_sid || 'none',
        from: from_number || 'none',
        to: to_number || 'none',
      });
      return next(new BadRequestError(`Unable to resolve locationId: ${error.message}`));
    }

    // Create tool registry for this location
    const toolRegistry = createToolRegistry(locationId);

    // Execute calendar tool
    try {
      const result = await toolRegistry.execute({
        name: 'calendar',
        arguments: toolArgs,
      });

      logger.info('tool_webhook.calendar_success', {
        action,
        locationId,
        callSid: call_sid || 'none',
        hasResult: !!result,
      });

      res.json({
        success: true,
        tool_name: 'calendar',
        action,
        result,
      });
    } catch (toolError: any) {
      logger.error('tool_webhook.calendar_execution_failed', toolError, {
        action,
        locationId,
        callSid: call_sid || 'none',
        toolArgs: JSON.stringify(toolArgs).substring(0, 200),
      });

      // Return error in a format ElevenLabs expects
      res.status(400).json({
        success: false,
        tool_name: 'calendar',
        action,
        error: toolError.message || 'Tool execution failed',
      });
    }
  } catch (error: any) {
    logger.error('tool_webhook.calendar_route_error', error, {
      body: JSON.stringify(req.body).substring(0, 500),
    });
    next(new InternalServerError(`Tool webhook error: ${error.message}`));
  }
});

/**
 * POST /api/voice-agent/tools/*
 * Generic tool webhook handler (for future tools)
 */
router.post('/*', verifyElevenLabsWebhook, async (req: Request, res: Response, next: NextFunction) => {
  const toolName = req.path.replace('/', '');
  
  logger.warn('tool_webhook.unknown_tool', {
    toolName,
    body: JSON.stringify(req.body).substring(0, 200),
    error: `Unknown tool requested: ${toolName}`,
  }, req);

  res.status(404).json({
    success: false,
    error: `Unknown tool: ${toolName}`,
  });
});

export default router;
