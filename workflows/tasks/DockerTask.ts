import { WorkflowTask } from '../types.js';

/**
 * Execute Docker operations
 * Note: Requires dockerode package for full implementation
 */
export class DockerTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<unknown> {
    // For now, use shell commands to interact with Docker
    // Full dockerode implementation can be added later
    
    if (!task.dockerfile && !task.context) {
      throw new Error('Docker task must have either dockerfile or context');
    }

    let command = '';

    if (task.dockerfile) {
      // Build Docker image
      const context = task.context || '.';
      const tags = task.tags || ['latest'];
      const tagArgs = tags.map(tag => `-t ${tag}`).join(' ');
      
      let buildArgs = '';
      if (task.build_args) {
        buildArgs = Object.entries(task.build_args)
          .map(([key, value]) => `--build-arg ${key}=${value}`)
          .join(' ');
      }

      command = `docker build -f ${task.dockerfile} ${tagArgs} ${buildArgs} ${context}`;
    } else if (task.context) {
      // Run Docker container
      command = `docker run ${task.context}`;
    }

    if (!command) {
      throw new Error('Docker task must specify build or run operation');
    }

    // Execute as shell task
    const { ShellTask } = require('./ShellTask');
    const shellTask: WorkflowTask = {
      id: task.id,
      name: task.name,
      type: 'shell',
      command,
      timeout: task.timeout,
      cwd: task.cwd,
      environment: task.environment
    };

    return await ShellTask.execute(shellTask, environment);
  }
}

