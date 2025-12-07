import { WorkflowTask } from '../types.js';

/**
 * Builds and manages dependency graph for workflow tasks
 */
export class DependencyGraph {
  private tasks: Map<string, WorkflowTask>;
  private dependencies: Map<string, Set<string>>;
  private dependents: Map<string, Set<string>>;
  private inDegree: Map<string, number>;

  constructor(tasks: WorkflowTask[]) {
    this.tasks = new Map();
    this.dependencies = new Map();
    this.dependents = new Map();
    this.inDegree = new Map();

    // Initialize maps
    tasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.dependencies.set(task.id, new Set());
      this.dependents.set(task.id, new Set());
      this.inDegree.set(task.id, 0);
    });

    // Build dependency relationships
    tasks.forEach(task => {
      if (task.depends_on) {
        task.depends_on.forEach(depId => {
          if (!this.tasks.has(depId)) {
            throw new Error(`Task "${task.id}" depends on non-existent task "${depId}"`);
          }
          
          this.dependencies.get(task.id)!.add(depId);
          this.dependents.get(depId)!.add(task.id);
          this.inDegree.set(task.id, (this.inDegree.get(task.id) || 0) + 1);
        });
      }
    });

    // Check for circular dependencies
    this.detectCircularDependencies();
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true; // Circular dependency found
      }
      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = this.tasks.get(taskId);
      if (task?.depends_on) {
        for (const depId of task.depends_on) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of this.tasks.keys()) {
      if (hasCycle(taskId)) {
        throw new Error(`Circular dependency detected involving task "${taskId}"`);
      }
    }
  }

  /**
   * Get tasks that have no unmet dependencies (ready to run)
   */
  getRunnableTasks(completedTasks: Set<string>): WorkflowTask[] {
    const runnable: WorkflowTask[] = [];

    for (const [taskId, task] of this.tasks.entries()) {
      // Skip if already completed or running
      if (completedTasks.has(taskId)) {
        continue;
      }

      // Check if all dependencies are completed
      const deps = this.dependencies.get(taskId)!;
      const allDepsMet = deps.size === 0 || Array.from(deps).every(depId => completedTasks.has(depId));

      if (allDepsMet) {
        runnable.push(task);
      }
    }

    return runnable;
  }

  /**
   * Get all tasks that depend on a given task
   */
  getDependents(taskId: string): WorkflowTask[] {
    const dependentIds = this.dependents.get(taskId) || new Set();
    return Array.from(dependentIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is WorkflowTask => task !== undefined);
  }

  /**
   * Get all dependencies for a task
   */
  getDependencies(taskId: string): WorkflowTask[] {
    const depIds = this.dependencies.get(taskId) || new Set();
    return Array.from(depIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is WorkflowTask => task !== undefined);
  }

  /**
   * Check if there are any runnable tasks remaining
   */
  hasRunnableTasks(completedTasks: Set<string>): boolean {
    return this.getRunnableTasks(completedTasks).length > 0;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): WorkflowTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): WorkflowTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get topological sort of tasks (execution order)
   */
  getTopologicalOrder(): WorkflowTask[] {
    const result: WorkflowTask[] = [];
    const visited = new Set<string>();
    const tempMark = new Set<string>();

    const visit = (taskId: string): void => {
      if (tempMark.has(taskId)) {
        throw new Error(`Circular dependency detected involving task "${taskId}"`);
      }
      if (visited.has(taskId)) {
        return;
      }

      tempMark.add(taskId);
      const task = this.tasks.get(taskId);
      if (task?.depends_on) {
        task.depends_on.forEach(depId => visit(depId));
      }
      tempMark.delete(taskId);
      visited.add(taskId);
      result.push(this.tasks.get(taskId)!);
    };

    for (const taskId of this.tasks.keys()) {
      if (!visited.has(taskId)) {
        visit(taskId);
      }
    }

    return result;
  }
}

