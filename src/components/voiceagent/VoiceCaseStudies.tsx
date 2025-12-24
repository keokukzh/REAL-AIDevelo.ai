import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Star, MapPin, Quote } from 'lucide-react';
import { RevealSection } from './layout/RevealSection';

const cases = [
  {
    industry: "Barber & Beauty",
    client: "Barber Bros",
    location: "Zürich West",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=300&h=200",
    challenge: "Verlust von ca. 5 Anrufen/Tag während Stoßzeiten.",
    result: "Der Agent füllte im ersten Monat 32 Lücken im Kalender automatisch.",
    stats: [
      { label: "Umsatzplus", value: "+4.200 CHF", icon: TrendingUp, color: "text-green-400" },
      { label: "Admin-Zeit", value: "-12 Std.", icon: Clock, color: "text-blue-400" }
    ],
    quote: "Endlich schneide ich Haare, statt Sekretär zu spielen. Meine Kunden feiern die einfache Buchung."
  },
  {
    industry: "Medizin",
    client: "Praxis Dr. Weiss",
    location: "Bern",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300&h=200",
    challenge: "MPA war 2h/Tag nur am Telefon für Terminverschiebungen.",
    result: "Entlastung des Teams. Notfälle kommen sofort durch, Routine wird automatisiert.",
    stats: [
      { label: "Erreichbarkeit", value: "100%", icon: Star, color: "text-yellow-400" },
      { label: "Weniger Stress", value: "Enorm", icon: TrendingUp, color: "text-purple-400" }
    ],
    quote: "Unsere Patienten sind begeistert, dass sie auch am Sonntag Termine vereinbaren können."
  },
  {
    industry: "Kfz & Garage",
    client: "Garage Meier",
    location: "Luzern",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=300&h=200",
    challenge: "Mechaniker mussten unter Hebebühne hervor für Telefon.",
    result: "Keine Arbeitsunterbrechung mehr. Reifenwechsel-Saison lief vollautomatisch.",
    stats: [
      { label: "Mehr Aufträge", value: "+18%", icon: TrendingUp, color: "text-green-400" },
      { label: "Produktivität", value: "+25%", icon: Clock, color: "text-blue-400" }
    ],
    quote: "Das Ding bezahlt sich von selbst. Ich habe saubere Hände und volle Auftragsbücher."
  },
  {
    industry: "Immobilien",
    client: "ImmoSwiss AG",
    location: "St. Gallen",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=300&h=200",
    challenge: "Makler verpassten Leads während Besichtigungen.",
    result: "Agent qualifiziert Anrufer vor. Nur ernsthafte Käufer landen beim Makler.",
    stats: [
      { label: "Lead Quali", value: "Autom.", icon: Star, color: "text-yellow-400" },
      { label: "Deal Close", value: "+3/Monat", icon: TrendingUp, color: "text-green-400" }
    ],
    quote: "Ein Gamechanger. Der Agent filtert die 'Nur-Gucker' von den echten Käufern."
  }
];

const CaseCard: React.FC<{ data: typeof cases[0] }> = ({ data }) => {
  return (
    <div className="group relative bg-surface/30 border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10">
      {/* Header Image Area */}
      <div className="h-32 w-full relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <img 
          src={data.image} 
          alt={data.client} 
          loading="lazy"
          className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute bottom-3 left-4 z-20">
          <h3 className="text-white font-bold text-lg">{data.client}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-300">
            <MapPin size={12} className="text-accent" /> {data.location}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Challenge/Result */}
        <div className="mb-6 space-y-3 flex-1">
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Herausforderung</span>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{data.challenge}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Ergebnis</span>
            <p className="text-sm text-gray-200 mt-1 font-medium leading-relaxed">{data.result}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {data.stats.map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={14} className={stat.color} />
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <div className="text-lg font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="relative mt-auto pt-4 border-t border-white/5">
          <Quote size={20} className="absolute -top-2.5 left-0 text-white/10 bg-black px-1" />
          <p className="text-xs text-gray-400 italic leading-relaxed pl-2">
            "{data.quote}"
          </p>
        </div>
      </div>
    </div>
  );
};

export const CaseStudies: React.FC = () => {
  return (
    <RevealSection className="py-24 bg-black relative section-spacing">
      {/* Background Gradient */}
      <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6">
        <RevealSection className="text-center mb-16 max-w-3xl mx-auto" staggerDelay={0.05}>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-accent mb-4">
            Erfolgsgeschichten
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            Echte Ergebnisse aus der <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Schweizer Praxis</span>.
          </h2>
          <p className="text-gray-400 text-lg">
            Sehen Sie, wie Unternehmen ihre Prozesse automatisiert und den Umsatz gesteigert haben.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((item, index) => (
            <CaseCard key={index} data={item} />
          ))}
        </div>
      </div>
    </RevealSection>
  );
};