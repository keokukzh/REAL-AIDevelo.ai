import React, { useState, useEffect } from 'react';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/newDashboard/ui/Card';
import { Button } from '../components/newDashboard/ui/Button';
import { StatusBadge } from '../components/newDashboard/StatusBadge';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useAuthContext } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/Toast';
import { extractErrorMessage } from '../lib/errorUtils';
import { supabase } from '../lib/supabase';
import { PhoneConnectionModal } from '../components/dashboard/PhoneConnectionModal';
import { 
  Settings, 
  Mail, 
  Lock, 
  Building, 
  MapPin, 
  Clock, 
  Phone, 
  Calendar, 
  XCircle,
  Info,
  Bot,
  Save
} from 'lucide-react';
import { useUpdateAgentConfig } from '../hooks/useUpdateAgentConfig';

export const SettingsPage = () => {
  const { user } = useAuthContext();
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isPhoneConnectionOpen, setIsPhoneConnectionOpen] = useState(false);
  const updateAgentConfig = useUpdateAgentConfig();
  const [elevenAgentId, setElevenAgentId] = useState<string>('');
  const [isSavingAgentId, setIsSavingAgentId] = useState(false);

  // Update last refresh time when data updates
  useEffect(() => {
    if (overview) {
      setLastRefresh(new Date());
    }
  }, [overview]);

  // Initialize ElevenLabs Agent ID from overview
  useEffect(() => {
    if (overview?.agent_config?.eleven_agent_id) {
      setElevenAgentId(overview.agent_config.eleven_agent_id);
    } else {
      setElevenAgentId('');
    }
  }, [overview?.agent_config?.eleven_agent_id]);

  // Handle calendar OAuth postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || globalThis.location.origin;
      const allowedOrigins = [
        frontendUrl,
        'https://aidevelo.ai',
        'https://www.aidevelo.ai',
        'https://real-aidevelo-ai.onrender.com',
        globalThis.location.origin,
      ];
      
      const isAllowedOrigin = allowedOrigins.some(allowed => 
        event.origin === allowed || 
        event.origin.includes(allowed.replace('https://', '').replace('http://', ''))
      );
      
      if (!isAllowedOrigin) {
        console.warn('[SettingsPage] Rejected postMessage from origin:', event.origin);
        return;
      }

      if (event.data?.type === 'calendar-oauth-success') {
        console.log('[SettingsPage] Calendar OAuth success received');
        toast.success('Kalender erfolgreich verbunden');
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        refetch();
      } else if (event.data?.type === 'calendar-oauth-error') {
        const errorMsg = typeof event.data.message === 'string' 
          ? event.data.message 
          : 'Fehler beim Verbinden des Kalenders';
        toast.error(errorMsg);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, refetch]);

  // Handle calendar OAuth connection
  const handleConnectCalendar = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { authUrl: string } }>(
        '/calendar/google/auth'
      );
      if (response.data?.success && response.data.data?.authUrl) {
        const isMockUrl = response.data.data.authUrl.includes('/calendar/') && response.data.data.authUrl.includes('code=mock_code');
        
        if (isMockUrl) {
          toast.warning('OAuth ist noch nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in Render Environment Variables.');
          return;
        }

        const width = 600;
        const height = 700;
        const left = globalThis.screen.width / 2 - width / 2;
        const top = globalThis.screen.height / 2 - height / 2;
        const authWindow = globalThis.open(
          response.data.data.authUrl,
          'Calendar OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        if (!authWindow) {
          toast.error('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.');
          return;
        }

        let pollInterval: NodeJS.Timeout | null = null;

        const messageListener = (event: MessageEvent) => {
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
            console.log('[SettingsPage] Calendar OAuth success via postMessage');
            toast.success('Kalender erfolgreich verbunden');
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
            refetch();
            authWindow?.close();
            window.removeEventListener('message', messageListener);
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          } else if (event.data?.type === 'calendar-oauth-error') {
            const errorMsg = typeof event.data.message === 'string' 
              ? event.data.message 
              : 'Fehler beim Verbinden des Kalenders';
            toast.error(errorMsg);
            authWindow?.close();
            window.removeEventListener('message', messageListener);
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        };

        window.addEventListener('message', messageListener);

        let pollCount = 0;
        const maxPolls = 30;
        pollInterval = setInterval(() => {
          pollCount++;
          
          if (authWindow?.closed) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            window.removeEventListener('message', messageListener);
            
            if (pollCount < maxPolls) {
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
                refetch().then((result) => {
                  if (result.data?.status?.calendar === 'connected') {
                    toast.success('Kalender erfolgreich verbunden');
                  }
                });
              }, 2000);
            }
            return;
          }
          
          if (pollCount >= maxPolls) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            window.removeEventListener('message', messageListener);
          }
        }, 1000);
      } else {
        throw new Error('Keine Auth-URL erhalten');
      }
    } catch (error: unknown) {
      console.error('[SettingsPage] Calendar connection error:', error);
      const errorMsg = extractErrorMessage(error, 'Fehler beim Verbinden des Kalenders');
      toast.error(`Fehler beim Verbinden des Kalenders: ${errorMsg}`);
    }
  };

  // Handle calendar disconnect
  const handleDisconnectCalendar = async () => {
    try {
      const response = await apiClient.delete('/calendar/google/disconnect');
      if (response.data?.success) {
        toast.success('Kalender erfolgreich getrennt');
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        refetch();
      } else {
        throw new Error('Disconnect fehlgeschlagen');
      }
    } catch (error: unknown) {
      const errorMsg = extractErrorMessage(error, 'Fehler beim Trennen des Kalenders');
      toast.error(errorMsg);
    }
  };

  // Handle phone connection
  const handleConnectPhone = () => {
    setIsPhoneConnectionOpen(true);
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    const email = user?.email || overview?.user?.email;
    if (!email) {
      toast.error('E-Mail-Adresse nicht gefunden');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
      });

      if (error) {
        throw error;
      }

      toast.success('Passwort-Reset-E-Mail wurde gesendet. Bitte überprüfe dein Postfach.');
    } catch (error: unknown) {
      const errorMsg = extractErrorMessage(error, 'Fehler beim Senden der Passwort-Reset-E-Mail');
      toast.error(errorMsg);
    }
  };

  // Handle ElevenLabs Agent ID save
  const handleSaveAgentId = async () => {
    if (!overview?.agent_config) {
      toast.error('Agent-Konfiguration nicht gefunden');
      return;
    }

    setIsSavingAgentId(true);
    try {
      await updateAgentConfig.mutateAsync({
        eleven_agent_id: elevenAgentId.trim() || null,
      });
      toast.success('ElevenLabs Agent ID erfolgreich gespeichert');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
    } catch (error: unknown) {
      const errorMsg = extractErrorMessage(error, 'Fehler beim Speichern der Agent ID');
      toast.error(errorMsg);
    } finally {
      setIsSavingAgentId(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 ml-64 flex flex-col min-w-0">
          <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-sm font-semibold text-white font-display">Einstellungen</span>
            </div>
          </header>
          <div className="p-8 max-w-[1600px] mx-auto w-full">
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 ml-64 flex flex-col min-w-0">
          <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-sm font-semibold text-white font-display">Einstellungen</span>
            </div>
          </header>
          <div className="p-8 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-white">Fehler beim Laden</h2>
                <p className="text-gray-400 mb-4">
                  {error instanceof Error ? error.message : 'Unbekannter Fehler'}
                </p>
                <Button onClick={() => globalThis.location.reload()}>
                  Seite neu laden
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userEmail = user?.email || overview.user.email || 'Nicht verfügbar';
  const calendarConnected = overview.status.calendar === 'connected';
  const phoneConnected = overview.status.phone === 'connected';

  const phoneHealth: 'ok' | 'error' | 'warning' = 
    overview.status.phone === 'connected' ? 'ok' : 
    overview.status.phone === 'needs_compliance' ? 'warning' : 'error';
  
  const calendarHealth: 'ok' | 'error' | 'warning' = 
    overview.status.calendar === 'connected' ? 'ok' : 'error';

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      <SideNav />

      <main className="flex-1 ml-64 flex flex-col min-w-0" role="main">
        <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg" role="banner">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-gray-400">
              <li>
                <span className="text-sm font-semibold text-white font-display">Einstellungen</span>
              </li>
            </ol>
          </nav>
          {lastRefresh && (
            <output className="text-xs text-gray-500 bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800" aria-live="polite">
              Letzte Aktualisierung: {lastRefresh.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </output>
          )}
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <div className="space-y-8">
            {/* Account Section */}
            <Card title="Account" icon={Settings}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">E-Mail-Adresse</label>
                    <p className="text-white font-medium">{userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Passwort</label>
                    <p className="text-gray-400 text-sm mb-2">Passwort zurücksetzen</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePasswordReset}
                    >
                      Passwort-Reset-E-Mail senden
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Organization Section */}
            <Card title="Organisation" icon={Building}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Organisationsname</label>
                    <p className="text-white font-medium">{overview.organization.name}</p>
                    <p className="text-gray-400 text-xs mt-1">Read-only</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Location Section */}
            <Card title="Standort" icon={MapPin}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Standortname</label>
                    <p className="text-white font-medium">{overview.location.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Zeitzone</label>
                    <p className="text-white font-medium">{overview.location.timezone}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">Read-only</p>
              </div>
            </Card>

            {/* Agent Configuration Section */}
            <Card title="Agent-Konfiguration" icon={Bot}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      ElevenLabs Agent ID
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Die Agent ID von ElevenLabs, die für Voice Calls verwendet wird. 
                      Du findest diese in deinem ElevenLabs Dashboard.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={elevenAgentId}
                        onChange={(e) => setElevenAgentId(e.target.value)}
                        placeholder="z.B. abc123def456..."
                        className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveAgentId}
                        disabled={isSavingAgentId || !overview?.agent_config}
                      >
                        {isSavingAgentId ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Speichern...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Speichern
                          </>
                        )}
                      </Button>
                    </div>
                    {overview?.agent_config?.eleven_agent_id && (
                      <p className="text-green-400 text-xs mt-2">
                        ✓ Agent ID ist konfiguriert
                      </p>
                    )}
                    {!overview?.agent_config?.eleven_agent_id && (
                      <p className="text-yellow-400 text-xs mt-2">
                        ⚠ Agent ID fehlt - Agent kann nicht getestet werden
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Integrations Section */}
            <Card title="Integrationen" icon={Settings}>
              <div className="space-y-6">
                {/* Phone Integration */}
                <div className="flex items-start justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-start gap-3 flex-1">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-medium">Twilio Telefon</h3>
                        <StatusBadge status={phoneHealth === 'ok' ? 'completed' : phoneHealth === 'warning' ? 'pending' : 'failed'} />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        {phoneConnected 
                          ? overview.phone_number 
                            ? `Verbunden: ${overview.phone_number}` 
                            : 'Verbunden'
                          : 'Nicht verbunden'}
                      </p>
                      {phoneConnected ? (
                        <p className="text-gray-500 text-xs">Telefonnummer kann nicht getrennt werden</p>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleConnectPhone}
                        >
                          Telefon verbinden
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calendar Integration */}
                <div className="flex items-start justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-start gap-3 flex-1">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-medium">
                          {overview.calendar_provider 
                            ? `${overview.calendar_provider.charAt(0).toUpperCase() + overview.calendar_provider.slice(1)} Calendar`
                            : 'Google Calendar'}
                        </h3>
                        <StatusBadge status={calendarHealth === 'ok' ? 'completed' : 'failed'} />
                      </div>
                      {calendarConnected ? (
                        <>
                          {overview.calendar_connected_email && (
                            <p className="text-gray-400 text-sm mb-2">
                              Verbunden mit: <span className="font-medium text-white">{overview.calendar_connected_email}</span>
                            </p>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDisconnectCalendar}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Kalender trennen
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm mb-2">Nicht verbunden</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleConnectCalendar}
                          >
                            Kalender verbinden
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Section */}
            <Card title="System" icon={Info}>
              <div className="space-y-4">
                {overview._backendSha && (
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Backend Version</label>
                      <p className="text-white font-mono text-sm">{overview._backendSha.substring(0, 7)}</p>
                    </div>
                  </div>
                )}
                {lastRefresh && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Letzte Aktualisierung</label>
                      <p className="text-white font-medium">
                        {lastRefresh.toLocaleString('de-CH', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Phone Connection Modal */}
      <PhoneConnectionModal
        isOpen={isPhoneConnectionOpen}
        onClose={() => setIsPhoneConnectionOpen(false)}
        agentConfigId={overview.agent_config.id}
        locationId={overview.location.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
          refetch();
        }}
      />
    </div>
  );
};
