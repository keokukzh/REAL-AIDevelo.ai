import { useState } from 'react';
import { makeTestCall } from '../../services/api.js';
import { Phone, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { toast } from '../ui/Toast.js';
import { logger } from '../../lib/logger.js';

interface TestCallButtonProps {
  phoneNumber: string | null;
  disabled?: boolean;
  onTestCall?: () => void;
}

export function TestCallButton({ phoneNumber, disabled, onTestCall }: TestCallButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhoneNumber = (number: string) => {
    // Basic E.164-ish validation: + followed by country code and numbers
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  async function handleStartCall() {
    if (!phoneNumber) {
      toast.error('Keine Telefonnummer verbunden.');
      return;
    }

    if (!validatePhoneNumber(targetNumber)) {
      setError('Ungültiges Format. Bitte nutze +41791234567');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await makeTestCall(phoneNumber, targetNumber);
      toast.success(`Anruf gestartet! SID: ${response.data.callSid}`);
      setIsModalOpen(false);
      setTargetNumber('');
    } catch (err: unknown) {
      logger.error('TestCallButton: Test call failed', err);
      const errorResponse = err as { details?: { error?: string }; message?: string };
      const errorMessage =
        errorResponse.details?.error ||
        errorResponse.message ||
        'Anruf konnte nicht gestartet werden.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleClick = () => {
    if (onTestCall) {
      onTestCall();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="mt-4">
        <Button
          onClick={handleClick}
          disabled={disabled || !phoneNumber}
          className={`w-full flex items-center justify-center gap-2 py-2.5 shadow-lg shadow-indigo-900/20 
            ${disabled || !phoneNumber ? 'bg-slate-800 text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          <Phone className="w-4 h-4" />
          Test-Anruf starten
        </Button>
        {!phoneNumber && (
          <p className="text-[10px] text-gray-500 text-center italic mt-2">
            Nummer verbinden, um Test-Anrufe zu tätigen.
          </p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !loading && setIsModalOpen(false)}
        title="Test-Anruf starten"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Gib die Telefonnummer ein, die du für den Test-Anruf anrufen möchtest.
          </p>

          <div className="space-y-2">
            <label
              htmlFor="targetNumber"
              className="text-xs font-semibold text-gray-300 uppercase tracking-wider"
            >
              Zielnummer
            </label>
            <input
              id="targetNumber"
              type="text"
              placeholder="+41791234567"
              value={targetNumber}
              onChange={(e) => {
                setTargetNumber(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full bg-slate-800/50 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono`}
              disabled={loading}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[11px] text-amber-500 leading-relaxed font-medium">
              <strong>Info:</strong> Der Anruf wird von deiner verbundenen Nummer ({phoneNumber})
              getätigt.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleStartCall}
              disabled={loading || !targetNumber}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verbinden...
                </>
              ) : (
                'Anrufen'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
