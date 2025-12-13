import { execSync } from 'child_process';

type TestResult = { status: 'passed' | 'failed'; output: string; error?: string; timestamp: string };

export class TestSuiteManager {
  results: Record<string, TestResult | null> = {
    unit: null,
    integration: null,
    e2e: null,
    performance: null,
  };

  run(command: string): TestResult {
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      return { status: 'passed', output, timestamp: new Date().toISOString() };
    } catch (error: any) {
      return {
        status: 'failed',
        output: error.stdout || '',
        error: error.stderr || error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  runUnit(): TestResult {
    this.results.unit = this.run('npm run test:unit');
    return this.results.unit;
  }

  runIntegration(): TestResult {
    this.results.integration = this.run('npm run test:integration');
    return this.results.integration;
  }

  runE2E(): TestResult {
    this.results.e2e = this.run('npm run test:e2e');
    return this.results.e2e;
  }

  runPerformance(): TestResult {
    this.results.performance = this.run('npm run test:performance');
    return this.results.performance;
  }

  summary() {
    const entries = Object.entries(this.results).filter(([, res]) => res !== null) as [string, TestResult][];
    const failures = entries.filter(([, res]) => res.status === 'failed');
    return {
      timestamp: new Date().toISOString(),
      overall: failures.length === 0 ? 'PASSED' : 'FAILED',
      results: this.results,
    };
  }
}

