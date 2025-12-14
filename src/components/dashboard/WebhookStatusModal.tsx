import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useWebhookStatus } from '../../hooks/useWebhookStatus';
import { toast } from '../ui/Toast';
import { Loader, AlertCircle, CheckCircle, Copy, RefreshCw, Phone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface WebhookStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookStatusModal: React.FC<WebhookStatusModalProps> = ({ isOpen, onClose }) => {
  const { data, isLoading, error, refetch } = useWebhookStatus();
  const [isTesting, setIsTesting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isDevMode = import.meta.env.DEV || import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  const handleCopy = async (text: string | null, fieldName: string) => {
    if (!text) {
      toast.warning('Keine URL zum Kopieren');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('URL kopiert');
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        // Fallback: Select text
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('URL kopiert');
          setCopiedField(fieldName);
          setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
          toast.error('Kopieren fehlgeschlagen');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleTestWebhook = async () => {
    if (!isDevMode) return;

    setIsTesting(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: { attempted: boolean; result: string; details?: string } }>(
        '/phone/test-webhook'
      );

      if (response.data?.success) {
        const result = response.data.data.result;
        if (result === 'ok') {
          toast.success('Webhook-Test erfolgreich');
        } else {
          toast.warning(response.data.data.details || 'Webhook-Test fehlgeschlagen');
        }
        // Refetch status after test
        refetch();
      } else {
        throw new Error('Test fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[WebhookStatusModal] Error testing webhook:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Webhook-Test fehlgeschlagen';
      toast.error(errorMsg);
    } finally {
      setIsTesting(false);
    }
  };

  const renderUrlField = (
    label: string,
    configuredUrl: string | null,
    expectedUrl: string,
    matches: boolean,
    fieldName: string
  ) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={configuredUrl || 'Nicht konfiguriert'}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono text-gray-300"
          />
          <button
            onClick={() => handleCopy(configuredUrl, fieldName)}
            disabled={!configuredUrl}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              configuredUrl
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title="URL kopieren"
          >
            <Copy size={16} className={copiedField === fieldName ? 'text-green-400' : ''} />
          </button>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400">
            Erwartet: <span className="font-mono text-gray-300">{expectedUrl || 'Nicht konfiguriert'}</span>
          </div>
          {expectedUrl && (
            <div className="flex items-center gap-2">
              {matches ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                  <CheckCircle size={12} />
                  Übereinstimmung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                  <AlertCircle size={12} />
                  Nicht übereinstimmend
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Webhook Status" size="lg">
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-accent" size={24} />
            <span className="ml-3 text-sm text-gray-400">Lade Webhook-Status...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-300 mb-1">Fehler beim Laden</h3>
              <p className="text-xs text-red-200/80 mb-3">{error.message || 'Unbekannter Fehler'}</p>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Empty State (no phone number) */}
        {!isLoading && !error && data && !data.phoneNumber && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-300 mb-1">Keine Telefonnummer verbunden</h3>
              <p className="text-xs text-yellow-200/80">
                Bitte verbinde zuerst eine Telefonnummer, um den Webhook-Status zu prüfen.
              </p>
            </div>
          </div>
        )}

        {/* Content (with phone number) */}
        {!isLoading && !error && data && data.phoneNumber && (
          <>
            {/* Phone Number Info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Telefonnummer</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-mono text-gray-200">{data.phoneNumber.number}</div>
                <div className="text-xs text-gray-400">SID: {data.phoneNumber.sid}</div>
              </div>
            </div>

            {/* Voice URL */}
            {renderUrlField(
              'Voice URL',
              data.configured.voiceUrl,
              data.expected.voiceUrl,
              data.matches.voiceUrl,
              'voiceUrl'
            )}

            {/* Status Callback URL */}
            {renderUrlField(
              'Status Callback URL',
              data.configured.statusCallbackUrl,
              data.expected.statusCallbackUrl,
              data.matches.statusCallbackUrl,
              'statusCallbackUrl'
            )}

            {/* Warning if PUBLIC_BASE_URL not set */}
            {!data.expected.voiceUrl && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-200/80">
                  ⚠️ PUBLIC_BASE_URL ist nicht konfiguriert. Erwartete URLs können nicht berechnet werden.
                </p>
              </div>
            )}

            {/* Test Webhook Button (dev only) */}
            {isDevMode && (
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={handleTestWebhook}
                  disabled={isTesting}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Teste Webhook...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Webhook testen
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              refetch();
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </Modal>
  );
};
