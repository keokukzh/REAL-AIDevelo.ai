import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from './ui/Button.js';
import { extractUserFriendlyError } from '../lib/errorUtils.js';
import { UserFriendlyError } from './ui/UserFriendlyError.js';
import { logger } from '../lib/logger.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRecover?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    logger.error('ErrorBoundary: Error caught by boundary', error, {
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo.toString(),
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRecover) {
      this.props.onRecover();
    } else {
      globalThis.location.href = '/';
    }
  };

  handleReload = () => {
    globalThis.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userFriendlyError = this.state.error
        ? extractUserFriendlyError(this.state.error, 'Ein unerwarteter Fehler ist aufgetreten')
        : {
            title: 'Unerwarteter Fehler',
            message: 'Es ist ein Fehler aufgetreten, der die Anwendung beeinträchtigt.',
            solution:
              'Bitte versuchen Sie, die Seite neu zu laden. Falls das Problem weiterhin besteht, kontaktieren Sie den Support.',
            retryable: true,
          };

      return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <UserFriendlyError
              error={{
                ...userFriendlyError,
                action: this.handleReset,
                actionLabel: 'Zur Startseite',
              }}
              onRetry={this.handleReload}
              className="mb-6"
            />

            {/* Technical details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6">
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-gray-400 mb-3 select-none">
                    Technische Details (nur für Entwicklung)
                  </summary>
                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <p className="text-red-400 mb-1">Error:</p>
                      <p className="text-gray-300 break-all">{this.state.error.toString()}</p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-red-400 mb-1">Stack Trace:</p>
                        <pre className="text-gray-400 overflow-auto max-h-64 bg-slate-950 p-3 rounded border border-slate-800">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-red-400 mb-1">Component Stack:</p>
                        <pre className="text-gray-400 overflow-auto max-h-64 bg-slate-950 p-3 rounded border border-slate-800">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Additional help */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} variant="primary" className="flex items-center gap-2">
                <RefreshCw size={16} />
                Seite neu laden
              </Button>
              <Button onClick={this.handleReset} variant="outline" className="flex items-center gap-2">
                <Home size={16} />
                Zur Startseite
              </Button>
              <a
                href="mailto:support@aidevelo.ai?subject=Fehlerbericht"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 text-gray-300 hover:text-white transition-colors text-sm"
              >
                <Mail size={16} />
                Support kontaktieren
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
