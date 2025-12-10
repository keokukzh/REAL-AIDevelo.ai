import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building, FileText, Target, Clock, Settings, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { industries } from '../../data/industries';

interface Agent {
  id: string;
  businessProfile: {
    companyName: string;
    industry: string;
    website?: string;
    location: {
      country: string;
      city: string;
    };
    contact: {
      phone: string;
      email: string;
    };
    openingHours?: Record<string, string>;
  };
  config: {
    primaryLocale: string;
    fallbackLocales: string[];
    recordingConsent?: boolean;
    systemPrompt?: string;
    elevenLabs: {
      voiceId: string;
      modelId: string;
    };
  };
}

interface ConfigurationTabProps {
  agent: Agent;
  onSave: (updates: Partial<Agent>) => Promise<void>;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({ agent, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: agent.businessProfile.companyName,
    industry: agent.businessProfile.industry,
    city: agent.businessProfile.location.city,
    email: agent.businessProfile.contact.email,
    phone: agent.businessProfile.contact.phone,
    website: agent.businessProfile.website || '',
    systemPrompt: agent.config.systemPrompt || '',
    recordingConsent: agent.config.recordingConsent || false,
    openingHours: agent.businessProfile.openingHours || {},
  });
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        businessProfile: {
          ...agent.businessProfile,
          companyName: formData.companyName,
          industry: formData.industry,
          location: {
            ...agent.businessProfile.location,
            city: formData.city,
          },
          contact: {
            email: formData.email,
            phone: formData.phone,
          },
          website: formData.website || undefined,
          openingHours: formData.openingHours,
        },
        config: {
          ...agent.config,
          systemPrompt: formData.systemPrompt,
          recordingConsent: formData.recordingConsent,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Building size={20} />
          Firmenprofil
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Firmenname *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stadt</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branche</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              >
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">E-Mail *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </motion.div>

      {/* System Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText size={20} />
          System Prompt
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt bearbeiten</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={10}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none font-mono text-sm"
              placeholder="System Prompt für den Agent..."
            />
          </div>
          <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-2">Vorschau:</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{formData.systemPrompt || 'Kein Prompt definiert'}</p>
          </div>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target size={20} />
          Agent-Ziele
        </h2>
        <div className="space-y-3">
          {['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs', 'Bestellannahme'].map((goal) => (
            <label key={goal} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={goals.includes(goal)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setGoals([...goals, goal]);
                  } else {
                    setGoals(goals.filter(g => g !== goal));
                  }
                }}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
              />
              <span>{goal}</span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Opening Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock size={20} />
          Öffnungszeiten
        </h2>
        <div className="space-y-3">
          {['24/7', 'Nur ausserhalb der Öffnungszeiten'].map((option) => (
            <label key={option} className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="radio"
                name="openingHours"
                value={option}
                checked={Object.keys(formData.openingHours).length === 0 ? option === '24/7' : option === 'Nur ausserhalb der Öffnungszeiten'}
                onChange={() => {
                  setFormData({
                    ...formData,
                    openingHours: option === '24/7' ? {} : { 'Mon-Fri': '08:00-18:00' },
                  });
                }}
                className="w-5 h-5 border-white/20 bg-white/5 text-accent focus:ring-accent"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Recording Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings size={20} />
          Aufzeichnungseinstellungen
        </h2>
        <label className="flex items-start gap-3 p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={formData.recordingConsent}
            onChange={(e) => setFormData({ ...formData, recordingConsent: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
          />
          <div>
            <span className="font-semibold block mb-1">Anrufe aufzeichnen</span>
            <p className="text-sm text-gray-400">
              Anrufe können für Qualitätssicherung und Training aufgezeichnet werden. 
              Die Aufzeichnungen werden maximal 90 Tage gespeichert.
            </p>
          </div>
        </label>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save size={18} />
          {saving ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  );
};


