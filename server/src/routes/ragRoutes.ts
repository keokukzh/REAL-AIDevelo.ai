import { Router } from 'express';
import multer from 'multer';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
  reEmbedDocument,
} from '../controllers/ragController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept text, markdown, and PDF files
    const allowedMimes = [
      'text/plain',
      'text/markdown',
      'text/md',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed: txt, md, pdf, doc, docx`));
    }
  },
});

/**
 * POST /api/rag/documents
 * Upload document (file or raw text) and embed it
 * 
 * Accepts:
 * - multipart/form-data: file + title (optional)
 * - application/json: { title, text }
 */
router.post('/documents', verifySupabaseAuth, upload.single('file'), uploadDocument);

/**
 * GET /api/rag/documents
 * List documents for authenticated user's location
 */
router.get('/documents', verifySupabaseAuth, listDocuments);

/**
 * DELETE /api/rag/documents/:id
 * Delete document and its chunks from Qdrant
 */
router.delete('/documents/:id', verifySupabaseAuth, deleteDocument);

/**
 * POST /api/rag/documents/:id/embed
 * Re-embed document using stored raw_text
 */
router.post('/documents/:id/embed', verifySupabaseAuth, reEmbedDocument);

export default router;
