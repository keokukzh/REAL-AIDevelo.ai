import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../newDashboard/ui/Button.js';
import { extractUserFriendlyError } from '../../lib/errorUtils.js';
import { logger } from '../../lib/logger.js';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onRecover?: () => void;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary specifically for dashboard components
 * Provides isolated error handling for dashboard sections
 */
export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `DashboardErrorBoundary: Error in ${this.props.sectionName || 'dashboard section'}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        sectionName: this.props.sectionName,
      },
    );
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRecover) {
      this.props.onRecover();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userFriendlyError = this.state.error
        ? extractUserFriendlyError(
            this.state.error,
            `Fehler im ${this.props.sectionName || 'Dashboard-Bereich'}`,
          )
        : {
            title: 'Fehler im Dashboard',
            message: 'Ein Fehler ist in diesem Dashboard-Bereich aufgetreten.',
            solution: 'Bitte versuchen Sie, die Seite neu zu laden oder diesen Bereich zu aktualisieren.',
            retryable: true,
          };

      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-300 mb-1">{userFriendlyError.title}</h3>
              <p className="text-xs text-red-200/80 mb-3">{userFriendlyError.message}</p>
              {userFriendlyError.solution && (
                <p className="text-xs text-red-200/60 mb-4">{userFriendlyError.solution}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="text-xs"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Erneut versuchen
                </Button>
              </div>
            </div>
          </div>
          {/* Technical details in development */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 cursor-pointer">
              <summary className="text-xs text-gray-400 mb-2 select-none">
                Technische Details (nur für Entwicklung)
              </summary>
              <div className="text-xs font-mono bg-slate-900/50 p-3 rounded border border-slate-800">
                <p className="text-red-400 mb-1">Error:</p>
                <p className="text-gray-300 break-all text-[10px]">{this.state.error.toString()}</p>
                {this.state.error.stack && (
                  <>
                    <p className="text-red-400 mb-1 mt-2">Stack:</p>
                    <pre className="text-gray-400 overflow-auto max-h-32 text-[10px]">
                      {this.state.error.stack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
