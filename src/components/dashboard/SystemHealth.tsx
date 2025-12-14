import React from 'react';

interface SystemHealthProps {
  backendSha?: string;
  lastRefresh?: Date;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ backendSha, lastRefresh }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-400">Backend:</span>
            <span className="ml-2 font-mono text-xs text-gray-300">
              {backendSha ? `${backendSha.substring(0, 7)}...` : 'unknown'}
            </span>
          </div>
          {lastRefresh && (
            <div>
              <span className="text-gray-400">Last refresh:</span>
              <span className="ml-2 text-gray-300">
                {lastRefresh.toLocaleTimeString('de-CH')}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-gray-400 text-xs">System OK</span>
        </div>
      </div>
    </div>
  );
};
