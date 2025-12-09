import { ToolCall } from '../types';
import { calendarTool, CalendarTool } from './calendarTool';
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

  constructor() {
    this.registerTools();
  }

  /**
   * Register all available tools
   */
  private registerTools(): void {
    // Calendar tool
    this.register(
      'calendar',
      CalendarTool.getToolDefinition(),
      async (args: any) => {
        const { action, start, end, title, description, attendees } = args;

        if (action === 'check_availability') {
          return await calendarTool.checkAvailability(
            new Date(start),
            new Date(end)
          );
        } else if (action === 'create_event') {
          return await calendarTool.createEvent({
            title,
            start: new Date(start),
            end: new Date(end),
            description,
            attendees,
          });
        } else if (action === 'list_events') {
          return await calendarTool.listEvents(
            new Date(start),
            new Date(end)
          );
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

export const toolRegistry = new ToolRegistry();


