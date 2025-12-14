import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useUpdateAgentConfig } from '../hooks/useUpdateAgentConfig';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SetupWizard } from '../components/dashboard/SetupWizard';
import { StatusCard } from '../components/dashboard/StatusCard';
import { SystemHealth } from '../components/dashboard/SystemHealth';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentCallsTable } from '../components/dashboard/RecentCallsTable';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal';
import { AgentTestModal } from '../components/dashboard/AgentTestModal';
import { PhoneConnectionModal } from '../components/dashboard/PhoneConnectionModal';
import { apiClient } from '../services/apiClient';
import { toast } from '../components/ui/Toast';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { data: overview, isLoading, error } = useDashboardOverview();
  const updateAgentConfig = useUpdateAgentConfig();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [isAgentTestOpen, setIsAgentTestOpen] = useState(false);
  const [isPhoneConnectionOpen, setIsPhoneConnectionOpen] = useState(false);

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
          alert('OAuth ist noch nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in Render Environment Variables.');
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
          alert('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.');
        }
      } else {
        throw new Error('Keine Auth-URL erhalten');
      }
    } catch (error: any) {
      console.error('[DashboardPage] Error connecting calendar:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
      alert(`Fehler beim Verbinden des Kalenders: ${errorMsg}`);
    }
  };

  // Handle phone connection
  const handleConnectPhone = () => {
    setIsPhoneConnectionOpen(true);
  };

  // Handle webhook status check
  const handleCheckWebhook = () => {
    const webhookUrl = `${globalThis.location.origin}/api/twilio/voice/inbound`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(webhookUrl).then(() => {
        toast.success(`Webhook URL kopiert: ${webhookUrl}`);
      }).catch((err) => {
        console.warn('[DashboardPage] Failed to copy to clipboard:', err);
        // Fallback: show URL in toast with error
        toast.error(`Webhook URL konnte nicht kopiert werden. Bitte manuell kopieren: ${webhookUrl}`);
      });
    } else {
      // Fallback for browsers without clipboard API
      toast.info(`Webhook URL: ${webhookUrl}\n\n(Bitte manuell kopieren)`);
    }
  };

  // Handle test agent
  const handleTestAgent = () => {
    setIsAgentTestOpen(true);
  };

  // Scroll to calls section
  const handleViewCalls = () => {
    const callsSection = document.getElementById('recent-calls');
    if (callsSection) {
      callsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle call click
  const handleCallClick = (call: any) => {
    setSelectedCall(call);
    setIsCallDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Fehler beim Laden</h2>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
          <button
            onClick={() => globalThis.location.reload()}
            className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  const userName = user?.email || overview.user.email || 'Benutzer';
  const isAgentActive = overview.agent_config.setup_state === 'ready';
  const showWizard = !isAgentActive;
  const showRestartSetup = isAgentActive;

  // Determine status for each card
  const agentStatus = isAgentActive ? 'active' : 'warning';
  const agentStatusText = isAgentActive ? 'Agent: Aktiv' : 'Agent: Einrichtung nötig';

  const phoneStatus = overview.status.phone === 'connected' 
    ? 'active' 
    : overview.status.phone === 'needs_compliance'
    ? 'warning'
    : 'inactive';
  const phoneStatusText = overview.status.phone === 'connected'
    ? 'Verbunden'
    : overview.status.phone === 'needs_compliance'
    ? 'Compliance nötig'
    : 'Nicht verbunden';

  const calendarStatus = overview.status.calendar === 'connected' ? 'active' : 'inactive';
  const calendarStatusText = overview.status.calendar === 'connected' ? 'Verbunden' : 'Nicht verbunden';

  const callsStatus = overview.recent_calls.length > 0 ? 'active' : 'inactive';
  const callsStatusText = overview.last_activity
    ? `Letzte Aktivität: ${new Date(overview.last_activity).toLocaleString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Keine Calls';

  return (
    <div className="min-h-screen bg-background text-white p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Willkommen, {userName} 👋</h1>
        <p className="text-gray-400">Hier ist dein Operations Dashboard</p>
      </div>

      {/* System Health */}
      <div className="mb-6">
        <SystemHealth 
          backendSha={overview._backendSha} 
          lastRefresh={lastRefresh || undefined}
        />
      </div>

      {/* Setup Wizard (shown when setup_state != 'ready') */}
      {showWizard && (
        <div className="mb-8">
          <SetupWizard onComplete={() => {}} />
        </div>
      )}

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Agent Card */}
        <StatusCard
          title="Agent"
          status={agentStatus}
          statusText={agentStatusText}
          actions={
            <>
              {showRestartSetup && (
                <button
                  type="button"
                  className="px-3 py-1.5 bg-accent text-black rounded text-sm hover:bg-accent/80 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={updateAgentConfig.isPending}
              onClick={() => {
                const confirmed = globalThis.confirm('Setup wirklich erneut starten?');
                if (!confirmed) return;
                updateAgentConfig.mutateAsync({ setup_state: 'needs_persona' }).catch((err) => {
                  console.error('[DashboardPage] Error restarting setup:', err);
                });
              }}
                >
                  {updateAgentConfig.isPending ? 'Wird gestartet…' : 'Setup erneut starten'}
                </button>
              )}
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                onClick={handleTestAgent}
              >
                Agent testen
              </button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2">AIDevelo Receptionist</span>
            </div>
            {overview.agent_config.persona_gender && (
              <div>
                <span className="text-gray-400">Persona:</span>
                <span className="ml-2">
                  {overview.agent_config.persona_gender === 'female' ? 'Weiblich' : 'Männlich'}
                  {overview.agent_config.persona_age_range && `, ${overview.agent_config.persona_age_range} Jahre`}
                </span>
              </div>
            )}
            {overview.agent_config.business_type && (
              <div>
                <span className="text-gray-400">Business:</span>
                <span className="ml-2 capitalize">{overview.agent_config.business_type}</span>
              </div>
            )}
            {Array.isArray(overview.agent_config.services_json) && overview.agent_config.services_json.length > 0 && (
              <div>
                <span className="text-gray-400">Services:</span>
                <ul className="ml-4 list-disc text-xs">
                  {overview.agent_config.services_json.slice(0, 2).map((service: any, idx: number) => (
                    <li key={`service-${service.name || idx}-${idx}`}>
                      {service.name || 'Unbenannt'}
                      {service.durationMin && ` (${service.durationMin} Min)`}
                    </li>
                  ))}
                  {overview.agent_config.services_json.length > 2 && (
                    <li className="text-gray-500">+{overview.agent_config.services_json.length - 2} weitere</li>
                  )}
                </ul>
              </div>
            )}
            {Array.isArray(overview.agent_config.goals_json) && overview.agent_config.goals_json.length > 0 && (
              <div>
                <span className="text-gray-400">Ziele:</span>
                <ul className="ml-4 list-disc text-xs">
                  {overview.agent_config.goals_json.slice(0, 2).map((goal: string, idx: number) => (
                    <li key={`goal-${goal}-${idx}`}>{goal}</li>
                  ))}
                  {overview.agent_config.goals_json.length > 2 && (
                    <li className="text-gray-500">+{overview.agent_config.goals_json.length - 2} weitere</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </StatusCard>

        {/* Phone/Twilio Card */}
        <StatusCard
          title="Telefon"
          status={phoneStatus}
          statusText={phoneStatusText}
          actions={
            <>
              <button
                type="button"
                className="px-3 py-1.5 bg-accent text-black rounded text-sm hover:bg-accent/80"
                onClick={handleConnectPhone}
              >
                Telefon verbinden
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                onClick={handleCheckWebhook}
              >
                Webhook Status
              </button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            {overview.phone_number ? (
              <div>
                <span className="text-gray-400">Nummer:</span>
                <span className="ml-2 font-mono">{overview.phone_number}</span>
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Keine Nummer zugewiesen</div>
            )}
          </div>
        </StatusCard>

        {/* Calendar Card */}
        <StatusCard
          title="Kalender"
          status={calendarStatus}
          statusText={calendarStatusText}
          actions={
            <button
              type="button"
              className="px-3 py-1.5 bg-accent text-black rounded text-sm hover:bg-accent/80"
              onClick={handleConnectCalendar}
              disabled={overview.status.calendar === 'connected'}
            >
              {overview.status.calendar === 'connected' ? 'Verbunden' : 'Kalender verbinden'}
            </button>
          }
        >
          <div className="space-y-2 text-sm">
            {overview.calendar_provider ? (
              <div>
                <span className="text-gray-400">Provider:</span>
                <span className="ml-2 capitalize">{overview.calendar_provider}</span>
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Nicht verbunden</div>
            )}
          </div>
        </StatusCard>

        {/* Calls/Logs Card */}
        <StatusCard
          title="Calls/Logs"
          status={callsStatus}
          statusText={callsStatusText}
          actions={
            <button
              type="button"
              className="px-3 py-1.5 bg-accent text-black rounded text-sm hover:bg-accent/80"
              onClick={handleViewCalls}
            >
              Calls ansehen
            </button>
          }
        >
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Anrufe:</span>
              <span className="ml-2">{overview.recent_calls.length}</span>
            </div>
          </div>
        </StatusCard>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <QuickActions
          actions={[
            { label: 'Telefon verbinden', onClick: handleConnectPhone },
            { label: 'Kalender verbinden', onClick: handleConnectCalendar, disabled: overview.status.calendar === 'connected' },
            { label: 'Webhook Status prüfen', onClick: handleCheckWebhook },
            { label: 'Letzte Calls ansehen', onClick: handleViewCalls },
            { label: 'Agent testen', onClick: handleTestAgent },
          ]}
        />
      </div>

      {/* Recent Calls Table */}
      <div id="recent-calls" className="mb-8">
        <RecentCallsTable calls={overview.recent_calls} onCallClick={handleCallClick} />
      </div>

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={isCallDetailsOpen}
        onClose={() => {
          setIsCallDetailsOpen(false);
          setSelectedCall(null);
        }}
        call={selectedCall}
      />

      {/* Agent Test Modal */}
      <AgentTestModal
        isOpen={isAgentTestOpen}
        onClose={() => setIsAgentTestOpen(false)}
        agentConfigId={overview.agent_config.id}
        locationId={overview.location.id}
        elevenAgentId={overview.agent_config.eleven_agent_id}
      />

      {/* Phone Connection Modal */}
      <PhoneConnectionModal
        isOpen={isPhoneConnectionOpen}
        onClose={() => setIsPhoneConnectionOpen(false)}
        agentConfigId={overview.agent_config.id}
        locationId={overview.location.id}
        onSuccess={() => {
          // Dashboard will automatically refresh via query invalidation
        }}
      />
    </div>
  );
};
