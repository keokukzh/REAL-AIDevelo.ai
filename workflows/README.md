# Workflow Orchestrator

Enterprise-grade workflow orchestration system for AIDevelo.ai that automates CI/CD pipelines, scheduled tasks, and development workflows.

## Features

- **Dependency Management**: Automatic task dependency resolution and execution ordering
- **Multiple Task Types**: Shell, HTTP, Docker, JavaScript/TypeScript execution
- **Conditional Execution**: Run tasks based on conditions and environment variables
- **Parallel Execution**: Execute independent tasks in parallel
- **Retry Logic**: Automatic retry with configurable attempts and delays
- **Monitoring**: Track execution history, metrics, and health reports
- **Alerting**: Configurable alerts for failures and anomalies
- **Scheduling**: Cron-based scheduling for automated workflows
- **CLI Interface**: Comprehensive command-line interface

## Quick Start

### Installation

Dependencies are already installed. The workflow orchestrator is ready to use.

### Running a Workflow

```bash
# Run a workflow
npm run workflow:run workflows/definitions/ci-cd-workflow.json

# With environment variables
npm run workflow:run workflows/definitions/ci-cd-workflow.json -- --env DEPLOY_FRONTEND=true,DEPLOY_BACKEND=true
```

### Validating a Workflow

```bash
npm run workflow:validate workflows/definitions/ci-cd-workflow.json
```

### Monitoring

```bash
# View execution history
npm run workflow:history

# Live monitoring
npm run workflow:monitor -- --live

# Get execution status
npm run workflow:status <execution-id>
```

### Scheduling

```bash
# Schedule a workflow (runs in foreground)
npm run workflow:schedule workflows/definitions/scheduled-tasks.json -- --cron "0 */6 * * *"
```

## Workflow Definitions

### CI/CD Workflow

Complete build, test, and deployment pipeline:

```bash
npm run workflow:run workflows/definitions/ci-cd-workflow.json
```

**Tasks:**
- Pre-build validation
- Build frontend (Vite)
- Build backend (TypeScript)
- Generate API documentation
- Validate build outputs
- Deploy frontend (Cloudflare Pages)
- Deploy backend

**Environment Variables:**
- `DEPLOY_FRONTEND=true` - Enable frontend deployment
- `DEPLOY_BACKEND=true` - Enable backend deployment
- `GENERATE_DOCS=false` - Skip documentation generation
- `NOTIFY_ON_SUCCESS=true` - Send success notifications

### Scheduled Tasks Workflow

Health checks, cleanup, and maintenance:

```bash
npm run workflow:run workflows/definitions/scheduled-tasks.json
```

**Tasks:**
- Health check API endpoint
- Health check frontend
- Regenerate API documentation
- Clean up old log files
- Clean up build artifacts

**Environment Variables:**
- `REGENERATE_DOCS=true` - Regenerate documentation
- `CLEANUP_LOGS=true` - Clean up old logs
- `CLEANUP_BUILDS=true` - Clean up build artifacts

### Development Workflow

Development automation tasks:

```bash
npm run workflow:run workflows/definitions/development-workflow.json
```

**Tasks:**
- Generate OpenAPI specification
- Validate TypeScript types (frontend & backend)
- Install dependencies (frontend & backend)
- Verify development setup

## Creating Custom Workflows

### Basic Workflow Structure

```json
{
  "name": "my-workflow",
  "version": "1.0.0",
  "description": "My custom workflow",
  "trigger": {
    "type": "manual"
  },
  "tasks": [
    {
      "id": "task-1",
      "name": "First Task",
      "type": "shell",
      "command": "echo 'Hello World'",
      "timeout": 300
    },
    {
      "id": "task-2",
      "name": "Second Task",
      "type": "shell",
      "command": "npm run build",
      "depends_on": ["task-1"],
      "timeout": 600
    }
  ]
}
```

### Task Types

#### Shell Task

Execute shell commands:

