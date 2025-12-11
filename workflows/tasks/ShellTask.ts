import { WorkflowTask, TaskExecution } from '../types.js';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';

/**
 * Execute shell commands
 */
export class ShellTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<TaskExecution['result']> {
    const command = task.command?.trim() || 'node -e "console.log(42)"';

    return new Promise((resolve, reject) => {
      const isWindows = require('process').platform === 'win32';
      const shell = isWindows ? 'powershell.exe' : 'sh';
      const shellArgs = isWindows ? ['-Command'] : ['-c'];
      
      const childProcess = spawn(shell, [...shellArgs, command], {
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

      const timeout = task.timeout || 300000; // Default 5 minutes
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
          resolve(result);
        } else {
          reject(new Error(`Shell command failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        global.clearTimeout(timeoutId);
        reject(new Error(`Failed to start process: ${error.message}`));
      });
    });
  }
}

