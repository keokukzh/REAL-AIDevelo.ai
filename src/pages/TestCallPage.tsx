/**
 * Test Call Page
 * WebRTC softphone for testing voice agent
 */

import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useLocationId } from '../hooks/useAuth';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { Phone, PhoneOff, Loader } from 'lucide-react';

export const TestCallPage: React.FC = () => {
  const locationId = useLocationId();
  const { data: overview } = useDashboardOverview();
  const agentId = overview?.agent_config?.id;

  const {
    isConnected,
    isCalling,
    isInCall,
    callStatus,
    error,
    transcript,
    connect,
    startCall,
    endCall,
    disconnect,
  } = useWebRTC({
    locationId: locationId || '',
    agentId,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (isInCall) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [isInCall]);

  if (!locationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Bitte melden Sie sich an, um Test-Calls zu nutzen.</p>
        </div>
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-400 mb-4">Agent-Konfiguration wird geladen...</p>
          <p className="text-sm text-gray-500">Bitte warten Sie einen Moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Test Call - Voice Agent</h1>

        {/* Connection Status */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Verbindungsstatus:</span>
            <span className={`font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
          </div>

          {callStatus !== 'idle' && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Call Status:</span>
              <span className="font-semibold text-blue-500">
                {callStatus === 'connecting' && 'Verbinde...'}
                {callStatus === 'ringing' && 'Klingelt...'}
                {callStatus === 'active' && `Aktiv (${formatDuration(callDuration)})`}
                {callStatus === 'ended' && 'Beendet'}
                {callStatus === 'error' && 'Fehler'}
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              <div className="font-semibold mb-2">Verbindungsfehler:</div>
              <div className="mb-2">{error}</div>
              <div className="text-xs text-red-300/80 mt-2">
                <p>Hinweis: FreeSWITCH muss auf dem konfigurierten Server laufen.</p>
                <p>Für lokale Tests: Stellen Sie sicher, dass FreeSWITCH auf localhost:7443 läuft.</p>
                <p>Für Production: FreeSWITCH muss auf dem konfigurierten Host erreichbar sein.</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center mb-8">
          {!isConnected ? (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              <Phone className="w-4 h-4" />
              Mit FreeSWITCH verbinden
            </button>
          ) : !isInCall ? (
            <button
              onClick={startCall}
              disabled={isCalling}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalling ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verbinde...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Test Call starten
                </>
              )}
            </button>
          ) : (
            <button
              onClick={endCall}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
            >
              <PhoneOff className="w-4 h-4" />
              Call beenden
            </button>
          )}

          {isConnected && (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              Trennen
            </button>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Transkript</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={`p-3 rounded ${
                    entry.role === 'user'
                      ? 'bg-blue-500/20 border-l-4 border-blue-500'
                      : 'bg-green-500/20 border-l-4 border-green-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {entry.role === 'user' ? 'Sie' : 'Agent'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!isInCall && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-gray-400 text-sm">
              <p>Verbinden Sie sich mit FreeSWITCH und starten Sie einen Test-Call.</p>
              <p className="mt-2">Der Agent wird Ihre Sprache transkribieren und antworten.</p>
            </div>
            
            {/* Info Box for Production */}
            {import.meta.env.PROD && !isConnected && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm">
                <div className="font-semibold mb-2">⚠️ FreeSWITCH in Production</div>
                <p className="text-xs text-yellow-200/80">
                  FreeSWITCH ist für Production noch nicht eingerichtet. 
                  Für lokale Tests können Sie FreeSWITCH mit <code className="bg-yellow-500/20 px-1 rounded">docker-compose up freeswitch</code> starten.
                </p>
                <p className="text-xs text-yellow-200/80 mt-2">
                  Die WebRTC-Test-Funktion ist derzeit nur für lokale Entwicklung verfügbar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

