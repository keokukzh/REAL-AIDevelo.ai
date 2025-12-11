import { Pool, PoolClient } from 'pg';
import { config } from '../config/env';

let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  if (!config.databaseUrl) {
    console.warn('[Database] DATABASE_URL not set, database features will be unavailable');
    return null as any;
  }

  try {
    // Log connection attempt (without sensitive data)
    const urlForLogging = config.databaseUrl.replace(/:[^:@]+@/, ':****@');
    console.log('[Database] Connecting to:', urlForLogging.split('@')[1] || 'database');
    
    // Determine SSL configuration
    // Railway Postgres requires SSL, but rejectUnauthorized must be false for self-signed certs
    let sslConfig: any = false;
    if (config.isProduction) {
      // Always use SSL in production (Railway requires it)
      sslConfig = {
        rejectUnauthorized: false // Railway uses self-signed certificates
      };
    } else if (config.databaseUrl.includes('railway') || config.databaseUrl.includes('postgres:/')) {
      // Also use SSL if connecting to any remote database
      sslConfig = {
        rejectUnauthorized: false
      };
    }
    
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: sslConfig,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000, // Increased to 60s for Railway slow network
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle client', err);
    });

    console.log('[Database] Connection pool initialized');
    return pool;
  } catch (error) {
    console.error('[Database] Failed to initialize connection pool:', error);
    throw error;
  }
}

/**
 * Get database connection pool
 */
export function getPool(): Pool | null {
  if (!pool && config.databaseUrl) {
    return initializeDatabase();
  }
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  try {
    const result = await dbPool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error('[Database] Query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      console.warn('[Database] Pool not initialized');
      return false;
    }
    
    // Test with a simple query and retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        console.log('[Database] Testing connection...');
        const result = await dbPool.query('SELECT NOW()');
        console.log('[Database] ✅ Connection successful, server time:', result.rows[0]?.now);
        return true;
      } catch (error: any) {
        retries--;
        console.warn(`[Database] Connection test failed (${retries} retries left):`, error.message);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between retries
        }
      }
    }
    console.error('[Database] All connection attempts failed');
    return false;
  } catch (error: any) {
    console.error('[Database] Connection test failed:', error.message);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed');
  }
}

