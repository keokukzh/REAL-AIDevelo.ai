import { WorkflowTask } from '../types.js';

/**
 * Execute HTTP requests
 */
export class HttpTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<unknown> {
    if (!task.url) {
      throw new Error('HTTP task must have a url');
    }

    // Replace environment variables in URL
    let url = task.url;
    Object.keys(environment).forEach(key => {
      url = url.replace(new RegExp(`\\$\\{env\\.${key}\\}`, 'g'), environment[key]);
    });

    // Dynamic import to avoid requiring axios at module level
    const axios = await import('axios');
    
    const config: any = {
      method: (task.method as any) || 'GET',
      url,
      headers: task.headers || {},
      timeout: task.timeout || 30000,
      validateStatus: () => true // Don't throw on HTTP error status
    };

    if (task.data) {
      config.data = task.data;
    }

    if (task.auth) {
      if (task.auth.type === 'basic' && task.auth.username && task.auth.password) {
        config.auth = {
          username: task.auth.username,
          password: task.auth.password
        };
      } else if (task.auth.type === 'bearer' && task.auth.token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${task.auth.token}`
        };
      }
    }

    try {
      const response = await axios.default(config);
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };
    } catch (error: unknown) {
      if (axios.default.isAxiosError && axios.default.isAxiosError(error)) {
        throw new Error(
          `HTTP request failed: ${error.message}${error.response ? ` (${error.response.status})` : ''}`
        );
      }
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

