import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { VoiceAgentStreamingUI } from './VoiceAgentStreamingUI';
import { AlertCircle, Phone, Info } from 'lucide-react';

interface AgentTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentConfigId?: string;
  locationId?: string;
  elevenAgentId?: string | null;
}

export const AgentTestModal: React.FC<AgentTestModalProps> = ({ 
  isOpen, 
  onClose, 
  agentConfigId,
  locationId,
  elevenAgentId 
}) => {
  const [testMode, setTestMode] = useState<'info' | 'streaming'>('info');

  // Check if we have the required data for streaming
  const canStream = !!locationId && !!agentConfigId;

  const handleStartTest = () => {
    if (canStream) {
      setTestMode('streaming');
    }
  };

  const handleClose = () => {
    setTestMode('info');
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
                <button
                  onClick={handleStartTest}
                  className="w-full px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors"
                >
                  Testanruf starten
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canStream && locationId && agentConfigId && (
            <VoiceAgentStreamingUI
              customerId={`test-${Date.now()}`}
              agentId={agentConfigId}
              voiceId={elevenAgentId || undefined}
              onClose={handleClose}
            />
          )}
        </div>
      )}
    </Modal>
  );
};
