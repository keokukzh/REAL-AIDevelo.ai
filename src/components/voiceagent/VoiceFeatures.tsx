import React from 'react';
import { motion } from 'framer-motion';
import { features } from '../../data/features';
import { Feature } from '../../types';
import { RevealSection } from '../layout/RevealSection';

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => {
  return (
    <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-transparent hover:bg-white/10 transition-all duration-300 backdrop-blur-md overflow-hidden hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10">
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 p-[1px]">
          <div className="h-full w-full rounded-2xl bg-white/5" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <feature.icon size={28} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 font-display">{feature.title}</h3>
        <p className="text-gray-400 leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
};

export const VoiceFeatures: React.FC = () => {
  return (
    <RevealSection className="py-24 relative section-spacing" id="features">
      <div className="container mx-auto px-6">
        <RevealSection className="text-center mb-16 max-w-2xl mx-auto" staggerDelay={0.05}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-4">
            Coming Soon: Voice Agents
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            In Kürze: Ihr KI-basierter <span className="text-accent">Voice Agent</span>.
          </h2>
          <p className="text-gray-400 text-lg">
            Wir arbeiten bereits an der nächsten Generation der Kundenkommunikation. 
            Melden Sie sich an, um die Test-Agents bereits jetzt im Dashboard zu erleben.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-accent text-black rounded-lg font-semibold hover:bg-accent/80 transition-all transform hover:scale-105"
            >
              Jetzt für Preview registrieren
            </button>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </RevealSection>
  );
};