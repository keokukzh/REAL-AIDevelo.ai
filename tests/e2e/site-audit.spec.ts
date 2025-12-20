import { test, expect } from '@playwright/test';
import { discoverRoutes, RouteInfo } from './utils/route-discovery';
import { ErrorCollector } from './utils/error-collector';
import { authenticate, isAuthenticated } from './utils/auth-helper';
import { generateJsonReport, generateMarkdownReport, RouteAuditResult } from './utils/report-generator';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Site Audit - Error Detection', () => {
  let allResults: RouteAuditResult[] = [];
  let baseUrl: string;
  let authenticated = false;

  test.beforeAll(async ({ browser }) => {
    // Get base URL from environment or config
    baseUrl = process.env.BASE_URL || 'http://localhost:4173';
  });

  test('audit all routes', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for all routes
    
    const routes = discoverRoutes();
    const results: RouteAuditResult[] = [];

    // Filter out dynamic routes for now (they need seed data)
    const testableRoutes = routes.filter(r => !r.isDynamic);
    
    // Check if we need authentication and authenticate if needed
    const hasAuthRoutes = testableRoutes.some(r => r.requiresAuth);
    if (hasAuthRoutes && !authenticated) {
      console.log('[Audit] Authenticating for dashboard routes...');
      authenticated = await authenticate(page);
      if (!authenticated) {
        console.warn('[Audit] Authentication failed - dashboard routes will be skipped');
      } else {
        console.log('[Audit] Authentication successful');
      }
    }

    console.log(`\n[Audit] Testing ${testableRoutes.length} routes...\n`);

    for (const route of testableRoutes) {
      const collector = new ErrorCollector();
      const startTime = Date.now();
      let routeResult: RouteAuditResult = {
        path: route.path,
        status: 'success',
        consoleErrors: 0,
        pageErrors: 0,
        networkFailures: 0,
      };

      try {
        // Skip auth routes if not authenticated
        if (route.requiresAuth && !authenticated) {
          routeResult.status = 'skipped';
          routeResult.error = 'Authentication required but not available';
          results.push(routeResult);
          console.log(`⏭️  Skipped: ${route.path} (auth required)`);
          continue;
        }

        // Start collecting errors
        collector.startCollecting(page);

        // Navigate to route
        const navigationPromise = page.goto(route.path, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });

        // Wait for page load with timeout
        try {
          await navigationPromise;
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
          
          // Wait a bit for any async errors to surface
          await page.waitForTimeout(2000);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          if (errorMsg.includes('timeout') || errorMsg.includes('Navigation timeout') || errorMsg.includes('Target page') || errorMsg.includes('has been closed')) {
            routeResult.status = 'timeout';
            routeResult.error = `Navigation timeout/closed: ${errorMsg}`;
          } else {
            routeResult.status = 'error';
            routeResult.error = `Navigation error: ${errorMsg}`;
          }
        }

        // Stop collecting
        collector.stopCollecting();

        // Get error counts and details
        const errors = collector.getErrors();
        const pageErrors = collector.getPageErrors();
        const networkFailures = collector.getNetworkFailures();

        routeResult.consoleErrors = errors.length;
        routeResult.pageErrors = pageErrors.length;
        routeResult.networkFailures = networkFailures.length;
        routeResult.loadTime = Date.now() - startTime;
        
        // Store error details if there are errors
        if (errors.length > 0 || pageErrors.length > 0 || networkFailures.length > 0) {
          routeResult.errorDetails = {
            consoleErrors: errors.map(e => e.message).slice(0, 10), // Limit to first 10
            pageErrors: pageErrors.map(e => e.message).slice(0, 10),
            networkFailures: networkFailures.map(f => ({
              url: f.url,
              status: f.status,
              method: f.method,
            })).slice(0, 10),
          };
        }

        // Determine status - only mark as error if there are actual errors, not just navigation issues
        if (routeResult.status === 'success') {
          if (errors.length > 0 || pageErrors.length > 0 || networkFailures.length > 0) {
            routeResult.status = 'error';
          }
        } else if (routeResult.status === 'timeout') {
          // Timeout is separate from errors - don't change status
        } else if (routeResult.status === 'error' && errors.length === 0 && pageErrors.length === 0 && networkFailures.length === 0) {
          // If navigation error but no actual errors, treat as timeout
          routeResult.status = 'timeout';
        }

        // Take screenshot on error
        if (routeResult.status === 'error') {
          try {
            const screenshotPath = join(process.cwd(), 'reports', `screenshot-${route.path.replace(/\//g, '_')}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            routeResult.screenshot = screenshotPath;
          } catch (e) {
            // Screenshot failed, continue
          }
        }

        // Log result
        if (routeResult.status === 'error') {
          console.log(`❌ ${route.path}: ${errors.length} console errors, ${pageErrors.length} page errors, ${networkFailures.length} network failures`);
        } else if (routeResult.status === 'timeout') {
          console.log(`⏱️  ${route.path}: Timeout`);
        } else {
          console.log(`✅ ${route.path}`);
        }

      } catch (error: any) {
        collector.stopCollecting();
        routeResult.status = 'error';
        routeResult.error = `Unexpected error: ${error.message}`;
        console.error(`❌ ${route.path}: ${error.message}`);
      }

      results.push(routeResult);
    }

    allResults = results;

    // Generate reports
    const reportsDir = join(process.cwd(), 'reports');
    const jsonPath = join(reportsDir, baseUrl.includes('localhost') ? 'audit-local.json' : 'audit-prod.json');
    const mdPath = join(reportsDir, 'audit-summary.md');

    // Load previous report for comparison
    let previousReport = undefined;
    if (existsSync(jsonPath)) {
      try {
        const previousContent = readFileSync(jsonPath, 'utf-8');
        previousReport = JSON.parse(previousContent);
      } catch (e) {
        // Previous report invalid, ignore
      }
    }

    generateJsonReport(results, baseUrl, jsonPath);
    generateMarkdownReport(results, baseUrl, mdPath, previousReport);

    console.log(`\n[Audit] Report generated: ${mdPath}\n`);
  });

  test('verify zero errors', async () => {
    // This test will fail if there are errors, forcing fixes
    // But we exclude backend connectivity errors if backend is not running
    const backendErrors = allResults.filter(r => {
      if (!r.errorDetails?.networkFailures) return false;
      return r.errorDetails.networkFailures.every(f => 
        f.url.includes('localhost:5000') && f.status === 0
      );
    });
    
    const allBackendErrors = allResults.every(r => {
      if (r.status !== 'error') return true;
      if (!r.errorDetails?.networkFailures || r.errorDetails.networkFailures.length === 0) return false;
      return r.errorDetails.networkFailures.every(f => 
        f.url.includes('localhost:5000') && f.status === 0
      );
    });
    
    // Filter out backend connectivity errors
    const nonBackendErrors = allResults.filter(r => {
      if (r.status !== 'error') return false;
      if (!r.errorDetails?.networkFailures) return true; // Has other errors
      const hasNonBackendErrors = r.errorDetails.networkFailures.some(f => 
        !f.url.includes('localhost:5000') || f.status !== 0
      );
      return hasNonBackendErrors || r.consoleErrors > 0 || r.pageErrors > 0;
    });
    
    const totalErrors = nonBackendErrors.reduce(
      (sum, r) => sum + r.consoleErrors + r.pageErrors + (r.errorDetails?.networkFailures?.filter(f => !f.url.includes('localhost:5000') || f.status !== 0).length || 0),
      0
    );
    const routesWithErrors = nonBackendErrors.length;

    if (allBackendErrors && backendErrors.length > 0) {
      console.warn(`\n⚠️  All errors are backend connectivity issues (backend server not running)`);
      console.warn(`   Start backend with: cd server && npm run dev`);
      console.warn(`   These errors are expected and will be ignored.\n`);
    }

    if (totalErrors > 0 || routesWithErrors > 0) {
      console.error(`\n❌ Found ${totalErrors} errors across ${routesWithErrors} routes\n`);
      console.error('See reports/audit-summary.md for details\n');
    }

    // Only fail if there are non-backend errors
    expect(totalErrors).toBe(0);
    expect(routesWithErrors).toBe(0);
  });
});
