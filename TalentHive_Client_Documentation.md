# TalentHive Client-Side Documentation

## Complete Frontend Architecture Guide

**Technology Stack**: React 18 + TypeScript + Material-UI + Redux Toolkit + Vite  
**Architecture Pattern**: Component-based architecture with layered design  
**State Management**: Redux Toolkit + TanStack Query + Local State

---

## Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Application Entry Point](#2-application-entry-point)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [Routing System](#5-routing-system)
6. [API Integration](#6-api-integration)
7. [Custom Hooks](#7-custom-hooks)
8. [Utility Functions](#8-utility-functions)
9. [Theme and Styling](#9-theme-and-styling)
10. [Testing Strategy](#10-testing-strategy)
11. [Build Configuration](#11-build-configuration)
12. [Performance Optimizations](#12-performance-optimizations)

---

## 1. Project Structure Overview

### 1.1 Root Directory Structure
```
client/
├── public/                 # Static assets and PWA files
│   ├── favicon.ico        # Application favicon
│   ├── favicon.svg        # SVG favicon for modern browsers
│   ├── manifest.json      # PWA manifest file
│   └── sw.js             # Service worker for offline functionality
├── src/                   # Source code directory
├── dist/                  # Production build output (generated)
├── node_modules/          # Dependencies (generated)
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Dependency lock file
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Node.js tools
├── vite.config.ts        # Vite build tool configuration
├── eslint.config.js      # ESLint configuration
├── .env                  # Environment variables (development)
├── .env.example          # Environment variables template
├── .env.production.example # Production environment template
├── Dockerfile            # Docker container configuration
├── Dockerfile.prod       # Production Docker configuration
├── nginx.conf            # Nginx configuration for production
└── README.md             # Project documentation
```

### 1.2 Source Code Structure
```
src/
├── components/           # Reusable UI components
├── pages/               # Route-level page components
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── store/               # Redux store configuration
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and helpers
├── theme/               # Material-UI theme configuration
├── config/              # Application configuration
├── test/                # Test files and test utilities
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── vite-env.d.ts        # Vite environment type definitions
```
## 2. Application Entry Point

### 2.1 main.tsx - Application Bootstrap
```typescript
// main.tsx - Application entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { store, persistor } from '@/store';
import { createAppTheme } from '@/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createQueryClient } from '@/config/queryClient';
```

**Key Features:**
- **React 18 StrictMode**: Enables additional checks and warnings
- **Redux Provider**: Global state management
- **PersistGate**: Handles state rehydration from localStorage
- **React Router**: Client-side routing
- **TanStack Query**: Server state management and caching
- **Material-UI Theme**: Consistent design system
- **Toast Notifications**: User feedback system

### 2.2 App.tsx - Main Application Component
```typescript
// App.tsx - Main application routing and layout
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

**Routing Structure:**
- **Public Routes**: Home, login, register, browse projects
- **Protected Routes**: Dashboard, profile, projects, messages
- **Admin Routes**: User management, analytics, settings
- **Role-based Access**: Different routes for different user roles
## 3. Component Architecture

### 3.1 Component Organization Strategy
```
components/
├── admin/                # Admin-specific components
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── PlatformAnalytics.tsx
│   ├── CommissionSettings.tsx
│   ├── AdminSupportDashboard.tsx
│   ├── RoleManagementPage.tsx
│   ├── UserPermissionsPage.tsx
│   └── AuditLogPage.tsx
├── analytics/            # Analytics and reporting components
│   ├── AnalyticsChart.tsx
│   ├── MetricsCard.tsx
│   ├── RevenueChart.tsx
│   └── UserGrowthChart.tsx
├── auth/                 # Authentication components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── PasswordReset.tsx
│   ├── EmailVerification.tsx
│   └── ProtectedRoute.tsx
├── contracts/            # Contract management components
│   ├── ContractDetails.tsx
│   ├── MilestoneTracker.tsx
│   ├── ContractActions.tsx
│   ├── ContractForm.tsx
│   └── MilestoneForm.tsx
├── dashboard/            # Dashboard components
│   ├── FreelancerDashboard.tsx
│   ├── ClientDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── StatsCard.tsx
│   ├── RecentActivity.tsx
│   └── QuickActions.tsx
├── disputes/             # Dispute resolution components
│   ├── DisputeForm.tsx
│   ├── DisputeDetails.tsx
│   └── DisputeResolution.tsx
├── error/                # Error handling components
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   └── NotFoundPage.tsx
├── forms/                # Reusable form components
│   ├── FormField.tsx
│   ├── FormSelect.tsx
│   ├── FormTextArea.tsx
│   ├── FormDatePicker.tsx
│   └── FormFileUpload.tsx
├── hire-now/             # Hire Now feature components
│   ├── HireNowForm.tsx
│   ├── HireNowRequest.tsx
│   └── HireNowStatus.tsx
├── layout/               # Layout and navigation components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   ├── Layout.tsx
│   └── MobileNavigation.tsx
├── messages/             # Messaging components (legacy)
│   └── MessageCenter.tsx
├── messaging/            # Real-time messaging components
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── ConversationList.tsx
│   ├── FileUpload.tsx
│   ├── TypingIndicator.tsx
│   └── MessageAttachment.tsx
├── notifications/        # Notification components
│   ├── NotificationList.tsx
│   ├── NotificationItem.tsx
│   └── NotificationSettings.tsx
├── onboarding/           # User onboarding components
│   ├── OnboardingWizard.tsx
│   ├── FreelancerOnboarding.tsx
│   ├── ClientOnboarding.tsx
│   └── OnboardingStep.tsx
├── organizations/        # Organization management components
│   ├── OrganizationForm.tsx
│   ├── OrganizationList.tsx
│   ├── TeamManagement.tsx
│   └── OrganizationSettings.tsx
├── payments/             # Payment processing components
│   ├── PaymentForm.tsx
│   ├── PaymentHistory.tsx
│   ├── EscrowStatus.tsx
│   ├── PaymentMethod.tsx
│   └── InvoiceGenerator.tsx
├── profile/              # User profile components
│   ├── ProfileForm.tsx
│   ├── PortfolioManager.tsx
│   ├── SkillsEditor.tsx
│   ├── ProfileViewer.tsx
│   ├── ExperienceEditor.tsx
│   ├── EducationEditor.tsx
│   └── AvailabilitySettings.tsx
├── projects/             # Project-related components
│   ├── ProjectCard.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectDetails.tsx
│   ├── ProjectSearch.tsx
│   ├── ProjectFilters.tsx
│   ├── ProjectList.tsx
│   └── ProjectStatus.tsx
├── proposals/            # Proposal components
│   ├── ProposalForm.tsx
│   ├── ProposalCard.tsx
│   ├── ProposalList.tsx
│   ├── ProposalDetails.tsx
│   └── ProposalStatus.tsx
├── reviews/              # Review and rating components
│   ├── ReviewForm.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewList.tsx
│   ├── RatingDisplay.tsx
│   └── ReviewStats.tsx
├── search/               # Search functionality components
│   ├── SearchBar.tsx
│   ├── SearchFilters.tsx
│   ├── SearchResults.tsx
│   └── AdvancedSearch.tsx
├── services/             # Service package components
│   ├── ServiceCard.tsx
│   ├── ServiceForm.tsx
│   ├── ServiceList.tsx
│   └── ServiceDetails.tsx
├── support/              # Customer support components
│   ├── SupportTicketForm.tsx
│   ├── SupportTicketList.tsx
│   ├── SupportTicketDetails.tsx
│   └── SupportChat.tsx
├── ui/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── LoadingSpinner.tsx
│   ├── ConfirmDialog.tsx
│   ├── DataTable.tsx
│   ├── Pagination.tsx
│   ├── SearchInput.tsx
│   ├── FileUpload.tsx
│   ├── ImageUpload.tsx
│   ├── RichTextEditor.tsx
│   ├── DatePicker.tsx
│   ├── TimePicker.tsx
│   ├── ProgressBar.tsx
│   ├── StatusBadge.tsx
│   ├── AvatarUpload.tsx
│   ├── OfflineIndicator.tsx
│   └── ToastProvider.tsx
└── workLog/              # Work logging components
    ├── WorkLogForm.tsx
    ├── WorkLogList.tsx
    ├── TimeTracker.tsx
    └── WorkLogDetails.tsx
```
### 3.2 Key Component Implementations

#### 3.2.1 Layout Components

**Header.tsx**
```typescript
// Main navigation header with user menu and notifications
interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
  notifications: Notification[];
}

// Features:
// - Responsive navigation menu
// - User avatar and dropdown menu
// - Notification bell with count
// - Search functionality
// - Theme toggle
// - Mobile-friendly hamburger menu
```

**Sidebar.tsx**
```typescript
// Collapsible sidebar navigation
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'freelancer' | 'client';
}

// Features:
// - Role-based navigation items
// - Collapsible/expandable sections
// - Active route highlighting
// - Mobile responsive drawer
// - Quick action buttons
```

#### 3.2.2 Dashboard Components

**FreelancerDashboard.tsx**
```typescript
// Freelancer-specific dashboard with earnings, projects, and recommendations
interface FreelancerDashboardProps {
  user: FreelancerUser;
  stats: FreelancerStats;
  recentProjects: Project[];
  recommendations: Project[];
}

// Features:
// - Earnings overview and charts
// - Active contracts status
// - Project recommendations based on skills
// - Recent activity timeline
// - Quick actions (submit proposal, update availability)
// - Performance metrics
```

**ClientDashboard.tsx**
```typescript
// Client-specific dashboard with posted projects and hired freelancers
interface ClientDashboardProps {
  user: ClientUser;
  stats: ClientStats;
  activeProjects: Project[];
  hiredFreelancers: Freelancer[];
}

// Features:
// - Posted projects overview
// - Active contracts management
// - Freelancer performance tracking
// - Budget utilization charts
// - Quick actions (post project, hire freelancer)
// - Project milestone tracking
```

#### 3.2.3 Project Components

**ProjectCard.tsx**
```typescript
// Reusable project card component for listings
interface ProjectCardProps {
  project: Project;
  userRole: UserRole;
  onApply?: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
}

// Features:
// - Project title, description, and budget display
// - Skills tags and category badges
// - Client information and rating
// - Application deadline countdown
// - Action buttons based on user role
// - Responsive card layout
// - Hover effects and animations
```

**ProjectForm.tsx**
```typescript
// Comprehensive project creation/editing form
interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Features:
// - Multi-step form wizard
// - Rich text editor for description
// - Skills selection with autocomplete
// - Budget type selection (fixed/hourly)
// - File attachment support
// - Form validation with Formik + Yup
// - Auto-save draft functionality
// - Preview mode
```
#### 3.2.4 Messaging Components

**MessageList.tsx**
```typescript
// Real-time message display with infinite scrolling
interface MessageListProps {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => void;
  hasMore: boolean;
}

// Features:
// - Real-time message updates via Socket.io
// - Infinite scrolling for message history
// - Message status indicators (sent, delivered, read)
// - File attachment preview
// - Message timestamps with relative time
// - Auto-scroll to bottom for new messages
// - Message grouping by sender and time
// - Typing indicators
```

**MessageInput.tsx**
```typescript
// Message composition with file upload and emoji support
interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, attachments?: File[]) => void;
  onTyping: () => void;
  disabled?: boolean;
}

// Features:
// - Rich text input with formatting
// - File drag-and-drop upload
// - Emoji picker integration
// - Message preview before sending
// - Typing indicator broadcast
// - Auto-resize text area
// - Send on Enter (Shift+Enter for new line)
// - Character count display
```

#### 3.2.5 Payment Components

**PaymentForm.tsx**
```typescript
// Stripe-integrated payment form
interface PaymentFormProps {
  amount: number;
  currency: string;
  contractId: string;
  milestoneId?: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onError: (error: string) => void;
}

// Features:
// - Stripe Elements integration
// - Credit card input with validation
// - Payment method selection
// - Secure payment processing
// - Loading states and error handling
// - Payment confirmation modal
// - Receipt generation
// - Refund processing (admin only)
```

**EscrowStatus.tsx**
```typescript
// Escrow account balance and transaction display
interface EscrowStatusProps {
  contractId: string;
  escrowBalance: number;
  transactions: EscrowTransaction[];
  canRelease: boolean;
}

// Features:
// - Real-time balance updates
// - Transaction history with filtering
// - Milestone-based payment tracking
// - Release payment functionality
// - Dispute initiation
// - Commission calculation display
// - Payment schedule visualization
```
## 4. State Management

### 4.1 Redux Store Configuration

#### 4.1.1 Store Structure
```typescript
// store/index.ts - Main store configuration
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';

// Store slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import supportTicketReducer from './slices/supportTicketSlice';
import onboardingReducer from './slices/onboardingSlice';

// Persist configurations
import { 
  rootPersistConfig, 
  authPersistConfig, 
  uiPersistConfig 
} from './persistConfig';

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,     // Persisted - login state
  ui: persistedUiReducer,         // Persisted - theme, preferences
  user: userReducer,              // Session only - temporary data
  supportTicket: supportTicketReducer, // Session only
  onboarding: onboardingReducer,  // Session only - flow data
});
```

#### 4.1.2 Auth Slice Implementation
```typescript
// store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAt: string | null;
  sessionExpiry: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLoginAt: null,
  sessionExpiry: null,
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await authApi.refreshToken(auth.refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Auth slice with reducers
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.lastLoginAt = new Date().toISOString();
        state.sessionExpiry = action.payload.expiresAt;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});
