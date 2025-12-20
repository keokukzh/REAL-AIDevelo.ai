import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WebchatWidget } from '../components/chat/WebchatWidget';
import { ROUTES } from '../config/navigation';
import { BackButton } from '../components/navigation/BackButton';

export const DemoChatPage = () => {
  const [searchParams] = useSearchParams();
  const widgetKey = searchParams.get('widgetKey') || '';

  // If no widgetKey, show info message
  if (!widgetKey) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <main className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Webchat Demo</h1>
            <p className="text-gray-400 mb-8">
              Bitte geben Sie einen widgetKey als URL-Parameter an, z.B.:
            </p>
            <code className="block bg-slate-900 p-4 rounded-lg text-left text-sm">
              /demo-chat?widgetKey=your-widget-key-here
            </code>
            <div className="mt-8">
              <BackButton to={ROUTES.HOME} label="Zurück zur Startseite" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <BackButton to={ROUTES.HOME} label="Zurück zur Startseite" />
          </div>
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Webchat Demo</h1>
            <p className="text-gray-400">
              Testen Sie den AIDevelo Webchat-Assistenten
            </p>
          </div>

          <div className="bg-slate-950 rounded-lg p-6 border border-slate-800">
            <div style={{ height: '600px' }}>
              <WebchatWidget widgetKey={widgetKey} />
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400 text-center">
            <p>
              Dieser Chat-Assistent nutzt dieselbe KI und Wissensbasis wie der Voice-Agent.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
