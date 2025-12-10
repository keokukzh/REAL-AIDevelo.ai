import { VoiceAgent, Purchase } from "../models/types";

// Simple in-memory storage for development
class MockDatabase {
  private agents: Map<string, VoiceAgent> = new Map();
  private purchases: Map<string, Purchase> = new Map();

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
}

export const db = new MockDatabase();
