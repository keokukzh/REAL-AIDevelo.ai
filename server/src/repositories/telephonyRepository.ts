import { PoolClient } from 'pg';
import { PhoneNumber, Telephony } from '../models/types';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { getPgPool as getPool, query, transaction } from '../db/pg';

interface PhoneNumberRow {
  id: string;
  twilio_number_sid?: string;
  provider_sid?: string;
  e164?: string;
  number?: string;
  country?: string;
  status: PhoneNumber['status'];
  capabilities: {
    voice: boolean;
    sms?: boolean;
  };
  assigned_agent_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: Date;
  updated_at?: Date;
}

function mapRow(row: PhoneNumberRow): PhoneNumber {
  return {
    id: row.id,
    providerSid: row.twilio_number_sid || row.provider_sid || '',
    number: row.e164 || row.number || '',
    country: row.country || 'CH',
    status: row.status,
    capabilities: (row.capabilities as PhoneNumber['capabilities']) || { voice: true },
    assignedAgentId: row.assigned_agent_id || undefined,
    metadata: row.metadata || undefined,
  };
}

async function ensureAgentExists(client: PoolClient, agentId: string) {
  const agent = await client.query('SELECT id FROM agents WHERE id = $1', [agentId]);
  if (agent.rowCount === 0) {
    throw new NotFoundError('Agent');
  }
}

export const telephonyRepository = {
  isDatabaseEnabled(): boolean {
    return Boolean(getPool());
  },

  async getAvailableNumbers(country?: string): Promise<PhoneNumber[]> {
    // Note: Schema has 'e164' and 'twilio_number_sid'
    // If 'country' column is missing in DB, we'll exclude it from filter for now
    const rows = await query<PhoneNumberRow>(
      `SELECT *
       FROM phone_numbers
       WHERE status = 'available'
       ORDER BY created_at ASC`,
      [],
    );
    const all = rows.map(mapRow);
    if (country) {
      return all.filter((n) => n.country.toUpperCase() === country.toUpperCase());
    }
    return all;
  },

  async assignNumber(
    agentId: string,
    phoneNumberId: string,
  ): Promise<{ phoneNumber: PhoneNumber; telephony: Telephony }> {
    return transaction(async (client) => {
      await ensureAgentExists(client, agentId);

      const phoneRes = await client.query<PhoneNumberRow>(
        `SELECT *
         FROM phone_numbers
         WHERE id = $1
         FOR UPDATE`,
        [phoneNumberId],
      );

      if (phoneRes.rowCount === 0) {
        throw new NotFoundError('Phone number');
      }

      const phone = phoneRes.rows[0];
      if (phone.status !== 'available') {
        throw new BadRequestError('Phone number is not available');
      }

      const telephony: Telephony = {
        phoneNumber: phone.e164,
        phoneNumberId: phone.id,
        providerSid: phone.twilio_number_sid,
        status: 'assigned',
        assignedAt: new Date(),
        capabilities: phone.capabilities || { voice: true },
      };

      await client.query(
        `UPDATE phone_numbers
         SET status = 'assigned', assigned_agent_id = $1, updated_at = now()
         WHERE id = $2`,
        [agentId, phoneNumberId],
      );

      await client.query(
        `UPDATE agents
         SET telephony = $1, updated_at = now()
         WHERE id = $2`,
        [telephony, agentId],
      );

      return {
        phoneNumber: mapRow({ ...phone, status: 'assigned', assigned_agent_id: agentId }),
        telephony,
      };
    });
  },

  async updateNumberSettings(
    phoneNumberId: string,
    settings: Record<string, unknown>,
  ): Promise<PhoneNumber> {
    const rows = await query<PhoneNumberRow>(
      `UPDATE phone_numbers
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('settings', $2::jsonb),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [phoneNumberId, JSON.stringify(settings)],
    );

    if (!rows.length) {
      throw new NotFoundError('Phone number');
    }

    return mapRow(rows[0]);
  },

  async getNumberStatus(phoneNumberId: string): Promise<PhoneNumber> {
    const rows = await query<PhoneNumberRow>(
      `SELECT *
       FROM phone_numbers
       WHERE id = $1`,
      [phoneNumberId],
    );

    if (!rows.length) {
      throw new NotFoundError('Phone number');
    }

    return mapRow(rows[0]);
  },

  async setNumberStatus(
    agentId: string,
    phoneNumberId: string,
    status: 'active' | 'inactive',
  ): Promise<PhoneNumber> {
    return transaction(async (client) => {
      await ensureAgentExists(client, agentId);

      const phoneRes = await client.query<PhoneNumberRow>(
        `SELECT *
         FROM phone_numbers
         WHERE id = $1
         FOR UPDATE`,
        [phoneNumberId],
      );

      if (phoneRes.rowCount === 0) {
        throw new NotFoundError('Phone number');
      }

      const phone = phoneRes.rows[0];
      if (phone.assigned_agent_id !== agentId) {
        throw new BadRequestError('Phone number not assigned to this agent');
      }

      await client.query(
        `UPDATE phone_numbers
         SET status = $1, updated_at = now()
         WHERE id = $2`,
        [status, phoneNumberId],
      );

      // Patch telephony blob on agent
      await client.query(
        `UPDATE agents
         SET telephony = jsonb_set(COALESCE(telephony, '{}'::jsonb), '{status}', to_jsonb($1::text)),
             updated_at = now()
         WHERE id = $2`,
        [status, agentId],
      );

      return mapRow({ ...phone, status });
    });
  },
};
