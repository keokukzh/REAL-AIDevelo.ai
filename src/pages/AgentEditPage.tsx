import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  CheckCircle,
  Circle,
  FileText,
  Globe,
  Mic,
  Phone,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { apiRequest, ApiRequestError } from '../services/api';
import { Button } from '../components/ui/Button';
import { industries } from '../data/industries';
import { RAGManagementTab } from '../components/agent/RAGManagementTab';

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
  telephony?: {
    phoneNumber?: string;
    phoneNumberId?: string;
    providerSid?: string;
    status: 'unassigned' | 'assigned' | 'active' | 'inactive';
    capabilities?: {
      voice: boolean;
      sms?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  status: 'available' | 'assigned' | 'active' | 'inactive';
  capabilities: {
    voice: boolean;
    sms?: boolean;
  };
}

type TabId = 'business' | 'voice' | 'knowledge' | 'phone';

const localeOptions = [
  { value: 'de-CH', label: 'Deutsch (CH)' },
  { value: 'de-DE', label: 'Deutsch (DE)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-CH', label: 'Français (CH)' },
];

export const AgentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragCount, setRagCount] = useState(0);

  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    industry: industries[0]?.value || 'general',
    city: '',
    email: '',
    phone: '',
    website: '',
  });

  const [voiceForm, setVoiceForm] = useState({
    primaryLocale: 'de-CH',
    voiceId: '',
    modelId: 'eleven_turbo_v2_5',
    systemPrompt: '',
    recordingConsent: false,
  });

  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [assigningNumber, setAssigningNumber] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [numberCountry, setNumberCountry] = useState('CH');
  const [planId, setPlanId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchAgent();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'knowledge') {
      fetchRagCount();
    }
    if (activeTab === 'phone') {
      fetchNumbers();
    }
  }, [activeTab, id, numberCountry, planId]);

  useEffect(() => {
    if (!agent) return;
    setBusinessForm({
      companyName: agent.businessProfile.companyName,
      industry: agent.businessProfile.industry,
      city: agent.businessProfile.location.city,
      email: agent.businessProfile.contact.email,
      phone: agent.businessProfile.contact.phone,
      website: agent.businessProfile.website || '',
    });
    setVoiceForm({
      primaryLocale: agent.config.primaryLocale,
      voiceId: agent.config.elevenLabs.voiceId,
      modelId: agent.config.elevenLabs.modelId,
      systemPrompt: agent.config.systemPrompt || '',
      recordingConsent: agent.config.recordingConsent || false,
    });
  }, [agent]);

  const fetchAgent = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: Agent }>(`/agents/${id}`);
      setAgent(res.data);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Agent konnte nicht geladen werden.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRagCount = async () => {
    if (!id) return;
    try {
      const res = await apiRequest<{ data: Array<{ id: string }> }>(`/agents/${id}/rag/documents`);
      setRagCount(res.data.length);
    } catch (err) {
      setRagCount(0);
    }
  };

  const fetchNumbers = async () => {
    setNumbersLoading(true);
    setNumberError(null);
    try {
      const params = new URLSearchParams();
      params.set('country', numberCountry);
      if (planId) params.set('planId', planId);
      const res = await apiRequest<{ data: PhoneNumber[] }>(`/telephony/numbers?${params.toString()}`);
      setAvailableNumbers(res.data);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Telefonnummern konnten nicht geladen werden.';
      setNumberError(msg);
      setAvailableNumbers([]);
    } finally {
      setNumbersLoading(false);
    }
  };

  const saveAgent = async (updates: Partial<Agent>) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await fetchAgent();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Änderungen konnten nicht gespeichert werden.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSave = () => {
    if (!agent) return;
    return saveAgent({
      businessProfile: {
        ...agent.businessProfile,
        companyName: businessForm.companyName,
        industry: businessForm.industry,
        location: {
          ...agent.businessProfile.location,
          city: businessForm.city,
        },
        contact: {
          email: businessForm.email,
          phone: businessForm.phone,
        },
        website: businessForm.website || undefined,
      },
    });
  };

  const handleVoiceSave = () => {
    if (!agent) return;
    return saveAgent({
      config: {
        ...agent.config,
        primaryLocale: voiceForm.primaryLocale,
        systemPrompt: voiceForm.systemPrompt,
        recordingConsent: voiceForm.recordingConsent,
        elevenLabs: {
          voiceId: voiceForm.voiceId,
          modelId: voiceForm.modelId,
        },
      },
    });
  };

  const handleAssignNumber = async (phoneNumberId: string) => {
    if (!id) return;
    setAssigningNumber(phoneNumberId);
    setNumberError(null);
    try {
      await apiRequest(`/telephony/assign`, {
        method: 'POST',
        body: JSON.stringify({ agentId: id, phoneNumberId }),
      });
      await Promise.all([fetchAgent(), fetchNumbers()]);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Telefonnummer konnte nicht zugewiesen werden.';
      setNumberError(msg);
    } finally {
      setAssigningNumber(null);
    }
  };

  const checklistItems = useMemo(
    () => {
      const email = agent?.businessProfile.contact.email?.trim() || '';
      const company = agent?.businessProfile.companyName?.trim() || '';
      const prompt = agent?.config?.systemPrompt?.trim() || '';

      const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const hasMeaningfulPrompt = prompt.length >= 30;

      return [
        {
          id: 'profile',
          label: 'Gültiges Firmenprofil (Name + E-Mail)',
          done: company.length >= 3 && hasValidEmail,
        },
        {
          id: 'voice',
          label: 'Voice & Prompt konfiguriert',
          done: Boolean(agent?.config?.elevenLabs?.voiceId && agent?.config?.primaryLocale && hasMeaningfulPrompt),
        },
        {
          id: 'knowledge',
          label: 'Wissensbasis mit Dokumenten',
          done: ragCount > 0,
        },
        {
          id: 'phone',
          label: 'Telefonnummer zugewiesen',
          done: Boolean(agent?.telephony?.phoneNumber),
        },
      ];
    },
    [agent, ragCount]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-gray-300">
        <p className="mb-4">Agent nicht gefunden.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Zurück zum Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <p className="text-sm text-gray-400">Agent bearbeiten</p>
            <h1 className="text-xl font-bold font-display">{agent.businessProfile.companyName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchAgent} disabled={saving}>
            Neu laden
          </Button>
          <Button variant="primary" onClick={() => handleBusinessSave()} disabled={saving}>
            <Save size={16} className="mr-2" />
            Speichern
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6 md:p-10 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          <div>
            <TabNav activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6">
              {activeTab === 'business' && (
                <BusinessTab
                  form={businessForm}
                  onChange={setBusinessForm}
                  onSave={handleBusinessSave}
                  saving={saving}
                />
              )}

              {activeTab === 'voice' && (
                <VoiceTab
                  form={voiceForm}
                  onChange={setVoiceForm}
                  onSave={handleVoiceSave}
                  saving={saving}
                />
              )}

              {activeTab === 'knowledge' && id && (
                <div className="bg-surface rounded-2xl border border-white/10 p-4">
                  <RAGManagementTab agentId={id} />
                </div>
              )}

              {activeTab === 'phone' && (
                <PhoneTab
                  agent={agent}
                  numbers={availableNumbers}
                  numbersLoading={numbersLoading}
                  assigningNumber={assigningNumber}
                  numberCountry={numberCountry}
                  planId={planId}
                  onCountryChange={setNumberCountry}
                  onPlanChange={setPlanId}
                  onRefresh={fetchNumbers}
                  onAssign={handleAssignNumber}
                  error={numberError}
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <ActivationChecklist items={checklistItems} />
            <QuickMetaCard agent={agent} ragCount={ragCount} />
          </div>
        </div>
      </main>
    </div>
  );
};

const TabNav: React.FC<{
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}> = ({ activeTab, onChange }) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'business', label: 'Business Info', icon: <Building size={16} /> },
    { id: 'voice', label: 'Voice Config', icon: <Mic size={16} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileText size={16} /> },
    { id: 'phone', label: 'Phone Number', icon: <Phone size={16} /> },
  ];

  return (
    <div className="border-b border-white/10 flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'border-accent text-accent'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const ActivationChecklist: React.FC<{ items: Array<{ id: string; label: string; done: boolean }> }> = ({ items }) => {
  const completed = items.filter((i) => i.done).length;
  const percent = Math.round((completed / items.length) * 100);

  return (
    <div className="bg-surface rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Aktivierungs-Checkliste</p>
          <h3 className="text-xl font-bold">{completed} / {items.length} abgeschlossen</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Fortschritt</p>
          <p className="text-2xl font-bold text-accent">{percent}%</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            {item.done ? (
              <CheckCircle size={18} className="text-green-400" />
            ) : (
              <Circle size={18} className="text-gray-500" />
            )}
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickMetaCard: React.FC<{ agent: Agent; ragCount: number }> = ({ agent, ragCount }) => {
  return (
    <div className="bg-surface rounded-2xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles size={18} className="text-accent" />
        <div>
          <p className="text-sm text-gray-400">Status</p>
          <p className="font-semibold capitalize">{agent.telephony?.status || 'unassigned'}</p>
        </div>
      </div>
      <div className="text-sm text-gray-400 space-y-2">
        <div className="flex items-center gap-2">
          <Building size={16} />
          <span>{agent.businessProfile.industry}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={16} />
          <span>{agent.config.primaryLocale}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={16} />
          <span>{ragCount} Wissensdokument(e)</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={16} />
          <span>{agent.telephony?.phoneNumber || 'Keine Nummer'}</span>
        </div>
      </div>
    </div>
  );
};

const BusinessTab: React.FC<{
  form: {
    companyName: string;
    industry: string;
    city: string;
    email: string;
    phone: string;
    website: string;
  };
  onChange: React.Dispatch<React.SetStateAction<{
    companyName: string;
    industry: string;
    city: string;
    email: string;
    phone: string;
    website: string;
  }>>;
  onSave: () => Promise<void> | void;
  saving: boolean;
}> = ({ form, onChange, onSave, saving }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl border border-white/10 p-6 space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold mb-2">Business Info</h2>
        <p className="text-sm text-gray-400">Grunddaten für Begrüßung und Routing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Firmenname *</label>
          <input
            value={form.companyName}
            onChange={(e) => onChange((prev) => ({ ...prev, companyName: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Branche</label>
          <select
            value={form.industry}
            onChange={(e) => onChange((prev) => ({ ...prev, industry: e.target.value }))}
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
            value={form.city}
            onChange={(e) => onChange((prev) => ({ ...prev, city: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Website</label>
          <input
            value={form.website}
            onChange={(e) => onChange((prev) => ({ ...prev, website: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">E-Mail *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Telefon</label>
          <input
            value={form.phone}
            onChange={(e) => onChange((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
            placeholder="+41 44 123 45 67"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onSave} disabled={saving} className="flex items-center gap-2">
          <Save size={16} />
          {saving ? 'Speichert...' : 'Änderungen speichern'}
        </Button>
      </div>
    </motion.div>
  );
};

const VoiceTab: React.FC<{
  form: {
    primaryLocale: string;
    voiceId: string;
    modelId: string;
    systemPrompt: string;
    recordingConsent: boolean;
  };
  onChange: React.Dispatch<React.SetStateAction<{
    primaryLocale: string;
    voiceId: string;
    modelId: string;
    systemPrompt: string;
    recordingConsent: boolean;
  }>>;
  onSave: () => Promise<void> | void;
  saving: boolean;
}> = ({ form, onChange, onSave, saving }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl border border-white/10 p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Mic size={18} />
        <div>
          <h2 className="text-xl font-bold">Voice Config</h2>
          <p className="text-sm text-gray-400">Stimme, Modell und System Prompt.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Sprache</label>
          <select
            value={form.primaryLocale}
            onChange={(e) => onChange((prev) => ({ ...prev, primaryLocale: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            {localeOptions.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Voice ID</label>
          <input
            value={form.voiceId}
            onChange={(e) => onChange((prev) => ({ ...prev, voiceId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none font-mono"
            placeholder="pNInz6obpgDQGcFmaJgB"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Modell</label>
          <input
            value={form.modelId}
            onChange={(e) => onChange((prev) => ({ ...prev, modelId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.recordingConsent}
            onChange={(e) => onChange((prev) => ({ ...prev, recordingConsent: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
          />
          <div>
            <p className="font-semibold">Aufzeichnung aktivieren</p>
            <p className="text-sm text-gray-400">Optional für Qualitätssicherung und Training.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">System Prompt</label>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => onChange((prev) => ({ ...prev, systemPrompt: e.target.value }))}
          rows={8}
          className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none font-mono text-sm"
          placeholder="Beschreibe Tonalität, Aufgaben und Grenzen..."
        />
        <div className="bg-black/20 border border-white/5 rounded-lg p-4 text-sm text-gray-400 mt-2 flex items-start gap-2">
          <Wand2 size={16} className="mt-0.5" />
          <span>Halte Antworten prägnant und nenne dem Anrufer die nächsten Schritte klar.</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onSave} disabled={saving} className="flex items-center gap-2">
          <Save size={16} />
          {saving ? 'Speichert...' : 'Voice speichern'}
        </Button>
      </div>
    </motion.div>
  );
};

const PhoneTab: React.FC<{
  agent: Agent;
  numbers: PhoneNumber[];
  numbersLoading: boolean;
  assigningNumber: string | null;
  numberCountry: string;
  planId?: string;
  onCountryChange: (country: string) => void;
  onPlanChange: (plan?: string) => void;
  onRefresh: () => void;
  onAssign: (id: string) => void;
  error: string | null;
}> = ({
  agent,
  numbers,
  numbersLoading,
  assigningNumber,
  numberCountry,
  planId,
  onCountryChange,
  onPlanChange,
  onRefresh,
  onAssign,
  error,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl border border-white/10 p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Phone size={18} />
            Telefonnummer
          </h2>
          <p className="text-sm text-gray-400">Weise dem Agent eine Nummer zu.</p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={numbersLoading}>
          Neu laden
        </Button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Aktuelle Nummer</p>
        <p className="text-lg font-semibold">{agent.telephony?.phoneNumber || 'Keine Nummer zugewiesen'}</p>
        {agent.telephony?.providerSid && (
          <p className="text-xs text-gray-500">Provider SID: {agent.telephony.providerSid}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Land</label>
          <select
            value={numberCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="CH">Schweiz</option>
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Plan</label>
          <select
            value={planId || ''}
            onChange={(e) => onPlanChange(e.target.value || undefined)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="">Alle</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button variant="primary" onClick={onRefresh} disabled={numbersLoading} className="w-full">
            Nummern laden
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {numbersLoading ? (
          <div className="text-gray-400">Lade verfügbare Nummern...</div>
        ) : numbers.length === 0 ? (
          <div className="text-gray-400">Keine Nummern verfügbar.</div>
        ) : (
          numbers.map((num) => (
            <div
              key={num.id}
              className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5"
            >
              <div>
                <p className="text-lg font-semibold">{num.number}</p>
                <p className="text-xs text-gray-400">{num.country} · Voice {num.capabilities.voice ? '✓' : '✕'} · SMS {num.capabilities.sms ? '✓' : '✕'}</p>
              </div>
              <Button
                variant="primary"
                onClick={() => onAssign(num.id)}
                disabled={assigningNumber === num.id}
              >
                {assigningNumber === num.id ? 'Wird zugewiesen...' : 'Zuweisen'}
              </Button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AgentEditPage;
