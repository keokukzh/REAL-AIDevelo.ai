import React from 'react';
import { Mic } from 'lucide-react';
import { Button } from '../ui/Button';

interface VoiceStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  selectedTemplate?: any;
  onOpenVoiceOnboarding: () => void;
}

export const VoiceStep: React.FC<VoiceStepProps> = ({
  selectedTemplate,
  onOpenVoiceOnboarding,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-6">
        {selectedTemplate && `Template Voice: ${selectedTemplate.voiceId}`}
      </p>
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={onOpenVoiceOnboarding}
          className="w-full"
        >
          <Mic className="mr-2" />
          Eigene Stimme klonen (optional)
        </Button>
        <p className="text-sm text-gray-400 text-center">
          Sie können auch später eine eigene Stimme klonen. Das Template verwendet bereits eine vorkonfigurierte Stimme.
        </p>
      </div>
    </div>
  );
};
