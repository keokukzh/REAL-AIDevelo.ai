import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'completed' | 'missed' | 'voicemail' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    missed: "bg-red-100 text-red-800 border-red-200",
    voicemail: "bg-amber-100 text-amber-800 border-amber-200"
  };
  
  const labels: Record<string, string> = {
    completed: "Erfolg",
    missed: "Verpasst",
    voicemail: "Voicemail"
  };
  
  const style = styles[status] || styles.completed;
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status === 'missed' && <XCircle className="w-3 h-3 mr-1" />}
      {label}
    </span>
  );
};
