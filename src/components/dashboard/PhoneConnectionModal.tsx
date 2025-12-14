import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../services/apiClient';
import { toast } from '../ui/Toast';
import { Phone, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface PhoneNumber {
  id: string;
  providerSid: string;
  number: string;
  country: string;
  status: 'available' | 'assigned' | 'active' | 'inactive';
  capabilities: {
    voice: boolean;
    sms?: boolean;
  };
  assignedAgentId?: string;
  metadata?: Record<string, any>;
}

interface PhoneConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentConfigId: string;
  locationId: string;
  onSuccess?: () => void;
}

export const PhoneConnectionModal: React.FC<PhoneConnectionModalProps> = ({
  isOpen,
  onClose,
  agentConfigId,
  locationId,
  onSuccess,
}) => {
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load available numbers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableNumbers();
    } else {
      // Reset state when modal closes
      setAvailableNumbers([]);
      setSelectedNumberId(null);
      setError(null);
    }
  }, [isOpen]);

  const loadAvailableNumbers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ success: boolean; data: PhoneNumber[] }>(
        '/telephony/numbers?country=CH'
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        setAvailableNumbers(response.data.data);
      } else {
        throw new Error('Ungültige Antwort vom Server');
      }
    } catch (err: any) {
      console.error('[PhoneConnectionModal] Error loading numbers:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Fehler beim Laden der verfügbaren Nummern';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedNumberId) {
      toast.warning('Bitte wähle eine Telefonnummer aus');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // Use the assign endpoint with body payload
      const response = await apiClient.post<{ success: boolean; data: any }>(
        '/telephony/assign',
        {
          agentId: agentConfigId,
          phoneNumberId: selectedNumberId,
        }
      );

      if (response.data?.success) {
        toast.success('Telefonnummer erfolgreich zugewiesen');
        
        // Invalidate dashboard query to refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        
        // Call success callback
        onSuccess?.();
        
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error('Zuweisung fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[PhoneConnectionModal] Error assigning number:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Fehler beim Zuweisen der Telefonnummer';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Telefon verbinden" size="lg">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-red-300 mb-1">Fehler</h3>
              <p className="text-xs text-red-200/80">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-accent" size={24} />
            <span className="ml-3 text-sm text-gray-400">Lade verfügbare Nummern...</span>
          </div>
        ) : availableNumbers.length === 0 ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-300 mb-1">Keine Nummern verfügbar</h3>
              <p className="text-xs text-yellow-200/80">
                Es sind derzeit keine Telefonnummern verfügbar. Bitte versuche es später erneut oder 
                kontaktiere den Support.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Verfügbare Telefonnummern
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableNumbers.map((number) => (
                  <label
                    key={number.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNumberId === number.id
                        ? 'bg-accent/20 border-accent'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="phoneNumber"
                      value={number.id}
                      checked={selectedNumberId === number.id}
                      onChange={(e) => setSelectedNumberId(e.target.value)}
                      className="w-4 h-4 text-accent focus:ring-accent focus:ring-offset-gray-800"
                    />
                    <Phone size={18} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{number.number}</span>
                        <span className="text-xs text-gray-400">({number.country})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {number.capabilities.voice && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                            Voice
                          </span>
                        )}
                        {number.capabilities.sms && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                            SMS
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedNumberId === number.id && (
                      <CheckCircle className="text-accent" size={20} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={onClose}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedNumberId || isAssigning}
                className="flex-1 px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Wird zugewiesen...
                  </>
                ) : (
                  'Nummer zuweisen'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
