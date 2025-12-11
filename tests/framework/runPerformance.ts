import { PerformanceTestFramework } from './performanceTesting';

async function main() {
  const endpoint = process.env.PERF_ENDPOINT || 'http://localhost:5000/health';
  const framework = new PerformanceTestFramework();
  const results = await framework.runLoadTest({
    endpoint,
    method: 'GET',
    concurrent: Number(process.env.PERF_USERS || 5),
    durationMs: Number(process.env.PERF_DURATION_MS || 10000),
    rampUpMs: Number(process.env.PERF_RAMP_MS || 2000),
  });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

