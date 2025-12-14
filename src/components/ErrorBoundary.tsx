import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service in production
    // Always log errors for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    globalThis.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface/50 rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Etwas ist schiefgelaufen</h2>
            <p className="text-gray-400 mb-6">
              Es tut uns leid, aber es ist ein unerwarteter Fehler aufgetreten. 
              Bitte versuchen Sie es erneut oder kontaktieren Sie uns, wenn das Problem weiterhin besteht.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Stack: {this.state.error.stack?.substring(0, 500)}
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="primary">
                <RefreshCw size={16} className="mr-2" />
                Zur Startseite
              </Button>
              <Button 
                onClick={() => globalThis.location.reload()} 
                variant="outline"
              >
                Seite neu laden
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
