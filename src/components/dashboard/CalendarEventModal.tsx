import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../newDashboard/ui/Input';
import { CalendarEvent, useCalendarEvents } from '../../hooks/useCalendarEvents';
import { Calendar, Loader, AlertCircle, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '../newDashboard/ui/Button';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  event?: CalendarEvent; // If provided, edit mode; otherwise create mode
  initialSlot?: { start: string; end: string };
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  locationId,
  event,
  initialSlot,
}) => {
  const isEditMode = !!event;
  const { createEvent, updateEvent, deleteEvent, isCreating, isUpdating, isDeleting } = useCalendarEvents({
    locationId,
    start: new Date(),
    end: new Date(),
    enabled: false, // Don't fetch events, just use mutations
  });

  const [summary, setSummary] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form from event (edit mode) or initialSlot (create mode)
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode: populate from event
        setSummary(event.summary);
        setStart(event.start);
        setEnd(event.end);
        setDescription(event.description || '');
        setAttendeeEmail(event.attendees?.[0]?.email || '');
        setLocation(event.location || '');
      } else if (initialSlot) {
        // Create mode: use initial slot
        setStart(initialSlot.start);
        setEnd(initialSlot.end);
      } else {
        // Create mode: default to now + 1 hour
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        setStart(now.toISOString());
        setEnd(oneHourLater.toISOString());
      }
      setSummary('');
      setDescription('');
      setAttendeeEmail('');
      setLocation('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, event, initialSlot]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSummary('');
      setStart('');
      setEnd('');
      setDescription('');
      setAttendeeEmail('');
      setLocation('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!summary || !start || !end) {
      setError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setError(null);

    const eventData = {
      summary,
      start,
      end,
      description: description || undefined,
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
      location: location || undefined,
      timezone: 'Europe/Zurich',
    };

    if (isEditMode && event) {
      updateEvent({ eventId: event.id, ...eventData });
    } else {
      createEvent(eventData);
    }
    
    // Note: Success handling is done in the hook's onSuccess callback
    // We'll close the modal after a delay, but the hook will show the toast
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
    // Error handling is done in the hook's onError callback
  };

  const handleDelete = () => {
    if (!event || !confirm('Möchten Sie diesen Termin wirklich löschen?')) {
      return;
    }

    setError(null);

    deleteEvent({ eventId: event.id, calendarId: event.calendarId });
    // Note: Success handling is done in the hook's onSuccess callback
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
    // Error handling is done in the hook's onError callback
  };

  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Termin bearbeiten' : 'Termin erstellen'} 
      size="lg"
    >
      <div className="space-y-4">
        {/* Success State */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-emerald-300 mb-1">
                Termin {isEditMode ? 'aktualisiert' : 'erstellt'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                Der Termin wurde erfolgreich {isEditMode ? 'aktualisiert' : 'erstellt'}.
              </p>
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
        {!success && (
          <>
            <div>
              <label htmlFor="event-summary" className="block text-sm font-medium text-gray-300 mb-1">
                Titel <span className="text-red-400">*</span>
              </label>
              <Input
                id="event-summary"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="z.B. Lara Meier - Dentalhygiene"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-start" className="block text-sm font-medium text-gray-300 mb-1">
                  Start <span className="text-red-400">*</span>
                </label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={formatDateTimeLocal(start)}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setStart(date.toISOString());
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="event-end" className="block text-sm font-medium text-gray-300 mb-1">
                  Ende <span className="text-red-400">*</span>
                </label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={formatDateTimeLocal(end)}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setEnd(date.toISOString());
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-gray-300 mb-1">
                Beschreibung (optional)
              </label>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Weitere Details zum Termin..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div>
              <label htmlFor="event-attendee" className="block text-sm font-medium text-gray-300 mb-1">
                Teilnehmer E-Mail (optional)
              </label>
              <Input
                id="event-attendee"
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="teilnehmer@example.com"
              />
            </div>

            <div>
              <label htmlFor="event-location" className="block text-sm font-medium text-gray-300 mb-1">
                Ort (optional)
              </label>
              <Input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Büro, Online, etc."
              />
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          {success ? (
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Schließen
            </Button>
          ) : (
            <>
              {isEditMode && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting || isUpdating}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  {isDeleting ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Wird gelöscht...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} className="mr-2" />
                      Löschen
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreating || isUpdating || isDeleting}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={!summary || !start || !end || isCreating || isUpdating || isDeleting}
                className="flex-1"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    {isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...'}
                  </>
                ) : (
                  <>
                    <Calendar size={16} className="mr-2" />
                    {isEditMode ? 'Termin aktualisieren' : 'Termin erstellen'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
