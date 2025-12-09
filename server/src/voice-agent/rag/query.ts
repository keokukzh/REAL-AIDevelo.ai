import { vectorStore } from './vectorStore';
import { RAGQueryResult } from '../types';
import { buildMessages, PromptContext } from './promptTemplates';

/**
 * RAG Query Service
 * Handles retrieval, reranking, and prompt construction
 */

export class RAGQueryService {
  /**
   * Query RAG system for a customer
   */
  async query(
    customerId: string,
    query: string,
    limit: number = 5
  ): Promise<RAGQueryResult> {
    // Retrieve similar chunks
    const chunks = await vectorStore.search(customerId, query, limit);

    return {
      chunks: chunks.map((chunk) => ({
        text: chunk.text,
        score: chunk.score,
        metadata: chunk.metadata,
      })),
      query,
      customerId,
    };
  }

  /**
   * Query with reranking (simple similarity-based for now)
   * In production, could use a reranking model
   */
  async queryWithRerank(
    customerId: string,
    query: string,
    initialLimit: number = 10,
    finalLimit: number = 5
  ): Promise<RAGQueryResult> {
    // Get more results initially
    const initialResults = await this.query(customerId, query, initialLimit);

    // Simple reranking: sort by score (already sorted, but we could add more logic)
    const reranked = initialResults.chunks
      .sort((a, b) => b.score - a.score)
      .slice(0, finalLimit);

    return {
      chunks: reranked,
      query,
      customerId,
    };
  }

  /**
   * Build prompt context from query
   */
  buildPromptContext(
    customerId: string,
    userInput: string,
    ragResult: RAGQueryResult,
    additionalContext?: Partial<PromptContext>
  ): PromptContext {
    return {
      customerId,
      ragContext: ragResult,
      conversationHistory: additionalContext?.conversationHistory,
      companyName: additionalContext?.companyName,
      industry: additionalContext?.industry,
      tools: additionalContext?.tools,
    };
  }
}

export const ragQueryService = new RAGQueryService();


