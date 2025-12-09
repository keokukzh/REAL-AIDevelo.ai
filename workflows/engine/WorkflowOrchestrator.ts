import { Workflow, WorkflowExecution, TaskExecution } from '../types.js';
import { DependencyGraph } from './DependencyGraph.js';
import { TaskExecutor } from './TaskExecutor.js';
import { WorkflowValidator } from './WorkflowValidator.js';
import type { ExecutionStoreAdapter } from '../monitoring/ExecutionStore.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main workflow orchestration engine
 */
export class WorkflowOrchestrator {
  private logger: (message: string, level?: 'info' | 'warn' | 'error') => void;
  private executionStore?: ExecutionStoreAdapter;

  constructor(
    logger?: (message: string, level?: 'info' | 'warn' | 'error') => void,
    executionStore?: ExecutionStoreAdapter
  ) {
    this.logger = logger || ((msg, level = 'info') => {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} ${msg}`);
    });
    this.executionStore = executionStore;
  }

  /**
   * Load and validate workflow from file or object
   */
  async loadWorkflow(workflowPathOrObject: string | Workflow): Promise<Workflow> {
    let workflow: Workflow;

    if (typeof workflowPathOrObject === 'string') {
      // Load from file
      const fs = await import('fs/promises');
      const content = await fs.readFile(workflowPathOrObject, 'utf-8');
      workflow = JSON.parse(content) as Workflow;
    } else {
      workflow = workflowPathOrObject;
    }

    return workflow;
  }

  /**
   * Validate workflow schema
   */
  validateWorkflow(workflow: Workflow): void {
    const validation = WorkflowValidator.validate(workflow);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed:\n${validation.errors.join('\n')}`);
    }
  }

  /**
   * Setup environment variables
   */
  setupEnvironment(environment?: Record<string, string>): Record<string, string> {
    const env = { ...process.env };
    if (environment) {
      Object.assign(env, environment);
    }
    return env as Record<string, string>;
  }

  /**
   * Execute a workflow
   */
  async execute(workflowPathOrObject: string | Workflow): Promise<WorkflowExecution> {
    const workflow = await this.loadWorkflow(workflowPathOrObject);
    
    try {
      this.validateWorkflow(workflow);
      const environment = this.setupEnvironment(workflow.environment);
      
      this.logger(`Starting workflow: ${workflow.name} (v${workflow.version})`);
      
      const execution = await this.executeWorkflow(workflow, environment);
      
      this.logger(`Workflow completed: ${workflow.name} (${execution.status})`);
      if (this.executionStore) {
        await this.executionStore.saveExecution(execution);
      }
      
      return execution;
    } catch (error) {
      this.logger(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  /**
   * Execute workflow tasks
   */
  private async executeWorkflow(
    workflow: Workflow,
    environment: Record<string, string>
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflow: workflow.name,
      startTime: Date.now(),
      status: 'running',
      tasks: {}
    };

    try {
      // Build dependency graph
      const graph = new DependencyGraph(workflow.tasks);
      const executor = new TaskExecutor(environment);
      const completed = new Set<string>();
      const failed = new Set<string>();
      const running = new Map<string, Promise<void>>();
      const maxConcurrency = Math.max(1, workflow.concurrency ?? 4);
      let fatalError: Error | null = null;

      const startTask = (taskId: string) => {
        const task = graph.getTask(taskId)!;
        this.logger(`Executing task: ${task.name} (${task.id})`);

        const taskExecution: TaskExecution = {
          id: task.id,
          name: task.name,
          startTime: Date.now(),
          status: 'running'
        };
        execution.tasks[task.id] = taskExecution;

        const promise = (async () => {
          try {
            const result = await executor.executeWithRetry(task, taskExecution);
            execution.tasks[task.id] = result;
            completed.add(task.id);
            this.logger(`Task completed: ${task.name}`);
            if (task.on_success) {
              await this.executeCallbacks(task.on_success, graph, executor, execution);
            }
          } catch (error) {
            const taskExecutionRef = execution.tasks[task.id];
            if (taskExecutionRef) {
              taskExecutionRef.status = 'failed';
              taskExecutionRef.error = error instanceof Error ? error.message : String(error);
              taskExecutionRef.endTime = Date.now();
              taskExecutionRef.duration = taskExecutionRef.endTime - taskExecutionRef.startTime;
            }
            failed.add(task.id);
            this.logger(`Task failed: ${task.name} - ${error instanceof Error ? error.message : String(error)}`, 'error');
            if (task.on_failure) {
              await this.executeCallbacks(task.on_failure, graph, executor, execution);
            }
            if (!task.continue_on_error) {
              fatalError = error instanceof Error ? error : new Error(String(error));
            }
          } finally {
            running.delete(task.id);
          }
        })();

        running.set(task.id, promise);
      };

      while ((graph.hasRunnableTasks(completed) || running.size > 0) && !fatalError) {
        const runnableTasks = graph.getRunnableTasks(completed)
          .filter(t => !running.has(t.id) && !failed.has(t.id) && !completed.has(t.id));

        // Start tasks up to concurrency limit
        for (const task of runnableTasks) {
          if (running.size >= maxConcurrency) {
            break;
          }
          startTask(task.id);
        }

        if (running.size === 0) {
          // No tasks running and nothing runnable -> deadlock or done
          if (graph.hasRunnableTasks(completed)) {
            const remainingTasks = graph.getAllTasks()
              .filter(t => !completed.has(t.id) && !failed.has(t.id))
              .map(t => t.id);
            throw new Error(`Workflow deadlock: Cannot execute remaining tasks: ${remainingTasks.join(', ')}`);
          }
          break;
        }

        // Wait for any task to finish before continuing loop
        await Promise.race(running.values());
      }

      if (fatalError) {
        throw fatalError;
      }

      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.status = failed.size > 0 ? 'failed' : 'completed';

      return execution;
    } catch (error) {
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Execute callback tasks (on_success, on_failure)
   */
  private async executeCallbacks(
    callbackIds: string[],
    graph: DependencyGraph,
    executor: TaskExecutor,
    execution: WorkflowExecution
  ): Promise<void> {
    for (const callbackId of callbackIds) {
      const callbackTask = graph.getTask(callbackId);
      if (!callbackTask) {
        this.logger(`Callback task not found: ${callbackId}`, 'warn');
        continue;
      }

      try {
        const taskExecution: TaskExecution = {
          id: callbackTask.id,
          name: callbackTask.name,
          startTime: Date.now(),
          status: 'running'
        };

        execution.tasks[callbackTask.id] = taskExecution;
        await executor.executeWithRetry(callbackTask, taskExecution);
        execution.tasks[callbackTask.id] = taskExecution;
      } catch (error) {
        this.logger(`Callback task failed: ${callbackTask.name}`, 'warn');
        // Don't throw - callback failures shouldn't fail the main workflow
      }
    }
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return uuidv4();
  }
}

