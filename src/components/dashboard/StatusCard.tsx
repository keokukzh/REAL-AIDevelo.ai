import React from 'react';

interface StatusCardProps {
  title: string;
  status: 'active' | 'warning' | 'inactive';
  statusText: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  statusText,
  children,
  actions,
}) => {
  const statusColors = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    inactive: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
          {statusText}
        </div>
      </div>
      {children && <div className="space-y-2 mb-4">{children}</div>}
      {actions && <div className="flex gap-2 mt-4">{actions}</div>}
    </div>
  );
};
