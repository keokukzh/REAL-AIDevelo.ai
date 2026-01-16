import React, { useState, useEffect } from 'react';
import { FaMicrosoft, FaGoogle, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from '../components/ui/Toast.js';
import { apiClient } from '../services/apiClient.js';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { Button } from '../components/ui/Button.js';

interface CalendarConnection {
  id: string;
  provider: 'microsoft' | 'google' | 'outlook';
  email: string;
  connected_at: string;
  is_active: boolean;
  last_synced_at?: string;
}

export const CalendarIntegrationsPage = () => {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await apiClient.get<{ connections: CalendarConnection[] }>(
        '/calendar/connections',
      );
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectMicrosoft = async () => {
    try {
      setConnecting(true);
      const response = await apiClient.get('/calendar/outlook/auth');
      const authUrl = response.data?.authUrl || response.data?.data?.authUrl || response.data;
      if (authUrl && typeof authUrl === 'string') {
        window.location.href = authUrl;
      } else {
        throw new Error('Invalid authUrl');
      }
    } catch (error) {
      console.error('Error connecting Microsoft:', error);
      setConnecting(false);
      toast.error('Fehler beim Verbinden mit Microsoft');
    }
  };

  const connectGoogle = async () => {
    try {
      setConnecting(true);
      const response = await apiClient.get('/calendar/google/auth');
      const authUrl = response.data?.authUrl || response.data?.data?.authUrl || response.data;
      if (authUrl && typeof authUrl === 'string') {
        window.location.href = authUrl;
      } else {
        throw new Error('Invalid authUrl');
      }
    } catch (error) {
      console.error('Error connecting Google:', error);
      setConnecting(false);
      toast.error('Fehler beim Verbinden mit Google');
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

  const microsoftConnection = connections.find(
    (c) => c.provider === 'microsoft' || c.provider === 'outlook',
  );
  const googleConnection = connections.find((c) => c.provider === 'google');

  return (
    <DashboardLayout isLoading={loading}>
      <div className="p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Kalender-Integrationen</h1>
          <p className="text-gray-400">
            Verbinde deinen Kalender, damit der Voice Agent Termine verwalten kann
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Microsoft 365 Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-3xl">
                  <div className="text-blue-500">
                    <FaMicrosoft />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Microsoft 365</h3>
                  <p className="text-sm text-gray-400">Outlook, Office 365</p>
                </div>
              </div>
              {microsoftConnection?.is_active && (
                <div className="bg-green-500/10 p-2 rounded-full text-green-500 border border-green-500/20">
                  <FaCheck />
                </div>
              )}
            </div>

            {microsoftConnection ? (
              <div className="space-y-4">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">
                    Verbundenes Konto
                  </p>
                  <p className="text-sm text-white font-medium truncate">
                    {microsoftConnection.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10"
                  onClick={() => disconnectCalendar(microsoftConnection.id)}
                >
                  <span className="mr-2">
                    <FaTimes />
                  </span>{' '}
                  Verbindung trennen
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                onClick={connectMicrosoft}
                disabled={connecting}
              >
                {connecting ? (
                  <div className="animate-spin mr-2">
                    <FaSpinner />
                  </div>
                ) : (
                  <div className="mr-2">
                    <FaMicrosoft />
                  </div>
                )}
                {connecting ? 'Verbinde...' : 'Mit Microsoft verbinden'}
              </Button>
            )}
          </div>

          {/* Google Calendar Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-500/50 transition-all shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-3xl">
                  <div className="text-red-500">
                    <FaGoogle />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Google Calendar</h3>
                  <p className="text-sm text-gray-400">Gmail, Google Workspace</p>
                </div>
              </div>
              {googleConnection?.is_active && (
                <div className="bg-green-500/10 p-2 rounded-full text-green-500 border border-green-500/20">
                  <FaCheck />
                </div>
              )}
            </div>

            {googleConnection ? (
              <div className="space-y-4">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">
                    Verbundenes Konto
                  </p>
                  <p className="text-sm text-white font-medium truncate">
                    {googleConnection.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10"
                  onClick={() => disconnectCalendar(googleConnection.id)}
                >
                  <span className="mr-2">
                    <FaTimes />
                  </span>{' '}
                  Verbindung trennen
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full bg-red-600 hover:bg-red-700 h-12"
                onClick={connectGoogle}
                disabled={connecting}
              >
                {connecting ? (
                  <div className="animate-spin mr-2">
                    <FaSpinner />
                  </div>
                ) : (
                  <div className="mr-2">
                    <FaGoogle />
                  </div>
                )}
                {connecting ? 'Verbinde...' : 'Mit Google verbinden'}
              </Button>
            )}
          </div>
        </div>

        {/* Features Info */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-8 backdrop-blur-sm">
          <h4 className="font-bold text-white mb-6 text-xl">
            ✨ Funktionen der Kalender-Integration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 text-gray-400 hover:text-gray-300 transition-colors">
              <span className="bg-blue-500/20 p-1 rounded text-blue-400">✓</span>
              <span>Lesezugriff auf deine Verfügbarkeit zur Terminfindung</span>
            </div>
            <div className="flex items-start gap-4 text-gray-400 hover:text-gray-300 transition-colors">
              <span className="bg-blue-500/20 p-1 rounded text-blue-400">✓</span>
              <span>Automatisches Eintragen von gebuchten Terminen</span>
            </div>
            <div className="flex items-start gap-4 text-gray-400 hover:text-gray-300 transition-colors">
              <span className="bg-blue-500/20 p-1 rounded text-blue-400">✓</span>
              <span>Senden von Einladungen an Gesprächsteilnehmer</span>
            </div>
            <div className="flex items-start gap-4 text-gray-400 hover:text-gray-300 transition-colors">
              <span className="bg-blue-500/20 p-1 rounded text-blue-400">✓</span>
              <span>Volle Synchronisation in Echtzeit</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarIntegrationsPage;
