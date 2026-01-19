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
      const response = await apiClient.patch<{ success: boolean; data: AgentConfigResponse }>(
        '/dashboard/agent/config',
        updates
      );
      
      if (!response.data?.success || !response.data.data) {
        const errorMsg = response.data?.error || 'Failed to update agent config';
        throw new Error(errorMsg);
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch dashboard overview after successful update
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
    },
    onError: (error: any) => {
      const errorMsg = extractErrorMessage(error, 'Fehler beim Speichern der Konfiguration');
      toast.error(errorMsg);
    },
  });
};

