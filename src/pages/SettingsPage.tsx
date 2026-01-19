import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/newDashboard/ui/Card';
import { Button } from '../components/newDashboard/ui/Button';
import { StatusBadge } from '../components/newDashboard/StatusBadge';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useAuthContext } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { useNavigation } from '../hooks/useNavigation';
import { ROUTES } from '../config/navigation';
import { apiClient } from '../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/Toast';
import { extractErrorMessage, extractUserFriendlyError } from '../lib/errorUtils';
import { UserFriendlyError } from '../components/ui/UserFriendlyError';
import { SettingsPageSkeleton } from '../components/ui/Skeleton';
import { supabase } from '../lib/supabase';
import { PhoneSetupWizard } from '../components/dashboard/PhoneSetupWizard';
import { VoiceSelector } from '../components/agent/VoiceSelector';
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
  Save,
  Mic,
  Globe,
  Wand2,
} from 'lucide-react';
import { useUpdateAgentConfig } from '../hooks/useUpdateAgentConfig';

export const SettingsPage = () => {
  const { user } = useAuthContext();
  const location = useLocation();
  const nav = useNavigation();
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isPhoneConnectionOpen, setIsPhoneConnectionOpen] = useState(false);
  const updateAgentConfig = useUpdateAgentConfig();
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // New fields for agent configuration
  const [adminTestNumber, setAdminTestNumber] = useState<string>('');
  const [bookingRequiredFields, setBookingRequiredFields] = useState<string[]>([]);
  const [bookingDurationMin, setBookingDurationMin] = useState<number>(30);

  // Voice settings fields
  const [primaryLocale, setPrimaryLocale] = useState<string>('de-CH');
  const [voiceId, setVoiceId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [recordingConsent, setRecordingConsent] = useState<boolean>(true);

  // Available booking field options
  const availableBookingFields = [
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Telefonnummer' },
    { id: 'email', label: 'E-Mail' },
    { id: 'service', label: 'Service/Anliegen' },
    { id: 'preferredTime', label: 'Wunschdatum/-zeit' },
    { id: 'timezone', label: 'Zeitzone' },
    { id: 'notes', label: 'Notizen/Details' },
  ];

  // Get breadcrumbs for this page
  const breadcrumbs = nav.getBreadcrumbs(location.pathname);

  // Update last refresh time when data updates
  useEffect(() => {
    if (overview) {
      setLastRefresh(new Date());
    }
  }, [overview]);

  // Initialize agent config fields from overview
  useEffect(() => {
    if (overview?.agent_config) {
      setAdminTestNumber(overview.agent_config.admin_test_number || '');
      setBookingRequiredFields(
        Array.isArray(overview.agent_config.booking_required_fields_json)
          ? overview.agent_config.booking_required_fields_json
          : ['name', 'phone', 'service', 'preferredTime', 'timezone'],
      );
      setBookingDurationMin(overview.agent_config.booking_default_duration_min || 30);
      // Initialize voice settings
      setPrimaryLocale(overview.agent_config.primary_locale || 'de-CH');
      setVoiceId(overview.agent_config.eleven_agent_id || '');
      setSystemPrompt(overview.agent_config.system_prompt || '');
      setRecordingConsent(overview.agent_config.recording_consent ?? true);
    }
  }, [overview?.agent_config]);

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

      const isAllowedOrigin = allowedOrigins.some(
        (allowed) =>
          event.origin === allowed ||
          event.origin.includes(allowed.replace('https://', '').replace('http://', '')),
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
        const errorMsg =
          typeof event.data.message === 'string'
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
        '/calendar/google/auth',
      );
      if (response.data?.success && response.data.data?.authUrl) {
        const isMockUrl =
          response.data.data.authUrl.includes('/calendar/') &&
          response.data.data.authUrl.includes('code=mock_code');

        if (isMockUrl) {
          toast.warning(
            'OAuth ist noch nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in Render Environment Variables.',
          );
          return;
        }

        const width = 600;
        const height = 700;
        const left = globalThis.screen.width / 2 - width / 2;
        const top = globalThis.screen.height / 2 - height / 2;
        const authWindow = globalThis.open(
          response.data.data.authUrl,
          'Calendar OAuth',
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        if (!authWindow) {
          toast.error('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.');
          return;
        }

        handleAuthWindow(authWindow);
      } else {
        throw new Error('Keine Auth-URL erhalten');
      }
    } catch (error: unknown) {
      console.error('[SettingsPage] Calendar connection error:', error);
      const userFriendlyError = extractUserFriendlyError(error, 'Fehler beim Verbinden des Kalenders');
      toast.error(`${userFriendlyError.title}: ${userFriendlyError.message}`);
    }
  };

  const handleConnectMicrosoftCalendar = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { authUrl: string } }>(
        '/calendar/outlook/auth',
      );
      if (response.data?.success && response.data.data?.authUrl) {
        const width = 600;
        const height = 700;
        const left = globalThis.screen.width / 2 - width / 2;
        const top = globalThis.screen.height / 2 - height / 2;
        const authWindow = globalThis.open(
          response.data.data.authUrl,
          'Microsoft Calendar OAuth',
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        if (!authWindow) {
          toast.error('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.');
          return;
        }

        handleAuthWindow(authWindow);
      } else {
        throw new Error('Keine Auth-URL erhalten');
      }
    } catch (error: unknown) {
      console.error('[SettingsPage] Microsoft Calendar connection error:', error);
      const userFriendlyError = extractUserFriendlyError(error, 'Fehler beim Verbinden des Microsoft Kalenders');
      toast.error(`${userFriendlyError.title}: ${userFriendlyError.message}`);
    }
  };

  const handleAuthWindow = (authWindow: Window) => {
    let pollInterval: NodeJS.Timeout | null = null;

    const messageListener = (event: MessageEvent) => {
      const allowedOrigins = [
        'https://real-aidevelo-ai.onrender.com',
        'https://aidevelo.ai',
        'https://www.aidevelo.ai',
        globalThis.location.origin,
      ];

      const isAllowed = allowedOrigins.some(
        (origin) =>
          event.origin === origin ||
          event.origin.includes(origin.replace('https://', '').replace('http://', '')),
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
        const errorMsg =
          typeof event.data.message === 'string'
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
      const userFriendlyError = extractUserFriendlyError(error, 'Fehler beim Trennen des Kalenders');
      toast.error(`${userFriendlyError.title}: ${userFriendlyError.message}`);
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

  // Handle saving all agent config fields
  const handleSaveAgentConfig = async () => {
    if (!overview?.agent_config) {
      toast.error('Agent-Konfiguration nicht gefunden');
      return;
    }

    setIsSavingConfig(true);
    try {
      await updateAgentConfig.mutateAsync({
        admin_test_number: adminTestNumber.trim() || null,
        booking_required_fields_json: bookingRequiredFields,
        booking_default_duration_min: bookingDurationMin,
        primary_locale: primaryLocale,
        eleven_agent_id: voiceId || null,
        system_prompt: systemPrompt.trim() || null,
        recording_consent: recordingConsent,
      });

      toast.success('Agent-Konfiguration gespeichert');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
    } catch (error: unknown) {
      const status = (error as any)?.response?.status || (error as any)?.status;
      // Don't show duplicate error for 503 - mutation's onError already handles it
      if (status !== 503) {
        const userFriendlyError = extractUserFriendlyError(error, 'Fehler beim Speichern der Agent-Konfiguration');
        toast.error(`${userFriendlyError.title}: ${userFriendlyError.message}`);
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Toggle booking required field
  const toggleBookingField = (fieldId: string) => {
    setBookingRequiredFields((prev) => {
      if (prev.includes(fieldId)) {
        return prev.filter((id) => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  // Move field up/down in order
  const moveBookingField = (fieldId: string, direction: 'up' | 'down') => {
    setBookingRequiredFields((prev) => {
      const index = prev.indexOf(fieldId);
      if (index === -1) return prev;

      const newFields = [...prev];
      if (direction === 'up' && index > 0) {
        [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      } else if (direction === 'down' && index < newFields.length - 1) {
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      }
      return newFields;
    });
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
          <SettingsPageSkeleton />
        </main>
      </div>
    );
  }

  if (error || !overview) {
    const userFriendlyError = extractUserFriendlyError(
      error || new Error('Einstellungen konnten nicht geladen werden'),
      'Einstellungen konnten nicht geladen werden'
    );

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
              <div className="max-w-lg w-full">
                <UserFriendlyError
                  error={userFriendlyError}
                  onRetry={() => globalThis.location.reload()}
                />
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
    overview.status.phone === 'connected'
      ? 'ok'
      : overview.status.phone === 'needs_compliance'
        ? 'warning'
        : 'error';

  const calendarHealth: 'ok' | 'error' | 'warning' =
    overview.status.calendar === 'connected' ? 'ok' : 'error';

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      <SideNav />

      <main className="flex-1 ml-64 flex flex-col min-w-0" role="main">
        <header
          className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg"
          role="banner"
        >
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-gray-400">
              <li>
                <span className="text-sm font-semibold text-white font-display">Einstellungen</span>
              </li>
            </ol>
          </nav>
          {lastRefresh && (
            <output
              className="text-xs text-gray-500 bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800"
              aria-live="polite"
            >
              Letzte Aktualisierung:{' '}
              {lastRefresh.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </output>
          )}
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <PageHeader
            title="Einstellungen"
            breadcrumbs={breadcrumbs}
            description="Verwalten Sie Ihre Agent-Konfiguration, Kalender-Verbindungen und Telefon-Einstellungen"
            showBackButton={true}
            backButtonTo={ROUTES.DASHBOARD}
          />
          <div className="space-y-8">
            {/* Account Section */}
            <Card title="Account" icon={Settings}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                      E-Mail-Adresse
                    </label>
                    <p className="text-white font-medium">{userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                      Passwort
                    </label>
                    <p className="text-gray-400 text-sm mb-2">Passwort zurücksetzen</p>
                    <Button variant="outline" size="sm" onClick={handlePasswordReset}>
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
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                      Organisationsname
                    </label>
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
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                      Standortname
                    </label>
                    <p className="text-white font-medium">{overview.location.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                      Zeitzone
                    </label>
                    <p className="text-white font-medium">{overview.location.timezone}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">Read-only</p>
              </div>
            </Card>

            {/* Agent Configuration Section */}
            <Card title="Agent-Konfiguration" icon={Bot}>
              <div className="space-y-4">
                {/* Admin Test Number */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <label
                        htmlFor="admin-test-number"
                        className="text-xs text-gray-500 uppercase tracking-wider block"
                      >
                        🧪 Admin Test-Nummer
                      </label>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                        NUR FÜR TESTS
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      Diese Nummer wird <strong>ausschließlich</strong> für den "Agent testen"
                      Button verwendet. Sie hat keinen Einfluss auf produktive Anrufe.
                    </p>
                    <input
                      id="admin-test-number"
                      type="tel"
                      value={adminTestNumber}
                      onChange={(e) => setAdminTestNumber(e.target.value)}
                      placeholder="+41791234567"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    />
                  </div>
                </div>

                {/* Booking Required Fields */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Pflichtfelder für Terminbuchung
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Welche Angaben muss der Agent zwingend erfassen, bevor er einen Termin bucht?
                    </p>
                    <div className="space-y-2">
                      {availableBookingFields.map((field) => {
                        const isSelected = bookingRequiredFields.includes(field.id);
                        const fieldIndex = bookingRequiredFields.indexOf(field.id);
                        return (
                          <label
                            key={field.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBookingField(field.id)}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500/50 rounded"
                            />
                            <span className="flex-1 text-white text-sm">{field.label}</span>
                            {isSelected && fieldIndex >= 0 && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveBookingField(field.id, 'up');
                                  }}
                                  disabled={fieldIndex === 0}
                                  className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Nach oben"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveBookingField(field.id, 'down');
                                  }}
                                  disabled={fieldIndex === bookingRequiredFields.length - 1}
                                  className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Nach unten"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {bookingRequiredFields.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Reihenfolge:{' '}
                        {bookingRequiredFields
                          .map((id) => availableBookingFields.find((f) => f.id === id)?.label)
                          .join(' → ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Default Duration */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Standard-Termindauer (Minuten)
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Standarddauer für gebuchte Termine in Minuten.
                    </p>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={bookingDurationMin}
                      onChange={(e) => setBookingDurationMin(parseInt(e.target.value, 10) || 30)}
                      aria-label="Standard-Termindauer in Minuten"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                {/* Save All Config Button */}
                <div className="pt-4 border-t border-slate-700/50">
                  <Button
                    variant="primary"
                    onClick={handleSaveAgentConfig}
                    disabled={isSavingConfig || !overview?.agent_config}
                    className="w-full"
                  >
                    {isSavingConfig ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Speichern...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Alle Einstellungen speichern
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Voice Settings Section */}
            <Card title="Voice-Einstellungen" icon={Mic}>
              <div className="space-y-4">
                {/* Primary Locale */}
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label
                      htmlFor="primary-locale"
                      className="text-xs text-gray-500 uppercase tracking-wider mb-2 block"
                    >
                      Sprache
                    </label>
                    <select
                      id="primary-locale"
                      value={primaryLocale}
                      onChange={(e) => setPrimaryLocale(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                    >
                      <option value="de-CH">Deutsch (CH)</option>
                      <option value="de-DE">Deutsch (DE)</option>
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="fr-CH">Français (CH)</option>
                    </select>
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                  <Mic className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Stimme auswählen & testen
                    </label>
                    <VoiceSelector selectedVoiceId={voiceId} onVoiceSelect={setVoiceId} />
                  </div>
                </div>

                {/* Recording Consent */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                  <div className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={recordingConsent}
                        onChange={(e) => setRecordingConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
                      />
                      <div>
                        <p className="font-semibold text-white">Aufzeichnung aktivieren</p>
                        <p className="text-sm text-gray-400">
                          Anrufe werden aufgezeichnet und stehen in den Logs zur Verfügung.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                  <Wand2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label
                      htmlFor="system-prompt"
                      className="text-xs text-gray-500 uppercase tracking-wider mb-2 block"
                    >
                      System Prompt
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Beschreibe Tonalität, Aufgaben und Grenzen des Agents.
                    </p>
                    <textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 font-mono text-sm"
                      placeholder="Beschreibe Tonalität, Aufgaben und Grenzen..."
                    />
                    <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 text-sm text-gray-400 mt-2 flex items-start gap-2">
                      <Wand2 size={16} className="mt-0.5" />
                      <span>Halte Antworten prägnant und nenne dem Anrufer die nächsten Schritte klar.</span>
                    </div>
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
                        <StatusBadge
                          status={
                            phoneHealth === 'ok'
                              ? 'completed'
                              : phoneHealth === 'warning'
                                ? 'pending'
                                : 'failed'
                          }
                        />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        {phoneConnected
                          ? overview.phone_number
                            ? `Verbunden: ${overview.phone_number}`
                            : 'Verbunden'
                          : 'Nicht verbunden'}
                      </p>
                      {phoneConnected ? (
                        <p className="text-gray-500 text-xs">
                          Telefonnummer kann nicht getrennt werden
                        </p>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleConnectPhone}>
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
                              Verbunden mit:{' '}
                              <span className="font-medium text-white">
                                {overview.calendar_connected_email}
                              </span>
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
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={handleConnectCalendar}>
                              Google Calendar verbinden
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleConnectMicrosoftCalendar}
                            >
                              Microsoft 365 verbinden
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ElevenLabs Affiliate Section */}
            {overview.elevenlabs_affiliate_link && (
              <Card title="ElevenLabs Affiliate" icon={Info}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                        Affiliate-Link
                      </label>
                      <p className="text-gray-400 text-sm mb-3">
                        Teile diesen Link mit Kunden, um ElevenLabs-Accounts zu empfehlen. Du
                        erhältst 22% Provision für 12 Monate.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={overview.elevenlabs_affiliate_link}
                          readOnly
                          className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(overview.elevenlabs_affiliate_link || '');
                            toast.success('Link in Zwischenablage kopiert');
                          }}
                        >
                          Kopieren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(overview.elevenlabs_affiliate_link || '', '_blank');
                          }}
                        >
                          Öffnen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* System Section */}
            <Card title="System" icon={Info}>
              <div className="space-y-4">
                {overview._backendSha && (
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                        Backend Version
                      </label>
                      <p className="text-white font-mono text-sm">
                        {overview._backendSha.substring(0, 7)}
                      </p>
                    </div>
                  </div>
                )}
                {lastRefresh && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                        Letzte Aktualisierung
                      </label>
                      <p className="text-white font-medium">
                        {lastRefresh.toLocaleString('de-CH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
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

      {/* PhoneSetupWizard */}
      <PhoneSetupWizard
        isOpen={isPhoneConnectionOpen}
        onClose={() => setIsPhoneConnectionOpen(false)}
        onSuccess={async () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
          queryClient.invalidateQueries({ queryKey: ['phone', 'status'] });
          queryClient.invalidateQueries({ queryKey: ['phone', 'numbers'] });
          await refetch();
        }}
      />
    </div>
  );
};
