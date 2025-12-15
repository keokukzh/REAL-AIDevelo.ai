import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SetupWizard } from '../components/dashboard/SetupWizard';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal';
import { AgentTestModal } from '../components/dashboard/AgentTestModal';
import { PhoneConnectionModal } from '../components/dashboard/PhoneConnectionModal';
import { WebhookStatusModal } from '../components/dashboard/WebhookStatusModal';
import { AvailabilityModal } from '../components/dashboard/AvailabilityModal';
import { CreateAppointmentModal } from '../components/dashboard/CreateAppointmentModal';
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
import { Phone, Calendar, PhoneMissed, Clock, Mic, Settings, Globe, XCircle, MoreHorizontal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mapCallsToChartData, mapOverviewToKPIs, mapCallToTableRow } from '../lib/dashboardAdapters';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [isAgentTestOpen, setIsAgentTestOpen] = useState(false);
  const [isPhoneConnectionOpen, setIsPhoneConnectionOpen] = useState(false);
  const [isWebhookStatusOpen, setIsWebhookStatusOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | undefined>(undefined);

  // Handle 401 - redirect to login (NOT onboarding)
  React.useEffect(() => {
    if (error && 'status' in error && error.status === 401) {
      logout();
      navigate('/login', { replace: true });
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
      // Security: Only accept messages from our frontend URL
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || globalThis.location.origin;
      if (event.origin !== frontendUrl && !event.origin.includes(globalThis.location.hostname)) {
        return;
      }

      if (event.data?.type === 'calendar-oauth-success') {
        toast.success('Kalender erfolgreich verbunden');
        // Refetch dashboard overview
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        refetch();
      } else if (event.data?.type === 'calendar-oauth-error') {
        toast.error(event.data.message || 'Fehler beim Verbinden des Kalenders');
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
        }
      } else {
        throw new Error('Keine Auth-URL erhalten');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
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
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Trennen des Kalenders: ${errorMsg}`);
    }
  };

  // Handle phone connection
  const handleConnectPhone = () => {
    setIsPhoneConnectionOpen(true);
  };

  // Handle webhook status check - open modal
  const handleCheckWebhook = () => {
    setIsWebhookStatusOpen(true);
  };

  // Handle test agent
  const handleTestAgent = () => {
    setIsAgentTestOpen(true);
  };

  // Navigate to calls page
  const handleViewCalls = () => {
    navigate('/calls');
  };

  // Handle call click
  const handleCallClick = (call: any) => {
    // Map to CallLog format
    const callLog: any = {
      id: call.id,
      callSid: call.callSid || call.id,
      direction: call.direction,
      from_e164: call.from_e164,
      to_e164: call.to_e164,
      started_at: call.started_at,
      ended_at: call.ended_at,
      duration_sec: call.duration_sec,
      outcome: call.outcome,
      notes: call.notes || {},
    };
    setSelectedCall(callLog);
    setIsCallDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    );
  }

  const userName = user?.email || overview.user.email || 'Benutzer';
  const isAgentActive = overview.agent_config.setup_state === 'ready';
  const showWizard = !isAgentActive;

  // Map data for new UI
  const kpis = mapOverviewToKPIs(overview);
  const chartData = mapCallsToChartData(overview.recent_calls);
  const recentCallsTableData = overview.recent_calls.map(mapCallToTableRow);

  // Determine system health status
  const phoneHealth: 'ok' | 'error' | 'warning' = 
    overview.status.phone === 'connected' ? 'ok' : 
    overview.status.phone === 'needs_compliance' ? 'warning' : 'error';
  
  const calendarHealth: 'ok' | 'error' | 'warning' = 
    overview.status.calendar === 'connected' ? 'ok' : 'error';

  const calendarConnected = overview.status.calendar === 'connected';

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      {/* Background Effects - Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />
      
      {/* Side Navigation */}
      <SideNav />

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-4 text-gray-400">
            <span className="text-sm font-medium text-white">Dashboard</span>
            <span className="text-gray-600">/</span>
            <span className="text-sm">Tagesübersicht</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          {/* Setup Wizard (shown when setup_state != 'ready') */}
          {showWizard && (
            <div className="mb-8">
              <SetupWizard onComplete={() => {}} />
            </div>
          )}

          <div className="space-y-8">
            {/* Welcome & Time Range */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                  Willkommen, {userName.split('@')[0]}
                </h1>
                <p className="text-gray-400 mt-1">Hier ist der aktuelle Status Ihres Voice Agents für heute.</p>
              </div>
              {lastRefresh && (
                <div className="text-xs text-gray-500">
                  Letzte Aktualisierung: {lastRefresh.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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
                            {overview.calendar_provider ? `${overview.calendar_provider.charAt(0).toUpperCase() + overview.calendar_provider.slice(1)} Calendar` : 'Google Calendar'}
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
                      {overview.calendar_connected_email && (
                        <div className="text-sm text-gray-300">
                          Verbunden mit: <span className="font-medium">{overview.calendar_connected_email}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setIsAvailabilityModalOpen(true)}
                          className="flex-1"
                        >
                          Verfügbarkeit prüfen
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIsCreateAppointmentModalOpen(true)}
                          className="flex-1"
                        >
                          Termin erstellen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-700/50 rounded-xl h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-900/30">
                      <p className="text-gray-400 text-sm mb-4">Kalender nicht verbunden</p>
                      <Button size="sm" onClick={handleConnectCalendar}>Verbinden</Button>
                    </div>
                  )}
                </Card>

                {/* Activity Chart */}
                <Card title="Anrufvolumen (Live)" className="min-h-[400px]">
                  <div className="h-[320px] w-full mt-4">
                    {chartData.some(d => d.calls > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
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
                    <Button variant="ghost" size="sm" className="text-swiss-red hover:bg-swiss-red/10" onClick={handleViewCalls}>
                      Alle ansehen
                    </Button>
                  }
                >
                  {recentCallsTableData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Anrufer</th>
                            <th className="px-4 py-3 font-semibold">Dauer</th>
                            <th className="px-4 py-3 font-semibold text-right">Zeit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {recentCallsTableData.slice(0, 10).map((row) => {
                            const originalCall = overview.recent_calls.find(c => c.id === row.id);
                            return (
                              <tr 
                                key={row.id} 
                                className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                onClick={() => originalCall && handleCallClick(originalCall)}
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
                    <div className="text-center py-12 text-gray-500">
                      <p>Noch keine Anrufe vorhanden</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column (Agent & System) */}
              <div className="space-y-6">
                {/* Agent Card */}
                <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
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
                    {!overview.agent_config.eleven_agent_id && (
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
                      <div className="font-medium text-sm text-white">{overview.agent_config.business_type || 'Nicht gesetzt'}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Nummer</div>
                      <div className="font-medium text-sm font-mono text-white">
                        {overview.phone_number ? `${overview.phone_number.substring(0, 8)}...` : 'Nicht verbunden'}
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
                <Card title="Quick Actions">
                  <div className="space-y-2">
                    <QuickActionButton 
                      icon={Phone} 
                      label="Telefon verbinden" 
                      onClick={handleConnectPhone}
                      disabled={overview.status.phone === 'connected'}
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
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System Health</h4>
                  <div className="space-y-3">
                    <HealthItem label="Twilio Gateway" status={phoneHealth} />
                    <HealthItem label="Google Calendar Sync" status={calendarHealth} />
                    <HealthItem label="ElevenLabs TTS" status={overview.agent_config.eleven_agent_id ? 'ok' : 'warning'} />
                    <HealthItem label="Supabase DB" status="ok" />
                  </div>
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
        agentConfigId={overview.agent_config.id}
        locationId={overview.location.id}
        elevenAgentId={overview.agent_config.eleven_agent_id}
      />

      <PhoneConnectionModal
        isOpen={isPhoneConnectionOpen}
        onClose={() => setIsPhoneConnectionOpen(false)}
        agentConfigId={overview.agent_config.id}
        locationId={overview.location.id}
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
        locationId={overview.location.id}
        onCreateAppointment={(slot) => {
          setSelectedSlot(slot);
          setIsAvailabilityModalOpen(false);
          setIsCreateAppointmentModalOpen(true);
        }}
      />

      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={() => {
          setIsCreateAppointmentModalOpen(false);
          setSelectedSlot(undefined);
        }}
        locationId={overview.location.id}
        initialSlot={selectedSlot}
      />
    </div>
  );
};
