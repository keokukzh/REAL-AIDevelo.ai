import { VoiceAgent } from "../models/types";

// Simple in-memory storage for development
class MockDatabase {
  private agents: Map<string, VoiceAgent> = new Map();

  saveAgent(agent: VoiceAgent) {
    this.agents.set(agent.id, agent);
    return agent;
  }

  getAgent(id: string) {
    return this.agents.get(id);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }
}

export const db = new MockDatabase();
