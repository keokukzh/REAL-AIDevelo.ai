#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { WorkflowOrchestrator } from '../engine/WorkflowOrchestrator.js';
import { ExecutionStore } from '../monitoring/ExecutionStore.js';
import { WorkflowMonitor } from '../monitoring/WorkflowMonitor.js';
import { AlertManager } from '../monitoring/AlertManager.js';
import { WorkflowValidator } from '../engine/WorkflowValidator.js';
import { Workflow } from '../types.js';
import { DbExecutionStore } from '../monitoring/DbExecutionStore.js';
import { WebhookTrigger } from '../triggers/WebhookTrigger.js';
import { FileChangeTrigger } from '../triggers/FileChangeTrigger.js';
import cron from 'node-cron';
import { promises as fs } from 'fs';
import path from 'path';

const program = new Command();

// Initialize components
const dbUrl = process.env.WORKFLOW_DB_URL;
const executionStore = dbUrl
  ? new DbExecutionStore({
      connectionString: dbUrl,
      ssl: process.env.WORKFLOW_DB_SSL === 'true'
    })
  : new ExecutionStore();
const monitor = new WorkflowMonitor(executionStore);
const alertManager = new AlertManager(monitor);

// Logger function
const logger = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const colors = {
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red
  };
  console.log(colors[level](message));
};

const orchestrator = new WorkflowOrchestrator(logger, executionStore);

/**
 * Run a workflow
 */
program
  .command('run <workflow>')
  .description('Execute a workflow')
  .option('-e, --env <env>', 'Environment variables (key=value,key=value)')
  .action(async (workflowPath: string, options: { env?: string }) => {
    const spinner = ora('Loading workflow...').start();
    
    try {
      // Parse environment variables
      const env: Record<string, string> = {};
      if (options.env) {
        options.env.split(',').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            env[key.trim()] = value.trim();
          }
        });
      }

      // Load workflow
      const workflow = await orchestrator.loadWorkflow(workflowPath);
      spinner.succeed(`Loaded workflow: ${workflow.name}`);
      
      // Execute workflow
      spinner.start('Executing workflow...');
      const execution = await orchestrator.execute(workflow);
      
      // Save execution
      await executionStore.saveExecution(execution);
      
      // Record in monitor
      monitor.recordExecution(execution);
      
      // Check alerts
      await alertManager.checkAlerts(execution, workflow);
      
      spinner.stop();
      
      if (execution.status === 'completed') {
        console.log(chalk.green(`\n✓ Workflow completed successfully`));
        console.log(chalk.gray(`  Execution ID: ${execution.id}`));
        console.log(chalk.gray(`  Duration: ${(execution.duration! / 1000).toFixed(2)}s`));
      } else {
        console.log(chalk.red(`\n✗ Workflow failed`));
        console.log(chalk.gray(`  Execution ID: ${execution.id}`));
        if (execution.error) {
          console.log(chalk.red(`  Error: ${execution.error}`));
        }
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(`Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

/**
 * Validate a workflow
 */
program
  .command('validate <workflow>')
  .description('Validate a workflow definition')
  .action(async (workflowPath: string) => {
    const spinner = ora('Validating workflow...').start();
    
    try {
      const workflow = await orchestrator.loadWorkflow(workflowPath);
      orchestrator.validateWorkflow(workflow);
      
      spinner.succeed(chalk.green('Workflow is valid'));
      console.log(chalk.gray(`  Name: ${workflow.name}`));
      console.log(chalk.gray(`  Version: ${workflow.version}`));
      console.log(chalk.gray(`  Tasks: ${workflow.tasks.length}`));
    } catch (error) {
      spinner.fail(chalk.red(`Validation failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * Schedule a workflow
 */
program
  .command('schedule <workflow>')
  .description('Schedule a workflow to run on a cron schedule')
  .requiredOption('-c, --cron <schedule>', 'Cron expression (e.g., "0 2 * * *")')
  .option('-e, --env <env>', 'Environment variables')
  .action(async (workflowPath: string, options: { cron: string; env?: string }) => {
    const cronExpression = options.cron;
    
    if (!cron.validate(cronExpression)) {
      console.error(chalk.red(`Invalid cron expression: ${cronExpression}`));
      process.exit(1);
    }
    
    console.log(chalk.blue(`Scheduling workflow: ${workflowPath}`));
    console.log(chalk.gray(`  Schedule: ${cronExpression}`));
    
    // Parse environment variables
    const env: Record<string, string> = {};
    if (options.env) {
      options.env.split(',').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      });
    }
    
    // Schedule the workflow
    cron.schedule(cronExpression, async () => {
      console.log(chalk.blue(`\n[${new Date().toISOString()}] Running scheduled workflow: ${workflowPath}`));
      try {
        const workflow = await orchestrator.loadWorkflow(workflowPath);
        const execution = await orchestrator.execute(workflow);
        await executionStore.saveExecution(execution);
        monitor.recordExecution(execution);
        await alertManager.checkAlerts(execution, workflow);
        console.log(chalk.green(`Workflow completed: ${execution.status}`));
      } catch (error) {
        console.error(chalk.red(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
    
    console.log(chalk.green('Workflow scheduled successfully'));
    console.log(chalk.gray('Press Ctrl+C to stop'));
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nStopping scheduler...'));
      process.exit(0);
    });
  });

/**
 * Monitor workflows
 */
program
  .command('monitor')
  .description('Monitor workflow executions')
  .option('-l, --live', 'Live monitoring mode')
  .option('--workflow <name>', 'Filter by workflow name')
  .action(async (options: { live?: boolean; workflow?: string }) => {
    if (options.live) {
      console.log(chalk.blue('Live monitoring mode - Press Ctrl+C to exit\n'));
      
      const displayMetrics = async () => {
        console.clear();
        const healthReport = monitor.getHealthReport();
        
        console.log(chalk.bold('Workflow Health Report\n'));
        console.log(chalk.gray('Overall:'));
        console.log(`  Success Rate: ${chalk.green(healthReport.overall.successRate)}`);
        console.log(`  Total Runs: ${healthReport.overall.totalRuns}`);
        console.log(`  Avg Duration: ${healthReport.overall.averageDuration}\n`);
        
        if (healthReport.tasks.length > 0) {
          console.log(chalk.gray('Task Metrics:'));
          healthReport.tasks.slice(0, 10).forEach(task => {
            console.log(`  ${task.taskId}: ${task.runs} runs, ${task.failureRate}% failure rate`);
          });
        }
        
        const recent = await executionStore.getRecentExecutions(5);
        if (recent.length > 0) {
          console.log(chalk.gray('\nRecent Executions:'));
          recent.forEach(exec => {
            const statusColor = exec.status === 'completed' ? chalk.green : chalk.red;
            console.log(`  ${statusColor(exec.status)} ${exec.workflow} (${exec.id.substring(0, 8)})`);
          });
        }
      };
      
      // Initial display
      await displayMetrics();
      
      // Update every 5 seconds
      const interval = setInterval(displayMetrics, 5000);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.yellow('\nStopping monitor...'));
        process.exit(0);
      });
    } else {
      const healthReport = monitor.getHealthReport();
      console.log(chalk.bold('Workflow Health Report\n'));
      console.log(JSON.stringify(healthReport, null, 2));
    }
  });

