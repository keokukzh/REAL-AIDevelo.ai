import { v4 as uuidv4 } from 'uuid';
import { PhoneNumber } from '../models/types';
import { db } from './db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { telephonyRepository } from '../repositories/telephonyRepository';

interface NumberSettings {
  [key: string]: unknown;
  agentId?: string;
  greetingMessage?: string;
  voicemailEnabled?: boolean;
  callRecordingEnabled?: boolean;
}

class TelephonyService {
  private useDatabase(): boolean {
    return telephonyRepository.isDatabaseEnabled();
  }

  private seedNumbers() {
    if (db.getPhoneNumbers().length > 0) {
      return;
    }

    const seeds: Array<Omit<PhoneNumber, 'id'>> = [
      {
        providerSid: `prov_${uuidv4()}`,
        number: '+41445200901',
        country: 'CH',
        status: 'available',
        capabilities: { voice: true, sms: false },
        metadata: { pool: 'starter' },
      },
      {
        providerSid: `prov_${uuidv4()}`,
        number: '+41445200902',
        country: 'CH',
        status: 'available',
        capabilities: { voice: true, sms: true },
        metadata: { pool: 'business' },
      },
      {
        providerSid: `prov_${uuidv4()}`,
        number: '+41445200903',
        country: 'DE',
        status: 'available',
        capabilities: { voice: true, sms: false },
        metadata: { pool: 'premium' },
      },
    ];

    seeds.forEach(seed => {
      db.savePhoneNumber({
        ...seed,
        id: uuidv4(),
      });
    });
  }

  private limitByPlan(numbers: PhoneNumber[], planId?: string) {
    let limit = numbers.length;
    if (planId === 'business') limit = Math.min(2, numbers.length);
    if (planId === 'premium') limit = Math.min(3, numbers.length);
    return numbers.slice(0, limit);
  }

  async listAvailableNumbers(country = 'CH', planId?: string): Promise<PhoneNumber[]> {
    if (this.useDatabase()) {
      const numbers = await telephonyRepository.getAvailableNumbers(country);
      return this.limitByPlan(numbers, planId);
    }

    this.seedNumbers();
    const all = db.getPhoneNumbers('available');
    const filtered = all.filter(n => n.country.toUpperCase() === country.toUpperCase());
    return this.limitByPlan(filtered, planId);
  }

  async assignNumber(agentId: string, phoneNumberId: string) {
    if (!agentId || !phoneNumberId) {
      throw new BadRequestError('agentId and phoneNumberId are required');
    }

    if (this.useDatabase()) {
      const { phoneNumber, telephony } = await telephonyRepository.assignNumber(agentId, phoneNumberId);

      // Keep in-memory store aligned for mixed-mode dev
      const agent = db.getAgent(agentId);
      if (agent) {
        agent.telephony = telephony;
        db.saveAgent(agent);
      }

      return { phoneNumber, telephony };
    }

    const agent = db.getAgent(agentId);
    if (!agent) {
      throw new NotFoundError('Agent');
    }

    const phoneNumber = db.getPhoneNumber(phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundError('Phone number');
    }

    phoneNumber.status = 'assigned';
    phoneNumber.assignedAgentId = agentId;
    db.savePhoneNumber(phoneNumber);

    agent.telephony = {
      phoneNumber: phoneNumber.number,
      phoneNumberId: phoneNumber.id,
      providerSid: phoneNumber.providerSid,
      status: 'assigned',
      assignedAt: new Date(),
      capabilities: phoneNumber.capabilities,
    };
    db.saveAgent(agent);

    return { phoneNumber, agent };
  }

  async updateNumberSettings(phoneNumberId: string, settings: NumberSettings) {
    if (this.useDatabase()) {
      return telephonyRepository.updateNumberSettings(phoneNumberId, settings);
    }

    const phoneNumber = db.getPhoneNumber(phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundError('Phone number');
    }

    phoneNumber.metadata = {
      ...phoneNumber.metadata,
      settings,
    };

    db.savePhoneNumber(phoneNumber);
    return phoneNumber;
  }

  async getNumberStatus(phoneNumberId: string): Promise<PhoneNumber> {
    if (this.useDatabase()) {
      return telephonyRepository.getNumberStatus(phoneNumberId);
    }

    const phoneNumber = db.getPhoneNumber(phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundError('Phone number');
    }
    return phoneNumber;
  }

  async activateNumber(agentId: string): Promise<PhoneNumber> {
    const agent = db.getAgent(agentId);
    const phoneNumberId = agent?.telephony?.phoneNumberId;
    if (!agent || !phoneNumberId) {
      throw new BadRequestError('Agent has no assigned phone number');
    }

    if (this.useDatabase()) {
      const updated = await telephonyRepository.setNumberStatus(agentId, phoneNumberId, 'active');
      const refreshedAgent = db.getAgent(agentId);
      if (refreshedAgent) {
        refreshedAgent.telephony = { ...(refreshedAgent.telephony || {}), status: 'active' };
        db.saveAgent(refreshedAgent);
      }
      return updated;
    }

    const phoneNumber = db.getPhoneNumber(phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundError('Phone number');
    }
    phoneNumber.status = 'active';
    db.savePhoneNumber(phoneNumber);

    agent.telephony = { ...(agent.telephony || {}), status: 'active' };
    db.saveAgent(agent);
    return phoneNumber;
  }

  async deactivateNumber(agentId: string): Promise<PhoneNumber> {
    const agent = db.getAgent(agentId);
    const phoneNumberId = agent?.telephony?.phoneNumberId;
    if (!agent || !phoneNumberId) {
      throw new BadRequestError('Agent has no assigned phone number');
    }

    if (this.useDatabase()) {
      const updated = await telephonyRepository.setNumberStatus(agentId, phoneNumberId, 'inactive');
      const refreshedAgent = db.getAgent(agentId);
      if (refreshedAgent) {
        refreshedAgent.telephony = { ...(refreshedAgent.telephony || {}), status: 'inactive' };
        db.saveAgent(refreshedAgent);
      }
      return updated;
    }

    const phoneNumber = db.getPhoneNumber(phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundError('Phone number');
    }
    phoneNumber.status = 'inactive';
    db.savePhoneNumber(phoneNumber);

    agent.telephony = { ...(agent.telephony || {}), status: 'inactive' };
    db.saveAgent(agent);
    return phoneNumber;
  }
}

export const telephonyService = new TelephonyService();
