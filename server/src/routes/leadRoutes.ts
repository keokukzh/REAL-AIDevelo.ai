import express, { Request, Response, NextFunction } from 'express';
import { StructuredLoggingService } from '../services/loggingService';
import { supabaseAdmin } from '../services/supabaseDb';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Rate limiting map (in-memory, per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

// Rate limit middleware
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    StructuredLoggingService.warn('Rate limit exceeded for lead submission', { ip });
    return res.status(429).json({
      success: false,
      error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
    });
  }

  record.count++;
  next();
};

// Validation helper
const validateLeadData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name ist erforderlich (mindestens 2 Zeichen)');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('E-Mail ist erforderlich');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Ungültige E-Mail-Adresse');
  }

  const validInterests = ['webdesign', 'voice', 'both'];
  if (!data.interest || !validInterests.includes(data.interest)) {
    errors.push('Interesse muss webdesign, voice oder both sein');
  }

  // Check for spam indicators
  if (data.name && (data.name.includes('http://') || data.name.includes('https://'))) {
    errors.push('Ungültiger Name');
  }

  if (data.message && data.message.length > 5000) {
    errors.push('Nachricht ist zu lang (max. 5000 Zeichen)');
  }

  return { valid: errors.length === 0, errors };
};

// Fallback: Save to JSON file if database is not available
const saveToJsonFallback = async (leadData: any): Promise<void> => {
  const dataDir = path.join(__dirname, '../../data');
  const filePath = path.join(dataDir, 'leads.json');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let leads: any[] = [];

  // Read existing leads
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      leads = JSON.parse(fileContent);
    } catch (error) {
      StructuredLoggingService.warn('Could not parse existing leads.json, starting fresh');
      leads = [];
    }
  }

  // Add new lead with ID and timestamp
  const newLead = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    ...leadData,
    created_at: new Date().toISOString(),
  };

  leads.push(newLead);

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');

  StructuredLoggingService.info('Lead saved to JSON fallback', { id: newLead.id });
};

// Optional: Send email notification
const sendEmailNotification = async (leadData: any): Promise<void> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const notifyEmail = process.env.LEAD_NOTIFY_EMAIL;

  // Skip if SMTP is not configured
  if (!smtpHost || !smtpUser || !smtpPass || !notifyEmail) {
    StructuredLoggingService.info('Email notification skipped - SMTP not configured');
    return;
  }

  try {
    // Dynamic import of nodemailer (optional dependency)
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: notifyEmail,
      subject: `Neue Lead-Anfrage: ${leadData.name} (${leadData.interest})`,
      html: `
        <h2>Neue Lead-Anfrage über AIDevelo.ai</h2>
        <p><strong>Name:</strong> ${leadData.name}</p>
        <p><strong>E-Mail:</strong> ${leadData.email}</p>
        <p><strong>Unternehmen:</strong> ${leadData.company || 'Nicht angegeben'}</p>
        <p><strong>Interesse:</strong> ${leadData.interest}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${leadData.message || 'Keine Nachricht'}</p>
        <hr>
        <p><em>Quelle: ${leadData.source || 'Website'}</em></p>
      `,
    });

    StructuredLoggingService.info('Email notification sent', { to: notifyEmail });
  } catch (error) {
    StructuredLoggingService.error('Failed to send email notification', error as Error);
    // Don't throw - email is optional
  }
};

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Submit a new lead
 *     description: Captures lead information from the landing page contact form
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - interest
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the lead
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               company:
 *                 type: string
 *                 description: Company name (optional)
 *               interest:
 *                 type: string
 *                 enum: [webdesign, voice, both]
 *                 description: Area of interest
 *               message:
 *                 type: string
 *                 description: Optional message
 *               source:
 *                 type: string
 *                 description: Source of the lead (e.g., ultra-landing)
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/', rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, company, interest, message, source } = req.body;

    // Validate input
    const validation = validateLeadData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
      });
    }

    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      interest,
      message: message?.trim() || null,
      source: source || 'website',
    };

    StructuredLoggingService.info('Processing new lead submission', {
      email: leadData.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Redact email for logs
      interest: leadData.interest,
      source: leadData.source,
    });

    // Try to save to database first
    let savedToDb = false;

    try {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert([
          {
            name: leadData.name,
            email: leadData.email,
            company: leadData.company,
            interest: leadData.interest,
            message: leadData.message,
            source: leadData.source,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      savedToDb = true;
      StructuredLoggingService.info('Lead saved to database', { id: data?.id });
    } catch (dbError) {
      StructuredLoggingService.warn('Database save failed, using JSON fallback', {
        error: (dbError as Error).message,
      });

      // Fallback to JSON file
      await saveToJsonFallback(leadData);
    }

    // Try to send email notification (optional, non-blocking)
    sendEmailNotification(leadData).catch((err) => {
      StructuredLoggingService.error('Email notification failed', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Vielen Dank! Wir melden uns innerhalb von 24 Stunden.',
    });
  } catch (error) {
    StructuredLoggingService.error('Error processing lead submission', error as Error);

    return res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads (admin only)
 *     description: Retrieves all leads - requires authentication
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leads
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response) => {
  // This endpoint should be protected by auth middleware in production
  // For now, we'll just check for a simple API key or skip in dev
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (process.env.NODE_ENV === 'production' && apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    // Try JSON fallback
    try {
      const filePath = path.join(__dirname, '../../data/leads.json');
      if (fs.existsSync(filePath)) {
        const leads = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return res.json({
          success: true,
          data: leads,
          source: 'json-fallback',
        });
      }
    } catch (jsonError) {
      // Ignore
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve leads',
    });
  }
});

export default router;
