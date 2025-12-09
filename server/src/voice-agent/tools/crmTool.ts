import axios from 'axios';

/**
 * CRM Tool
 * Handles lead creation and CRM integration via webhooks
 */

export interface Lead {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export class CRMTool {
  private webhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.CRM_WEBHOOK_URL;
  }

  /**
   * Create lead in CRM
   */
  async createLead(lead: Lead): Promise<{ success: boolean; leadId?: string; error?: string }> {
    if (!this.webhookUrl) {
      return {
        success: false,
        error: 'CRM webhook URL not configured',
      };
    }

    try {
      const response = await axios.post(this.webhookUrl, {
        ...lead,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return {
        success: true,
        leadId: response.data?.id || response.data?.leadId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create lead',
      };
    }
  }

  /**
   * Get tool definition for LLM
   */
  static getToolDefinition() {
    return {
      name: 'create_lead',
      description: 'Create a new lead or contact in the CRM system. Use this when a customer wants to be contacted, requests information, or shows interest.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full name of the lead',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address',
          },
          phone: {
            type: 'string',
            description: 'Phone number',
          },
          company: {
            type: 'string',
            description: 'Company name',
          },
          message: {
            type: 'string',
            description: 'Message or notes from the conversation',
          },
          source: {
            type: 'string',
            description: 'Source of the lead (e.g., "phone_call", "website")',
          },
        },
        required: ['name'],
      },
    };
  }
}

export const crmTool = new CRMTool();


