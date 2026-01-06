import { useCallback } from 'react';

type CreateSessionResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export function useRetell() {
  const createSession = useCallback(async (payload: { [k: string]: any } = {}) => {
    const resp = await fetch('/api/retell/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await resp.json()) as CreateSessionResponse;
    if (!data.success) throw new Error(data.error || 'Failed to create Retell session');
    return data.data;
  }, []);

  return { createSession };
}
