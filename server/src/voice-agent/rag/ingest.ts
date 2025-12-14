import { v4 as uuidv4 } from 'uuid';
import { vectorStore } from './vectorStore';
import { RAGDocument } from '../types';

/**
 * Document Ingestion Service
 * Handles document upload, text extraction, chunking, and indexing
 */

interface DocumentInput {
  content: string; // Raw text content
  fileName?: string;
  fileType?: string;
  metadata?: Record<string, any>;
}

export class DocumentIngestionService {
  /**
   * Ingest documents for a location
   */
  async ingestDocuments(
    locationId: string,
    documents: DocumentInput[]
  ): Promise<{ indexed: number; documentIds: string[] }> {
    const documentIds: string[] = [];
    let totalChunks = 0;

    for (const doc of documents) {
      const documentId = uuidv4();

      // Chunk the document
      const chunks = vectorStore.chunkText(doc.content);

      // Prepare chunks with IDs
      const chunkedData = chunks.map((chunk, index) => ({
        id: `${documentId}_chunk_${index}`,
        text: chunk,
        metadata: {
          documentId,
          chunkIndex: index,
          fileName: doc.fileName,
          fileType: doc.fileType,
          ...doc.metadata,
        },
      }));

      // Store in vector DB
      await vectorStore.storeChunks(locationId, chunkedData);

      documentIds.push(documentId);
      totalChunks += chunks.length;
    }

    return {
      indexed: totalChunks,
      documentIds,
    };
  }

  /**
   * Ingest a single document
   */
  async ingestDocument(
    locationId: string,
    document: DocumentInput
  ): Promise<{ indexed: number; documentId: string }> {
    const result = await this.ingestDocuments(locationId, [document]);
    return {
      indexed: result.indexed,
      documentId: result.documentIds[0],
    };
  }

  /**
   * Delete all documents for a location
   */
  async deleteLocationDocuments(locationId: string): Promise<void> {
    await vectorStore.deleteLocationData(locationId);
  }
}

export const documentIngestionService = new DocumentIngestionService();


