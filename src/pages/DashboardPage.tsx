import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrossSectionNav } from '../components/navigation/CrossSectionNav.js';
import { ROUTES } from '../config/navigation.js';
import { DashboardOverview } from '../hooks/useDashboardOverview.js';
import { useNavigation } from '../hooks/useNavigation.js';
import { useAuthContext } from '../contexts/AuthContext.js';
import { useAgentActivation } from '../hooks/useAgentActivation.js';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useDashboardModals } from '../hooks/useDashboardModals.js';
import { usePhoneStatus } from '../hooks/usePhoneStatus.js';
import { useCalendarIntegration } from '../hooks/useCalendarIntegration.js';
import { SetupWizard } from '../components/dashboard/SetupWizard.js';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal.js';
import { AgentTestModal } from '../components/dashboard/AgentTestModal.js';
import { PhoneSetupWizard } from '../components/dashboard/PhoneSetupWizard.js';
import { WebhookStatusModal } from '../components/dashboard/WebhookStatusModal.js';
import { AvailabilityModal } from '../components/dashboard/AvailabilityModal.js';
import { CalendarEventModal } from '../components/dashboard/CalendarEventModal.js';
import { SideNav } from '../components/dashboard/SideNav.js';
import { VoiceAgentControlCenter } from '../components/dashboard/VoiceAgentControlCenter.js';
import {
  ActivationChecklist,
  type SelectionItem,
} from '../components/dashboard/ActivationChecklist.js';
import { logger } from '../lib/logger.js';
import { TestCallButton } from '../components/dashboard/TestCallButton.js';
import { toast } from '../components/ui/Toast.js';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/newDashboard/ui/Card.js';
import { Button } from '../components/newDashboard/ui/Button.js';
import { EnhancedStatCard } from '../components/newDashboard/EnhancedStatCard.js';
import { StatusBadge } from '../components/newDashboard/StatusBadge.js';
import { QuickActionButton } from '../components/newDashboard/QuickActionButton.js';
import { HealthItem } from '../components/newDashboard/HealthItem.js';
import { EmptyCalls, EmptyCalendar } from '../components/newDashboard/EmptyState.js';
import { DashboardSkeleton, CalendarEventSkeleton } from '../components/ui/Skeleton.js';
import { MobileBottomNav } from '../components/mobile/MobileBottomNav.js';
import { MobileTableCard, MobileTableCardList } from '../components/mobile/MobileTableCard.js';
import { PullToRefreshIndicator } from '../components/mobile/PullToRefreshIndicator.js';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import {
  Phone,
  Calendar,
  PhoneMissed,
  Clock,
  Settings,
  XCircle,
  MoreHorizontal,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CallLog } from '../hooks/useCallLogs.js';
import { extractErrorMessage, extractUserFriendlyError } from '../lib/errorUtils.js';
import { UserFriendlyError } from '../components/ui/UserFriendlyError.js';
import { NotificationCenter } from '../components/notifications/NotificationCenter.js';
import { NotificationBell } from '../components/notifications/NotificationBell.js';
import { useProactiveAlerts } from '../hooks/useProactiveAlerts.js';
import { useSuccessNotifications } from '../hooks/useSuccessNotifications.js';
import { DashboardErrorBoundary } from '../components/dashboard/DashboardErrorBoundary.js';

