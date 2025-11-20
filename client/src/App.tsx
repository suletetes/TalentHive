
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
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { NewProjectPage } from '@/pages/NewProjectPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ProposalsPage } from '@/pages/ProposalsPage';
import { ContractsPage } from '@/pages/ContractsPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage';
import { BrowseProjectsPage } from '@/pages/BrowseProjectsPage';
import { FreelancersPage } from '@/pages/FreelancersPage';
import { FreelancerDetailPage } from '@/pages/FreelancerDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HelpCenterPage } from '@/pages/HelpCenterPage';
import { ContactPage } from '@/pages/ContactPage';
import { TrustSafetyPage } from '@/pages/TrustSafetyPage';
import { AboutPage } from '@/pages/AboutPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/TermsOfServicePage';
import { SuccessStoriesPage } from '@/pages/SuccessStoriesPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ToastProvider } from '@/components/ui/ToastProvider';

function App() {
  return (
    <ErrorBoundary>
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
          
          {/* Browse pages (public) */}
          <Route path="projects" element={<BrowseProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="find-work" element={<BrowseProjectsPage />} />
          <Route path="freelancers" element={<FreelancersPage />} />
          <Route path="freelancers/:id" element={<FreelancerDetailPage />} />
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
          <Route path="projects/new" element={<NewProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="proposals" element={<ProposalsPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
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