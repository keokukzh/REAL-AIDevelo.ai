import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError, InternalServerError } from '../utils/errors';

const router = Router();

interface EnterpriseContactRequest {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
}

/**
 * @swagger
 * /enterprise/contact:
 *   post:
 *     summary: Submit enterprise contact request
 *     tags: [Enterprise]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - company
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               company:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact request submitted successfully
 */
router.post('/contact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, company, email, phone, message }: EnterpriseContactRequest = req.body;

    // Validation
    if (!name || !company || !email || !message) {
      return next(new BadRequestError('Name, Firma, E-Mail und Nachricht sind erforderlich'));
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new BadRequestError('Ungültige E-Mail-Adresse'));
    }

    // In production, this would:
    // 1. Save to database
    // 2. Send email notification to sales team
    // 3. Create ticket in CRM
    
    // For now, just log and return success
    console.log('[Enterprise Contact]', {
      name,
      company,
      email,
      phone,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 500));

    res.json({
      success: true,
      message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    });
  } catch (error) {
    next(new InternalServerError('Fehler beim Verarbeiten der Anfrage'));
  }
});

export default router;

