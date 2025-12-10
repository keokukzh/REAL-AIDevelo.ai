import { runMigrations } from './runMigrations';
import { Client } from 'pg';
import axios from 'axios';
import net from 'net';

const RETRIES = 30;
const DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPostgres(databaseUrl: string) {
  console.log('[wait] Waiting for Postgres...');
  const client = new Client({ connectionString: databaseUrl });
  for (let i = 0; i < RETRIES; i++) {
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('[wait] Postgres is available');
      return;
    } catch (err) {
      process.stdout.write('.');
      await sleep(DELAY_MS);
    }
  }
  throw new Error('Postgres did not become available in time');
}

async function waitForHttp(url: string, name = 'service') {
  if (!url) return;
  console.log(`[wait] Waiting for ${name} at ${url}...`);
  for (let i = 0; i < RETRIES; i++) {
    try {
      const res = await axios.get(url, { timeout: 2000 });
      if (res.status >= 200 && res.status < 400) {
        console.log(`\n[wait] ${name} is available`);
        return;
      }
    } catch (err) {
      process.stdout.write('.');
      await sleep(DELAY_MS);
    }
  }
  throw new Error(`${name} did not become available in time`);
}

async function waitForTcp(host: string, port: number, name = 'tcp') {
  console.log(`[wait] Waiting for ${name} ${host}:${port}...`);
  for (let i = 0; i < RETRIES; i++) {
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once('error', () => {
        socket.destroy();
        reject();
      });
      socket.once('timeout', () => {
        socket.destroy();
        reject();
      });
      socket.connect(port, host, () => {
        socket.end();
        resolve();
      });
    }).then(() => {
      console.log(`[wait] ${name} ${host}:${port} reachable`);
      return;
    }).catch(async () => {
      process.stdout.write('.');
      await sleep(DELAY_MS);
    });
  }
  throw new Error(`${name} ${host}:${port} did not become reachable in time`);
}

function normalizeDatabaseUrl(envUrl?: string): string {
  // Check for DATABASE_PRIVATE_URL first (Railway private network)
  const privateUrl = process.env.DATABASE_PRIVATE_URL;
  if (privateUrl) {
    return privateUrl;
  }
  
  // Fallback to DATABASE_URL
  const url = envUrl || process.env.DATABASE_URL || 'postgres://aidevelo:aidevelo@postgres:5432/aidevelo_dev';
  if (url.includes('localhost')) return url.replace('localhost', 'postgres');
  return url;
}

async function main() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

  // Wait for Postgres
  await waitForPostgres(databaseUrl).catch((e) => { throw e; });

  // Optionally wait for Qdrant if configured
  const qdrant = process.env.QDRANT_URL || '';
  if (qdrant) {
    try {
      const healthUrl = `${qdrant.replace(/\/$/, '')}/collections`;
      await waitForHttp(healthUrl, 'qdrant');
    } catch (err) {
      console.warn('[wait] Qdrant health check failed, continuing anyway:', String(err));
    }
  }

  // Optionally wait for Redis if configured
  const redisUrl = process.env.REDIS_URL || '';
  if (redisUrl) {
    try {
      const parsed = redisUrl.replace('redis://', '').split(':');
      const host = parsed[0] || 'redis';
      const port = parseInt(parsed[1] || '6379', 10);
      await waitForTcp(host, port, 'redis');
    } catch (err) {
      console.warn('[wait] Redis check failed, continuing anyway:', String(err));
    }
  }

  // Run migrations
  await runMigrations();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('[wait] Done — migrations complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[wait] Error during wait/migrate:', err);
      process.exit(1);
    });
}
