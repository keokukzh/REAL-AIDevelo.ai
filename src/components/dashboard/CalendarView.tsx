import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { CalendarEvent } from '../../hooks/useCalendarEvents';
import { CalendarEventCard } from './CalendarEventCard';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isSameMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  startOfDay, getHours, getMinutes } from 'date-fns';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  calendarConnected: boolean;
  calendarProvider?: string;
  onDisconnect?: () => void;
  className?: string;
}

type ViewMode = 'day' | 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currentDate,
  onDateChange,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onDateClick,
  calendarConnected,
  calendarProvider,
  onDisconnect,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(currentDate);

  // Navigation functions
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange(today);
  };

  const goToPrevious = () => {
    let newDate: Date;
    if (viewMode === 'day') {
      newDate = subDays(selectedDate, 1);
    } else if (viewMode === 'week') {
      newDate = subWeeks(selectedDate, 1);
    } else {
      newDate = subMonths(selectedDate, 1);
    }
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const goToNext = () => {
    let newDate: Date;
    if (viewMode === 'day') {
      newDate = addDays(selectedDate, 1);
    } else if (viewMode === 'week') {
      newDate = addWeeks(selectedDate, 1);
    } else {
      newDate = addMonths(selectedDate, 1);
    }
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  // Get date range for current view
  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return { start: startOfDay(selectedDate), end: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) };
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return { start: weekStart, end: weekEnd };
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return { start: monthStart, end: monthEnd };
    }
  }, [viewMode, selectedDate]);

  // Filter events for current view
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart < dateRange.end && eventEnd > dateRange.start;
    });
  }, [events, dateRange]);

  // Group events by date for week/month views
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
      if (!grouped[eventDate]) {
        grouped[eventDate] = [];
      }
      grouped[eventDate].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Render Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 to 17:00
    const dayEvents = [...filteredEvents].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return (
      <div className="flex gap-4">
        {/* Time axis */}
        <div className="w-16 flex-shrink-0">
          {hours.map(hour => (
            <div key={hour} className="h-16 flex items-start justify-end pr-2 text-xs text-gray-400">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="flex-1 relative">
          {hours.map(hour => {
            const hourStart = new Date(selectedDate);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hour + 1, 0, 0, 0);

            const hourEvents = dayEvents.filter(event => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              return eventStart < hourEnd && eventEnd > hourStart;
            });

            return (
              <div key={hour} className="h-16 border-b border-slate-700/50 relative">
                {hourEvents.map((event, idx) => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  const startMinutes = getHours(eventStart) * 60 + getMinutes(eventStart);
                  const endMinutes = getHours(eventEnd) * 60 + getMinutes(eventEnd);
                  const top = ((startMinutes - hour * 60) / 60) * 100;
                  const height = ((endMinutes - startMinutes) / 60) * 100;

                  return (
                    <div
                      key={event.id}
                      className="absolute left-0 right-0"
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <CalendarEventCard
                        event={event}
                        viewMode="day"
                        onClick={() => onEventClick?.(event)}
                        onEdit={() => onEventEdit?.(event)}
                        onDelete={() => onEventDelete?.(event)}
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 4) }); // MO-FR

    return (
      <div className="grid grid-cols-5 gap-4">
        {weekDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dayKey] || [];
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={dayKey}
              className={`border rounded-lg p-3 min-h-[400px] ${
                isSelected 
                  ? 'border-swiss-red bg-red-500/5' 
                  : 'border-slate-700/50 bg-slate-800/30'
              }`}
            >
              <div className="mb-3">
                <div className="text-xs text-gray-400 uppercase mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-swiss-red' : 'text-white'}`}>
                  {format(day, 'd.M.')}
                </div>
              </div>
              <div className="space-y-2">
                {dayEvents
                  .toSorted((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map(event => (
                    <CalendarEventCard
                      key={event.id}
                      event={event}
                      viewMode="week"
                      onClick={() => {
                        onDateClick?.(day);
                        onEventClick?.(event);
                      }}
                      onEdit={() => onEventEdit?.(event)}
                      onDelete={() => onEventDelete?.(event)}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

    return (
      <div>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-gray-400 font-semibold py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dayKey] || [];
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, selectedDate);

            return (
              <button
                key={dayKey}
                type="button"
                className={`min-h-[100px] w-full border rounded-lg p-2 text-left transition-colors ${
                  isSelected
                    ? 'border-swiss-red bg-red-500/10'
                    : isToday
                    ? 'border-accent/50 bg-accent/5'
                    : 'border-slate-700/50 bg-slate-800/20'
                } ${!isCurrentMonth ? 'opacity-40' : ''} hover:border-accent/50`}
                onClick={() => {
                  setSelectedDate(day);
                  onDateClick?.(day);
                }}
                aria-label={`${format(day, 'd. MMMM yyyy')}, ${dayEvents.length} Termine`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-swiss-red' : 'text-gray-300'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      type="button"
                      className={`text-xs p-1 rounded truncate w-full text-left ${
                        event.aiBooked
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-slate-700/50 text-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={event.summary}
                      aria-label={`Termin: ${event.summary}`}
                    >
                      {format(new Date(event.start), 'HH:mm')} {event.summary.substring(0, 15)}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{dayEvents.length - 3} weitere
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Format date label based on view mode
  const dateLabel = useMemo(() => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('de-CH', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${weekStart.toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric' })} - ${weekEnd.toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    }
  }, [viewMode, selectedDate]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        {/* View mode switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-800/50 text-gray-400 hover:text-white border border-slate-700/50'
            }`}
          >
            Tag
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-800/50 text-gray-400 hover:text-white border border-slate-700/50'
            }`}
          >
            Woche
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-800/50 text-gray-400 hover:text-white border border-slate-700/50'
            }`}
          >
            Monat
          </button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Vorherige"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Heute
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Nächste"
          >
            <ChevronRight size={20} />
          </button>
          <div className="ml-4 text-sm font-semibold text-white">
            {dateLabel}
          </div>
        </div>

        {/* Google Calendar status and legend */}
        <div className="flex items-center gap-4">
          {calendarConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {calendarProvider ? `${calendarProvider.charAt(0).toUpperCase() + calendarProvider.slice(1)} Calendar` : 'Google Calendar'}
              {onDisconnect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect();
                  }}
                  className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"
                  title="Verbindung trennen"
                  aria-label="Kalenderverbindung trennen"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-400">AI BOOKED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              <span className="text-gray-400">MANUAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>
    </div>
  );
};
