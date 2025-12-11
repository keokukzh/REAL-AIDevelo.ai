import { KnowledgeDocument, KnowledgeSourceType, KnowledgeStatus } from '../models/types';
import { getPool, query } from '../services/database';

interface KnowledgeRow {
  id: string;
  agent_id: string;
  source_type: KnowledgeSourceType;
  title?: string | null;
  url?: string | null;
  locale?: string | null;
  tags?: string[] | null;
  status: KnowledgeStatus;
  chunk_count?: number | null;
  error?: string | null;
  original_file_name?: string | null;
  file_type?: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: KnowledgeRow): KnowledgeDocument {
  return {
    id: row.id,
    agentId: row.agent_id,
    sourceType: row.source_type,
    title: row.title ?? undefined,
    url: row.url ?? undefined,
    locale: row.locale ?? undefined,
    tags: row.tags ?? undefined,
    status: row.status,
    chunkCount: row.chunk_count ?? undefined,
    error: row.error ?? undefined,
    fileName: row.original_file_name ?? undefined,
    fileType: row.file_type ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const knowledgeRepository = {
  isDatabaseEnabled(): boolean {
    return Boolean(getPool());
  },

  async list(agentId?: string): Promise<KnowledgeDocument[]> {
    if (!getPool()) return [];

    const rows = await query<KnowledgeRow>(
      `SELECT id, agent_id, source_type, title, url, locale, tags, status, chunk_count, error, original_file_name, file_type, created_at, updated_at
       FROM rag_documents
       ${agentId ? 'WHERE agent_id = $1' : ''}
       ORDER BY created_at DESC`,
      agentId ? [agentId] : []
    );

    return rows.map(mapRow);
  },

  async findById(id: string): Promise<KnowledgeDocument | null> {
    if (!getPool()) return null;

    const rows = await query<KnowledgeRow>(
      `SELECT id, agent_id, source_type, title, url, locale, tags, status, chunk_count, error, original_file_name, file_type, created_at, updated_at
       FROM rag_documents
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  async createDocument(params: {
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
    const rows = await query<KnowledgeRow>(
      `INSERT INTO rag_documents (agent_id, name, source_type, title, url, locale, tags, status, file_size, file_type, original_file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', $8, $9, $10)
       RETURNING id, agent_id, source_type, title, url, locale, tags, status, chunk_count, error, original_file_name, file_type, created_at, updated_at`,
      [
        params.agentId,
        params.title || params.fileName || params.url || 'Knowledge Document',
        params.sourceType,
        params.title || null,
        params.url || null,
        params.locale || null,
        params.tags || null,
        params.fileSize || null,
        params.fileType || null,
        params.fileName || null,
      ]
    );

    return mapRow(rows[0]);
  },

  async updateStatus(params: {
    id: string;
    status: KnowledgeStatus;
    chunkCount?: number;
    error?: string | null;
  }): Promise<KnowledgeDocument | null> {
    if (!getPool()) return null;

    const rows = await query<KnowledgeRow>(
      `UPDATE rag_documents
       SET status = $2,
           chunk_count = COALESCE($3, chunk_count),
           error = $4,
           updated_at = now()
       WHERE id = $1
       RETURNING id, agent_id, source_type, title, url, locale, tags, status, chunk_count, error, original_file_name, file_type, created_at, updated_at`,
      [params.id, params.status, params.chunkCount ?? null, params.error ?? null]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },
};
