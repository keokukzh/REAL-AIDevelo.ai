import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { toast } from '../components/ui/Toast';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  htmlLink?: string;
  aiBooked?: boolean;
  calendarId: string;
}

interface UseCalendarEventsParams {
  locationId: string;
  start: Date;
  end: Date;
  calendarId?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch calendar events
 */
export function useCalendarEvents({ 
  locationId, 
  start, 
  end, 
  calendarId = 'primary',
  enabled = true 
}: UseCalendarEventsParams) {
  const queryClient = useQueryClient();

  // Query for fetching events
  const query = useQuery({
    queryKey: ['calendar', 'events', locationId, start.toISOString(), end.toISOString(), calendarId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: CalendarEvent[];
      }>('/calendar/google/events', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
          calendarId,
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch calendar events');
      }

      return response.data.data;
    },
    enabled: enabled && !!locationId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation for creating events
  const createMutation = useMutation({
    mutationFn: async (event: {
      summary: string;
      start: string;
      end: string;
      description?: string;
      attendees?: Array<{ email: string }>;
      location?: string;
      timezone?: string;
      aiBooked?: boolean;
    }) => {
      const response = await apiClient.post<{
        success: boolean;
        data?: {
          eventId: string;
          htmlLink: string;
          start: string;
          end: string;
          calendarId: string;
        };
        error?: string;
      }>('/calendar/google/create-appointment', event);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to create event');
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', locationId] });
      toast.success('Termin erfolgreich erstellt');
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || error?.message || 'Fehler beim Erstellen des Termins';
      toast.error(errorMsg);
    },
  });

  // Mutation for updating events
  const updateMutation = useMutation({
    mutationFn: async ({ eventId, ...event }: {
      eventId: string;
      summary: string;
      start: string;
      end: string;
      description?: string;
      attendees?: Array<{ email: string }>;
      location?: string;
      timezone?: string;
      calendarId?: string;
    }) => {
      const response = await apiClient.put<{
        success: boolean;
        data?: {
          eventId: string;
          htmlLink: string;
          start: string;
          end: string;
          calendarId: string;
        };
        error?: string;
      }>(`/calendar/google/events/${eventId}`, event);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to update event');
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', locationId] });
      toast.success('Termin erfolgreich aktualisiert');
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || error?.message || 'Fehler beim Aktualisieren des Termins';
      toast.error(errorMsg);
    },
  });

  // Mutation for deleting events
  const deleteMutation = useMutation({
    mutationFn: async ({ eventId, calendarId }: { eventId: string; calendarId?: string }) => {
      const response = await apiClient.delete<{
        success: boolean;
        error?: string;
      }>(`/calendar/google/events/${eventId}`, {
        params: calendarId ? { calendarId } : undefined,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete event');
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', locationId] });
      toast.success('Termin erfolgreich gelöscht');
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || error?.message || 'Fehler beim Löschen des Termins';
      toast.error(errorMsg);
    },
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createEvent: createMutation.mutate,
    updateEvent: updateMutation.mutate,
    deleteEvent: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
