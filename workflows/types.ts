/**
 * TypeScript interfaces for workflow schema definitions
 */

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'file_change';
  config?: {
    schedule?: string; // Cron expression
    files?: string[]; // File patterns to watch
    webhook?: string; // Webhook endpoint path
  };
}

export interface WorkflowTask {
  id: string;
  name: string;
  type: 'shell' | 'http' | 'docker' | 'javascript' | 'python' | 'conditional' | 'parallel' | 'loop';
  command?: string;
  depends_on?: string[];
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
  };
  condition?: string;
  parallel?: boolean;
  wait_for?: 'all' | 'any' | 'first';
  on_success?: string[];
  on_failure?: string[];
  cwd?: string;
  environment?: Record<string, string>;
  live_output?: boolean;
  
  // HTTP task specific
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  auth?: {
    type: 'basic' | 'bearer';
    username?: string;
    password?: string;
    token?: string;
  };
  
  // Docker task specific
  dockerfile?: string;
  context?: string;
  tags?: string[];
  build_args?: Record<string, string>;
  
  // JavaScript/Python task specific
  script?: string;
  
  // Conditional task specific
  then?: Partial<WorkflowTask>;
  else?: Partial<WorkflowTask>;
  
  // Parallel task specific
  tasks?: WorkflowTask[];
  
  // Loop task specific
  items?: unknown[];
  item?: string; // Variable name for current item
  stop_on_failure?: boolean;
}

export interface Workflow {
  name: string;
  version: string;
  description?: string;
  trigger: WorkflowTrigger;
  environment?: Record<string, string>;
  tasks: WorkflowTask[];
  notifications?: {
    channels?: string[];
    on_completion?: boolean;
    on_failure?: boolean;
  };
  expected_duration?: number; // in milliseconds
}

export interface TaskExecution {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  tasks: Record<string, TaskExecution>;
  error?: string;
}

export interface WorkflowMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  taskMetrics: Map<string, {
    runs: number;
    failures: number;
    averageDuration: number;
  }>;
}

