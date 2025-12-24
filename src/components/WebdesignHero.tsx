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
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-slate-950 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-swiss-red/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

      {/* Main Container */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-swiss-red/10 border border-swiss-red/20 backdrop-blur-sm"
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
              className="text-4xl md:text-5xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight"
            >
              <span className="text-white block">Neue Website oder</span>
              <span className="text-swiss-red block mt-2">Redesign für 599 CHF</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed"
            >
              Wir designen und entwickeln Ihre neue Website nach modernsten Standards. 
              <span className="text-white font-semibold mt-2 block">Premium-Qualität zum fairen Festpreis.</span>
            </motion.p>

            {/* Benefits List (Compact) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4"
            >
              {[
                'Responsive Design',
                'SEO-Optimiert',
                'Schnelle Ladezeiten',
                'Fertig in 2-3 Wochen'
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-swiss-red" />
                  <span className="text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              <Button
                onClick={handleGetStarted}
                variant="primary"
                className="bg-swiss-red hover:bg-red-700 text-white border-none shadow-lg shadow-swiss-red/30 px-8 py-4 text-lg font-semibold min-h-[56px]"
                icon={<ArrowRight size={20} />}
              >
                Jetzt anfragen
              </Button>
              <Button
                onClick={() => {
                  const element = document.getElementById('process-flow');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    navigate(ROUTES.WEBDESIGN);
                  }
                }}
                variant="secondary"
                className="text-gray-400 hover:text-white px-8 py-4 text-lg font-medium min-h-[56px]"
              >
                Mehr erfahren
              </Button>
            </motion.div>
          </div>

          {/* Right Side: Floating Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:block relative"
          >
            {/* Card Background Blur */}
            <div className="absolute inset-0 bg-swiss-red/5 rounded-3xl blur-3xl transform rotate-6" />
            
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10 p-2 shadow-2xl transform hover:-rotate-2 transition-transform duration-700">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-white/5">
                <img 
                  src="/assets/previews/restaurant_website_mockup.png" 
                  alt="Webdesign Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Element 1 - Stats */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    98
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Performance</span>
                    <span className="text-sm font-bold text-slate-900">Top Speed</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Element 2 - Badge */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-swiss-red flex items-center justify-center text-white">
                    <Globe size={16} />
                  </div>
                  <span className="text-sm font-medium text-white">Responsive</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

