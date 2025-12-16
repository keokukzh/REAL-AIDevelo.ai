import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { BadRequestError, InternalServerError, NotFoundError } from '../utils/errors';
import { resolveLocationId } from '../utils/locationIdResolver';
import { documentProcessingService } from '../services/documentProcessingService';
import { vectorStore } from '../voice-agent/rag/vectorStore';
import { supabaseAdmin } from '../services/supabaseDb';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/rag/documents
 * Upload document (file or raw text) and embed it
 */
export const uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[RAGController] Upload document: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    const documentId = uuidv4();
    let title: string;
    let text: string;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let source: 'upload' | 'text';

    // Handle file upload (multipart/form-data)
    if (req.file) {
      source = 'upload';
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      title = req.body.title || fileName || 'Untitled Document';

      // Extract text from file
      text = await documentProcessingService.extractTextFromFile(req.file);
    } else if (req.body.text) {
      // Handle raw text (application/json)
      source = 'text';
      text = req.body.text;
      title = req.body.title || 'Text Document';
      fileName = undefined;
      mimeType = 'text/plain';
    } else {
      return next(new BadRequestError('Either file (multipart/form-data) or text (application/json) is required'));
    }

    if (!text || text.trim().length === 0) {
      return next(new BadRequestError('No text content extracted from document'));
    }

    // Insert document record with status=uploaded
    const { data: docRow, error: insertError } = await supabaseAdmin
      .from('rag_documents')
      .insert({
        id: documentId,
        location_id: locationId,
        title,
        original_file_name: fileName,
        file_type: mimeType,
        mime_type: mimeType,
        source,
        raw_text: text.substring(0, 2 * 1024 * 1024), // Max 2MB
        status: 'uploaded',
        chunk_count: 0,
      })
      .select('id, location_id, title, original_file_name, mime_type, source, status, chunk_count, created_at')
      .single();

    if (insertError || !docRow) {
      console.error('[RAGController] Error inserting document:', insertError);
      return next(new InternalServerError(`Failed to create document record: ${insertError?.message || 'Unknown error'}`));
    }

    try {
      // Process and embed document
      const processed = await documentProcessingService.processDocument(
        locationId,
        documentId,
        text,
        title,
        fileName
      );

      // Update document record with embedded status
      const { error: updateError } = await supabaseAdmin
        .from('rag_documents')
        .update({
          status: 'embedded',
          chunk_count: processed.chunkCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('[RAGController] Error updating document status:', updateError);
        // Don't fail - document is already embedded
      }

      console.log(`[RAGController] Document ${documentId} uploaded and embedded: ${processed.chunkCount} chunks`);

      res.json({
        success: true,
        data: {
          id: docRow.id,
          locationId: docRow.location_id,
          title: docRow.title,
          fileName: docRow.original_file_name,
          mimeType: docRow.mime_type,
          source: docRow.source,
          status: 'embedded',
          chunkCount: processed.chunkCount,
          createdAt: docRow.created_at,
        },
      });
    } catch (error: any) {
      // Update document record with error status
      await supabaseAdmin
        .from('rag_documents')
        .update({
          status: 'error',
          error: error.message || 'Unknown error during embedding',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      console.error('[RAGController] Error processing document:', error);
      return next(new InternalServerError(`Failed to process document: ${error.message || 'Unknown error'}`));
    }
  } catch (error: any) {
    console.error('[RAGController] Error in uploadDocument:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
};

/**
 * GET /api/rag/documents
 * List documents for a location
 */
export const listDocuments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Resolve locationId with better error handling
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[RAGController] List documents: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      console.error('[RAGController] Failed to resolve locationId:', error);
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Query documents with improved error handling
    const { data: documents, error } = await supabaseAdmin
      .from('rag_documents')
      .select('id, location_id, title, original_file_name, mime_type, source, status, chunk_count, error, created_at, updated_at')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RAGController] Supabase error:', error);
      // Check if table exists or schema issue
      if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
        return res.status(500).json({
          success: false,
          error: 'Database schema error',
          message: 'rag_documents table may not exist. Please run migrations.',
          details: error.message,
        });
      }
      // Check for permission/RLS issues
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        return res.status(500).json({
          success: false,
          error: 'Database permission error',
          message: 'Unable to access rag_documents table. Please check RLS policies.',
          details: error.message,
        });
      }
      return next(new InternalServerError(`Failed to list documents: ${error.message || 'Unknown error'}`));
    }

    res.json({
      success: true,
      data: {
        items: documents || [],
      },
    });
  } catch (error: any) {
    console.error('[RAGController] Unexpected error in listDocuments:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
};

/**
 * GET /api/rag/documents/:id
 * Get document details including raw_text
 */
export const getDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const documentId = req.params.id;

    if (!documentId) {
      return next(new BadRequestError('Document ID is required'));
    }

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[RAGController] Get document: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Query document with raw_text
    const { data: document, error } = await supabaseAdmin
      .from('rag_documents')
      .select('id, location_id, title, original_file_name, mime_type, source, status, chunk_count, error, raw_text, created_at, updated_at')
      .eq('id', documentId)
      .eq('location_id', locationId)
      .maybeSingle();

    if (error) {
      console.error('[RAGController] Error fetching document:', error);
      return next(new InternalServerError(`Failed to fetch document: ${error.message || 'Unknown error'}`));
    }

    if (!document) {
      return next(new NotFoundError('Document not found or does not belong to your location'));
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('[RAGController] Error in getDocument:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
};

/**
 * DELETE /api/rag/documents/:id
 * Delete document and its chunks
 */
export const deleteDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const documentId = req.params.id;

    if (!documentId) {
      return next(new BadRequestError('Document ID is required'));
    }

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[RAGController] Delete document: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Verify document belongs to location
    const { data: document, error: findError } = await supabaseAdmin
      .from('rag_documents')
      .select('id, location_id')
      .eq('id', documentId)
      .eq('location_id', locationId)
      .maybeSingle();

    if (findError || !document) {
      return next(new NotFoundError('Document not found or does not belong to your location'));
    }

    // Delete chunks from Qdrant
    let deletedChunkCount = 0;
    try {
      deletedChunkCount = await vectorStore.deleteDocument(locationId, documentId);
      console.log(`[RAGController] Deleted ${deletedChunkCount} chunks for document ${documentId}`);
    } catch (error: any) {
      console.warn(`[RAGController] Failed to delete chunks from Qdrant: ${error.message}`);
      // Continue with DB deletion even if Qdrant deletion fails
    }

    // Delete document record
    const { error: deleteError } = await supabaseAdmin
      .from('rag_documents')
      .delete()
      .eq('id', documentId)
      .eq('location_id', locationId);

    if (deleteError) {
      console.error('[RAGController] Error deleting document:', deleteError);
      return next(new InternalServerError(`Failed to delete document: ${deleteError.message || 'Unknown error'}`));
    }

    res.json({
      success: true,
      data: {
        documentId,
        deletedChunkCount,
      },
    });
  } catch (error: any) {
    console.error('[RAGController] Error in deleteDocument:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
};

/**
 * POST /api/rag/documents/:id/embed
 * Re-embed document using stored raw_text
 */
export const reEmbedDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const documentId = req.params.id;

    if (!documentId) {
      return next(new BadRequestError('Document ID is required'));
    }

    // Resolve locationId
    let locationId: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId,
        email,
      });
      locationId = resolution.locationId;
      console.log(`[RAGController] Re-embed document: resolved locationId=${locationId} from source=${resolution.source}`);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Load document with raw_text
    const { data: document, error: findError } = await supabaseAdmin
      .from('rag_documents')
      .select('id, location_id, title, original_file_name, raw_text')
      .eq('id', documentId)
      .eq('location_id', locationId)
      .maybeSingle();

    if (findError || !document) {
      return next(new NotFoundError('Document not found or does not belong to your location'));
    }

    if (!document.raw_text || document.raw_text.trim().length === 0) {
      return next(new BadRequestError('Document has no stored text content to re-embed'));
    }

    // Delete old chunks
    let deletedChunkCount = 0;
    try {
      deletedChunkCount = await vectorStore.deleteDocument(locationId, documentId);
      console.log(`[RAGController] Deleted ${deletedChunkCount} old chunks for document ${documentId}`);
    } catch (error: any) {
      console.warn(`[RAGController] Failed to delete old chunks: ${error.message}`);
      // Continue with re-embedding
    }

    // Update status to uploaded
    await supabaseAdmin
      .from('rag_documents')
      .update({
        status: 'uploaded',
        chunk_count: 0,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    try {
      // Process and embed document
      const processed = await documentProcessingService.processDocument(
        locationId,
        documentId,
        document.raw_text,
        document.title,
        document.original_file_name || undefined
      );

      // Update document record with embedded status
      const { error: updateError } = await supabaseAdmin
        .from('rag_documents')
        .update({
          status: 'embedded',
          chunk_count: processed.chunkCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('[RAGController] Error updating document status:', updateError);
      }

      console.log(`[RAGController] Document ${documentId} re-embedded: ${processed.chunkCount} chunks`);

      res.json({
        success: true,
        data: {
          documentId,
          deletedChunkCount,
          newChunkCount: processed.chunkCount,
        },
      });
    } catch (error: any) {
      // Update document record with error status
      await supabaseAdmin
        .from('rag_documents')
        .update({
          status: 'error',
          error: error.message || 'Unknown error during re-embedding',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      console.error('[RAGController] Error re-embedding document:', error);
      return next(new InternalServerError(`Failed to re-embed document: ${error.message || 'Unknown error'}`));
    }
  } catch (error: any) {
    console.error('[RAGController] Error in reEmbedDocument:', error);
    next(new InternalServerError(error.message || 'Unknown error'));
  }
};
