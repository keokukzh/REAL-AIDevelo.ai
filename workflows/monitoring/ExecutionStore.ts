import { WorkflowExecution } from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Store and retrieve workflow execution history
 */
export interface ExecutionStoreAdapter {
  saveExecution(execution: WorkflowExecution): Promise<void>;
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  getAllExecutions(): Promise<WorkflowExecution[]>;
  getExecutionsByWorkflow(workflowName: string): Promise<WorkflowExecution[]>;
  getRecentExecutions(limit?: number): Promise<WorkflowExecution[]>;
}

export class ExecutionStore implements ExecutionStoreAdapter {
  private storagePath: string;

  constructor(storagePath: string = './workflows/.executions') {
    this.storagePath = storagePath;
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Save execution to storage
   */
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    await this.ensureStorageDir();
    
    const filePath = path.join(this.storagePath, `${execution.id}.json`);
    const data = JSON.stringify(execution, null, 2);
    
    await fs.writeFile(filePath, data, 'utf-8');
    
    // Also update index file
    await this.updateIndex(execution);
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const filePath = path.join(this.storagePath, `${executionId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as WorkflowExecution;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all executions
   */
  async getAllExecutions(): Promise<WorkflowExecution[]> {
    await this.ensureStorageDir();
    
    try {
      const files = await fs.readdir(this.storagePath);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
      
      const executions: WorkflowExecution[] = [];
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.storagePath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          executions.push(JSON.parse(data) as WorkflowExecution);
        } catch (error) {
          // Skip corrupted files
          console.warn(`Failed to read execution file ${file}:`, error);
        }
      }
      
      // Sort by start time (newest first)
      executions.sort((a, b) => b.startTime - a.startTime);
      
      return executions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get executions by workflow name
   */
  async getExecutionsByWorkflow(workflowName: string): Promise<WorkflowExecution[]> {
    const allExecutions = await this.getAllExecutions();
    return allExecutions.filter(e => e.workflow === workflowName);
  }

  /**
   * Get recent executions
   */
  async getRecentExecutions(limit: number = 10): Promise<WorkflowExecution[]> {
    const allExecutions = await this.getAllExecutions();
    return allExecutions.slice(0, limit);
  }

  /**
   * Update index file for quick lookups
   */
  private async updateIndex(execution: WorkflowExecution): Promise<void> {
    const indexPath = path.join(this.storagePath, 'index.json');
    
    let index: {
      executions: Array<{ id: string; workflow: string; startTime: number; status: string }>;
      lastUpdated: number;
    };
    
    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(data);
    } catch {
      index = {
        executions: [],
        lastUpdated: Date.now()
      };
    }
    
    // Add or update execution in index
    const existingIndex = index.executions.findIndex(e => e.id === execution.id);
    const entry = {
      id: execution.id,
      workflow: execution.workflow,
      startTime: execution.startTime,
      status: execution.status
    };
    
    if (existingIndex >= 0) {
      index.executions[existingIndex] = entry;
    } else {
      index.executions.unshift(entry);
    }
    
    // Keep only last 1000 entries
    if (index.executions.length > 1000) {
      index.executions = index.executions.slice(0, 1000);
    }
    
    index.lastUpdated = Date.now();
    
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Get execution index
   */
  async getIndex(): Promise<Array<{ id: string; workflow: string; startTime: number; status: string }>> {
    const indexPath = path.join(this.storagePath, 'index.json');
    
    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(data);
      return index.executions || [];
    } catch {
      return [];
    }
  }

  /**
   * Clean up old executions (older than specified days)
   */
  async cleanupOldExecutions(daysToKeep: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const allExecutions = await this.getAllExecutions();
    
    let deleted = 0;
    for (const execution of allExecutions) {
      if (execution.startTime < cutoffTime) {
        try {
          const filePath = path.join(this.storagePath, `${execution.id}.json`);
          await fs.unlink(filePath);
          deleted++;
        } catch (error) {
          console.warn(`Failed to delete execution ${execution.id}:`, error);
        }
      }
    }
    
    // Rebuild index
    if (deleted > 0) {
      await this.rebuildIndex();
    }
    
    return deleted;
  }

  /**
   * Rebuild index from execution files
   */
  private async rebuildIndex(): Promise<void> {
    const executions = await this.getAllExecutions();
    const index = {
      executions: executions.map(e => ({
        id: e.id,
        workflow: e.workflow,
        startTime: e.startTime,
        status: e.status
      })),
      lastUpdated: Date.now()
    };
    
    const indexPath = path.join(this.storagePath, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }
}

