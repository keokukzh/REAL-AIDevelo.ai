import nodemailer from 'nodemailer';
import { config } from '../config/env';

const ENABLE_EMAIL = process.env.ENABLE_EMAIL !== 'false'; // Default true if SMTP configured

interface SendMailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize SMTP transporter
 */
function initializeTransporter(): nodemailer.Transporter | null {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@aidevelo.ai';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[EmailService] SMTP not configured - email sending disabled');
    return null;
  }

  try {
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log(`[EmailService] SMTP configured: ${smtpHost}:${smtpPort} (from: ${smtpFrom})`);
    return transport;
  } catch (error: any) {
    console.error('[EmailService] Failed to initialize transporter:', error.message);
    return null;
  }
}

/**
 * Send email with optional PDF attachment
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  if (!ENABLE_EMAIL) {
    console.warn('[EmailService] Email sending disabled (ENABLE_EMAIL=false)');
    return { success: false, error: 'Email sending disabled' };
  }

  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    console.error('[EmailService] Cannot send email - SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@aidevelo.ai';

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
      attachments: options.attachments || [],
    });

    const attachmentSize = options.attachments?.reduce((sum, att) => sum + att.content.length, 0) || 0;
    console.log(`[EmailService] sent to=${options.to.join(',')} bytes=${attachmentSize} subject="${options.subject}" messageId=${info.messageId}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[EmailService] Failed to send email to ${options.to.join(',')}:`, error.message);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
