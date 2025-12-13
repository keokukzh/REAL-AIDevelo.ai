import React, { useState } from 'react';
import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { LoadingSpinner } from '../LoadingSpinner';

type WizardStep = 'persona' | 'business' | 'services' | 'goals' | 'confirm';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { data: overview } = useDashboardOverview();
  const updateConfig = useUpdateAgentConfig();
  const [currentStep, setCurrentStep] = useState<WizardStep>('persona');
  const [formData, setFormData] = useState({
    persona_gender: 'female',
    persona_age_range: '25-35',
    business_type: 'general',
    goals_json: [] as string[],
    services_json: [] as any[],
  });

  // Sync formData with overview when it loads
  React.useEffect(() => {
    if (overview?.agent_config) {
      setFormData({
        persona_gender: overview.agent_config.persona_gender || 'female',
        persona_age_range: overview.agent_config.persona_age_range || '25-35',
        business_type: overview.agent_config.business_type || 'general',
        goals_json: Array.isArray(overview.agent_config.goals_json) ? overview.agent_config.goals_json : [],
        services_json: Array.isArray(overview.agent_config.services_json) ? overview.agent_config.services_json : [],
      });

      // Set current step based on setup_state
      const state = overview.agent_config.setup_state;
      if (state === 'needs_persona') setCurrentStep('persona');
      else if (state === 'needs_business') setCurrentStep('business');
      else if (state === 'needs_phone' || state === 'needs_calendar') {
        // If we're past business, check if services/goals are set
        if (overview.agent_config.services_json && Array.isArray(overview.agent_config.services_json) && overview.agent_config.services_json.length > 0) {
          setCurrentStep('goals');
        } else {
          setCurrentStep('services');
        }
      }
    }
  }, [overview]);

  const [newGoal, setNewGoal] = useState('');
  const [newService, setNewService] = useState({ name: '', durationMin: 30 });

  const handleNext = async () => {
    try {
      // Save current step data
      const updates: any = {};
      
      if (currentStep === 'persona') {
        updates.persona_gender = formData.persona_gender;
        updates.persona_age_range = formData.persona_age_range;
        updates.setup_state = 'needs_business';
      } else if (currentStep === 'business') {
        updates.business_type = formData.business_type;
        updates.setup_state = 'needs_phone';
      } else if (currentStep === 'services') {
        updates.services_json = formData.services_json;
        updates.setup_state = 'needs_calendar';
      } else if (currentStep === 'goals') {
        updates.goals_json = formData.goals_json;
        updates.setup_state = 'needs_calendar';
      } else if (currentStep === 'confirm') {
        updates.setup_state = 'ready';
      }

      await updateConfig.mutateAsync(updates);

      // Move to next step
      if (currentStep === 'persona') {
        setCurrentStep('business');
      } else if (currentStep === 'business') {
        setCurrentStep('services');
      } else if (currentStep === 'services') {
        setCurrentStep('goals');
      } else if (currentStep === 'goals') {
        setCurrentStep('confirm');
      } else if (currentStep === 'confirm') {
        onComplete();
      }
    } catch (error) {
      console.error('[SetupWizard] Error saving step:', error);
      // Error is handled by mutation, but we can show a toast here if needed
    }
  };

  const handleBack = () => {
    if (currentStep === 'business') {
      setCurrentStep('persona');
    } else if (currentStep === 'services') {
      setCurrentStep('business');
    } else if (currentStep === 'goals') {
      setCurrentStep('services');
    } else if (currentStep === 'confirm') {
      setCurrentStep('goals');
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        goals_json: [...formData.goals_json, newGoal.trim()],
      });
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals_json: formData.goals_json.filter((_, i) => i !== index),
    });
  };

  const addService = () => {
    if (newService.name.trim()) {
      setFormData({
        ...formData,
        services_json: [...formData.services_json, { ...newService }],
      });
      setNewService({ name: '', durationMin: 30 });
    }
  };

  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services_json: formData.services_json.filter((_, i) => i !== index),
    });
  };

  const isLoading = updateConfig.isPending;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Agent Einrichtung</h2>
        <div className="flex gap-2 mb-4">
          {(['persona', 'business', 'services', 'goals', 'confirm'] as WizardStep[]).map((step, idx) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded ${
                idx <= (['persona', 'business', 'services', 'goals', 'confirm'] as WizardStep[]).indexOf(currentStep)
                  ? 'bg-accent'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Step 1: Persona */}
          {currentStep === 'persona' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Schritt 1: Persona</h3>
              <p className="text-gray-400 mb-6">Wähle Stimme & Auftreten. Du kannst das jederzeit ändern.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Geschlecht</label>
                  <select
                    value={formData.persona_gender}
                    onChange={(e) => setFormData({ ...formData, persona_gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    <option value="female">Weiblich</option>
                    <option value="male">Männlich</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Altersbereich</label>
                  <select
                    value={formData.persona_age_range}
                    onChange={(e) => setFormData({ ...formData, persona_age_range: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    <option value="18-25">18-25 Jahre</option>
                    <option value="25-35">25-35 Jahre</option>
                    <option value="35-45">35-45 Jahre</option>
                    <option value="45-55">45-55 Jahre</option>
                    <option value="55+">55+ Jahre</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business */}
          {currentStep === 'business' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Schritt 2: Business & Leistungen</h3>
              <p className="text-gray-400 mb-6">Damit dein Agent Termine korrekt bucht.</p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Business Typ</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="barber">Barbershop</option>
                  <option value="salon">Friseur</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="general">Allgemein</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {currentStep === 'services' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Schritt 3: Services</h3>
              <p className="text-gray-400 mb-6">Füge deine Leistungen hinzu.</p>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Service Name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="flex-1 px-4 py-2 bg-gray-700 rounded text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addService()}
                  />
                  <input
                    type="number"
                    placeholder="Dauer (Min)"
                    value={newService.durationMin}
                    onChange={(e) => setNewService({ ...newService, durationMin: parseInt(e.target.value) || 30 })}
                    className="w-24 px-4 py-2 bg-gray-700 rounded text-white"
                  />
                  <button
                    onClick={addService}
                    className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80"
                  >
                    Hinzufügen
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.services_json.map((service: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span>{service.name} ({service.durationMin} Min)</span>
                      <button
                        onClick={() => removeService(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {currentStep === 'goals' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Schritt 4: Ziele</h3>
              <p className="text-gray-400 mb-6">Definiere die Ziele deines Agents.</p>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ziel hinzufügen (z.B. 'Termine buchen')"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 rounded text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <button
                    onClick={addGoal}
                    className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80"
                  >
                    Hinzufügen
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.goals_json.map((goal: string, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span>{goal}</span>
                      <button
                        onClick={() => removeGoal(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {currentStep === 'confirm' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Schritt 5: Bestätigung</h3>
              <p className="text-gray-400 mb-6">Überprüfe deine Einstellungen und schließe die Einrichtung ab.</p>
              
              <div className="bg-gray-700 rounded p-4 space-y-2">
                <div><strong>Persona:</strong> {formData.persona_gender === 'female' ? 'Weiblich' : 'Männlich'}, {formData.persona_age_range} Jahre</div>
                <div><strong>Business Typ:</strong> {formData.business_type}</div>
                <div><strong>Services:</strong> {formData.services_json.length} Leistungen</div>
                <div><strong>Ziele:</strong> {formData.goals_json.length} Ziele</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 'persona' || isLoading}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80 disabled:opacity-50"
            >
              {currentStep === 'confirm' ? 'Abschließen' : 'Weiter'}
            </button>
          </div>
        </>
      )}

      {updateConfig.isError && (
        <div className="mt-4 p-3 bg-red-900/50 rounded text-red-300">
          Fehler beim Speichern: {updateConfig.error?.message || 'Unbekannter Fehler'}
        </div>
      )}
    </div>
  );
};

