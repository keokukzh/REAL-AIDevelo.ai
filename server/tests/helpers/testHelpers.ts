import request from 'supertest';
import { PoolClient } from 'pg';
import { vi } from 'vitest';
import app from '../../src/app';
import { getPool } from '../../src/services/database';

export const dbTestHelpers = {
  async getClient(): Promise<PoolClient> {
    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool is not initialized. Did you set DATABASE_URL?');
    }
    return pool.connect();
  },

  async truncateTables(tables: string[]): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      for (const table of tables) {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async seedTable<T extends Record<string, any>>(table: string, rows: T | T[]): Promise<void> {
    const records = Array.isArray(rows) ? rows : [rows];
    if (records.length === 0) return;

    const columns = Object.keys(records[0]);
    const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');

    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      for (const row of records) {
        const values = columns.map((col) => row[col]);
        await client.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders});`,
          values
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getLastInserted<T = any>(table: string): Promise<T | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1;`);
      return result.rows[0] ?? null;
    } finally {
      client.release();
    }
  },
};

export const apiTestHelpers = {
  client() {
    return request(app);
  },

  async get(path: string, token?: string) {
    const agent = this.client().get(path);
    if (token) agent.set('Authorization', `Bearer ${token}`);
    return agent;
  },

  async post(path: string, body: any, token?: string) {
    const agent = this.client().post(path).send(body);
    if (token) agent.set('Authorization', `Bearer ${token}`);
    return agent;
  },
};

export function createMockService<T extends string>(methods: T[]) {
  const mock: Record<T, ReturnType<typeof vi.fn>> = {} as any;
  methods.forEach((method) => {
    mock[method] = vi.fn();
  });
  const reset = () => methods.forEach((method) => mock[method].mockReset());
  return Object.assign(mock, { reset });
}

export function createTestDataFactory<T extends Record<string, any>>(defaults: T) {
  return {
    build(overrides: Partial<T> = {}): T {
      return { ...defaults, ...overrides };
    },
    buildList(count: number, overrides: Partial<T> = {}): T[] {
      return Array.from({ length: count }, () => this.build(overrides));
    },
  };
}

