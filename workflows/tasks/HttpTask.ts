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

    // Simple rate limit (token bucket per URL host)
    const limiterKey = new URL(url).host;
    await HttpTask.applyRateLimit(limiterKey, task);

    try {
      const response = await axios.default(config);
      HttpTask.resetCircuit(limiterKey);

      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };
    } catch (error: unknown) {
      const isAxiosErr = axios.default.isAxiosError && axios.default.isAxiosError(error);
      const status = isAxiosErr && error.response ? error.response.status : undefined;
      HttpTask.registerFailure(limiterKey, task);

      if (HttpTask.isCircuitOpen(limiterKey)) {
        throw new Error(`Circuit open for ${limiterKey}, skipping request`);
      }

      if (axios.default.isAxiosError && axios.default.isAxiosError(error)) {
        throw new Error(
          `HTTP request failed: ${error.message}${status ? ` (${status})` : ''}`
        );
      }
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- Basic rate limit & circuit breaker state ---
  private static bucket: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private static failures: Map<string, { count: number; cooldownUntil?: number }> = new Map();

  private static async applyRateLimit(key: string, task: WorkflowTask) {
    const limit = task.rate_limit?.limit ?? 0;
    const interval = task.rate_limit?.interval_ms ?? 0;
    if (!limit || !interval) return;

    const now = Date.now();
    const state = HttpTask.bucket.get(key) || { tokens: limit, lastRefill: now };
    const elapsed = now - state.lastRefill;
    if (elapsed > interval) {
      state.tokens = limit;
      state.lastRefill = now;
    }

    if (state.tokens <= 0) {
      const waitMs = interval - elapsed;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, waitMs)));
      state.tokens = limit - 1;
      state.lastRefill = Date.now();
    } else {
      state.tokens -= 1;
    }

    HttpTask.bucket.set(key, state);
  }

  private static registerFailure(key: string, task: WorkflowTask) {
    const threshold = task.circuit_breaker?.threshold ?? 0;
    const cooldown = task.circuit_breaker?.cooldown_ms ?? 30000;
    if (!threshold) return;

    const state = HttpTask.failures.get(key) || { count: 0 };
    state.count += 1;
    if (state.count >= threshold) {
      state.cooldownUntil = Date.now() + cooldown;
    }
    HttpTask.failures.set(key, state);

    // auto close after cooldown
    if (state.cooldownUntil) {
      setTimeout(() => {
        HttpTask.failures.set(key, { count: 0 });
      }, cooldown);
    }
  }

  private static resetCircuit(key: string) {
    HttpTask.failures.set(key, { count: 0 });
  }

  private static isCircuitOpen(key: string): boolean {
    const state = HttpTask.failures.get(key);
    if (!state || !state.cooldownUntil) return false;
    return Date.now() < state.cooldownUntil;
  }
}

