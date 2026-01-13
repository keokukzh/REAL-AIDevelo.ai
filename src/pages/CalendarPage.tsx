import { useState, useEffect } from 'react';
import { FaMicrosoft, FaGoogle, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient } from '../services/apiClient';

interface CalendarConnection {
  id: string;
  provider: 'microsoft' | 'google' | 'outlook';
  email: string; // Mapped from connected_email
  connected_at: string;
  is_active: boolean;
  last_synced_at?: string;
}

export const CalendarPage = () => {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchConnections();

    // Check for OAuth callback success/error
    const params = new URLSearchParams(window.location.search);

    if (params.get('connected') === 'microsoft' || params.get('connected') === 'outlook') {
      toast.success('Microsoft Calendar erfolgreich verbunden!');
      window.history.replaceState({}, '', '/dashboard/calendar');
    } else if (params.get('connected') === 'google') {
      toast.success('Google Calendar erfolgreich verbunden!');
      window.history.replaceState({}, '', '/dashboard/calendar');
    } else if (params.get('error')) {
      const errorMsg = params.get('error') || 'Unbekannter Fehler';
      toast.error(`Verbindung fehlgeschlagen: ${errorMsg}`);
      window.history.replaceState({}, '', '/dashboard/calendar');
    }
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await apiClient.get<{ connections: CalendarConnection[] }>(
        '/calendar/connections',
      );
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      // toast.error('Fehler beim Laden der Kalender-Verbindungen');
    } finally {
      setLoading(false);
    }
  };

  const connectMicrosoft = async () => {
    try {
      setConnecting(true);
      const response = await apiClient.get('/calendar/outlook/auth');

      // Handle multiple possible response formats
      let authUrl: string;

      // Format 1: Direct string (not likely with axios response.data, but defensive)
      if (typeof response.data === 'string') {
        authUrl = response.data;
      }
      // Format 2: { authUrl: "..." }
      else if (response.data?.authUrl && typeof response.data.authUrl === 'string') {
        authUrl = response.data.authUrl;
      }
      // Format 3: { success: true, data: { authUrl: "..." } } - LEGACY
      else if (response.data?.data?.authUrl) {
        const url = response.data.data.authUrl;
        if (typeof url === 'string') {
          authUrl = url;
        } else if (typeof url === 'object' && url.url) {
          authUrl = url.url;
        } else if (typeof url === 'object' && url.href) {
          authUrl = url.href;
        } else {
          throw new Error('authUrl is object but has no url/href property');
        }
      }
      // Format 4: { success: true, authUrl: "..." } - NEW STANDARD
      else if (response.data?.success && response.data?.authUrl) {
        authUrl = response.data.authUrl;
      } else {
        throw new Error('Invalid response format');
      }

      // Validate authUrl is string
      if (!authUrl || typeof authUrl !== 'string') {
        throw new Error(`Invalid authUrl type: ${typeof authUrl}`);
      }

      // Validate URL format
      if (!authUrl.startsWith('http://') && !authUrl.startsWith('https://')) {
        throw new Error(`Invalid URL format: ${authUrl}`);
      }

      console.log('✅ Microsoft OAuth URL:', authUrl);

      // Redirect to Microsoft OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Error connecting Microsoft:', error);
      setConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Verbinden mit Microsoft: ${errorMessage}`);
    }
  };

  const connectGoogle = async () => {
    try {
      setConnecting(true);
      const response = await apiClient.get('/calendar/google/auth');

      // Same robust extraction logic as Microsoft
      let authUrl: string;

      if (typeof response.data === 'string') {
        authUrl = response.data;
      } else if (response.data?.authUrl && typeof response.data.authUrl === 'string') {
        authUrl = response.data.authUrl;
      } else if (response.data?.data?.authUrl) {
        const url = response.data.data.authUrl;
        if (typeof url === 'string') {
          authUrl = url;
        } else if (typeof url === 'object' && url.url) {
          authUrl = url.url;
        } else if (typeof url === 'object' && url.href) {
          authUrl = url.href;
        } else {
          throw new Error('authUrl is object');
        }
      } else if (response.data?.success && response.data?.authUrl) {
        authUrl = response.data.authUrl;
      } else {
        throw new Error('Invalid response');
      }

      if (!authUrl || typeof authUrl !== 'string') {
        throw new Error(`Invalid authUrl type: ${typeof authUrl}`);
      }

      if (!authUrl.startsWith('http://') && !authUrl.startsWith('https://')) {
        throw new Error(`Invalid URL: ${authUrl}`);
      }

      console.log('✅ Google OAuth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Error connecting Google:', error);
      setConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Verbinden mit Google: ${errorMessage}`);
    }
  };

  const disconnectCalendar = async (connectionId: string) => {
    if (!confirm('Möchtest du diese Kalender-Verbindung wirklich trennen?')) return;

    try {
      await apiClient.delete(`/calendar/connections/${connectionId}`);

      toast.success('Kalender erfolgreich getrennt');
      fetchConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Fehler beim Trennen der Verbindung');
    }
  };

  // Normalize provider names
  const microsoftConnection = connections.find(
    (c) => c.provider === 'microsoft' || c.provider === 'outlook',
  );

  const googleConnection = connections.find((c) => c.provider === 'google');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="animate-spin text-4xl text-cyan-400">
          <FaSpinner />
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kalender-Integrationen</h1>
        <p className="text-gray-400">
          Verbinde deinen Kalender, damit der Voice Agent Termine verwalten kann
        </p>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Microsoft 365 Calendar */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <span className="text-3xl text-blue-500">
                  <FaMicrosoft />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Microsoft 365</h3>
                <p className="text-sm text-gray-400">Outlook, Office 365</p>
              </div>
            </div>
            {microsoftConnection?.is_active && (
              <div className="bg-green-500/10 p-2 rounded-full">
                <span className="text-green-500 text-xl">
                  <FaCheck />
                </span>
              </div>
            )}
          </div>

          {microsoftConnection ? (
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Verbundenes Konto</p>
                <p className="text-sm text-white font-medium">{microsoftConnection.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Seit: {new Date(microsoftConnection.connected_at).toLocaleDateString('de-CH')}
                </p>
              </div>
              <button
                onClick={() => disconnectCalendar(microsoftConnection.id)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes /> Verbindung trennen
              </button>
            </div>
          ) : (
            <button
              onClick={connectMicrosoft}
              disabled={connecting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <span className="animate-spin">
                    <FaSpinner />
                  </span>{' '}
                  Verbinde...
                </>
              ) : (
                <>
                  <FaMicrosoft /> Mit Microsoft verbinden
                </>
              )}
            </button>
          )}
        </div>

        {/* Google Calendar - Now Active */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-3 rounded-lg">
                <span className="text-3xl text-red-500">
                  <FaGoogle />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Google Calendar</h3>
                <p className="text-sm text-gray-400">Gmail, Google Workspace</p>
              </div>
            </div>
            {googleConnection?.is_active && (
              <div className="bg-green-500/10 p-2 rounded-full">
                <span className="text-green-500 text-xl">
                  <FaCheck />
                </span>
              </div>
            )}
          </div>

          {googleConnection ? (
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Verbundenes Konto</p>
                <p className="text-sm text-white font-medium">{googleConnection.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Seit: {new Date(googleConnection.connected_at).toLocaleDateString('de-CH')}
                </p>
              </div>
              <button
                onClick={() => disconnectCalendar(googleConnection.id)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes /> Verbindung trennen
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              disabled={connecting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <span className="animate-spin">
                    <FaSpinner />
                  </span>{' '}
                  Verbinde...
                </>
              ) : (
                <>
                  <FaGoogle /> Mit Google verbinden
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Features & Instructions */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
        <h4 className="font-semibold text-white mb-4 text-lg">✨ Funktionen</h4>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-start gap-3">
            <FaCheck className="text-cyan-400 mt-1 flex-shrink-0" />
            <span>Voice Agent kann freie Termine in deinem Kalender finden</span>
          </li>
          <li className="flex items-start gap-3">
            <FaCheck className="text-cyan-400 mt-1 flex-shrink-0" />
            <span>Automatische Terminbuchung direkt im Gespräch</span>
          </li>
          <li className="flex items-start gap-3">
            <FaCheck className="text-cyan-400 mt-1 flex-shrink-0" />
            <span>Echtzeit-Synchronisation mit deinem Kalender</span>
          </li>
          <li className="flex items-start gap-3">
            <FaCheck className="text-cyan-400 mt-1 flex-shrink-0" />
            <span>Sichere OAuth 2.0 Authentifizierung - du behältst volle Kontrolle</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarPage;