/**
 * View execution history
 */
program
  .command('history')
  .description('View workflow execution history')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('-w, --workflow <name>', 'Filter by workflow name')
  .action(async (options: { limit?: string; workflow?: string }) => {
    const limit = parseInt(options.limit || '10', 10);
    
    let executions;
    if (options.workflow) {
      executions = await executionStore.getExecutionsByWorkflow(options.workflow);
    } else {
      executions = await executionStore.getRecentExecutions(limit);
    }
    
    if (executions.length === 0) {
      console.log(chalk.yellow('No executions found'));
      return;
    }
    
    console.log(chalk.bold(`\nExecution History (${executions.length} results)\n`));
    
    executions.forEach(exec => {
      const statusColor = exec.status === 'completed' ? chalk.green : 
                         exec.status === 'failed' ? chalk.red : 
                         chalk.yellow;
      const duration = exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'N/A';
      const date = new Date(exec.startTime).toLocaleString();
      
      console.log(`${statusColor(exec.status.padEnd(10))} ${exec.workflow.padEnd(20)} ${duration.padEnd(10)} ${date}`);
      console.log(chalk.gray(`  ID: ${exec.id}`));
      if (exec.error) {
        console.log(chalk.red(`  Error: ${exec.error}`));
      }
      console.log();
    });
  });

/**
 * Get execution status
 */
