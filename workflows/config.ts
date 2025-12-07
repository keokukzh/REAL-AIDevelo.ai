import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WorkflowConfig {
  storagePath?: string;
  logLevel?: 'info' | 'warn' | 'error';
  alerts?: {
    enabled: boolean;
    channels: string[];
  };
  cleanup?: {
    enabled: boolean;
    daysToKeep: number;
  };
}

const defaultConfig: WorkflowConfig = {
  storagePath: './workflows/.executions',
  logLevel: 'info',
  alerts: {
    enabled: true,
    channels: ['console']
  },
  cleanup: {
    enabled: true,
    daysToKeep: 30
  }
};

/**
 * Load workflow configuration
 */
export async function loadConfig(configPath?: string): Promise<WorkflowConfig> {
  const configFile = configPath || path.join(process.cwd(), 'workflows', 'config.json');
  
  try {
    const data = await fs.readFile(configFile, 'utf-8');
    const config = JSON.parse(data) as WorkflowConfig;
    return { ...defaultConfig, ...config };
  } catch (error) {
    // Config file doesn't exist, return defaults
    return defaultConfig;
  }
}

/**
 * Save workflow configuration
 */
export async function saveConfig(config: WorkflowConfig, configPath?: string): Promise<void> {
  const configFile = configPath || path.join(process.cwd(), 'workflows', 'config.json');
  const configDir = path.dirname(configFile);
  
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8');
}

