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

  test('authenticate for dashboard routes', async ({ page }) => {
    // Check if we need authentication
    const routes = discoverRoutes();
    const hasAuthRoutes = routes.some(r => r.requiresAuth && !r.isDynamic);
    
    if (hasAuthRoutes) {
      // Check if already authenticated
      const alreadyAuth = await isAuthenticated(page);
      
      if (!alreadyAuth) {
        authenticated = await authenticate(page);
        expect(authenticated).toBe(true);
      } else {
        authenticated = true;
      }
    }
  });

  test('audit all routes', async ({ page }) => {
    const routes = discoverRoutes();
    const results: RouteAuditResult[] = [];

    // Filter out dynamic routes for now (they need seed data)
    const testableRoutes = routes.filter(r => !r.isDynamic);

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
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for page load with timeout
        try {
          await navigationPromise;
          await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
          
          // Wait a bit for any async errors to surface
          await page.waitForTimeout(2000);
        } catch (error: any) {
          if (error.message?.includes('timeout') || error.message?.includes('Navigation timeout')) {
            routeResult.status = 'timeout';
            routeResult.error = `Navigation timeout: ${error.message}`;
          } else {
            routeResult.status = 'error';
            routeResult.error = `Navigation error: ${error.message}`;
          }
        }

        // Stop collecting
        collector.stopCollecting();

        // Get error counts
        const errors = collector.getErrors();
        const pageErrors = collector.getPageErrors();
        const networkFailures = collector.getNetworkFailures();

        routeResult.consoleErrors = errors.length;
        routeResult.pageErrors = pageErrors.length;
        routeResult.networkFailures = networkFailures.length;
        routeResult.loadTime = Date.now() - startTime;

        // Determine status
        if (routeResult.status === 'success' && (errors.length > 0 || pageErrors.length > 0 || networkFailures.length > 0)) {
          routeResult.status = 'error';
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
    const totalErrors = allResults.reduce(
      (sum, r) => sum + r.consoleErrors + r.pageErrors + r.networkFailures,
      0
    );
    const routesWithErrors = allResults.filter(
      r => r.status === 'error' || r.consoleErrors > 0 || r.pageErrors > 0 || r.networkFailures > 0
    ).length;

    if (totalErrors > 0 || routesWithErrors > 0) {
      console.error(`\n❌ Found ${totalErrors} errors across ${routesWithErrors} routes\n`);
      console.error('See reports/audit-summary.md for details\n');
    }

    expect(totalErrors).toBe(0);
    expect(routesWithErrors).toBe(0);
  });
});
