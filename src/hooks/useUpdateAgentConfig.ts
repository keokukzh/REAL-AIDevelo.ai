import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface UpdateAgentConfigRequest {
  persona_gender?: 'male' | 'female';
  persona_age_range?: string;
  business_type?: string;
  goals_json?: string[];
  services_json?: any[];
  setup_state?: 'needs_persona' | 'needs_business' | 'needs_phone' | 'needs_calendar' | 'ready';
  eleven_agent_id?: string | null;
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
        throw new Error('Failed to update agent config');
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch dashboard overview after successful update
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
    },
  });
};

