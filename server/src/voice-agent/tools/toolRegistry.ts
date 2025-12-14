import { ToolCall } from '../types';
import { createCalendarTool, CalendarTool } from './calendarTool';
import { crmTool, CRMTool } from './crmTool';
import { notificationTool, NotificationTool } from './notificationTool';

/**
 * Tool Registry
 * Manages available tools and their execution
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export class ToolRegistry {
  private tools: Map<string, (args: any) => Promise<any>> = new Map();
  private definitions: ToolDefinition[] = [];
  private locationId: string;

  constructor(locationId: string) {
    this.locationId = locationId;
    this.registerTools();
  }

  /**
   * Register all available tools
   */
  private registerTools(): void {
    // Calendar tool (requires locationId for token access)
    const calendarTool = createCalendarTool(this.locationId);
    this.register(
      'calendar',
      CalendarTool.getToolDefinition(),
      async (args: any) => {
        const { action, calendarType = 'google' } = args;

        if (action === 'check_availability') {
          return await calendarTool.checkAvailability(args, calendarType);
        } else if (action === 'create_appointment') {
          return await calendarTool.createAppointment(args, calendarType);
        } else if (action === 'create_event') {
          // Legacy support - use createAppointment internally
          return await calendarTool.createAppointment({
            summary: args.summary || args.title,
            start: args.start,
            end: args.end,
            description: args.description,
            attendees: args.attendees?.map((a: any) => typeof a === 'string' ? { email: a } : a) || [],
            timezone: args.timezone,
          }, calendarType);
        } else {
          throw new Error(`Unknown calendar action: ${action}`);
        }
      }
    );

    // CRM tool
    this.register(
      'create_lead',
      CRMTool.getToolDefinition(),
      async (args: any) => {
        return await crmTool.createLead(args);
      }
    );

    // Notification tools
    NotificationTool.getToolDefinitions().forEach((def) => {
      this.register(def.name, def, async (args: any) => {
        if (def.name === 'send_sms') {
          return await notificationTool.sendSMS(args);
        } else if (def.name === 'send_email') {
          return await notificationTool.sendEmail(args);
        }
      });
    });
  }

  /**
   * Register a tool
   */
  register(
    name: string,
    definition: ToolDefinition,
    executor: (args: any) => Promise<any>
  ): void {
    this.tools.set(name, executor);
    this.definitions.push(definition);
  }

  /**
   * Execute a tool call
   */
  async execute(toolCall: ToolCall): Promise<any> {
    const executor = this.tools.get(toolCall.name);
    if (!executor) {
      throw new Error(`Tool ${toolCall.name} not found`);
    }

    try {
      const result = await executor(toolCall.arguments);
      return result;
    } catch (error: any) {
      toolCall.error = error.message;
      throw error;
    }
  }

  /**
   * Get all tool definitions for LLM
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.definitions;
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}

// Note: toolRegistry should be created with locationId
// This export is kept for backward compatibility but should be replaced
// with location-specific instances in voice agent context
export function createToolRegistry(locationId: string): ToolRegistry {
  return new ToolRegistry(locationId);
}


