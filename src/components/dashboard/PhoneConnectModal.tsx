import React, { useState } from 'react';
import { usePhoneNumbers } from '../../hooks/usePhoneNumbers';
import { apiClient } from '../../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../ui/Toast';

interface PhoneConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PhoneConnectModal: React.FC<PhoneConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [selectedNumberSid, setSelectedNumberSid] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: phoneNumbers, isLoading, error } = usePhoneNumbers('CH');

  const handleConnect = async () => {
    if (!selectedNumber || !selectedNumberSid) {
      toast.error('Bitte wähle eine Telefonnummer aus');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>(
        '/phone/connect',
        {
          phoneNumberSid: selectedNumberSid,
          phoneNumber: selectedNumber,
        }
      );

      if (response.data?.success) {
        toast.success('Telefon erfolgreich verbunden');
        
        // Invalidate and refetch dashboard overview
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        
        // Call success callback
        onSuccess?.();
        
        // Close modal
        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to connect phone');
      }
    } catch (error: any) {
      console.error('[PhoneConnectModal] Error connecting phone:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Verbinden: ${errorMsg}`);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Telefon verbinden</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isConnecting}
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-gray-400">Lade verfügbare Nummern...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded p-4 mb-4">
            <p className="text-red-200">
              Fehler beim Laden der Nummern: {error.message}
            </p>
          </div>
        )}

        {!isLoading && !error && phoneNumbers && phoneNumbers.length === 0 && (
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded p-4 mb-4">
            <p className="text-yellow-200">
              Keine verfügbaren Nummern gefunden. Bitte versuche es später erneut.
            </p>
          </div>
        )}

        {!isLoading && !error && phoneNumbers && phoneNumbers.length > 0 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verfügbare Nummern (CH):
              </label>
              <select
                value={selectedNumber || ''}
                onChange={(e) => {
                  const number = phoneNumbers.find((n) => n.number === e.target.value);
                  if (number) {
                    setSelectedNumber(number.number);
                    setSelectedNumberSid(number.providerSid);
                  }
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isConnecting}
              >
                <option value="">-- Nummer auswählen --</option>
                {phoneNumbers.map((number) => (
                  <option key={number.id} value={number.number}>
                    {number.number} {number.metadata?.friendlyName ? `(${number.metadata.friendlyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={isConnecting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConnect}
                disabled={!selectedNumber || isConnecting}
                className="px-4 py-2 bg-accent hover:bg-accent/80 rounded text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Verbinde...' : 'Verbinden'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
