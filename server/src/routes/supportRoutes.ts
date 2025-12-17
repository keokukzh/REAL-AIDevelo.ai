import { Router, Request, Response, NextFunction } from 'express';
import { InternalServerError } from '../utils/errors';
import { supportContactSchema, SupportContactRequest } from '../types/support';
import { validateRequest } from '../middleware/validateRequest';
import { sendMail } from '../services/emailService';

const router = Router();

/**
 * @swagger
 * /support/contact:
 *   post:
 *     summary: Submit support contact request
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               subject:
 *                 type: string
 *                 description: Subject of the support request
 *               message:
 *                 type: string
 *                 description: Support message (minimum 12 characters)
 *     responses:
 *       200:
 *         description: Support request submitted successfully
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
router.post('/contact', validateRequest(supportContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, subject, message }: SupportContactRequest = req.body;

    // Prepare email content
    const emailSubject = `[Support Request] ${subject}`;
    const emailText = `Support Request from ${name} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nSubmitted at: ${new Date().toISOString()}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DA291C;">Support Request</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toISOString()}</p>
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
      console.error('[Support] Failed to send email:', emailResult.error);
      return next(new InternalServerError('Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.'));
    }

    console.log('[Support] Contact request submitted', {
      name,
      email,
      subject,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Ihre Support-Anfrage wurde erfolgreich übermittelt. Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    });
  } catch (error) {
    console.error('[Support] Error processing contact request:', error);
    next(new InternalServerError('Fehler beim Verarbeiten der Anfrage'));
  }
});

export default router;
