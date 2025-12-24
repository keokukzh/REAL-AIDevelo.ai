import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrossSectionNav } from '../components/navigation/CrossSectionNav';
import { ROUTES } from '../config/navigation';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useAuthContext } from '../contexts/AuthContext';
import { SetupWizard } from '../components/dashboard/SetupWizard';
import { PreviewBanner } from '../components/dashboard/PreviewBanner';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal';
import { AgentTestModal } from '../components/dashboard/AgentTestModal';
import { PhoneConnectionModal } from '../components/dashboard/PhoneConnectionModal';
import { WebhookStatusModal } from '../components/dashboard/WebhookStatusModal';
import { AvailabilityModal } from '../components/dashboard/AvailabilityModal';
import { CalendarEventModal } from '../components/dashboard/CalendarEventModal';
import { SideNav } from '../components/dashboard/SideNav';
import { apiClient } from '../services/apiClient';
import { toast } from '../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/newDashboard/ui/Card';
import { Button } from '../components/newDashboard/ui/Button';
import { StatCard } from '../components/newDashboard/StatCard';
import { StatusBadge } from '../components/newDashboard/StatusBadge';
import { QuickActionButton } from '../components/newDashboard/QuickActionButton';
import { HealthItem } from '../components/newDashboard/HealthItem';
import { SkeletonStatCard } from '../components/newDashboard/Skeleton';
import { EmptyCalls, EmptyCalendar } from '../components/newDashboard/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Phone, Calendar, PhoneMissed, Clock, Mic, Settings, Globe, XCircle, MoreHorizontal, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mapCallsToChartData, mapOverviewToKPIs, mapCallToTableRow } from '../lib/dashboardAdapters';
import { useCalendarEvents, CalendarEvent } from '../hooks/useCalendarEvents';
import { CallLog } from '../hooks/useCallLogs';
import { extractErrorMessage } from '../lib/errorUtils';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();

  // Check for calendar connection success/error in URL params (fallback if postMessage fails)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    if (urlParams.get('calendar') === 'connected') {
      toast.success('Kalender erfolgreich verbunden');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('error') === 'calendar_connection_failed') {
      const errorMsg = urlParams.get('msg') || 'Fehler beim Verbinden des Kalenders. Bitte versuchen Sie es erneut.';
      toast.error(decodeURIComponent(errorMsg));
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [queryClient, refetch]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [isAgentTestOpen, setIsAgentTestOpen] = useState(false);
  const [isPhoneConnectionOpen, setIsPhoneConnectionOpen] = useState(false);
  const [isWebhookStatusOpen, setIsWebhookStatusOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Handle 401 - redirect to login (NOT onboarding)
  React.useEffect(() => {
    if (error && 'status' in error && error.status === 401) {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } else if (error) {
      // Log other errors but don't crash the dashboard
      const errorMessage = extractErrorMessage(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        console.warn('[DashboardPage] Network error - dashboard may show limited data:', errorMessage);
        // Don't show toast for network errors on initial load - user might be offline
      } else {
        console.error('[DashboardPage] Dashboard error:', error);
      }
    }
  }, [error, logout, navigate]);

  // Update last refresh time when data updates
  React.useEffect(() => {
    if (overview) {
      setLastRefresh(new Date());
    }
  }, [overview]);

  // Handle calendar OAuth postMessage events
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Accept messages from our frontend URL or backend (for OAuth callback)
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || globalThis.location.origin;
      const allowedOrigins = [
        frontendUrl,
        'https://aidevelo.ai',
        'https://www.aidevelo.ai',
        'https://real-aidevelo-ai.onrender.com',
        globalThis.location.origin,
      ];
      
      // Check if origin is allowed (more permissive for OAuth callback)
      const isAllowedOrigin = allowedOrigins.some(allowed => 
        event.origin === allowed || 
        event.origin.includes(allowed.replace('https://', '').replace('http://', ''))
      );
      
      if (!isAllowedOrigin) {
        console.warn('[DashboardPage] Rejected postMessage from origin:', event.origin);
        return;
      }

      if (event.data?.type === 'calendar-oauth-success') {
        console.log('[DashboardPage] Calendar OAuth success received');
        toast.success('Kalender erfolgreich verbunden');
        // Refetch dashboard overview
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
        // Check if this is a mock URL (for testing without OAuth configured)
        const isMockUrl = response.data.data.authUrl.includes('/calendar/') && response.data.data.authUrl.includes('code=mock_code');
        
        if (isMockUrl) {
          // For testing: show info message
          toast.warning('OAuth ist noch nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in Render Environment Variables.');
          return;
        }

        // Open OAuth window
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

        // Store interval ID for cleanup
        let pollInterval: NodeJS.Timeout | null = null;

        // Listen for OAuth callback postMessage
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
            console.log('[DashboardPage] Calendar OAuth success via postMessage');
            toast.success('Kalender erfolgreich verbunden');
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
            refetch();
            authWindow?.close();
            window.removeEventListener('message', messageListener);
            // Clean up polling if it exists
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
            // Clean up polling if it exists
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        };

        window.addEventListener('message', messageListener);

        // Fallback: Poll for calendar connection if postMessage doesn't work
        // (e.g., if Chrome blocks the callback page)
        let pollCount = 0;
        const maxPolls = 30; // 30 seconds
        pollInterval = setInterval(() => {
          pollCount++;
          
          // Check if window was closed
          if (authWindow?.closed) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            window.removeEventListener('message', messageListener);
            
            // If window closed and we haven't received success, check if calendar is connected
            if (pollCount < maxPolls) {
              // Wait a bit for backend to process, then check
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
                refetch().then((result) => {
                  // Check if calendar is now connected using refetched data
                  if (result.data?.status?.calendar === 'connected') {
                    toast.success('Kalender erfolgreich verbunden');
                  }
                });
              }, 2000);
            }
            return;
          }
          
          // Stop polling after max attempts
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
      console.error('[DashboardPage] Calendar connection error:', error);
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
        // Refetch dashboard overview
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



  // Determine effective overview early (before any hooks that depend on it)
  // This allows dashboard to work even with network errors
  const isNetworkError = error && (
    extractErrorMessage(error).includes('Failed to fetch') || 
    extractErrorMessage(error).includes('NetworkError') ||
    extractErrorMessage(error).includes('Network request failed')
  );
  
  // Create safe fallback overview
  const safeOverview = overview || {
    user: { id: '', email: user?.email || null },
    organization: { id: '', name: '' },
    location: { id: '', name: '', timezone: 'Europe/Zurich' },
    agent_config: {
      id: '',
      eleven_agent_id: null,
      setup_state: 'needs_setup',
      persona_gender: null,
      persona_age_range: null,
      goals_json: [],
      services_json: [],
      business_type: null,
    },
    status: {
      agent: 'needs_setup' as const,
      phone: 'not_connected' as const,
      calendar: 'not_connected' as const,
    },
    recent_calls: [],
  };
  
  // Use safe overview for rendering (allows dashboard to work even with network errors)
  const displayOverview = overview || safeOverview;
  const effectiveOverview = displayOverview;

  // Fetch today's and next few days' events for dashboard
  // IMPORTANT: ALL hooks must be called before any early returns
  // Note: We create a new Date() each render for "today" since we want current date
  // For weekEnd, we memoize based on today's date string to avoid unnecessary recalculations
  const today = new Date();
  const todayDateString = today.toDateString();
  const weekEnd = React.useMemo(() => addDays(today, 7), [todayDateString]);
  const calendarConnected = effectiveOverview?.status?.calendar === 'connected';
  const { events: calendarEvents, isLoading: isLoadingEvents } = useCalendarEvents({
    locationId: effectiveOverview?.location?.id || '',
    start: startOfDay(today),
    end: endOfDay(weekEnd),
    enabled: calendarConnected && !!effectiveOverview?.location?.id,
  });

  // Get next 5 upcoming events
  // Use a ref for "now" to avoid creating new Date on every render
  const nowRef = useRef(new Date());
  const upcomingEvents = React.useMemo(() => {
    // Update nowRef periodically (every minute) or use current time for comparison
    const now = new Date();
    // Update ref if more than a minute has passed
    if (now.getTime() - nowRef.current.getTime() > 60000) {
      nowRef.current = now;
    }
    return calendarEvents
      .filter(event => new Date(event.start) >= nowRef.current)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  // Compute derived values - must be before early returns
  const userName = React.useMemo(() => user?.email || effectiveOverview?.user?.email || 'Benutzer', [user?.email, effectiveOverview?.user?.email]);
  const isAgentActive = React.useMemo(() => effectiveOverview?.agent_config?.setup_state === 'ready', [effectiveOverview?.agent_config?.setup_state]);
  const showWizard = React.useMemo(() => !isAgentActive, [isAgentActive]);

  // Map data for new UI (memoized to prevent recalculation on every render)
  const kpis = React.useMemo(() => effectiveOverview ? mapOverviewToKPIs(effectiveOverview) : { totalCalls: 0, appointmentsBooked: 0, missedCalls: 0, avgDuration: '0:00' }, [effectiveOverview]);
  const chartData = React.useMemo(() => effectiveOverview?.recent_calls ? mapCallsToChartData(effectiveOverview.recent_calls) : [], [effectiveOverview?.recent_calls]);
  const recentCallsTableData = React.useMemo(() => effectiveOverview?.recent_calls ? effectiveOverview.recent_calls.map(mapCallToTableRow) : [], [effectiveOverview?.recent_calls]);

  // Determine system health status (memoized)
  const phoneHealth: 'ok' | 'error' | 'warning' = React.useMemo(() => {
    // Use gateway_health from backend if available (more accurate)
    if (effectiveOverview?.gateway_health) {
      return effectiveOverview.gateway_health;
    }
    // Fallback to phone status-based health
    return effectiveOverview?.status?.phone === 'connected' ? 'ok' : effectiveOverview?.status?.phone === 'needs_compliance' ? 'warning' : 'error';
  }, [effectiveOverview?.gateway_health, effectiveOverview?.status?.phone]);
  
  const calendarHealth: 'ok' | 'error' | 'warning' = React.useMemo(() => 
    effectiveOverview?.status?.calendar === 'connected' ? 'ok' : 'error',
    [effectiveOverview?.status?.calendar]
  );
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleTestAgent = React.useCallback(() => {
    setIsAgentTestOpen(true);
  }, []);
  
  const handleConnectPhone = React.useCallback(() => {
    setIsPhoneConnectionOpen(true);
  }, []);
  
  const handleCheckWebhook = React.useCallback(() => {
    setIsWebhookStatusOpen(true);
  }, []);
  
  const handleViewCalls = React.useCallback(() => {
    navigate('/calls');
  }, [navigate]);
  
  const handleCallClick = React.useCallback((call: {
    id: string;
    callSid?: string;
    direction: string;
    from_e164: string | null;
    to_e164: string | null;
    started_at: string;
    ended_at: string | null;
    duration_sec: number | null;
    outcome: string | null;
  }) => {
    setSelectedCall(call as CallLog);
    setIsCallDetailsOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <header className="h-16 bg-background/80 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-sm font-semibold text-white font-display">Dashboard</span>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400">Tagesübersicht</span>
            </div>
          </header>
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner fullScreen={false} size="lg" message="Dashboard wird geladen..." />
          </div>
        </main>
      </div>
    );
  }

  // Only show error screen for non-network errors
  if ((error && !isNetworkError) || (!overview && !isLoading && !isNetworkError)) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-white">Fehler beim Laden</h2>
              <p className="text-gray-400 mb-4">
                {error instanceof Error ? error.message : 'Unbekannter Fehler'}
              </p>
              <Button onClick={() => refetch()}>
                Erneut versuchen
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Zum Hauptinhalt springen
      </a>

      {/* Background Effects - Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" aria-hidden="true" />
      
      {/* Side Navigation */}
      <SideNav />

      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Zum Hauptinhalt springen"
      >
        Zum Hauptinhalt springen
      </a>

      {/* Main Content */}
      <main id="main-content" className="flex-1 lg:ml-64 flex flex-col min-w-0" role="main" tabIndex={-1}>
        {/* Top Header */}
        <header className="h-16 bg-background/80 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg" role="banner">
          <nav aria-label="Breadcrumb" className="flex items-center gap-4">
            <ol className="flex items-center gap-3 text-gray-400" role="list">
              <li>
                <span className="text-sm font-semibold text-white font-display">Dashboard</span>
              </li>
              <li aria-hidden="true">
                <span className="text-gray-600">/</span>
              </li>
              <li>
                <span className="text-sm text-gray-400">Tagesübersicht</span>
              </li>
            </ol>
            <CrossSectionNav variant="header" className="ml-6 pl-6 border-l border-white/10" />
          </nav>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {/* Preview Banner - Voice Agents Coming Soon */}
          <PreviewBanner onExploreAgents={handleTestAgent} />

          {/* Setup Wizard (shown when setup_state != 'ready') */}
          {showWizard && (
            <div className="mb-8">
              <SetupWizard onComplete={() => {}} />
            </div>
          )}

          <div className="space-y-8">
            {/* Welcome & Time Range */}
            <section aria-labelledby="welcome-heading">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 id="welcome-heading" className="text-3xl font-bold font-display text-white tracking-tight">
                    Willkommen, {userName.split('@')[0]}
                  </h1>
                  <p className="text-gray-400 mt-2 text-sm">Hier ist der aktuelle Status Ihres Voice Agents für heute.</p>
                </div>
              {lastRefresh && (
                <output className="text-xs text-gray-500 bg-surface/50 px-3 py-1.5 rounded-md border border-slate-800" aria-live="polite">
                  Letzte Aktualisierung: {lastRefresh.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </output>
              )}
              </div>
            </section>

            {/* KPI Grid */}
            <section aria-label="Key Performance Indicators">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard 
                label="Gesamtanrufe" 
                value={kpis.totalCalls} 
                icon={Phone}
                iconColor="text-blue-400"
                bgColor="bg-blue-500/10"
              />
              <StatCard 
                label="Termine gebucht" 
                value={kpis.appointmentsBooked} 
                icon={Calendar}
                iconColor="text-green-400"
                bgColor="bg-green-500/10"
              />
              <StatCard 
                label="Verpasste Anrufe" 
                value={kpis.missedCalls} 
                icon={PhoneMissed}
                iconColor="text-swiss-red"
                bgColor="bg-swiss-red/10"
              />
              <StatCard 
                label="Durchschn. Dauer" 
                value={kpis.avgDuration} 
                icon={Clock}
                iconColor="text-purple-400"
                bgColor="bg-purple-500/10"
              />
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column (Calendar, Chart & Logs) */}
              <div className="xl:col-span-2 space-y-8">
                {/* Calendar Card */}
                <Card 
                  title="Kalender"
                  action={
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {calendarConnected ? (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {effectiveOverview.calendar_provider ? `${effectiveOverview.calendar_provider.charAt(0).toUpperCase() + effectiveOverview.calendar_provider.slice(1)} Calendar` : 'Google Calendar'}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDisconnectCalendar(); }} 
                              className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"
                              title="Verbindung trennen"
                              aria-label="Kalenderverbindung trennen"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-gray-400 text-xs font-medium">
                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                              Offline
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleConnectCalendar} className="text-xs h-7 px-2 text-accent hover:text-accent hover:bg-accent/10">
                              Verbinden
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                >
                  {calendarConnected ? (
                    <div className="space-y-4">
                      {effectiveOverview.calendar_connected_email && (
                        <div className="text-sm text-gray-300 mb-3">
                          Verbunden mit: <span className="font-medium">{effectiveOverview.calendar_connected_email}</span>
                        </div>
                      )}
                      
                      {/* Upcoming Events List */}
                      {isLoadingEvents ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : upcomingEvents.length > 0 ? (
                        <div className="space-y-2">
                          {upcomingEvents.map((event) => {
                            const eventDate = new Date(event.start);
                            const isToday = eventDate.toDateString() === todayDateString;
                            const summaryParts = event.summary.split(' - ');
                            const clientName = summaryParts.length > 1 ? summaryParts[0] : '';
                            const service = summaryParts.length > 1 ? summaryParts[1] : event.summary;

                            return (
                              <div
                                key={event.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                                  event.aiBooked
                                    ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                }`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsCreateAppointmentModalOpen(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedEvent(event);
                                    setIsCreateAppointmentModalOpen(true);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Termin: ${event.summary}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-mono text-gray-400">
                                        {eventDate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isToday && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                                          Heute
                                        </span>
                                      )}
                                      {event.aiBooked && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                                          AI
                                        </span>
                                      )}
                                    </div>
                                    {clientName && (
                                      <div className="font-semibold text-white text-sm truncate">
                                        {clientName}
                                      </div>
                                    )}
                                    <div className={`text-sm truncate ${clientName ? 'text-gray-300' : 'text-white font-medium'}`}>
                                      {service}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                      setIsCreateAppointmentModalOpen(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 transition-all"
                                    aria-label="Termin bearbeiten"
                                  >
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          Keine bevorstehenden Termine
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                        <Button 
                          size="sm" 
                          onClick={() => setIsAvailabilityModalOpen(true)}
                          className="flex-1"
                          variant="outline"
                        >
                          Verfügbarkeit prüfen
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(null);
                            setSelectedSlot(undefined);
                            setIsCreateAppointmentModalOpen(true);
                          }}
                          className="flex-1"
                        >
                          Termin erstellen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(ROUTES.CALENDAR)}
                          className="text-accent hover:text-accent hover:bg-accent/10"
                          aria-label="Alle Termine ansehen"
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <EmptyCalendar onConnect={handleConnectCalendar} />
                  )}
                </Card>

                {/* Activity Chart */}
                <Card title="Anrufvolumen (Live)" className="min-h-[400px]">
                  <div className="h-[320px] w-full mt-4" aria-label="Anrufvolumen Chart">
                    {chartData.some(d => d.calls > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} aria-label="Anrufvolumen über Zeit">
                          <defs>
                            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#DA291C" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#DA291C" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            dy={10} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                          />
                          <Tooltip 
                            contentStyle={{
                              borderRadius: '8px', 
                              border: '1px solid rgba(255, 255, 255, 0.1)', 
                              backgroundColor: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                            }} 
                            itemStyle={{color: '#f1f5f9', fontWeight: 600}}
                            labelStyle={{color: '#cbd5e1'}}
                            cursor={{stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4'}}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="calls" 
                            stroke="#DA291C" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorCalls)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Noch keine Anrufdaten verfügbar</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Recent Logs Table */}
                <Card 
                  title="Letzte Anrufe" 
                  action={
                    <Button variant="ghost" size="sm" className="text-swiss-red hover:bg-swiss-red/10" onClick={handleViewCalls} aria-label="Alle Anrufe ansehen">
                      Alle ansehen
                    </Button>
                  }
                >
                  {recentCallsTableData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left" role="table" aria-label="Letzte Anrufe">
                        <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
                          <tr role="row">
                            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Anrufer</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Dauer</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-right">Zeit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {recentCallsTableData.slice(0, 10).map((row) => {
                            const originalCall = effectiveOverview.recent_calls.find(c => c.id === row.id);
                            return (
                              <tr 
                                key={row.id} 
                                role="row"
                                className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                onClick={() => originalCall && handleCallClick(originalCall)}
                                onKeyDown={(e) => {
                                  if ((e.key === 'Enter' || e.key === ' ') && originalCall) {
                                    e.preventDefault();
                                    handleCallClick(originalCall);
                                  }
                                }}
                                tabIndex={0}
                                aria-label={`Anruf von ${row.caller}, ${row.status}, ${row.duration}`}
                              >
                                <td className="px-4 py-4">
                                  <StatusBadge status={row.status} />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="font-medium text-white">{row.caller}</div>
                                </td>
                                <td className="px-4 py-4 text-gray-400 font-mono text-xs">{row.duration}</td>
                                <td className="px-4 py-4 text-right">
                                  <span className="text-gray-400">{row.timestamp}</span>
                                  <button 
                                    className="ml-2 p-1 text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (originalCall) handleCallClick(originalCall);
                                    }}
                                    aria-label="Anrufdetails anzeigen"
                                    title="Anrufdetails anzeigen"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyCalls onAction={handleTestAgent} />
                  )}
                </Card>
              </div>

              {/* Right Column (Agent & System) */}
              <div className="space-y-6">
                {/* Agent Card */}
                <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm text-white p-6 shadow-xl relative overflow-hidden border border-slate-700/50">
                  {/* Abstract Background Shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-swiss-red/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg">
                          <Mic className="w-6 h-6 text-swiss-red" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-4 h-4 ${isAgentActive ? 'bg-emerald-500' : 'bg-amber-500'} border-2 border-slate-900 rounded-full animate-pulse`}></div>
                      </div>
                      <div>
                        <h3 className="font-bold font-display text-lg">AIDevelo Receptionist</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
                          <Globe className="w-3 h-3" />
                          <span>Schweizerdeutsch</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isAgentActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isAgentActive ? 'Active' : 'Setup'}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Agent Status</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">
                      {isAgentActive 
                        ? 'Agent ist aktiv und bereit für Anrufe.'
                        : 'Agent benötigt Konfiguration. Bitte Setup abschließen.'}
                    </p>
                    {!effectiveOverview.agent_config.eleven_agent_id && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 text-xs text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>ElevenLabs Agent ID fehlt</span>
                        </div>
                      </div>
                    )}
                  </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Branche</div>
                      <div className="font-medium text-sm text-white">{effectiveOverview.agent_config.business_type || 'Nicht gesetzt'}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Nummer</div>
                      <div className="font-medium text-sm font-mono text-white">
                        {effectiveOverview.phone_number ? `${effectiveOverview.phone_number.substring(0, 8)}...` : 'Nicht verbunden'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-800 relative z-10">
                    <Button 
                      onClick={handleTestAgent} 
                      className="w-full bg-swiss-red hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20"
                    >
                      Agent testen
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <Card title="Quick Actions" className="border-slate-700/50">
                  <div className="space-y-1.5">
                    <QuickActionButton 
                      icon={Phone} 
                      label="Telefon verbinden" 
                      onClick={handleConnectPhone}
                      disabled={effectiveOverview.status.phone === 'connected'}
                    />
                    <QuickActionButton 
                      icon={Calendar} 
                      label="Kalender verbinden" 
                      onClick={handleConnectCalendar}
                      disabled={calendarConnected}
                    />
                    <QuickActionButton 
                      icon={Settings} 
                      label="Webhook Status prüfen" 
                      onClick={handleCheckWebhook}
                    />
                    <QuickActionButton 
                      icon={PhoneMissed} 
                      label="Calls ansehen" 
                      onClick={handleViewCalls}
                    />
                  </div>
                </Card>

                {/* System Health Compact */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 font-display">System Health</h4>
                  <div className="space-y-3.5">
                    <HealthItem label="Twilio Gateway" status={phoneHealth} />
                    <HealthItem label="Google Calendar Sync" status={calendarHealth} />
                    <HealthItem label="ElevenLabs TTS" status={effectiveOverview.agent_config.eleven_agent_id ? 'ok' : 'warning'} />
                    <HealthItem label="Supabase DB" status="ok" />
                  </div>
                  
                  {/* ElevenLabs Credits Display */}
                  {effectiveOverview.elevenlabs_quota && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-display">ElevenLabs Credits</span>
                        <span className={`text-xs font-semibold ${
                          effectiveOverview.elevenlabs_quota.status === 'critical' ? 'text-red-400' :
                          effectiveOverview.elevenlabs_quota.status === 'warning' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {effectiveOverview.elevenlabs_quota.remaining.toLocaleString()} / {effectiveOverview.elevenlabs_quota.character_limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            effectiveOverview.elevenlabs_quota.status === 'critical' ? 'bg-red-500' :
                            effectiveOverview.elevenlabs_quota.status === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(effectiveOverview.elevenlabs_quota.percentageUsed, 100)}%` }}
                        />
                      </div>
                      {effectiveOverview.elevenlabs_quota.warning && (
                        <p className="text-xs text-yellow-400 mt-2">
                          ⚠️ {effectiveOverview.elevenlabs_quota.percentageUsed.toFixed(1)}% verbraucht
                        </p>
                      )}
                      {effectiveOverview.elevenlabs_quota.status === 'critical' && (
                        <p className="text-xs text-red-400 mt-2">
                          🚨 Kritisch: {effectiveOverview.elevenlabs_quota.percentageUsed.toFixed(1)}% verbraucht - Tests blockiert
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals - All existing modals remain unchanged */}
      <CallDetailsModal
        isOpen={isCallDetailsOpen}
        onClose={() => {
          setIsCallDetailsOpen(false);
          setSelectedCall(null);
        }}
        call={selectedCall}
      />

      <AgentTestModal
        isOpen={isAgentTestOpen}
        onClose={() => setIsAgentTestOpen(false)}
        agentConfigId={effectiveOverview.agent_config.id}
        locationId={effectiveOverview.location.id}
        elevenAgentId={effectiveOverview.agent_config.eleven_agent_id}
        adminTestNumber={(effectiveOverview.agent_config as any).admin_test_number || null}
      />

      <PhoneConnectionModal
        isOpen={isPhoneConnectionOpen}
        onClose={() => setIsPhoneConnectionOpen(false)}
        agentConfigId={effectiveOverview.agent_config.id}
        locationId={effectiveOverview.location.id}
        onSuccess={() => {
          // Dashboard will automatically refresh via query invalidation
        }}
      />

      <WebhookStatusModal
        isOpen={isWebhookStatusOpen}
        onClose={() => setIsWebhookStatusOpen(false)}
      />

      <AvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        locationId={effectiveOverview.location.id}
        onCreateAppointment={(slot) => {
          setSelectedSlot(slot);
          setIsAvailabilityModalOpen(false);
          setIsCreateAppointmentModalOpen(true);
        }}
      />

      <CalendarEventModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={() => {
          setIsCreateAppointmentModalOpen(false);
          setSelectedSlot(undefined);
          setSelectedEvent(null);
          queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
        }}
        locationId={effectiveOverview.location.id}
        event={selectedEvent}
        initialSlot={selectedSlot}
      />
    </div>
  );
};
