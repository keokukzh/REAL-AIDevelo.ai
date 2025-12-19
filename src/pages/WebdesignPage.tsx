import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { WebdesignContactForm } from '../components/WebdesignContactForm';
import { Check, Globe, Smartphone, Zap, Search, Palette, Code, Shield, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';

export const WebdesignPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: 'Responsive Design',
      description: 'Ihre Website sieht auf allen Geräten perfekt aus - Desktop, Tablet und Smartphone. Pixelgenaue Umsetzung mit modernen CSS-Frameworks.',
    },
    {
      icon: Zap,
      title: 'Schnelle Ladezeiten',
      description: 'Optimierte Performance mit Code-Splitting, Lazy Loading und modernen Build-Tools. Lighthouse Score 90+ garantiert.',
    },
    {
      icon: Search,
      title: 'SEO-Optimierung',
      description: 'Meta-Tags, strukturierte Daten (Schema.org), XML-Sitemap und semantisches HTML für maximale Sichtbarkeit.',
    },
    {
      icon: Palette,
      title: 'Modernes Design',
      description: 'Zeitgemäßes, professionelles Design basierend auf aktuellen UI/UX-Trends und Best Practices.',
    },
    {
      icon: Code,
      title: 'Sauberer Code',
      description: 'Wartbarer, strukturierter Code nach modernen Standards (TypeScript, React, Tailwind CSS).',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'Mobile-optimierte Websites mit Touch-optimierter Navigation und schnellen Ladezeiten.',
    },
    {
      icon: Shield,
      title: 'Sicherheit',
      description: 'HTTPS, sichere Formulare, DSGVO-konform und regelmäßige Security-Updates.',
    },
    {
      icon: Clock,
      title: 'Schnelle Umsetzung',
      description: 'Professionelle Umsetzung in 2-3 Wochen. Klare Kommunikation und regelmäßige Updates.',
    },
    {
      icon: TrendingUp,
      title: 'Conversion-Optimierung',
      description: 'Strategisch platzierte CTAs, A/B-Testing-ready und datengetriebene Optimierungen.',
    },
  ];

  const processSteps = [
    {
      number: '01',
      title: 'Konsultation',
      description: 'Wir besprechen Ihre Anforderungen, Ziele und Vision für Ihre Website in einem ausführlichen Gespräch.',
    },
    {
      number: '02',
      title: 'Konzept & Design',
      description: 'Erstellung eines detaillierten Konzepts mit Wireframes und Design-Mockups für Ihre Freigabe.',
    },
    {
      number: '03',
      title: 'Entwicklung',
      description: 'Professionelle Umsetzung mit modernen Technologien, regelmäßigen Updates und Feedback-Schleifen.',
    },
    {
      number: '04',
      title: 'Testing & Launch',
      description: 'Umfassendes Testing auf allen Geräten, Performance-Optimierung und finaler Launch.',
    },
  ];

  const technologies = [
    { name: 'React', description: 'Moderne Frontend-Bibliothek' },
    { name: 'TypeScript', description: 'Typsichere Entwicklung' },
    { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
    { name: 'Vite', description: 'Schneller Build-Tool' },
    { name: 'Responsive Design', description: 'Mobile-First Ansatz' },
    { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich' },
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block px-4 py-2 bg-swiss-red/20 border border-swiss-red/30 rounded-full mb-6"
            >
              <span className="text-sm font-semibold text-swiss-red">Professionelle Webentwicklung</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight">
              <span className="text-white">Website-Erstellung oder</span>
              <br />
              <span className="text-swiss-red">Redesign für 500 CHF</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mt-6 max-w-3xl mx-auto">
              Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles aus einer Hand.
              <br />
              <span className="text-white font-semibold">Perfekt für kleine und mittlere Unternehmen.</span>
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
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Transparente Preisgestaltung
              </h2>
              <p className="text-gray-400 text-lg">
                Alles inklusive – keine versteckten Kosten, keine Überraschungen
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-swiss-red/20 to-red-900/20 border-2 border-swiss-red/30 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-swiss-red/5 rounded-full blur-3xl -z-0" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/5 rounded-full blur-3xl -z-0" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="text-6xl md:text-7xl font-bold font-display text-swiss-red mb-2">
                    500 CHF
                  </div>
                  <p className="text-xl text-gray-300 mb-2">
                    Einmalig - Alles inklusive
                  </p>
                  <p className="text-sm text-gray-400">
                    Keine monatlichen Gebühren • Keine versteckten Kosten
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Bis zu 5 Seiten (Home, Über uns, Services, Kontakt, etc.)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Responsive Design (Mobile, Tablet, Desktop)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Grundlegende SEO-Optimierung (Meta-Tags, Sitemap)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Kontaktformular mit E-Mail-Benachrichtigung</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Social Media Integration (Links, Sharing)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Schnelle Ladezeiten (Lighthouse Score 90+)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Wartbarer, sauberer Code (TypeScript, React)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">2-3 Wochen Umsetzungszeit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Unser Prozess
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Von der ersten Idee bis zum Launch – strukturiert, transparent und professionell.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-swiss-red/50 transition-colors h-full">
                  <div className="text-4xl font-bold text-swiss-red/30 mb-4">{step.number}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-0.5 bg-swiss-red/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-950/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Professionelle Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modernste Technologien und Best Practices für maximale Performance und Benutzerfreundlichkeit.
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
                className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-swiss-red/50 transition-all hover:shadow-lg hover:shadow-swiss-red/10"
              >
                <div className="w-12 h-12 bg-swiss-red/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-swiss-red" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
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
              Moderne Technologien
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Wir verwenden nur die besten und modernsten Tools für Ihre Website.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-center hover:border-swiss-red/50 transition-colors"
              >
                <div className="font-semibold text-white mb-1">{tech.name}</div>
                <div className="text-xs text-gray-400">{tech.description}</div>
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


