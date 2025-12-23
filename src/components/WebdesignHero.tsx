import React from 'react';
import { motion } from 'framer-motion';
import { Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const WebdesignHero: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const handleGetStarted = () => {
    navigate(ROUTES.WEBDESIGN);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-slate-950 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />
      
      {/* Main Container */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-swiss-red/20 border border-swiss-red/30 backdrop-blur-sm"
          >
            <Globe className="w-4 h-4 text-swiss-red" />
            <span className="text-sm font-semibold tracking-wide text-swiss-red uppercase">
              Professionelle Webentwicklung
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-tight tracking-tight"
          >
            <span className="text-white">Neue Website oder</span>
            <br />
            <span className="text-swiss-red">Redesign für 599 CHF</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
          >
            Professionelle, moderne Websites mit modernsten Technologien.
            <br />
            <span className="text-white font-semibold">Von der Konzeption bis zum Launch – alles aus einer Hand.</span>
          </motion.p>

          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-12"
          >
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-swiss-red shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">Responsive Design</div>
                <div className="text-sm text-gray-400">Perfekt auf allen Geräten</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-swiss-red shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">SEO-Optimiert</div>
                <div className="text-sm text-gray-400">Maximale Sichtbarkeit</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-swiss-red shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">Schnelle Ladezeiten</div>
                <div className="text-sm text-gray-400">Lighthouse Score 90+</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-swiss-red shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">2-3 Wochen Umsetzung</div>
                <div className="text-sm text-gray-400">Schnell und professionell</div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Button
              onClick={handleGetStarted}
              variant="primary"
              className="bg-swiss-red hover:bg-red-700 text-white border-none shadow-lg shadow-swiss-red/30 px-10 py-6 text-lg font-semibold min-h-[56px]"
              icon={<ArrowRight size={20} />}
            >
              Jetzt anfragen
            </Button>
            <Button
              onClick={() => {
                const element = document.getElementById('process-flow');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              variant="outline"
              className="border-white/20 hover:bg-white/5 px-10 py-6 text-lg font-medium min-h-[56px]"
            >
              Mehr erfahren
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-sm text-gray-500 mt-4"
          >
            Alles inklusive – keine versteckten Kosten
          </motion.p>
        </div>
      </div>
    </section>
  );
};

