/**
 * Email Templates for Webdesign Request Workflow
 */

export interface EmailTemplateData {
  customerName: string;
  customerEmail: string;
  requestId: string;
  requestType: 'new' | 'redesign';
  company?: string;
  phone?: string;
  currentWebsiteUrl?: string;
  projectDescription: string;
  depositPaymentLink?: string;
  finalPaymentLink?: string;
  previewUrl?: string;
  loginCredentials?: {
    domain?: string;
    server?: string;
    username?: string;
    password?: string;
  };
  missingInfo?: string[];
}

/**
 * Email: New request received (to support@aidevelo.ai)
 */
export function getNewRequestEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const requestTypeLabel = data.requestType === 'new' ? 'Neue Website' : 'Website Redesign';
  const subject = `[Webdesign Anfrage] ${requestTypeLabel} - ${data.customerName}`;
  
  const text = `
Webdesign-Anfrage erhalten

Von: ${data.customerName} (${data.customerEmail})
${data.phone ? `Telefon: ${data.phone}` : ''}
${data.company ? `Firma: ${data.company}` : ''}
Art: ${requestTypeLabel}
${data.currentWebsiteUrl ? `Aktuelle Website: ${data.currentWebsiteUrl}` : ''}

Projektbeschreibung:
${data.projectDescription}

Request ID: ${data.requestId}
Eingereicht am: ${new Date().toISOString()}
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Webdesign-Anfrage erhalten</h2>
      <p><strong>Von:</strong> ${data.customerName} (${data.customerEmail})</p>
      ${data.phone ? `<p><strong>Telefon:</strong> ${data.phone}</p>` : ''}
      ${data.company ? `<p><strong>Firma:</strong> ${data.company}</p>` : ''}
      <p><strong>Art:</strong> ${requestTypeLabel}</p>
      ${data.currentWebsiteUrl ? `<p><strong>Aktuelle Website:</strong> <a href="${data.currentWebsiteUrl}" target="_blank">${data.currentWebsiteUrl}</a></p>` : ''}
      <p><strong>Preis:</strong> 599 CHF</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>Projektbeschreibung:</strong></p>
      <p style="white-space: pre-wrap;">${data.projectDescription}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">Request ID: ${data.requestId}</p>
      <p style="color: #666; font-size: 12px;">Eingereicht am: ${new Date().toISOString()}</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Missing information requested (to customer)
 */
export function getMissingInfoEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign Anfrage] Fehlende Informationen`;
  
  const missingList = data.missingInfo?.map(info => `- ${info}`).join('\n') || '';
  
  const text = `
Guten Tag ${data.customerName},

vielen Dank für Ihre Webdesign-Anfrage. Um mit der Umsetzung zu beginnen, benötigen wir noch folgende Informationen:

${missingList}

Bitte senden Sie uns diese Informationen per E-Mail an support@aidevelo.ai oder antworten Sie direkt auf diese E-Mail.

Vielen Dank!
Ihr AIDevelo Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Fehlende Informationen</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>vielen Dank für Ihre Webdesign-Anfrage. Um mit der Umsetzung zu beginnen, benötigen wir noch folgende Informationen:</p>
      <ul>${data.missingInfo?.map(info => `<li>${info}</li>`).join('') || ''}</ul>
      <p>Bitte senden Sie uns diese Informationen per E-Mail an <a href="mailto:support@aidevelo.ai">support@aidevelo.ai</a> oder antworten Sie direkt auf diese E-Mail.</p>
      <p>Vielen Dank!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Deposit payment link (to customer)
 */
export function getDepositPaymentEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign] Anzahlungslink - 100 CHF`;
  
  const text = `
Guten Tag ${data.customerName},

vielen Dank für Ihre Webdesign-Anfrage. Alle Informationen sind vollständig.

Bitte zahlen Sie die Anzahlung von 100 CHF, damit wir mit der Umsetzung Ihrer Website beginnen können:

${data.depositPaymentLink}

Nach Zahlungseingang starten wir sofort mit der Erstellung Ihrer Website.

Gesamtpreis: 599 CHF
- Anzahlung: 100 CHF (jetzt zu zahlen)
- Restzahlung: 499 CHF (nach Fertigstellung)

Vielen Dank!
Ihr AIDevelo Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Anzahlungslink</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>vielen Dank für Ihre Webdesign-Anfrage. Alle Informationen sind vollständig.</p>
      <p>Bitte zahlen Sie die Anzahlung von <strong>100 CHF</strong>, damit wir mit der Umsetzung Ihrer Website beginnen können:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.depositPaymentLink}" style="display: inline-block; background-color: #DA291C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Jetzt 100 CHF zahlen</a>
      </div>
      <p>Nach Zahlungseingang starten wir sofort mit der Erstellung Ihrer Website.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>Gesamtpreis:</strong> 599 CHF</p>
      <ul>
        <li>Anzahlung: 100 CHF (jetzt zu zahlen)</li>
        <li>Restzahlung: 499 CHF (nach Fertigstellung)</li>
      </ul>
      <p>Vielen Dank!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Deposit received (to support@aidevelo.ai)
 */
export function getDepositReceivedEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign] Anzahlung erhalten - ${data.customerName}`;
  
  const text = `
Anzahlung erhalten

Kunde: ${data.customerName} (${data.customerEmail})
Request ID: ${data.requestId}
Betrag: 100 CHF
Zahlungs-ID: ${data.depositPaymentLink || 'N/A'}

Die Website-Erstellung kann nun gestartet werden.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Anzahlung erhalten</h2>
      <p><strong>Kunde:</strong> ${data.customerName} (${data.customerEmail})</p>
      <p><strong>Request ID:</strong> ${data.requestId}</p>
      <p><strong>Betrag:</strong> 100 CHF</p>
      <p><strong>Zahlungs-ID:</strong> ${data.depositPaymentLink || 'N/A'}</p>
      <p>Die Website-Erstellung kann nun gestartet werden.</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Website ready - Preview link (to customer)
 */
export function getPreviewReadyEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign] Ihre Website ist fertig - Preview`;
  
  const text = `
Guten Tag ${data.customerName},

Ihre Website ist fertig! Sie können sie jetzt testen und anschauen:

${data.previewUrl}

Bitte prüfen Sie die Website und teilen Sie uns mit, ob alles Ihren Vorstellungen entspricht.

Wenn Sie zufrieden sind, erhalten Sie den Link für die Restzahlung (499 CHF) und anschließend die Login-Daten für Domain und Server.

Vielen Dank!
Ihr AIDevelo Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Ihre Website ist fertig!</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>Ihre Website ist fertig! Sie können sie jetzt testen und anschauen:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.previewUrl}" style="display: inline-block; background-color: #DA291C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Website ansehen</a>
      </div>
      <p>Bitte prüfen Sie die Website und teilen Sie uns mit, ob alles Ihren Vorstellungen entspricht.</p>
      <p>Wenn Sie zufrieden sind, erhalten Sie den Link für die Restzahlung (499 CHF) und anschließend die Login-Daten für Domain und Server.</p>
      <p>Vielen Dank!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Final payment link (to customer)
 */
export function getFinalPaymentEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign] Restzahlungslink - 499 CHF`;
  
  const text = `
Guten Tag ${data.customerName},

vielen Dank für Ihre Zustimmung! Bitte zahlen Sie die Restzahlung von 499 CHF:

${data.finalPaymentLink}

Nach Zahlungseingang erhalten Sie die Login-Daten für Domain und Server.

Vielen Dank!
Ihr AIDevelo Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Restzahlungslink</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>vielen Dank für Ihre Zustimmung! Bitte zahlen Sie die Restzahlung von <strong>499 CHF</strong>:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.finalPaymentLink}" style="display: inline-block; background-color: #DA291C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Jetzt 499 CHF zahlen</a>
      </div>
      <p>Nach Zahlungseingang erhalten Sie die Login-Daten für Domain und Server.</p>
      <p>Vielen Dank!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Email: Website delivered - Login credentials (to customer)
 */
export function getLoginCredentialsEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[Webdesign] Login-Daten für Ihre Website`;
  
  const credentials = data.loginCredentials;
  const credentialsText = credentials ? `
Domain: ${credentials.domain || 'N/A'}
Server: ${credentials.server || 'N/A'}
Benutzername: ${credentials.username || 'N/A'}
Passwort: ${credentials.password || 'N/A'}
  `.trim() : 'Wird separat übermittelt';
  
  const text = `
Guten Tag ${data.customerName},

vielen Dank für die Zahlung! Hier sind Ihre Login-Daten für Domain und Server:

${credentialsText}

Ihre Website ist jetzt live und einsatzbereit.

Vielen Dank für Ihr Vertrauen!
Ihr AIDevelo Team
  `.trim();

  const credentialsHtml = credentials ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Domain:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${credentials.domain || 'N/A'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Server:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${credentials.server || 'N/A'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Benutzername:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${credentials.username || 'N/A'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Passwort:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${credentials.password || 'N/A'}</td></tr>
    </table>
  ` : '<p>Wird separat übermittelt</p>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Login-Daten</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>vielen Dank für die Zahlung! Hier sind Ihre Login-Daten für Domain und Server:</p>
      ${credentialsHtml}
      <p>Ihre Website ist jetzt live und einsatzbereit.</p>
      <p>Vielen Dank für Ihr Vertrauen!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}


/**
 * Email: Acknowledgment (to customer)
 */
export function getAcknowledgmentEmail(data: EmailTemplateData): { subject: string; text: string; html: string } {
  const subject = `[AIDevelo Webdesign] Ihre Anfrage ist eingegangen`;
  
  const text = `
Guten Tag ${data.customerName},

vielen Dank für Ihre Webdesign-Anfrage bei AIDevelo. Wir haben Ihre Nachricht erhalten.

Unser Team wird Ihre Angaben und Dateien nun prüfen. Sobald alles bereit ist, erhalten Sie von uns eine Rückmeldung oder direkt den Zahlungslink für die Anzahlung (100 CHF).

Überblick Ihres Projekts:
Art: ${data.requestType === 'new' ? 'Neue Website' : 'Website Redesign'}
Beschreibung: ${data.projectDescription.substring(0, 100)}${data.projectDescription.length > 100 ? '...' : ''}

Nächste Schritte:
1. Review durch unser Team (innerhalb von 24h)
2. Anzahlung von 100 CHF (Link folgt per E-Mail)
3. Umsetzung Ihrer Website

Vielen Dank für Ihr Vertrauen!
Ihr AIDevelo Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DA291C;">Anfrage erhalten</h2>
      <p>Guten Tag ${data.customerName},</p>
      <p>vielen Dank für Ihre Webdesign-Anfrage bei <strong>AIDevelo</strong>. Wir haben Ihre Nachricht erhalten.</p>
      <p>Unser Team wird Ihre Angaben und Dateien nun prüfen. Sobald alles bereit ist, erhalten Sie von uns eine Rückmeldung oder direkt den Zahlungslink für die Anzahlung (100 CHF).</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Überblick Ihres Projekts</h3>
        <p><strong>Art:</strong> ${data.requestType === 'new' ? 'Neue Website' : 'Website Redesign'}</p>
        <p><strong>Anzahl der Dateien:</strong> ${data.phone === 'FILES_COUNT_PLACEHOLDER' ? 'Vorhanden' : 'In Prüfung'}</p>
      </div>

      <h3>Nächste Schritte</h3>
      <ol>
        <li>Review durch unser Team (innerhalb von 24h)</li>
        <li>Anzahlung von <strong>100 CHF</strong> (Link folgt per E-Mail)</li>
        <li>Umsetzung Ihrer Website (2-3 Wochen)</li>
      </ol>

      <p>Vielen Dank für Ihr Vertrauen!<br>Ihr AIDevelo Team</p>
    </div>
  `;

  return { subject, text, html };
}
