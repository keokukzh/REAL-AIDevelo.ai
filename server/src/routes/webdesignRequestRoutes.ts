import { Router, Request, Response, NextFunction } from 'express';
import { InternalServerError, BadRequestError } from '../utils/errors';
import { getWebdesignRequestById, updateWebdesignRequestStatus, getAllWebdesignRequests } from '../services/webdesignRequestService';
import { createTwintPaymentLink } from '../services/twintPaymentService';
import { sendMail } from '../services/emailService';
import {
  getNewRequestEmail,
  getMissingInfoEmail,
  getDepositPaymentEmail,
  getDepositReceivedEmail,
  getPreviewReadyEmail,
  getFinalPaymentEmail,
  getLoginCredentialsEmail,
} from '../services/webdesignEmailTemplates';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/webdesign-requests
 * Get all webdesign requests (admin only)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add admin authentication check
    const requests = await getAllWebdesignRequests();
    sendSuccess(res, { requests }, 'Webdesign requests retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webdesign-requests/:id
 * Get a specific webdesign request
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getWebdesignRequestById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Webdesign request not found',
      });
    }
    
    sendSuccess(res, { request }, 'Webdesign request retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/request-info
 * Request missing information from customer
 */
router.post('/:id/request-info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { missingInfo } = req.body;
    
    if (!missingInfo || !Array.isArray(missingInfo) || missingInfo.length === 0) {
      return next(new BadRequestError('Missing information list is required'));
    }
    
    const request = await getWebdesignRequestById(id);
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    // Update status
    await updateWebdesignRequestStatus(id, 'info_requested');
    
    // Send email to customer
    const emailTemplate = getMissingInfoEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      missingInfo,
    });
    
    await sendMail({
      to: [request.customer_email],
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    
    sendSuccess(res, { requestId: id }, 'Information request sent to customer');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/send-deposit-link
 * Generate and send deposit payment link
 */
router.post('/:id/send-deposit-link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getWebdesignRequestById(id);
    
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    if (request.status !== 'pending' && request.status !== 'info_requested') {
      return next(new BadRequestError(`Cannot send deposit link for request with status: ${request.status}`));
    }
    
    // Create payment link
    const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || 'https://aidevelo.ai';
    const payment = await createTwintPaymentLink({
      amount: 10000, // 100 CHF in cents
      currency: 'CHF',
      description: `Webdesign Anzahlung - ${request.request_type === 'new' ? 'Neue Website' : 'Redesign'}`,
      customerEmail: request.customer_email,
      customerName: request.customer_name,
      requestId: request.id,
      returnUrl: `${baseUrl}/payment/deposit-success?requestId=${request.id}`,
    });
    
    // Update request with payment link
    await updateWebdesignRequestStatus(id, 'deposit_pending', {
      deposit_payment_link: payment.paymentLink,
      deposit_payment_id: payment.paymentId,
    });
    
    // Send email to customer
    const emailTemplate = getDepositPaymentEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      depositPaymentLink: payment.paymentLink,
    });
    
    await sendMail({
      to: [request.customer_email],
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    
    // Send notification to support
    const supportEmail = getDepositReceivedEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      depositPaymentLink: payment.paymentLink,
    });
    
    await sendMail({
      to: ['support@aidevelo.ai'],
      subject: supportEmail.subject,
      text: supportEmail.text,
      html: supportEmail.html,
    });
    
    sendSuccess(res, { 
      requestId: id,
      paymentLink: payment.paymentLink,
    }, 'Deposit payment link sent to customer');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/confirm-deposit
 * Confirm deposit payment (called after payment verification)
 */
router.post('/:id/confirm-deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getWebdesignRequestById(id);
    
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    // Update status to deposit_paid and in_progress
    await updateWebdesignRequestStatus(id, 'deposit_paid');
    await updateWebdesignRequestStatus(id, 'in_progress');
    
    sendSuccess(res, { requestId: id }, 'Deposit confirmed, website creation started');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/send-preview
 * Send preview link to customer
 */
router.post('/:id/send-preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { previewUrl } = req.body;
    
    if (!previewUrl) {
      return next(new BadRequestError('Preview URL is required'));
    }
    
    const request = await getWebdesignRequestById(id);
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    // Update request with preview URL
    await updateWebdesignRequestStatus(id, 'preview_sent', {
      preview_url: previewUrl,
    });
    
    // Send email to customer
    const emailTemplate = getPreviewReadyEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      previewUrl,
    });
    
    await sendMail({
      to: [request.customer_email],
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    
    sendSuccess(res, { requestId: id }, 'Preview link sent to customer');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/send-final-payment-link
 * Generate and send final payment link
 */
router.post('/:id/send-final-payment-link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getWebdesignRequestById(id);
    
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    if (request.status !== 'preview_sent') {
      return next(new BadRequestError(`Cannot send final payment link for request with status: ${request.status}`));
    }
    
    // Create payment link
    const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || 'https://aidevelo.ai';
    const payment = await createTwintPaymentLink({
      amount: 49900, // 499 CHF in cents
      currency: 'CHF',
      description: `Webdesign Restzahlung - ${request.request_type === 'new' ? 'Neue Website' : 'Redesign'}`,
      customerEmail: request.customer_email,
      customerName: request.customer_name,
      requestId: request.id,
      returnUrl: `${baseUrl}/payment/final-success?requestId=${request.id}`,
    });
    
    // Update request with payment link
    await updateWebdesignRequestStatus(id, 'final_payment_pending', {
      final_payment_link: payment.paymentLink,
      final_payment_id: payment.paymentId,
    });
    
    // Send email to customer
    const emailTemplate = getFinalPaymentEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      finalPaymentLink: payment.paymentLink,
    });
    
    await sendMail({
      to: [request.customer_email],
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    
    sendSuccess(res, { 
      requestId: id,
      paymentLink: payment.paymentLink,
    }, 'Final payment link sent to customer');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webdesign-requests/:id/confirm-final-payment
 * Confirm final payment and send login credentials
 */
router.post('/:id/confirm-final-payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { loginCredentials } = req.body;
    
    if (!loginCredentials) {
      return next(new BadRequestError('Login credentials are required'));
    }
    
    const request = await getWebdesignRequestById(id);
    if (!request) {
      return next(new BadRequestError('Webdesign request not found'));
    }
    
    // Update request with login credentials and mark as completed
    await updateWebdesignRequestStatus(id, 'final_payment_paid', {
      login_credentials: loginCredentials,
    });
    await updateWebdesignRequestStatus(id, 'completed');
    
    // Send email to customer with login credentials
    const emailTemplate = getLoginCredentialsEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      requestType: request.request_type,
      projectDescription: request.project_description,
      loginCredentials,
    });
    
    await sendMail({
      to: [request.customer_email],
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    
    sendSuccess(res, { requestId: id }, 'Final payment confirmed, login credentials sent');
  } catch (error) {
    next(error);
  }
});

export default router;

