import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/layout/ScrollToTop.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

// Lazy load pages for code splitting
const WebdesignPage = React.lazy(() =>
  import('./pages/WebdesignPage.js').then((m) => ({ default: m.WebdesignPage })),
);
const LandingPage = React.lazy(() =>
  import('./pages/LandingPage.js').then((m) => ({ default: m.LandingPage })),
);
const VoiceAgentPage = React.lazy(() =>
  import('./pages/VoiceAgentPage.js').then((m) => ({ default: m.VoiceAgentPage })),
);
const OnboardingPage = React.lazy(() =>
  import('./pages/OnboardingPage.js').then((m) => ({ default: m.OnboardingPage })),
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })),
);
const CheckoutPage = React.lazy(() =>
  import('./pages/CheckoutPage.js').then((m) => ({ default: m.CheckoutPage })),
);
const PricingPage = React.lazy(() =>
  import('./pages/PricingPage.js').then((m) => ({ default: m.PricingPage })),
);
const PaymentSuccessPage = React.lazy(() =>
  import('./pages/PaymentSuccessPage.js').then((m) => ({ default: m.PaymentSuccessPage })),
);
const EnterpriseContactPage = React.lazy(() =>
  import('./pages/EnterpriseContactPage.js').then((m) => ({ default: m.EnterpriseContactPage })),
);
const CalendarCallbackPage = React.lazy(() =>
  import('./pages/CalendarCallbackPage.js').then((m) => ({ default: m.CalendarCallbackPage })),
);
const AuthCallbackPage = React.lazy(() =>
  import('./pages/AuthCallbackPage.js').then((m) => ({ default: m.AuthCallbackPage })),
);
const ImpressumPage = React.lazy(() =>
  import('./pages/ImpressumPage.js').then((m) => ({ default: m.ImpressumPage })),
);
const DatenschutzPage = React.lazy(() =>
  import('./pages/DatenschutzPage.js').then((m) => ({ default: m.DatenschutzPage })),
);
const AGBPage = React.lazy(() =>
  import('./pages/AGBPage.js').then((m) => ({ default: m.AGBPage })),
);
const DemoChatPage = React.lazy(() =>
  import('./pages/DemoChatPage.js').then((m) => ({ default: m.DemoChatPage })),
);
const VoiceEditPage = React.lazy(() =>
  import('./pages/VoiceEditPage.js').then((m) => ({ default: m.VoiceEditPage })),
);
const AgentDetailsPage = React.lazy(() =>
  import('./pages/AgentDetailsPage.js').then((m) => ({ default: m.AgentDetailsPage })),
);
const AgentEditPage = React.lazy(() =>
  import('./pages/AgentEditPage.js').then((m) => ({ default: m.AgentEditPage })),
);
const CallsPage = React.lazy(() =>
  import('./pages/CallsPage.js').then((m) => ({ default: m.CallsPage })),
);
const CalendarPage = React.lazy(() =>
  import('./pages/CalendarPage.js').then((m) => ({ default: m.CalendarPage })),
);
const CalendarIntegrationsPage = React.lazy(() =>
  import('./pages/CalendarIntegrationsPage.js').then((m) => ({
    default: m.CalendarIntegrationsPage,
  })),
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage })),
);
const KnowledgeBasePage = React.lazy(() =>
  import('./pages/KnowledgeBasePage.js').then((m) => ({ default: m.KnowledgeBasePage })),
);
const AnalyticsPage = React.lazy(() =>
  import('./pages/AnalyticsPage.js').then((m) => ({ default: m.AnalyticsPage })),
);
const ChannelsPage = React.lazy(() =>
  import('./pages/ChannelsPage.js').then((m) => ({ default: m.ChannelsPage })),
);
const TestCallPage = React.lazy(() =>
  import('./pages/TestCallPage.js').then((m) => ({ default: m.TestCallPage })),
);
const SubscriptionDashboard = React.lazy(() =>
  import('./pages/SubscriptionDashboard.js').then((m) => ({ default: m.SubscriptionDashboard })),
);
const AdminDashboard = React.lazy(() =>
  import('./pages/AdminDashboard.js').then((m) => ({ default: m.AdminDashboard })),
);
const PersonalizedAIPage = React.lazy(() =>
  import('./pages/PersonalizedAIPage.js').then((m) => ({ default: m.PersonalizedAIPage })),
);

import { AuthProvider } from './contexts/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query.js';
import { ToastContainer, useToast } from './components/ui/Toast.js';
import { PageLoader } from './components/ui/LoadingSpinner.js';
import { DevQuickLogin } from './components/auth/DevQuickLogin.js';
import { useRoutePrefetch } from './hooks/useRoutePrefetch.js';
import { useCoreWebVitals } from './hooks/useCoreWebVitals.js';
import { initScrollTracking, trackPageView } from './lib/analytics.js';
import { NotificationProvider } from './contexts/NotificationContext.js';

const ReactQueryDevtools = import.meta.env.PROD
  ? null
  : React.lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })),
    );

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
          <NotificationProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  useRoutePrefetch();
  const location = useLocation();

  useEffect(() => {
    initScrollTracking();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useCoreWebVitals(() => {
    if (import.meta.env.PROD) {
      // analytics.track('core_web_vitals');
    }
  });

  return (
    <>
      <ScrollToTop />
      <DevQuickLogin />
      <div className="bg-background min-h-screen text-white selection:bg-accent selection:text-black">
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LandingPage />
                </Suspense>
              }
            />
            <Route
              path="/voice-agents"
              element={
                <Suspense fallback={<PageLoader />}>
                  <VoiceAgentPage />
                </Suspense>
              }
            />
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CheckoutPage />
                </Suspense>
              }
            />
            <Route
              path="/payment-success"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PaymentSuccessPage />
                </Suspense>
              }
            />
            <Route
              path="/enterprise"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EnterpriseContactPage />
                </Suspense>
              }
            />
            <Route
              path="/webdesign"
              element={
                <Suspense fallback={<PageLoader />}>
                  <WebdesignPage />
                </Suspense>
              }
            />
            <Route
              path="/personalized-ai"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PersonalizedAIPage />
                </Suspense>
              }
            />
            <Route
              path="/pricing"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PricingPage />
                </Suspense>
              }
            />
            <Route
              path="/calendar/:provider/callback"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CalendarCallbackPage />
                </Suspense>
              }
            />
            <Route
              path="/auth/callback"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AuthCallbackPage />
                </Suspense>
              }
            />
            <Route
              path="/login"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/onboarding"
              element={
                <Suspense fallback={<PageLoader />}>
                  <OnboardingPage />
                </Suspense>
              }
            />
            <Route
              path="/voice-edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <VoiceEditPage />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/agents/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AgentDetailsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/agents/:id/edit"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AgentEditPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calls"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CallsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calendar"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CalendarPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calendar/integrations"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CalendarIntegrationsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SubscriptionDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/channels"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ChannelsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/test-call"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <TestCallPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <KnowledgeBasePage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnalyticsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/impressum"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ImpressumPage />
                </Suspense>
              }
            />
            <Route
              path="/datenschutz"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DatenschutzPage />
                </Suspense>
              }
            />
            <Route
              path="/agb"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AGBPage />
                </Suspense>
              }
            />
            <Route
              path="/demo-chat"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DemoChatPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
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
