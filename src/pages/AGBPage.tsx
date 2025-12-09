import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AGBPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <p className="text-lg text-gray-200 mb-4">
                Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Dienste von AIDevelo.ai.
              </p>
              <p className="text-sm text-gray-400">
                Stand: {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Geltungsbereich</h2>
              <p>
                Diese AGB gelten für alle Verträge zwischen AIDevelo.ai (nachfolgend "Anbieter" genannt) 
                und den Nutzern (nachfolgend "Kunde" genannt) über die Nutzung der AI Voice Agent Services.
              </p>
              <p className="mt-2">
                Abweichende, entgegenstehende oder ergänzende AGB des Kunden werden nicht Vertragsbestandteil, 
                es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Vertragsgegenstand</h2>
              <p>
                Der Anbieter stellt dem Kunden eine Software-as-a-Service (SaaS) Lösung zur Verfügung, 
                die es ermöglicht, AI-gestützte Voice Agents für die telefonische Kundenkommunikation einzusetzen.
              </p>
              <div className="mt-4 space-y-2">
                <p>Die Leistungen umfassen insbesondere:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Bereitstellung der Voice Agent Plattform</li>
                  <li>Konfiguration und Einrichtung des Voice Agents</li>
                  <li>Sprachverarbeitung und -synthese</li>
                  <li>Integration mit Kalendersystemen (optional)</li>
                  <li>Technischer Support während der Vertragslaufzeit</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Vertragsschluss</h2>
              <p>
                Der Vertrag kommt durch die Annahme des Angebots des Anbieters durch den Kunden zustande. 
                Die Annahme kann schriftlich, per E-Mail oder durch Nutzung der Dienste erfolgen.
              </p>
              <p className="mt-2">
                Der Anbieter behält sich vor, Angebote ohne Angabe von Gründen abzulehnen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Preise und Zahlungsbedingungen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.1 Preise</h3>
                  <p>
                    Die Preise ergeben sich aus der jeweils gültigen Preisliste des Anbieters. 
                    Alle Preise verstehen sich in Schweizer Franken (CHF) zuzüglich der gesetzlichen Mehrwertsteuer.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.2 Zahlungsbedingungen</h3>
                  <p>
                    Die Rechnungsstellung erfolgt monatlich im Voraus. Die Zahlung ist innerhalb von 14 Tagen 
                    nach Rechnungsstellung fällig. Bei Zahlungsverzug werden Verzugszinsen in Höhe von 5% 
                    über dem Basiszinssatz berechnet.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Leistungen und Verfügbarkeit</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">5.1 Verfügbarkeit</h3>
                  <p>
                    Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Dienste. Eine Verfügbarkeit von 99% 
                    wird angestrebt, kann jedoch nicht garantiert werden. Geplante Wartungsarbeiten werden 
                    dem Kunden nach Möglichkeit im Voraus angekündigt.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">5.2 Änderungen der Leistungen</h3>
                  <p>
                    Der Anbieter behält sich vor, die Leistungen weiterzuentwickeln und zu ändern, 
                    soweit dies für den Kunden zumutbar ist und der Vertragszweck nicht beeinträchtigt wird.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Pflichten des Kunden</h2>
              <p>Der Kunde verpflichtet sich:</p>
              <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
                <li>die Dienste nur im Rahmen der gesetzlichen Bestimmungen zu nutzen</li>
                <li>keine rechtswidrigen Inhalte zu verbreiten</li>
                <li>die Zugangsdaten geheim zu halten und nicht an Dritte weiterzugeben</li>
                <li>bei Bekanntwerden von Missbrauch den Anbieter unverzüglich zu informieren</li>
                <li>die erforderlichen technischen Voraussetzungen für die Nutzung sicherzustellen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Datenschutz</h2>
              <p>
                Der Anbieter verarbeitet personenbezogene Daten des Kunden im Rahmen der gesetzlichen Bestimmungen. 
                Einzelheiten ergeben sich aus der Datenschutzerklärung, die auf der Website des Anbieters abrufbar ist.
              </p>
              <p className="mt-2">
                Der Kunde verpflichtet sich, bei der Nutzung der Dienste die datenschutzrechtlichen Bestimmungen einzuhalten 
                und insbesondere die Einwilligung der betroffenen Personen einzuholen, soweit erforderlich.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Haftung</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">8.1 Haftungsbeschränkung</h3>
                  <p>
                    Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Bei leichter Fahrlässigkeit 
                    haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die 
                    ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">8.2 Datenverlust</h3>
                  <p>
                    Der Anbieter empfiehlt dem Kunden, regelmäßig Sicherungskopien seiner Daten zu erstellen. 
                    Eine Haftung für Datenverlust besteht nur bei Vorsatz oder grober Fahrlässigkeit.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Kündigung</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">9.1 Kündigungsfrist</h3>
                  <p>
                    Der Vertrag kann von beiden Seiten mit einer Frist von einem Monat zum Monatsende gekündigt werden.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">9.2 Außerordentliche Kündigung</h3>
                  <p>
                    Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. 
                    Ein wichtiger Grund liegt insbesondere vor, wenn der andere Vertragspartner trotz Abmahnung 
                    erheblich gegen die Vertragsbedingungen verstößt.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Schlussbestimmungen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">10.1 Änderungen der AGB</h3>
                  <p>
                    Der Anbieter behält sich vor, diese AGB zu ändern. Änderungen werden dem Kunden spätestens 
                    zwei Wochen vor ihrem Inkrafttreten mitgeteilt. Widerspricht der Kunde nicht innerhalb von 
                    zwei Wochen nach Zugang der Mitteilung, gelten die Änderungen als genehmigt.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">10.2 Anwendbares Recht</h3>
                  <p>
                    Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">10.3 Salvatorische Klausel</h3>
                  <p>
                    Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit 
                    der übrigen Bestimmungen unberührt.
                  </p>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Kontakt</h2>
              <p>
                Bei Fragen zu diesen AGB können Sie uns kontaktieren:
              </p>
              <p className="mt-2">
                <a href="mailto:hello@aidevelo.ai" className="text-accent hover:text-accent/80 transition-colors">
                  hello@aidevelo.ai
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
