
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ConsultationApp from './pages/ConsultationApp';
import FAQPage from './pages/FAQPage';
import { About, Privacy, Terms, MedicalDisclaimer, Contact } from './pages/StaticPages';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing Site Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/medical-disclaimer" element={<MedicalDisclaimer />} />

        </Route>

        {/* App Routes */}
        <Route path="/app" element={<ConsultationApp />} />

        {/* Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
