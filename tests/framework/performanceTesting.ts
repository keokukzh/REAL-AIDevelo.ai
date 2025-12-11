import axios, { AxiosRequestConfig } from 'axios';
import { performance } from 'perf_hooks';

type LoadTestConfig = {
  endpoint: string;
  method?: AxiosRequestConfig['method'];
  payload?: any;
  concurrent?: number;
  durationMs?: number;
  rampUpMs?: number;
};

export class PerformanceTestFramework {
  thresholds = {
    responseTimeMs: 1000,
    throughputRps: 50,
    errorRate: 0.01,
  };

  async runLoadTest({
    endpoint,
    method = 'GET',
    payload,
    concurrent = 5,
    durationMs = 30000,
    rampUpMs = 5000,
  }: LoadTestConfig) {
    const results: {
      durations: number[];
      statuses: number[];
      errors: string[];
    } = { durations: [], statuses: [], errors: [] };

    const userRuns = Array.from({ length: concurrent }).map((_, idx) =>
      this.simulateUser(endpoint, method, payload, durationMs - (rampUpMs / concurrent) * idx, results)
    );

    await Promise.all(userRuns);
    return this.analyze(results, durationMs);
  }

  private async simulateUser(
    endpoint: string,
    method: AxiosRequestConfig['method'],
    payload: any,
    durationMs: number,
    results: { durations: number[]; statuses: number[]; errors: string[] }
  ) {
    const end = Date.now() + durationMs;
    while (Date.now() < end) {
      const start = performance.now();
      try {
        const res = await axios({
          url: endpoint,
          method,
          data: payload,
          timeout: 30000,
          validateStatus: () => true,
        });
        const elapsed = performance.now() - start;
        results.durations.push(elapsed);
        results.statuses.push(res.status);
      } catch (err: any) {
        results.errors.push(err.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private analyze(
    results: { durations: number[]; statuses: number[]; errors: string[] },
    durationMs: number
  ) {
    const total = results.durations.length;
    const success = results.statuses.filter((s) => s < 400).length;
    const errorRate = (results.errors.length + (total - success)) / Math.max(total, 1);
    const throughput = (total / durationMs) * 1000;

    const sorted = [...results.durations].sort((a, b) => a - b);
    const percentile = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] || 0;

    return {
      summary: {
        totalRequests: total,
        success,
        throughput,
        errorRate,
      },
      responseTime: {
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
        mean: sorted.reduce((a, b) => a + b, 0) / Math.max(sorted.length, 1),
        p50: percentile(50),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99),
      },
      recommendations: this.recommendations({ throughput, errorRate, mean: percentile(50) }),
    };
  }

  private recommendations(metrics: { throughput: number; errorRate: number; mean: number }) {
    const recs = [];
    if (metrics.mean > this.thresholds.responseTimeMs) {
      recs.push('Average response time exceeds threshold. Investigate slow endpoints or DB queries.');
    }
    if (metrics.throughput < this.thresholds.throughputRps) {
      recs.push('Throughput is low. Consider scaling or caching.');
    }
    if (metrics.errorRate > this.thresholds.errorRate) {
      recs.push('High error rate detected. Review logs and error handling.');
    }
    return recs;
  }
}

