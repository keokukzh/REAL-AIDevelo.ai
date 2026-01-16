import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  showLogo?: boolean;
  showText?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Wird geladen...',
  subtext,
  size = 'md',
  fullScreen = false,
  showLogo = true,
  showText = true,
  error = false,
  onRetry,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const logoSizes = {
    sm: 'h-10 px-2',
    md: 'h-20 px-4',
    lg: 'h-[120px] px-8',
  };

  const circleSizes = {
    sm: 'w-2 h-2 -top-1 -right-1',
    md: 'w-4 h-4 -top-1.5 -right-1.5',
    lg: 'w-6 h-6 -top-2 -right-2',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] bg-[#05060a] flex flex-col items-center justify-center transition-opacity duration-300'
    : 'flex flex-col items-center justify-center p-6 w-full h-full min-h-[100px] transition-opacity duration-300';

  return (
    <div
      className={`${containerClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="status"
      aria-live="polite"
      aria-busy={!error}
    >
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {showLogo && (
          <div className="relative group loading-gpu">
            {/* Logo scaling pulse and glow */}
            <div
              className={`relative overflow-visible rounded-xl transition-all duration-300 ${
                !error ? 'logo-pulse-combined' : ''
              }`}
            >
              <img
                src="/logo-studio-white.png"
                alt="AIDevelo Logo"
                className={`${logoSizes[size]} object-contain relative z-10`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />

              {/* Pulsating Circle top right */}
              {!error && (
                <div
                  className={`absolute ${circleSizes[size]} z-20 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40 
                  circle-bounce-spin-combined`}
                />
              )}

              {/* Error Icon overlay */}
              {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/40 backdrop-blur-[1px] rounded-xl border border-red-500/50">
                  <span className="text-red-500 text-3xl font-bold">✕</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showText && (
          <div className="space-y-2">
            <h3
              className={`text-white font-medium ${
                size === 'lg' ? 'text-lg' : 'text-sm'
              } ${!error ? 'animate-[loading-text-breathe_2.5s_ease-in-out_infinite]' : 'text-red-400'}`}
            >
              {error ? 'Fehler beim Laden' : message}
            </h3>
            {subtext && !error && <p className="text-gray-500 text-xs px-4">{subtext}</p>}

            {error && onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
              >
                Erneut versuchen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string; subtext?: string }> = ({
  message,
  subtext,
}) => <LoadingSpinner fullScreen size="lg" message={message} subtext={subtext} />;

export const InlineLoader: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingSpinner size="sm" showLogo={false} message={message} />
);

export const ButtonLoader: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-current animate-pulse bg-gradient-to-tr from-blue-500 to-cyan-400" />
    <span className="animate-[loading-text-breathe_1.5s_ease-in-out_infinite]">...</span>
  </div>
);
