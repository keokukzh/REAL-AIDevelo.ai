import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { InternalServerError } from '../utils/errors';
import { webdesignContactSchema, WebdesignContactRequest } from '../types/webdesign';
import { validateRequest } from '../middleware/validateRequest';
import { sendMail } from '../services/emailService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Max 10 files
  },
});

/**
 * @swagger
 * /webdesign/contact:
 *   post:
 *     summary: Submit webdesign contact request with optional file attachments
 *     tags: [Webdesign]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional file attachments (ZIP, images, PDF, documents - max 10MB per file, max 10 files)
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
router.post('/contact', (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new InternalServerError('Datei zu groß. Maximale Dateigröße: 10MB pro Datei.'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new InternalServerError('Zu viele Dateien. Maximum: 10 Dateien.'));
        }
      }
      return next(new InternalServerError('Fehler beim Hochladen der Dateien.'));
    }
    next();
  });
}, validateRequest(webdesignContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, company, requestType, currentWebsiteUrl, message }: WebdesignContactRequest = req.body;
    const files = req.files as Express.Multer.File[] || [];

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
    if (requestType === 'redesign' && currentWebsiteUrl) {
      emailTextParts.push(`Aktuelle Website: ${currentWebsiteUrl}`);
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
    const currentWebsiteHtml = (requestType === 'redesign' && currentWebsiteUrl) 
      ? `<p><strong>Aktuelle Website:</strong> <a href="${currentWebsiteUrl}" target="_blank" rel="noopener noreferrer">${currentWebsiteUrl}</a></p>` 
      : '';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DA291C;">Webdesign-Anfrage</h2>
        <p><strong>Von:</strong> ${name} (${email})</p>
        <p><strong>Art:</strong> ${requestTypeLabel}</p>
        ${companyHtml}
        ${phoneHtml}
        ${currentWebsiteHtml}
        <p><strong>Preis:</strong> 500 CHF</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Nachricht:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Eingereicht am: ${new Date().toISOString()}</p>
      </div>
    `;

    // Prepare attachments from uploaded files
    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype || undefined,
    }));

    // Add file info to email content if files were uploaded
    let fileInfoText = '';
    let fileInfoHtml = '';
    if (files.length > 0) {
      const fileListTextParts: string[] = [];
      const fileListHtmlParts: string[] = [];
      
      files.forEach(f => {
        const sizeKB = (f.size / 1024).toFixed(2);
        fileListTextParts.push(`- ${f.originalname} (${sizeKB} KB)`);
        fileListHtmlParts.push(`<li>${f.originalname} (${sizeKB} KB)</li>`);
      });
      
      const fileListText = fileListTextParts.join('\n');
      const fileListHtml = fileListHtmlParts.join('');
      const fileCount = files.length.toString();
      
      fileInfoText = '\n\nAngehängte Dateien (' + fileCount + '):\n' + fileListText;
      fileInfoHtml = '<p><strong>Angehängte Dateien (' + fileCount + '):</strong></p><ul>' + fileListHtml + '</ul>';
    }

    // Send email to support with attachments
    const emailResult = await sendMail({
      to: ['support@aidevelo.ai'],
      subject: emailSubject,
      text: emailText + fileInfoText,
      html: emailHtml + fileInfoHtml,
      attachments: attachments,
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