```

#### 4.1.3 UI Slice Implementation
```typescript
// store/slices/uiSlice.ts
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
  loading: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: string | null;
  };
  snackbars: SnackbarMessage[];
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    setLoading: (state, action) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    addSnackbar: (state, action) => {
      state.snackbars.push({
        id: Date.now().toString(),
        ...action.payload,
      });
    },
    removeSnackbar: (state, action) => {
      state.snackbars = state.snackbars.filter(s => s.id !== action.payload);
    },
  },
});
```
### 4.2 TanStack Query Integration

#### 4.2.1 Query Client Configuration
```typescript
// config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
```

#### 4.2.2 Custom Query Hooks
```typescript
// hooks/api/useProjects.ts
export const useProjects = (filters?: ProjectFilters) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectApi.getProjects(filters),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes for project listings
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProjectById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Add the new project to the cache
      queryClient.setQueryData(['project', data.data.id], data);
      
      // Show success notification
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectApi.updateProject(id, data),
    onSuccess: (data, variables) => {
      // Update the specific project in cache
      queryClient.setQueryData(['project', variables.id], data);
      
      // Invalidate projects list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast.success('Project updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    },
  });
};
```

#### 4.2.3 Optimistic Updates
```typescript
// hooks/api/useMessages.ts
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: messageApi.sendMessage,
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['messages', newMessage.conversationId] 
      });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData([
        'messages', 
        newMessage.conversationId
      ]);
      
      // Optimistically update cache
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        (old: any) => ({
          ...old,
          data: [
            ...old.data,
            {
              ...newMessage,
              id: `temp-${Date.now()}`,
              status: 'sending',
              timestamp: new Date().toISOString(),
            },
          ],
        })
      );
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        context?.previousMessages
      );
      toast.error('Failed to send message');
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: ['messages', variables.conversationId] 
      });
    },
  });
};
```
## 5. Routing System

### 5.1 Route Configuration

#### 5.1.1 Public Routes
```typescript
// Public routes accessible without authentication
const publicRoutes = [
  {
    path: '/',
    element: <HomePage />,
    description: 'Landing page with platform overview'
  },
  {
    path: '/login',
    element: <LoginPage />,
    description: 'User authentication form'
  },
  {
    path: '/register',
    element: <RegisterPage />,
    description: 'User registration form'
  },
  {
    path: '/projects',
    element: <BrowseProjectsPage />,
    description: 'Public project listings'
  },
  {
    path: '/projects/:id',
    element: <ProjectDetailPage />,
    description: 'Individual project details'
  },
  {
    path: '/freelancers',
    element: <FreelancersPage />,
    description: 'Browse freelancer profiles'
  },
  {
    path: '/freelancer/:id',
    element: <FreelancerDetailPage />,
    description: 'Individual freelancer profile'
  },
  {
    path: '/about',
    element: <AboutPage />,
    description: 'About the platform'
  },
  {
    path: '/help',
    element: <HelpCenterPage />,
    description: 'Help and support center'
  },
  {
    path: '/contact',
    element: <ContactPage />,
    description: 'Contact information and form'
  }
];
```

#### 5.1.2 Protected Routes
```typescript
// Routes requiring authentication
const protectedRoutes = [
  {
    path: '/dashboard',
    element: <DashboardPage />,
    description: 'Role-specific user dashboard'
  },
  {
    path: '/profile',
    element: <ProfilePage />,
    description: 'User profile management'
  },
  {
    path: '/messages',
    element: <MessagesPage />,
    description: 'Real-time messaging interface'
  },
  {
    path: '/notifications',
    element: <NotificationsPage />,
    description: 'User notifications center'
  },
  {
    path: '/contracts',
    element: <ContractsPage />,
    description: 'Active and completed contracts'
  },
  {
    path: '/contracts/:id',
    element: <ContractDetailPage />,
    description: 'Individual contract details'
  },
  {
    path: '/payments',
    element: <PaymentsPage />,
    description: 'Payment history and methods'
  },
  {
    path: '/support',
    element: <SupportTicketsPage />,
    description: 'Customer support tickets'
  }
];
```

#### 5.1.3 Role-Specific Routes
```typescript
// Freelancer-specific routes
const freelancerRoutes = [
  {
    path: '/proposals',
    element: <ProposalsPage />,
    description: 'Submitted proposals management'
  },
  {
    path: '/earnings',
    element: <EarningsPage />,
    description: 'Earnings tracking and analytics'
  },
  {
    path: '/time-tracking',
    element: <TimeTrackingPage />,
    description: 'Time tracking for hourly projects'
  },
  {
    path: '/services',
    element: <ServicesPage />,
    description: 'Service package management'
  }
];

