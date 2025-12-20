import { useEffect } from 'react';

/**
 * ElevenLabs Conversational AI Widget
 * Embeds the ElevenLabs conversational AI widget on all pages
 * 
 * Agent ID: agent_1601kcmqt4efe41bzwykaytm2yrj
 */
export const ElevenLabsWidget: React.FC = () => {
  useEffect(() => {
    const w = globalThis.window;
    const __canDebugLog = w.location.hostname === 'localhost' || w.location.hostname === '127.0.0.1';

    // Load the ElevenLabs widget script if not already loaded
    const scriptId = 'elevenlabs-convai-widget';
    if (document.getElementById(scriptId)) {
      // #region agent log
      if (__canDebugLog) {
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H1_H3',
            location: 'src/components/ElevenLabsWidget.tsx:alreadyLoaded',
            message: 'ElevenLabs widget script already present',
            data: { scriptId },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';

    script.addEventListener('load', () => {
      // #region agent log
      if (__canDebugLog) {
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H1_H3',
            location: 'src/components/ElevenLabsWidget.tsx:scriptLoad',
            message: 'ElevenLabs widget script loaded',
            data: { src: script.src },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
    });

    script.addEventListener('error', () => {
      // #region agent log
      if (__canDebugLog) {
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H1_H3',
            location: 'src/components/ElevenLabsWidget.tsx:scriptError',
            message: 'ElevenLabs widget script failed to load',
            data: { src: script.src },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
    });
    
    document.body.appendChild(script);

    // Cleanup: remove script on unmount (though this component should persist)
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Render the custom element
  return (
    <elevenlabs-convai agent-id="agent_1601kcmqt4efe41bzwykaytm2yrj"></elevenlabs-convai>
  );
};
