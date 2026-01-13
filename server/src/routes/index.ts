import express from 'express';
// Route Imports
import dbRoutes from './dbRoutes';
import debugRoutes from './debugRoutes';
import agentRoutes from './agentRoutes';
import dashboardRoutes from './dashboardRoutes';
import testRoutes from './testRoutes';
import voiceRoutes from './voiceRoutes';
import telephonyRoutes from './telephonyRoutes';
import phoneRoutes from './phoneRoutes';
import callsRoutes from './callsRoutes';
import syncRoutes from './syncRoutes';
import knowledgeRoutes from './knowledgeRoutes';
import privacyRoutes from './privacyRoutes';
import twilioRoutes from './twilioRoutes';
import freeswitchRoutes from './freeswitchRoutes';
import testCallRoutes from './testCallRoutes';
import provisionRoutes from './provisionRoutes';
import webchatRoutes from './webchatRoutes';
import channelRoutes from './channelRoutes';
import authRoutes from './authRoutes';
import enterpriseRoutes from './enterpriseRoutes';
import supportRoutes from './supportRoutes';
import webdesignRoutes from './webdesignRoutes';
import webdesignRequestRoutes from './webdesignRequestRoutes';
import testAgentsRoutes from './testAgentsRoutes';
import calendarRoutes from './calendarRoutes';
import retellRoutes from './retellRoutes';
import ragRoutes from './ragRoutes';
import analyticsRoutes from './analyticsRoutes';
import analyticsExportRoutes from './analyticsExportRoutes';
import cronRoutes from './cronRoutes';
import scheduledReportsRoutes from './scheduledReportsRoutes';
import leadRoutes from './leadRoutes';
import settingsRoutes from './settingsRoutes';
import stripeRoutes from './stripeRoutes';

import devCalendarRoutes from './devCalendarRoutes';
import devRagRoutes from './devRagRoutes';
import devTwilioRoutes from './devTwilioRoutes';

import onboardingAIAssistantRoutes from './onboardingAIAssistantRoutes';
import voiceAgentRoutes from '../voice-agent/routes/voiceAgentRoutes';
import toolWebhookRoutes from '../voice-agent/routes/toolWebhookRoutes';

// Middlewares
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * PUBLIC ROUTES (No Auth / Specific Auth)
 */
router.use('/db', dbRoutes);
router.use('/debug', debugRoutes);
router.use('/privacy', privacyRoutes);
// router.use('/twilio/voice', twilioVoiceRoutes);
router.use('/twilio', twilioRoutes); // Often handles callbacks
router.use('/freeswitch', freeswitchRoutes); // Internal
router.use('/webchat', webchatRoutes);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/retell', retellRoutes);
router.use('/cron', cronRoutes); // Secret key auth

/**
 * PROTECTED ROUTES (Require Auth or Handle internally)
 */
// Voice & Telephony
router.use('/voice', requireAuth, voiceRoutes);
router.use('/telephony', requireAuth, telephonyRoutes);
router.use('/phone', phoneRoutes); // Check internal auth inside
router.use('/calls', callsRoutes); // Check internal auth inside
router.use('/test-call', testCallRoutes);
router.use('/provision', provisionRoutes);
router.use('/sync', requireAuth, syncRoutes);

// Core Data
router.use('/agents', agentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/knowledge', requireAuth, knowledgeRoutes);
router.use('/channels', channelRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/analytics/exports', analyticsExportRoutes);
router.use('/reports/scheduled', scheduledReportsRoutes);

// Features
router.use('/tests', testRoutes);
router.use('/enterprise', enterpriseRoutes);
router.use('/support', supportRoutes);
router.use('/webdesign', webdesignRoutes);
router.use('/webdesign-requests', webdesignRequestRoutes);
router.use('/test-agents', testAgentsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/rag', ragRoutes);
router.use('/onboarding', onboardingAIAssistantRoutes);
router.use('/settings', settingsRoutes);
router.use('/stripe', stripeRoutes);

// Voice Agent & Tools
router.use('/voice-agent', voiceAgentRoutes);
router.use('/voice-agent/tools', toolWebhookRoutes);

/**
 * DEV Routes
 */
if (process.env.NODE_ENV !== 'production') {
  router.use('/dev/calendar', devCalendarRoutes);
  router.use('/dev/rag', devRagRoutes);
  router.use('/dev/twilio', devTwilioRoutes);
}

export default router;
