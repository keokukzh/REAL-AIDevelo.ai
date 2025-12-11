import { getPool } from './database';
import { AppError } from '../utils/errors';

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
    return result.rows.map((row) => this.formatCallRecord(row));
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
    return result.rows.map((row) => this.formatAuditLog(row));
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
