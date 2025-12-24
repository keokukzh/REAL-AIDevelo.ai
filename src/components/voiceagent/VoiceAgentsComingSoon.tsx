import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/navigation';

export const VoiceAgentsComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gradient-to-b from-slate-950/50 to-background relative overflow-hidden"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/20 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">
                  <span className="text-white">Voice Agents – </span>
                  <span className="text-primary">Coming Soon</span>
                </h2>
                <p className="text-gray-300 text-lg mb-4">
                  Unser Team arbeitet mit Hochleistung an den Agents. Diese werden bald erhältlich sein.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Registrieren Sie sich jetzt und erhalten Sie Zugriff auf das Dashboard im Preview-Modus mit Test-Agents, die Sie anhören können.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    variant="primary"
                    className="bg-primary hover:bg-primary/80 text-white border-none px-6 py-3"
                    icon={<ArrowRight size={18} />}
                  >
                    Zum Preview-Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/5 px-6 py-3"
                  >
                    Jetzt registrieren
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

