import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { AgentTemplate } from '../data/agentTemplates';

interface WizardStep {
  id: string;
  title: string;
  component: React.ReactNode;
}

interface OnboardingWizardProps {
  steps: WizardStep[];
  onComplete: (data: any) => void;
  onCancel?: () => void;
  initialData?: any;
  autoSave?: boolean;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  initialData = {},
  autoSave = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSave) {
      localStorage.setItem('onboarding-wizard-data', JSON.stringify(formData));
      localStorage.setItem('onboarding-wizard-step', currentStep.toString());
    }
  }, [formData, currentStep, autoSave]);

  // Load from localStorage on mount
  useEffect(() => {
    if (autoSave) {
      const savedData = localStorage.getItem('onboarding-wizard-data');
      const savedStep = localStorage.getItem('onboarding-wizard-step');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
      if (savedStep) {
        const step = parseInt(savedStep, 10);
        if (step >= 0 && step < steps.length) {
          setCurrentStep(step);
        }
      }
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(new Set([...completedSteps, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(new Set([...completedSteps, currentStep]));
    if (autoSave) {
      localStorage.removeItem('onboarding-wizard-data');
      localStorage.removeItem('onboarding-wizard-step');
    }
    onComplete(formData);
  };

  const updateFormData = (updates: any) => {
    setFormData({ ...formData, ...updates });
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const canProceed = currentStep < steps.length - 1;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep]?.title}</h2>
              <p className="text-gray-400 text-sm mt-1">
                Schritt {currentStep + 1} von {steps.length}
              </p>
            </div>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index <= currentStep
                    ? index < currentStep
                      ? 'bg-accent'
                      : 'bg-accent'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {React.cloneElement(steps[currentStep]?.component as React.ReactElement, {
                formData: formData as any,
                updateFormData: updateFormData as any,
              } as any)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Zurück
          </Button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  completedSteps.has(index)
                    ? 'bg-accent'
                    : index === currentStep
                    ? 'bg-accent/50'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {canProceed ? (
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Weiter
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleComplete}
              className="flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              Abschliessen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


