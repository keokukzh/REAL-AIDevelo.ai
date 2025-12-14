import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../services/apiClient';
import { toast } from '../ui/Toast';
import { Calendar, Loader, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  initialSlot?: { start: string; end: string };
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  locationId,
  initialSlot,
}) => {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState('');
  const [start, setStart] = useState(initialSlot?.start || '');
  const [end, setEnd] = useState(initialSlot?.end || '');
  const [description, setDescription] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [location, setLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<{
    eventId: string;
    htmlLink: string;
    start: string;
    end: string;
  } | null>(null);

  // Update start/end when initialSlot changes
  React.useEffect(() => {
    if (initialSlot) {
      setStart(initialSlot.start);
      setEnd(initialSlot.end);
    }
  }, [initialSlot]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSummary('');
      setStart(initialSlot?.start || '');
      setEnd(initialSlot?.end || '');
      setDescription('');
      setAttendeeEmail('');
      setLocation('');
      setError(null);
      setCreatedEvent(null);
    }
  }, [isOpen, initialSlot]);

  const handleCreate = async () => {
    if (!summary || !start || !end) {
      toast.warning('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const requestBody: any = {
        summary,
        start,
        end,
        timezone: 'Europe/Zurich',
      };

      if (description) {
        requestBody.description = description;
      }
      if (attendeeEmail) {
        requestBody.attendees = [{ email: attendeeEmail }];
      }
      if (location) {
        requestBody.location = location;
      }

      const response = await apiClient.post<{
        success: boolean;
        data?: {
          eventId: string;
          htmlLink: string;
          start: string;
          end: string;
          calendarId: string;
        };
        error?: string;
      }>('/calendar/google/create-appointment', requestBody);

      if (response.data?.success && response.data.data) {
        setCreatedEvent(response.data.data);
        toast.success('Termin erfolgreich erstellt');
        
        // Invalidate dashboard query to refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      } else {
        throw new Error(response.data?.error || 'Fehler beim Erstellen des Termins');
      }
    } catch (err: any) {
      console.error('[CreateAppointmentModal] Error creating appointment:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Fehler beim Erstellen des Termins';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Termin erstellen" size="lg">
      <div className="space-y-4">
        {/* Success State */}
        {createdEvent && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-green-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-300 mb-1">Termin erstellt</h3>
              <p className="text-xs text-green-200/80 mb-2">
                Der Termin wurde erfolgreich in deinem Google Kalender erstellt.
              </p>
              <div className="space-y-1 text-xs text-gray-300">
                <div>
                  <span className="text-gray-400">Event ID:</span>{' '}
                  <span className="font-mono">{createdEvent.eventId}</span>
                </div>
                <div>
                  <span className="text-gray-400">Zeit:</span>{' '}
                  {new Date(createdEvent.start).toLocaleString('de-CH', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}{' '}
                  -{' '}
                  {new Date(createdEvent.end).toLocaleString('de-CH', {
                    timeStyle: 'short',
                  })}
                </div>
                {createdEvent.htmlLink && (
                  <a
                    href={createdEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    In Google Kalender öffnen
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Form */}
        {!createdEvent && (
          <>
            <div>
              <label htmlFor="appointment-summary" className="block text-sm font-medium text-gray-300 mb-1">
                Titel <span className="text-red-400">*</span>
              </label>
              <input
                id="appointment-summary"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="z.B. Beratungstermin"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointment-start" className="block text-sm font-medium text-gray-300 mb-1">
                  Start <span className="text-red-400">*</span>
                </label>
                <input
                  id="appointment-start"
                  type="datetime-local"
                  value={start ? new Date(start).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setStart(date.toISOString());
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="appointment-end" className="block text-sm font-medium text-gray-300 mb-1">
                  Ende <span className="text-red-400">*</span>
                </label>
                <input
                  id="appointment-end"
                  type="datetime-local"
                  value={end ? new Date(end).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setEnd(date.toISOString());
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="appointment-description" className="block text-sm font-medium text-gray-300 mb-1">
                Beschreibung (optional)
              </label>
              <textarea
                id="appointment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Weitere Details zum Termin..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>

            <div>
              <label htmlFor="appointment-attendee" className="block text-sm font-medium text-gray-300 mb-1">
                Teilnehmer E-Mail (optional)
              </label>
              <input
                id="appointment-attendee"
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="teilnehmer@example.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>

            <div>
              <label htmlFor="appointment-location" className="block text-sm font-medium text-gray-300 mb-1">
                Ort (optional)
              </label>
              <input
                id="appointment-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Büro, Online, etc."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          {createdEvent ? (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors"
            >
              Schließen
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={!summary || !start || !end || isCreating}
                className="flex-1 px-4 py-2 bg-accent text-black rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Termin erstellen
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
