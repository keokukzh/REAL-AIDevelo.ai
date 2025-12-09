import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DatenschutzPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-8">Datenschutzerklärung</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <p className="text-lg text-gray-200 mb-4">
                Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung 
                von personenbezogenen Daten auf unserer Website auf (im Folgenden „Website" genannt).
              </p>
              <p className="text-sm text-gray-400">
                Diese Datenschutzerklärung entspricht den Anforderungen der Datenschutz-Grundverordnung (DSGVO) 
                sowie dem schweizerischen Datenschutzgesetz (DSG).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Verantwortliche Stelle</h2>
              <div className="space-y-2">
                <p><strong className="text-white">Verantwortlich:</strong> AIDevelo.ai</p>
                <p><strong className="text-white">Sitz:</strong> Zürich, Schweiz</p>
                <p>
                  <strong className="text-white">E-Mail:</strong>{' '}
                  <a href="mailto:hello@aidevelo.ai" className="text-accent hover:text-accent/80 transition-colors">
                    hello@aidevelo.ai
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Erhebung und Speicherung personenbezogener Daten</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.1 Beim Besuch der Website</h3>
                  <p>
                    Beim Aufruf unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser 
                    automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden 
                    temporär in einem sogenannten Logfile gespeichert.
                  </p>
                  <p className="mt-2">Folgende Informationen werden dabei erhoben:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>IP-Adresse des anfragenden Rechners</li>
                    <li>Datum und Uhrzeit des Zugriffs</li>
                    <li>Name und URL der abgerufenen Datei</li>
                    <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                    <li>verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.2 Bei Nutzung unseres Kontaktformulars</h3>
                  <p>
                    Bei Fragen jeglicher Art bieten wir Ihnen die Möglichkeit, mit uns über ein auf der Website 
                    bereitgestelltes Formular Kontakt aufzunehmen. Dabei ist die Angabe einer gültigen E-Mail-Adresse 
                    erforderlich, damit wir wissen, von wem die Anfrage stammt und um diese beantworten zu können.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Datenspeicherorte und Auftragsverarbeiter</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.1 Datenspeicherorte</h3>
                  <p>
                    Alle personenbezogenen Daten werden ausschließlich in der Schweiz oder innerhalb der Europäischen Union gespeichert:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong className="text-white">Hauptspeicherort:</strong> Schweiz (nDSG-konform)</li>
                    <li><strong className="text-white">Backup-Speicher:</strong> EU (DSGVO-konform)</li>
                    <li><strong className="text-white">Voice-Aufnahmen:</strong> Schweiz, verschlüsselt gespeichert</li>
                    <li><strong className="text-white">Kalender-Daten:</strong> Über OAuth direkt bei Google/Microsoft, keine lokale Speicherung</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.2 Auftragsverarbeiter</h3>
                  <p>Wir arbeiten mit folgenden Auftragsverarbeitern zusammen, die alle nDSG/DSGVO-konform sind:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong className="text-white">ElevenLabs:</strong> Voice-Cloning und TTS-Services (EU-basiert)</li>
                    <li><strong className="text-white">Hosting-Provider:</strong> Schweizer Rechenzentren</li>
                    <li><strong className="text-white">E-Mail-Service:</strong> DSGVO-konformer Provider</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-400">
                    Alle Auftragsverarbeiter haben Verträge zur Auftragsverarbeitung (AVV) abgeschlossen und verpflichten sich zur Einhaltung der Datenschutzbestimmungen.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Aufbewahrungsfristen und Datenlöschung</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.1 Aufbewahrungsfristen</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong className="text-white">Vertragsdaten:</strong> 10 Jahre nach Vertragsende (gesetzliche Aufbewahrungspflicht)</li>
                    <li><strong className="text-white">Anrufaufzeichnungen:</strong> Maximal 90 Tage, sofern aktiviert</li>
                    <li><strong className="text-white">Voice-Cloning-Daten:</strong> Bis zur Kündigung des Vertrags, danach sofortige Löschung</li>
                    <li><strong className="text-white">Log-Daten:</strong> 30 Tage</li>
                    <li><strong className="text-white">Kontaktanfragen:</strong> 3 Jahre nach letztem Kontakt</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.2 Datenlöschung</h3>
                  <p>
                    Sie haben jederzeit das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. 
                    Nach Kündigung des Vertrags werden alle Daten innerhalb von 30 Tagen gelöscht, außer gesetzlich vorgeschriebene Aufbewahrungsfristen greifen.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Rechte der Betroffenen</h2>
              <p>Gemäß nDSG und DSGVO haben Sie folgende Rechte:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong className="text-white">Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
                <li><strong className="text-white">Berichtigungsrecht:</strong> Falsche Daten können korrigiert werden</li>
                <li><strong className="text-white">Löschungsrecht:</strong> Daten können gelöscht werden (sofern keine Aufbewahrungspflicht besteht)</li>
                <li><strong className="text-white">Einschränkungsrecht:</strong> Verarbeitung kann eingeschränkt werden</li>
                <li><strong className="text-white">Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen</li>
                <li><strong className="text-white">Datenübertragbarkeit:</strong> Daten können in strukturiertem Format exportiert werden</li>
              </ul>
              <p className="mt-4">
                Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter:{' '}
                <a href="mailto:datenschutz@aidevelo.ai" className="text-accent hover:text-accent/80 transition-colors">
                  datenschutz@aidevelo.ai
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Weitergabe von Daten</h2>
              <p>
                Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten 
                Zwecken findet nicht statt. Wir geben Ihre persönlichen Daten nur an Dritte weiter, wenn:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Sie Ihre ausdrückliche Einwilligung dazu erteilt haben,</li>
                <li>die Weitergabe zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist,</li>
                <li>die Weitergabe zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist,</li>
                <li>dies gesetzlich zulässig und für die Abwicklung von Vertragsverhältnissen mit Ihnen erforderlich ist.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
              <p>
                Wir setzen auf unserer Seite Cookies ein. Hierbei handelt es sich um kleine Dateien, die Ihr Browser 
                automatisch erstellt und die auf Ihrem Endgerät (Laptop, Tablet, Smartphone o.ä.) gespeichert werden, 
                wenn Sie unsere Seite besuchen. Cookies richten auf Ihrem Endgerät keinen Schaden an, enthalten keine 
                Viren, Trojaner oder sonstigen Schadsoftware.
              </p>
              <p className="mt-2">
                In dem Cookie werden Informationen abgelegt, die sich jeweils im Zusammenhang mit dem spezifisch 
                eingesetzten Endgerät ergeben. Dies bedeutet jedoch nicht, dass wir dadurch unmittelbar Kenntnis 
                von Ihrer Identität erhalten.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Datensicherheit</h2>
              <p>Sie haben das Recht:</p>
              <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
                <li>
                  <strong className="text-white">Auskunft</strong> über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen
                </li>
                <li>
                  <strong className="text-white">Berichtigung</strong> unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen
                </li>
                <li>
                  <strong className="text-white">Löschung</strong> Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen
                </li>
                <li>
                  <strong className="text-white">Einschränkung der Datenverarbeitung</strong> zu verlangen, soweit wir Ihre Daten aufgrund gesetzlicher Pflichten noch nicht löschen dürfen
                </li>
                <li>
                  <strong className="text-white">Widerspruch</strong> gegen die Verarbeitung Ihrer personenbezogenen Daten bei uns zu erheben
                </li>
                <li>
                  <strong className="text-white">Datenübertragbarkeit</strong>, sofern Sie in die Datenverarbeitung eingewilligt haben oder einen Vertrag mit uns abgeschlossen haben
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Aktualität und Änderung dieser Datenschutzerklärung</h2>
              <p>
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })}.
              </p>
              <p className="mt-2">
                Durch die Weiterentwicklung unserer Website und Angebote darüber oder aufgrund geänderter gesetzlicher 
                beziehungsweise behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern.
              </p>
            </section>

            <section className="pt-4 border-t border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Kontakt für Datenschutzfragen</h2>
              <p>
                Wenn Sie Fragen zum Datenschutz haben, schreiben Sie uns bitte eine E-Mail oder wenden Sie sich 
                direkt an die für den Datenschutz verantwortliche Person in unserem Unternehmen:
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
