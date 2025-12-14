import React from 'react';

interface Call {
  id: string;
  direction: string;
  from_e164: string | null;
  to_e164: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  outcome: string | null;
}

interface RecentCallsTableProps {
  calls: Call[];
  onCallClick?: (call: Call) => void;
}

export const RecentCallsTable: React.FC<RecentCallsTableProps> = ({ calls, onCallClick }) => {
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (e164: string | null): string => {
    if (!e164) return 'Unbekannt';
    // Simple formatting - can be enhanced
    return e164;
  };

  if (calls.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <p className="text-gray-400 mb-2">Noch keine Anrufe</p>
        <p className="text-sm text-gray-500">Anrufe werden hier angezeigt, sobald sie eingehen.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Letzte Anrufe</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Richtung</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Von</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nach</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Zeitpunkt</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Dauer</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Ergebnis</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr 
                key={call.id} 
                className={`border-b border-gray-700/50 transition-colors ${
                  onCallClick ? 'hover:bg-gray-700/30 cursor-pointer' : ''
                }`}
                onClick={() => onCallClick?.(call)}
              >
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    call.direction === 'inbound'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {call.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">{formatPhoneNumber(call.from_e164)}</td>
                <td className="py-3 px-4 text-sm">{formatPhoneNumber(call.to_e164)}</td>
                <td className="py-3 px-4 text-sm text-gray-300">
                  {new Date(call.started_at).toLocaleString('de-CH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 px-4 text-sm text-gray-300">{formatDuration(call.duration_sec)}</td>
                <td className="py-3 px-4">
                  {call.outcome ? (
                    <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                      {call.outcome}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
