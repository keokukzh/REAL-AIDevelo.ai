import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
// Lazy load pages for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const PaymentSuccessPage = React.lazy(() => import('./pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));
const EnterpriseContactPage = React.lazy(() => import('./pages/EnterpriseContactPage').then(m => ({ default: m.EnterpriseContactPage })));
const WebdesignPage = React.lazy(() => import('./pages/WebdesignPage').then(m => ({ default: m.WebdesignPage })));
const CalendarCallbackPage = React.lazy(() => import('./pages/CalendarCallbackPage').then(m => ({ default: m.CalendarCallbackPage })));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const ImpressumPage = React.lazy(() => import('./pages/ImpressumPage').then(m => ({ default: m.ImpressumPage })));
const DatenschutzPage = React.lazy(() => import('./pages/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
const AGBPage = React.lazy(() => import('./pages/AGBPage').then(m => ({ default: m.AGBPage })));
const VoiceEditPage = React.lazy(() => import('./pages/VoiceEditPage').then(m => ({ default: m.VoiceEditPage })));
const AgentDetailsPage = React.lazy(() => import('./pages/AgentDetailsPage').then(m => ({ default: m.AgentDetailsPage })));
const AgentEditPage = React.lazy(() => import('./pages/AgentEditPage').then(m => ({ default: m.AgentEditPage })));
const CallsPage = React.lazy(() => import('./pages/CallsPage').then(m => ({ default: m.CallsPage })));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const KnowledgeBasePage = React.lazy(() => import('./pages/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { ToastContainer, useToast } from './components/ui/Toast';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DevQuickLogin } from './components/auth/DevQuickLogin';
import { useRoutePrefetch } from './hooks/useRoutePrefetch';
import { useCoreWebVitals } from './hooks/useCoreWebVitals';
import { initScrollTracking, trackPageView } from './lib/analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ElevenLabsWidget } from './components/ElevenLabsWidget';

// Conditionally import ReactQueryDevtools only in development (it uses eval internally)
// In production, this will be null and tree-shaken out of the bundle
// Use import.meta.env.PROD to ensure it's completely excluded from production builds
const ReactQueryDevtools = import.meta.env.PROD 
  ? null 
  : React.lazy(() => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })));

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
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  useRoutePrefetch();
  const location = useLocation();
  
  // Initialize scroll tracking
  useEffect(() => {
    initScrollTracking();
  }, []);
  
  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  
  // Track Core Web Vitals
  useCoreWebVitals((metrics) => {
    // In production, send to analytics service
    if (import.meta.env.PROD) {
      // Example: Send to analytics
      // analytics.track('core_web_vitals', metrics);
    }
  });
  
  return (
    <>
      <ScrollToTop />
      <ElevenLabsWidget />
      <DevQuickLogin />
              <div className="bg-background min-h-screen text-white selection:bg-accent selection:text-black">
                <AnimatePresence mode='wait'>
                    <Routes>
                    <Route path="/" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <LandingPage />
                      </Suspense>
                    } />
                    <Route path="/checkout" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <CheckoutPage />
                      </Suspense>
                    } />
                      <Route path="/payment-success" element={
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <PaymentSuccessPage />
                        </Suspense>
                      } />
                    <Route path="/enterprise" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <EnterpriseContactPage />
                      </Suspense>
                    } />
                    <Route path="/webdesign" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <WebdesignPage />
                      </Suspense>
                    } />
                    <Route path="/calendar/:provider/callback" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <CalendarCallbackPage />
                      </Suspense>
                    } />
                    <Route path="/auth/callback" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <AuthCallbackPage />
                      </Suspense>
                    } />
                    <Route path="/login" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <LoginPage />
                      </Suspense>
                    } />
                    <Route path="/onboarding" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <OnboardingPage />
                      </Suspense>
                    } />
                    <Route path="/voice-edit" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <VoiceEditPage />
                      </Suspense>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <DashboardPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/agents/:id" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <AgentDetailsPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/agents/:id/edit" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <AgentEditPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/calls" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <CallsPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/calendar" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <CalendarPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/settings" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <SettingsPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/knowledge-base" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <KnowledgeBasePage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                          <AnalyticsPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/impressum" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <ImpressumPage />
                      </Suspense>
                    } />
                    <Route path="/datenschutz" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <DatenschutzPage />
                      </Suspense>
                    } />
                    <Route path="/agb" element={
                      <Suspense fallback={<LoadingSpinner fullScreen={true} size="lg" />}>
                        <AGBPage />
                      </Suspense>
                    } />
                    </Routes>
                </AnimatePresence>
              </div>
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </>
  );
}

export default App;
