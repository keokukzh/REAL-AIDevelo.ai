import { v4 as uuidv4 } from 'uuid';
import { VoiceAgentSession } from '../types';

/**
 * Session Management Service
 * Manages call sessions and their state
 */

class SessionStore {
  private sessions: Map<string, VoiceAgentSession> = new Map();

  create(
    customerId: string,
    agentId: string,
    metadata?: Record<string, any>
  ): VoiceAgentSession {
    const session: VoiceAgentSession = {
      id: uuidv4(),
      customerId,
      agentId,
      status: 'active',
      createdAt: new Date(),
      context: {
        conversationHistory: [],
        metadata,
      },
    };

    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): VoiceAgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  update(sessionId: string, updates: Partial<VoiceAgentSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionId, session);
    }
  }

  end(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endedAt = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  getAll(): VoiceAgentSession[] {
    return Array.from(this.sessions.values());
  }

  getByCustomer(customerId: string): VoiceAgentSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.customerId === customerId
    );
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    // Remove sessions older than maxAge (default 24 hours)
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.endedAt) {
        const age = now - session.endedAt.getTime();
        if (age > maxAge) {
          this.sessions.delete(id);
        }
      }
    }
  }
}

export const sessionStore = new SessionStore();

// Cleanup old sessions every hour
setInterval(() => {
  sessionStore.cleanup();
}, 60 * 60 * 1000);


