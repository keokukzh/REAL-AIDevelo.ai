import { WorkflowExecution } from '../types.js';
import { Pool } from 'pg';
import type { ExecutionStoreAdapter } from './ExecutionStore.js';

export interface DbExecutionStoreOptions {
  connectionString: string;
  ssl?: boolean;
}

/**
 * Postgres-backed execution store for persistence.
 * Schema:
 *  CREATE TABLE IF NOT EXISTS workflow_executions (
 *    id TEXT PRIMARY KEY,
 *    workflow TEXT NOT NULL,
 *    status TEXT NOT NULL,
 *    start_time BIGINT NOT NULL,
 *    end_time BIGINT,
 *    duration BIGINT,
 *    error TEXT,
 *    payload JSONB NOT NULL,
 *    created_at TIMESTAMPTZ DEFAULT NOW()
 *  );
 */
export class DbExecutionStore implements ExecutionStoreAdapter {
  private pool: Pool;

  constructor(options: DbExecutionStoreOptions) {
    this.pool = new Pool({
      connectionString: options.connectionString,
      ssl: options.ssl ? { rejectUnauthorized: false } : undefined
    });
  }

  private async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflow TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time BIGINT NOT NULL,
        end_time BIGINT,
        duration BIGINT,
        error TEXT,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO workflow_executions (id, workflow, status, start_time, end_time, duration, error, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE
       SET status = EXCLUDED.status,
           end_time = EXCLUDED.end_time,
           duration = EXCLUDED.duration,
           error = EXCLUDED.error,
           payload = EXCLUDED.payload`,
      [
        execution.id,
        execution.workflow,
        execution.status,
        execution.startTime,
        execution.endTime ?? null,
        execution.duration ?? null,
        execution.error ?? null,
        execution
      ]
    );
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    await this.ensureSchema();
    const res = await this.pool.query(`SELECT payload FROM workflow_executions WHERE id = $1`, [executionId]);
    if (res.rowCount === 0) return null;
    return res.rows[0].payload as WorkflowExecution;
  }

  async getAllExecutions(): Promise<WorkflowExecution[]> {
    await this.ensureSchema();
    const res = await this.pool.query(`SELECT payload FROM workflow_executions ORDER BY start_time DESC`);
    return res.rows.map((r) => r.payload as WorkflowExecution);
  }

  async getExecutionsByWorkflow(workflowName: string): Promise<WorkflowExecution[]> {
    await this.ensureSchema();
    const res = await this.pool.query(
      `SELECT payload FROM workflow_executions WHERE workflow = $1 ORDER BY start_time DESC`,
      [workflowName]
    );
    return res.rows.map((r) => r.payload as WorkflowExecution);
  }

  async getRecentExecutions(limit: number = 10): Promise<WorkflowExecution[]> {
    await this.ensureSchema();
    const res = await this.pool.query(
      `SELECT payload FROM workflow_executions ORDER BY start_time DESC LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => r.payload as WorkflowExecution);
  }
}

