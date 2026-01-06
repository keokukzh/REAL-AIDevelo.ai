// Minimal loader for the Retell widget script.
// Reads `VITE_RETELL_WIDGET_URL` from env (non-secret, configured in host) and injects the script.
export function loadRetellWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = import.meta.env.VITE_RETELL_WIDGET_URL as string | undefined;
      if (!url) return resolve();

      if (document.querySelector(`script[data-retell-widget]`)) return resolve();

      const s = document.createElement('script');
      s.setAttribute('data-retell-widget', '1');
      s.src = url;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Retell widget'));
      document.head.appendChild(s);
    } catch (err) {
      reject(err as any);
    }
  });
}

// Auto-load on import in index when widget URL is present.
if (typeof window !== 'undefined') {
  // do not await — best-effort init
  loadRetellWidget().catch(() => {});
}
