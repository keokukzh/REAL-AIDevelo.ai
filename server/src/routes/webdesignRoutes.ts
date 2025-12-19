import { Router, Request, Response, NextFunction } from 'express';
import { InternalServerError } from '../utils/errors';
import { webdesignContactSchema, WebdesignContactRequest } from '../types/webdesign';
import { validateRequest } from '../middleware/validateRequest';
import { sendMail } from '../services/emailService';

const router = Router();

/**
 * @swagger
 * /webdesign/contact:
 *   post:
 *     summary: Submit webdesign contact request
 *     tags: [Webdesign]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - requestType
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number (optional)
 *               company:
 *                 type: string
 *                 description: Company name (optional)
 *               requestType:
 *                 type: string
 *                 enum: [new, redesign]
 *                 description: Type of request - new website or redesign
 *               message:
 *                 type: string
 *                 description: Project description (minimum 12 characters)
 *     responses:
 *       200:
 *         description: Webdesign request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation failed
 *       500:
 *         description: Internal server error
 */
router.post('/contact', validateRequest(webdesignContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, company, requestType, message }: WebdesignContactRequest = req.body;

    // Prepare email content
    const requestTypeLabel = requestType === 'new' ? 'Neue Website' : 'Website Redesign';
    const emailSubject = `[Webdesign Anfrage] ${requestTypeLabel} - ${name}`;
    
    // Build email text
    let emailTextParts = [
      `Webdesign-Anfrage von ${name} (${email})`,
      '',
      `Art: ${requestTypeLabel}`,
    ];
    if (company) {
      emailTextParts.push(`Firma: ${company}`);
    }
    if (phone) {
      emailTextParts.push(`Telefon: ${phone}`);
    }
    emailTextParts.push(
      '',
      `Nachricht:\n${message}`,
      '',
      '---',
      'Preis: 500 CHF',
      `Eingereicht am: ${new Date().toISOString()}`
    );
    const emailText = emailTextParts.join('\n');
    
    // Build email HTML
    const companyHtml = company ? `<p><strong>Firma:</strong> ${company}</p>` : '';
    const phoneHtml = phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : '';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DA291C;">Webdesign-Anfrage</h2>
        <p><strong>Von:</strong> ${name} (${email})</p>
        <p><strong>Art:</strong> ${requestTypeLabel}</p>
        ${companyHtml}
        ${phoneHtml}
        <p><strong>Preis:</strong> 500 CHF</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Nachricht:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Eingereicht am: ${new Date().toISOString()}</p>
      </div>
    `;

    // Send email to support
    const emailResult = await sendMail({
      to: ['support@aidevelo.ai'],
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('[Webdesign] Failed to send email:', emailResult.error);
      return next(new InternalServerError('Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.'));
    }

    console.log('[Webdesign] Contact request submitted', {
      name,
      email,
      requestType,
      company,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Ihre Webdesign-Anfrage wurde erfolgreich übermittelt. Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    });
  } catch (error) {
    console.error('[Webdesign] Error processing contact request:', error);
    next(new InternalServerError('Fehler beim Verarbeiten der Anfrage'));
  }
});

export default router;
