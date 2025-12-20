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
  
  if (errorRoutes.length > 0) {
    markdown += `## Routes with Errors\n\n`;
    errorRoutes.forEach(route => {
      markdown += `### ${route.path}\n\n`;
      markdown += `- **Status:** ${route.status}\n`;
      if (route.consoleErrors > 0) markdown += `- **Console Errors:** ${route.consoleErrors}\n`;
      if (route.pageErrors > 0) markdown += `- **Page Errors:** ${route.pageErrors}\n`;
      if (route.networkFailures > 0) markdown += `- **Network Failures:** ${route.networkFailures}\n`;
      if (route.error) markdown += `- **Error:** ${route.error}\n`;
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
