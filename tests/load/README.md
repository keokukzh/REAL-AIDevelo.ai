# Load Testing

This directory contains load testing scenarios for the AIDevelo API.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
# Download from https://k6.io/docs/getting-started/installation/
```

## Running Load Tests

### Basic Test
```bash
k6 run tests/load/load-test.js
```

### Custom Configuration
```bash
# 50 virtual users for 1 minute
k6 run --vus 50 --duration 1m tests/load/load-test.js

# Custom base URL
BASE_URL=https://aidevelo.ai k6 run tests/load/load-test.js
```

### Test Scenarios

1. **Dashboard Overview** - Tests `/api/dashboard/overview` endpoint
   - Target: p95 < 300ms
   - Expected load: High (most frequently accessed)

2. **Analytics** - Tests `/api/analytics/calls/summary` endpoint
   - Target: p95 < 500ms
   - Expected load: Medium

3. **Health Check** - Tests `/api/health` endpoint
   - Target: p95 < 100ms
   - Expected load: Very high (monitoring)

## Performance Targets

- **Dashboard Overview**: p95 < 300ms, p99 < 500ms
- **Analytics**: p95 < 500ms, p99 < 1000ms
- **Health Check**: p95 < 100ms
- **Error Rate**: < 1%

## Interpreting Results

k6 will output:
- Request duration percentiles (p50, p95, p99)
- Request rate (requests/second)
- Error rate
- Custom metrics (dashboard_response_time, analytics_response_time)

Look for:
- ✅ All thresholds passing
- ⚠️ Thresholds close to limits (investigate)
- ❌ Thresholds failing (critical - needs optimization)

## Continuous Monitoring

For production monitoring, consider:
- Running load tests in CI/CD pipeline
- Setting up alerts for performance degradation
- Regular load tests (weekly/monthly)