export const DashboardPage = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:74',message:'Component mount',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1_H2_H3_H4_H5'})}).catch(()=>{});
  // #endregion
  const navigate = useNavigate();
  const nav = useNavigation();
  const { user, logout } = useAuthContext();
  const queryClient = useQueryClient();
  
  // Use custom hooks for data and modals
  const dashboardData = useDashboardData();
  const { overview, isLoading, error, refetch } = dashboardData;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:82',message:'Dashboard data loaded',data:{hasOverview:!!overview,isLoading,hasError:!!error,overviewKeys:overview?Object.keys(overview):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  const modals = useDashboardModals();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:85',message:'Modals hook initialized',data:{modalKeys:Object.keys(modals)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const { phoneStatus, refreshStatus: refreshPhoneStatus } = usePhoneStatus();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:88',message:'Phone status loaded',data:{hasPhoneStatus:!!phoneStatus,phoneStatusKeys:phoneStatus?Object.keys(phoneStatus):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  
  // Pull-to-refresh for mobile
  const { isRefreshing, pullDistance, elementRef } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
    enabled: true,
  });

  // Check for calendar connection success/error in URL params (fallback if postMessage fails)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    if (urlParams.get('calendar') === 'connected') {
      toast.success('Kalender erfolgreich verbunden');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
      // Clean up URL
      globalThis.window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('error') === 'calendar_connection_failed') {
      const errorMsg =
        urlParams.get('msg') ||
        'Fehler beim Verbinden des Kalenders. Bitte versuchen Sie es erneut.';
      toast.error(decodeURIComponent(errorMsg));
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      refetch();
      // Clean up URL
      globalThis.window.history.replaceState({}, '', '/dashboard');
    }
  }, [queryClient, refetch]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const previousOverviewRef = React.useRef<DashboardOverview | undefined>(undefined);

  // Handle 401 - redirect to login (NOT onboarding)
  React.useEffect(() => {
    if (error && 'status' in error && error.status === 401) {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } else if (error) {
      // Log other errors but don't crash the dashboard
      const errorMessage = extractErrorMessage(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        logger.warn('Network error - dashboard may show limited data', {
          errorMessage,
        });
        // Don't show toast for network errors on initial load - user might be offline
      } else {
        logger.error('Dashboard error', error);
      }
    }
  }, [error, logout, navigate]);

  // Update last refresh time when data updates
  React.useEffect(() => {
    if (overview) {
      setLastRefresh(new Date());
    }
  }, [overview]);

  // Calendar integration hook handles postMessage events
  const { connectCalendar, disconnectCalendar } = useCalendarIntegration(
    () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:148',message:'Calendar connected callback',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      refetch();
    },
    (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:152',message:'Calendar connection error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      logger.error('Calendar connection error', new Error(error));
    },
  );

  // Calendar integration - use hook instead of inline implementation
  const handleConnectCalendar = connectCalendar;
  const handleDisconnectCalendar = disconnectCalendar;

  // Determine effective overview early (before any hooks that depend on it)
  // This allows dashboard to work even with network errors
  const isNetworkError =
    error &&
    (extractErrorMessage(error).includes('Failed to fetch') ||
      extractErrorMessage(error).includes('NetworkError') ||
      extractErrorMessage(error).includes('Network request failed'));

  // Create safe fallback overview
  const safeOverview: DashboardOverview = {
    user: { id: '', email: user?.email || null },
    organization: { id: '', name: '' },
    location: { id: '', name: '', timezone: 'Europe/Zurich' },
    agent_config: {
      id: '',
      setup_state: 'needs_setup',
      persona_gender: null,
      persona_age_range: null,
      goals_json: [] as string[],
      services_json: [] as unknown[],
      business_type: null,
      admin_test_number: null,
    },
    status: {
      agent: 'needs_setup' as const,
      phone: 'not_connected' as const,
      calendar: 'not_connected' as const,
    },
    recent_calls: [],
    phone_number: null,
    calendar_provider: null,
    calendar_connected_email: null,
    gateway_health: 'ok' as const,
  };

  // Use safe overview for rendering (allows dashboard to work even with network errors)
  const effectiveOverview = overview || safeOverview;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:196',message:'Effective overview computed',data:{usingOverview:!!overview,usingSafeOverview:!overview,hasAgentConfig:!!effectiveOverview?.agent_config,setupState:effectiveOverview?.agent_config?.setup_state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1_H5'})}).catch(()=>{});
  // #endregion

  // Extract data from dashboardData hook
  const {
    kpis,
    chartData,
    recentCallsTableData,
    upcomingEvents,
    isLoadingEvents,
    todayDateString,
    calendarConnected,
  } = dashboardData;

  // Compute derived values - must be before early returns
  const userName = React.useMemo(
    () => user?.email || effectiveOverview?.user?.email || 'Benutzer',
    [user?.email, effectiveOverview?.user?.email],
  );
  const isAgentActive = React.useMemo(
    () => effectiveOverview?.agent_config?.setup_state === 'ready',
    [effectiveOverview?.agent_config?.setup_state],
  );
  const showWizard = React.useMemo(() => !isAgentActive, [isAgentActive]);

  // Agent activation hook for VoiceAgentControlCenter
  const agentActivation = useAgentActivation(effectiveOverview?.agent_config?.id || '');


  // Determine system health status (memoized)
  const phoneHealth: 'ok' | 'error' | 'warning' = React.useMemo(() => {
    // Priority 1: Real-time phone status from /api/phone/status
    if (phoneStatus) {
      if (phoneStatus.twilioGateway === 'OK') return 'ok';
      if (phoneStatus.twilioGateway === 'WARN') return 'warning';
      return 'error';
    }

    // Priority 2: Use gateway_health from backend if available (more accurate)
    if (effectiveOverview?.gateway_health) {
      return effectiveOverview.gateway_health;
    }
    // Fallback to phone status-based health
    return effectiveOverview?.status?.phone === 'connected'
      ? 'ok'
      : effectiveOverview?.status?.phone === 'needs_compliance'
        ? 'warning'
        : 'error';
  }, [phoneStatus, effectiveOverview?.gateway_health, effectiveOverview?.status?.phone]);

  const calendarHealth: 'ok' | 'error' | 'warning' = React.useMemo(
    () => (effectiveOverview?.status?.calendar === 'connected' ? 'ok' : 'error'),
    [effectiveOverview?.status?.calendar],
  );

  // Proactive alerts based on system state
  useProactiveAlerts({
    overview: effectiveOverview,
    phoneHealth,
    calendarHealth,
  });

  // Success notifications for milestones
  useSuccessNotifications({
    overview: effectiveOverview,
    previousOverview: previousOverviewRef.current,
  });

  // Update previous overview ref
  React.useEffect(() => {
    if (effectiveOverview) {
      previousOverviewRef.current = effectiveOverview;
    }
  }, [effectiveOverview]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleTestAgent = modals.openAgentTest;
  const handleConnectPhone = modals.openPhoneWizard;
  const handleCheckWebhook = modals.openWebhookStatus;
  const handleViewCalls = React.useCallback(() => {
    navigate('/calls');
  }, [navigate]);
  const handleCallClick = React.useCallback(
    (call: {
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:287',message:'Call click handler',data:{callId:call.id,hasModals:!!modals},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      modals.openCallDetails(call as CallLog);
    },
    [modals],
  );

  const handlePhoneConnectionSuccess = React.useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:294',message:'Phone connection success handler called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    // Refresh phone status immediately after connection
    await refreshPhoneStatus();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:297',message:'Phone status refreshed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    // Also invalidate queries to refresh overview
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
    queryClient.invalidateQueries({ queryKey: ['phone', 'status'] });
    await refetch();
  }, [queryClient, refetch, refreshPhoneStatus]);

  // Checklist items based on dashboard status
  const checklistItems: SelectionItem[] = React.useMemo(
    () => [
      {
        id: 'agent',
        label: 'Agent-Profil vollständig',
        done: effectiveOverview?.status?.agent === 'ready',
        action: () => nav.goTo(ROUTES.AGENT_EDIT(effectiveOverview?.agent_config.id || '')),
      },
      {
        id: 'phone',
        label: 'Telefonnummer verknüpft',
        done: effectiveOverview?.status?.phone === 'connected',
        action: handleConnectPhone,
      },
      {
        id: 'calendar',
        label: 'Kalender synchronisiert',
        done: effectiveOverview?.status?.calendar === 'connected',
        action: () => handleConnectCalendar(),
      },
      {
        id: 'test',
        label: 'Erster Testanruf durchgeführt',
        done: (effectiveOverview?.recent_calls?.length || 0) > 0,
        action: handleTestAgent,
        actionLabel: 'Jetzt testen',
      },
    ],
    [effectiveOverview, handleConnectPhone, handleConnectCalendar, handleTestAgent, nav],
  );

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
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  // Only show error screen for non-network errors
  if ((error && !isNetworkError) || (!overview && !isLoading && !isNetworkError)) {
    const userFriendlyError = extractUserFriendlyError(error || new Error('Dashboard konnte nicht geladen werden'), 'Dashboard konnte nicht geladen werden');
    
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="max-w-lg w-full">
              <UserFriendlyError
                error={{
                  ...userFriendlyError,
                  action: () => navigate(ROUTES.DASHBOARD),
                  actionLabel: 'Zur Startseite',
                }}
                onRetry={() => refetch()}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className="min-h-screen bg-background flex font-sans text-white relative"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Zum Hauptinhalt springen
      </a>

      {/* Background Effects - Grid Pattern */}
      <div
        className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none"
        aria-hidden="true"
      />

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
      <main
        id="main-content"
        className="flex-1 lg:ml-64 flex flex-col min-w-0"
        role="main"
        tabIndex={-1}
      >
        {/* Top Header */}
        <header
          className="h-16 bg-background/80 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg"
          role="banner"
        >
          <nav aria-label="Breadcrumb" className="flex items-center gap-4 flex-1">
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
          <div className="flex items-center gap-2">
            <NotificationBell onClick={() => modals.openNotificationCenter()} />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-20 lg:pb-8">
          {/* Setup Wizard (shown when setup_state != 'ready') */}
          {showWizard && (
            <div className="mb-8">
              <SetupWizard onComplete={() => {}} />
            </div>
          )}

          <div className="space-y-8">
            {/* Welcome & Time Range */}
            <section aria-labelledby="welcome-heading">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <h1
                    id="welcome-heading"
                    className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight leading-tight"
                  >
                    {isAgentActive
                      ? `Willkommen zurück, ${userName.split('@')[0]}`
                      : `Bereit für den Start, ${userName.split('@')[0]}?`}
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    {!isAgentActive && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        Setup läuft
                      </div>
                    )}
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                      {isAgentActive
                        ? 'Dein KI-Sekretariat arbeitet fleissig im Hintergrund.'
                        : 'Vervollständige die folgenden Schritte, um deinen ersten Voice Agent live zu schalten.'}
                    </p>
                  </div>
                </div>

                {lastRefresh && (
                  <div className="flex flex-col items-end gap-2">
                    <output
                      className="text-[10px] sm:text-xs text-gray-500 bg-surface/50 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm"
                      aria-live="polite"
                    >
                      Aktualisiert:{' '}
                      {lastRefresh.toLocaleTimeString('de-CH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </output>
                  </div>
                )}
              </div>
            </section>

            {/* Onboarding Focus - Prominent Checklist for new users */}
            {!isAgentActive && checklistItems.some((i) => !i.done) && (
              <div className="mb-8 stagger-1">
                <ActivationChecklist
                  items={checklistItems}
                  title="Willkommen! Lassen Sie uns Ihren Agenten startklar machen"
                  className="ultra-glass border-accent/20 shadow-accent/5"
                />
              </div>
            )}

            {/* KPI Grid / ROI Summary */}
            <section aria-label="Key Performance Indicators" className="mb-8">
              <DashboardErrorBoundary sectionName="KPIs">
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`}>
                  <EnhancedStatCard
                  label="Gesamtanrufe"
                  value={kpis.totalCalls}
                  icon={Phone}
                  iconColor="text-blue-400"
                  bgColor="bg-blue-500/10"
                  trend={isAgentActive ? kpis.totalCallsTrend : undefined}
                  sparkline={isAgentActive ? kpis.totalCallsSparkline : undefined}
                  onClick={() => navigate('/calls')}
                />
                <EnhancedStatCard
                  label="Konversionsrate"
                  value={kpis.efficiency}
                  icon={Cpu}
                  iconColor="text-emerald-400"
                  bgColor="bg-emerald-500/10"
                  trend={isAgentActive ? kpis.efficiencyTrend : undefined}
                  sparkline={isAgentActive ? kpis.efficiencySparkline : undefined}
                />
                <EnhancedStatCard
                  label="Termine"
                  value={isAgentActive ? kpis.appointmentsBooked : '0'}
                  icon={Calendar}
                  iconColor="text-green-400"
                  bgColor="bg-green-500/10"
                  trend={isAgentActive && kpis.appointmentsTrend ? kpis.appointmentsTrend : undefined}
                  sparkline={isAgentActive ? kpis.appointmentsSparkline : undefined}
                  onClick={() => navigate('/calendar')}
                />
                <EnhancedStatCard
                  label="Gesparte Zeit"
                  value={isAgentActive ? kpis.savedTime : '0s'}
                  icon={Clock}
                  iconColor="text-purple-400"
                  bgColor="bg-purple-500/10"
                  description="ROI Schätzung"
                  trend={isAgentActive && kpis.savedTimeTrend ? kpis.savedTimeTrend : undefined}
                  />
                </div>
              </DashboardErrorBoundary>
            </section>

            {/* Voice Agent Control Center - FULL WIDTH HERO */}
            <section aria-label="Voice Agent Control Center" className="mb-0">
              <VoiceAgentControlCenter
                agentConfig={{
                  id: effectiveOverview.agent_config.id,
                  setup_state: effectiveOverview.agent_config.setup_state as
                    | 'ready'
                    | 'paused'
                    | 'inactive'
                    | 'needs_setup',
                  business_type: effectiveOverview.agent_config.business_type,
                }}
                phoneStatus={
                  phoneStatus
                    ? {
                        twilioGateway: phoneStatus.twilioGateway,
                        twilioConfigured: phoneStatus.twilioConfigured,
                        hasConnectedNumber: phoneStatus.hasConnectedNumber,
                        webhookConfigured: phoneStatus.webhookConfigured,
                        phoneNumber: phoneStatus.phoneNumber,
                      }
                    : null
                }
                isActivating={agentActivation.isActivating}
                isDeactivating={agentActivation.isDeactivating}
                isPausing={agentActivation.isPausing}
                onActivate={agentActivation.activate}
                onDeactivate={agentActivation.deactivate}
                onPause={agentActivation.pause}
                onResume={agentActivation.resume}
                onTestCall={handleTestAgent}
                onConfigurePhone={handleConnectPhone}
                onSettings={() => navigate(ROUTES.AGENT_EDIT(effectiveOverview.agent_config.id))}
                onViewLogs={handleViewCalls}
                className="shadow-accent/5 backdrop-blur-2xl"
              />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column (Calendar, Chart & Logs) */}
              <div className="xl:col-span-2 space-y-8">
                {/* Calendar Card */}
                <Card
                  title="Kalender"
                  className="ultra-glass"
                  action={
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {calendarConnected ? (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {effectiveOverview.calendar_provider
                              ? `${effectiveOverview.calendar_provider.charAt(0).toUpperCase() + effectiveOverview.calendar_provider.slice(1)} Calendar`
                              : 'Google Calendar'}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnectCalendar();
                              }}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleConnectCalendar}
                              className="text-xs h-7 px-2 text-accent hover:text-accent hover:bg-accent/10"
                            >
                              Verbinden
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                >
                  <DashboardErrorBoundary sectionName="Kalender">
                    {calendarConnected ? (
                      <div className="space-y-4">
                        {effectiveOverview.calendar_connected_email && (
                        <div className="text-sm text-gray-300 mb-3">
                          Verbunden mit:{' '}
                          <span className="font-medium">
                            {effectiveOverview.calendar_connected_email}
                          </span>
                        </div>
                      )}

                      {/* Upcoming Events List */}
                      {isLoadingEvents ? (
                        <CalendarEventSkeleton count={3} />
                      ) : upcomingEvents.length > 0 ? (
                        <div className="space-y-2">
                          {upcomingEvents.map((event) => {
                            const eventDate = new Date(event.start);
                            const isToday = eventDate.toDateString() === todayDateString;
                            const summaryParts = event.summary.split(' - ');
                            const clientName = summaryParts.length > 1 ? summaryParts[0] : '';
                            const service =
                              summaryParts.length > 1 ? summaryParts[1] : event.summary;

                            return (
                              <div
                                key={event.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                                  event.aiBooked
                                    ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                }`}
                                onClick={() => {
                                  modals.openCreateAppointment(event, undefined);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    modals.openCreateAppointment(event, undefined);
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
                                        {eventDate.toLocaleTimeString('de-CH', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
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
                                    <div
                                      className={`text-sm truncate ${clientName ? 'text-gray-300' : 'text-white font-medium'}`}
                                    >
                                      {service}
                                    </div>
                                  </div>
                                  <MoreHorizontal
                                    className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 transition-all"
                                    aria-hidden="true"
                                  />
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
                          onClick={() => modals.openAvailability()}
                          className="flex-1"
                          variant="outline"
                        >
                          Verfügbarkeit prüfen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            modals.openCreateAppointment(null, undefined);
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
                </DashboardErrorBoundary>
              </Card>

                {/* Activity Chart */}
                <Card title="Anrufvolumen (Live)" className="min-h-[400px]">
                  <DashboardErrorBoundary sectionName="Anrufvolumen Chart">
                    <div className="h-[280px] sm:h-[320px] w-full mt-4 overflow-x-auto" aria-label="Anrufvolumen Chart">
                      {chartData.some((d) => d.calls > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} aria-label="Anrufvolumen über Zeit">
                            <defs>
                              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#DA291C" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#DA291C" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #334155',
                              }}
                              itemStyle={{ color: '#fff' }}
                              labelStyle={{ color: '#cbd5e1' }}
                              cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="calls"
                              stroke="#DA291C"
                              strokeWidth={3}
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
                  </DashboardErrorBoundary>
                </Card>

                {/* Recent Logs Table */}
                <Card
                  title="Letzte Anrufe"
                  className="ultra-glass"
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-swiss-red hover:bg-swiss-red/10"
                      onClick={handleViewCalls}
                      aria-label="Alle Anrufe ansehen"
                    >
                      Alle ansehen
                    </Button>
                  }
                >
                  <DashboardErrorBoundary sectionName="Letzte Anrufe">
                    {recentCallsTableData.length > 0 ? (
                    <>
                      {/* Desktop: Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table
                          className="w-full text-sm text-left"
                          role="table"
                          aria-label="Letzte Anrufe"
                        >
                          <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
                            <tr role="row">
                              <th scope="col" className="px-4 py-3 font-semibold">
                                Status
                              </th>
                              <th scope="col" className="px-4 py-3 font-semibold">
                                Anrufer
                              </th>
                              <th scope="col" className="px-4 py-3 font-semibold">
                                Dauer
                              </th>
                              <th scope="col" className="px-4 py-3 font-semibold text-right">
                                Zeit
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {recentCallsTableData.slice(0, 10).map((row) => {
                              const originalCall = effectiveOverview.recent_calls.find(
                                (c) => c.id === row.id,
                              );
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
                                  <td className="px-4 py-4 text-gray-400 font-mono text-xs">
                                    {row.duration}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <span className="text-gray-400">{row.timestamp}</span>
                                    <MoreHorizontal
                                      className="ml-2 w-4 h-4 text-gray-600 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all inline-block"
                                      aria-hidden="true"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile: Card View */}
                      <div className="lg:hidden">
                        <MobileTableCardList>
                          {recentCallsTableData.slice(0, 10).map((row) => {
                            const originalCall = effectiveOverview.recent_calls.find(
                              (c) => c.id === row.id,
                            );
                            return (
                              <MobileTableCard
                                key={row.id}
                                id={row.id}
                                caller={row.caller}
                                duration={row.duration}
                                status={row.status}
                                timestamp={row.timestamp}
                                onClick={() => originalCall && handleCallClick(originalCall)}
                              />
                            );
                          })}
                        </MobileTableCardList>
                      </div>
                    </>
                  ) : effectiveOverview?.status?.phone === 'connected' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <Phone className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          Ihr Anrufbeantworter ist bereit!
                        </h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
                          Rufen Sie Ihre Nummer{' '}
                          <span className="text-white font-mono">
                            {effectiveOverview.phone_number}
                          </span>{' '}
                          an oder starten Sie einen Testanruf.
                        </p>
                      </div>
                      <TestCallButton
                        phoneNumber={effectiveOverview.phone_number || ''}
                        onTestCall={handleTestAgent}
                        disabled={false}
                      />
                    </div>
                    ) : (
                      <EmptyCalls onAction={handleTestAgent} />
                    )}
                  </DashboardErrorBoundary>
                </Card>
              </div>

              {/* Right Column (System & Help) */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card title="Quick Actions" className="ultra-glass border-slate-700/50">
                  <div className="space-y-1.5">
                    <QuickActionButton
                      icon={Phone}
                      label={
                        effectiveOverview.status.phone === 'connected'
                          ? 'Nummer verwalten'
                          : 'Telefon verbinden'
                      }
                      onClick={handleConnectPhone}
                      color={effectiveOverview.status.phone === 'connected' ? 'emerald' : 'blue'}
                    />
                    <QuickActionButton
                      icon={Calendar}
                      label={calendarConnected ? 'Kalender verwalten' : 'Kalender verbinden'}
                      onClick={handleConnectCalendar}
                      color={calendarConnected ? 'emerald' : 'purple'}
                    />
                    <QuickActionButton
                      icon={Settings}
                      label="Webhook Status"
                      onClick={handleCheckWebhook}
                    />
                    <QuickActionButton
                      icon={PhoneMissed}
                      label="Anrufprotokoll"
                      onClick={handleViewCalls}
                    />
                  </div>
                </Card>

                {isAgentActive && checklistItems.some((i) => !i.done) && (
                  <ActivationChecklist items={checklistItems} title="Offene Aufgaben" />
                )}

                {/* System Health Compact */}
                <div className="ultra-glass-light border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 font-display">
                    System Health
                  </h4>
                  <div className="space-y-3.5">
                    <HealthItem
                      label="Twilio Gateway"
                      status={phoneHealth}
                      detail={
                        phoneStatus?.twilioGateway === 'WARN'
                          ? `Webhook nicht konfiguriert. Erwartet: ${phoneStatus.details?.expectedWebhookUrl || '...'}`
                          : phoneStatus?.twilioGateway === 'ERROR'
                            ? `Twilio Fehler: ${!phoneStatus.twilioConfigured ? 'Keys fehlen' : 'Nummer fehlt'}`
                            : undefined
                      }
                      onFix={phoneHealth !== 'ok' ? () => modals.openWebhookStatus() : undefined}
                    />
                    <HealthItem label="Google Calendar Sync" status={calendarHealth} />
                    <HealthItem label="Azure TTS" status="ok" />
                    <HealthItem label="Supabase DB" status="ok" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CallDetailsModal
        isOpen={modals.isCallDetailsOpen}
        onClose={modals.closeCallDetails}
        call={modals.selectedCall}
      />

      <AgentTestModal
        isOpen={modals.isAgentTestOpen}
        onClose={modals.closeAgentTest}
        agentConfigId={effectiveOverview.agent_config.id}
        locationId={effectiveOverview.location.id}
        adminTestNumber={effectiveOverview.agent_config.admin_test_number || null}
      />

      <PhoneSetupWizard
        isOpen={modals.isPhoneWizardOpen}
        onClose={modals.closePhoneWizard}
        onSuccess={handlePhoneConnectionSuccess}
      />

      <WebhookStatusModal
        isOpen={modals.isWebhookStatusOpen}
        onClose={modals.closeWebhookStatus}
      />

      <AvailabilityModal
        isOpen={modals.isAvailabilityModalOpen}
        onClose={modals.closeAvailability}
        locationId={effectiveOverview.location.id}
        onCreateAppointment={(slot) => {
          modals.setSelectedSlot(slot);
          modals.closeAvailability();
          modals.openCreateAppointment(null, slot);
        }}
      />

      <CalendarEventModal
        isOpen={modals.isCreateAppointmentModalOpen}
        onClose={() => {
          modals.closeCreateAppointment();
          queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
        }}
        locationId={effectiveOverview.location.id}
        event={modals.selectedEvent || undefined}
        initialSlot={modals.selectedSlot}
      />

      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={80}
        isRefreshing={isRefreshing}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={modals.isNotificationCenterOpen}
        onClose={modals.closeNotificationCenter}
      />
    </div>
  );
};
