import { WorkflowExecution, Workflow } from '../types.js';
import { WorkflowMonitor } from './WorkflowMonitor.js';

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
        // Slack webhook integration can be added
        console.log(`[SLACK ALERT: ${alertName}] ${message}`);
        break;
      case 'email':
        // Email integration can be added
        console.log(`[EMAIL ALERT: ${alertName}] ${message}`);
        break;
      default:
        console.log(`[ALERT: ${alertName}] ${message}`);
    }
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: AlertConfig): void {
    this.config = config;
  }
}

