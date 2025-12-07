import { WorkflowExecution, WorkflowMetrics } from '../types.js';
import { ExecutionStore } from './ExecutionStore.js';

/**
 * Monitor workflow executions and collect metrics
 */
export class WorkflowMonitor {
  private metrics: WorkflowMetrics;
  private executionStore: ExecutionStore;

  constructor(executionStore: ExecutionStore) {
    this.executionStore = executionStore;
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageDuration: 0,
      taskMetrics: new Map()
    };
  }

  /**
   * Record a workflow execution
   */
  recordExecution(execution: WorkflowExecution): void {
    this.metrics.totalRuns++;
    
    if (execution.status === 'completed') {
      this.metrics.successfulRuns++;
    } else if (execution.status === 'failed') {
      this.metrics.failedRuns++;
    }

    // Update average duration
    if (execution.duration) {
      const totalDuration = this.metrics.averageDuration * (this.metrics.totalRuns - 1) + execution.duration;
      this.metrics.averageDuration = totalDuration / this.metrics.totalRuns;
    }

    // Record task metrics
    for (const [taskId, task] of Object.entries(execution.tasks)) {
      if (!this.metrics.taskMetrics.has(taskId)) {
        this.metrics.taskMetrics.set(taskId, {
          runs: 0,
          failures: 0,
          averageDuration: 0
        });
      }

      const taskMetrics = this.metrics.taskMetrics.get(taskId)!;
      taskMetrics.runs++;
      
      if (task.status === 'failed') {
        taskMetrics.failures++;
      }

      if (task.duration) {
        const taskTotalDuration = taskMetrics.averageDuration * (taskMetrics.runs - 1) + task.duration;
        taskMetrics.averageDuration = taskTotalDuration / taskMetrics.runs;
      }
    }
  }

  /**
   * Get health report
   */
  getHealthReport(): {
    overall: {
      successRate: string;
      totalRuns: number;
      averageDuration: string;
    };
    tasks: Array<{
      taskId: string;
      runs: number;
      failureRate: string;
      averageDuration: string;
    }>;
  } {
    const successRate = this.metrics.totalRuns > 0
      ? ((this.metrics.successfulRuns / this.metrics.totalRuns) * 100).toFixed(2)
      : '0.00';
    
    const taskReports = Array.from(this.metrics.taskMetrics.entries()).map(([taskId, metrics]) => ({
      taskId,
      runs: metrics.runs,
      failureRate: metrics.runs > 0
        ? ((metrics.failures / metrics.runs) * 100).toFixed(2)
        : '0.00',
      averageDuration: (metrics.averageDuration / 1000).toFixed(2) + 's'
    }));

    return {
      overall: {
        successRate: successRate + '%',
        totalRuns: this.metrics.totalRuns,
        averageDuration: (this.metrics.averageDuration / 1000).toFixed(2) + 's'
      },
      tasks: taskReports
    };
  }

  /**
   * Get metrics for a specific workflow
   */
  async getWorkflowMetrics(workflowName: string): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageDuration: number;
    recentExecutions: WorkflowExecution[];
  }> {
    const executions = await this.executionStore.getExecutionsByWorkflow(workflowName);
    
    const totalRuns = executions.length;
    const successfulRuns = executions.filter(e => e.status === 'completed').length;
    const failedRuns = executions.filter(e => e.status === 'failed').length;
    
    const durations = executions
      .filter(e => e.duration)
      .map(e => e.duration!);
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      averageDuration,
      recentExecutions: executions.slice(0, 10)
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): WorkflowMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageDuration: 0,
      taskMetrics: new Map()
    };
  }

  /**
   * Load metrics from stored executions
   */
  async loadMetricsFromHistory(): Promise<void> {
    const executions = await this.executionStore.getAllExecutions();
    
    // Reset and rebuild metrics
    this.resetMetrics();
    
    executions.forEach(execution => {
      this.recordExecution(execution);
    });
  }
}

