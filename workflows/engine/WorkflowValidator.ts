import { Workflow, WorkflowTask } from '../types.js';

/**
 * Validates workflow schema and structure
 */
export class WorkflowValidator {
  /**
   * Validate a workflow definition
   */
  static validate(workflow: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow || typeof workflow !== 'object') {
      return { valid: false, errors: ['Workflow must be an object'] };
    }

    const wf = workflow as Partial<Workflow>;

    // Validate required fields
    if (!wf.name || typeof wf.name !== 'string') {
      errors.push('Workflow must have a "name" field (string)');
    }

    if (!wf.version || typeof wf.version !== 'string') {
      errors.push('Workflow must have a "version" field (string)');
    }

    if (!wf.trigger) {
      errors.push('Workflow must have a "trigger" field');
    } else {
      if (!wf.trigger.type || !['manual', 'schedule', 'webhook', 'file_change'].includes(wf.trigger.type)) {
        errors.push('Workflow trigger.type must be one of: manual, schedule, webhook, file_change');
      }

      if (wf.trigger.type === 'schedule' && !wf.trigger.config?.schedule) {
        errors.push('Schedule trigger must have config.schedule (cron expression)');
      }
    }

    if (!wf.tasks || !Array.isArray(wf.tasks) || wf.tasks.length === 0) {
      errors.push('Workflow must have a "tasks" array with at least one task');
    } else {
      // Validate each task
      wf.tasks.forEach((task, index) => {
        const taskErrors = this.validateTask(task, index);
        errors.push(...taskErrors);
      });

      // Check for duplicate task IDs
      const taskIds = wf.tasks.map(t => t.id);
      const duplicates = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate task IDs found: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single task
   */
  private static validateTask(task: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Task[${index}]`;

    if (!task || typeof task !== 'object') {
      return [`${prefix}: Task must be an object`];
    }

    const t = task as Partial<WorkflowTask>;

    if (!t.id || typeof t.id !== 'string') {
      errors.push(`${prefix}: Task must have an "id" field (string)`);
    }

    if (!t.name || typeof t.name !== 'string') {
      errors.push(`${prefix}: Task must have a "name" field (string)`);
    }

    if (!t.type || typeof t.type !== 'string') {
      errors.push(`${prefix}: Task must have a "type" field (string)`);
    } else {
      const validTypes = ['shell', 'http', 'docker', 'javascript', 'python', 'conditional', 'parallel', 'loop'];
      if (!validTypes.includes(t.type)) {
        errors.push(`${prefix}: Task type "${t.type}" is not valid. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    // Type-specific validation
    if (t.type === 'shell' && !t.command) {
      errors.push(`${prefix}: Shell task must have a "command" field`);
    }

    if (t.type === 'http' && !t.url) {
      errors.push(`${prefix}: HTTP task must have a "url" field`);
    }

    if (t.type === 'docker' && !t.dockerfile && !t.context) {
      errors.push(`${prefix}: Docker task must have either "dockerfile" or "context" field`);
    }

    if (t.type === 'javascript' && !t.script) {
      errors.push(`${prefix}: JavaScript task must have a "script" field`);
    }

    if (t.type === 'conditional') {
      if (!t.condition) {
        errors.push(`${prefix}: Conditional task must have a "condition" field`);
      }
      if (!t.then) {
        errors.push(`${prefix}: Conditional task must have a "then" field`);
      }
    }

    if (t.type === 'parallel') {
      if (!t.tasks || !Array.isArray(t.tasks) || t.tasks.length === 0) {
        errors.push(`${prefix}: Parallel task must have a "tasks" array with at least one task`);
      }
    }

    if (t.type === 'loop') {
      if (!t.items || !Array.isArray(t.items)) {
        errors.push(`${prefix}: Loop task must have an "items" array`);
      }
      if (!t.then && !t.command) {
        errors.push(`${prefix}: Loop task must have either "then" or "command" field`);
      }
    }

    // Validate timeout
    if (t.timeout !== undefined && (typeof t.timeout !== 'number' || t.timeout <= 0)) {
      errors.push(`${prefix}: Task timeout must be a positive number`);
    }

    // Validate retry
    if (t.retry) {
      if (typeof t.retry.attempts !== 'number' || t.retry.attempts < 1) {
        errors.push(`${prefix}: Task retry.attempts must be a positive number`);
      }
      if (typeof t.retry.delay !== 'number' || t.retry.delay < 0) {
        errors.push(`${prefix}: Task retry.delay must be a non-negative number`);
      }
    }

    return errors;
  }
}

