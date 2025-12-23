import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, BarChart3, Phone, Calendar, Settings } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface DashboardSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: string; // Placeholder for screenshot URL
  features: string[];
}

const slides: DashboardSlide[] = [
  {
    id: 'overview',
    title: 'Dashboard Übersicht',
    description: 'Behalten Sie alle wichtigen Metriken im Blick',
    icon: BarChart3,
    preview: '/dashboard-preview-1.png', // Placeholder
    features: ['Anrufstatistiken', 'Agent-Performance', 'Echtzeit-Metriken', 'Quick Actions'],
  },
  {
    id: 'calls',
    title: 'Anrufverwaltung',
    description: 'Verwalten Sie alle Anrufe und Transkriptionen',
    icon: Phone,
    preview: '/dashboard-preview-2.png', // Placeholder
    features: ['Anrufhistorie', 'Transkriptionen', 'Call-Details', 'Filter & Suche'],
  },
  {
    id: 'calendar',
    title: 'Kalender-Integration',
    description: 'Automatische Terminbuchung in Google & Outlook',
    icon: Calendar,
    preview: '/dashboard-preview-3.png', // Placeholder
    features: ['Kalender-Sync', 'Terminverwaltung', 'Verfügbarkeiten', 'Automatische Buchungen'],
  },
  {
    id: 'settings',
    title: 'Agent-Konfiguration',
    description: 'Passen Sie Ihren Voice Agent individuell an',
    icon: Settings,
    preview: '/dashboard-preview-4.png', // Placeholder
    features: ['Agent-Einstellungen', 'Voice-Konfiguration', 'Wissensdatenbank', 'Integrationen'],
  },
];

export const DashboardPreviewSlideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isAutoPlaying || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, prefersReducedMotion]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <RevealSection id="dashboard-preview" className="py-24 bg-gradient-to-b from-slate-950 via-black to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-10 pointer-events-none" />
      
      <div className="container mx-auto px-6">
        {/* Header */}
        <RevealSection className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            <span className="text-white">Dashboard </span>
            <span className="text-accent">Preview</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Entdecken Sie die leistungsstarken Features unseres Dashboards. 
            Registrieren Sie sich kostenlos für den Preview-Zugang.
          </p>
        </RevealSection>

        {/* Slideshow Container */}
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Main Slide Display */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {/* Placeholder for Dashboard Screenshot */}
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-display">
                      {currentSlideData.title}
                    </h3>
                    <p className="text-gray-400 text-center max-w-md mb-6">
                      {currentSlideData.description}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {currentSlideData.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                aria-label="Vorherige Folie"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                aria-label="Nächste Folie"
              >
                <ChevronRight size={24} className="text-white" />
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary/80 hover:bg-primary border border-white/20 flex items-center justify-center transition-all duration-200 z-10"
                aria-label={isAutoPlaying ? 'Pause' : 'Play'}
              >
                <Play
                  size={16}
                  className={`text-white ${isAutoPlaying ? '' : 'ml-0.5'}`}
                  style={isAutoPlaying ? {} : { transform: 'translateX(1px)' }}
                />
              </button>
            </div>

            {/* Slide Indicators */}
            <div className="p-6 bg-black/20 border-t border-white/10">
              <div className="flex items-center justify-center gap-2 mb-4">
                {slides.map((slide, index) => {
                  const SlideIcon = slide.icon;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        index === currentSlide
                          ? 'bg-primary/20 border-2 border-primary text-white'
                          : 'bg-white/5 border-2 border-transparent text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label={`Zu ${slide.title} wechseln`}
                    >
                      <SlideIcon size={18} />
                      <span className="text-sm font-medium hidden sm:inline">
                        {slide.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
              {isAutoPlaying && !prefersReducedMotion && (
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <motion.a
              href="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Jetzt kostenlos registrieren</span>
              <ChevronRight size={20} />
            </motion.a>
            <p className="text-gray-400 text-sm mt-3">
              Erhalten Sie sofortigen Zugang zum Dashboard Preview
            </p>
          </div>
        </div>
      </div>
    </RevealSection>
  );
};

