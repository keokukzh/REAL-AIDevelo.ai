import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AvailabilityStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const AvailabilityStep: React.FC<AvailabilityStepProps> = ({
  formData,
  updateFormData,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-6">Wann soll der AI Agent Anrufe entgegennehmen?</p>
      <div className="space-y-3">
        {['24/7', 'Nur ausserhalb der Öffnungszeiten'].map((option) => (
          <div
            key={option}
            onClick={() => updateFormData({ openingHours: option })}
            className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
              formData.openingHours === option
                ? 'border-accent/50 bg-accent/10'
                : 'border-white/10 bg-white/5 hover:border-accent/30'
            }`}
          >
            <span className={formData.openingHours === option ? 'font-bold' : ''}>
              {option === '24/7' ? '24/7 (Empfohlen)' : option}
            </span>
            {formData.openingHours === option && <CheckCircle2 className="text-accent" />}
          </div>
        ))}
      </div>
    </div>
  );
};
