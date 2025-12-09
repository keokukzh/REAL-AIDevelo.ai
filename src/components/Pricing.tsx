import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { pricingPlans } from '../data/pricing';

interface PricingProps {
  onStartOnboarding?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onStartOnboarding }) => {
  const regularPlans = pricingPlans.filter(p => p.id !== 'enterprise');
  const enterprisePlan = pricingPlans.find(p => p.id === 'enterprise');

  const handleCardClick = (planId: string) => {
    if (planId === 'enterprise') {
      // Redirect to enterprise contact form
      window.location.href = '/enterprise';
    } else {
      // Redirect to checkout
      window.location.href = `/checkout?planId=${planId}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, planId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(planId);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden" id="pricing">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Preise für Schweizer KMU.</h2>
          <p className="text-gray-400 mb-6">Wählen Sie den Plan, der zu Ihrem Anrufvolumen passt. Keine versteckten Gebühren.</p>
          
          {/* Flash Deal Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-8"
          >
            <div className="bg-gradient-to-r from-accent/20 to-primary/20 border-2 border-accent/50 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                  <div className="font-bold text-white text-lg">Flash-Deal: 3 Monate für 599 CHF</div>
                  <div className="text-sm text-gray-300">Statt 537 CHF (3x 179 CHF) - Sparen Sie 37 CHF!</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Gültig für Business Plan. Danach regulärer Monatspreis von 179 CHF.
              </p>
            </div>
          </motion.div>
        </div>

        {/* 3+1 Layout: 3 Plans oben, Enterprise darunter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Regular Plans (Starter, Business, Premium) - Mobile: Business zuerst */}
          {regularPlans
            .sort((a, b) => {
              // Mobile: Business zuerst, dann Starter, dann Premium
              const order = ['business', 'starter', 'premium'];
              return order.indexOf(a.id) - order.indexOf(b.id);
            })
            .map((plan) => {
              const isHighlighted = plan.highlight;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: plan.id === 'business' ? 0.1 : 0 }}
                  onClick={() => handleCardClick(plan.id)}
                  onKeyDown={(e) => handleKeyDown(e, plan.id)}
                  role="button"
                  tabIndex={0}
                  className={`relative p-8 rounded-3xl flex flex-col cursor-pointer transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isHighlighted
                      ? 'bg-gradient-to-b from-gray-800 to-black border-2 border-cyan-400/60 shadow-[0_0_80px_rgba(34,211,238,0.4)] hover:scale-105 hover:shadow-[0_0_100px_rgba(34,211,238,0.5)] order-first md:order-none'
                      : 'bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-slate-700'
                  }`}
                >
                  {/* Badge für Business Plan */}
                  {isHighlighted && plan.badge && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-lg shadow-cyan-500/40 whitespace-nowrap z-20">
                      {plan.badge}
                    </div>
                  )}

                  <div className={`text-center ${isHighlighted ? 'pt-4' : ''}`}>
                    <h3 className={`font-bold mb-2 flex items-center justify-center gap-2 ${isHighlighted ? 'text-2xl text-white' : 'text-xl text-gray-300'}`}>
                      {plan.name}
                      {isHighlighted && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                    </h3>
                    {plan.description && (
                      <p className={`text-sm mb-4 ${isHighlighted ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="text-center mb-6">
                    <div className={`font-bold mb-2 ${isHighlighted ? 'text-5xl text-white' : 'text-4xl text-white'}`}>
                      CHF {plan.price}
                      {plan.price !== 'Auf Anfrage' && (
                        <span className="text-sm text-gray-500 font-normal"> / Monat</span>
                      )}
                    </div>
                    {plan.priceNote && (
                      <p className="text-xs text-gray-400">{plan.priceNote}</p>
                    )}
                  </div>

                  <ul className={`space-y-3 mb-8 w-full text-left flex-1 ${isHighlighted ? 'text-white' : 'text-gray-400'}`}>
                    {plan.features.map((f: string, i: number) => (
                      <li key={i} className={`flex items-start gap-3 text-sm ${isHighlighted ? 'text-white' : 'text-gray-400'}`}>
                        <div className={`min-w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          isHighlighted
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            : 'bg-slate-700 text-gray-400'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isHighlighted ? 'primary' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(plan.id);
                    }}
                    className={`w-full ${
                      isHighlighted
                        ? 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-300 text-slate-950 rounded-full font-semibold shadow-[0_0_30px_rgba(34,211,238,0.4)] py-4 text-lg'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600'
                    } focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 cursor-pointer`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              );
            })}

          {/* Enterprise Plan - Full Width darunter */}
          {enterprisePlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="col-span-1 md:col-span-3 mt-4"
            >
              <div
                onClick={() => handleCardClick(enterprisePlan.id)}
                onKeyDown={(e) => handleKeyDown(e, enterprisePlan.id)}
                role="button"
                tabIndex={0}
                className="relative p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-black border-2 border-slate-700 hover:border-cyan-400/40 flex flex-col md:flex-row items-center md:items-start gap-8 cursor-pointer transition-all duration-200 ease-out hover:shadow-[0_0_60px_rgba(34,211,238,0.2)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                    {enterprisePlan.name}
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  </h3>
                  {enterprisePlan.description && (
                    <p className="text-cyan-400 text-sm mb-4">{enterprisePlan.description}</p>
                  )}
                  <div className="text-4xl font-bold text-white mb-2">{enterprisePlan.price}</div>
                  {enterprisePlan.priceNote && (
                    <p className="text-xs text-gray-400 mb-6">{enterprisePlan.priceNote}</p>
                  )}
                </div>

                <div className="flex-1 w-full md:w-auto">
                  <ul className="space-y-3 mb-6 text-left">
                    {enterprisePlan.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-white text-sm">
                        <div className="min-w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 mt-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-full md:w-auto md:flex-shrink-0">
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(enterprisePlan.id);
                    }}
                    className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-300 text-slate-950 rounded-full font-semibold shadow-[0_0_30px_rgba(34,211,238,0.4)] py-4 px-8 text-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 cursor-pointer"
                  >
                    {enterprisePlan.cta}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Text */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Jeder Plan beinhaltet: 24/7 Erreichbarkeit, Schweizerdeutscher Agent, DSG/DSGVO-konforme Datenverarbeitung.
          </p>
        </div>
      </div>
    </section>
  );
};