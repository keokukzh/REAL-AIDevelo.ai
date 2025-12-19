/**
 * Load Test Scenarios for AIDevelo API
 * Uses k6 for load testing (install: brew install k6 or https://k6.io/docs/getting-started/installation/)
 * 
 * Run: k6 run tests/load/load-test.js
 * 
 * Or with custom options:
 * k6 run --vus 50 --duration 30s tests/load/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dashboardResponseTime = new Trend('dashboard_response_time');
const analyticsResponseTime = new Trend('analytics_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
    errors: ['rate<0.01'],                          // Custom error rate < 1%
    dashboard_response_time: ['p(95)<300'],          // Dashboard p95 < 300ms
    analytics_response_time: ['p(95)<500'],          // Analytics p95 < 500ms
  },
};

// Base URL (set via environment variable or default)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data (in production, use realistic test data)
const testUser = {
  email: __ENV.TEST_EMAIL || 'test@example.com',
  // Note: In real tests, you'd need to authenticate first
};

/**
 * Test dashboard overview endpoint
 */
export function testDashboardOverview() {
  const url = `${API_URL}/dashboard/overview`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // In real tests, include auth token
      // 'Authorization': `Bearer ${authToken}`,
    },
  };

  const startTime = Date.now();
  const res = http.get(url, params);
  const duration = Date.now() - startTime;

  const success = check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    'dashboard has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  dashboardResponseTime.add(duration);

  return { success, duration, status: res.status };
}

/**
 * Test analytics endpoint
 */
export function testAnalytics() {
  const url = `${API_URL}/analytics/calls/summary`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const res = http.get(url, params);
  const duration = Date.now() - startTime;

  const success = check(res, {
    'analytics status is 200 or 401': (r) => r.status === 200 || r.status === 401, // 401 is OK (not authenticated)
    'analytics response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success && res.status !== 401);
  analyticsResponseTime.add(duration);

  return { success, duration, status: res.status };
}

/**
 * Test health endpoint
 */
export function testHealth() {
  const url = `${API_URL}/health`;
  const res = http.get(url);

  const success = check(res, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!success);

  return { success, status: res.status };
}

/**
 * Main test function
 */
export default function () {
  // Test health endpoint (lightweight)
  testHealth();
  sleep(0.5);

  // Test dashboard overview (most critical endpoint)
  testDashboardOverview();
  sleep(1);

  // Test analytics (heavier endpoint)
  testAnalytics();
  sleep(1);
}

/**
 * Setup function (runs once before all VUs)
 */
export function setup() {
  console.log(`🚀 Starting load test against ${BASE_URL}`);
  console.log(`📊 Test configuration:`, JSON.stringify(options, null, 2));
  
  // In production, you might want to authenticate here and return tokens
  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
  };
}

/**
 * Teardown function (runs once after all VUs)
 */
export function teardown(data) {
  console.log('✅ Load test completed');
}
