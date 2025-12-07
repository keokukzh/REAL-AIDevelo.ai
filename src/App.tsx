import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="bg-background min-h-screen text-white selection:bg-accent selection:text-black">
        <AnimatePresence mode='wait'>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