```json
{
  "id": "build",
  "name": "Build application",
  "type": "shell",
  "command": "npm run build",
  "timeout": 600,
  "cwd": ".",
  "live_output": true,
  "retry": {
    "attempts": 3,
    "delay": 5000
  }
}
```

#### HTTP Task

Make HTTP requests:

```json
{
  "id": "health-check",
  "name": "Health check",
  "type": "http",
  "url": "http://localhost:5000/health",
  "method": "GET",
  "timeout": 10000,
  "headers": {
    "Authorization": "Bearer ${env.API_TOKEN}"
  }
}
```

#### Docker Task

Build Docker images:

```json
{
  "id": "docker-build",
  "name": "Build Docker image",
  "type": "docker",
  "dockerfile": "Dockerfile",
  "context": ".",
  "tags": ["myapp:latest", "myapp:${env.BUILD_NUMBER}"],
  "build_args": {
    "NODE_ENV": "production"
  }
}
```

#### JavaScript Task

Execute JavaScript/TypeScript files:

```json
{
  "id": "generate-code",
  "name": "Generate code",
  "type": "javascript",
  "script": "scripts/generate.js",
  "timeout": 300
}
```

#### Conditional Task

Execute based on conditions:

```json
{
  "id": "conditional-deploy",
  "name": "Deploy if enabled",
  "type": "conditional",
  "condition": "${env.DEPLOY_ENABLED} == 'true'",
  "then": {
    "type": "shell",
    "command": "npm run deploy"
  },
  "else": {
    "type": "shell",
    "command": "echo 'Deployment skipped'"
  }
}
```

#### Parallel Task

Execute tasks in parallel:

```json
{
  "id": "parallel-tests",
  "name": "Run tests in parallel",
  "type": "parallel",
  "wait_for": "all",
  "tasks": [
    {
      "id": "unit-tests",
      "type": "shell",
      "command": "npm run test:unit"
    },
    {
      "id": "integration-tests",
      "type": "shell",
      "command": "npm run test:integration"
    }
  ]
}
```

#### Loop Task

Iterate over items:

```json
{
  "id": "deploy-environments",
  "name": "Deploy to multiple environments",
  "type": "loop",
  "items": ["staging", "production"],
  "item": "env",
  "then": {
    "type": "shell",
    "command": "npm run deploy -- --env ${env}"
  },
  "stop_on_failure": true
}
```

## CLI Commands

### `workflow run <workflow>`

Execute a workflow:

```bash
npm run workflow:run workflows/definitions/ci-cd-workflow.json
npm run workflow:run workflows/definitions/ci-cd-workflow.json -- --env DEPLOY_FRONTEND=true
```

### `workflow validate <workflow>`

Validate a workflow definition:

```bash
npm run workflow:validate workflows/definitions/ci-cd-workflow.json
```

### `workflow schedule <workflow>`

Schedule a workflow with cron:

```bash
npm run workflow:schedule workflows/definitions/scheduled-tasks.json -- --cron "0 */6 * * *"
```

### `workflow monitor`

Monitor workflow executions:

```bash
# View health report
npm run workflow:monitor

# Live monitoring
npm run workflow:monitor -- --live

# Filter by workflow
npm run workflow:monitor -- --workflow ci-cd-workflow
```

### `workflow history`

View execution history:

```bash
# Recent executions
npm run workflow:history

# Limit results
npm run workflow:history -- --limit 20

# Filter by workflow
npm run workflow:history -- --workflow ci-cd-workflow
```

### `workflow status <execution-id>`

Get execution status:

```bash
npm run workflow:status abc123-def456-ghi789
```

## Scheduling Workflows

### Cron Expressions

Common cron patterns:

- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `*/15 * * * *` - Every 15 minutes

### Setting Up Cron Jobs

**Linux/macOS:**

```bash
# Edit crontab
crontab -e

# Add workflow execution
0 2 * * * cd /path/to/project && npm run workflow:run workflows/definitions/ci-cd-workflow.json
```

Or use the provided script:

```bash
chmod +x workflows/examples/setup-cron.sh
./workflows/examples/setup-cron.sh
```

