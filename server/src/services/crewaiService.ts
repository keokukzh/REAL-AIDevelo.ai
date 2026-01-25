/**
 * CrewAI Content Generation Service Client
 * HTTP client for interacting with the CrewAI content generation service
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { StructuredLoggingService } from './loggingService';

export interface GenerateContentRequest {
  type: 'marketing' | 'agent-prompt' | 'documentation' | 'report';
  topic: string;
  context?: Record<string, any>;
  format: string;
  language?: string;
}

export interface GenerateContentResponse {
  content: string;
  metadata: {
    topic: string;
    content_type: string;
    format: string;
    language: string;
    task_outputs?: Record<string, any>;
    token_usage?: Record<string, any>;
  };
}

export interface ContentType {
  id: string;
  name: string;
  description: string;
  formats: string[];
}

class CrewAIService {
  private client: AxiosInstance;
  private serviceUrl: string;

  constructor() {
    this.serviceUrl =
      process.env.CREWAI_SERVICE_URL || 'http://crewai-service:8000';
    
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 300000, // 5 minutes timeout for content generation
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        StructuredLoggingService.info('CrewAI service request', {
          url: config.url,
          method: config.method,
        });
        return config;
      },
      (error: unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        StructuredLoggingService.error('CrewAI service request error', errorObj);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        StructuredLoggingService.info('CrewAI service response', {
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error: unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        const axiosError = axios.isAxiosError(error) ? error : null;
        StructuredLoggingService.error('CrewAI service response error', errorObj, {
          url: axiosError?.config?.url,
          status: axiosError?.response?.status,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the CrewAI service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.data.status === 'healthy' || response.status === 200;
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      StructuredLoggingService.warn('CrewAI service health check failed', errorObj, {});
      return false;
    }
  }

  /**
   * Get available content types and formats
   */
  async getContentTypes(): Promise<ContentType[]> {
    try {
      const response = await this.client.get<ContentType[]>('/types');
      return response.data;
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      StructuredLoggingService.error('Failed to fetch content types', errorObj);
      throw new Error(`Failed to fetch content types: ${errorObj.message}`);
    }
  }

  /**
   * Generate content using CrewAI
   */
  async generateContent(
    request: GenerateContentRequest
  ): Promise<GenerateContentResponse> {
    try {
      StructuredLoggingService.info('Generating content via CrewAI', {
        type: request.type,
        topic: request.topic.substring(0, 50),
        format: request.format,
      });

      const response = await this.client.post<GenerateContentResponse>(
        '/generate',
        request
      );

      StructuredLoggingService.info('Content generated successfully', {
        type: request.type,
        contentLength: response.data.content.length,
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ detail: string }>;
        const errorMessage =
          axiosError.response?.data?.detail ||
          axiosError.message ||
          'Unknown error';
        
        const errorObj = new Error(errorMessage);
        StructuredLoggingService.error('Content generation failed', errorObj, {
          type: request.type,
          topic: request.topic,
          status: axiosError.response?.status,
        });

        throw errorObj;
      }

      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      StructuredLoggingService.error('Content generation error', errorObj, {
        type: request.type,
        topic: request.topic,
      });

      throw new Error(`Content generation failed: ${errorObj.message}`);
    }
  }

  /**
   * Generate marketing content
   */
  async generateMarketingContent(
    topic: string,
    format: 'blog-post' | 'social-media' | 'email' | 'landing-page',
    context?: Record<string, any>,
    language?: string
  ): Promise<GenerateContentResponse> {
    return this.generateContent({
      type: 'marketing',
      topic,
      format,
      context,
      language,
    });
  }

  /**
   * Generate agent prompt content
   */
  async generateAgentPrompt(
    topic: string,
    format:
      | 'system-prompt'
      | 'greeting'
      | 'conversation-script'
      | 'faq',
    context?: Record<string, any>,
    language?: string
  ): Promise<GenerateContentResponse> {
    return this.generateContent({
      type: 'agent-prompt',
      topic,
      format,
      context,
      language,
    });
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(
    topic: string,
    format: 'user-guide' | 'api-docs' | 'help-article' | 'tutorial',
    context?: Record<string, any>,
    language?: string
  ): Promise<GenerateContentResponse> {
    return this.generateContent({
      type: 'documentation',
      topic,
      format,
      context,
      language,
    });
  }

  /**
   * Generate report content
   */
  async generateReport(
    topic: string,
    format: 'summary' | 'analysis' | 'insights' | 'performance-report',
    context?: Record<string, any>,
    language?: string
  ): Promise<GenerateContentResponse> {
    return this.generateContent({
      type: 'report',
      topic,
      format,
      context,
      language,
    });
  }
}

// Export singleton instance
export const crewaiService = new CrewAIService();
