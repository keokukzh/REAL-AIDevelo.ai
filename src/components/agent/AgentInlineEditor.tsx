import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Save, X, Building, Globe, Phone, Mail, Clock, Target } from 'lucide-react';
import { apiRequest, ApiRequestError } from '../../services/api';
import { industries } from '../../data/industries';

interface Agent {
  id: string;
  businessProfile: {
    companyName: string;
    industry?: string;
    location: {
      country: string;
      city: string;
    };
    contact: {
      email: string;
      phone?: string;
    };
    openingHours?: Record<string, string>;
    website?: string;
  };
  config: {
    primaryLocale: string;
    fallbackLocales?: string[];
    systemPrompt?: string;
    recordingConsent?: boolean;
  };
  goals?: string[];
}

interface AgentInlineEditorProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAgent: Agent) => void;
}

export const AgentInlineEditor: React.FC<AgentInlineEditorProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Agent>(agent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(agent);
      setError(null);
    }
  }, [isOpen, agent]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      }
      if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev as any)[keys[0]],
            [keys[1]]: value,
          },
        };
      }
      if (keys.length === 3) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev as any)[keys[0]],
            [keys[1]]: {
              ...(prev as any)[keys[0]][keys[1]],
              [keys[2]]: value,
            },
          },
        };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = {
        businessProfile: {
          companyName: formData.businessProfile.companyName,
          industry: formData.businessProfile.industry,
          location: formData.businessProfile.location,
          contact: formData.businessProfile.contact,
          ...(formData.businessProfile.openingHours && {
            openingHours: formData.businessProfile.openingHours,
          }),
          ...(formData.businessProfile.website && {
            website: formData.businessProfile.website,
          }),
        },
        config: {
          primaryLocale: formData.config.primaryLocale,
          fallbackLocales: formData.config.fallbackLocales,
          ...(formData.config.systemPrompt && {
            systemPrompt: formData.config.systemPrompt,
          }),
          recordingConsent: formData.config.recordingConsent,
        },
        ...(formData.goals && { goals: formData.goals }),
      };

      const response = await apiRequest<{ data: Agent }>(`/agents/${agent.id}`, {
        method: 'PATCH',
        data: updates,
      });

      onSave(response.data);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof ApiRequestError
        ? err.message
        : 'Fehler beim Speichern der Änderungen.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const availableGoals = [
    'Terminbuchung & Kalender',
    'Lead-Qualifizierung',
    'Support & FAQs',
    'Bestellannahme',
  ];

  const locales = [
    { value: 'de-CH', label: 'Deutsch (CH)' },
    { value: 'fr-CH', label: 'Français (CH)' },
    { value: 'it-CH', label: 'Italiano (CH)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Agent bearbeiten"
      position="right"
      size="lg"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Business Profile */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building size={20} />
            Firmenprofil
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Firmenname *</label>
              <input
                type="text"
                value={formData.businessProfile.companyName}
                onChange={(e) => handleChange('businessProfile.companyName', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Branche</label>
                <select
                  value={formData.businessProfile.industry || ''}
                  onChange={(e) => handleChange('businessProfile.industry', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
                >
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.businessProfile.location.city}
                  onChange={(e) => handleChange('businessProfile.location.city', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">E-Mail *</label>
              <input
                type="email"
                value={formData.businessProfile.contact.email}
                onChange={(e) => handleChange('businessProfile.contact.email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.businessProfile.contact.phone || ''}
                onChange={(e) => handleChange('businessProfile.contact.phone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
                placeholder="+41 44 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Website</label>
              <input
                type="url"
                value={formData.businessProfile.website || ''}
                onChange={(e) => handleChange('businessProfile.website', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe size={20} />
            Konfiguration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Primäre Sprache</label>
              <select
                value={formData.config.primaryLocale}
                onChange={(e) => handleChange('config.primaryLocale', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              >
                {locales.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Agent-Ziele</label>
              <div className="space-y-2">
                {availableGoals.map((goal) => (
                  <label
                    key={goal}
                    className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.goals || []).includes(goal)}
                      onChange={(e) => {
                        const currentGoals = formData.goals || [];
                        const newGoals = e.target.checked
                          ? [...currentGoals, goal]
                          : currentGoals.filter((g) => g !== goal);
                        setFormData((prev) => ({ ...prev, goals: newGoals }));
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-2"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="recordingConsent"
                checked={formData.config.recordingConsent || false}
                onChange={(e) => handleChange('config.recordingConsent', e.target.checked)}
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

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            <X size={16} className="mr-2" />
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
            disabled={saving}
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

