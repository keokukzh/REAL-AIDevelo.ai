import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ImpressumPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/50 rounded-2xl p-8 md:p-12 border border-white/10"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-8">Impressum</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Angaben gemäß Art. 321 StGB (Schweiz)</h2>
              <div className="space-y-2">
                <p><strong className="text-white">Firmenname:</strong> AIDevelo.ai</p>
                <p><strong className="text-white">Rechtsform:</strong> Einzelfirma / GmbH</p>
                <p><strong className="text-white">Sitz:</strong> Zürich, Schweiz</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Kontakt</h2>
              <div className="space-y-2">
                <p>
                  <strong className="text-white">E-Mail:</strong>{' '}
                  <a href="mailto:hello@aidevelo.ai" className="text-accent hover:text-accent/80 transition-colors">
                    hello@aidevelo.ai
                  </a>
                </p>
                <p><strong className="text-white">Website:</strong> www.aidevelo.ai</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Verantwortlich für den Inhalt</h2>
              <p>
                Verantwortlich für den Inhalt dieser Website ist AIDevelo.ai. 
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Haftungsausschluss</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Haftung für Inhalte</h3>
                  <p>
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Haftung für Links</h3>
                  <p>
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                    Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Urheberrecht</h2>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem schweizerischen Urheberrecht. 
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>

            <section className="pt-4 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Stand: {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
