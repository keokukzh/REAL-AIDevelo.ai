import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { EnterpriseContactPage } from './pages/EnterpriseContactPage';
import { CalendarCallbackPage } from './pages/CalendarCallbackPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { DatenschutzPage } from './pages/DatenschutzPage';
import { AGBPage } from './pages/AGBPage';
import { VoiceEditPage } from './pages/VoiceEditPage';
import { AgentDetailsPage } from './pages/AgentDetailsPage';
import { AgentEditPage } from './pages/AgentEditPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { ToastContainer, useToast } from './components/ui/Toast';

// Conditionally import ReactQueryDevtools only in development (it uses eval internally)
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })))
  : null;

// Toast Provider Component
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, removeToast } = useToast();
  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToTop />
              <div className="bg-background min-h-screen text-white selection:bg-accent selection:text-black">
                <AnimatePresence mode='wait'>
                    <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                    <Route path="/enterprise" element={<EnterpriseContactPage />} />
                    <Route path="/calendar/:provider/callback" element={<CalendarCallbackPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/voice-edit" element={<VoiceEditPage />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/agents/:id" element={
                      <ProtectedRoute>
                        <AgentDetailsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/agents/:id/edit" element={
                      <ProtectedRoute>
                        <AgentEditPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/impressum" element={<ImpressumPage />} />
                    <Route path="/datenschutz" element={<DatenschutzPage />} />
                    <Route path="/agb" element={<AGBPage />} />
                    </Routes>
                </AnimatePresence>
              </div>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
