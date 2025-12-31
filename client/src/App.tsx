
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { Suspense, useEffect } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { SuspenseFallback } from '@/components/ui/LoadingStates';
import { createLazyComponent } from '@/utils/lazyLoading';
import { initializeSecurity } from '@/config/security';
import { envConfig } from '@/utils/envValidation';

// Lazy load pages for better performance
const HomePage = createLazyComponent(() => import('@/pages/HomePage'));
const LoginPage = createLazyComponent(() => import('@/pages/auth/LoginPage'));
const RegisterPage = createLazyComponent(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = createLazyComponent(() => import('@/pages/DashboardPage'));
const ProfilePage = createLazyComponent(() => import('@/pages/ProfilePage'));
const ProjectsPage = createLazyComponent(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = createLazyComponent(() => import('@/pages/ProjectDetailPage'));
const NewProjectPage = createLazyComponent(() => import('@/pages/NewProjectPage'));
const EditProjectPage = createLazyComponent(() => import('@/pages/EditProjectPage'));
const MessagesPage = createLazyComponent(() => import('@/pages/MessagesPage'));
const ProposalsPage = createLazyComponent(() => import('@/pages/ProposalsPage'));
const ProjectProposalsPage = createLazyComponent(() => import('@/pages/ProjectProposalsPage'));
const ContractsPage = createLazyComponent(() => import('@/pages/ContractsPage'));
const PaymentsPage = createLazyComponent(() => import('@/pages/PaymentsPage'));
const ReviewsPage = createLazyComponent(() => import('@/pages/ReviewsPage'));

// Admin pages (lazy loaded)
const AdminDashboardPage = createLazyComponent(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = createLazyComponent(() => import('@/pages/admin/AdminUsersPage'));
const AdminProjectsPage = createLazyComponent(() => import('@/pages/admin/AdminProjectsPage'));
const AnalyticsDashboardPage = createLazyComponent(() => import('@/pages/admin/AnalyticsDashboardPage'));
const AdminSettingsPage = createLazyComponent(() => import('@/pages/admin/AdminSettingsPage'));
const CommissionSettingsPage = createLazyComponent(() => import('@/pages/admin/CommissionSettingsPage'));

// Other pages (lazy loaded)
const BrowseProjectsPage = createLazyComponent(() => import('@/pages/BrowseProjectsPage'));
const FreelancersPage = createLazyComponent(() => import('@/pages/FreelancersPage'));
const FreelancerDetailPage = createLazyComponent(() => import('@/pages/FreelancerDetailPage'));
const FreelancerReviewsPage = createLazyComponent(() => import('@/pages/FreelancerReviewsPage'));
const NotFoundPage = createLazyComponent(() => import('@/pages/NotFoundPage'));
const HelpCenterPage = createLazyComponent(() => import('@/pages/HelpCenterPage'));
const ContactPage = createLazyComponent(() => import('@/pages/ContactPage'));
const TrustSafetyPage = createLazyComponent(() => import('@/pages/TrustSafetyPage'));
const AboutPage = createLazyComponent(() => import('@/pages/AboutPage'));
const PrivacyPolicyPage = createLazyComponent(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = createLazyComponent(() => import('@/pages/TermsOfServicePage'));
const SuccessStoriesPage = createLazyComponent(() => import('@/pages/SuccessStoriesPage'));
const NotificationsPage = createLazyComponent(() => import('@/pages/NotificationsPage'));
const OrganizationListPage = createLazyComponent(() => import('@/pages/OrganizationListPage'));
const OrganizationDashboardPage = createLazyComponent(() => import('@/pages/OrganizationDashboardPage'));
const VerificationPage = createLazyComponent(() => import('@/pages/VerificationPage'));
const VerificationSuccessPage = createLazyComponent(() => import('@/pages/VerificationSuccessPage'));
const EmailVerificationPage = createLazyComponent(() => import('@/pages/EmailVerificationPage'));
const ChangePasswordPage = createLazyComponent(() => import('@/pages/ChangePasswordPage'));
const PaymentSuccessPage = createLazyComponent(() => import('@/pages/PaymentSuccessPage'));
const PaymentErrorPage = createLazyComponent(() => import('@/pages/PaymentErrorPage'));
const ContractDetailPage = createLazyComponent(() => import('@/pages/ContractDetailPage'));
const TimeTrackingPage = createLazyComponent(() => import('@/pages/TimeTrackingPage'));
const HireNowRequestsPage = createLazyComponent(() => import('@/pages/HireNowRequestsPage'));
const ServicesPage = createLazyComponent(() => import('@/pages/ServicesPage'));
const CreateProfilePage = createLazyComponent(() => import('@/pages/CreateProfilePage'));
const HowItWorksPage = createLazyComponent(() => import('@/pages/HowItWorksPage'));
const FindFreelancersPage = createLazyComponent(() => import('@/pages/FindFreelancersPage'));
const AdminTransactionsPage = createLazyComponent(() => import('@/pages/admin/AdminTransactionsPage'));
const ReleasePaymentPage = createLazyComponent(() => import('@/pages/ReleasePaymentPage'));
const SupportTicketsPage = createLazyComponent(() => import('@/pages/SupportTicketsPage'));
const CreateTicketPage = createLazyComponent(() => import('@/pages/CreateTicketPage'));
const TicketDetailPage = createLazyComponent(() => import('@/pages/TicketDetailPage'));
const AdminSupportDashboard = createLazyComponent(() => import('@/pages/admin/AdminSupportDashboard'));
const FreelancerOnboardingPage = createLazyComponent(() => import('@/pages/onboarding/FreelancerOnboardingPage'));
const ClientOnboardingPage = createLazyComponent(() => import('@/pages/onboarding/ClientOnboardingPage'));
const AdminOnboardingPage = createLazyComponent(() => import('@/pages/onboarding/AdminOnboardingPage'));
const ProfileAnalyticsPage = createLazyComponent(() => import('@/pages/ProfileAnalyticsPage'));
const ClientDetailPage = createLazyComponent(() => import('@/pages/ClientDetailPage'));
const RoleManagementPage = createLazyComponent(() => import('@/pages/admin/RoleManagementPage'));
const UserPermissionsPage = createLazyComponent(() => import('@/pages/admin/UserPermissionsPage'));
const AuditLogPage = createLazyComponent(() => import('@/pages/admin/AuditLogPage'));

// Import remaining components that are used immediately
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ToastProvider } from '@/components/ui/ToastProvider';

function App() {
  // Initialize security configuration on app start
  useEffect(() => {
    try {
      initializeSecurity();
      console.log('Security configuration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize security configuration:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                
                {/* Onboarding routes */}
                <Route path="onboarding/freelancer" element={<FreelancerOnboardingPage />} />
                <Route path="onboarding/client" element={<ClientOnboardingPage />} />
                <Route path="onboarding/admin" element={<AdminOnboardingPage />} />
                
                {/* Static pages */}
                <Route path="help" element={<HelpCenterPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="trust-safety" element={<TrustSafetyPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="privacy" element={<PrivacyPolicyPage />} />
                <Route path="terms" element={<TermsOfServicePage />} />
                <Route path="success-stories" element={<SuccessStoriesPage />} />
                <Route path="how-it-works" element={<HowItWorksPage />} />
                <Route path="find-freelancers" element={<FindFreelancersPage />} />
                
                {/* Browse pages (public) */}
                <Route path="projects" element={<BrowseProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="find-work" element={<BrowseProjectsPage />} />
                <Route path="freelancers" element={<FreelancersPage />} />
                <Route path="freelancer/:id" element={<FreelancerDetailPage />} />
                <Route path="freelancer/:id/reviews" element={<FreelancerReviewsPage />} />
                <Route path="client/:id" element={<ClientDetailPage />} />
                
                {/* Profile slug routes */}
                <Route path="@:slug" element={<FreelancerDetailPage />} />
                
                {/* Payment & Verification pages (public) */}
                <Route path="payment-success" element={<PaymentSuccessPage />} />
                <Route path="payment-error" element={<PaymentErrorPage />} />
                <Route path="verify-email" element={<EmailVerificationPage />} />
                <Route path="verification" element={<VerificationPage />} />
                <Route path="verification-success" element={<VerificationSuccessPage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                <Route path="create-profile" element={<CreateProfilePage />} />
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
                <Route path="projects/:id/edit" element={<EditProjectPage />} />
                <Route path="projects/:projectId/proposals" element={<ProjectProposalsPage />} />
                <Route path="proposals" element={<ProposalsPage />} />
                <Route path="contracts" element={<ContractsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="organizations" element={<OrganizationListPage />} />
                <Route path="organizations/:id" element={<OrganizationDashboardPage />} />
                <Route path="contracts/:id" element={<ContractDetailPage />} />
                <Route path="contracts/:contractId/release/:milestoneId" element={<ReleasePaymentPage />} />
                <Route path="time-tracking" element={<TimeTrackingPage />} />
                <Route path="hire-now-requests" element={<HireNowRequestsPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="support" element={<SupportTicketsPage />} />
                <Route path="support/new" element={<CreateTicketPage />} />
                <Route path="support/:ticketId" element={<TicketDetailPage />} />
                <Route path="profile/analytics" element={<ProfileAnalyticsPage />} />
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
                <Route path="users/:userId/permissions" element={<UserPermissionsPage />} />
                <Route path="projects" element={<AdminProjectsPage />} />
                <Route path="analytics" element={<AnalyticsDashboardPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="commission-settings" element={<CommissionSettingsPage />} />
                <Route path="transactions" element={<AdminTransactionsPage />} />
                <Route path="support" element={<AdminSupportDashboard />} />
                <Route path="roles" element={<RoleManagementPage />} />
                <Route path="audit-logs" element={<AuditLogPage />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Box>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;