import { useEffect } from 'react';

/**
 * ElevenLabs Conversational AI Widget
 * Embeds the ElevenLabs conversational AI widget on all pages
 * 
 * Agent ID: agent_1601kcmqt4efe41bzwykaytm2yrj
 */
export const ElevenLabsWidget: React.FC = () => {
  useEffect(() => {
    // Load the ElevenLabs widget script if not already loaded
    const scriptId = 'elevenlabs-convai-widget';
    if (document.getElementById(scriptId)) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
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
