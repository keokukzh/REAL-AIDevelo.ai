import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ZoomIn } from 'lucide-react';

interface PreviewItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

const PREVIEWS: PreviewItem[] = [
  {
    id: '1',
    title: 'Alpine Dental Clinic',
    category: 'Medizintechnik',
    image: '/assets/previews/dentist_website_mockup.png',
    description: 'Modernes Redesign für eine Zahnarztpraxis mit Fokus auf Vertrauen und Online-Buchung.'
  },
  {
    id: '2',
    title: 'Alta Cucina',
    category: 'Gastronomie',
    image: '/assets/previews/restaurant_website_mockup.png',
    description: 'Elegantes Design für ein High-End Restaurant mit Fokus auf Atmosphäre und Menü-Präsentation.'
  },
  {
    id: '3',
    title: 'Neural Core AI',
    category: 'Technik / SaaS',
    image: '/assets/previews/saas_website_mockup.png',
    description: 'Futuristisches Interface für ein KI-Startup mit komplexen Daten-Visualisierungen.'
  }
];

export const WebsitePreviews: React.FC = () => {
  return (
    <section id="website-previews" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-swiss-red/5 rounded-full blur-[120px] -mr-64 -mt-32" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-32" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-sm font-bold uppercase tracking-widest mb-4"
          >
            Portfolio
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-display text-white mb-6"
          >
            Websites, die <span className="text-swiss-red">begeistern</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Wir erstellen keine 0815-Websites. Wir designen digitale Erlebnisse, die Ihre Marke widerspiegeln
            und Ihre Kunden überzeugen.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PREVIEWS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500 group-hover:border-swiss-red/30 group-hover:shadow-swiss-red/10">
                {/* Image */}
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                
                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-swiss-red text-[10px] font-bold text-white uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-swiss-red transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Hover Action Button */}
                <div className="absolute top-4 right-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic CTA below portfolio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(218,41,28,0.05)_0%,transparent_70%)]" />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Bereit für Ihren eigenen digitalen Auftritt?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Sichern Sie sich jetzt Ihr Redesign zum Festpreis von 599 CHF.
              Keine versteckten Kosten, volle Transparenz.
            </p>
            <button 
              onClick={() => document.getElementById('webdesign-contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full bg-swiss-red hover:bg-red-700 text-white font-bold transition-all hover:scale-105 shadow-xl shadow-red-900/20 inline-flex items-center gap-2"
            >
              Kostenloses Erstgespräch anfragen
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
