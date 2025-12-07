import React from 'react';
import { Play, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function DemoAudioSection() {
  return (
    <section className="py-24 bg-surface border-y border-white/5 relative overflow-hidden">
        {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 max-w-5xl text-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
        >
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            Hören Sie den <span className="text-accent">Unterschied</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unsere KI-Agenten klingen so menschlich, dass Ihre Kunden den Unterschied nicht bemerken werden. Überzeugen Sie sich selbst.
            </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AudioCard 
            title="Deutsch (Schweiz)" 
            subtitle="Perfekt für lokale KMU"
            file="/audio/demo_de.mp3" 
            flag="🇨🇭"
            delay={0.1}
          />
          <AudioCard 
            title="Français (Suisse)" 
            subtitle="Pour la Romandie"
            file="/audio/demo_fr.mp3" 
            flag="🇫🇷"
            delay={0.2}
          />
          <AudioCard 
            title="Italiano (Svizzera)" 
            subtitle="Per il Ticino"
            file="/audio/demo_it.mp3" 
            flag="🇮🇹"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}

interface AudioCardProps {
    title: string;
    subtitle: string;
    file: string;
    flag: string;
    delay: number;
}

function AudioCard({ title, subtitle, file, flag, delay }: AudioCardProps) {
  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        viewport={{ once: true }}
        className="bg-background p-6 rounded-2xl border border-white/10 hover:border-accent/50 transition-all group text-left"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
            <div className="text-4xl mb-2">{flag}</div>
            <h3 className="font-bold text-lg text-white group-hover:text-accent transition-colors">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <Volume2 size={20} />
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-2">
          <audio controls className="w-full h-8 custom-audio-player invert hue-rotate-180">
            <source src={file} type="audio/mpeg" />
            Ihr Browser unterstützt dieses Audio-Element nicht.
          </audio>
      </div>
    </motion.div>
  );
}
