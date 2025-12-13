import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { data: overview, isLoading, error } = useDashboardOverview();

  // Handle 401 - redirect to login (NOT onboarding)
  // Onboarding/Wizard should be based on status flags from overview (needs_setup), not on 401
  React.useEffect(() => {
    if (error && 'status' in error && error.status === 401) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [error, logout, navigate]);

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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  const userName = user?.email || overview.user.email || 'Benutzer';
  const agentStatus = overview.status.agent === 'ready' ? 'Bereit' : 'Einrichtung nötig';
  const phoneStatus =
    overview.status.phone === 'connected'
      ? 'Verbunden'
      : overview.status.phone === 'needs_compliance'
      ? 'Compliance nötig'
      : 'Nicht verbunden';
  const calendarStatus = overview.status.calendar === 'connected' ? 'Verbunden' : 'Nicht verbunden';

  return (
    <div className="min-h-screen bg-background text-white p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Willkommen, {userName} 👋</h1>
        <p className="text-gray-400">Hier ist dein Dashboard</p>
      </div>

      {/* Status Chips */}
      <div className="flex gap-4 mb-8">
        <div className="px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-400">Agent:</span>
          <span className={`ml-2 ${overview.status.agent === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
            {agentStatus}
          </span>
        </div>
        <div className="px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-400">Telefon:</span>
          <span
            className={`ml-2 ${
              overview.status.phone === 'connected'
                ? 'text-green-400'
                : overview.status.phone === 'needs_compliance'
                ? 'text-yellow-400'
                : 'text-gray-400'
            }`}
          >
            {phoneStatus}
          </span>
        </div>
        <div className="px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-400">Kalender:</span>
          <span className={`ml-2 ${overview.status.calendar === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
            {calendarStatus}
          </span>
        </div>
      </div>

      {/* Agent Card */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Agent Konfiguration</h2>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Agent Name:</span>
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
          {overview.agent_config.eleven_agent_id && (
            <div>
              <span className="text-gray-400">ElevenLabs Agent ID:</span>
              <span className="ml-2 font-mono text-sm">{overview.agent_config.eleven_agent_id}</span>
            </div>
          )}
          {overview.agent_config.business_type && (
            <div>
              <span className="text-gray-400">Business Type:</span>
              <span className="ml-2">{overview.agent_config.business_type}</span>
            </div>
          )}
          {Array.isArray(overview.agent_config.goals_json) && overview.agent_config.goals_json.length > 0 && (
            <div>
              <span className="text-gray-400">Ziele:</span>
              <ul className="ml-4 list-disc">
                {overview.agent_config.goals_json.map((goal: string, idx: number) => (
                  <li key={idx}>{goal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent Calls */}
      {overview.recent_calls.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Letzte Anrufe</h2>
          <div className="space-y-2">
            {overview.recent_calls.map((call) => (
              <div key={call.id} className="flex justify-between items-center py-2 border-b border-gray-700">
                <div>
                  <span className="text-sm text-gray-400">
                    {call.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
                  </span>
                  <span className="ml-2">
                    {call.from_e164 || 'Unbekannt'} → {call.to_e164 || 'Unbekannt'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(call.started_at).toLocaleString('de-CH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

