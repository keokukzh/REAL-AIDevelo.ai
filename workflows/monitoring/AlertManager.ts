import { WorkflowExecution, Workflow } from '../types.js';
import { WorkflowMonitor } from './WorkflowMonitor.js';
import axios from 'axios';

export interface Alert {
  name: string;
  condition: string;
  channels: string[];
  template: string;
}

export interface AlertConfig {
  alerts: Alert[];
}

/**
 * Manage alerts and notifications for workflow executions
 */
export class AlertManager {
  private monitor: WorkflowMonitor;
  private config: AlertConfig;

  constructor(monitor: WorkflowMonitor, config?: AlertConfig) {
    this.monitor = monitor;
    this.config = config || {
      alerts: [
        {
          name: 'workflow-failure',
          condition: 'execution.status === "failed"',
          channels: ['console'],
          template: 'Workflow ${workflow.name} failed: ${error.message}'
        },
        {
          name: 'high-failure-rate',
          condition: 'metrics.successRate < 90',
          channels: ['console'],
          template: 'Workflow success rate dropped to ${metrics.successRate}%'
        },
        {
          name: 'long-duration',
          condition: 'execution.duration > workflow.expected_duration * 2',
          channels: ['console'],
          template: 'Workflow taking unusually long: ${execution.duration}ms'
        }
      ]
    };
  }

  /**
   * Check and send alerts for an execution
   */
  async checkAlerts(
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<void> {
    const metrics = this.monitor.getHealthReport();
    
    for (const alert of this.config.alerts) {
      try {
        const shouldAlert = this.evaluateCondition(
          alert.condition,
          execution,
          workflow,
          metrics
        );
        
        if (shouldAlert) {
          await this.sendAlert(alert, execution, workflow, metrics);
        }
      } catch (error) {
        console.warn(`Failed to evaluate alert ${alert.name}:`, error);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    condition: string,
    execution: WorkflowExecution,
    workflow: Workflow,
    metrics: ReturnType<WorkflowMonitor['getHealthReport']>
  ): boolean {
    try {
      // Replace template variables
      let expr = condition;
      
      // Replace execution variables
      expr = expr.replace(/\$\{execution\.(\w+)\}/g, (_, prop) => {
        const value = (execution as any)[prop];
        return value !== undefined ? JSON.stringify(value) : 'undefined';
      });
      
      // Replace workflow variables
      expr = expr.replace(/\$\{workflow\.(\w+)\}/g, (_, prop) => {
        const value = (workflow as any)[prop];
        return value !== undefined ? JSON.stringify(value) : 'undefined';
      });
      
      // Replace metrics variables
      expr = expr.replace(/\$\{metrics\.(\w+)\}/g, (_, prop) => {
        const value = (metrics.overall as any)[prop];
        return value !== undefined ? JSON.stringify(value) : 'undefined';
      });
      
      // Evaluate condition
      // Use truthiness evaluation to handle both boolean and truthy/falsy values
      return !!eval(expr);
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(
    alert: Alert,
    execution: WorkflowExecution,
    workflow: Workflow,
    metrics: ReturnType<WorkflowMonitor['getHealthReport']>
  ): Promise<void> {
    const message = this.formatMessage(alert.template, execution, workflow, metrics);
    
    for (const channel of alert.channels) {
      try {
        await this.sendToChannel(channel, message, alert.name);
      } catch (error) {
        console.warn(`Failed to send alert to ${channel}:`, error);
      }
    }
  }

  /**
   * Format alert message from template
   */
  private formatMessage(
    template: string,
    execution: WorkflowExecution,
    workflow: Workflow,
    metrics: ReturnType<WorkflowMonitor['getHealthReport']>
  ): string {
    let message = template;
    
    // Replace execution variables
    message = message.replace(/\$\{execution\.(\w+)\}/g, (_, prop) => {
      const value = (execution as any)[prop];
      return value !== undefined ? String(value) : '';
    });
    
    // Replace workflow variables
    message = message.replace(/\$\{workflow\.(\w+)\}/g, (_, prop) => {
      const value = (workflow as any)[prop];
      return value !== undefined ? String(value) : '';
    });
    
    // Replace metrics variables
    message = message.replace(/\$\{metrics\.(\w+)\}/g, (_, prop) => {
      const value = (metrics.overall as any)[prop];
      return value !== undefined ? String(value) : '';
    });
    
    // Replace error message
    message = message.replace(/\$\{error\.message\}/g, execution.error || 'Unknown error');
    
    return message;
  }

  /**
   * Send message to a specific channel
   */
  private async sendToChannel(
    channel: string,
    message: string,
    alertName: string
  ): Promise<void> {
    switch (channel) {
      case 'console':
        console.error(`[ALERT: ${alertName}] ${message}`);
        break;
      case 'file':
        // File logging can be implemented
        console.log(`[FILE ALERT: ${alertName}] ${message}`);
        break;
      case 'slack':
        await this.sendSlackNotification(message, alertName);
        break;
      case 'email':
        await this.sendEmailNotification(message, alertName);
        break;
      default:
        console.log(`[ALERT: ${alertName}] ${message}`);
    }
  }

  /**
   * Send Slack notification via webhook
   */
  private async sendSlackNotification(message: string, alertName: string): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('[ALERT] SLACK_WEBHOOK_URL not configured. Skipping Slack notification.');
      return;
    }

    try {
      await axios.post(webhookUrl, {
        text: message,
        username: 'Workflow Orchestrator',
        icon_emoji: ':gear:',
        channel: process.env.SLACK_CHANNEL || undefined
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ALERT] Failed to send Slack notification: ${errorMessage}`);
      throw new Error(`Slack notification failed: ${errorMessage}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(message: string, alertName: string): Promise<void> {
    const emailConfig = {
      smtp: {
        host: process.env.EMAIL_SMTP_HOST || process.env.SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || process.env.SMTP_PORT || '587', 10),
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SMTP_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASSWORD || process.env.SMTP_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM || 'workflow-orchestrator@localhost',
      to: process.env.EMAIL_TO || '',
      subject: `[Workflow Alert] ${alertName}`
    };

    // Check if email is configured
    if (!emailConfig.to) {
      console.warn('[ALERT] EMAIL_TO not configured. Skipping email notification.');
      return;
    }

    // Try to use nodemailer if available, otherwise use simple SMTP
    try {
      // Dynamic import to avoid requiring nodemailer as a dependency
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport(emailConfig.smtp);
      
      await transporter.sendMail({
        from: emailConfig.from,
        to: emailConfig.to,
        subject: emailConfig.subject,
        text: message,
        html: `<pre>${message}</pre>`
      });
    } catch (error) {
      // Fallback: Try SendGrid API if configured
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      if (sendGridApiKey) {
        try {
          await axios.post(
            'https://api.sendgrid.com/v3/mail/send',
            {
              personalizations: [{ to: [{ email: emailConfig.to }] }],
              from: { email: emailConfig.from },
              subject: emailConfig.subject,
              content: [
                { type: 'text/plain', value: message },
                { type: 'text/html', value: `<pre>${message}</pre>` }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${sendGridApiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
        } catch (sendGridError) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[ALERT] Failed to send email via SendGrid: ${errorMessage}`);
          throw new Error(`Email notification failed: ${errorMessage}`);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ALERT] Failed to send email: ${errorMessage}`);
        console.warn('[ALERT] Install nodemailer or configure SENDGRID_API_KEY for email support');
        throw new Error(`Email notification failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: AlertConfig): void {
    this.config = config;
  }
}

