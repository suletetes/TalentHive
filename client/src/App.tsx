
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
import { EditProjectPage } from '@/pages/EditProjectPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ProposalsPage } from '@/pages/ProposalsPage';
import { ProjectProposalsPage } from '@/pages/ProjectProposalsPage';
import { ContractsPage } from '@/pages/ContractsPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage';
import { AnalyticsDashboardPage } from '@/pages/admin/AnalyticsDashboardPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { CommissionSettingsPage } from '@/pages/admin/CommissionSettingsPage';
import { BrowseProjectsPage } from '@/pages/BrowseProjectsPage';
import { FreelancersPage } from '@/pages/FreelancersPage';
import { FreelancerDetailPage } from '@/pages/FreelancerDetailPage';
import { FreelancerReviewsPage } from '@/pages/FreelancerReviewsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HelpCenterPage } from '@/pages/HelpCenterPage';
import { ContactPage } from '@/pages/ContactPage';
import { TrustSafetyPage } from '@/pages/TrustSafetyPage';
import { AboutPage } from '@/pages/AboutPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/TermsOfServicePage';
import { SuccessStoriesPage } from '@/pages/SuccessStoriesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { OrganizationListPage } from '@/pages/OrganizationListPage';
import { OrganizationDashboardPage } from '@/pages/OrganizationDashboardPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { VerificationSuccessPage } from '@/pages/VerificationSuccessPage';
import { EmailVerificationPage } from '@/pages/EmailVerificationPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PaymentErrorPage } from '@/pages/PaymentErrorPage';
import { ContractDetailPage } from '@/pages/ContractDetailPage';
import { TimeTrackingPage } from '@/pages/TimeTrackingPage';
import { HireNowRequestsPage } from '@/pages/HireNowRequestsPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { CreateProfilePage } from '@/pages/CreateProfilePage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { FindFreelancersPage } from '@/pages/FindFreelancersPage';
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage';
import { ReleasePaymentPage } from '@/pages/ReleasePaymentPage';
import { SupportTicketsPage } from '@/pages/SupportTicketsPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { AdminSupportDashboard } from '@/pages/admin/AdminSupportDashboard';
import { FreelancerOnboardingPage } from '@/pages/onboarding/FreelancerOnboardingPage';
import { ClientOnboardingPage } from '@/pages/onboarding/ClientOnboardingPage';
import { AdminOnboardingPage } from '@/pages/onboarding/AdminOnboardingPage';
import { ProfileAnalyticsPage } from '@/pages/ProfileAnalyticsPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { RoleManagementPage } from '@/pages/admin/RoleManagementPage';
import { UserPermissionsPage } from '@/pages/admin/UserPermissionsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
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
        </Box>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;