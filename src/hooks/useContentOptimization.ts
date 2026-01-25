import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../services/apiBase';

export interface OptimizeContentRequest {
  currentContent: string;
  context?: Record<string, any>;
  language?: string;
}

export interface OptimizeContentResponse {
  optimizedContent: string;
  suggestions?: string[];
  hint?: string;
}

export interface ContentVariationsResponse {
  variations: string[];
}

export const useContentOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const optimizeContent = useCallback(
    async (request: OptimizeContentRequest): Promise<OptimizeContentResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/webdesign/content/optimize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to optimize content' })) as { error?: string; message?: string; hint?: string };
          const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
          const error = new Error(errorMessage) as Error & { hint?: string };
          error.hint = errorData.hint;
          setHint(errorData.hint || null);
          throw error;
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to optimize content';
        setError(errorMessage);
        console.error('Content optimization error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getVariations = useCallback(
    async (request: OptimizeContentRequest): Promise<ContentVariationsResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/webdesign/content/variations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to get variations' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get content variations';
        setError(errorMessage);
        console.error('Content variations error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    optimizeContent,
    getVariations,
    loading,
    error,
    hint,
  };
};
