import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../services/apiBase';
import { supabase } from '../../lib/supabase';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const ConnectionDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Check Supabase Configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    results.push({
      name: 'Supabase Konfiguration',
      status: supabaseUrl && supabaseAnonKey ? 'success' : 'error',
      message: supabaseUrl && supabaseAnonKey 
        ? 'Supabase Environment-Variablen sind gesetzt'
        : 'VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlen',
      details: supabaseUrl 
        ? `URL: ${supabaseUrl.substring(0, 30)}...` 
        : 'Bitte setze VITE_SUPABASE_URL in .env oder Cloudflare Pages',
    });

    // 2. Check Supabase Connection
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        results.push({
          name: 'Supabase Verbindung',
          status: 'error',
          message: `Verbindungsfehler: ${error.message}`,
          details: 'Supabase-Server ist nicht erreichbar oder Konfiguration ist falsch',
        });
      } else {
        results.push({
          name: 'Supabase Verbindung',
          status: 'success',
          message: 'Erfolgreich mit Supabase verbunden',
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Supabase Verbindung',
        status: 'error',
        message: `Fehler: ${error.message || 'Unbekannter Fehler'}`,
        details: 'Bitte überprüfe deine Internetverbindung und Supabase-Konfiguration',
      });
    }

    // 3. Check Backend API
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        results.push({
          name: 'Backend API',
          status: 'success',
          message: `Backend-Server ist erreichbar (${API_BASE_URL})`,
        });
      } else {
        results.push({
          name: 'Backend API',
          status: 'error',
          message: `Backend antwortet mit Status ${response.status}`,
          details: 'Server läuft, aber gibt einen Fehler zurück',
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Backend API',
        status: 'error',
        message: `Backend-Server ist nicht erreichbar`,
        details: `URL: ${API_BASE_URL}\nFehler: ${error.message}\n\nLösung: Starte den Backend-Server mit "cd server && npm run dev"`,
      });
    }

    // 4. Check API Base URL
    results.push({
      name: 'API Base URL',
      status: 'success',
      message: `Verwendet: ${API_BASE_URL}`,
      details: import.meta.env.VITE_API_URL 
        ? `Aus VITE_API_URL: ${import.meta.env.VITE_API_URL}`
        : 'Standard (Development: localhost:5000, Production: /api)',
    });

    // 5. Check Environment Mode
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.MODE === 'production';
    results.push({
      name: 'Environment Mode',
      status: 'success',
      message: isDev ? 'Development Mode' : isProd ? 'Production Mode' : 'Unknown',
      details: `MODE: ${import.meta.env.MODE || 'undefined'}`,
    });

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900/50 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Verbindungsdiagnose</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Prüfe...
            </>
          ) : (
            'Erneut prüfen'
          )}
        </button>
      </div>

      <div className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">
                  {diagnostic.name}
                </div>
                <div className="text-sm text-gray-300 mb-1">
                  {diagnostic.message}
                </div>
                {diagnostic.details && (
                  <div className="text-xs text-gray-400 mt-2 whitespace-pre-line">
                    {diagnostic.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Fix Instructions */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="font-semibold text-blue-400 mb-2">Schnelle Lösungen:</h4>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>
            <strong>Backend starten:</strong> Öffne ein Terminal und führe aus: <code className="bg-black/50 px-1 rounded">cd server && npm run dev</code>
          </li>
          <li>
            <strong>Supabase konfigurieren:</strong> Erstelle eine <code className="bg-black/50 px-1 rounded">.env</code> Datei im Root-Verzeichnis mit <code className="bg-black/50 px-1 rounded">VITE_SUPABASE_URL</code> und <code className="bg-black/50 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            <strong>Dev-Bypass aktivieren:</strong> Setze <code className="bg-black/50 px-1 rounded">VITE_DEV_BYPASS_AUTH=true</code> in der <code className="bg-black/50 px-1 rounded">.env</code> Datei (nur für Entwicklung!)
          </li>
        </ul>
      </div>
    </div>
  );
};

