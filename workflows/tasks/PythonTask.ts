import { WorkflowTask, TaskExecution } from '../types.js';
import { spawn } from 'node:child_process';
import { platform } from 'node:process';

/**
 * Execute Python scripts
 */
export class PythonTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<TaskExecution['result']> {
    if (!task.script) {
      throw new Error('Python task must have a script path');
    }

    const scriptPath = task.script;
    const isWindows = platform === 'win32';
    
    // Detect Python executable
    // Try python3 first, then python
    const pythonExecutable = await this.detectPython();
    if (!pythonExecutable) {
      throw new Error('Python executable not found. Please ensure Python 3.x is installed and in PATH.');
    }

    // Build command with optional virtualenv activation
    let command: string;
    const venvPath = task.environment?.VIRTUAL_ENV || environment.VIRTUAL_ENV;
    
    if (venvPath && !isWindows) {
      // Activate virtualenv and run script
      const activateScript = `${venvPath}/bin/activate`;
      command = `source ${activateScript} && ${pythonExecutable} ${scriptPath}`;
    } else if (venvPath && isWindows) {
      // Windows virtualenv activation
      const activateScript = `${venvPath}\\Scripts\\activate`;
      command = `${activateScript} && ${pythonExecutable} ${scriptPath}`;
    } else {
      // Direct execution
      command = `${pythonExecutable} ${scriptPath}`;
    }

    return new Promise((resolve, reject) => {
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
          process.stdout.write(output);
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        if (task.live_output) {
          process.stderr.write(output);
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
          // Try to parse JSON output if available
          try {
            const jsonOutput = JSON.parse(stdout.trim());
            resolve({ ...result, json: jsonOutput });
          } catch {
            resolve(result);
          }
        } else {
          reject(new Error(`Python script failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        global.clearTimeout(timeoutId);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Detect Python executable (python3 or python)
   */
  private static async detectPython(): Promise<string | null> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const isWindows = platform === 'win32';

    // Try python3 first (Unix/Linux/Mac)
    if (!isWindows) {
      try {
        await execAsync('python3 --version');
        return 'python3';
      } catch {
        // Continue to try python
      }
    }

    // Try python (Windows or fallback)
    try {
      await execAsync('python --version');
      return 'python';
    } catch {
      return null;
    }
  }
}
