import { WorkflowTask } from '../types.js';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Execute JavaScript/TypeScript files
 */
export class NodeTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<unknown> {
    if (!task.script) {
      throw new Error('Node task must have a script path');
    }

    const scriptPath = task.script;
    const isTypeScript = scriptPath.endsWith('.ts');
    
    // For TypeScript files, use ts-node
    const command = isTypeScript
      ? `npx ts-node ${scriptPath}`
      : `node ${scriptPath}`;

    return new Promise((resolve, reject) => {
      const childProcess = spawn('sh', ['-c', command], {
        cwd: task.cwd || process.cwd(),
        env: { ...environment, ...task.environment },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        if (task.live_output) {
          childProcess.stdout?.write(output);
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        if (task.live_output) {
          childProcess.stderr?.write(output);
        }
      });

      const timeout = task.timeout || 300000;
      const timeoutId = global.setTimeout(() => {
        childProcess.kill('SIGKILL');
        reject(new Error(`Task timeout after ${timeout}ms`));
      }, timeout);

      childProcess.on('close', (code: number | null) => {
        global.clearTimeout(timeoutId);
        
        const result = {
          stdout,
          stderr,
          exitCode: code || 0
        };

        if (code === 0) {
          // Try to parse JSON output if available
          try {
            const jsonOutput = JSON.parse(stdout);
            resolve(jsonOutput);
          } catch {
            resolve(result);
          }
        } else {
          reject(new Error(`Script execution failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        global.clearTimeout(timeoutId);
        reject(new Error(`Failed to start process: ${error.message}`));
      });
    });
  }
}

