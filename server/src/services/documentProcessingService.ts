import { vectorStore } from '../voice-agent/rag/vectorStore';

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    documentId: string;
    title: string;
    fileName?: string;
    chunkIndex: number;
    createdAt: string;
  };
}

export interface ProcessedDocument {
  documentId: string;
  chunks: DocumentChunk[];
  chunkCount: number;
}

/**
 * Document Processing Service
 * Handles text extraction, chunking, and embedding for RAG documents
 */
export class DocumentProcessingService {
  /**
   * Extract text from file buffer based on MIME type
   */
  async extractTextFromFile(file: { buffer: Buffer; mimetype?: string; originalname?: string }): Promise<string> {
    const mime = (file.mimetype || '').toLowerCase();

    if (mime.includes('pdf')) {
      try {
        const pdfParseModule: any = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const result = await pdfParse(file.buffer);
        return typeof result?.text === 'string' ? result.text : '';
      } catch (error) {
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (mime.includes('wordprocessingml') || mime.includes('msword')) {
      try {
        const mammoth: any = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return typeof result?.value === 'string' ? result.value : '';
      } catch (error) {
        throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fallback: treat as UTF-8 text/markdown
    return file.buffer.toString('utf-8');
  }

  /**
   * Normalize whitespace in text
   */
  normalizeWhitespace(text: string): string {
    // Replace multiple spaces/newlines with single space, but preserve paragraph breaks
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
      .trim();
  }

  /**
   * Chunk text into smaller pieces with overlap
   * @param text Input text
   * @param chunkSize Target chunk size in characters (default: 1000)
   * @param overlap Overlap size in characters (default: 200)
   */
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const normalized = this.normalizeWhitespace(text);
    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      let end = start + chunkSize;

      // If not at the end, try to break at sentence boundary
      if (end < normalized.length) {
        // Look for sentence endings within last 200 chars
        const searchStart = Math.max(start, end - 200);
        const sentenceEnd = normalized.lastIndexOf('.', end);
        const questionEnd = normalized.lastIndexOf('?', end);
        const exclamationEnd = normalized.lastIndexOf('!', end);
        const maxEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);

        if (maxEnd > searchStart) {
          end = maxEnd + 1; // Include the punctuation
        } else {
          // Fallback: break at word boundary
          const wordEnd = normalized.lastIndexOf(' ', end);
          if (wordEnd > start) {
            end = wordEnd;
          }
        }
      }

      const chunk = normalized.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = end - overlap;
      if (start < 0) start = 0;
      if (start >= normalized.length) break;
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Process document: extract text, chunk, and create embeddings
   */
  async processDocument(
    locationId: string,
    documentId: string,
    text: string,
    title: string,
    fileName?: string
  ): Promise<ProcessedDocument> {
    // Normalize and chunk text
    const normalizedText = this.normalizeWhitespace(text);
    const textChunks = this.chunkText(normalizedText, 1000, 200);

    if (textChunks.length === 0) {
      throw new Error('No text content extracted from document');
    }

    // Create chunks with metadata
    const chunks: DocumentChunk[] = textChunks.map((chunkText, index) => ({
      id: `${documentId}:${index}`,
      text: chunkText,
      metadata: {
        documentId,
        title,
        fileName,
        chunkIndex: index,
        createdAt: new Date().toISOString(),
      },
    }));

    // Store chunks in vector store
    await vectorStore.storeChunks(
      locationId,
      chunks.map((chunk) => ({
        id: chunk.id,
        text: chunk.text,
        metadata: chunk.metadata,
      }))
    );

    console.log(`[DocumentProcessingService] Processed document ${documentId}: ${chunks.length} chunks stored`);

    return {
      documentId,
      chunks,
      chunkCount: chunks.length,
    };
  }

  /**
   * Process document from file
   */
  async processFile(
    locationId: string,
    documentId: string,
    file: { buffer: Buffer; mimetype?: string; originalname?: string },
    title: string
  ): Promise<ProcessedDocument> {
    const extractedText = await this.extractTextFromFile(file);
    return this.processDocument(locationId, documentId, extractedText, title, file.originalname);
  }
}

export const documentProcessingService = new DocumentProcessingService();
