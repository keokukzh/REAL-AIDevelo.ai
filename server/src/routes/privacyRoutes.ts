import { Router, Request, Response } from 'express';
import { getPool } from '../services/database';
import { AppError } from '../utils/errors';
import { AuditLoggingService, CallLoggingService } from '../services/loggingService';

const router = Router();

/**
 * POST /api/privacy/export-data
 * Export all user data (GDPR/nDSG compliance)
 */
router.post('/export-data', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId and email are required',
      });
    }

    const pool = getPool();
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    // Fetch all user data
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userResult.rows[0];

    // Fetch agents
    const agentsQuery = 'SELECT * FROM agents WHERE user_id = $1';
    const agentsResult = await pool.query(agentsQuery, [userId]);

    // Fetch call logs
    const callLogsQuery = `
      SELECT cl.* FROM call_logs cl
      JOIN agents a ON cl.agent_id = a.id
      WHERE a.user_id = $1
    `;
    const callLogsResult = await pool.query(callLogsQuery, [userId]);

    // Fetch audit logs
    const auditLogsQuery = 'SELECT * FROM audit_logs WHERE user_id = $1';
    const auditLogsResult = await pool.query(auditLogsQuery, [userId]);

    // Fetch RAG documents
    const ragQuery = `
      SELECT rd.* FROM rag_documents rd
      JOIN agents a ON rd.agent_id = a.id
      WHERE a.user_id = $1
    `;
    const ragResult = await pool.query(ragQuery, [userId]);

    // Compile data export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData,
      agents: agentsResult.rows,
      callLogs: callLogsResult.rows,
      auditLogs: auditLogsResult.rows,
      documents: ragResult.rows,
    };

    // Log the export action
    await AuditLoggingService.logAction(
      userId,
      'export_data',
      'user_data',
      userId,
      { email, exportDate: new Date().toISOString() },
      req.ip
    );

    // Return JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${Date.now()}.json"`);
    res.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error('[Privacy] Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/privacy/delete-data
 * Delete all user data (right to be forgotten - GDPR/nDSG)
 * 
 * ⚠️ WARNING: This is a destructive operation and cannot be undone!
 * Requires explicit confirmation and will delete:
 * - User account and profile
 * - All agents
 * - All call logs
 * - All documents
 * - All audit logs (for compliance, some may be retained)
 */
router.post('/delete-data', async (req: Request, res: Response) => {
  try {
    const { userId, confirmDeletion, email } = req.body;

    if (!userId || !email || confirmDeletion !== true) {
      return res.status(400).json({
        success: false,
        error: 'userId, email, and confirmDeletion=true are required. This action is irreversible.',
      });
    }

    const pool = getPool();
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    // Check user exists
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify email matches
    if (userResult.rows[0].email !== email) {
      return res.status(403).json({
        success: false,
        error: 'Email does not match user account',
      });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Log deletion before we delete everything
      await AuditLoggingService.logAction(
        userId,
        'delete_user_data',
        'user_data',
        userId,
        {
          email,
          timestamp: new Date().toISOString(),
          deleted_items: ['user', 'agents', 'calls', 'documents'],
        },
        req.ip
      );

      // Delete in order (respecting foreign keys)
      // 1. Delete RAG documents
      await client.query(
        `DELETE FROM rag_documents 
         WHERE agent_id IN (SELECT id FROM agents WHERE user_id = $1)`,
        [userId]
      );

      // 2. Delete call logs
      await client.query(
        `DELETE FROM call_logs 
         WHERE agent_id IN (SELECT id FROM agents WHERE user_id = $1)`,
        [userId]
      );

      // 3. Delete agents
      await client.query('DELETE FROM agents WHERE user_id = $1', [userId]);

      // 4. Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // 5. Audit logs are kept for legal compliance (anonymized if needed)
      // In production, you might anonymize personal data instead of deleting
      await client.query(
        `UPDATE audit_logs 
         SET user_id = 'DELETED_USER', details = '{}' 
         WHERE user_id = $1`,
        [userId]
      );

      await client.query('COMMIT');

      console.log(`[Privacy] Deleted all data for user ${userId}`);

      res.json({
        success: true,
        message: 'All user data has been permanently deleted',
        data: {
          userId,
          deletedAt: new Date().toISOString(),
          deletedItems: ['user_profile', 'agents', 'call_logs', 'documents'],
          auditLogsRetained: 'Audit logs retained for legal compliance (anonymized)',
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[Privacy] Deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/privacy/audit-log
 * Get user's audit log (transparency - what data has been accessed/modified)
 */
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
      });
    }

    const auditLogs = await AuditLoggingService.getUserAuditLogs(userId, 1000);

    res.json({
      success: true,
      data: {
        userId,
        auditLogCount: auditLogs.length,
        auditLogs,
        message:
          'This log shows all actions performed on your account for transparency and compliance.',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/privacy/policy
 * Get privacy policy and compliance information
 */
router.get('/policy', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'AIDevelo.ai Privacy Policy & Compliance',
      lastUpdated: '2024-12-11',
      jurisdiction: 'Switzerland (nDSG - Bundesgesetz über den Datenschutz)',
      dataController: 'AIDevelo.ai GmbH',
      contactEmail: 'privacy@aidevelo.ai',
      sections: {
        dataCollection: {
          title: 'What data we collect',
          items: [
            'Agent configuration (company name, industry, contact info)',
            'Voice call recordings and transcriptions',
            'User interaction metrics (duration, success rate)',
            'System logs and audit trails',
            'API usage and analytics',
          ],
        },
        dataUsage: {
          title: 'How we use your data',
          items: [
            'Provide and improve voice agent services',
            'Analytics and performance monitoring',
            'Compliance and legal obligations',
            'Security and fraud prevention',
            'Customer support',
          ],
        },
        dataRetention: {
          title: 'How long we keep your data',
          items: [
            'Call logs: 90 days (configurable)',
            'Audit logs: 1 year (for legal compliance)',
            'Agent configuration: Until deletion',
            'Documents/RAG: Until deletion',
          ],
        },
        userRights: {
          title: 'Your rights under nDSG',
          items: [
            '✓ Right to access: /api/privacy/export-data',
            '✓ Right to deletion: /api/privacy/delete-data',
            '✓ Right to audit log: /api/privacy/audit-log',
            '✓ Data portability: JSON export format',
            '✓ Right to object: Contact privacy@aidevelo.ai',
          ],
        },
        security: {
          title: 'Security Measures',
          items: [
            'End-to-end encryption for voice data',
            'Role-based access control (RBAC)',
            'Regular security audits',
            'Compliance with nDSG requirements',
            'HTTPS/TLS for all communications',
          ],
        },
      },
      contact: {
        dataProtectionOfficer: 'privacy@aidevelo.ai',
        legalRepresentative: 'contact@aidevelo.ai',
        responseTime: '30 days (nDSG requirement)',
      },
    },
  });
});

export default router;