**Windows:**

Use the provided PowerShell script (run as Administrator):

```powershell
.\workflows\examples\setup-cron.ps1
```

Or use Task Scheduler manually.

## Environment Variables

Workflows support environment variables:

- `${env.VAR_NAME}` - Access environment variables
- `${tasks.taskId.result}` - Access task outputs
- `${tasks.taskId.exit_code}` - Access task exit codes

Example:

```json
{
  "condition": "${env.DEPLOY_ENABLED} == 'true' && ${tasks.build.exit_code} == 0"
}
```

## Monitoring & Metrics

### Health Reports

View overall workflow health:

```bash
npm run workflow:monitor
```

Output includes:
- Success rate
- Total runs
- Average duration
- Task-level metrics

### Execution History

All executions are stored in `workflows/.executions/`:

- Individual execution files: `{execution-id}.json`
- Index file: `index.json`

### Metrics Collection

The system automatically tracks:
- Execution counts (total, successful, failed)
- Average execution duration
- Task-level metrics (runs, failures, duration)
- Success rates

## Alerting

### Default Alerts

- **Workflow Failure**: Alert when any workflow fails
- **High Failure Rate**: Alert when success rate drops below 90%
- **Long Duration**: Alert when execution exceeds 2x expected duration

### Custom Alerts

Configure alerts in `workflows/config.json`:

```json
{
  "alerts": {
    "enabled": true,
    "channels": ["console", "file"]
  }
}
```

## Configuration

Global configuration in `workflows/config.json`:

```json
{
  "storagePath": "./workflows/.executions",
  "logLevel": "info",
  "alerts": {
    "enabled": true,
    "channels": ["console"]
  },
  "cleanup": {
    "enabled": true,
    "daysToKeep": 30
  }
}
```

## Best Practices

1. **Use descriptive task names**: Make it clear what each task does
2. **Set appropriate timeouts**: Prevent tasks from hanging indefinitely
3. **Use dependencies**: Ensure tasks run in the correct order
4. **Handle failures**: Use `on_failure` callbacks for cleanup
5. **Monitor regularly**: Check health reports and execution history
6. **Version workflows**: Update version when making changes
7. **Test workflows**: Validate before scheduling

## Troubleshooting

### Workflow validation fails

Check the error message for specific issues:
- Missing required fields
- Invalid task types
- Circular dependencies
- Invalid task references

### Tasks timing out

- Increase `timeout` value
- Check if the command is actually running
- Verify dependencies are available

### Execution not found

- Check execution ID is correct
- Verify storage directory exists
- Check file permissions

### Cron job not running

- Verify cron syntax is correct
- Check cron service is running
- Verify file paths are absolute
- Check logs for errors

## Examples

See `workflows/definitions/` for example workflows:
- `ci-cd-workflow.json` - Complete CI/CD pipeline
- `scheduled-tasks.json` - Scheduled maintenance tasks
- `development-workflow.json` - Development automation

## API Reference

### WorkflowOrchestrator

Main orchestration engine:

```typescript
import { WorkflowOrchestrator } from './workflows/engine/WorkflowOrchestrator';

const orchestrator = new WorkflowOrchestrator();
const execution = await orchestrator.execute('workflows/definitions/my-workflow.json');
```

### ExecutionStore

Store and retrieve executions:

```typescript
import { ExecutionStore } from './workflows/monitoring/ExecutionStore';

const store = new ExecutionStore();
await store.saveExecution(execution);
const exec = await store.getExecution(executionId);
```

### WorkflowMonitor

Monitor and collect metrics:

```typescript
import { WorkflowMonitor } from './workflows/monitoring/WorkflowMonitor';

const monitor = new WorkflowMonitor(executionStore);
monitor.recordExecution(execution);
const health = monitor.getHealthReport();
```

## Support

For issues or questions:
- Check workflow validation errors
- Review execution logs in `workflows/.executions/`
- Check health reports with `npm run workflow:monitor`

