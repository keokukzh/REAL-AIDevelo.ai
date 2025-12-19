import { Pool, PoolClient, PoolConfig } from 'pg';
import dns from 'dns';
import { config } from '../config/env';
import { DATABASE_POOL } from '../config/constants';

let pool: Pool | null = null;

/**
 * Parse and validate database URL
 */
function parseDatabaseUrl(url: string): { host: string; port: number; database: string; user: string } | null {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '5432', 10),
      database: urlObj.pathname.slice(1) || 'railway',
      user: urlObj.username || 'postgres',
    };
  } catch (error) {
    StructuredLoggingService.error('Invalid DATABASE_URL format', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Initialize PostgreSQL connection pool with optimized settings for cloud providers
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
    const parsed = parseDatabaseUrl(config.databaseUrl);
    StructuredLoggingService.info('Connecting to database', { 
      host: parsed?.host, 
      port: parsed?.port, 
      database: parsed?.database 
    });
    
    // Determine SSL configuration based on provider
    const isRailway = config.databaseUrl.includes('railway') || 
                      config.databaseUrl.includes('railway.internal') ||
                      config.databaseUrl.includes('postgres.railway');
    const isSupabase = config.databaseUrl.includes('supabase.co') || 
                       config.databaseUrl.includes('pooler.supabase.com');
    const isNeon = config.databaseUrl.includes('neon.tech') || 
                   config.databaseUrl.includes('neon.tech');
    const isRender = config.databaseUrl.includes('render.com');
    
    let sslConfig: any = false;
    if (config.isProduction || isRailway || isSupabase || isNeon || isRender) {
      // Most cloud providers require SSL
      if (isSupabase) {
        // Supabase pooler may use self-signed certs, direct connection uses proper certs
        // Use rejectUnauthorized: false for compatibility
        sslConfig = {
          rejectUnauthorized: false,
        };
        console.log('[Database] SSL enabled for Supabase (self-signed certs allowed)');
      } else if (isNeon || isRender) {
        // Neon/Render use proper SSL certificates
        sslConfig = {
          rejectUnauthorized: true,
        };
        StructuredLoggingService.debug('SSL enabled with certificate validation');
      } else {
        // Railway uses self-signed certs
        sslConfig = {
          rejectUnauthorized: false,
          sslmode: 'require',
        };
        console.log('[Database] SSL enabled (self-signed certs)');
      }
    }
    
    // Optimized pool settings for cloud providers (force IPv4 to avoid ENETUNREACH on IPv6-only DNS responses)
    const poolConfig: PoolConfig & {
      lookup?: (
        hostname: string,
        options: dns.LookupOneOptions,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
      ) => void;
    } = {
      connectionString: config.databaseUrl,
      ssl: sslConfig,
      max: DATABASE_POOL.MAX_CONNECTIONS,
      min: DATABASE_POOL.MIN_CONNECTIONS,
      idleTimeoutMillis: DATABASE_POOL.IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: DATABASE_POOL.CONNECTION_TIMEOUT_MS,
      statement_timeout: DATABASE_POOL.QUERY_TIMEOUT_MS,
      query_timeout: DATABASE_POOL.QUERY_TIMEOUT_MS,
      keepAlive: true,
      keepAliveInitialDelayMillis: DATABASE_POOL.KEEP_ALIVE_INITIAL_DELAY_MS,
      allowExitOnIdle: false, // Don't close pool when idle
      // Force IPv4 to avoid ENETUNREACH when IPv6 is not available in the runtime
      lookup: (hostname: string, options: dns.LookupOneOptions, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
        dns.lookup(hostname, { ...options, family: 4, verbatim: false }, callback);
      },
    };

    pool = new Pool(poolConfig);

    // Enhanced error handling
    pool.on('error', (err: Error) => {
      StructuredLoggingService.error('Database pool error', err);
      // Don't crash on pool errors - they're handled per-query
    });

    pool.on('connect', (client: any) => {
      StructuredLoggingService.debug('New client connected to database');
    });

    pool.on('acquire', () => {
      // Client acquired from pool (debugging)
    });

    pool.on('remove', () => {
      StructuredLoggingService.debug('Client removed from pool');
    });

    StructuredLoggingService.info('Connection pool initialized with optimized cloud settings');
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
    StructuredLoggingService.error('Database query error', error instanceof Error ? error : new Error(String(error)));
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
 * Test database connection with exponential backoff retry
 */
export async function testConnection(maxRetries: number = 5): Promise<boolean> {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      console.warn('[Database] Pool not initialized');
      return false;
    }
    
    // Exponential backoff retry logic
    let retries = maxRetries;
    let attempt = 0;
    
    while (retries > 0) {
      attempt++;
      try {
        console.log(`[Database] Testing connection (attempt ${attempt}/${maxRetries})...`);
        
        // Use a simple query with timeout
        const result = await Promise.race([
          dbPool.query('SELECT NOW() as now, version() as version'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
        ]) as any;
        
        console.log('[Database] ✅ Connection successful!');
        console.log('[Database] Server time:', result.rows[0]?.now);
        console.log('[Database] PostgreSQL version:', result.rows[0]?.version?.split(' ')[0] || 'unknown');
        return true;
      } catch (error: any) {
        retries--;
        const errorMsg = error.message || String(error);
        const errorCode = error.code || 'UNKNOWN';
        
        console.error(`[Database] Connection test failed (${retries} retries left):`, errorMsg);
        console.error(`[Database] Error code: ${errorCode}`);
        
        // Don't retry on authentication errors - these won't fix themselves
        if (errorCode === '28P01' || errorMsg.includes('password authentication failed')) {
          console.error('[Database] ❌ Authentication failed - check DATABASE_URL credentials');
          return false;
        }
        
        // Don't retry on invalid connection string
        if (errorCode === 'ENOTFOUND' || errorMsg.includes('getaddrinfo')) {
          console.error('[Database] ❌ Invalid hostname - check DATABASE_URL');
          return false;
        }
        
        if (retries > 0) {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          const delay = Math.min(2000 * Math.pow(2, maxRetries - retries - 1), 30000);
          console.log(`[Database] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('[Database] ❌ All connection attempts failed after', maxRetries, 'retries');
    return false;
  } catch (error: any) {
    console.error('[Database] ❌ Connection test exception:', error.message);
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

