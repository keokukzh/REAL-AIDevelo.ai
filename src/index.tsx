import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './styles/animations.css';
import './styles/dashboard.css';

// Suppress external library warnings that don't affect functionality
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  // Suppress Web3/wallet-related warnings
  if (
    args[0]?.toString().includes('Segmented') ||
    args[0]?.toString().includes('GetInstance') ||
    args[0]?.toString().includes('SignerNotReady') ||
    args[0]?.toString().includes('NotInitialized') ||
    args[0]?.toString().includes('wallet') ||
    args[0]?.toString().includes('provider')
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  // Suppress non-critical warnings
  if (
    args[0]?.toString().includes('Segmented') ||
    args[0]?.toString().includes('wallet')
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