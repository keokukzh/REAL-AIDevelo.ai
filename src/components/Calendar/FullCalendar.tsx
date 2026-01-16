import React, { useState, useCallback, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import deLocale from '@fullcalendar/core/locales/de';
import { EventClickArg, DateSelectArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import { Phone, User, RefreshCw, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { toast } from '../ui/Toast.js';
import { Button } from '../ui/Button.js';
import { Modal } from '../ui/Modal.js';

import '../../styles/fullcalendar-custom.css';

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  description?: string;
  attendees?: string[];
  createdBy: 'user' | 'agent';
  isImportant?: boolean;
  linkedCallId?: string;
}

export const FullCalendarComponent: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<Partial<CalendarEvent>>({});

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await apiClient.get('/calendar/events');
      if (resp.data.success) {
        setEvents(resp.data.data || []);
      }
    } catch (_error) {
      console.error('Failed to fetch events:', _error);
      toast.error('Kalendereinträge konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Map events to FullCalendar format with CSS classes
  const calendarEvents: EventInput[] = useMemo(() => {
    return events.map((event) => {
      let className = '';
      if (event.isImportant) className = 'event-important';
      else if (event.createdBy === 'agent') className = 'event-agent';
      else className = 'event-user';

      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        className,
        extendedProps: {
          description: event.description,
          createdBy: event.createdBy,
          linkedCallId: event.linkedCallId,
          isImportant: event.isImportant,
        },
      };
    });
  }, [events]);

  // Handlers
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setNewEventData({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = events.find((e) => e.id === clickInfo.event.id);
      if (event) {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
      }
    },
    [events],
  );

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const { event } = dropInfo;
      try {
        await apiClient.put(`/calendar/events/${event.id}`, {
          start: event.startStr,
          end: event.endStr,
        });
        toast.success('Termin verschoben');
        fetchEvents();
      } catch (_error) {
        toast.error('Termin konnte nicht verschoben werden');
        dropInfo.revert();
      }
    },
    [fetchEvents],
  );

  const handleEventResize = useCallback(
    async (resizeInfo: EventResizeDoneArg) => {
      const { event } = resizeInfo;
      try {
        await apiClient.put(`/calendar/events/${event.id}`, {
          start: event.startStr,
          end: event.endStr,
        });
        toast.success('Termin aktualisiert');
        fetchEvents();
      } catch (_error) {
        toast.error('Termin konnte nicht aktualisiert werden');
        resizeInfo.revert();
      }
    },
    [fetchEvents],
  );

  // Custom event content renderer with Icons
  const renderEventContent = (eventInfo: {
    event: { title: string; extendedProps: { createdBy: string; isImportant: boolean } };
  }) => {
    const { createdBy, isImportant } = eventInfo.event.extendedProps;
    return (
      <div className="flex items-center gap-1.5 px-1 py-0.5 overflow-hidden">
        {isImportant && <AlertCircle size={12} className="flex-shrink-0 text-white" />}
        {createdBy === 'agent' && <Phone size={12} className="flex-shrink-0 text-white" />}
        {createdBy === 'user' && <User size={12} className="flex-shrink-0 text-white" />}
        <span className="truncate text-xs font-semibold">{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <div className="h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag',
          list: 'Liste',
          year: 'Jahr',
        }}
        initialView="timeGridWeek"
        locale={deLocale}
        timeZone="Europe/Zurich"
        firstDay={1}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        nowIndicator={true}
        height="100%"
        events={calendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventContent={renderEventContent}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialData={newEventData}
        onSave={async (data) => {
          await apiClient.post('/calendar/events', data);
          toast.success('Termin erstellt');
          setIsCreateModalOpen(false);
          fetchEvents();
        }}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
        onDelete={async (id) => {
          await apiClient.delete(`/calendar/events/${id}`);
          toast.success('Termin gelöscht');
          setIsDetailsModalOpen(false);
          fetchEvents();
        }}
      />
    </div>
  );
};

// Create Event Modal
const CreateEventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<CalendarEvent>;
  onSave: (data: Partial<CalendarEvent>) => Promise<void>;
}> = ({ isOpen, onClose, initialData, onSave }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStart(initialData.start?.substring(0, 16) || '');
      setEnd(initialData.end?.substring(0, 16) || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        title,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        createdBy: 'user',
      });
    } catch (_err) {
      toast.error('Fehler beim Speichern');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neuen Termin erstellen">
      <form onSubmit={handleSubmit} className="space-y-6 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Titel</label>
          <input
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Worum geht es?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Start</label>
            <input
              type="datetime-local"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Ende</label>
            <input
              type="datetime-local"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Event Details Modal
const EventDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete: (id: string) => Promise<void>;
}> = ({ isOpen, onClose, event, onDelete }) => {
  if (!event) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('de-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Termindetails">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              event.createdBy === 'agent'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {event.createdBy === 'agent' ? <Phone size={12} /> : <User size={12} />}
            {event.createdBy === 'agent' ? 'Vom Agent gebucht' : 'Manueller Eintrag'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-gray-300">
            <Clock className="text-gray-500" size={20} />
            <div>
              <p className="text-sm font-medium">{formatDate(event.start)}</p>
              <p className="text-xs text-gray-500">bis {formatDate(event.end)}</p>
            </div>
          </div>

          {event.description && (
            <div className="flex items-start gap-4 text-gray-300">
              <RefreshCw className="text-gray-500 mt-1" size={20} />
              <p className="text-sm leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-8">
          <Button
            variant="outline"
            onClick={() => onDelete(event.id)}
            className="flex-1 text-red-500 border-red-500/20 hover:bg-red-500/10 gap-2"
          >
            <Trash2 size={16} /> Löschen
          </Button>
          <Button
            variant="primary"
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700"
          >
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
};