program
  .command('status <execution-id>')
  .description('Get status of a specific execution')
  .action(async (executionId: string) => {
    const execution = await executionStore.getExecution(executionId);
    
    if (!execution) {
      console.error(chalk.red(`Execution not found: ${executionId}`));
      process.exit(1);
    }
    
    const statusColor = execution.status === 'completed' ? chalk.green : 
                       execution.status === 'failed' ? chalk.red : 
                       chalk.yellow;
    
    console.log(chalk.bold('\nExecution Status\n'));
    console.log(`  ID: ${execution.id}`);
    console.log(`  Workflow: ${execution.workflow}`);
    console.log(`  Status: ${statusColor(execution.status)}`);
    console.log(`  Start Time: ${new Date(execution.startTime).toLocaleString()}`);
    if (execution.endTime) {
      console.log(`  End Time: ${new Date(execution.endTime).toLocaleString()}`);
      console.log(`  Duration: ${execution.duration ? (execution.duration / 1000).toFixed(2) + 's' : 'N/A'}`);
    }
    
    if (execution.error) {
      console.log(chalk.red(`  Error: ${execution.error}`));
    }
    
    console.log(chalk.bold('\nTasks:\n'));
    Object.values(execution.tasks).forEach(task => {
      const taskStatusColor = task.status === 'completed' ? chalk.green : 
                             task.status === 'failed' ? chalk.red : 
                             chalk.yellow;
      console.log(`  ${taskStatusColor(task.status.padEnd(10))} ${task.name}`);
      if (task.error) {
        console.log(chalk.red(`    Error: ${task.error}`));
      }
      if (task.duration) {
        console.log(chalk.gray(`    Duration: ${(task.duration / 1000).toFixed(2)}s`));
      }
    });
  });

/**
 * Serve webhook server
 */
