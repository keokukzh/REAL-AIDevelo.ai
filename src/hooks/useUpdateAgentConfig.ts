import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { toast } from '../components/ui/Toast';
import { extractErrorMessage } from '../lib/errorUtils';

export interface UpdateAgentConfigRequest {
  persona_gender?: 'male' | 'female';
  persona_age_range?: string;
  business_type?: string;
  goals_json?: string[];
  services_json?: any[];
  setup_state?: 'needs_persona' | 'needs_business' | 'needs_phone' | 'needs_calendar' | 'ready';
  eleven_agent_id?: string | null;
  primary_locale?: string;
  system_prompt?: string | null;
  recording_consent?: boolean;
  admin_test_number?: string | null;
  greeting_template?: string | null;
  company_name?: string | null;
  booking_required_fields_json?: string[];
  booking_default_duration_min?: number;
}

export interface AgentConfigResponse {
  id: string;
  location_id: string;
  eleven_agent_id: string | null;
  setup_state: string;
  persona_gender: string | null;
  persona_age_range: string | null;
  goals_json: string[];
  services_json: any[];
  business_type: string | null;
  primary_locale?: string | null;
  system_prompt?: string | null;
  recording_consent?: boolean;
  admin_test_number?: string | null;
  greeting_template?: string | null;
  company_name?: string | null;
  booking_required_fields_json?: string[];
  booking_default_duration_min?: number;
}

export const useUpdateAgentConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<AgentConfigResponse, Error, UpdateAgentConfigRequest>({
    mutationFn: async (updates: UpdateAgentConfigRequest) => {
      const response = await apiClient.patch<{ success: boolean; data?: AgentConfigResponse; error?: string }>(
        '/dashboard/agent/config',
        updates
      );
      
      if (!response.data?.success || !response.data.data) {
        const errorMsg = (response.data as any)?.error || 'Failed to update agent config';
        throw new Error(errorMsg);
      }
      
      return response.data.data;
    },
    // Retry logic for 502/503 errors
    retry: (failureCount, error: any) => {
      const status = error?.response?.status || error?.status;
      // Retry up to 2 times for 502/503 errors (service unavailable)
      if (status === 502 || status === 503) {
        return failureCount < 2;
      }
      // Don't retry other errors
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s
      return Math.min(1000 * Math.pow(2, attemptIndex), 2000);
    },
    onSuccess: () => {
      // Invalidate and refetch dashboard overview after successful update
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
    },
    onError: (error: any) => {
      // Use userFriendlyMessage if available (from apiClient interceptor)
      const errorMsg = error?.userFriendlyMessage 
        || extractErrorMessage(error, 'Fehler beim Speichern der Konfiguration');
      
      // Don't show error toast for 503 errors during retry - only show final error
      const status = error?.response?.status || error?.status;
      if (status === 503 && error?.config?._retryCount && error?.config?._retryCount < 2) {
        // Still retrying - don't show error yet
        return;
      }
      
      toast.error(errorMsg);
    },
  });
};

