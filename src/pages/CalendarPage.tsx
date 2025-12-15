import React, { useState } from 'react';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/newDashboard/ui/Card';
import { Button } from '../components/newDashboard/ui/Button';
import { AvailabilityModal } from '../components/dashboard/AvailabilityModal';
import { CreateAppointmentModal } from '../components/dashboard/CreateAppointmentModal';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { apiClient } from '../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/Toast';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export const CalendarPage = () => {
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const queryClient = useQueryClient();
  
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | undefined>();

  const calendarConnected = overview?.status?.calendar === 'connected';
  const locationId = overview?.location?.id || '';

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
          if (event.origin !== globalThis.location.origin) return;

          if (event.data.type === 'calendar-oauth-success') {
            toast.success('Kalender erfolgreich verbunden');
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
            refetch();
            authWindow?.close();
            window.removeEventListener('message', messageListener);
          } else if (event.data.type === 'calendar-oauth-error') {
            toast.error(event.data.message || 'Fehler bei der Kalender-Verbindung');
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
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
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

  // Handle create appointment from availability slot
  const handleCreateFromSlot = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setIsAvailabilityModalOpen(false);
    setIsCreateAppointmentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <SideNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <SideNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Fehler beim Laden</h2>
            <p className="text-slate-600">Die Kalender-Daten konnten nicht geladen werden.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SideNav />
      
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Kalender</h1>
          <p className="text-slate-600">Verwalte deine Kalender-Integration und Termine</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Status Card */}
            <Card 
              title="Kalender-Integration"
              description={calendarConnected 
                ? `Verbunden mit ${overview.calendar_connected_email || overview.calendar_provider || 'Google Calendar'}`
                : 'Verbinde deinen Kalender für automatische Terminbuchungen'
              }
            >
              {calendarConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">
                        {overview.calendar_provider 
                          ? `${overview.calendar_provider.charAt(0).toUpperCase() + overview.calendar_provider.slice(1)} Calendar`
                          : 'Google Calendar'}
                      </p>
                      {overview.calendar_connected_email && (
                        <p className="text-sm text-emerald-700">{overview.calendar_connected_email}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectCalendar}
                    >
                      <XCircle size={16} className="mr-2" />
                      Trennen
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      onClick={() => setIsAvailabilityModalOpen(true)}
                      className="w-full"
                    >
                      <Search size={16} className="mr-2" />
                      Verfügbarkeit prüfen
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setIsCreateAppointmentModalOpen(true)}
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Termin erstellen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-600 mb-6">
                    Verbinde deinen Kalender, um Termine automatisch zu verwalten
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleConnectCalendar}
                  >
                    <Calendar size={16} className="mr-2" />
                    Google Calendar verbinden
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Actions Card */}
            {calendarConnected && (
              <Card title="Schnellaktionen">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsAvailabilityModalOpen(true)}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="text-blue-600" size={20} />
                      </div>
                      <h3 className="font-semibold text-slate-900">Verfügbarkeit prüfen</h3>
                    </div>
                    <p className="text-sm text-slate-600">
                      Prüfe verfügbare Zeitslots für einen bestimmten Tag
                    </p>
                  </button>

                  <button
                    onClick={() => setIsCreateAppointmentModalOpen(true)}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Plus className="text-emerald-600" size={20} />
                      </div>
                      <h3 className="font-semibold text-slate-900">Termin erstellen</h3>
                    </div>
                    <p className="text-sm text-slate-600">
                      Erstelle einen neuen Termin in deinem Kalender
                    </p>
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card title="Informationen">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Kalender-Integration</h4>
                  <p className="text-slate-600">
                    Verbinde deinen Google Calendar oder Outlook, um Termine automatisch zu verwalten und verfügbare Zeitslots zu prüfen.
                  </p>
                </div>
                {calendarConnected && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Verfügbare Funktionen</h4>
                    <ul className="text-slate-600 space-y-1 list-disc list-inside">
                      <li>Verfügbarkeit prüfen</li>
                      <li>Termine erstellen</li>
                      <li>Automatische Terminbuchungen</li>
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Help Card */}
            <Card title="Hilfe">
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  <strong className="text-slate-900">Verfügbarkeit prüfen:</strong> Wähle ein Datum und prüfe verfügbare Zeitslots basierend auf deinen Geschäftszeiten.
                </p>
                <p>
                  <strong className="text-slate-900">Termin erstellen:</strong> Erstelle neue Termine direkt in deinem verbundenen Kalender.
                </p>
                {overview.calendar_connected_email && (
                  <a
                    href={`https://calendar.google.com/calendar/u/${overview.calendar_connected_email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-swiss-red hover:underline"
                  >
                    Kalender in Google öffnen
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {locationId && (
        <>
          <AvailabilityModal
            isOpen={isAvailabilityModalOpen}
            onClose={() => setIsAvailabilityModalOpen(false)}
            locationId={locationId}
            onCreateAppointment={handleCreateFromSlot}
          />
          <CreateAppointmentModal
            isOpen={isCreateAppointmentModalOpen}
            onClose={() => {
              setIsCreateAppointmentModalOpen(false);
              setSelectedSlot(undefined);
            }}
            locationId={locationId}
            initialSlot={selectedSlot}
          />
        </>
      )}
    </div>
  );
};
