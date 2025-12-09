import { WorkflowTask, TaskExecution } from '../types.js';
import { ShellTask } from '../tasks/ShellTask.js';
import { HttpTask } from '../tasks/HttpTask.js';
import { NodeTask } from '../tasks/NodeTask.js';
import { DockerTask } from '../tasks/DockerTask.js';
import { Parser } from 'expr-eval';

/**
 * Executes tasks based on their type
 */
export class TaskExecutor {
  private environment: Record<string, string>;
  private taskOutputs: Map<string, unknown>;

  constructor(environment: Record<string, string> = {}) {
    // Filter out undefined values from process.env
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      const value = process.env[key];
      if (value !== undefined) {
        processEnv[key] = value;
      }
    });
    this.environment = { ...processEnv, ...environment };
    this.taskOutputs = new Map();
  }

  /**
   * Execute a task based on its type
   */
  async executeTask(task: WorkflowTask, execution: TaskExecution): Promise<TaskExecution> {
    execution.status = 'running';
    execution.startTime = Date.now();

    try {
      // Evaluate condition if present
      if (task.condition) {
        const shouldRun = this.evaluateCondition(task.condition);
        if (!shouldRun) {
          execution.status = 'skipped';
          execution.endTime = Date.now();
          execution.duration = execution.endTime - execution.startTime;
          return execution;
        }
      }

      // Execute task based on type
      let result: unknown;
      switch (task.type) {
        case 'shell':
          result = await ShellTask.execute(task, this.environment);
          break;
        case 'http':
          result = await HttpTask.execute(task, this.environment);
          break;
        case 'javascript':
        case 'python':
          result = await NodeTask.execute(task, this.environment);
          break;
        case 'docker':
          result = await DockerTask.execute(task, this.environment);
          break;
        case 'conditional':
          result = await this.executeConditionalTask(task);
          break;
        case 'parallel':
          result = await this.executeParallelTask(task);
          break;
        case 'loop':
          result = await this.executeLoopTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      execution.status = 'completed';
      execution.result = result;
      if (result && typeof result === 'object') {
        const resObj = result as Record<string, unknown>;
        if (resObj.stdout !== undefined) execution.stdout = String(resObj.stdout);
        if (resObj.stderr !== undefined) execution.stderr = String(resObj.stderr);
        if (resObj.exitCode !== undefined) execution.exitCode = Number(resObj.exitCode);
      }
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      // Store output for use in other tasks (including exitCode/stdout/stderr)
      this.taskOutputs.set(task.id, {
        result,
        exitCode: execution.exitCode,
        stdout: execution.stdout,
        stderr: execution.stderr
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      throw error;
    }
  }

  /**
   * Execute task with retry logic
   */
  async executeWithRetry(task: WorkflowTask, execution: TaskExecution): Promise<TaskExecution> {
    const retry = task.retry || { attempts: 1, delay: 0, strategy: 'fixed' as const };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retry.attempts; attempt++) {
      try {
        return await this.executeTask(task, execution);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retry.attempts) {
          // Wait before retry
          const factor = retry.backoff_factor ?? 2;
          const maxDelay = retry.max_delay ?? (retry.delay ? retry.delay * 8 : retry.delay);
          const baseDelay = retry.strategy === 'exponential'
            ? Math.min(retry.delay * Math.pow(factor, attempt - 1), maxDelay || retry.delay)
            : retry.delay;
          const jitter = retry.jitter ? Math.random() * retry.jitter : 0;
          const waitMs = Math.max(0, baseDelay + jitter);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          // Reset execution for retry
          execution.status = 'running';
          execution.error = undefined;
        }
      }
    }

    throw lastError || new Error('Task execution failed');
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string): boolean {
    try {
      const parser = new Parser({
        operators: {
          add: true, concatenate: true, conditional: true, divide: true, factorial: true, logical: true,
          multiply: true, power: true, remainder: true, subtract: true, comparison: true
        }
      });

      const envProxy: Record<string, unknown> = { ...this.environment };
      const tasksProxy: Record<string, unknown> = {};

      for (const [taskId, output] of this.taskOutputs.entries()) {
        tasksProxy[taskId] = {
          result: (output as any).result,
          exitCode: (output as any).exitCode,
          stdout: (output as any).stdout,
          stderr: (output as any).stderr
        };
      }

      const expr = parser.parse(condition);
      const value = expr.evaluate({ env: envProxy, tasks: tasksProxy });
      return Boolean(value);
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Execute conditional task
   */
  private async executeConditionalTask(task: WorkflowTask): Promise<unknown> {
    const condition = this.evaluateCondition(task.condition!);
    const taskToExecute = condition ? task.then : task.else;

    if (!taskToExecute) {
      return { condition, executed: false };
    }

    // Create a temporary task from then/else
    const tempTask: WorkflowTask = {
      id: `${task.id}-${condition ? 'then' : 'else'}`,
      name: `${task.name} (${condition ? 'then' : 'else'})`,
      type: taskToExecute.type || 'shell',
      ...taskToExecute
    } as WorkflowTask;

    const execution: TaskExecution = {
      id: tempTask.id,
      name: tempTask.name,
      startTime: Date.now(),
      status: 'running'
    };

    return await this.executeTask(tempTask, execution);
  }

  /**
   * Execute parallel tasks
   */
  private async executeParallelTask(task: WorkflowTask): Promise<unknown> {
    if (!task.tasks || task.tasks.length === 0) {
      throw new Error('Parallel task must have subtasks');
    }

    const waitFor = task.wait_for || 'all';
    const executions = task.tasks.map(t => {
      const execution: TaskExecution = {
        id: t.id,
        name: t.name,
        startTime: Date.now(),
        status: 'running'
      };
      return this.executeTask(t, execution);
    });

    if (waitFor === 'all') {
      return await Promise.all(executions);
    } else if (waitFor === 'any') {
      return await Promise.race(executions);
    } else if (waitFor === 'first') {
      // Wait for first to complete, but don't cancel others
      const first = await Promise.race(executions);
      return first;
    }

    return await Promise.all(executions);
  }

  /**
   * Execute loop task
   */
  private async executeLoopTask(task: WorkflowTask): Promise<unknown[]> {
    if (!task.items || !Array.isArray(task.items)) {
      throw new Error('Loop task must have items array');
    }

    const results: unknown[] = [];
    const itemVar = task.item || 'item';

    for (const item of task.items) {
      // Set item in environment
      this.environment[itemVar] = JSON.stringify(item);

      try {
        let result: unknown;
        
        if (task.then) {
          // Execute then task
          const tempTask: WorkflowTask = {
            id: `${task.id}-loop-${results.length}`,
            name: `${task.name} (iteration ${results.length + 1})`,
            type: task.then.type || 'shell',
            ...task.then
          } as WorkflowTask;

          const execution: TaskExecution = {
            id: tempTask.id,
            name: tempTask.name,
            startTime: Date.now(),
            status: 'running'
          };

          result = await this.executeTask(tempTask, execution);
        } else if (task.command) {
          // Execute command with item substitution
          const command = task.command.replace(/\$\{item\}/g, JSON.stringify(item));
          const shellTask: WorkflowTask = {
            id: `${task.id}-loop-${results.length}`,
            name: `${task.name} (iteration ${results.length + 1})`,
            type: 'shell',
            command
          };

          const execution: TaskExecution = {
            id: shellTask.id,
            name: shellTask.name,
            startTime: Date.now(),
            status: 'running'
          };

          result = await this.executeTask(shellTask, execution);
        } else {
          throw new Error('Loop task must have either "then" or "command" field');
        }

        results.push(result);
      } catch (error) {
        if (task.stop_on_failure) {
          throw error;
        }
        results.push({ error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  /**
   * Get task output by ID
   */
  getTaskOutput(taskId: string): unknown {
    return this.taskOutputs.get(taskId);
  }

  /**
   * Update environment variables
   */
  updateEnvironment(env: Record<string, string>): void {
    this.environment = { ...this.environment, ...env };
  }
}

