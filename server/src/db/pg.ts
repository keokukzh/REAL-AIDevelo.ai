import { Pool, PoolClient, PoolConfig } from 'pg';
import dns from 'dns';
import { config } from '../config/env';
import { DATABASE_POOL } from '../config/constants';
import { StructuredLoggingService } from '../services/loggingService';

/**
 * PG Client: Handles direct PostgreSQL connections via 'pg'
 * Used for migrations, high-performance querying, and legacy routes.
 */

let pool: Pool | null = null;
let connectionAttempted = false;

function parseDatabaseUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '5432', 10),
      database: urlObj.pathname.slice(1) || 'railway',
    };
  } catch (error) {
    return null;
  }
}

export function initializePgPool(): Pool {
  if (pool) return pool;
  if (!config.databaseUrl) {
    if (!connectionAttempted) {
      console.warn('[db/pg] DATABASE_URL not set - pg pool disabled');
      connectionAttempted = true;
    }
    return null as any;
  }

  try {
    // Determine SSL config (simplified logic)
    // Most cloud providers (Neon, Render, Supabase) need SSL
    const isLocal =
      config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1');
    const sslConfig = isLocal ? false : { rejectUnauthorized: false }; // Allow self-signed for max compatibility

    const poolConfig: PoolConfig & { lookup?: any } = {
      connectionString: config.databaseUrl,
      ssl: sslConfig,
      max: DATABASE_POOL.MAX_CONNECTIONS,
      idleTimeoutMillis: DATABASE_POOL.IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: DATABASE_POOL.CONNECTION_TIMEOUT_MS,
      keepAlive: true,
      // Force IPv4
      lookup: (
        hostname: string,
        options: any,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
      ) => {
        dns.lookup(hostname, { ...options, family: 4 }, callback);
      },
    };

    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      StructuredLoggingService.error('[db/pg] Pool error', err);
    });

    const parsed = parseDatabaseUrl(config.databaseUrl);
    StructuredLoggingService.info(`[db/pg] Pool initialized (Host: ${parsed?.host})`);

    return pool;
  } catch (error) {
    console.error('[db/pg] Initialization failed:', error);
    throw error;
  }
}

export function getPgPool(): Pool | null {
  if (!pool && config.databaseUrl) return initializePgPool();
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const dbPool = getPgPool();
  if (!dbPool) {
    if (config.databaseUrl) {
      throw new Error('DB IO Error: Pool not initialized despite DATABASE_URL being set');
    }
    // If no URL, we can't query PG.
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  try {
    const result = await dbPool.query(text, params);
    return result.rows as T[];
  } catch (err) {
    StructuredLoggingService.error(
      '[db/pg] Query failed',
      err instanceof Error ? err : new Error(String(err)),
    );
    throw err;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const dbPool = getPgPool();
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
 * Test database connection with exponential backoff retry
 */
export async function testConnection(maxRetries: number = 5): Promise<boolean> {
  try {
    const dbPool = getPgPool();
    if (!dbPool) {
      // If pool is null, check if we even have a URL
      if (!config.databaseUrl) {
        console.warn('[db/pg] DATABASE_URL not set - skipping connection test');
        return false;
      }
      // Should have initialized if URL existed
      console.warn('[db/pg] Pool not initialized (unexpected)');
      return false;
    }

    // Exponential backoff retry logic
    let retries = maxRetries;
    let attempt = 0;

    while (retries > 0) {
      attempt++;
      try {
        console.log(`[db/pg] Testing connection (attempt ${attempt}/${maxRetries})...`);

        // Use a simple query with timeout
        const result = (await Promise.race([
          dbPool.query('SELECT NOW() as now, version() as version'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000)),
        ])) as any;

        console.log('[db/pg] ✅ Connection successful!');
        StructuredLoggingService.debug(
          `[db/pg] Version: ${result.rows[0]?.version?.split(' ')[0]}`,
        );
        return true;
      } catch (error: any) {
        retries--;
        const errorMsg = error.message || String(error);
        const errorCode = error.code || 'UNKNOWN';

        console.error(`[db/pg] Connection test failed (${retries} retries left):`, errorMsg);

        // Don't retry on fatal auth/network errors
        if (
          ['28P01', 'ENOTFOUND'].includes(errorCode) ||
          errorMsg.includes('password authentication failed')
        ) {
          console.error('[db/pg] ❌ Fatal connection error - check credentials/host');
          return false;
        }

        if (retries > 0) {
          const delay = Math.min(2000 * Math.pow(2, maxRetries - retries - 1), 30000);
          console.log(`[db/pg] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    return false;
  } catch (error: any) {
    console.error('[db/pg] ❌ Connection test exception:', error.message);
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[db/pg] Connection pool closed');
  }
}
