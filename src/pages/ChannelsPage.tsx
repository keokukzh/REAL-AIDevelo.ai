import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Card } from '../components/newDashboard/ui/Card.js';
import { Button } from '../components/newDashboard/ui/Button.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { useNavigation } from '../hooks/useNavigation.js';
import { apiClient } from '../services/apiClient.js';
import { toast } from '../components/ui/Toast.js';
import {
  Smartphone,
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  Save,
  Info,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { ROUTES } from '../config/navigation.js';
import { PhoneSetupWizard } from '../components/dashboard/PhoneSetupWizard.js';

interface ChannelsConfig {
  location_id: string;
  whatsapp_to: string | null;
  whatsapp_enabled: boolean;
  webchat_enabled: boolean;
  phone_enabled: boolean;
  phone_number: string | null;
}

interface WidgetKey {
  id: string;
  public_key: string;
  allowed_domains: string[];
  enabled: boolean;
  created_at: string;
}

export const ChannelsPage = () => {
  const nav = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ChannelsConfig | null>(null);
  const [widgetKeys, setWidgetKeys] = useState<WidgetKey[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  useEffect(() => {
    loadChannelsConfig();
  }, []);

  const loadChannelsConfig = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/channels/config');
      if (response.data.success) {
        setConfig(response.data.data.config);
        setWidgetKeys(response.data.data.widgetKeys || []);
        setWebhookUrl(response.data.data.webhookUrl || '');
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Kanäle-Konfiguration');
      console.error('Failed to load channels config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      const response = await apiClient.patch('/channels/config', {
        whatsapp_to: config.whatsapp_to,
        whatsapp_enabled: config.whatsapp_enabled,
        webchat_enabled: config.webchat_enabled,
        phone_enabled: config.phone_enabled,
        phone_number: config.phone_number,
      });

      if (response.data.success) {
        toast.success('Kanäle-Konfiguration gespeichert');
        setConfig(response.data.data);
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Konfiguration');
      console.error('Failed to save config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const createWidgetKey = async () => {
    try {
      const domains = newDomain.trim() ? [newDomain.trim()] : [];
      const response = await apiClient.post('/channels/widget-keys', {
        allowed_domains: domains,
      });

      if (response.data.success) {
        toast.success('Widget-Key erstellt');
        setNewDomain('');
        await loadChannelsConfig();
      }
    } catch (error) {
      toast.error('Fehler beim Erstellen des Widget-Keys');
      console.error('Failed to create widget key:', error);
    }
  };

  const deleteWidgetKey = async (id: string) => {
    if (!confirm('Möchten Sie diesen Widget-Key wirklich löschen?')) return;

    try {
      await apiClient.delete(`/channels/widget-keys/${id}`);
      toast.success('Widget-Key gelöscht');
      await loadChannelsConfig();
    } catch (error) {
      toast.error('Fehler beim Löschen des Widget-Keys');
      console.error('Failed to delete widget key:', error);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('In Zwischenablage kopiert');
  };

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        <PageHeader title="Kanäle" breadcrumbs={nav.getBreadcrumbs('/dashboard/channels')} />

        {/* WhatsApp Configuration */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Smartphone size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">WhatsApp</h2>
          </div>
          {config && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.whatsapp_enabled}
                    onChange={(e) => setConfig({ ...config, whatsapp_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <span>WhatsApp aktiviert</span>
                </label>
              </div>
              <div>
                <label htmlFor="whatsapp-to" className="block text-sm font-medium mb-2">
                  WhatsApp To-Nummer (z.B. whatsapp:+41791234567)
                </label>
                <input
                  id="whatsapp-to"
                  type="text"
                  value={config.whatsapp_to || ''}
                  onChange={(e) => setConfig({ ...config, whatsapp_to: e.target.value || null })}
                  placeholder="whatsapp:+41791234567"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-sm text-gray-400">
                  Die Nummer, die Twilio für eingehende WhatsApp-Nachrichten verwendet.
                </p>
              </div>
              {webhookUrl && (
                <div>
                  <label htmlFor="webhook-url" className="block text-sm font-medium mb-2">
                    Twilio Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="webhook-url"
                      type="text"
                      value={webhookUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <Button
                      onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                      variant="outline"
                    >
                      {copiedKey === 'webhook' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-400 flex items-start gap-2">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    Konfigurieren Sie diese URL in der Twilio Console unter WhatsApp → Inbound
                    Webhook.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Webchat Configuration */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Globe size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">Webchat</h2>
          </div>
          {config && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.webchat_enabled}
                    onChange={(e) => setConfig({ ...config, webchat_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <span>Webchat aktiviert</span>
                </label>
              </div>

              {/* Widget Keys */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Widget-Keys</h3>
                  <Button onClick={createWidgetKey} variant="primary" size="sm">
                    <Plus size={16} className="mr-2" />
                    Neuer Key
                  </Button>
                </div>

                {widgetKeys.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    Noch keine Widget-Keys erstellt. Erstellen Sie einen Key, um den Webchat auf
                    Ihrer Website einzubinden.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {widgetKeys.map((key) => (
                      <div
                        key={key.id}
                        className="p-4 bg-slate-900 border border-slate-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">
                                {key.public_key}
                              </code>
                              <Button
                                onClick={() => copyToClipboard(key.public_key, key.id)}
                                variant="outline"
                                size="sm"
                              >
                                {copiedKey === key.id ? <Check size={14} /> : <Copy size={14} />}
                              </Button>
                            </div>
                            <div className="text-sm text-gray-400">
                              <p>
                                Erlaubte Domains:{' '}
                                {key.allowed_domains.length > 0
                                  ? key.allowed_domains.join(', ')
                                  : 'Alle (leer = keine Einschränkung)'}
                              </p>
                              <p>Status: {key.enabled ? 'Aktiv' : 'Deaktiviert'}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteWidgetKey(key.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Telefon / Voice Agent Configuration */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Phone size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">Telefon / Voice Agent</h2>
            {config?.phone_enabled && config?.phone_number && (
              <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Aktiviert
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Verbindungs-Status
                </h4>
                {config?.phone_number ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/20 rounded-lg">
                        <Phone size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Aktive Nummer</p>
                        <p className="font-mono text-lg text-white">{config.phone_number}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsPhoneModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-10 border-slate-700 hover:border-slate-500"
                    >
                      Verbindung verwalten
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle className="text-yellow-400 mt-0.5" size={18} />
                      <p className="text-sm text-yellow-200/80 leading-relaxed">
                        Es ist noch keine Telefonverbindung eingerichtet. Dein Voice Agent ist
                        aktuell nicht erreichbar.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsPhoneModalOpen(true)}
                      variant="primary"
                      className="w-full h-12 shadow-lg shadow-primary/20"
                    >
                      <Plus size={18} className="mr-2" />
                      Jetzt einrichten
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:border-l md:border-slate-700/50 md:pl-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Einstellungen
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={config?.phone_enabled || false}
                      onChange={(e) =>
                        config && setConfig({ ...config, phone_enabled: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="block text-sm font-medium text-white">Anrufe annehmen</span>
                      <span className="block text-xs text-gray-400">
                        Voice Agent reagiert auf eingehende Anrufe
                      </span>
                    </div>
                  </label>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <div className="flex gap-3">
                      <Info size={16} className="text-blue-400 mt-0.5" />
                      <p className="text-xs text-blue-200/60 leading-relaxed">
                        Stelle sicher, dass dein Agent-Profil vollständig eingerichtet ist, bevor du
                        den Voice Agent aktivierst.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Testen Bereich */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-medium mb-3">Agent testen</h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-3">
                Teste deinen Voice Agent direkt im Browser mit Mikrofon und Lautsprecher
              </p>
              <Button
                onClick={() => {
                  nav.goTo(ROUTES.TEST_CALL);
                }}
                variant="primary"
                disabled={!config?.phone_enabled}
              >
                <Phone size={16} className="mr-2" />
                Agent jetzt testen
              </Button>
            </div>
          </div>
        </Card>

        {/* PhoneSetupWizard */}
        <PhoneSetupWizard
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          onSuccess={() => {
            loadChannelsConfig();
            setIsPhoneModalOpen(false);
          }}
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveConfig} disabled={isSaving} variant="primary">
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Speichern...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
