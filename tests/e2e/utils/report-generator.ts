import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ErrorCollector } from './error-collector';
import { RouteInfo } from './route-discovery';

export interface RouteAuditResult {
  path: string;
  status: 'success' | 'error' | 'timeout' | 'skipped';
  consoleErrors: number;
  pageErrors: number;
  networkFailures: number;
  screenshot?: string;
  loadTime?: number;
  error?: string;
  errorDetails?: {
    consoleErrors?: string[];
    pageErrors?: string[];
    networkFailures?: Array<{ url: string; status: number; method: string }>;
  };
}

export interface AuditReport {
  timestamp: string;
  baseUrl: string;
  routes: RouteAuditResult[];
  summary: {
    totalRoutes: number;
    routesWithErrors: number;
    totalErrors: number;
    totalWarnings: number;
    totalNetworkFailures: number;
  };
}

/**
 * Generate JSON report from audit results
 */
export function generateJsonReport(
  results: RouteAuditResult[],
  baseUrl: string,
  outputPath: string
): void {
  const totalErrors = results.reduce((sum, r) => sum + r.consoleErrors + r.pageErrors + r.networkFailures, 0);
  const routesWithErrors = results.filter(r => r.status === 'error' || r.consoleErrors > 0 || r.pageErrors > 0 || r.networkFailures > 0).length;
  
  // Count warnings separately (would need to be passed in)
  const totalWarnings = 0; // TODO: track warnings separately if needed
  const totalNetworkFailures = results.reduce((sum, r) => sum + r.networkFailures, 0);

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    routes: results,
    summary: {
      totalRoutes: results.length,
      routesWithErrors,
      totalErrors,
      totalWarnings,
      totalNetworkFailures,
    },
  };

  // Ensure reports directory exists
  const reportsDir = join(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Generate markdown summary report
 */
export function generateMarkdownReport(
  results: RouteAuditResult[],
  baseUrl: string,
  outputPath: string,
  previousReport?: AuditReport
): void {
  const totalRoutes = results.length;
  const routesWithErrors = results.filter(r => r.status === 'error' || r.consoleErrors > 0 || r.pageErrors > 0 || r.networkFailures > 0).length;
  const totalErrors = results.reduce((sum, r) => sum + r.consoleErrors + r.pageErrors + r.networkFailures, 0);
  const totalNetworkFailures = results.reduce((sum, r) => sum + r.networkFailures, 0);

  let markdown = `# Site Audit Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Base URL:** ${baseUrl}\n\n`;

  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Routes Tested:** ${totalRoutes}\n`;
  markdown += `- **Routes with Errors:** ${routesWithErrors}\n`;
  markdown += `- **Total Errors:** ${totalErrors}\n`;
  markdown += `- **Network Failures:** ${totalNetworkFailures}\n\n`;

  // Before/After comparison if previous report exists
  if (previousReport) {
    markdown += `## Comparison\n\n`;
    markdown += `| Metric | Before | After | Change |\n`;
    markdown += `|--------|--------|-------|--------|\n`;
    markdown += `| Total Routes | ${previousReport.summary.totalRoutes} | ${totalRoutes} | ${totalRoutes - previousReport.summary.totalRoutes >= 0 ? '+' : ''}${totalRoutes - previousReport.summary.totalRoutes} |\n`;
    markdown += `| Routes with Errors | ${previousReport.summary.routesWithErrors} | ${routesWithErrors} | ${routesWithErrors - previousReport.summary.routesWithErrors >= 0 ? '+' : ''}${routesWithErrors - previousReport.summary.routesWithErrors} |\n`;
    markdown += `| Total Errors | ${previousReport.summary.totalErrors} | ${totalErrors} | ${totalErrors - previousReport.summary.totalErrors >= 0 ? '+' : ''}${totalErrors - previousReport.summary.totalErrors} |\n\n`;
  }

  // Routes with errors
  const errorRoutes = results.filter(r => r.status === 'error' || r.consoleErrors > 0 || r.pageErrors > 0 || r.networkFailures > 0);
  
  // Check if errors are all backend connectivity issues
  const allBackendErrors = errorRoutes.every(route => {
    if (!route.errorDetails?.networkFailures) return false;
    return route.errorDetails.networkFailures.every(f => 
      f.url.includes('localhost:5000') && f.status === 0
    );
  });
  
  if (errorRoutes.length > 0) {
    markdown += `## Routes with Errors\n\n`;
    
    if (allBackendErrors) {
      markdown += `⚠️ **Note:** All errors appear to be backend connectivity issues (ERR_EMPTY_RESPONSE from localhost:5000).\n`;
      markdown += `This is expected if the backend server is not running. Start the backend with: \`cd server && npm run dev\`\n\n`;
    }
    
    errorRoutes.forEach(route => {
      markdown += `### ${route.path}\n\n`;
      markdown += `- **Status:** ${route.status}\n`;
      if (route.consoleErrors > 0) markdown += `- **Console Errors:** ${route.consoleErrors}\n`;
      if (route.pageErrors > 0) markdown += `- **Page Errors:** ${route.pageErrors}\n`;
      if (route.networkFailures > 0) markdown += `- **Network Failures:** ${route.networkFailures}\n`;
      if (route.error) markdown += `- **Error:** ${route.error}\n`;
      
      // Add error details
      if (route.errorDetails) {
        if (route.errorDetails.consoleErrors && route.errorDetails.consoleErrors.length > 0) {
          markdown += `\n**Console Error Messages:**\n`;
          route.errorDetails.consoleErrors.forEach((msg, i) => {
            markdown += `${i + 1}. \`${msg.substring(0, 200)}${msg.length > 200 ? '...' : ''}\`\n`;
          });
        }
        if (route.errorDetails.networkFailures && route.errorDetails.networkFailures.length > 0) {
          markdown += `\n**Network Failures:**\n`;
          route.errorDetails.networkFailures.forEach((f, i) => {
            const isBackendError = f.url.includes('localhost:5000') && f.status === 0;
            markdown += `${i + 1}. ${f.method} ${f.url} - Status: ${f.status}${isBackendError ? ' (Backend not running?)' : ''}\n`;
          });
        }
      }
      
      markdown += `\n`;
    });
  } else {
    markdown += `## ✅ All Clear\n\n`;
    markdown += `No errors found on any routes!\n\n`;
  }

  // All routes status
  markdown += `## All Routes Status\n\n`;
  markdown += `| Route | Status | Errors | Page Errors | Network Failures |\n`;
  markdown += `|-------|--------|-------|-------------|------------------|\n`;
  
  results.forEach(route => {
    const statusEmoji = route.status === 'success' ? '✅' : route.status === 'error' ? '❌' : route.status === 'timeout' ? '⏱️' : '⏭️';
    markdown += `| ${route.path} | ${statusEmoji} ${route.status} | ${route.consoleErrors} | ${route.pageErrors} | ${route.networkFailures} |\n`;
  });

  // Ensure reports directory exists
  const reportsDir = join(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  writeFileSync(outputPath, markdown, 'utf-8');
}
