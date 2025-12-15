import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description, action }) => {
  return (
    <div className={`bg-slate-900/50 border border-slate-700/50 rounded-lg backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <div>
            {title && (
              typeof title === 'string' 
                ? <h3 className="text-lg font-semibold font-display text-white">{title}</h3>
                : <div className="text-lg font-semibold font-display text-white">{title}</div>
            )}
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
