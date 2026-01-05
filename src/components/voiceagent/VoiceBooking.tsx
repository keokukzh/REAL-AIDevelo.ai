import React, { useEffect } from 'react';
import { RevealSection } from '../layout/RevealSection';

export const VoiceBooking: React.FC = () => {
  useEffect(() => {
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    script.setAttribute('async', 'true');
    head?.appendChild(script);

    return () => {
      // Cleanup slightly harder with external scripts, but usually fine to leave or try to remove
      head?.removeChild(script);
    };
  }, []);

  return (
    <RevealSection className="py-24 bg-black relative section-spacing" id="booking">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">Termin buchen</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Wählen Sie einen passenden Zeitpunkt für eine persönliche Demo. Wir zeigen Ihnen, wie
            unsere KI-Lösung Ihr Unternehmen transformieren kann.
          </p>
        </div>

        <div className="w-full min-h-[700px] bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Calendly Inline Widget */}
          <div
            className="calendly-inline-widget w-full h-full min-h-[700px]"
            data-url="https://calendly.com/aidevelo-enterprise?hide_gdpr_banner=1&background_color=0f172a&text_color=ffffff&primary_color=06b6d4"
          />
        </div>
      </div>
    </RevealSection>
  );
};
