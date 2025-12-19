import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Briefcase } from 'lucide-react';

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
    name: 'CRM-Systeme',
    icon: Briefcase,
    description: 'HubSpot, Salesforce, Pipedrive & mehr',
  },
];

const IntegrationCard: React.FC<{ integration: Integration; index: number }> = ({ integration, index }) => {
  const Icon = integration.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all backdrop-blur-sm"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 text-center">{integration.name}</h3>
      <p className="text-sm text-gray-400 text-center">{integration.description}</p>
    </motion.div>
  );
};

export const Integrations: React.FC = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
              Nahtlose <span className="text-accent">Integrationen</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Verbinden Sie Ihren Voice Agent mit den Tools, die Sie bereits nutzen. Keine komplexe IT-Integration notwendig.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {integrations.map((integration, index) => (
            <IntegrationCard key={integration.name} integration={integration} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-500">
            Weitere Integrationen auf Anfrage verfügbar
          </p>
        </motion.div>
      </div>
    </section>
  );
};
