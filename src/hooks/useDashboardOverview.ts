import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { supabase } from '../lib/supabase';

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
  phone_number?: string | null;
  phone_number_sid?: string | null;
  calendar_provider?: string | null;
  calendar_connected_email?: string | null;
  last_activity?: string | null;
  gateway_health?: 'ok' | 'warning' | 'error';
  elevenlabs_quota?: {
    character_count: number;
    character_limit: number;
    percentageUsed: number;
    remaining: number;
    canUse: boolean;
    warning: boolean;
    status: 'ok' | 'warning' | 'critical';
  } | null;
  elevenlabs_affiliate_link?: string | null;
  _backendSha?: string; // Internal field for UI display
}

export const useDashboardOverview = () => {
  // Check if session exists before enabling the query
  const [hasSession, setHasSession] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session?.access_token);
      } catch (error) {
        console.error('[useDashboardOverview] Error checking session:', error);
        setHasSession(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        // Extract backend SHA from response headers (axios lowercases header names)
        const backendSha = response.headers['x-aidevelo-backend-sha'] || 
                          response.headers['X-Aidevelo-Backend-Sha'] || 
                          'unknown';
        return {
          ...response.data.data,
          _backendSha: typeof backendSha === 'string' ? backendSha : 'unknown',
        };
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
    enabled: !isChecking && hasSession, // Only enable when session is confirmed
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

