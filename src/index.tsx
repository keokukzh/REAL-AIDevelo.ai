import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import { initSentry } from './lib/sentry';
import './index.css';
import './styles/animations.css';
import './styles/dashboard.css';

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
      <App />
    </HelmetProvider>
  </React.StrictMode>
);