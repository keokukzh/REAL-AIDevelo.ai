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
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            {title && (
              typeof title === 'string' 
                ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                : <div className="text-lg font-semibold text-slate-900">{title}</div>
            )}
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
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
