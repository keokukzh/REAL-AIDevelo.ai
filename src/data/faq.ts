import { FaqItem } from '../types';

export const faqs: FaqItem[] = [
  {
    question: "Klingt die Stimme wirklich natürlich?",
    answer: "Ja, wir nutzen die neueste Generation von AI-Voice-Modellen. Mit unserem Voice-Cloning können wir sogar Ihre eigene Stimme digitalisieren, sodass der Agent fast ununterscheidbar von Ihnen klingt."
  },
  {
    question: "Kann der Agent Termine in meinen Kalender eintragen?",
    answer: "Absolut. Wir integrieren uns nahtlos in Google Calendar, Outlook, Calendly und viele branchenspezifische Tools wie Salon-Software oder Ärzte-Agenden."
  },
  {
    question: "Versteht der Agent Schweizerdeutsch?",
    answer: "Ja, unser Modell ist auf Schweizer Dialekte trainiert bzw. optimiert im Verständnis (Speech-to-Text) und antwortet in einem sehr natürlichen, dialekt-nahen Hochdeutsch oder auf Wunsch mit Klon-Stimme."
  },
  {
    question: "Wie schnell ist das System eingerichtet?",
    answer: "Mit unserem Onboarding-Wizard ist die Grundkonfiguration in 20 Minuten erledigt. Die vollständige Aktivierung inkl. Telefonnummern-Portierung dauert in der Regel 24-48 Stunden."
  },
  {
    question: "Was passiert, wenn der Agent eine Frage nicht beantworten kann?",
    answer: "Sie können Eskalationsregeln definieren. Der Agent kann z.B. anbieten, einen Rückruf zu vereinbaren oder den Anruf (zu Geschäftszeiten) direkt an Ihr Handy durchzustellen."
  },
  {
    question: "Wie werden Anrufe abgerechnet?",
    answer: "Jeder Plan hat ein monatliches Anruf-Limit (z.B. Business: 350 Anrufe/Monat). Anrufe werden nur gezählt, wenn der Agent tatsächlich antwortet. Verpasste Anrufe oder Fehlverbindungen zählen nicht. Bei Überschreitung können Sie zusätzliche Anruf-Pakete erwerben."
  },
  {
    question: "Was passiert mit meinen Daten?",
    answer: "Alle Daten werden gemäß nDSG (neuem Schweizer Datenschutzgesetz) in der Schweiz oder EU gespeichert. Anrufaufzeichnungen werden nur mit Ihrer ausdrücklichen Einwilligung gespeichert und können jederzeit gelöscht werden. Weitere Details finden Sie in unserer Datenschutzerklärung."
  },
  {
    question: "Kann ich den Vertrag jederzeit kündigen?",
    answer: "Ja, alle Pläne können monatlich gekündigt werden. Die Kündigung muss bis zum letzten Tag des Monats erfolgen. Es gibt keine Mindestlaufzeit oder Kündigungsfristen. Nach Kündigung bleibt der Service bis zum Ende des bezahlten Monats aktiv."
  },
  {
    question: "Gibt es eine API für Integrationen?",
    answer: "Ja, der Premium-Plan beinhaltet API-Zugriff für CRM-Integrationen, Webhooks für Anruf-Events und die Möglichkeit, den Agent programmatisch zu konfigurieren. Die API-Dokumentation erhalten Sie nach Aktivierung des Premium-Plans."
  },
  {
    question: "Wie funktioniert die Telefonnummer?",
    answer: "Sie erhalten eine Schweizer Telefonnummer (CH), die direkt an Ihren Agent weiterleitet. Die Nummer kann auf Wunsch portiert werden (z.B. von Ihrer bestehenden Nummer). Die Portierung dauert in der Regel 1-2 Werktage."
  },
  {
    question: "Werden Anrufe aufgezeichnet?",
    answer: "Anrufe werden nur mit Ihrer ausdrücklichen Einwilligung aufgezeichnet. Sie können die Aufzeichnung im Onboarding aktivieren oder deaktivieren. Aufgezeichnete Anrufe werden für Qualitätssicherung und Training verwendet und können jederzeit gelöscht werden."
  },
  {
    question: "Was ist der Unterschied zwischen den Plänen?",
    answer: "Die Pläne unterscheiden sich hauptsächlich im Anrufvolumen (Starter: 120, Business: 350, Premium: 800 Anrufe/Monat), der Anzahl der Telefonnummern, Voice-Cloning-Optionen und Support-Level. Der Business-Plan ist für die meisten KMUs optimal. Details finden Sie in der Preistabelle."
  },
  {
    question: "Was ist der Flash-Deal (3 Monate für 599 CHF)?",
    answer: "Der Flash-Deal ist ein zeitlich begrenztes Einführungsangebot für den Business-Plan. Sie zahlen einmalig 599 CHF für 3 Monate (statt 537 CHF bei regulärer monatlicher Zahlung) und sparen 37 CHF. Nach den 3 Monaten wechseln Sie automatisch auf den regulären Monatspreis von 179 CHF. Der Deal ist nur für Neukunden gültig."
  },
  {
    question: "Was passiert bei mehr Anrufen als im Plan enthalten?",
    answer: "Wenn Sie Ihr monatliches Anruf-Limit überschreiten, können Sie zusätzliche Anruf-Pakete erwerben. Alternativ können Sie jederzeit auf einen höheren Plan upgraden. Wir benachrichtigen Sie per E-Mail, wenn Sie 80% Ihres Limits erreicht haben, damit Sie rechtzeitig reagieren können."
  },
  {
    question: "Wie lange werden Anrufaufzeichnungen gespeichert?",
    answer: "Aufgezeichnete Anrufe werden maximal 90 Tage gespeichert, sofern Sie der Aufzeichnung zugestimmt haben. Sie können Aufzeichnungen jederzeit über Ihr Dashboard löschen oder die Aufzeichnung komplett deaktivieren. Die Löschung erfolgt automatisch nach 90 Tagen."
  },
  {
    question: "Welche Daten werden gespeichert und wo?",
    answer: "Wir speichern nur die für den Betrieb notwendigen Daten: Firmeninformationen, Kontaktdaten, Kalender-Integrationen (Token), Voice-Cloning-Daten und Anruf-Logs (ohne Aufzeichnung, falls nicht gewünscht). Alle Daten werden gemäß nDSG in der Schweiz oder EU gespeichert. Eine detaillierte Auflistung finden Sie in unserer Datenschutzerklärung."
  },
  {
    question: "Kann ich mehrere Agenten mit verschiedenen Stimmen betreiben?",
    answer: "Ja, ab dem Business-Plan können Sie Voice Cloning nutzen. Der Business-Plan beinhaltet 1 Stimme, der Premium-Plan 2 Stimmen. Zusätzliche Stimmen können gegen Aufpreis hinzugefügt werden. Jede Stimme kann für verschiedene Zwecke oder Standorte verwendet werden."
  },
  {
    question: "Wie funktioniert die Integration mit meinem CRM?",
    answer: "Der Premium-Plan beinhaltet API-Zugriff für CRM-Integrationen. Sie können Webhooks konfigurieren, um Anruf-Events (z.B. Terminbuchungen, Lead-Qualifizierungen) direkt in Ihr CRM zu übertragen. Wir unterstützen gängige CRMs wie HubSpot, Salesforce, Pipedrive und bieten auch eine generische REST-API für Custom-Integrationen."
  },
  {
    question: "Was kostet die Telefonnummer?",
    answer: "Die Schweizer Telefonnummer ist in allen Plänen inklusive. Sie erhalten je nach Plan 1-3 Nummern. Eine Portierung Ihrer bestehenden Nummer ist kostenlos. Zusätzliche Nummern können gegen Aufpreis hinzugefügt werden."
  },
  {
    question: "Gibt es eine Testphase oder Geld-zurück-Garantie?",
    answer: "Ja, Sie können den Service 14 Tage lang kostenlos testen. Während der Testphase haben Sie Zugriff auf alle Features Ihres gewählten Plans. Falls Sie nicht zufrieden sind, können Sie innerhalb der ersten 14 Tage ohne Angabe von Gründen kündigen und erhalten Ihr Geld zurück."
  },
  {
    question: "Wie kann ich meinen Agent anpassen oder umkonfigurieren?",
    answer: "Sie können Ihren Agent jederzeit über das Dashboard anpassen: Öffnungszeiten ändern, Ziele aktualisieren, Kalender verbinden/trennen, Voice-Clone neu aufnehmen oder Prompts anpassen. Größere Änderungen (z.B. neue Branchen-Templates) sind im Premium-Plan enthalten oder können als Add-on gebucht werden."
  }
];
