import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface ScheduledReport {
  id: string;
  location_id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  recipients: string[];
  filters: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  recipients: string[];
  filters?: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
  enabled?: boolean;
}

export interface UpdateScheduledReportInput {
  enabled?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  recipients?: string[];
  filters?: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
}

/**
 * Hook to list scheduled reports for current location
 */
export function useScheduledReports() {
  return useQuery({
    queryKey: ['scheduledReports'],
    queryFn: async (): Promise<ScheduledReport[]> => {
      const response = await apiClient.get('/api/reports/scheduled');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch scheduled reports');
      }
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to create a scheduled report
 */
export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScheduledReportInput): Promise<ScheduledReport> => {
      const response = await apiClient.post('/api/reports/scheduled', input);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create scheduled report');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to update a scheduled report
 */
export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateScheduledReportInput }): Promise<ScheduledReport> => {
      const response = await apiClient.patch(`/api/reports/scheduled/${id}`, input);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update scheduled report');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to delete a scheduled report
 */
export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.delete(`/api/reports/scheduled/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete scheduled report');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to send a test report immediately
 */
export function useTestScheduledReport() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.post(`/api/reports/scheduled/${id}/test`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send test report');
      }
    },
  });
}
