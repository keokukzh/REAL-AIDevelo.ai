import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-slate-800/50 border border-slate-700/50">
          <Icon className="w-8 h-8 text-gray-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold font-display text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyCalls: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="Noch keine Anrufe"
    description="Sobald Ihr Voice Agent Anrufe erhält, werden diese hier angezeigt."
    actionLabel={onAction ? "Agent testen" : undefined}
    onAction={onAction}
  />
);

export const EmptyCalendar: React.FC<{ onConnect?: () => void }> = ({ onConnect }) => (
  <EmptyState
    title="Kalender nicht verbunden"
    description="Verbinden Sie Ihren Kalender, um Termine zu verwalten und Verfügbarkeit zu prüfen."
    actionLabel={onConnect ? "Kalender verbinden" : undefined}
    onAction={onConnect}
  />
);

export const EmptyDocuments: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    title="Keine Dokumente"
    description="Laden Sie Dokumente hoch, um die Knowledge Base zu erweitern."
    actionLabel={onUpload ? "Dokument hochladen" : undefined}
    onAction={onUpload}
  />
);
