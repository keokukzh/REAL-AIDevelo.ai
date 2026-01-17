import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Zap,
  Loader2,
  Copy,
} from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { apiClient } from '../../services/apiClient.js';
import { toast } from '../ui/Toast.js';
import { extractErrorMessage } from '../../lib/errorUtils.js';

interface PhoneSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'choose-method' | 'forwarding-setup' | 'purchase-setup' | 'verification' | 'success';

interface AvailableNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  l10n?: any;
}

export const PhoneSetupWizard: React.FC<PhoneSetupWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('choose-method');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forwarding state
  const [personalNumber, setPersonalNumber] = useState('');
  const [systemForwardingNumber, setSystemForwardingNumber] = useState('');
  const [forwardingInstructions, setForwardingInstructions] = useState<
    { provider: string; code: string }[]
  >([]);

  // Purchase state
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('CH');
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('choose-method');
      setError(null);
    }
  }, [isOpen]);

  const fetchForwardingInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/phone/forwarding-number');
      if (resp.data.success) {
        setSystemForwardingNumber(resp.data.data.forwardingNumber);
        setForwardingInstructions(resp.data.data.instructions);
        setStep('forwarding-setup');
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Forwarding-Info konnte nicht geladen werden');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableNumbers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get(`/phone/available-to-buy?country=${selectedCountry}`);
      if (resp.data.success) {
        setAvailableNumbers(resp.data.data);
        setStep('purchase-setup');
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Verfügbare Nummern konnten nicht geladen werden');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPersonal = async () => {
    if (!personalNumber) {
      toast.error('Bitte gib deine Telefonnummer ein');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post('/phone/register-personal', {
        userPhoneNumber: personalNumber,
      });
      if (resp.data.success) {
        setStep('verification');
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Registrierung fehlgeschlagen');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedNumber) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post('/phone/purchase', {
        phoneNumber: selectedNumber.phoneNumber,
        country: selectedCountry,
      });
      if (resp.data.success) {
        setStep('success');
        onSuccess?.();
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Kauf fehlgeschlagen');
      setError(msg);
      toast.error('Kauf fehlgeschlagen: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post('/phone/test-personal');
      if (resp.data.success) {
        toast.success('Test-Anruf initiiert. Dein Agent ruft dich gleich an.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Diesen Vorgang konnte nicht ausgeführt werden';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = () => {
    setStep('success');
    onSuccess?.();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert!');
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">Wähle eine Verbindungsmethode</h3>
        <p className="text-gray-400">Wie möchtest du deinen Voice Agent erreichbar machen?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={fetchForwardingInfo}
          className="flex flex-col items-start p-6 bg-slate-800/50 border border-white/10 rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all group text-left"
        >
          <div className="p-3 bg-blue-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-400" size={24} />
          </div>
          <h4 className="text-lg font-bold mb-2">Rufweiterleitung</h4>
          <p className="text-sm text-gray-400 mb-4">
            Verwende deine bestehende Nummer. Ideal zum Starten.
          </p>
          <div className="flex items-center text-blue-400 text-sm font-medium">
            Kostenlos einrichten <ChevronRight size={16} className="ml-1" />
          </div>
        </button>

        <button
          onClick={fetchAvailableNumbers}
          className="flex flex-col items-start p-6 bg-slate-800/50 border border-white/10 rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all group text-left"
        >
          <div className="p-3 bg-accent/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <Globe className="text-accent" size={24} />
          </div>
          <h4 className="text-lg font-bold mb-2">Neue Nummer kaufen</h4>
          <p className="text-sm text-gray-400 mb-4">
            Hole dir eine dedizierte Business-Nummer (CH, DE, AT, etc.).
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            Ab CHF 2.00/Monat <ChevronRight size={16} className="ml-1" />
          </div>
        </button>
      </div>
    </div>
  );

  const renderForwardingSetup = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('choose-method')} className="mr-2">
          <ArrowLeft size={18} />
        </Button>
        <h3 className="text-xl font-semibold">Eigene Nummer verbinden</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Deine Telefonnummer
          </label>
          <input
            type="tel"
            placeholder="+41 79 000 00 00"
            value={personalNumber}
            onChange={(e) => setPersonalNumber(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-blue-400" size={18} />
            <h4 className="text-sm font-bold text-blue-300">So funktioniert es:</h4>
          </div>
          <p className="text-xs text-blue-200/70 leading-relaxed">
            Deine Kunden rufen weiterhin deine normale Nummer an. Du richtest eine "bedingte
            Rufweiterleitung" ein, damit unser Voice Agent den Anruf übernimmt, wenn du nicht
            erreichst bist.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Deine persönliche Bridge-Nummer</h4>
          <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
            <span className="font-mono text-lg">{systemForwardingNumber}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(systemForwardingNumber)}
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>

        <Button
          fullWidth
          onClick={handleRegisterPersonal}
          disabled={loading || !personalNumber}
          className="h-12"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Nummer registrieren & Weiter'}
        </Button>
      </div>
    </div>
  );

  const renderPurchaseSetup = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('choose-method')} className="mr-2">
          <ArrowLeft size={18} />
        </Button>
        <h3 className="text-xl font-semibold">Neue Nummer wählen</h3>
      </div>

      <div className="flex gap-2">
        {['CH', 'DE', 'AT', 'US'].map((country) => (
          <button
            key={country}
            onClick={() => {
              setSelectedCountry(country);
              fetchAvailableNumbers();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCountry === country ? 'bg-accent text-black' : 'bg-slate-800 text-gray-400'
            }`}
          >
            {country === 'CH'
              ? 'Schweiz'
              : country === 'DE'
                ? 'Deutschland'
                : country === 'AT'
                  ? 'Österreich'
                  : 'USA'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Loader2 className="animate-spin mb-2" />
            <p>Suche Nummern in {selectedCountry}...</p>
          </div>
        ) : (
          availableNumbers.map((num) => (
            <button
              key={num.sid}
              onClick={() => setSelectedNumber(num)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedNumber?.sid === num.sid
                  ? 'bg-accent/10 border-accent'
                  : 'bg-slate-800/40 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <Phone
                  size={18}
                  className={selectedNumber?.sid === num.sid ? 'text-accent' : 'text-gray-500'}
                />
                <span className="font-mono text-lg">{num.friendlyName}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  CHF {selectedCountry === 'CH' ? '2.00' : '1.00'}
                </div>
                <div className="text-[10px] text-gray-500">pro Monat</div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="bg-slate-800/80 rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Einmalige Kosten</span>
          <span className="text-white">CHF 0.00</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-white">Monatlich</span>
          <span className="text-accent">CHF {selectedCountry === 'CH' ? '2.00' : '1.00'}</span>
        </div>
      </div>

      <Button
        fullWidth
        disabled={loading || !selectedNumber}
        onClick={handlePurchase}
        className="h-12"
      >
        {loading ? <Loader2 className="animate-spin" /> : 'Jetzt kaufen & aktivieren'}
      </Button>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex p-4 bg-accent/20 rounded-full mb-4">
          <ShieldCheck className="text-accent" size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Fast geschafft!</h3>
        <p className="text-gray-400">Richte nun die Weiterleitung auf deinem Handy ein.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
          <h4 className="font-bold mb-4">Anleitung für {personalNumber}</h4>
          <div className="space-y-3">
            {forwardingInstructions.map((inst, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">{inst.provider}</div>
                  <div className="font-mono font-bold text-blue-400">{inst.code}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(inst.code)}>
                  <Copy size={14} className="mr-1" /> Kopieren
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 leading-relaxed">
            Tippe den Code oben einfach in deine Telefon-App ein und drücke "Anrufen". Du erhältst
            eine Bestätigung von deinem Provider.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleTestCall} disabled={loading}>
            Test-Anruf machen
          </Button>
          <Button className="flex-1" onClick={handleVerified}>
            Ich habe es eingerichtet
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8 space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex p-6 bg-green-500/20 rounded-full text-green-400"
      >
        <CheckCircle2 size={64} />
      </motion.div>
      <div>
        <h3 className="text-3xl font-bold mb-2">Erfolgreich!</h3>
        <p className="text-gray-400">
          Deine Telefonverbindung ist nun aktiv. Dein Voice Agent ist bereit für Anrufe.
        </p>
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onClose}>
        Zum Dashboard
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={step === 'choose-method' ? 'lg' : 'md'}
      title={step === 'success' ? '' : 'Telefon-Assistent'}
    >
      <div className="py-2">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <span className="flex-1">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
            >
              <span className="sr-only">Schließen</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'choose-method' && renderChooseMethod()}
            {step === 'forwarding-setup' && renderForwardingSetup()}
            {step === 'purchase-setup' && renderPurchaseSetup()}
            {step === 'verification' && renderVerification()}
            {step === 'success' && renderSuccess()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
};
