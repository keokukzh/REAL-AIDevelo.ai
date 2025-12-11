import { query } from './database';
import { VoiceAgent, Purchase, User, PhoneNumber } from '../models/types';

type AgentRow = {
  id: string;
  eleven_labs_agent_id: string | null;
  user_id: string | null;
  metadata: any;
  business_profile: any;
  config: any;
  subscription: any;
  telephony: any;
  voice_cloning: any;
  status: string;
  created_at: string;
  updated_at: string;
};

type PurchaseRow = {
  id: string;
  plan_id: string;
  plan_name: string;
  customer_email: string;
  status: string;
  purchase_id: string;
  agent_id: string | null;
  created_at: string;
  completed_at: string | null;
};

type PhoneRow = {
  id: string;
  provider_sid: string;
  number: string;
  country: string;
  status: string;
  capabilities: any;
  assigned_agent_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
};

function mapAgent(row: AgentRow): VoiceAgent {
  return {
    id: row.id,
    elevenLabsAgentId: row.eleven_labs_agent_id || undefined,
    userId: row.user_id || undefined,
    metadata: row.metadata || undefined,
    businessProfile: row.business_profile,
    config: row.config,
    subscription: row.subscription || undefined,
    telephony: row.telephony || undefined,
    voiceCloning: row.voice_cloning || undefined,
    status: row.status as VoiceAgent['status'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    customerEmail: row.customer_email,
    status: row.status as Purchase['status'],
    purchaseId: row.purchase_id,
    agentId: row.agent_id || undefined,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

function mapPhone(row: PhoneRow): PhoneNumber {
  return {
    id: row.id,
    providerSid: row.provider_sid,
    number: row.number,
    country: row.country,
    status: row.status as PhoneNumber['status'],
    capabilities: row.capabilities || { voice: true },
    assignedAgentId: row.assigned_agent_id || undefined,
    metadata: row.metadata || undefined,
  };
}

export class PostgresDatabase {
  // Agents
  async saveAgent(agent: VoiceAgent): Promise<VoiceAgent> {
    const result = await query<AgentRow>(
      `
        INSERT INTO agents (
          id, eleven_labs_agent_id, user_id, metadata,
          business_profile, config, subscription, telephony, voice_cloning,
          status, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET
          eleven_labs_agent_id = EXCLUDED.eleven_labs_agent_id,
          user_id = EXCLUDED.user_id,
          metadata = EXCLUDED.metadata,
          business_profile = EXCLUDED.business_profile,
          config = EXCLUDED.config,
          subscription = EXCLUDED.subscription,
          telephony = EXCLUDED.telephony,
          voice_cloning = EXCLUDED.voice_cloning,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `,
      [
        agent.id,
        agent.elevenLabsAgentId || null,
        agent.userId || null,
        agent.metadata || {},
        agent.businessProfile,
        agent.config,
        agent.subscription || null,
        agent.telephony || null,
        agent.voiceCloning || null,
        agent.status,
        agent.createdAt || new Date(),
        agent.updatedAt || new Date(),
      ]
    );
    return mapAgent(result[0]);
  }

  async getAgent(id: string): Promise<VoiceAgent | undefined> {
    const rows = await query<AgentRow>('SELECT * FROM agents WHERE id = $1', [id]);
    return rows[0] ? mapAgent(rows[0]) : undefined;
  }

  async getAgentById(id: string): Promise<VoiceAgent | undefined> {
    return this.getAgent(id);
  }

  async getAllAgents(): Promise<VoiceAgent[]> {
    const rows = await query<AgentRow>('SELECT * FROM agents ORDER BY created_at DESC');
    return rows.map(mapAgent);
  }

  async updateAgent(id: string, updates: Partial<VoiceAgent>): Promise<VoiceAgent> {
    const existing = await this.getAgent(id);
    if (!existing) {
      throw new Error('Agent not found');
    }
    const merged: VoiceAgent = {
      ...existing,
      ...updates,
      businessProfile: updates.businessProfile || existing.businessProfile,
      config: updates.config || existing.config,
      subscription: updates.subscription ?? existing.subscription,
      telephony: updates.telephony ?? existing.telephony,
      voiceCloning: updates.voiceCloning ?? existing.voiceCloning,
      updatedAt: new Date(),
    };
    return this.saveAgent(merged);
  }

  // Purchases
  async savePurchase(purchase: Purchase): Promise<Purchase> {
    const rows = await query<PurchaseRow>(
      `
        INSERT INTO purchases (
          id, plan_id, plan_name, customer_email, status, purchase_id, agent_id, created_at, completed_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name,
          customer_email = EXCLUDED.customer_email,
          status = EXCLUDED.status,
          purchase_id = EXCLUDED.purchase_id,
          agent_id = EXCLUDED.agent_id,
          completed_at = EXCLUDED.completed_at
        RETURNING *
      `,
      [
        purchase.id,
        purchase.planId,
        purchase.planName,
        purchase.customerEmail,
        purchase.status,
        purchase.purchaseId,
        purchase.agentId || null,
        purchase.createdAt || new Date(),
        purchase.completedAt || null,
      ]
    );
    return mapPurchase(rows[0]);
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const rows = await query<PurchaseRow>('SELECT * FROM purchases WHERE id = $1', [id]);
    return rows[0] ? mapPurchase(rows[0]) : undefined;
  }

  async getPurchaseByPurchaseId(purchaseId: string): Promise<Purchase | undefined> {
    const rows = await query<PurchaseRow>('SELECT * FROM purchases WHERE purchase_id = $1', [purchaseId]);
    return rows[0] ? mapPurchase(rows[0]) : undefined;
  }

  async getPurchaseByAgentId(agentId: string): Promise<Purchase | undefined> {
    const rows = await query<PurchaseRow>('SELECT * FROM purchases WHERE agent_id = $1', [agentId]);
    return rows[0] ? mapPurchase(rows[0]) : undefined;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    const rows = await query<PurchaseRow>('SELECT * FROM purchases');
    return rows.map(mapPurchase);
  }

  // Users (lightweight for auth fallback)
  async saveUser(user: User): Promise<User> {
    await query(
      `
        INSERT INTO users (id, name, email, created_at)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email
      `,
      [user.id, user.name || null, user.email || null, user.createdAt || new Date()]
    );
    return user;
  }

  async getUser(userId: string): Promise<User | undefined> {
    const rows = await query<any>('SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]);
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name || undefined,
      email: row.email || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  async getUserByEmail(email?: string): Promise<User | undefined> {
    if (!email) return undefined;
    const rows = await query<any>('SELECT id, name, email, created_at FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name || undefined,
      email: row.email || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  // Phone numbers
  async savePhoneNumber(phoneNumber: PhoneNumber): Promise<PhoneNumber> {
    const rows = await query<PhoneRow>(
      `
        INSERT INTO phone_numbers (
          id, provider_sid, number, country, status, capabilities, assigned_agent_id, metadata
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          provider_sid = EXCLUDED.provider_sid,
          number = EXCLUDED.number,
          country = EXCLUDED.country,
          status = EXCLUDED.status,
          capabilities = EXCLUDED.capabilities,
          assigned_agent_id = EXCLUDED.assigned_agent_id,
          metadata = EXCLUDED.metadata
        RETURNING *
      `,
      [
        phoneNumber.id,
        phoneNumber.providerSid,
        phoneNumber.number,
        phoneNumber.country,
        phoneNumber.status,
        phoneNumber.capabilities || { voice: true },
        phoneNumber.assignedAgentId || null,
        phoneNumber.metadata || null,
      ]
    );
    return mapPhone(rows[0]);
  }

  async getPhoneNumber(id: string): Promise<PhoneNumber | undefined> {
    const rows = await query<PhoneRow>('SELECT * FROM phone_numbers WHERE id = $1', [id]);
    return rows[0] ? mapPhone(rows[0]) : undefined;
  }

  async getPhoneNumbers(status?: PhoneNumber['status']): Promise<PhoneNumber[]> {
    const rows = status
      ? await query<PhoneRow>('SELECT * FROM phone_numbers WHERE status = $1', [status])
      : await query<PhoneRow>('SELECT * FROM phone_numbers');
    return rows.map(mapPhone);
  }
}

