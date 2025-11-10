
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HelpCenterPage } from '@/pages/HelpCenterPage';
import { ContactPage } from '@/pages/ContactPage';
import { TrustSafetyPage } from '@/pages/TrustSafetyPage';
import { AboutPage } from '@/pages/AboutPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/TermsOfServicePage';
import { SuccessStoriesPage } from '@/pages/SuccessStoriesPage';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ToastProvider } from '@/components/ui/ToastProvider';

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <ToastProvider>
        <OfflineIndicator />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Static pages */}
          <Route path="help" element={<HelpCenterPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="trust-safety" element={<TrustSafetyPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsOfServicePage />} />
          <Route path="success-stories" element={<SuccessStoriesPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        </Box>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;