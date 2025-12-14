import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../services/apiClient';
import { toast } from '../ui/Toast';
import { Calendar, Loader, AlertCircle, Copy, Clock } from 'lucide-react';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  onCreateAppointment?: (slot: { start: string; end: string }) => void;
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  locationId,
  onCreateAppointment,
}) => {
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [businessHoursFrom, setBusinessHoursFrom] = useState('09:00');
  const [businessHoursTo, setBusinessHoursTo] = useState('17:00');
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [minNoticeMinutes, setMinNoticeMinutes] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCheckAvailability = async () => {
    setIsLoading(true);
    setError(null);
    setSlots([]);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data?: {
          timezone: string;
          range: { start: string; end: string };
          slots: TimeSlot[];
        };
        error?: string;
      }>('/calendar/google/check-availability', {
        date,
        businessHours: {
          from: businessHoursFrom,
          to: businessHoursTo,
        },
        slotMinutes,
        minNoticeMinutes,
        timezone: 'Europe/Zurich',
        maxResults: 20,
      });

      if (response.data?.success && response.data.data) {
        setSlots(response.data.data.slots);
        if (response.data.data.slots.length === 0) {
          toast.warning('Keine verfügbaren Slots gefunden');
        } else {
          toast.success(`${response.data.data.slots.length} verfügbare Slots gefunden`);
        }
      } else {
        throw new Error(response.data?.error || 'Fehler beim Prüfen der Verfügbarkeit');
      }
    } catch (err: any) {
      console.error('[AvailabilityModal] Error checking availability:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Fehler beim Prüfen der Verfügbarkeit';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert');
  };

  const handleCreateAppointment = (slot: TimeSlot) => {
    if (onCreateAppointment) {
      onCreateAppointment(slot);
      onClose();
    } else {
      toast.info('Termin erstellen: Bitte verwende den "Termin erstellen" Button');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verfügbarkeit prüfen" size="lg">
      <div className="space-y-4">
        {/* Input Form */}
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="availability-date" className="block text-sm font-medium text-gray-300 mb-1">
                Datum
              </label>
              <input
                id="availability-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label htmlFor="availability-slot-minutes" className="block text-sm font-medium text-gray-300 mb-1">
                Slot-Dauer (Minuten)
              </label>
              <select
                id="availability-slot-minutes"
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
              <option value={15}>15 Minuten</option>
              <option value={30}>30 Minuten</option>
              <option value={60}>60 Minuten</option>
            </select>
          </div>
            <div>
              <label htmlFor="availability-hours-from" className="block text-sm font-medium text-gray-300 mb-1">
                Geschäftszeiten von
              </label>
              <input
                id="availability-hours-from"
                type="time"
                value={businessHoursFrom}
                onChange={(e) => setBusinessHoursFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label htmlFor="availability-hours-to" className="block text-sm font-medium text-gray-300 mb-1">
                Geschäftszeiten bis
              </label>
              <input
                id="availability-hours-to"
                type="time"
                value={businessHoursTo}
                onChange={(e) => setBusinessHoursTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="availability-min-notice" className="block text-sm font-medium text-gray-300 mb-1">
                Mindest-Vorlaufzeit (Minuten)
              </label>
              <input
                id="availability-min-notice"
                type="number"
                value={minNoticeMinutes}
                onChange={(e) => setMinNoticeMinutes(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
        </div>

        <button
          onClick={handleCheckAvailability}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin" size={16} />
              Prüfe Verfügbarkeit...
            </>
          ) : (
            <>
              <Calendar size={16} />
              Verfügbarkeit prüfen
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-red-300 mb-1">Fehler</h3>
              <p className="text-xs text-red-200/80">{error}</p>
            </div>
          </div>
        )}

        {/* Slots Display */}
        {slots.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">
              Verfügbare Slots ({slots.length})
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {slots.map((slot, idx) => (
                <div
                  key={`slot-${slot.start}-${slot.end}-${idx}`}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-white">{slot.label}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {slot.start} - {slot.end}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`${slot.start} - ${slot.end}`)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Slot kopieren"
                    >
                      <Copy size={16} />
                    </button>
                    {onCreateAppointment && (
                      <button
                        onClick={() => handleCreateAppointment(slot)}
                        className="px-3 py-1.5 bg-accent text-black rounded text-xs font-medium hover:bg-accent/80 transition-colors"
                      >
                        Termin erstellen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && slots.length === 0 && !error && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <Calendar className="text-gray-500 mx-auto mb-2" size={32} />
            <p className="text-gray-400 text-sm">
              Klicke auf "Verfügbarkeit prüfen" um verfügbare Slots zu finden
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </Modal>
  );
};
