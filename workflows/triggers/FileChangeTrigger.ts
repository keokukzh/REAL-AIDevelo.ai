import { watch, FSWatcher } from 'chokidar';
import { WorkflowOrchestrator } from '../engine/WorkflowOrchestrator.js';
import { ExecutionStore } from '../monitoring/ExecutionStore.js';
import { WorkflowMonitor } from '../monitoring/WorkflowMonitor.js';
import { AlertManager } from '../monitoring/AlertManager.js';
import { Workflow } from '../types.js';
import path from 'path';

/**
 * File change trigger for executing workflows when files change
 */
export class FileChangeTrigger {
  private watchers: Map<string, FSWatcher>;
  private orchestrator: WorkflowOrchestrator;
  private executionStore: ExecutionStore;
  private monitor: WorkflowMonitor;
  private alertManager: AlertManager;
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private debounceDelay: number;

  constructor(
    debounceDelay: number = 1000,
    executionStore?: ExecutionStore,
    monitor?: WorkflowMonitor,
    alertManager?: AlertManager
  ) {
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.debounceDelay = debounceDelay;
    this.executionStore = executionStore || new ExecutionStore();
    this.monitor = monitor || new WorkflowMonitor(this.executionStore);
    this.alertManager = alertManager || new AlertManager(this.monitor);
    
    const logger = (message: string, level?: 'info' | 'warn' | 'error') => {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} ${message}`);
    };
    
    this.orchestrator = new WorkflowOrchestrator(logger, this.executionStore);
  }

  /**
   * Watch file patterns and execute workflow on changes
   */
  async watchFiles(
    patterns: string[],
    workflowPath: string,
    workflowName?: string
  ): Promise<void> {
    const watchKey = workflowPath;
    
    // Stop existing watcher if any
    if (this.watchers.has(watchKey)) {
      await this.stopWatching(watchKey);
    }

    console.log(`[FileChange] Watching patterns: ${patterns.join(', ')}`);
    console.log(`[FileChange] Workflow: ${workflowPath}`);

    const watcher = watch(patterns, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't trigger on initial scan
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    watcher.on('all', async (event: string, filePath: string) => {
      // Debounce rapid file changes
      const timerKey = `${watchKey}:${filePath}`;
      
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(timerKey);
        await this.executeWorkflow(workflowPath, filePath, event);
      }, this.debounceDelay);

      this.debounceTimers.set(timerKey, timer);
    });

    watcher.on('error', (error: Error) => {
      console.error(`[FileChange] Watcher error: ${error.message}`);
    });

    this.watchers.set(watchKey, watcher);
  }

  /**
   * Execute workflow when file changes
   */
  private async executeWorkflow(
    workflowPath: string,
    changedFile: string,
    event: string
  ): Promise<void> {
    try {
      console.log(`[FileChange] File changed: ${changedFile} (${event})`);
      console.log(`[FileChange] Executing workflow: ${workflowPath}`);

      const workflow = await this.orchestrator.loadWorkflow(workflowPath);
      
      // Add file change info to environment
      const fileChangeEnv: Record<string, string> = {
        CHANGED_FILE: changedFile,
        FILE_EVENT: event,
        FILE_NAME: path.basename(changedFile),
        FILE_DIR: path.dirname(changedFile),
        FILE_EXT: path.extname(changedFile)
      };

      const environment = { ...workflow.environment, ...fileChangeEnv };
      const execution = await this.orchestrator.execute(workflow);
      
      // Save execution
      await this.executionStore.saveExecution(execution);
      this.monitor.recordExecution(execution);
      await this.alertManager.checkAlerts(execution, workflow);

      console.log(`[FileChange] Workflow completed: ${execution.status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[FileChange] Workflow execution failed: ${errorMessage}`);
    }
  }

  /**
   * Stop watching a specific workflow
   */
  async stopWatching(workflowPath: string): Promise<void> {
    const watcher = this.watchers.get(workflowPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(workflowPath);
      console.log(`[FileChange] Stopped watching: ${workflowPath}`);
    }

    // Clear debounce timers for this workflow
    for (const [key, timer] of this.debounceTimers.entries()) {
      if (key.startsWith(workflowPath)) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
    }
  }

  /**
   * Stop all watchers
   */
  async stopAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [workflowPath, watcher] of this.watchers.entries()) {
      promises.push(watcher.close());
    }
    
    await Promise.all(promises);
    this.watchers.clear();

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    console.log('[FileChange] Stopped all watchers');
  }

  /**
   * Get active watchers
   */
  getActiveWatchers(): string[] {
    return Array.from(this.watchers.keys());
  }
}
