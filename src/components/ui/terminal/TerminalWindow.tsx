import React from 'react';

interface TerminalWindowProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({ 
  children, 
  title = "bash", 
  className = "" 
}) => {
  return (
    <div className={`rounded-lg border border-[var(--term-border-primary)] bg-[var(--term-bg-primary)] overflow-hidden shadow-2xl font-mono-term text-[var(--term-text-primary)] ${className}`}>
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--term-bg-tertiary)] border-b border-[var(--term-border-primary)]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>
        <div className="text-xs text-[var(--term-text-secondary)] font-medium opacity-70">
          {title}
        </div>
        <div className="w-14" /> {/* Spacer for centering */}
      </div>

      {/* Terminal Content Area */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
