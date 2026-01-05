import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Briefcase, MessageSquare } from 'lucide-react';
import { RevealSection } from './layout/RevealSection';

interface Integration {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  details: string;
  available: boolean;
}

const integrations: Integration[] = [
  {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Automatische Terminbuchung',
    details: 'Termine werden direkt in Ihren Google Kalender eingetragen – keine Doppelbuchungen, vollständige Synchronisation',
    available: true,
  },
  {
    name: 'Microsoft Outlook',
    icon: Mail,
    description: 'Outlook-Kalender-Integration',
    details: 'Nahtlose Verbindung zu Outlook 365 – Termine, Besprechungen und Erinnerungen automatisch synchronisiert',
    available: true,
  },
  {
    name: 'Calendly',
    icon: Calendar,
    description: 'Calendly-Integration',
    details: 'Direkte Verbindung zu Ihrer Calendly-Instanz – einheitliche Terminverwaltung über alle Kanäle',
    available: true,
  },
  {
    name: 'WhatsApp Business',
    icon: MessageSquare,
    description: 'Multichannel-Kommunikation',
    details: 'Gleicher Agent für Telefon & WhatsApp – einheitliche Wissensbasis, keine doppelte Pflege',
    available: true,
  },
  {
    name: 'CRM-Systeme',
    icon: Briefcase,
    description: 'HubSpot, Salesforce, Pipedrive',
    details: 'Automatische Lead-Übergabe an Ihr CRM – qualifizierte Leads landen direkt in Ihrem System',
    available: true,
  },
];

const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  const Icon = integration.icon;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-accent/50 hover:bg-white/10 transition-all backdrop-blur-sm hover:shadow-xl hover:shadow-accent/20"
    >
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform shadow-lg">
        <Icon size={36} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1 text-center">{integration.name}</h3>
      <p className="text-sm font-semibold text-accent mb-2 text-center">{integration.description}</p>
      <p className="text-xs text-gray-400 text-center leading-relaxed">{integration.details}</p>
      {integration.available && (
        <div className="mt-3 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span className="text-xs text-emerald-400 font-semibold">✓ Verfügbar</span>
        </div>
      )}
    </motion.div>
  );
};

export const Integrations: React.FC = () => {
  return (
    <RevealSection className="py-24 bg-black relative overflow-hidden section-spacing">
      {/* Background Gradient */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <RevealSection className="text-center mb-16" staggerDelay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            Nahtlose <span className="text-accent">Integrationen</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Verbinden Sie Ihren Voice Agent mit den Tools, die Sie bereits nutzen. Keine komplexe IT-Integration notwendig.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Weitere Integrationen auf Anfrage verfügbar
          </p>
        </div>
      </div>
    </RevealSection>
  );
};
