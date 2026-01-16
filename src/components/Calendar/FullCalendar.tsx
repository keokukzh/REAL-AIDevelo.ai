import React, { useState, useCallback, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { EventClickArg, DateSelectArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  Phone,
  User,
  Repeat,
  Calendar as CalendarIcon,
  Filter,
  Download,
  Settings,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { toast } from '../ui/Toast.js';
import { Button } from '../ui/Button.js';
import { Modal } from '../ui/Modal.js';

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
  linkedCallId?: string;
  googleEventId?: string;
  color?: string;
  recurrenceRule?: string;
}

interface FullCalendarComponentProps {
  locationId?: string;
}

export const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({ locationId }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<Partial<CalendarEvent>>({});
  const [viewType, setViewType] = useState<string>('timeGridWeek');

  // Fetch events
  const fetchEvents = useCallback(
    async (start?: Date, end?: Date) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (start) params.set('start', start.toISOString());
        if (end) params.set('end', end.toISOString());
        if (locationId) params.set('locationId', locationId);

        const resp = await apiClient.get(`/calendar/events?${params.toString()}`);
        if (resp.data.success) {
          setEvents(resp.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        toast.error('Kalendereinträge konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    },
    [locationId],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Map events to FullCalendar format
  const calendarEvents: EventInput[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.createdBy === 'agent' ? '#3b82f6' : '#6b7280',
      borderColor: event.createdBy === 'agent' ? '#2563eb' : '#4b5563',
      extendedProps: {
        description: event.description,
        createdBy: event.createdBy,
        linkedCallId: event.linkedCallId,
        attendees: event.attendees,
      },
    }));
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
      } catch (error) {
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
      } catch (error) {
        toast.error('Termin konnte nicht aktualisiert werden');
        resizeInfo.revert();
      }
    },
    [fetchEvents],
  );

  const handleSyncAll = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const resp = await apiClient.post('/calendar/sync');
      if (resp.data.success) {
        setSyncStatus('synced');
        toast.success(`${resp.data.data?.eventsSynced || 0} Termine synchronisiert`);
        fetchEvents();
      }
    } catch (error) {
      setSyncStatus('error');
      toast.error('Synchronisation fehlgeschlagen');
    }
  }, [fetchEvents]);

  const handleCreateEvent = useCallback(
    async (eventData: Partial<CalendarEvent>) => {
      const resp = await apiClient.post('/calendar/events', eventData);
      if (resp.data.success) {
        toast.success('Termin erstellt');
        setIsCreateModalOpen(false);
        setNewEventData({});
        fetchEvents();
      } else {
        throw new Error(resp.data.error || 'Fehler beim Erstellen');
      }
    },
    [fetchEvents],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        await apiClient.delete(`/calendar/events/${eventId}`);
        toast.success('Termin gelöscht');
        setIsDetailsModalOpen(false);
        setSelectedEvent(null);
        fetchEvents();
      } catch (error) {
        toast.error('Termin konnte nicht gelöscht werden');
      }
    },
    [fetchEvents],
  );

  // Custom event content renderer
  const renderEventContent = (eventInfo: any) => {
    const { createdBy } = eventInfo.event.extendedProps;
    return (
      <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden">
        {createdBy === 'agent' && <Phone size={10} className="flex-shrink-0" />}
        {createdBy === 'user' && <User size={10} className="flex-shrink-0" />}
        <span className="truncate text-xs font-medium">{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-accent" size={24} />
          <h2 className="text-xl font-bold">Kalender</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncStatus === 'syncing'}
            className="gap-2"
          >
            <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {syncStatus === 'syncing' ? 'Sync...' : 'Synchronisieren'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          views={{
            dayGridMonth: { buttonText: 'Monat' },
            timeGridWeek: { buttonText: 'Woche' },
            timeGridDay: { buttonText: 'Tag' },
            listWeek: { buttonText: 'Liste' },
            multiMonthYear: { buttonText: 'Jahr', duration: { months: 12 } },
          }}
          initialView={viewType}
          locale="de"
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          nowIndicator={true}
          height="calc(100vh - 280px)"
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '18:00',
          }}
          moreLinkClick="popover"
        />
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewEventData({});
        }}
        initialData={newEventData}
        onSave={handleCreateEvent}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onDelete={handleDeleteEvent}
        onUpdate={(data) => {
          if (selectedEvent) {
            apiClient
              .put(`/calendar/events/${selectedEvent.id}`, data)
              .then(() => {
                toast.success('Termin aktualisiert');
                fetchEvents();
                setIsDetailsModalOpen(false);
              })
              .catch(() => toast.error('Aktualisierung fehlgeschlagen'));
          }
        }}
      />
    </div>
  );
};

// Create Event Modal Component
interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<CalendarEvent>;
  onSave: (data: Partial<CalendarEvent>) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with current time + 1 hour as default
  useEffect(() => {
    if (isOpen) {
      if (initialData.start) {
        // From calendar date selection
        const startStr = initialData.start.includes('T')
          ? initialData.start.substring(0, 16)
          : `${initialData.start}T09:00`;
        setStart(startStr);
      } else {
        // Default to now rounded to next hour
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        setStart(now.toISOString().substring(0, 16));
      }

      if (initialData.end) {
        const endStr = initialData.end.includes('T')
          ? initialData.end.substring(0, 16)
          : `${initialData.end}T10:00`;
        setEnd(endStr);
      } else {
        // Default to start + 1 hour
        const endTime = new Date();
        endTime.setMinutes(0, 0, 0);
        endTime.setHours(endTime.getHours() + 2);
        setEnd(endTime.toISOString().substring(0, 16));
      }

      if (initialData.allDay) setAllDay(initialData.allDay);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Bitte Titel eingeben');
      return;
    }
    if (!start || !end) {
      toast.error('Bitte Start- und Endzeit angeben');
      return;
    }

    // Validate end is after start
    if (new Date(end) <= new Date(start)) {
      toast.error('Endzeit muss nach Startzeit liegen');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        recurrenceRule: recurrence || undefined,
      });
      // Reset form on success
      setTitle('');
      setDescription('');
      setStart('');
      setEnd('');
      setAllDay(false);
      setRecurrence('');
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neuer Termin" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Titel *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Terminname"
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ende</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-slate-800 text-accent focus:ring-accent"
          />
          <label htmlFor="allDay" className="text-sm text-gray-300">
            Ganztägig
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Wiederholen</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50"
          >
            <option value="">Keine Wiederholung</option>
            <option value="DAILY">Täglich</option>
            <option value="WEEKLY">Wöchentlich</option>
            <option value="MONTHLY">Monatlich</option>
            <option value="YEARLY">Jährlich</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung..."
            rows={3}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            Speichern
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Event Details Modal Component
interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete: (id: string) => void;
  onUpdate: (data: Partial<CalendarEvent>) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onDelete,
  onUpdate,
}) => {
  if (!event) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.title} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {event.createdBy === 'agent' ? (
            <>
              <Phone size={14} className="text-blue-400" /> Vom Agent erstellt
            </>
          ) : (
            <>
              <User size={14} className="text-gray-400" /> Manuell erstellt
            </>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Start:</span>
            <span className="text-white">{formatDate(event.start)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Ende:</span>
            <span className="text-white">{formatDate(event.end)}</span>
          </div>
          {event.description && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-sm text-gray-300">{event.description}</p>
            </div>
          )}
        </div>

        {event.linkedCallId && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2">
            <Phone size={16} className="text-blue-400" />
            <span className="text-sm text-blue-300">Verknüpfter Anruf vorhanden</span>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => onDelete(event.id)}
          >
            Löschen
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FullCalendarComponent;
