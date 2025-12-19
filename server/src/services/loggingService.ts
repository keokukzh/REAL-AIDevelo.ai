import { getPool } from './database';
import { AppError } from '../utils/errors';
import { Request } from 'express';
import { config } from '../config/env';
import { supabaseAdmin } from './supabaseDb';

export interface CallRecord {
  id: string;
  agentId: string;
  customerId: string;
  phoneNumber?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  status: 'initiated' | 'connected' | 'failed' | 'completed';
  recordingUrl?: string;
  transcription?: string;
  successRate?: number;
  missedCalls?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string; // 'create_agent', 'update_config', 'delete_data', etc.
  resourceType: string; // 'agent', 'call', 'user_data'
  resourceId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Call Logging Service
 * Records all voice call metrics and metadata for analytics and compliance
 */
export class CallLoggingService {
  /**
   * Log a new call
   * @deprecated Use Supabase client directly or call_logs table via supabaseAdmin
   * This method is kept for backward compatibility
   */
  static async logCall(record: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabaseAdmin
      .from('call_logs')
      .insert({
        id,
        agent_id: record.agentId,
        customer_id: record.customerId,
        phone_number: record.phoneNumber,
        start_time: record.startTime.toISOString(),
        status: record.status,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(500, `Failed to log call: ${error.message}`);
    }

    return this.formatCallRecord(data);
  }

  /**
   * Update call record (end time, duration, result, etc.)
   * @deprecated Use Supabase client directly
   * This method is kept for backward compatibility
   */
  static async updateCall(
    callId: string,
    updates: Partial<Omit<CallRecord, 'id'>>
  ): Promise<CallRecord> {
    const updateData: any = {};
    
    if (updates.endTime) {
      updateData.end_time = updates.endTime.toISOString();
    }
    if (updates.duration !== undefined) {
      updateData.duration_sec = updates.duration;
    }
    if (updates.status) {
      updateData.status = updates.status;
    }
    if (updates.recordingUrl) {
      updateData.recording_url = updates.recordingUrl;
    }
    if (updates.transcription) {
      updateData.transcription = updates.transcription;
    }
    if (updates.successRate !== undefined) {
      updateData.success_rate = updates.successRate;
    }

    const { data, error } = await supabaseAdmin
      .from('call_logs')
      .update(updateData)
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(404, `Call ${callId} not found`);
      }
      throw new AppError(500, `Failed to update call: ${error.message}`);
    }

    return this.formatCallRecord(data);
  }

  /**
   * Get call metrics for an agent
   * @deprecated Use Supabase client directly
   * This method is kept for backward compatibility
   */
  static async getAgentMetrics(agentId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('call_logs')
      .select('status, duration_sec, success_rate, started_at')
      .eq('agent_id', agentId)
      .gte('started_at', startDate.toISOString());

    if (error) {
      throw new AppError(500, `Failed to get agent metrics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const totalCalls = data.length;
    const completedCalls = data.filter((c: any) => c.status === 'completed').length;
    const failedCalls = data.filter((c: any) => c.status === 'failed').length;
    const durations = data.map((c: any) => c.duration_sec).filter((d: any) => d !== null) as number[];
    const successRates = data.map((c: any) => c.success_rate).filter((r: any) => r !== null) as number[];
    const lastCall = data.reduce((latest: string | null, call: any) => {
      const callTime = new Date(call.started_at).getTime();
      const latestTime = latest ? new Date(latest).getTime() : 0;
      return callTime > latestTime ? call.started_at : latest;
    }, null as string | null);

    return {
      total_calls: totalCalls,
      completed_calls: completedCalls,
      failed_calls: failedCalls,
      avg_duration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      avg_success_rate: successRates.length > 0 ? successRates.reduce((a, b) => a + b, 0) / successRates.length : null,
      last_call: lastCall,
    };
  }

  /**
   * Get user's call history
   */
  static async getUserCallHistory(customerId: string, limit = 100) {
    const pool = getPool();
    if (!pool) {
      throw new AppError(503, 'Database connection not available');
    }

    const query = `
      SELECT * FROM call_logs
      WHERE customer_id = $1
      ORDER BY start_time DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [customerId, limit]);
    return result.rows.map((row: any) => this.formatCallRecord(row));
  }

  private static formatCallRecord(row: any): CallRecord {
    return {
      id: row.id,
      agentId: row.agent_id,
      customerId: row.customer_id,
      phoneNumber: row.phone_number,
      startTime: new Date(row.started_at || row.start_time),
      endTime: row.ended_at || row.end_time ? new Date(row.ended_at || row.end_time) : undefined,
      duration: row.duration_sec || row.duration,
      status: row.status,
      recordingUrl: row.recording_url,
      transcription: row.transcription,
      successRate: row.success_rate,
    };
  }
}

/**
 * Audit Logging Service
 * Records all user actions for compliance and security
 */
export class AuditLoggingService {
  /**
   * Log an action
   */
  static async logAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const pool = getPool();
    if (!pool) {
      // In development, just log using StructuredLoggingService
      StructuredLoggingService.info('[Audit]', { userId, action, resourceType, resourceId, details });
      return {
        id: `audit_${Date.now()}`,
        userId,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date(),
        ipAddress,
        userAgent,
      };
    }

    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO audit_logs (
        id, user_id, action, resource_type, 
        resource_id, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent,
    ]);

