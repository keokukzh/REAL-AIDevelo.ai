import { getPool } from './database';
import { AppError } from '../utils/errors';
import { Request } from 'express';
import { config } from '../config/env';

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
   */
  static async logCall(record: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const pool = getPool();
    if (!pool) {
      throw new AppError(503, 'Database connection not available');
    }

    const id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO call_logs (
        id, agent_id, customer_id, phone_number, 
        start_time, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      record.agentId,
      record.customerId,
      record.phoneNumber,
      record.startTime,
      record.status,
    ]);

    return this.formatCallRecord(result.rows[0]);
  }

  /**
   * Update call record (end time, duration, result, etc.)
   */
  static async updateCall(
    callId: string,
    updates: Partial<Omit<CallRecord, 'id'>>
  ): Promise<CallRecord> {
    const pool = getPool();
    if (!pool) {
      throw new AppError(503, 'Database connection not available');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.endTime) {
      fields.push(`end_time = $${paramIndex}`);
      values.push(updates.endTime);
      paramIndex++;
    }
    if (updates.duration !== undefined) {
      fields.push(`duration = $${paramIndex}`);
      values.push(updates.duration);
      paramIndex++;
    }
    if (updates.status) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }
    if (updates.recordingUrl) {
      fields.push(`recording_url = $${paramIndex}`);
      values.push(updates.recordingUrl);
      paramIndex++;
    }
    if (updates.transcription) {
      fields.push(`transcription = $${paramIndex}`);
      values.push(updates.transcription);
      paramIndex++;
    }
    if (updates.successRate !== undefined) {
      fields.push(`success_rate = $${paramIndex}`);
      values.push(updates.successRate);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(callId);

    const query = `
      UPDATE call_logs 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new AppError(404, `Call ${callId} not found`);
    }

    return this.formatCallRecord(result.rows[0]);
  }

  /**
   * Get call metrics for an agent
   */
  static async getAgentMetrics(agentId: string, days = 7) {
    const pool = getPool();
    if (!pool) {
      throw new AppError(503, 'Database connection not available');
    }

    const query = `
      SELECT
        COUNT(*) as total_calls,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
        AVG(duration) as avg_duration,
        AVG(success_rate) as avg_success_rate,
        MAX(start_time) as last_call
      FROM call_logs
      WHERE agent_id = $1
      AND start_time >= NOW() - INTERVAL '${days} days'
    `;

    const result = await pool.query(query, [agentId]);
    return result.rows[0] || null;
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
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
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
      // In development, just log to console
      console.log('[Audit]', { userId, action, resourceType, resourceId, details });
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
   */
  static async getUserAuditLogs(userId: string, limit = 100) {
    const pool = getPool();
    if (!pool) {
      throw new AppError(503, 'Database connection not available');
    }

    const query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows.map((row: any) => this.formatAuditLog(row));
  }

  private static formatAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: JSON.parse(row.details || '{}'),
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
