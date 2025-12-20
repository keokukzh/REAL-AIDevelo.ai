import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { VoiceAgentStreamingUI } from './VoiceAgentStreamingUI';
import { AlertCircle, Phone, Info, Loader, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { toast } from '../ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

interface AgentTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentConfigId?: string;
  locationId?: string;
  elevenAgentId?: string | null;
}

type CallStatus = 'idle' | 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';

export const AgentTestModal: React.FC<AgentTestModalProps> = ({ 
  isOpen, 
  onClose, 
  agentConfigId,
  locationId,
  elevenAgentId 
}) => {
  const [testMode, setTestMode] = useState<'info' | 'streaming'>('info');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isMakingCall, setIsMakingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callSid, setCallSid] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if we have the required data for streaming
  const canStream = !!locationId && !!agentConfigId;

  const handleStartTest = () => {
    if (canStream) {
      setTestMode('streaming');
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('idle');
      setCallSid(null);
      setTestPhoneNumber('');
      setTestMode('info');
    }
  }, [isOpen]);

  const handleMakeTestCall = async () => {
    if (!testPhoneNumber.trim()) {
      toast.warning('Bitte gib eine Telefonnummer ein');
      return;
    }

    setIsMakingCall(true);
    setCallStatus('initiated');
    setCallSid(null);

    try {
      const response = await apiClient.post<{ success: boolean; data: { callSid: string; status: string } }>(
        '/agent/test-call',
        {
          to: testPhoneNumber.trim(),
        }
      );

      if (response.data?.success) {
        const { callSid, status } = response.data.data;
        setCallSid(callSid);
        
        // Map Twilio status to our CallStatus
        const mappedStatus: CallStatus = 
          status === 'queued' || status === 'initiated' ? 'initiated' :
          status === 'ringing' ? 'ringing' :
          status === 'in-progress' ? 'in-progress' :
          status === 'completed' ? 'completed' :
          status === 'busy' ? 'busy' :
          status === 'no-answer' ? 'no-answer' :
          status === 'failed' || status === 'canceled' ? 'failed' :
          'initiated';
        
        setCallStatus(mappedStatus);
        toast.success(`Testanruf gestartet! Call SID: ${callSid}`);
        
        // Invalidate dashboard query to refresh call logs
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      } else {
        throw new Error('Testanruf fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[AgentTestModal] Error making test call:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Fehler beim Starten des Testanrufs';
      setCallStatus('failed');
      toast.error(errorMsg);
    } finally {
      setIsMakingCall(false);
    }
  };

  const handleClose = () => {
    setTestMode('info');
    setTestPhoneNumber('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agent testen" size="lg">
      {testMode === 'info' ? (
        <div className="space-y-4">
          {!canStream ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-yellow-300 mb-1">
                  Agent-Test wird noch implementiert
                </h3>
                <p className="text-xs text-yellow-200/80">
                  Die Testanruf-Funktion wird in einer zukünftigen Version verfügbar sein. 
                  Du kannst den Agent über die zugewiesene Telefonnummer testen.
                </p>
              </div>
            </div>
          ) : !elevenAgentId ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="text-blue-400 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-blue-300 mb-1">
                  ElevenLabs Agent nicht konfiguriert
                </h3>
                <p className="text-xs text-blue-200/80">
                  Der Agent benötigt eine ElevenLabs Agent ID, um getestet werden zu können.
                  Bitte vervollständige zuerst die Agent-Konfiguration.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="text-accent" size={20} />
                  <h3 className="text-sm font-semibold">Testanruf starten</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Starte einen Testanruf mit dem Voice Agent. Du kannst mit dem Agent sprechen 
                  und die Antworten in Echtzeit hören.
                </p>
                
                {/* Test Call via Twilio */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">
                    Telefonnummer für Testanruf (E.164 Format, z.B. +41791234567)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="+41791234567"
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                      disabled={isMakingCall || callStatus !== 'idle'}
                    />
                    <button
                      onClick={handleMakeTestCall}
                      disabled={isMakingCall || !testPhoneNumber.trim() || callStatus !== 'idle'}
                      className="px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isMakingCall ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Wird angerufen...
                        </>
                      ) : (
                        <>
                          <Phone size={16} />
                          Anrufen
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Call Status Display */}
                  {callStatus !== 'idle' && (
                    <div className="mt-3 space-y-2">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                        callStatus === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {callStatus === 'completed' && <CheckCircle size={16} />}
                        {callStatus === 'failed' && <XCircle size={16} />}
                        {(callStatus === 'initiated' || callStatus === 'ringing' || callStatus === 'in-progress') && <Loader className="animate-spin" size={16} />}
                        <span className="font-medium">
                          {callStatus === 'initiated' && 'Anruf wird initiiert...'}
                          {callStatus === 'ringing' && 'Telefon klingelt...'}
                          {callStatus === 'in-progress' && 'Anruf läuft...'}
                          {callStatus === 'completed' && 'Anruf erfolgreich abgeschlossen'}
                          {callStatus === 'failed' && 'Anruf fehlgeschlagen'}
                          {callStatus === 'busy' && 'Telefonnummer ist besetzt'}
                          {callStatus === 'no-answer' && 'Keine Antwort'}
                        </span>
                      </div>
                      {callSid && (
                        <div className="text-xs text-gray-400 font-mono">
                          Call SID: {callSid}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Streaming Test (Alternative) */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-3">
                    Oder teste den Agent direkt im Browser:
                  </p>
                  <button
                    onClick={handleStartTest}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded font-medium hover:bg-gray-600 transition-colors"
                  >
                    Browser-Test starten
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canStream && locationId && agentConfigId && elevenAgentId ? (
            <VoiceAgentStreamingUI
              customerId={`test-${Date.now()}`}
              agentId={agentConfigId}
              voiceId={elevenAgentId || undefined}
              onClose={handleClose}
            />
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="text-yellow-400 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-yellow-300 mb-1">
                  ElevenLabs Agent ID fehlt
                </h3>
                <p className="text-xs text-yellow-200/80 mb-3">
                  Der Agent benötigt eine ElevenLabs Agent ID, um getestet werden zu können.
                  Bitte konfiguriere die Agent ID in den Einstellungen.
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    window.location.href = '/dashboard/settings';
                  }}
                  className="text-xs text-yellow-300 hover:text-yellow-200 underline"
                >
                  Zu Einstellungen gehen →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
