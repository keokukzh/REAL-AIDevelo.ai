import React, { useEffect, useRef } from 'react';
import { loadRetellWidget } from '../../retell/loadRetellWidget';

export const RetellCallbackWidget: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    loadRetellWidget()
      .then(() => {
        if (!mounted) return;
        // The widget script is expected to mount itself into a container with id 'retell-widget'
        // If the vendor exposes a global init function, initialize it here. Keep this generic.
        if ((window as any).Retell && typeof (window as any).Retell.init === 'function') {
          try {
            (window as any).Retell.init({ container: containerRef.current, sessionId });
          } catch (e) {
            console.warn('Retell init failed', e);
          }
        }
      })
      .catch(() => {
        // silent fail — widget optional
      });

    return () => {
      mounted = false;
      // If the widget exposes a destroy/unmount API call it here
      if ((window as any).Retell && typeof (window as any).Retell.destroy === 'function') {
        try {
          (window as any).Retell.destroy();
        } catch {}
      }
    };
  }, [sessionId]);

  return <div id="retell-widget" ref={containerRef} />;
};

export default RetellCallbackWidget;
