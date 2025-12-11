import { User } from '../models/types';
import { getPool, query } from '../services/database';

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  created_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email || undefined,
    createdAt: row.created_at,
  };
}

export const userRepository = {
  isDatabaseEnabled(): boolean {
    return Boolean(getPool());
  },

  async findByEmail(email: string): Promise<User | null> {
    if (!getPool()) return null;

    const rows = await query<UserRow>(
      `SELECT id, name, email, created_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findById(id: string): Promise<User | null> {
    if (!getPool()) return null;

    const rows = await query<UserRow>(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  async upsertUser(input: { id?: string; name: string; email?: string | null }): Promise<User> {
    const rows = await query<UserRow>(
      `INSERT INTO users (id, name, email)
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name
       RETURNING id, name, email, created_at`,
      [input.id || null, input.name, input.email || null]
    );

    return mapRow(rows[0]);
  },
};
