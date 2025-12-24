import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PhoneMissed, DollarSign } from 'lucide-react';
import { CountUp } from '../ui/CountUp';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { RevealSection } from '../layout/RevealSection';

export const VoiceROICalculator: React.FC = () => {
  const [missedCalls, setMissedCalls] = useState(3);
  const [customerValue, setCustomerValue] = useState(150);
  const prefersReducedMotion = useReducedMotion();

  // Assumptions: 1 in 3 missed calls could have been a client. 
  // Monthly loss = (Missed Calls * 30 * ConversionRate 0.33) * CustomerValue
  const monthlyLoss = Math.round((missedCalls * 20 * 0.4) * customerValue);
  const yearlyLoss = monthlyLoss * 12;

  return (
    <RevealSection className="py-20 bg-gradient-to-b from-black to-surface/50 border-t border-white/5 section-spacing">
      <div className="container mx-auto px-6 max-w-5xl">
        <RevealSection className="text-center mb-12" staggerDelay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Was kostet Sie ein <span className="text-red-500">verpasster Anruf?</span>
          </h2>
          <p className="text-gray-400 text-lg">Rechnen Sie selbst. Die meisten KMUs unterschätzen den Verlust massiv.</p>
        </RevealSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          
          {/* Inputs */}
          <div className="space-y-10">
            <div>
              <label className="flex justify-between text-gray-300 font-medium mb-4">
                <span>Verpasste Anrufe pro Tag</span>
                <span className="text-accent text-xl font-bold">{missedCalls}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={missedCalls} 
                onChange={(e) => setMissedCalls(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Verpasste Anrufe pro Tag"
                title="Verpasste Anrufe pro Tag einstellen"
              />
              <p className="text-xs text-gray-500 mt-2">Durchschnitt an Arbeitstagen</p>
            </div>

            <div>
              <label className="flex justify-between text-gray-300 font-medium mb-4">
                <span>Durchschnittlicher Kundenwert (CHF)</span>
                <span className="text-accent text-xl font-bold">{customerValue} CHF</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="1000" 
                step="50"
                value={customerValue} 
                onChange={(e) => setCustomerValue(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Durchschnittlicher Kundenwert"
                title="Durchschnittlicher Kundenwert in CHF einstellen"
              />
              <p className="text-xs text-gray-500 mt-2">Umsatz pro Termin/Verkauf</p>
            </div>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                <PhoneMissed className="text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-200">
                    Realität: Kunden sprechen nicht auf den AB. Sie rufen den nächsten Konkurrenten an.
                </p>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col justify-center items-center text-center space-y-8 bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-red-500/5 blur-3xl" />
             
             <div className="relative z-10">
                <div className="text-gray-400 font-medium mb-2">Ihr möglicher Umsatzverlust pro Jahr</div>
                <motion.div 
                    key={yearlyLoss}
                    initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                    animate={prefersReducedMotion ? {} : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                    className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500"
                >
                    <CountUp end={yearlyLoss} prefix="" suffix=" CHF" duration={1500} />
                </motion.div>
                <div className="text-sm text-gray-500 mt-2">
                    (~<CountUp end={monthlyLoss} prefix="" suffix=" CHF / Monat" duration={1200} />)
                </div>
             </div>

             <div className="w-full h-[1px] bg-white/10" />

             <div className="relative z-10 space-y-4 w-full">
                <div className="text-gray-300">Kosten für AIDevelo Agent:</div>
                <div className="space-y-2">
                    <div className="text-2xl font-bold text-accent">599 CHF <span className="text-sm font-normal text-gray-400">/ 3 Monate (Einführungsangebot)</span></div>
                    <div className="text-sm text-gray-500">Danach: 179 CHF/Monat (Business Plan)</div>
                    <div className="text-xs text-gray-600 bg-accent/10 px-2 py-1 rounded inline-block">
                        ⚡ Flash-Deal: Sparen Sie 37 CHF (statt 537 CHF)
                    </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 py-2 rounded-lg">
                    <TrendingUp size={16} />
                    ROI positiv nach {(599 / (monthlyLoss/20)).toFixed(1)} Tagen
                </div>
             </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
};