program
  .command('serve')
  .description('Start webhook server for workflow execution')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('-w, --workflow <workflow>', 'Workflow file path')
  .option('-P, --path <path>', 'Webhook path (e.g., /trigger/deploy)', '/webhook')
  .action(async (options: { port?: string; workflow?: string; path?: string }) => {
    const port = parseInt(options.port || '3000', 10);
    const webhookTrigger = new WebhookTrigger(port, executionStore, monitor, alertManager);

    if (options.workflow && options.path) {
      webhookTrigger.registerWorkflow(options.path, options.workflow);
    } else {
      // Scan workflows directory for webhook-triggered workflows
      try {
        const definitionsDir = path.join(process.cwd(), 'workflows', 'definitions');
        const files = await fs.readdir(definitionsDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const workflowPath = path.join(definitionsDir, file);
            const workflow = await orchestrator.loadWorkflow(workflowPath);
            
            if (workflow.trigger.type === 'webhook' && workflow.trigger.config?.webhook) {
              webhookTrigger.registerWorkflow(workflow.trigger.config.webhook, workflowPath);
            }
          }
        }
      } catch (error) {
        console.warn(chalk.yellow('Could not scan workflows directory:', error instanceof Error ? error.message : String(error)));
      }
    }

    try {
      await webhookTrigger.start();
      console.log(chalk.green(`\n✓ Webhook server started on port ${port}`));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));
      
      // Keep process alive
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nStopping webhook server...'));
        await webhookTrigger.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red(`Failed to start webhook server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * Create a new workflow from template
 */
program
  .command('create')
  .description('Create a new workflow from template')
  .requiredOption('-n, --name <name>', 'Workflow name')
  .option('-t, --template <template>', 'Template type (web-app, ci-cd, scheduled, custom)', 'custom')
  .option('-o, --output <output>', 'Output file path')
  .action(async (options: { name: string; template?: string; output?: string }) => {
    const templates: Record<string, Workflow> = {
      'web-app': {
        name: options.name,
        version: '1.0.0',
        description: 'Web application deployment workflow',
        trigger: { type: 'manual' },
        tasks: [
          {
            id: 'build',
            name: 'Build application',
            type: 'shell',
            command: 'npm run build',
            timeout: 600000
          },
          {
            id: 'test',
            name: 'Run tests',
            type: 'shell',
            command: 'npm run test',
            depends_on: ['build'],
            timeout: 300000
          },
          {
            id: 'deploy',
            name: 'Deploy to production',
            type: 'shell',
            command: 'npm run deploy',
            depends_on: ['test'],
            timeout: 600000
          }
        ]
      },
      'ci-cd': {
        name: options.name,
        version: '1.0.0',
        description: 'CI/CD pipeline workflow',
        trigger: { type: 'manual' },
        tasks: [
          {
            id: 'lint',
            name: 'Lint code',
            type: 'shell',
            command: 'npm run lint',
            timeout: 300000
          },
          {
            id: 'test',
            name: 'Run tests',
            type: 'shell',
            command: 'npm run test',
            depends_on: ['lint'],
            timeout: 300000
          },
          {
            id: 'build',
            name: 'Build application',
            type: 'shell',
            command: 'npm run build',
            depends_on: ['test'],
            timeout: 600000
          }
        ]
      },
      'scheduled': {
        name: options.name,
        version: '1.0.0',
        description: 'Scheduled maintenance workflow',
        trigger: {
          type: 'schedule',
          config: {
            schedule: '0 2 * * *' // Daily at 2 AM
          }
        },
        tasks: [
          {
            id: 'cleanup',
            name: 'Cleanup old files',
            type: 'shell',
            command: 'npm run cleanup',
            timeout: 300000
          }
        ]
      },
      'custom': {
        name: options.name,
        version: '1.0.0',
        description: 'Custom workflow',
        trigger: { type: 'manual' },
        tasks: [
          {
            id: 'task-1',
            name: 'First Task',
            type: 'shell',
            command: 'echo "Hello World"',
            timeout: 30000
          }
        ]
      }
    };

    const template = templates[options.template || 'custom'];
    if (!template) {
      console.error(chalk.red(`Unknown template: ${options.template}`));
      process.exit(1);
    }

    const outputPath = options.output || path.join(process.cwd(), 'workflows', 'definitions', `${options.name}.json`);
    
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(template, null, 2));
      console.log(chalk.green(`✓ Workflow created: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * Generate workflow from template type
 */
program
  .command('generate')
  .description('Generate workflow from template type')
  .requiredOption('-t, --type <type>', 'Template type (ci-cd, web-app, scheduled)')
  .option('-o, --output <output>', 'Output file path')
  .option('-n, --name <name>', 'Workflow name')
  .action(async (options: { type: string; output?: string; name?: string }) => {
    const workflowName = options.name || `${options.type}-workflow`;
    const outputPath = options.output || path.join(process.cwd(), 'workflows', 'definitions', `${workflowName}.json`);

    // Use create command logic
    const createOptions = {
      name: workflowName,
      template: options.type,
      output: outputPath
    };

    // Reuse create command logic
    const templates: Record<string, Workflow> = {
      'web-app': {
        name: workflowName,
        version: '1.0.0',
        description: 'Web application deployment workflow',
        trigger: { type: 'manual' },
        tasks: [
          {
            id: 'build',
            name: 'Build application',
            type: 'shell',
            command: 'npm run build',
            timeout: 600000
          },
          {
            id: 'test',
            name: 'Run tests',
            type: 'shell',
            command: 'npm run test',
            depends_on: ['build'],
            timeout: 300000
          },
          {
            id: 'deploy',
            name: 'Deploy to production',
            type: 'shell',
            command: 'npm run deploy',
            depends_on: ['test'],
            timeout: 600000
          }
        ]
      },
      'ci-cd': {
        name: workflowName,
        version: '1.0.0',
        description: 'CI/CD pipeline workflow',
        trigger: { type: 'manual' },
        tasks: [
          {
            id: 'lint',
            name: 'Lint code',
            type: 'shell',
            command: 'npm run lint',
            timeout: 300000
          },
          {
            id: 'test',
            name: 'Run tests',
            type: 'shell',
            command: 'npm run test',
            depends_on: ['lint'],
            timeout: 300000
          },
          {
            id: 'build',
            name: 'Build application',
            type: 'shell',
            command: 'npm run build',
            depends_on: ['test'],
            timeout: 600000
          }
        ]
      },
      'scheduled': {
        name: workflowName,
        version: '1.0.0',
        description: 'Scheduled maintenance workflow',
        trigger: {
          type: 'schedule',
          config: {
            schedule: '0 2 * * *'
          }
        },
        tasks: [
          {
            id: 'cleanup',
            name: 'Cleanup old files',
            type: 'shell',
            command: 'npm run cleanup',
            timeout: 300000
          }
        ]
      }
    };

    const template = templates[options.type];
    if (!template) {
      console.error(chalk.red(`Unknown template type: ${options.type}`));
      console.log(chalk.gray('Available types: ci-cd, web-app, scheduled'));
      process.exit(1);
    }

    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(template, null, 2));
      console.log(chalk.green(`✓ Workflow generated: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to generate workflow: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program
  .name('workflow')
  .description('Workflow Orchestrator CLI')
  .version('1.0.0');

program.parse();

