import React from 'react';
import { CalendarIntegration } from '../CalendarIntegration';

interface CalendarStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const CalendarStep: React.FC<CalendarStepProps> = ({
  updateFormData,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-6">Verbinden Sie Ihren Kalender für automatische Buchungen (optional)</p>
      <CalendarIntegration
        onConnected={(provider) => {
          updateFormData({ calendarConnected: true });
        }}
      />
    </div>
  );
};
