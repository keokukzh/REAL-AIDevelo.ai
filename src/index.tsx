import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { initSentry } from './lib/sentry';
import './index.css';
import './styles/design-tokens.css';
import './styles/animations.css';
import './styles/dashboard.css';

// #region agent log
// Runtime CSP + CORB diagnostics (no secrets)
if (globalThis.window) {
  const w = globalThis.window;
  const __canDebugLog = w.location.hostname === 'localhost' || w.location.hostname === '127.0.0.1';

  w.addEventListener('securitypolicyviolation', (e) => {
    if (!__canDebugLog) return;
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H1_H2_H4',
        location: 'src/index.tsx:securitypolicyviolation',
        message: 'CSP violation',
        data: {
          effectiveDirective: (e as any).effectiveDirective,
          violatedDirective: (e as any).violatedDirective,
          blockedURI: (e as any).blockedURI,
          sourceFile: (e as any).sourceFile,
          lineNumber: (e as any).lineNumber,
          columnNumber: (e as any).columnNumber,
          sample: (e as any).sample ? String((e as any).sample).slice(0, 180) : undefined,
          disposition: (e as any).disposition,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });

  w.addEventListener(
    'error',
    (e) => {
      if (!__canDebugLog) return;
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'src/index.tsx:window.error',
          message: 'Window error event',
          data: {
            message: (e as any).message,
            filename: (e as any).filename,
            lineno: (e as any).lineno,
            colno: (e as any).colno,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    },
    true
  );

  w.addEventListener('unhandledrejection', (e) => {
    if (!__canDebugLog) return;
    const reason = (e as any).reason;
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'src/index.tsx:unhandledrejection',
        message: 'Unhandled promise rejection',
        data: {
          name: reason?.name,
          message: reason?.message,
          stackHead: typeof reason?.stack === 'string' ? reason.stack.split('\n').slice(0, 4).join('\n') : undefined,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
}
// #endregion

// Initialize Sentry before rendering app
initSentry();

// Build: 2025-12-11 01:50 - Force fresh deployment

// Suppress external library warnings that don't affect functionality
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Suppress Web3/wallet-related warnings
  if (
    message.includes('Segmented') ||
    message.includes('GetInstance') ||
    message.includes('SignerNotReady') ||
    message.includes('NotInitialized') ||
    message.includes('wallet') ||
    message.includes('provider')
  ) {
    return;
  }
  
  // Suppress browser extension warnings (lockdown, SES, intrinsics)
  if (
    message.includes('lockdown-install.js') ||
    message.includes('lockdown-run.js') ||
    message.includes('Removing unpermitted intrinsics') ||
    message.includes('Removing intrinsics') ||
    message.includes('moz-extension://')
  ) {
    return;
  }
  
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Suppress non-critical warnings
  if (
    message.includes('Segmented') ||
    message.includes('wallet')
  ) {
    return;
  }
  
  // Suppress browser extension warnings (lockdown, SES, intrinsics)
  if (
    message.includes('lockdown-install.js') ||
    message.includes('lockdown-run.js') ||
    message.includes('Removing unpermitted intrinsics') ||
    message.includes('Removing intrinsics') ||
    message.includes('moz-extension://')
  ) {
    return;
  }
  
  originalWarn.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);