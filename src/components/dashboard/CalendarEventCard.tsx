import React from 'react';
import { CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { CalendarEvent } from '../../hooks/useCalendarEvents';
import { differenceInMinutes } from 'date-fns';

interface CalendarEventCardProps {
  event: CalendarEvent;
  viewMode: 'day' | 'week' | 'month';
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  viewMode,
  onClick,
  onEdit,
  onDelete,
  className = '',
}) => {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const duration = differenceInMinutes(endDate, startDate);

  // Format time based on view mode
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-CH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  const timeLabel = viewMode === 'month'
    ? formatTime(startDate)
    : `${formatTime(startDate)} - ${formatTime(endDate)}`;

  // Extract client name and service from summary/description
  // Format: "Client Name - Service" or just "Service"
  const summaryParts = event.summary.split(' - ');
  const clientName = summaryParts.length > 1 ? summaryParts[0] : '';
  const service = summaryParts.length > 1 ? summaryParts[1] : event.summary;

  // Determine card styling based on AI booking
  const isAIBooked = event.aiBooked || event.description?.includes('[AI_BOOKED]');
  const bgColor = isAIBooked 
    ? 'bg-red-500/10 border-red-500/30' 
    : 'bg-slate-800/50 border-slate-700/50';

  return (
    <div
      className={`
        relative p-3 rounded-lg border transition-all cursor-pointer group
        ${bgColor}
        hover:shadow-lg hover:scale-[1.02]
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Termin: ${event.summary}, ${timeLabel}, ${duration} Minuten`}
    >
      {/* Status indicator - green checkmark */}
      <div className="absolute top-2 right-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Time and duration */}
      <div className="text-xs text-gray-400 mb-1 font-mono">
        {timeLabel}
        {viewMode !== 'month' && ` (${duration} min)`}
      </div>

      {/* Client name (bold) */}
      {clientName && (
        <div className="font-semibold text-white mb-0.5 text-sm">
          {clientName}
        </div>
      )}

      {/* Service name */}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${clientName ? 'text-gray-300' : 'text-white font-medium'}`}>
          {service}
        </span>
        
        {/* AI BOOKED Badge */}
        {isAIBooked && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            AI
          </span>
        )}
      </div>

      {/* Action buttons (on hover) */}
      <div className="absolute top-2 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
            aria-label="Termin bearbeiten"
            title="Bearbeiten"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
                onDelete();
              }
            }}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            aria-label="Termin löschen"
            title="Löschen"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
