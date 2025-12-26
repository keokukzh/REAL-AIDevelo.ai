import React from 'react';

interface TerminalCommandProps {
  command: string;
  prompt?: string;
  showCursor?: boolean;
}

export const TerminalCommand: React.FC<TerminalCommandProps> = ({ 
  command, 
  prompt = "~", 
  showCursor = false 
}) => {
  return (
    <div className="flex items-center gap-2 font-mono-term text-sm md:text-base mb-2">
      <span className="text-[var(--term-text-success)] font-bold">➜</span>
      <span className="text-[var(--term-text-accent)] font-bold">{prompt}</span>
      <span className="text-[var(--term-text-primary)]">
        {command}
        {showCursor && (
          <span className="inline-block w-2.5 h-5 bg-[var(--term-text-primary)] ml-1 align-middle animate-pulse" />
        )}
      </span>
    </div>
  );
};
