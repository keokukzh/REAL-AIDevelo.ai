import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WorkflowOrchestrator } from '../engine/WorkflowOrchestrator.js';
import { ExecutionStore } from '../monitoring/ExecutionStore.js';
import { WorkflowMonitor } from '../monitoring/WorkflowMonitor.js';
import { AlertManager } from '../monitoring/AlertManager.js';
import { Workflow } from '../types.js';
import { URL } from 'url';

/**
 * Webhook trigger server for executing workflows via HTTP webhooks
 */
export class WebhookTrigger {
  private server: ReturnType<typeof createServer> | null = null;
  private workflows: Map<string, string>; // path -> workflow file path
  private orchestrator: WorkflowOrchestrator;
  private executionStore: ExecutionStore;
  private monitor: WorkflowMonitor;
  private alertManager: AlertManager;
  private port: number;

  constructor(
    port: number = 3000,
    executionStore?: ExecutionStore,
    monitor?: WorkflowMonitor,
    alertManager?: AlertManager
  ) {
    this.port = port;
    this.workflows = new Map();
    this.executionStore = executionStore || new ExecutionStore();
    this.monitor = monitor || new WorkflowMonitor(this.executionStore);
    this.alertManager = alertManager || new AlertManager(this.monitor);
    
    const logger = (message: string, level?: 'info' | 'warn' | 'error') => {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} ${message}`);
    };
    
    this.orchestrator = new WorkflowOrchestrator(logger, this.executionStore);
  }

  /**
   * Register a workflow for a webhook path
   */
  registerWorkflow(webhookPath: string, workflowPath: string): void {
    // Normalize path (ensure it starts with /)
    const normalizedPath = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
    this.workflows.set(normalizedPath, workflowPath);
    console.log(`Registered webhook: ${normalizedPath} -> ${workflowPath}`);
  }

  /**
   * Start the webhook server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        await this.handleRequest(req, res);
      });

      this.server.listen(this.port, () => {
        console.log(`Webhook server listening on port ${this.port}`);
        console.log(`Registered webhooks: ${Array.from(this.workflows.keys()).join(', ')}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the webhook server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Webhook server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming HTTP request
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const path = url.pathname;

      // Only handle POST requests
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }

      // Find workflow for this path
      const workflowPath = this.workflows.get(path);
      if (!workflowPath) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No workflow registered for path: ${path}` }));
        return;
      }

      // Read request body
      const body = await this.readRequestBody(req);
      
      // Parse webhook payload (if JSON)
      let payload: unknown = null;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(body);
        } catch {
          // Invalid JSON, use raw body
        }
      }

      // Execute workflow
      console.log(`[Webhook] Executing workflow: ${workflowPath} (path: ${path})`);
      
      try {
        const workflow = await this.orchestrator.loadWorkflow(workflowPath);
        
        // Merge webhook payload into environment
        const webhookEnv: Record<string, string> = {
          WEBHOOK_PATH: path,
          WEBHOOK_METHOD: req.method,
          WEBHOOK_PAYLOAD: JSON.stringify(payload || body),
          ...(req.headers['user-agent'] && { WEBHOOK_USER_AGENT: req.headers['user-agent'] })
        };

        // Add webhook headers as environment variables
        Object.entries(req.headers).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            webhookEnv[`WEBHOOK_HEADER_${key.toUpperCase().replace(/-/g, '_')}`] = value;
          }
        });

        const environment = { ...workflow.environment, ...webhookEnv };
        const execution = await this.orchestrator.execute(workflow);
        
        // Save execution
        await this.executionStore.saveExecution(execution);
        this.monitor.recordExecution(execution);
        await this.alertManager.checkAlerts(execution, workflow);

        // Send response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          executionId: execution.id,
          status: execution.status,
          workflow: workflow.name
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Webhook] Workflow execution failed: ${errorMessage}`);
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: errorMessage
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Webhook] Request handling failed: ${errorMessage}`);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: errorMessage
      }));
    }
  }

  /**
   * Read request body
   */
  private readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        resolve(body);
      });
      
      req.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Get registered webhook paths
   */
  getRegisteredPaths(): string[] {
    return Array.from(this.workflows.keys());
  }
}
