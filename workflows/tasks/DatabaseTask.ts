import { WorkflowTask, TaskExecution } from '../types.js';
import { Pool, Client } from 'pg';

/**
 * Database task for executing SQL queries and migrations
 */
export class DatabaseTask {
  static async execute(
    task: WorkflowTask,
    environment: Record<string, string>
  ): Promise<TaskExecution['result']> {
    const dbConfig = (task as any).config;
    
    if (!dbConfig) {
      throw new Error('Database task must have config with connection string');
    }

    const connectionString = this.resolveConnectionString(dbConfig, environment);
    const operation = dbConfig.operation || 'query';
    const query = dbConfig.query || dbConfig.migrations_path;

    if (!query) {
      throw new Error('Database task must have query or migrations_path');
    }

    const client = new Client({ connectionString });
    
    try {
      await client.connect();
      
      let result: unknown;
      
      switch (operation) {
        case 'query':
          result = await this.executeQuery(client, query);
          break;
        case 'migration':
          result = await this.executeMigration(client, query, dbConfig.rollback_on_failure);
          break;
        case 'transaction':
          result = await this.executeTransaction(client, query, dbConfig.rollback_on_failure);
          break;
        default:
          throw new Error(`Unknown database operation: ${operation}`);
      }
      
      return {
        operation,
        success: true,
        result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (dbConfig.rollback_on_failure && operation === 'transaction') {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }
      
      throw new Error(`Database operation failed: ${errorMessage}`);
    } finally {
      await client.end();
    }
  }

  /**
   * Resolve database connection string
   */
  private static resolveConnectionString(
    config: { connection?: string; connectionString?: string },
    environment: Record<string, string>
  ): string {
    // Try config first, then environment variable
    const connectionString = 
      config.connection || 
      config.connectionString || 
      environment.DATABASE_URL || 
      process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('Database connection string not found. Set DATABASE_URL or provide connection in config.');
    }
    
    return connectionString;
  }

  /**
   * Execute a SQL query
   */
  private static async executeQuery(client: Client, query: string): Promise<unknown> {
    const result = await client.query(query);
    
    return {
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID }))
    };
  }

  /**
   * Execute database migrations
   */
  private static async executeMigration(
    client: Client,
    migrationsPath: string,
    rollbackOnFailure?: boolean
  ): Promise<unknown> {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    // Read migration files
    const files = await fs.readdir(migrationsPath);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Execute in alphabetical order
    
    const results: unknown[] = [];
    
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsPath, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      try {
        const result = await client.query(sql);
        results.push({
          file,
          success: true,
          rowCount: result.rowCount
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          file,
          success: false,
          error: errorMessage
        });
        
        if (rollbackOnFailure) {
          throw new Error(`Migration failed: ${file} - ${errorMessage}`);
        }
      }
    }
    
    return {
      migrations: results.length,
      results
    };
  }

  /**
   * Execute SQL in a transaction
   */
  private static async executeTransaction(
    client: Client,
    query: string | string[],
    rollbackOnFailure?: boolean
  ): Promise<unknown> {
    try {
      await client.query('BEGIN');
      
      const queries = Array.isArray(query) ? query : [query];
      const results: unknown[] = [];
      
      for (const sql of queries) {
        const result = await client.query(sql);
        results.push({
          rowCount: result.rowCount,
          rows: result.rows
        });
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        results
      };
    } catch (error) {
      if (rollbackOnFailure !== false) {
        await client.query('ROLLBACK');
      }
      throw error;
    }
  }
}
