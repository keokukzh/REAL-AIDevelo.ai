const RETELL_API_BASE = process.env.RETELL_API_BASE || 'https://api.retell.example/v1';
const RETELL_API_KEY = process.env.RETELL_API_KEY || '';

export async function createRetellSession(payload: Record<string, any> = {}) {
  if (!RETELL_API_KEY) {
    throw new Error('RETELL_API_KEY not configured');
  }

  const url = `${RETELL_API_BASE}/sessions`;
  const resp = await (globalThis as any).fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RETELL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Retell API error: ${resp.status} ${txt}`);
  }

  return resp.json();
}
