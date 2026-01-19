import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient.js';
import { toast } from '../components/ui/Toast.js';

export type AgentStatus = 'ready' | 'paused' | 'inactive' | 'needs_setup';

interface QuickStatus {
  id: string;
  isActive: boolean;
  isPaused: boolean;
  setupState: AgentStatus;
  lastUpdated: string;
}

interface AgentActivationResult {
  success: boolean;
  message: string;
  data: {
    id: string;
    setup_state: AgentStatus;
    updated_at: string;
  };
}

/**
 * Hook for managing voice agent activation state
 * Provides one-click activate, deactivate, pause, and resume functionality
 */
export function useAgentActivation(agentId: string) {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
    queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    queryClient.invalidateQueries({ queryKey: ['agent', 'status', agentId] });
  };

  // Activate agent (set to 'ready')
  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AgentActivationResult>(`/agents/${agentId}/resume`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Voice Agent aktiviert! 🎉');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktivieren: ${error.message}`);
    },
  });

  // Deactivate agent (set to 'inactive')
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AgentActivationResult>(`/agents/${agentId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Voice Agent deaktiviert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Deaktivieren: ${error.message}`);
    },
  });

  // Pause agent (keeps config, stops processing)
  const pauseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AgentActivationResult>(`/agents/${agentId}/pause`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Voice Agent pausiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Pausieren: ${error.message}`);
    },
  });

  // Resume paused agent
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AgentActivationResult>(`/agents/${agentId}/resume`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Voice Agent wieder aktiviert! 🎉');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Fortsetzen: ${error.message}`);
    },
  });

  // Get quick status
  const getQuickStatus = async (): Promise<QuickStatus | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: QuickStatus }>(
        `/agents/${agentId}/quick-status`,
      );
      return response.data?.data || null;
    } catch {
      return null;
    }
  };

  return {
    // Actions
    activate: activateMutation.mutate,
    deactivate: deactivateMutation.mutate,
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    getQuickStatus,

    // Loading states
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isAnyLoading:
      activateMutation.isPending ||
      deactivateMutation.isPending ||
      pauseMutation.isPending ||
      resumeMutation.isPending,

    // Async versions for chaining
    activateAsync: activateMutation.mutateAsync,
    deactivateAsync: deactivateMutation.mutateAsync,
    pauseAsync: pauseMutation.mutateAsync,
    resumeAsync: resumeMutation.mutateAsync,
  };
}