    return this.formatAuditLog(result.rows[0]);
  }

  /**
   * Get audit logs for a user (for transparency/compliance)
   * @deprecated Use auditService.ts which uses Supabase client
   * This method is kept for backward compatibility
   */
  static async getUserAuditLogs(userId: string, limit = 100) {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(500, `Failed to get audit logs: ${error.message}`);
    }

    return (data || []).map((row: any) => this.formatAuditLog(row));
  }

  private static formatAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: typeof row.details === 'string' ? JSON.parse(row.details || '{}') : (row.details || {}),
      timestamp: new Date(row.created_at),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    };
  }
}

/**
 * Structured Logging Service
 * Provides JSON-formatted logging with request correlation
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  orgId?: string;
  locationId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export class StructuredLoggingService {
  /**
   * Get request ID from request or generate new one
   */
  static getRequestId(req?: Request): string {
    if (req) {
      return (req.headers['x-request-id'] as string) || 
        `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Extract context from request
   */
  static extractContext(req?: Request): LogContext {
    const context: LogContext = {};
    
    if (req) {
      context.requestId = this.getRequestId(req);
      context.method = req.method;
      context.path = req.path;
      context.ip = req.ip || req.socket.remoteAddress;
      context.userAgent = req.headers['user-agent'];
      
      // Extract auth context if available
      if ((req as any).auth) {
        context.userId = (req as any).auth.userId;
        context.orgId = (req as any).auth.orgId;
        context.locationId = (req as any).auth.locationId;
      }
    }
    
    return context;
  }

  /**
   * Format log entry as JSON
   */
  private static formatLog(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: Error
  ): string {
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 10).join('\n'), // First 10 lines
      };
      
      // Extract additional error properties
      if ((error as any).code) logEntry.error.code = (error as any).code;
      if ((error as any).statusCode) logEntry.error.statusCode = (error as any).statusCode;
      if ((error as any).supabase) logEntry.error.supabase = (error as any).supabase;
    }

    return JSON.stringify(logEntry);
  }

  /**
   * Log debug message
   */
  static debug(message: string, context: LogContext = {}, req?: Request): void {
    const fullContext = { ...this.extractContext(req), ...context };
    if (config.nodeEnv === 'development' || process.env.DEBUG_LOGS === 'true') {
      console.debug(this.formatLog('debug', message, fullContext));
    }
  }

  /**
   * Log info message
   */
  static info(message: string, context: LogContext = {}, req?: Request): void {
    const fullContext = { ...this.extractContext(req), ...context };
    console.log(this.formatLog('info', message, fullContext));
  }

  /**
   * Log warning message
   */
  static warn(message: string, context: LogContext = {}, req?: Request): void {
    const fullContext = { ...this.extractContext(req), ...context };
    console.warn(this.formatLog('warn', message, fullContext));
  }

  /**
   * Log error message
   */
  static error(
    message: string,
    error?: Error,
    context: LogContext = {},
    req?: Request
  ): void {
    const fullContext = { ...this.extractContext(req), ...context };
    console.error(this.formatLog('error', message, fullContext, error));
  }

  /**
   * Log request start
   */
  static logRequest(req: Request): void {
    const context = this.extractContext(req);
    this.info(`Request started: ${req.method} ${req.path}`, context, req);
  }

  /**
   * Log request completion
   */
  static logRequestComplete(
    req: Request,
    statusCode: number,
    durationMs: number
  ): void {
    const context = {
      ...this.extractContext(req),
      statusCode,
      durationMs,
    };
    
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `Request completed: ${req.method} ${req.path} - ${statusCode} (${durationMs}ms)`;
    
    if (level === 'warn') {
      this.warn(message, context, req);
    } else {
      this.info(message, context, req);
    }
  }
}
