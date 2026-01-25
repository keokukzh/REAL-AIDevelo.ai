import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { InternalServerError } from '../utils/errors';
import { webdesignContactSchema, WebdesignContactRequest } from '../types/webdesign';
import { validateRequest } from '../middleware/validateRequest';
import { sendMail } from '../services/emailService';
import { createWebdesignRequest } from '../services/webdesignRequestService';
import { getNewRequestEmail, getAcknowledgmentEmail } from '../services/webdesignEmailTemplates';
import { crewaiService } from '../services/crewaiService';
import { StructuredLoggingService } from '../services/loggingService';

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

    // Save to database
    const fileMetadata = files.map(file => ({
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
    }));

    const webdesignRequest = await createWebdesignRequest({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      company: company,
      request_type: requestType,
      current_website_url: currentWebsiteUrl,
      project_description: message,
      files: fileMetadata,
    });

    // Prepare email content using template
    const emailTemplate = getNewRequestEmail({
      customerName: name,
      customerEmail: email,
      requestId: webdesignRequest.id,
      requestType: requestType,
      company: company,
      phone: phone,
      currentWebsiteUrl: currentWebsiteUrl,
      projectDescription: message,
    });

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
      subject: emailTemplate.subject,
      text: emailTemplate.text + fileInfoText,
      html: emailTemplate.html + fileInfoHtml,
      attachments: attachments,
    });

    // Send acknowledgment email to customer
    const ackTemplate = getAcknowledgmentEmail({
      customerName: name,
      customerEmail: email,
      requestId: webdesignRequest.id,
      requestType: requestType,
      projectDescription: message,
      phone: files.length > 0 ? 'FILES_COUNT_PLACEHOLDER' : undefined,
    });

    await sendMail({
      to: [email],
      subject: ackTemplate.subject,
      text: ackTemplate.text,
      html: ackTemplate.html,
    });

    if (!emailResult.success) {
      console.error('[Webdesign] Failed to send email:', emailResult.error);
      return next(new InternalServerError('Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.'));
    }

    console.log('[Webdesign] Contact request submitted', {
      id: webdesignRequest.id,
      name,
      email,
      requestType,
      company,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        requestId: webdesignRequest.id,
        status: webdesignRequest.status,
      },
      message: 'Ihre Webdesign-Anfrage wurde erfolgreich übermittelt. Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    });
  } catch (error) {
    console.error('[Webdesign] Error processing contact request:', error);
    next(new InternalServerError('Fehler beim Verarbeiten der Anfrage'));
  }
});

/**
 * POST /api/webdesign/content/optimize
 * Optimize webdesign page content using CrewAI
 */
router.post('/content/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      section, // 'hero', 'cta', 'feature', 'meta', etc.
      currentContent,
      context = {},
      language = 'de-CH',
    } = req.body;

    if (!section || !currentContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: section and currentContent',
      });
    }

    StructuredLoggingService.info('Webdesign content optimization request', {
      section,
      contentLength: currentContent.length,
      language,
    });

    const result = await crewaiService.generateMarketingContent(
      `Optimize ${section} content for webdesign landing page`,
      'landing-page',
      {
        currentContent,
        targetAudience: 'Swiss SMEs',
        goal: 'increase conversions',
        ...context,
      },
      language
    );

    StructuredLoggingService.info('Webdesign content optimization completed', {
      section,
      originalLength: currentContent.length,
      optimizedLength: result.content.length,
    });

    res.json({
      success: true,
      original: currentContent,
      optimized: result.content,
      metadata: result.metadata,
    });
  } catch (error) {
    StructuredLoggingService.error('Webdesign content optimization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      section: req.body.section,
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/webdesign/content/variations
 * Generate multiple variations of content for A/B testing
 */
router.post('/content/variations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      content,
      variations = ['benefit-focused', 'urgency', 'curiosity'],
      language = 'de-CH',
    } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content',
      });
    }

    StructuredLoggingService.info('Generating webdesign content variations', {
      variationCount: variations.length,
      language,
    });

    const results = await Promise.all(
      variations.map((variation: string) =>
        crewaiService.generateMarketingContent(
          `Create ${variation} variation of: ${content}`,
          'landing-page',
          {
            variation,
            original: content,
            targetAudience: 'Swiss SMEs',
            goal: 'increase conversions',
          },
          language
        )
      )
    );

    StructuredLoggingService.info('Webdesign content variations generated', {
      count: results.length,
    });

    res.json({
      success: true,
      variations: results.map((r) => ({
        content: r.content,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    StructuredLoggingService.error('Webdesign variation generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


