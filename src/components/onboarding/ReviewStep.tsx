import React from 'react';

interface ReviewStepProps {
  formData: any;
  selectedTemplate?: any;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  selectedTemplate,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-lg border border-white/10 p-6 space-y-3">
        <div>
          <span className="text-gray-400 text-sm">Firmenname:</span>
          <p className="font-medium">{formData.companyName || 'Nicht angegeben'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Branche:</span>
          <p className="font-medium">{formData.industry || selectedTemplate?.industry}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Sprache:</span>
          <p className="font-medium">{formData.language || selectedTemplate?.language}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Ziele:</span>
          <p className="font-medium">{(formData.goals || []).join(', ') || 'Keine'}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400">
        Überprüfen Sie Ihre Angaben und klicken Sie auf "Abschliessen", um den Agent zu erstellen.
      </p>
    </div>
  );
};
