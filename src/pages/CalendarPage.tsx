import React, { useState, useMemo, useCallback } from 'react';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/newDashboard/ui/Card';
import { Button } from '../components/newDashboard/ui/Button';
import { AvailabilityModal } from '../components/dashboard/AvailabilityModal';
import { CalendarEventModal } from '../components/dashboard/CalendarEventModal';
import { CalendarView } from '../components/dashboard/CalendarView';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useCalendarEvents, CalendarEvent } from '../hooks/useCalendarEvents';
import { apiClient } from '../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/Toast';
import { 
  Calendar, 
  Plus, 
  Search,
  AlertCircle
} from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

export const CalendarPage = () => {
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | undefined>();

  const calendarConnected = overview?.status?.calendar === 'connected';
  const locationId = overview?.location?.id || '';

  // Calculate date range for current view (we'll use month range for now, CalendarView will handle filtering)
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return { start: monthStart, end: monthEnd };
  }, [currentDate]);

  // Fetch calendar events
  const { events, refetch: refetchEvents } = useCalendarEvents({
    locationId,
    start: dateRange.start,
    end: dateRange.end,
    enabled: calendarConnected && !!locationId,
  });

  // Handle calendar connect
  const handleConnectCalendar = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { authUrl: string } }>('/calendar/google/auth');
      
      if (response.data?.success && response.data.data?.authUrl) {
        // Open OAuth window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          response.data.data.authUrl,
          'Calendar OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          toast.error('Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für diese Seite.');
          return;
        }

        // Listen for OAuth callback
        const messageListener = (event: MessageEvent) => {
          // Accept messages from backend (real-aidevelo-ai.onrender.com) or frontend
          const allowedOrigins = [
            'https://real-aidevelo-ai.onrender.com',
            'https://aidevelo.ai',
            'https://www.aidevelo.ai',
            globalThis.location.origin,
          ];
          
          const isAllowed = allowedOrigins.some(origin => 
            event.origin === origin || 
            event.origin.includes(origin.replace('https://', '').replace('http://', ''))
          );
          
          if (!isAllowed) {
            return;
          }

          if (event.data?.type === 'calendar-oauth-success') {
            console.log('[CalendarPage] Calendar OAuth success via postMessage');
            toast.success('Kalender erfolgreich verbunden');
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
            refetch();
            authWindow?.close();
            window.removeEventListener('message', messageListener);
          } else if (event.data?.type === 'calendar-oauth-error') {
            const errorMsg = typeof event.data.message === 'string' 
              ? event.data.message 
              : 'Fehler bei der Kalender-Verbindung';
            toast.error(errorMsg);
            authWindow?.close();
            window.removeEventListener('message', messageListener);
          }
        };

        window.addEventListener('message', messageListener);

        // Check if window was closed manually
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
          }
        }, 1000);
      } else {
        throw new Error('Fehler beim Abrufen der OAuth-URL');
      }
    } catch (error: any) {
      console.error('[CalendarPage] Calendar connection error:', error);
      
      // Extract error message from various error formats
      let errorMsg = 'Unbekannter Fehler';
      
      if (error?.response?.data) {
        // Handle Axios error response
        const errorData = error.response.data;
        if (typeof errorData.error === 'string') {
          errorMsg = errorData.error;
        } else if (typeof errorData.message === 'string') {
          errorMsg = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.error && typeof errorData.error === 'object') {
          // If error is an object, try to extract message
          errorMsg = errorData.error.message || errorData.error.error || JSON.stringify(errorData.error);
        }
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      toast.error(`Fehler beim Verbinden: ${errorMsg}`);
    }
  };

  // Handle calendar disconnect
  const handleDisconnectCalendar = async () => {
    if (!confirm('Möchten Sie den Kalender wirklich trennen?')) {
      return;
    }

    try {
      const response = await apiClient.delete('/calendar/google/disconnect');
      if (response.data?.success) {
        toast.success('Kalender erfolgreich getrennt');
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        refetch();
      } else {
        throw new Error('Disconnect fehlgeschlagen');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Trennen: ${errorMsg}`);
    }
  };

  // Handle create appointment from availability slot (memoized)
  const handleCreateFromSlot = useCallback((slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setSelectedEvent(undefined);
    setIsAvailabilityModalOpen(false);
    setIsEventModalOpen(true);
  }, []);

  // Handle event click (memoized)
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(undefined);
    setIsEventModalOpen(true);
  }, []);

  // Handle event edit (memoized)
  const handleEventEdit = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(undefined);
    setIsEventModalOpen(true);
  }, []);

  // Handle event delete (will be handled by CalendarEventModal) (memoized)
  const handleEventDelete = useCallback(() => {
    // Delete is handled in CalendarEventModal
    refetchEvents();
  }, [refetchEvents]);

  // Handle date click (create new event on that date) (memoized)
  const handleDateClick = useCallback((date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(9, 30, 0, 0);
    
    setSelectedSlot({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-semibold text-white mb-2">Fehler beim Laden</h2>
            <p className="text-gray-400">Die Kalender-Daten konnten nicht geladen werden.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      <SideNav />
      
      <main className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg" role="banner">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Kalender</h1>
            <p className="text-sm text-gray-400">Verwalte deine Termine und Kalender-Integration</p>
          </div>
          <div className="flex items-center gap-3">
            {calendarConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAvailabilityModalOpen(true)}
                >
                  <Search size={16} className="mr-2" />
                  Verfügbarkeit prüfen
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(undefined);
                    setSelectedSlot(undefined);
                    setIsEventModalOpen(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Termin erstellen
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectCalendar}
              >
                <Calendar size={16} className="mr-2" />
                Google Calendar verbinden
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {calendarConnected ? (
            <CalendarView
              events={events}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onEventClick={handleEventClick}
              onEventEdit={handleEventEdit}
              onEventDelete={handleEventDelete}
              onDateClick={handleDateClick}
              calendarConnected={calendarConnected}
              calendarProvider={overview.calendar_provider}
              onDisconnect={handleDisconnectCalendar}
            />
          ) : (
            <Card 
              title="Kalender-Integration"
              description="Verbinde deinen Kalender für automatische Terminbuchungen"
            >
              <div className="text-center py-12">
                <Calendar className="mx-auto mb-4 text-gray-400" size={64} />
                <p className="text-gray-300 mb-6 text-lg">
                  Verbinde deinen Kalender, um Termine automatisch zu verwalten
                </p>
                <Button
                  onClick={handleConnectCalendar}
                  size="lg"
                >
                  <Calendar size={20} className="mr-2" />
                  Google Calendar verbinden
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Modals */}
      {locationId && (
        <>
          <AvailabilityModal
            isOpen={isAvailabilityModalOpen}
            onClose={() => setIsAvailabilityModalOpen(false)}
            locationId={locationId}
            onCreateAppointment={handleCreateFromSlot}
          />
          <CalendarEventModal
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(undefined);
              setSelectedSlot(undefined);
              refetchEvents();
            }}
            locationId={locationId}
            event={selectedEvent}
            initialSlot={selectedSlot}
          />
        </>
      )}
    </div>
  );
};
