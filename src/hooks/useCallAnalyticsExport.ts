import { apiClient } from '../services/apiClient';
import { CallsSummaryFilters, TopSourcesFilters } from './useCallAnalytics';

export interface ExportFilters extends CallsSummaryFilters {
  limit?: number;
  limitSources?: number;
}

/**
 * Build export URL with filters
 */
export function buildExportUrl(endpoint: string, filters: ExportFilters): string {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.direction) params.append('direction', filters.direction);
  if (filters.outcome) params.append('outcome', filters.outcome);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.limitSources) params.append('limitSources', filters.limitSources.toString());

  return `/analytics/exports/${endpoint}?${params.toString()}`;
}

/**
 * Download file from URL
 */
async function downloadFile(url: string, defaultFilename: string): Promise<void> {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Try to extract filename from Content-Disposition header
    let filename = defaultFilename;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Export failed');
  }
}

/**
 * Export calls as CSV
 */
export async function exportCsv(filters: ExportFilters): Promise<void> {
  const url = buildExportUrl('calls.csv', filters);
  await downloadFile(url, 'calls_export.csv');
}

/**
 * Export analytics report as PDF
 */
export async function exportPdf(filters: ExportFilters): Promise<void> {
  const url = buildExportUrl('report.pdf', filters);
  await downloadFile(url, 'analytics_report.pdf');
}
