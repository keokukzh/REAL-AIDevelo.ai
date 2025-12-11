import { describe, expect, it } from 'vitest';
import { TaskExecutor } from '../engine/TaskExecutor.js';
import { WorkflowOrchestrator } from '../engine/WorkflowOrchestrator.js';
import { Workflow } from '../types.js';

describe('TaskExecutor', () => {
  it('captures stdout and exitCode for shell tasks', async () => {
    const executor = new TaskExecutor({});
    const exec = {
      id: 't1',
      name: 'echo',
      startTime: Date.now(),
      status: 'pending' as const
    };
    const result = await executor.executeTask(
      {
        id: 't1',
        name: 'echo',
        type: 'shell',

      },
      exec
    );

    expect(result.status).toBe('completed');
    expect(result.exitCode).toBe(0);
    expect((result.stdout || '').trim()).toContain('42');
    const stored = executor.getTaskOutput('t1') as any;
    expect(stored.exitCode).toBe(0);
  });

  it('honors retry attempts on failure', async () => {
    const executor = new TaskExecutor({});
    const exec = {
      id: 'fail',
      name: 'fail',
      startTime: Date.now(),
      status: 'pending' as const
    };

    await expect(
      executor.executeWithRetry(
        {
          id: 'fail',
          name: 'fail',
          type: 'shell',
          command: 'node -e "process.exit(1)"',
          retry: { attempts: 2, delay: 10, strategy: 'fixed' }
        },
        exec
      )
    ).rejects.toBeTruthy();
  });
});

describe('WorkflowOrchestrator parallel execution', () => {
  it('runs independent tasks in parallel respecting concurrency', async () => {
    const orchestrator = new WorkflowOrchestrator();
    const workflow: Workflow = {
      name: 'parallel-test',
      version: '1.0.0',
      trigger: { type: 'manual' },
      concurrency: 2,
      tasks: [
        { id: 'a', name: 'sleep-a', type: 'shell', command: 'node -e "setTimeout(()=>{},500)"' },
        { id: 'b', name: 'sleep-b', type: 'shell', command: 'node -e "setTimeout(()=>{},500)"' }
      ]
    };

    const start = Date.now();
    const exec = await orchestrator.execute(workflow);
    const duration = Date.now() - start;

    expect(exec.status).toBe('completed');
    // Both ~500ms tasks should complete within a reasonable window even on slower CI runners
    expect(duration).toBeLessThan(1200);
  });
});

