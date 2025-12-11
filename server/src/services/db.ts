import { VoiceAgent, Purchase, User, PhoneNumber } from "../models/types";

// Simple in-memory storage for development
class MockDatabase {
  private agents: Map<string, VoiceAgent> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private users: Map<string, User> = new Map();
  private phoneNumbers: Map<string, PhoneNumber> = new Map();

  // Agent methods
  saveAgent(agent: VoiceAgent) {
    this.agents.set(agent.id, agent);
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
    return updatedAgent;
  }

  // Purchase methods
  savePurchase(purchase: Purchase) {
    this.purchases.set(purchase.id, purchase);
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

export const db = new MockDatabase();
