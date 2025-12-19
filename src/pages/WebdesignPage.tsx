import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { WebdesignContactForm } from '../components/WebdesignContactForm';
import { Check, Globe, Smartphone, Zap, Search, Palette, Code } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';

export const WebdesignPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: 'Responsive Design',
      description: 'Ihre Website sieht auf allen Geräten perfekt aus - Desktop, Tablet und Smartphone.',
    },
    {
      icon: Zap,
      title: 'Schnelle Ladezeiten',
      description: 'Optimierte Performance für beste User Experience und SEO.',
    },
    {
      icon: Search,
      title: 'SEO-Optimierung',
      description: 'Grundlegende SEO-Maßnahmen für bessere Sichtbarkeit in Suchmaschinen.',
    },
    {
      icon: Palette,
      title: 'Modernes Design',
      description: 'Zeitgemäßes, professionelles Design das Ihre Marke optimal repräsentiert.',
    },
    {
      icon: Code,
      title: 'Sauberer Code',
      description: 'Wartbarer, strukturierter Code für zukünftige Erweiterungen.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'Mobile-optimierte Websites für die Mehrheit Ihrer Besucher.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
        {/* Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight">
              <span className="text-white">Website-Erstellung oder</span>
              <br />
              <span className="text-swiss-red">Redesign für 500 CHF</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mt-6">
              Professionelle Websites zu einem fairen Preis. Standard-Website-Erstellung oder Redesign Ihrer bestehenden Website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                onClick={() => {
                  const formSection = document.getElementById('contact-form');
                  if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                variant="primary"
                className="bg-swiss-red hover:bg-red-700 text-white border-none"
              >
                Jetzt anfragen
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
              >
                Zurück zur Startseite
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-950/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-gradient-to-br from-swiss-red/20 to-red-900/20 border-2 border-swiss-red/30 rounded-2xl p-8 md:p-12">
              <div className="text-6xl md:text-7xl font-bold font-display text-swiss-red mb-4">
                500 CHF
              </div>
              <p className="text-xl text-gray-300 mb-6">
                Einmalig - Keine versteckten Kosten
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Bis zu 5 Seiten</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Responsive Design (Mobile, Tablet, Desktop)</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Grundlegende SEO-Optimierung</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Kontaktformular</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Social Media Integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Schnelle Ladezeiten</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Wartbarer, sauberer Code</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Was ist enthalten?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professionelle Website-Erstellung mit modernen Standards und Best Practices.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-swiss-red/50 transition-colors"
              >
                <div className="w-12 h-12 bg-swiss-red/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-swiss-red" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 bg-slate-950/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-surface/50 rounded-2xl border border-white/10 p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                  Jetzt anfragen
                </h2>
                <p className="text-gray-400 text-lg">
                  Beschreiben Sie Ihr Projekt und wir melden uns innerhalb von 24 Stunden bei Ihnen.
                </p>
              </div>

              <WebdesignContactForm onSuccess={() => navigate('/')} />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
