import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface DashboardOverview {
  user: {
    id: string;
    email: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
    timezone: string;
  };
  agent_config: {
    id: string;
    eleven_agent_id: string | null;
    setup_state: string;
    persona_gender: string | null;
    persona_age_range: string | null;
    goals_json: string[];
    services_json: any[];
    business_type: string | null;
  };
  status: {
    agent: 'ready' | 'needs_setup';
    phone: 'not_connected' | 'connected' | 'needs_compliance';
    calendar: 'not_connected' | 'connected';
  };
  recent_calls: Array<{
    id: string;
    direction: string;
    from_e164: string | null;
    to_e164: string | null;
    started_at: string;
    ended_at: string | null;
    duration_sec: number | null;
    outcome: string | null;
  }>;
}

export const useDashboardOverview = () => {
  return useQuery<DashboardOverview, Error>({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: DashboardOverview }>(
          '/dashboard/overview'
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error('Failed to load dashboard overview');
        }
        return response.data.data;
      } catch (error: any) {
        // Preserve status code for 401 handling
        if (error.response?.status) {
          const enhancedError = new Error(error.message || 'Failed to load dashboard overview');
          (enhancedError as any).status = error.response.status;
          throw enhancedError;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 30000, // 30 seconds
  });
};

