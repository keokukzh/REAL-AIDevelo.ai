import { Request, Response, NextFunction } from 'express';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { AgentService } from '../services/agentService';

/**
 * Trigger an Automated Test Suite for an Agent
 * This endpoint validates the agent exists and returns test configuration.
 * Actual testing is done via the frontend using VoiceAgentStreamingUI with ElevenLabs.
 */
export const runAutomatedTest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { agentId } = req.params;
        
        // Verify agent config exists in Supabase
        const agentConfig = await AgentService.verifyAgentExists(agentId);

        // Return test configuration for frontend
        // The frontend will use VoiceAgentStreamingUI to actually run the test
        const results = {
            agentId: agentConfig.id,
            locationId: agentConfig.location_id,
            elevenAgentId: agentConfig.eleven_agent_id,
            timestamp: new Date().toISOString(),
            testAvailable: !!agentConfig.eleven_agent_id,
            message: agentConfig.eleven_agent_id 
                ? 'Agent is ready for testing via VoiceAgentStreamingUI'
                : 'Agent requires ElevenLabs Agent ID configuration before testing',
            // Test cases that can be validated
            testCases: [
                { case: "Greeting", description: "Agent responds to greeting" },
                { case: "Opening Hours Inquiry", description: "Agent provides business hours" },
                { case: "Appointment Booking flow", description: "Agent handles appointment requests" }
            ]
        };

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return next(error);
        }
        console.error('[TestController] Error running automated test:', error);
        next(new InternalServerError('Failed to run automated test'));
    }
};