// Client-specific routes
const clientRoutes = [
  {
    path: '/projects/new',
    element: <NewProjectPage />,
    description: 'Create new project posting'
  },
  {
    path: '/projects/:id/edit',
    element: <EditProjectPage />,
    description: 'Edit existing project'
  },
  {
    path: '/projects/:projectId/proposals',
    element: <ProjectProposalsPage />,
    description: 'View proposals for a project'
  },
  {
    path: '/hire-now-requests',
    element: <HireNowRequestsPage />,
    description: 'Direct hire requests management'
  }
];

// Admin-specific routes
const adminRoutes = [
  {
    path: '/admin/dashboard',
    element: <AdminDashboardPage />,
    description: 'Administrative dashboard'
  },
  {
    path: '/admin/users',
    element: <AdminUsersPage />,
    description: 'User management interface'
  },
  {
    path: '/admin/analytics',
    element: <AnalyticsDashboardPage />,
    description: 'Platform analytics and metrics'
  },
  {
    path: '/admin/settings',
    element: <AdminSettingsPage />,
    description: 'Platform configuration settings'
  },
  {
    path: '/admin/transactions',
    element: <AdminTransactionsPage />,
    description: 'Financial transaction oversight'
  }
];
```

### 5.2 Route Protection Implementation

#### 5.2.1 ProtectedRoute Component
```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'freelancer' | 'client';
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  fallback = <Navigate to="/login" replace />
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access
  if (requiredPermissions && !hasPermissions(user, requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

#### 5.2.2 Route Guards and Middleware
```typescript
// utils/routeGuards.ts
export const routeGuards = {
  // Check if user can access admin routes
  canAccessAdmin: (user: User): boolean => {
    return user.role === 'admin' && user.accountStatus === 'active';
  },

  // Check if user can access freelancer features
  canAccessFreelancerFeatures: (user: User): boolean => {
    return (user.role === 'freelancer' || user.role === 'admin') && 
           user.isVerified;
  },

  // Check if user can access client features
  canAccessClientFeatures: (user: User): boolean => {
    return (user.role === 'client' || user.role === 'admin') && 
           user.accountStatus === 'active';
  },

  // Check if user has completed onboarding
  hasCompletedOnboarding: (user: User): boolean => {
    return user.onboardingCompleted || user.role === 'admin';
  },

  // Check specific permissions
  hasPermission: (user: User, permission: string): boolean => {
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }
};
```
## 6. API Integration

### 6.1 API Service Architecture

#### 6.1.1 Core API Configuration
```typescript
// services/api/core.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '@/store';
import { logout, refreshAuthToken } from '@/store/slices/authSlice';
import { toast } from 'react-hot-toast';

class ApiCore {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const state = store.getState();
            const refreshToken = state.auth.refreshToken;

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Attempt to refresh token
            const result = await store.dispatch(refreshAuthToken()).unwrap();
            const newToken = result.accessToken;

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(newToken));
            this.failedQueue = [];

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);

          } catch (refreshError) {
            // Refresh failed, logout user
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            
            store.dispatch(logout());
            toast.error('Session expired. Please login again.');
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: any) {
    const message = error.response?.data?.message || 'An error occurred';
    const status = error.response?.status;

    switch (status) {
      case 400:
        toast.error(`Bad Request: ${message}`);
        break;
      case 403:
        toast.error('Access denied');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (status >= 500) {
          toast.error('Server error. Please try again later.');
        }
    }
  }

  // HTTP methods
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config);
  }
}

export const apiCore = new ApiCore();
```

#### 6.1.2 Authentication API
```typescript
// services/api/authApi.ts
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'freelancer' | 'client';
  agreeToTerms: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export const authApi = {
  // User authentication
  login: (credentials: LoginCredentials) =>
    apiCore.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) =>
    apiCore.post<AuthResponse>('/auth/register', data),

  logout: () =>
    apiCore.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiCore.post<AuthResponse>('/auth/refresh', { refreshToken }),

  // Password management
  forgotPassword: (email: string) =>
    apiCore.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiCore.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiCore.post('/auth/change-password', { currentPassword, newPassword }),

  // Email verification
  sendVerificationEmail: () =>
    apiCore.post('/auth/send-verification'),

  verifyEmail: (token: string) =>
    apiCore.post('/auth/verify-email', { token }),

  // Session management
  validateSession: () =>
    apiCore.get('/auth/validate'),

  getUserProfile: () =>
    apiCore.get<User>('/auth/profile'),
};
```

#### 6.1.3 Project API
```typescript
// services/api/projectApi.ts
export interface ProjectFilters {
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'budget' | 'deadline';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  requirements: string[];
  attachments?: string[];
  applicationDeadline: string;
}

export const projectApi = {
  // Project CRUD operations
  getProjects: (filters?: ProjectFilters) =>
    apiCore.get('/projects', { params: filters }),

  getProjectById: (id: string) =>
    apiCore.get(`/projects/${id}`),

  createProject: (data: CreateProjectData) =>
    apiCore.post('/projects', data),

  updateProject: (id: string, data: Partial<CreateProjectData>) =>
    apiCore.put(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    apiCore.delete(`/projects/${id}`),

  // Project status management
  publishProject: (id: string) =>
    apiCore.patch(`/projects/${id}/publish`),

  pauseProject: (id: string) =>
    apiCore.patch(`/projects/${id}/pause`),

  closeProject: (id: string) =>
    apiCore.patch(`/projects/${id}/close`),

  // Project proposals
  getProjectProposals: (projectId: string) =>
    apiCore.get(`/projects/${projectId}/proposals`),

  // Project analytics
  getProjectAnalytics: (id: string) =>
    apiCore.get(`/projects/${id}/analytics`),

  // Featured projects
  getFeaturedProjects: () =>
    apiCore.get('/projects/featured'),

  // Project recommendations
  getRecommendedProjects: (userId?: string) =>
    apiCore.get('/projects/recommended', { params: { userId } }),
};
```
#### 6.1.4 Real-time API Integration
```typescript
// services/api/socketApi.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { addNotification } from '@/store/slices/uiSlice';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const state = store.getState();
    const token = state.auth.token;

    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Message events
    this.socket.on('message:new', (message) => {
      // Handle new message
      this.handleNewMessage(message);
    });

    this.socket.on('message:read', (data) => {
      // Handle message read status
      this.handleMessageRead(data);
    });

    this.socket.on('message:typing', (data) => {
      // Handle typing indicator
      this.handleTypingIndicator(data);
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      store.dispatch(addNotification(notification));
    });

    // Project events
    this.socket.on('project:updated', (project) => {
      // Handle project updates
      this.handleProjectUpdate(project);
    });

    this.socket.on('proposal:new', (proposal) => {
      // Handle new proposal
      this.handleNewProposal(proposal);
    });

    // Contract events
    this.socket.on('contract:signed', (contract) => {
      // Handle contract signing
      this.handleContractSigned(contract);
    });

    this.socket.on('milestone:approved', (milestone) => {
      // Handle milestone approval
      this.handleMilestoneApproved(milestone);
    });

    // User presence events
    this.socket.on('user:online', (userId) => {
      this.handleUserOnline(userId);
    });

    this.socket.on('user:offline', (userId) => {
      this.handleUserOffline(userId);
    });
  }

  // Message methods
  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('conversation:leave', conversationId);
  }

  sendMessage(conversationId: string, content: string, attachments?: string[]) {
    this.socket?.emit('message:send', {
      conversationId,
      content,
      attachments,
    });
  }

  markMessageAsRead(messageId: string) {
    this.socket?.emit('message:read', messageId);
  }

  sendTypingIndicator(conversationId: string) {
    this.socket?.emit('message:typing', conversationId);
  }

  // Project methods
  joinProjectRoom(projectId: string) {
    this.socket?.emit('project:join', projectId);
  }

  leaveProjectRoom(projectId: string) {
    this.socket?.emit('project:leave', projectId);
  }

  // Event handlers
  private handleNewMessage(message: any) {
    // Update message cache
    // Show notification if not in conversation
    // Play notification sound
  }

  private handleMessageRead(data: any) {
    // Update message read status in cache
  }

  private handleTypingIndicator(data: any) {
    // Show/hide typing indicator
  }

  private handleProjectUpdate(project: any) {
    // Invalidate project cache
    // Show notification
  }

  private handleNewProposal(proposal: any) {
    // Update proposals cache
    // Show notification to project owner
  }

  private handleContractSigned(contract: any) {
    // Update contract cache
    // Show success notification
  }

  private handleMilestoneApproved(milestone: any) {
    // Update milestone status
    // Show notification
  }

  private handleUserOnline(userId: string) {
    // Update user online status
  }

  private handleUserOffline(userId: string) {
    // Update user offline status
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
```

### 6.2 Error Handling Strategy

#### 6.2.1 Global Error Handler
```typescript
// utils/errorHandler.ts
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  field?: string;
  details?: any;
}

export class ErrorHandler {
  static handle(error: any): ApiError {
    // Network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    }

    const { status, data } = error.response;

    // Server provided error message
    if (data?.message) {
      return {
        message: data.message,
        status,
        code: data.code,
        field: data.field,
        details: data.details,
      };
    }

    // Default error messages by status code
    const defaultMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please login.',
      403: 'Access denied. You don\'t have permission.',
      404: 'Resource not found.',
      409: 'Conflict. Resource already exists.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
    };

    return {
      message: defaultMessages[status] || 'An unexpected error occurred.',
      status,
    };
  }

  static isNetworkError(error: any): boolean {
    return !error.response;
  }

  static isAuthError(error: any): boolean {
    return error.response?.status === 401;
  }

  static isValidationError(error: any): boolean {
    return error.response?.status === 422;
  }

  static isServerError(error: any): boolean {
    return error.response?.status >= 500;
  }
}
```
## 7. Custom Hooks

### 7.1 Authentication Hooks

#### 7.1.1 useAuth Hook
```typescript
// hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { RootState } from '@/store';
import { loginUser, logout, refreshAuthToken } from '@/store/slices/authSlice';
import { socketService } from '@/services/api/socketApi';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      
      // Connect to socket after successful login
      socketService.connect();
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Logout function
  const logoutUser = useCallback(() => {
    // Disconnect socket
    socketService.disconnect();
    
    // Clear auth state
    dispatch(logout());
    
    // Clear any cached data
    localStorage.removeItem('persist:root');
  }, [dispatch]);

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return auth.user?.role === role;
  }, [auth.user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string) => {
    if (auth.user?.role === 'admin') return true;
    return auth.user?.permissions?.includes(permission) || false;
  }, [auth.user]);

  // Check if user can access resource
  const canAccess = useCallback((resource: string, action: string) => {
    if (!auth.isAuthenticated) return false;
    if (auth.user?.role === 'admin') return true;
    
    const permission = `${resource}:${action}`;
    return hasPermission(permission);
  }, [auth.isAuthenticated, auth.user, hasPermission]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.sessionExpiry) return;

    const expiryTime = new Date(auth.sessionExpiry).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

    if (refreshTime > 0) {
      const timeoutId = setTimeout(() => {
        dispatch(refreshAuthToken());
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    }
  }, [auth.isAuthenticated, auth.sessionExpiry, dispatch]);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout: logoutUser,
    hasRole,
    hasPermission,
    canAccess,
  };
};
```

### 7.2 Socket Integration Hooks

#### 7.2.1 useSocket Hook
```typescript
// hooks/useSocket.ts
import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/api/socketApi';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const listenersRef = useRef<Map<string, Function>>(new Map());

  // Connect/disconnect based on auth status
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Add event listener
  const on = useCallback((event: string, callback: Function) => {
    listenersRef.current.set(event, callback);
    // Implementation would add listener to socket service
  }, []);

  // Remove event listener
  const off = useCallback((event: string) => {
    listenersRef.current.delete(event);
    // Implementation would remove listener from socket service
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    // Implementation would emit through socket service
  }, []);

  // Join room
  const joinRoom = useCallback((room: string) => {
    emit('join', room);
  }, [emit]);

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    emit('leave', room);
  }, [emit]);

  return {
    isConnected: socketService.isConnected(),
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
  };
};
```

#### 7.2.2 useMessages Hook
```typescript
// hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { messageApi } from '@/services/api/messageApi';

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const socket = useSocket();

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await messageApi.getMessages(conversationId);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!conversationId || !socket.isConnected) return;

    // Join conversation room
    socket.joinRoom(`conversation:${conversationId}`);

    // Listen for new messages
    socket.on('message:new', (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for typing indicators
    socket.on('message:typing', ({ userId, conversationId: msgConvId }) => {
      if (msgConvId === conversationId) {
        setIsTyping(prev => [...prev.filter(id => id !== userId), userId]);
        
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setIsTyping(prev => prev.filter(id => id !== userId));
        }, 3000);
      }
    });

    // Listen for message read status
    socket.on('message:read', ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), userId] }
          : msg
      ));
    });

    return () => {
      socket.leaveRoom(`conversation:${conversationId}`);
      socket.off('message:new');
      socket.off('message:typing');
      socket.off('message:read');
    };
  }, [conversationId, socket]);

  // Send message
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!conversationId || !content.trim()) return;

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments && attachments.length > 0) {
        // Implementation for file upload
      }

      // Send message via API
      const response = await messageApi.sendMessage({
        conversationId,
        content: content.trim(),
        attachments: attachmentUrls,
      });

      // Optimistically add message to local state
      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);

      // Emit via socket for real-time delivery
      socket.emit('message:send', {
        conversationId,
        content: content.trim(),
        attachments: attachmentUrls,
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [conversationId, socket]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!conversationId) return;
    socket.emit('message:typing', conversationId);
  }, [conversationId, socket]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messageApi.markAsRead(messageId);
      socket.emit('message:read', { messageId, conversationId });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [conversationId, socket]);

  return {
    messages,
    isTyping,
    isLoading,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  };
};
```

### 7.3 Utility Hooks

#### 7.3.1 useDebounce Hook
```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Usage example:
// const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

#### 7.3.2 useLocalStorage Hook
```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
```

#### 7.3.3 useOnlineStatus Hook
```typescript
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```