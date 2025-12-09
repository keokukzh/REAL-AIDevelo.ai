import { jobQueue } from '../services/jobQueue';
import { syncAllAgents } from '../services/syncService';

/**
 * Register sync job handlers
 */
export function registerSyncJobs() {
  // Register handler for agent sync
  jobQueue.registerHandler('sync_agent', async (data: { agentId: string }) => {
    const { syncAgentWithElevenLabs } = await import('../services/syncService');
    return await syncAgentWithElevenLabs(data.agentId);
  });

  // Register handler for sync all agents
  jobQueue.registerHandler('sync_all_agents', async () => {
    return await syncAllAgents();
  });
}

/**
 * Schedule daily sync job
 */
export function scheduleDailySync() {
  // Run sync every 24 hours
  const interval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const runSync = () => {
    console.log('[SyncJobs] Running daily sync of all agents...');
    jobQueue.addJob('sync_all_agents', {});
  };

  // Run immediately on startup
  runSync();

  // Then schedule recurring
  setInterval(runSync, interval);
}

/**
 * Schedule periodic status checks (every hour)
 */
export function scheduleStatusChecks() {
  const interval = 60 * 60 * 1000; // 1 hour in milliseconds

  const runStatusCheck = () => {
    console.log('[SyncJobs] Running status check of all agents...');
    jobQueue.addJob('sync_all_agents', {});
  };

  // Start after 1 hour, then every hour
  setTimeout(runStatusCheck, interval);
  setInterval(runStatusCheck, interval);
}

