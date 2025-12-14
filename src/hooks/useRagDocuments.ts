import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import React from 'react';
import { supabase } from '../lib/supabase';

export interface RagDocument {
  id: string;
  location_id: string;
  title: string;
  original_file_name: string | null;
  mime_type: string | null;
  source: 'upload' | 'text' | 'url';
  status: 'uploaded' | 'embedded' | 'error' | 'queued' | 'processing' | 'ready' | 'failed';
  chunk_count: number;
  error: string | null;
  raw_text?: string | null; // Only included in detail view
  created_at: string;
  updated_at: string;
}

export interface RagDocumentsListResponse {
  success: true;
  data: {
    items: RagDocument[];
  };
}

export interface RagDocumentDetailResponse {
  success: true;
  data: RagDocument;
}

export interface UploadDocumentResponse {
  success: true;
  data: {
    id: string;
    locationId: string;
    title: string;
    fileName: string | null;
    mimeType: string | null;
    source: 'upload' | 'text';
    status: string;
    chunkCount: number;
    createdAt: string;
  };
}

export interface DeleteDocumentResponse {
  success: true;
  data: {
    documentId: string;
    deletedChunkCount: number;
  };
}

export interface ReEmbedDocumentResponse {
  success: true;
  data: {
    documentId: string;
    deletedChunkCount: number;
    newChunkCount: number;
  };
}

/**
 * Hook for managing RAG documents
 */
export const useRagDocuments = () => {
  const [hasSession, setHasSession] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session?.access_token);
      setIsChecking(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const queryClient = useQueryClient();

  // List documents
  const listQuery = useQuery<RagDocumentsListResponse['data'], Error>({
    queryKey: ['ragDocuments'],
    queryFn: async () => {
      const response = await apiClient.get<RagDocumentsListResponse>('/rag/documents');
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to load documents');
      }
      return response.data.data;
    },
    enabled: !isChecking && hasSession,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  // Get single document (with raw_text)
  const useDocument = (documentId: string | null) => {
    return useQuery<RagDocument, Error>({
      queryKey: ['ragDocuments', documentId],
      queryFn: async () => {
        if (!documentId) throw new Error('Document ID is required');
        const response = await apiClient.get<RagDocumentDetailResponse>(`/rag/documents/${documentId}`);
        if (!response.data?.success || !response.data.data) {
          throw new Error('Failed to load document');
        }
        return response.data.data;
      },
      enabled: !isChecking && hasSession && !!documentId,
      staleTime: 60000, // 1 minute
      retry: 1,
    });
  };

  // Upload document (file)
  const uploadMutation = useMutation<UploadDocumentResponse['data'], Error, { file: File; title?: string }>({
    mutationFn: async ({ file, title }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }
      const response = await apiClient.post<UploadDocumentResponse>('/rag/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to upload document');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragDocuments'] });
    },
  });

  // Upload document (text)
  const uploadTextMutation = useMutation<UploadDocumentResponse['data'], Error, { text: string; title: string }>({
    mutationFn: async ({ text, title }) => {
      const response = await apiClient.post<UploadDocumentResponse>('/rag/documents', {
        text,
        title,
      });
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to upload document');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragDocuments'] });
    },
  });

  // Delete document
  const deleteMutation = useMutation<DeleteDocumentResponse['data'], Error, string>({
    mutationFn: async (documentId) => {
      const response = await apiClient.delete<DeleteDocumentResponse>(`/rag/documents/${documentId}`);
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to delete document');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragDocuments'] });
    },
  });

  // Re-embed document
  const reEmbedMutation = useMutation<ReEmbedDocumentResponse['data'], Error, string>({
    mutationFn: async (documentId) => {
      const response = await apiClient.post<ReEmbedDocumentResponse>(`/rag/documents/${documentId}/embed`);
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to re-embed document');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragDocuments'] });
    },
  });

  return {
    documents: listQuery.data?.items || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    upload: uploadMutation.mutateAsync,
    uploadText: uploadTextMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    reEmbed: reEmbedMutation.mutateAsync,
    isUploading: uploadMutation.isPending || uploadTextMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReEmbedding: reEmbedMutation.isPending,
    useDocument,
  };
};
