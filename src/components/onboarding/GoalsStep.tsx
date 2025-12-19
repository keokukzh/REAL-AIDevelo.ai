import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface GoalsStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const GoalsStep: React.FC<GoalsStepProps> = ({
  formData,
  updateFormData,
}) => {
  const goals = ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs', 'Bestellannahme'];

  const handleGoalToggle = (goal: string) => {
    const newGoals = (formData.goals || []).includes(goal)
      ? (formData.goals || []).filter((g: string) => g !== goal)
      : [...(formData.goals || []), goal];
    updateFormData({ goals: newGoals });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-6">Was ist die Hauptaufgabe Ihres Voice Agents?</p>
      <div className="grid grid-cols-1 gap-3">
        {goals.map((goal) => (
          <div
            key={goal}
            onClick={() => handleGoalToggle(goal)}
            className={`p-4 border rounded-xl cursor-pointer transition-colors ${
              (formData.goals || []).includes(goal)
                ? 'border-accent/50 bg-accent/10'
                : 'border-white/10 bg-white/5 hover:border-accent/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{goal}</span>
              {(formData.goals || []).includes(goal) && <CheckCircle2 className="text-accent" />}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="recordingConsent"
            checked={formData.recordingConsent || false}
            onChange={(e) => updateFormData({ recordingConsent: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-2"
          />
          <label htmlFor="recordingConsent" className="text-sm text-gray-300 cursor-pointer">
            <span className="font-semibold">Anrufe aufzeichnen (optional)</span>
            <p className="text-xs text-gray-500 mt-1">
              Ich stimme zu, dass Anrufe für Qualitätssicherung und Training aufgezeichnet werden können.
            </p>
          </label>
        </div>
      </div>
    </div>
  );
};
