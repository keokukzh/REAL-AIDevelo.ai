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
    <article className={`bg-slate-900/50 border border-slate-700/50 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-black/20 transition-all ${className}`}>
      {(title || action) && (
        <header className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <div>
            {title && (
              typeof title === 'string' 
                ? <h3 className="text-lg font-semibold font-display text-white">{title}</h3>
                : <div className="text-lg font-semibold font-display text-white">{title}</div>
            )}
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </header>
      )}
      <div className="p-6">
        {children}
      </div>
    </article>
  );
};
