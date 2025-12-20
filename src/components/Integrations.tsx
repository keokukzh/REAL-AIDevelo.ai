import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Briefcase, MessageSquare } from 'lucide-react';
import { RevealSection } from './layout/RevealSection';

interface Integration {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const integrations: Integration[] = [
  {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Nahtlose Integration mit Google Calendar',
  },
  {
    name: 'Microsoft Outlook',
    icon: Mail,
    description: 'Vollständige Outlook-Kalender-Unterstützung',
  },
  {
    name: 'Calendly',
    icon: Calendar,
    description: 'Direkte Verbindung zu Calendly',
  },
  {
    name: 'WhatsApp',
    icon: MessageSquare,
    description: 'WhatsApp Business Integration – gleicher Agent wie Telefon',
  },
  {
    name: 'CRM-Systeme',
    icon: Briefcase,
    description: 'HubSpot, Salesforce, Pipedrive & mehr',
  },
];

const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  const Icon = integration.icon;
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all backdrop-blur-sm hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 text-center">{integration.name}</h3>
      <p className="text-sm text-gray-400 text-center">{integration.description}</p>
    </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
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
