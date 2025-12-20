import { Page, ConsoleMessage, Request, Response } from '@playwright/test';

export interface ConsoleError {
  type: 'error' | 'warn';
  message: string;
  url: string;
  timestamp: number;
  stack?: string;
}

export interface PageError {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
}

export interface NetworkFailure {
  url: string;
  status: number;
  statusText: string;
  method: string;
  timestamp: number;
  failureText?: string;
}

/**
 * Collects errors, warnings, and network failures from a Playwright page
 */
export class ErrorCollector {
  private consoleErrors: ConsoleError[] = [];
  private pageErrors: PageError[] = [];
  private networkFailures: NetworkFailure[] = [];
  private consoleListeners: Array<() => void> = [];
  private pageErrorListeners: Array<() => void> = [];
  private networkListeners: Array<() => void> = [];

  /**
   * Known third-party errors to filter out
   */
  private readonly thirdPartyErrorPatterns = [
    /lockdown-install\.js/,
    /lockdown-run\.js/,
    /moz-extension:\/\//,
    /chrome-extension:\/\//,
    /Removing unpermitted intrinsics/,
    /Removing intrinsics/,
    /Segmented/,
    /GetInstance/,
    /SignerNotReady/,
    /NotInitialized/,
    /wallet/,
    /provider/,
    /web3/,
    /ethereum/,
    /metamask/,
  ];

  /**
   * Start collecting errors from the page
   */
  startCollecting(page: Page): void {
    this.clear();

    // Console error listener
    const consoleHandler = (msg: ConsoleMessage) => {
      const type = msg.type();
      if (type === 'error' || type === 'warn') {
        const message = msg.text();
        
        // Filter third-party errors
        if (this.shouldFilterError(message)) {
          return;
        }

        this.consoleErrors.push({
          type: type as 'error' | 'warn',
          message,
          url: page.url(),
          timestamp: Date.now(),
          stack: msg.location()?.url,
        });
      }
    };

    page.on('console', consoleHandler);
    this.consoleListeners.push(() => page.off('console', consoleHandler));

    // Page error listener (uncaught exceptions)
    const pageErrorHandler = (error: Error) => {
      const message = error.message || String(error);
      
      // Filter third-party errors
      if (this.shouldFilterError(message)) {
        return;
      }

      this.pageErrors.push({
        message,
        stack: error.stack,
        url: page.url(),
        timestamp: Date.now(),
      });
    };

    page.on('pageerror', pageErrorHandler);
    this.pageErrorListeners.push(() => page.off('pageerror', pageErrorHandler));

    // Network failure listener
    const requestFailedHandler = (request: Request) => {
      const failure = request.failure();
      if (failure) {
        // Only track failures, not cancellations
        if (failure.errorText && !failure.errorText.includes('net::ERR_ABORTED')) {
          this.networkFailures.push({
            url: request.url(),
            status: 0,
            statusText: 'Failed',
            method: request.method(),
            timestamp: Date.now(),
            failureText: failure.errorText,
          });
        }
      }
    };

    page.on('requestfailed', requestFailedHandler);
    this.networkListeners.push(() => page.off('requestfailed', requestFailedHandler));

    // Response listener (status >= 400)
    const responseHandler = (response: Response) => {
      const status = response.status();
      if (status >= 400) {
        const url = response.url();
        
        // Filter third-party URLs (analytics, tracking, etc.)
        if (this.shouldFilterNetworkError(url)) {
          return;
        }

        this.networkFailures.push({
          url,
          status,
          statusText: response.statusText(),
          method: response.request().method(),
          timestamp: Date.now(),
        });
      }
    };

    page.on('response', responseHandler);
    this.networkListeners.push(() => page.off('response', responseHandler));
  }

  /**
   * Stop collecting errors
   */
  stopCollecting(): void {
    this.consoleListeners.forEach(cleanup => cleanup());
    this.pageErrorListeners.forEach(cleanup => cleanup());
    this.networkListeners.forEach(cleanup => cleanup());
    this.consoleListeners = [];
    this.pageErrorListeners = [];
    this.networkListeners = [];
  }

  /**
   * Clear all collected errors
   */
  clear(): void {
    this.consoleErrors = [];
    this.pageErrors = [];
    this.networkFailures = [];
  }

  /**
   * Get all console errors (not warnings)
   */
  getErrors(): ConsoleError[] {
    return this.consoleErrors.filter(e => e.type === 'error');
  }

  /**
   * Get all console warnings
   */
  getWarnings(): ConsoleError[] {
    return this.consoleErrors.filter(e => e.type === 'warn');
  }

  /**
   * Get all page errors (uncaught exceptions)
   */
  getPageErrors(): PageError[] {
    return this.pageErrors;
  }

  /**
   * Get all network failures
   */
  getNetworkFailures(): NetworkFailure[] {
    return this.networkFailures;
  }

  /**
   * Get total error count
   */
  getTotalErrorCount(): number {
    return this.getErrors().length + this.getPageErrors().length + this.getNetworkFailures().length;
  }

  /**
   * Get network failures only
   */
  getNetworkFailuresOnly(): NetworkFailure[] {
    return this.networkFailures.filter(f => f.status === 0 || f.status >= 400);
  }

  /**
   * Check if error should be filtered (third-party)
   */
  private shouldFilterError(message: string): boolean {
    // Filter third-party errors
    if (this.thirdPartyErrorPatterns.some(pattern => pattern.test(message))) {
      return true;
    }
    
    // Don't filter ERR_EMPTY_RESPONSE - we want to track backend connectivity issues
    // but we'll handle them specially in the report
    return false;
  }

  /**
   * Check if network error should be filtered (third-party URLs or backend not running)
   */
  private shouldFilterNetworkError(url: string): boolean {
    const thirdPartyDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com',
      'doubleclick.net',
      'googleadservices.com',
      'analytics.google.com',
      'googlesyndication.com',
      'adservice.google',
    ];

    try {
      const urlObj = new URL(url);
      
      // Filter third-party domains
      if (thirdPartyDomains.some(domain => urlObj.hostname.includes(domain))) {
        return true;
      }
      
      // Filter backend API errors if backend is not running (ERR_EMPTY_RESPONSE)
      // This is expected in local dev when backend server is not started
      // We'll still track them but mark them as "expected" in the report
      if (urlObj.hostname === 'localhost' && urlObj.port === '5000' && urlObj.pathname.startsWith('/api/')) {
        // Backend API - we'll track but not fail the audit if backend is not running
        // The error details will show this is a backend connectivity issue
        return false; // Don't filter - we want to see these errors
      }
      
      return false;
    } catch {
      return false;
    }
  }
}
