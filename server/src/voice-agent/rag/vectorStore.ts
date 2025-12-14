import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { voiceAgentConfig } from '../config';

/**
 * Vector Store Service
 * Manages Qdrant collections per location and handles embeddings
 */
export class VectorStore {
  private qdrantClient: QdrantClient;
  private openaiClient: OpenAI;
  private embeddingModel: string;

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: voiceAgentConfig.vectorDb.qdrantUrl,
      apiKey: voiceAgentConfig.vectorDb.qdrantApiKey || undefined,
      checkCompatibility: false,
    });

    this.openaiClient = new OpenAI({
      apiKey: voiceAgentConfig.vectorDb.embeddingApiKey,
      dangerouslyAllowBrowser: false,
    });

    this.embeddingModel = voiceAgentConfig.vectorDb.embeddingModel;
  }

  /**
   * Get or create collection for a location
   * Collection name: location_<locationId>
   */
  async ensureCollection(locationId: string): Promise<void> {
    const collectionName = `location_${locationId}`;

    try {
      // Check if collection exists
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === collectionName
      );

      if (!exists) {
        // Create collection with 1536 dimensions (OpenAI text-embedding-3-small)
        await this.qdrantClient.createCollection(collectionName, {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        });
        console.log(`[VectorStore] Created collection: ${collectionName}`);
      } else {
        console.log(`[VectorStore] Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to ensure collection for location ${locationId}: ${error}`
      );
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Chunk text into smaller pieces (~500 tokens, sentence-based)
   */
  chunkText(text: string, chunkSize: number = 500): string[] {
    const sentences = text.split(/[.!?]+\s+/).filter((s) => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).length; // Approximate token count

      if (currentChunk.split(/\s+/).length + words > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Store document chunks in vector store
   */
  async storeChunks(
    locationId: string,
    chunks: Array<{
      id: string;
      text: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<void> {
    await this.ensureCollection(locationId);
    const collectionName = `location_${locationId}`;

    // Generate embeddings for all chunks
    const points = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await this.generateEmbedding(chunk.text);
        return {
          id: chunk.id,
          vector: embedding,
          payload: {
            text: chunk.text,
            ...chunk.metadata,
          },
        };
      })
    );

    // Upsert points in batches
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.qdrantClient.upsert(collectionName, {
        wait: true,
        points: batch,
      });
    }
  }

  /**
   * Search for similar chunks
   */
  async search(
    locationId: string,
    query: string,
    limit: number = 5
  ): Promise<Array<{ text: string; score: number; metadata?: Record<string, any> }>> {
    await this.ensureCollection(locationId);
    const collectionName = `location_${locationId}`;

    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.qdrantClient.search(collectionName, {
      vector: queryEmbedding,
      limit,
    });

    return results.map((result) => ({
      text: result.payload?.text as string,
      score: result.score,
      metadata: result.payload as Record<string, any>,
    }));
  }

  /**
   * Delete all chunks for a location
   */
  async deleteLocationData(locationId: string): Promise<void> {
    const collectionName = `location_${locationId}`;
    try {
      await this.qdrantClient.deleteCollection(collectionName);
      console.log(`[VectorStore] Deleted collection: ${collectionName}`);
    } catch (error) {
      // Collection might not exist, ignore
      console.warn(`[VectorStore] Failed to delete collection ${collectionName}: ${error}`);
    }
  }

  /**
   * Delete all chunks for a specific document within a location
   */
  async deleteDocument(locationId: string, documentId: string): Promise<number> {
    const collectionName = `location_${locationId}`;
    
    try {
      // Use scroll to find all points with matching documentId
      const scrollResult = await this.qdrantClient.scroll(collectionName, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId },
            },
          ],
        },
        limit: 10000, // Adjust if needed
      });

      const pointIds = scrollResult.points.map((p) => p.id);

      if (pointIds.length === 0) {
        console.log(`[VectorStore] No chunks found for documentId=${documentId} in collection=${collectionName}`);
        return 0;
      }

      // Delete points by IDs
      await this.qdrantClient.delete(collectionName, {
        wait: true,
        points: pointIds,
      });

      console.log(`[VectorStore] Deleted ${pointIds.length} chunks for documentId=${documentId} in collection=${collectionName}`);
      return pointIds.length;
    } catch (error) {
      console.error(`[VectorStore] Failed to delete document ${documentId} from collection ${collectionName}:`, error);
      throw new Error(`Failed to delete document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const vectorStore = new VectorStore();


