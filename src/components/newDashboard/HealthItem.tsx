import React from 'react';

interface HealthItemProps {
  label: string;
  status: 'ok' | 'error' | 'warning';
}

export const HealthItem: React.FC<HealthItemProps> = ({ label, status }) => {
  const statusColors = {
    ok: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500'
  };
  
  const statusText = {
    ok: 'OK',
    error: 'ERROR',
    warning: 'WARN'
  };
  
  const statusTextColor = {
    ok: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400'
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-300">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`}></div>
        {label}
      </div>
      <span className={`text-xs font-mono font-medium ${statusTextColor[status]}`}>
        {statusText[status]}
      </span>
    </div>
  );
};
