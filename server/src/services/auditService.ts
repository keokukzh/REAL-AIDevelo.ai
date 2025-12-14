import { supabaseAdmin } from './supabaseDb';
import { Request } from 'express';
import { StructuredLoggingService } from './loggingService';

/**
 * Audit Service
 * Records all user actions for compliance, security, and GDPR compliance
 */
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type AuditAction =
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'agent_create'
  | 'agent_update'
  | 'agent_delete'
  | 'config_update'
  | 'phone_number_assign'
  | 'phone_number_release'
  | 'calendar_connect'
  | 'calendar_disconnect'
  | 'data_export'
  | 'data_delete'
  | 'permission_change'
  | 'location_create'
  | 'location_update'
  | 'location_delete';

export type ResourceType =
  | 'user'
  | 'organization'
  | 'location'
  | 'agent_config'
  | 'phone_number'
  | 'calendar_integration'
  | 'call_log'
  | 'knowledge_document';

export class AuditService {
  /**
   * Log an audit event
   */
  static async log(
    userId: string,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    details: Record<string, unknown> = {},
    req?: Request
  ): Promise<AuditLog> {
    const ipAddress = req?.ip || req?.socket.remoteAddress || undefined;
    const userAgent = req?.headers['user-agent'] || undefined;

    // Generate ID
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Try to insert into Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          id,
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select('*')
        .single();

      if (error) {
        // Log error but don't fail the request
        StructuredLoggingService.error(
          'Failed to write audit log',
          error as Error,
          { userId, action, resourceType, resourceId },
          req
        );
        
        // Return a mock audit log for development
        return {
          id,
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
        };
      }

      return data as AuditLog;
    } catch (err) {
      // Log error but don't fail the request
      StructuredLoggingService.error(
        'Exception writing audit log',
        err as Error,
        { userId, action, resourceType, resourceId },
        req
      );

      // Return a mock audit log for development
      return {
        id,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Get audit logs for a user (for transparency/compliance)
   */
  static async getUserAuditLogs(
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return (data || []) as AuditLog[];
  }

  /**
   * Get audit logs for a resource
   */
  static async getResourceAuditLogs(
    resourceType: ResourceType,
    resourceId: string,
    limit = 100,
    offset = 0
  ): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return (data || []) as AuditLog[];
  }

  /**
   * Get audit logs by action
   */
  static async getAuditLogsByAction(
    action: AuditAction,
    limit = 100,
    offset = 0
  ): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return (data || []) as AuditLog[];
  }

  /**
   * Helper: Log authentication event
   */
  static async logAuth(
    userId: string,
    action: 'user_login' | 'user_logout' | 'user_register',
    success: boolean,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      action,
      'user',
      userId,
      { success },
      req
    );
  }

  /**
   * Helper: Log agent configuration change
   */
  static async logAgentConfigChange(
    userId: string,
    locationId: string,
    action: 'agent_create' | 'agent_update' | 'config_update',
    changes: Record<string, unknown>,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      action,
      'agent_config',
      locationId,
      { changes },
      req
    );
  }

  /**
   * Helper: Log phone number assignment
   */
  static async logPhoneNumberChange(
    userId: string,
    phoneNumberId: string,
    action: 'phone_number_assign' | 'phone_number_release',
    details: Record<string, unknown>,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      action,
      'phone_number',
      phoneNumberId,
      details,
      req
    );
  }

  /**
   * Helper: Log calendar integration change
   */
  static async logCalendarChange(
    userId: string,
    locationId: string,
    action: 'calendar_connect' | 'calendar_disconnect',
    details: Record<string, unknown>,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      action,
      'calendar_integration',
      locationId,
      details,
      req
    );
  }

  /**
   * Helper: Log data access (GDPR compliance)
   */
  static async logDataAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: 'data_export' | 'data_delete',
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      action,
      resourceType,
      resourceId,
      {},
      req
    );
  }
}
