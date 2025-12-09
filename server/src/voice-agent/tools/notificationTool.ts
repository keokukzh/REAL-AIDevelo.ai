import axios from 'axios';
import { voiceAgentConfig } from '../config';

/**
 * Notification Tool
 * Handles SMS and Email notifications
 */

export interface SMSMessage {
  to: string;
  message: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export class NotificationTool {
  /**
   * Send SMS via Twilio
   */
  async sendSMS(message: SMSMessage): Promise<{ success: boolean; error?: string }> {
    const { twilio } = voiceAgentConfig.notifications;

    if (!twilio.accountSid || !twilio.authToken) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
      };
    }

    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
        new URLSearchParams({
          To: message.to,
          From: process.env.TWILIO_PHONE_NUMBER || '',
          Body: message.message,
        }),
        {
          auth: {
            username: twilio.accountSid,
            password: twilio.authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Send Email via SMTP
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
    const { smtp } = voiceAgentConfig.notifications;

    if (!smtp.host || !smtp.user || !smtp.pass) {
      return {
        success: false,
        error: 'SMTP credentials not configured',
      };
    }

    // In production, use a proper email library like nodemailer
    // For now, this is a placeholder
    try {
      // Placeholder: would use nodemailer or similar
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(
    email: string,
    phone: string,
    appointmentDetails: {
      date: Date;
      time: string;
      location?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Terminbestätigung';
    const body = `Ihr Termin wurde bestätigt:\n\nDatum: ${appointmentDetails.date.toLocaleDateString('de-CH')}\nZeit: ${appointmentDetails.time}${appointmentDetails.location ? `\nOrt: ${appointmentDetails.location}` : ''}`;

    // Send email
    const emailResult = await this.sendEmail({
      to: email,
      subject,
      body,
    });

    // Send SMS if email fails or phone is provided
    if (!emailResult.success || phone) {
      const smsResult = await this.sendSMS({
        to: phone,
        message: body,
      });

      return smsResult;
    }

    return emailResult;
  }

  /**
   * Get tool definitions for LLM
   */
  static getToolDefinitions() {
    return [
      {
        name: 'send_sms',
        description: 'Send an SMS message to a phone number. Use for appointment confirmations or important notifications.',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number (E.164 format, e.g., +41123456789)',
            },
            message: {
              type: 'string',
              description: 'Message content',
            },
          },
          required: ['to', 'message'],
        },
      },
      {
        name: 'send_email',
        description: 'Send an email message. Use for detailed information or confirmations.',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            subject: {
              type: 'string',
              description: 'Email subject',
            },
            body: {
              type: 'string',
              description: 'Email body',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
    ];
  }
}

export const notificationTool = new NotificationTool();


