import { WorkflowTask, TaskExecution } from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Data processor task for file/data processing workflows
 */
export class DataProcessorTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<TaskExecution['result']> {
    const inputConfig = (task as any).input;
    const processorConfig = (task as any).processor;
    const outputConfig = (task as any).output;

    if (!inputConfig || !processorConfig || !outputConfig) {
      throw new Error('DataProcessor task must have input, processor, and output configuration');
    }

    // Resolve input files
    const inputFiles = await this.resolveInputFiles(inputConfig, task.cwd || process.cwd());
    
    if (inputFiles.length === 0) {
      throw new Error(`No input files found matching pattern: ${inputConfig.path}`);
    }

    // Process each file
    const results: unknown[] = [];
    
    for (const inputFile of inputFiles) {
      try {
        const data = await this.loadInputFile(inputFile, inputConfig.type);
        const processed = await this.processData(data, processorConfig, environment);
        const outputPath = this.resolveOutputPath(outputConfig, inputFile, task.cwd || process.cwd());
        await this.saveOutput(processed, outputPath, outputConfig.type);
        
        results.push({
          inputFile,
          outputPath,
          success: true
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          inputFile,
          success: false,
          error: errorMessage
        });
        
        if ((task as any).stop_on_failure) {
          throw error;
        }
      }
    }

    return {
      processed: results.length,
      results
    };
  }

  /**
   * Resolve input file paths from pattern
   */
  private static async resolveInputFiles(
    inputConfig: { type: string; path: string },
    cwd: string
  ): Promise<string[]> {
    const pattern = inputConfig.path;
    const fullPattern = path.isAbsolute(pattern) ? pattern : path.join(cwd, pattern);
    
    try {
      // Simple glob pattern matching using fs
      // For complex patterns, consider using a glob library
      if (fullPattern.includes('*') || fullPattern.includes('**')) {
        // Use dynamic import for glob if available
        try {
          const { glob } = await import('glob');
          const files = await glob(fullPattern, { cwd });
          return files.map(f => path.isAbsolute(f) ? f : path.join(cwd, f));
        } catch {
          // Fallback: simple directory traversal
          return await this.simpleGlob(fullPattern, cwd);
        }
      } else {
        // Single file path
        try {
          await fs.access(fullPattern);
          return [fullPattern];
        } catch {
          return [];
        }
      }
    } catch (error) {
      throw new Error(`Failed to resolve input files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simple glob implementation for basic patterns
   */
  private static async simpleGlob(pattern: string, cwd: string): Promise<string[]> {
    const files: string[] = [];
    const dir = path.dirname(pattern);
    const basename = path.basename(pattern);
    const regex = new RegExp('^' + basename.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (regex.test(entry)) {
          files.push(path.join(dir, entry));
        }
      }
    } catch {
      // Directory doesn't exist or can't read
    }
    
    return files;
  }

  /**
   * Load input file based on type
   */
  private static async loadInputFile(filePath: string, type: string): Promise<unknown> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    switch (type) {
      case 'json':
        return JSON.parse(content);
      case 'csv':
        return this.parseCSV(content);
      case 'text':
        return content;
      default:
        // Try to auto-detect
        if (filePath.endsWith('.json')) {
          return JSON.parse(content);
        } else if (filePath.endsWith('.csv')) {
          return this.parseCSV(content);
        }
        return content;
    }
  }

  /**
   * Parse CSV content
   */
  private static parseCSV(content: string): unknown[] {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Process data using processor script
   */
  private static async processData(
    data: unknown,
    processorConfig: { type: string; script: string },
    environment: Record<string, string>
  ): Promise<unknown> {
    if (processorConfig.type === 'javascript') {
      // Execute JavaScript processor
      const scriptPath = processorConfig.script;
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const childProcess = spawn('node', [scriptPath], {
          env: {
            ...environment,
            INPUT_DATA: JSON.stringify(data)
          },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout?.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });

        childProcess.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });

        childProcess.on('close', (code: number | null) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch {
              resolve(stdout);
            }
          } else {
            reject(new Error(`Processor script failed: ${stderr || stdout}`));
          }
        });

        childProcess.on('error', (error: Error) => {
          reject(new Error(`Failed to execute processor: ${error.message}`));
        });
      });
    } else {
      // For other types, return data as-is (can be extended)
      return data;
    }
  }

  /**
   * Resolve output file path
   */
  private static resolveOutputPath(
    outputConfig: { type: string; path: string },
    inputFile: string,
    cwd: string
  ): string {
    let outputPath = outputConfig.path;
    
    // Replace placeholders
    const inputBasename = path.basename(inputFile, path.extname(inputFile));
    outputPath = outputPath.replace('${input}', inputBasename);
    outputPath = outputPath.replace('${inputFile}', path.basename(inputFile));
    
    if (!path.isAbsolute(outputPath)) {
      outputPath = path.join(cwd, outputPath);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    fs.mkdir(outputDir, { recursive: true }).catch(() => {
      // Ignore errors, will fail on write if needed
    });
    
    return outputPath;
  }

  /**
   * Save processed data to output file
   */
  private static async saveOutput(
    data: unknown,
    outputPath: string,
    type: string
  ): Promise<void> {
    let content: string;
    
    switch (type) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.toCSV(data);
        break;
      case 'text':
        content = String(data);
        break;
      default:
        content = JSON.stringify(data, null, 2);
    }
    
    await fs.writeFile(outputPath, content, 'utf-8');
  }

  /**
   * Convert data to CSV format
   */
  private static toCSV(data: unknown): string {
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        const headers = Object.keys(firstItem as Record<string, unknown>);
        const rows = [headers.join(',')];
        
        for (const item of data) {
          const values = headers.map(header => {
            const value = (item as Record<string, unknown>)[header];
            return String(value ?? '').replace(/,/g, ';'); // Escape commas
          });
          rows.push(values.join(','));
        }
        
        return rows.join('\n');
      }
    }
    
    return String(data);
  }
}
