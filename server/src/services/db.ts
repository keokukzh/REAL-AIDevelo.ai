import { VoiceAgent, Purchase, User, PhoneNumber } from '../models/types';
import { PostgresDatabase } from './postgresDb';

class HybridDatabase {
  private agents: Map<string, VoiceAgent> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private users: Map<string, User> = new Map();
  private phoneNumbers: Map<string, PhoneNumber> = new Map();
  private postgres = new PostgresDatabase();
  private cacheWarmed = false;

  constructor() {
    // Best-effort cache warm-up from Postgres
    this.warmCache().catch((err) => {
      console.warn('[DB] Failed to warm cache from Postgres (continuing with in-memory):', err);
    });
  }

  private async warmCache() {
    try {
      const agents = await this.postgres.getAllAgents();
      agents.forEach((a) => this.agents.set(a.id, a));

      // Purchases: only load if table exists; ignore errors
      try {
        const purchases = await this.postgres.getAllPurchases?.();
        purchases?.forEach((p: Purchase) => this.purchases.set(p.id, p));
      } catch (e) {
        // ignore
      }

      // Phone numbers
      try {
        const phones = await this.postgres.getPhoneNumbers();
        phones.forEach((p) => this.phoneNumbers.set(p.id, p));
      } catch (e) {
        // ignore
      }

      this.cacheWarmed = true;
      console.log('[DB] Cache warmed from Postgres');
    } catch (error) {
      console.warn('[DB] Unable to warm cache:', error);
    }
  }

  // Agent methods
  saveAgent(agent: VoiceAgent) {
    this.agents.set(agent.id, agent);
    // Persist asynchronously
    void this.postgres.saveAgent(agent).catch((err) => {
      console.error('[DB] Failed to persist agent to Postgres:', err);
    });
    return agent;
  }

  getAgent(id: string) {
    return this.agents.get(id);
  }

  getAgentById(id: string) {
    return this.agents.get(id);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  updateAgent(id: string, updates: Partial<VoiceAgent>): VoiceAgent {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date(),
    };
    this.agents.set(id, updatedAgent);
    void this.postgres.saveAgent(updatedAgent).catch((err) => {
      console.error('[DB] Failed to persist updated agent:', err);
    });
    return updatedAgent;
  }

  // Purchase methods
  savePurchase(purchase: Purchase) {
    this.purchases.set(purchase.id, purchase);
    void this.postgres.savePurchase(purchase).catch((err) => {
      console.error('[DB] Failed to persist purchase:', err);
    });
    return purchase;
  }

  getPurchase(id: string) {
    return this.purchases.get(id);
  }

  getPurchaseByPurchaseId(purchaseId: string) {
    return Array.from(this.purchases.values()).find(p => p.purchaseId === purchaseId);
  }

  getPurchaseByAgentId(agentId: string) {
    return Array.from(this.purchases.values()).find(p => p.agentId === agentId);
  }

  getAllPurchases() {
    return Array.from(this.purchases.values());
  }

  // User methods
  saveUser(user: User) {
    this.users.set(user.id, user);
    void this.postgres.saveUser(user).catch((err) => {
      console.error('[DB] Failed to persist user:', err);
    });
    return user;
  }

  getUser(userId: string) {
    return this.users.get(userId);
  }

  getUserByEmail(email?: string) {
    if (!email) return undefined;
    return Array.from(this.users.values()).find(u => u.email?.toLowerCase() === email.toLowerCase());
  }

  // Phone number methods
  savePhoneNumber(phoneNumber: PhoneNumber) {
    this.phoneNumbers.set(phoneNumber.id, phoneNumber);
    void this.postgres.savePhoneNumber(phoneNumber).catch((err) => {
      console.error('[DB] Failed to persist phone number:', err);
    });
    return phoneNumber;
  }

  getPhoneNumber(id: string) {
    return this.phoneNumbers.get(id);
  }

  getPhoneNumbers(status?: PhoneNumber['status']) {
    const numbers = Array.from(this.phoneNumbers.values());
    return status ? numbers.filter(n => n.status === status) : numbers;
  }
}

export const db = new HybridDatabase();
