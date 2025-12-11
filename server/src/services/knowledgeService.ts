import type { Express } from 'express';
import axios from 'axios';
import { load as loadHtml } from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { documentIngestionService } from '../voice-agent/rag/ingest';
import { knowledgeRepository } from '../repositories/knowledgeRepository';
import { KnowledgeDocument, KnowledgeSourceType, KnowledgeStatus } from '../models/types';

type UploadJob = {
  sourceType: 'upload';
  file: Express.Multer.File;
  title?: string;
  locale?: string;
  tags?: string[];
};

type UrlJob = {
  sourceType: 'url';
  url: string;
  title?: string;
  locale?: string;
  tags?: string[];
};

type IngestJob = (UploadJob | UrlJob) & {
  agentId: string;
  document: KnowledgeDocument;
};

class KnowledgeService {
  private docs: KnowledgeDocument[] = [];
  private queue: IngestJob[] = [];
  private processing = false;

  async listDocuments(agentId?: string): Promise<KnowledgeDocument[]> {
    if (knowledgeRepository.isDatabaseEnabled()) {
      return knowledgeRepository.list(agentId);
    }
    if (!agentId) return this.docs;
    return this.docs.filter((d) => d.agentId === agentId);
  }

  async ingestUpload(params: { agentId: string; file: Express.Multer.File; title?: string; locale?: string; tags?: string[] }): Promise<KnowledgeDocument> {
    if (!params.agentId) {
      throw new Error('agentId is required');
    }
    if (!params.file) {
      throw new Error('file is required');
    }

    const doc = await this.createDocumentRecord({
      agentId: params.agentId,
      sourceType: 'upload',
      title: params.title || params.file.originalname,
      locale: params.locale,
      tags: this.normalizeTags(params.tags),
      fileName: params.file.originalname,
      fileType: params.file.mimetype,
      fileSize: params.file.size,
    });

    await this.enqueue({ agentId: params.agentId, sourceType: 'upload', file: params.file, title: params.title, locale: params.locale, tags: params.tags, document: doc });
    return doc;
  }

  async ingestUrl(params: { agentId: string; url: string; title?: string; locale?: string; tags?: string[] }): Promise<KnowledgeDocument> {
    if (!params.agentId) {
      throw new Error('agentId is required');
    }
    if (!params.url) {
      throw new Error('url is required');
    }

    const doc = await this.createDocumentRecord({
      agentId: params.agentId,
      sourceType: 'url',
      title: params.title || params.url,
      url: params.url,
      locale: params.locale,
      tags: this.normalizeTags(params.tags),
    });

    await this.enqueue({ agentId: params.agentId, sourceType: 'url', url: params.url, title: params.title, locale: params.locale, tags: params.tags, document: doc });
    return doc;
  }

  async getJob(jobId: string): Promise<KnowledgeDocument | undefined | null> {
    if (knowledgeRepository.isDatabaseEnabled()) {
      return knowledgeRepository.findById(jobId);
    }
    return this.docs.find((d) => d.id === jobId);
  }

  // --- Private helpers ---
  private normalizeTags(tags?: string[]): string[] | undefined {
    if (!tags) return undefined;
    return tags.filter(Boolean).map((t) => t.trim()).filter(Boolean);
  }

  private async createDocumentRecord(params: {
    agentId: string;
    sourceType: KnowledgeSourceType;
    title?: string;
    url?: string;
    locale?: string;
    tags?: string[];
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }): Promise<KnowledgeDocument> {
    if (knowledgeRepository.isDatabaseEnabled()) {
      return knowledgeRepository.createDocument(params);
    }

    const now = new Date();
    const doc: KnowledgeDocument = {
      id: uuidv4(),
      agentId: params.agentId,
      sourceType: params.sourceType,
      title: params.title,
      url: params.url,
      locale: params.locale,
      tags: params.tags,
      status: 'queued',
      fileName: params.fileName,
      fileType: params.fileType,
      createdAt: now,
      updatedAt: now,
    };
    this.docs.push(doc);
    return doc;
  }

  private async enqueue(job: IngestJob): Promise<void> {
    this.queue.push(job);
    // Trigger background processing without blocking the request
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;
      await this.processJob(job);
    }

    this.processing = false;
  }

  private async processJob(job: IngestJob): Promise<void> {
    try {
      await this.updateStatus(job.document.id, 'processing');

      const text = job.sourceType === 'upload'
        ? await this.extractTextFromFile(job.file)
        : await this.fetchUrlText(job.url);

      if (!text || !text.trim()) {
        throw new Error('No text content extracted from source');
      }

      const ingestion = await documentIngestionService.ingestDocument(job.agentId, {
        content: text,
        fileName: job.sourceType === 'upload' ? job.file.originalname : job.url,
        fileType: job.sourceType === 'upload' ? job.file.mimetype : 'text/html',
        metadata: {
          sourceType: job.sourceType,
          title: job.title,
          locale: job.locale,
          tags: this.normalizeTags(job.tags),
          url: job.sourceType === 'url' ? job.url : undefined,
        },
      });

      await this.updateStatus(job.document.id, 'ready', ingestion.indexed, null);
    } catch (error: any) {
      const message = error?.message || 'Failed to ingest document';
      await this.updateStatus(job.document.id, 'failed', undefined, message);
    }
  }

  private async updateStatus(id: string, status: KnowledgeStatus, chunkCount?: number, error?: string | null): Promise<void> {
    if (knowledgeRepository.isDatabaseEnabled()) {
      await knowledgeRepository.updateStatus({ id, status, chunkCount, error: error ?? null });
      return;
    }

    const doc = this.docs.find((d) => d.id === id);
    if (doc) {
      doc.status = status;
      doc.chunkCount = chunkCount;
      doc.error = error ?? undefined;
      doc.updatedAt = new Date();
    }
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const mime = (file.mimetype || '').toLowerCase();

    if (mime.includes('pdf')) {
      // Lazy import to keep startup fast
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const result = await pdfParse(file.buffer);
      return typeof result?.text === 'string' ? result.text : '';
    }

    if (mime.includes('wordprocessingml') || mime.includes('msword')) {
      const mammoth: any = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return typeof result?.value === 'string' ? result.value : '';
    }

    // Fallback: treat as UTF-8 text/markdown
    return file.buffer.toString('utf-8');
  }

  private async fetchUrlText(url: string): Promise<string> {
    const response = await axios.get(url, { timeout: 10000 });
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const $ = loadHtml(html);
    const text = $('body').text() || '';
    return text.replace(/\s+/g, ' ').trim();
  }
}

export const knowledgeService = new KnowledgeService();
