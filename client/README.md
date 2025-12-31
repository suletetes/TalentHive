# TalentHive Client

React-based frontend application for the TalentHive freelancing platform.

##  Current Status

**Last Updated:** December 31, 2025  
**Status:** Development - Critical Issues Identified  
**Bug Report:** See `FRONTEND_BUGS_AND_ISSUES_REPORT.md` for detailed analysis

### Critical Issues Requiring Immediate Attention:
1. **API Base URL Mismatch** - Frontend expects `/api/v1` but server uses `/api`
2. **Sensitive Data Exposure** - Real API keys committed to repository
3. **TypeScript Strict Mode Disabled** - Type safety compromised
4. **Inconsistent API Response Handling** - Data access failures

## Technology Stack

- React 18 with TypeScript (strict mode disabled - needs fixing)
- Material-UI (MUI) v5 for UI components
- Redux Toolkit for state management with Redux Persist
- TanStack Query (React Query) v5 for server state management
- React Router v6 for routing
- Formik + Yup for form validation
- Vite for build tooling and development server
- Socket.io client for real-time features
- Axios for HTTP requests with interceptors

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

 **SECURITY WARNING:** The current `.env` file contains real API keys that should not be committed to version control.

Create a `.env` file in the client directory with the following variables:

```env
# API Configuration - CRITICAL: Fix base URL
VITE_API_BASE_URL=http://localhost:5000/api  # Changed from /api/v1
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=TalentHive
VITE_APP_VERSION=1.0.0

# External Services - USE PLACEHOLDER VALUES
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_DEVTOOLS=true

# Environment
VITE_NODE_ENV=development
```

### Required Environment Variables:
- `VITE_API_BASE_URL` - Backend API base URL (must match server configuration)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for payments
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for file uploads

## Development

```bash
# Start development server (port 3000)
npm run dev

# Run tests (currently limited test coverage)
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code (if configured)
npm run format
```

##  Known Issues

Before starting development, please review the `FRONTEND_BUGS_AND_ISSUES_REPORT.md` file for:
- 28 identified issues across 8 categories
- Critical API integration problems
- Type safety concerns
- Security vulnerabilities
- Performance optimization opportunities

### Quick Fixes Needed:
1. Update `VITE_API_BASE_URL` in `.env` to `http://localhost:5000/api`
2. Replace real API keys with placeholder values
3. Enable TypeScript strict mode in `tsconfig.json`
4. Fix API response data access patterns

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   │   ├── admin/       # Admin-specific components
│   │   ├── auth/        # Authentication components
│   │   ├── contracts/   # Contract management
│   │   ├── layout/      # Layout components (Header, Footer)
│   │   ├── messaging/   # Real-time messaging
│   │   ├── notifications/ # Notification system
│   │   ├── payments/    # Payment components
│   │   ├── profile/     # User profile components
│   │   ├── projects/    # Project management
│   │   ├── proposals/   # Proposal system
│   │   ├── reviews/     # Review and rating
│   │   └── ui/          # Generic UI components
│   ├── hooks/           # Custom React hooks
│   │   └── api/         # API-specific hooks
│   ├── pages/           # Route-level page components
│   ├── services/        # API service layer
│   │   └── api/         # API service modules
│   ├── store/           # Redux store configuration
│   │   └── slices/      # Redux Toolkit slices
│   ├── theme/           # MUI theme configuration
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

## Key Features

### User Roles & Authentication
- **Client:** Post projects, hire freelancers, manage contracts and payments
- **Freelancer:** Browse projects, submit proposals, deliver work, track time
- **Admin:** Platform management, analytics, user oversight, transaction monitoring

### Core Functionality
- **Project Management:** Create, edit, browse projects with advanced filtering
- **Proposal System:** Submit, review, and manage project proposals
- **Contract Management:** Milestone-based contracts with digital signatures
- **Payment Processing:** Secure payments with Stripe integration and escrow
- **Real-time Messaging:** Socket.io-powered chat system
- **Notification System:** Real-time notifications for all user actions
- **Review & Rating:** Comprehensive feedback system
- **Time Tracking:** Built-in time tracking for hourly projects
- **Organization Management:** Team and organization features
- **Admin Dashboard:** Analytics, user management, and platform oversight

### Technical Features
- **Responsive Design:** Mobile-first approach with Material-UI
- **Dark/Light Theme:** User preference-based theming
- **Offline Support:** Basic offline detection and handling
- **Error Boundaries:** Comprehensive error handling and recovery
- **Performance Optimization:** Code splitting, lazy loading, and caching
- **Real-time Updates:** Socket.io integration for live updates

## API Integration

 **Current Issue:** API base URL mismatch between frontend and backend.

The client communicates with the backend API through service modules located in `src/services/api/`. Each service handles a specific domain:

- `auth.service.ts` - Authentication and authorization
- `projects.service.ts` - Project CRUD operations and filtering
- `proposals.service.ts` - Proposal submission and management
- `contracts.service.ts` - Contract lifecycle and milestone management
- `payments.service.ts` - Stripe payment processing and escrow
- `messages.service.ts` - Real-time messaging system
- `notifications.service.ts` - Notification management
- `users.service.ts` - User profiles and freelancer discovery
- `reviews.service.ts` - Review and rating system
- `upload.service.ts` - File upload with Cloudinary
- `admin.service.ts` - Admin dashboard and analytics

### API Architecture
- **Base Service:** `core.ts` handles authentication, interceptors, and error handling
- **Response Format:** Standardized API responses with status, message, and data
- **Error Handling:** Automatic token refresh and error transformation
- **Request Interceptors:** Automatic authentication header injection

## State Management

### Redux Store (Global State)
Application-wide state managed with Redux Toolkit:
- `auth` - User authentication state and tokens
- `ui` - UI preferences (theme, sidebar state)
- `user` - User profile data
- `supportTicket` - Support ticket management
- `onboarding` - User onboarding flow state

**Persistence:** Redux Persist maintains auth and UI state across sessions.

### TanStack Query (Server State)
Server state managed with React Query v5:
- **Automatic Caching:** Intelligent background refetching
- **Optimistic Updates:** Immediate UI updates with rollback on error
- **Background Synchronization:** Keeps data fresh automatically
- **Query Invalidation:** Smart cache invalidation strategies
- **Error Handling:** Centralized error handling with retry logic

### Query Key Factories
Organized query keys in `src/config/queryClient.ts`:
- Projects, proposals, contracts, payments
- Messages, notifications, reviews
- User profiles and analytics
- Admin dashboard data

**Cache Configuration:**
- Static data: 1 hour stale time
- User data: 10 minutes stale time
- Real-time data: 30 seconds stale time

## Routing

Routes are defined in `App.tsx` with nested route structure:

### Public Routes (No Authentication Required)
- `/` - Home page with platform overview
- `/login`, `/register` - Authentication pages
- `/projects` - Browse public projects
- `/freelancers` - Browse freelancer profiles
- `/freelancer/:id` - Public freelancer profile
- `/client/:id` - Public client profile
- Static pages: `/about`, `/help`, `/privacy`, `/terms`

### Protected Routes (Authentication Required)
- `/dashboard` - Role-based dashboard (client/freelancer/admin)
- `/dashboard/profile` - User profile management
- `/dashboard/projects` - User's projects
- `/dashboard/proposals` - Proposal management
- `/dashboard/contracts` - Contract management
- `/dashboard/payments` - Payment history
- `/dashboard/messages` - Messaging interface
- `/dashboard/notifications` - Notification center

### Admin Routes (Admin Role Required)
- `/admin/dashboard` - Admin analytics dashboard
- `/admin/users` - User management
- `/admin/projects` - Project oversight
- `/admin/transactions` - Payment monitoring
- `/admin/support` - Support ticket management

### Route Protection
- `ProtectedRoute` component handles authentication checks
- Role-based access control for admin routes
- Automatic redirect to login for unauthenticated users
- Return URL preservation for post-login redirect

## Styling

Material-UI (MUI) v5 with custom theme:
- Light and dark mode support
- Responsive design with breakpoints
- Custom color palette
- Typography scale
- Component overrides

Theme configuration: `src/theme/index.ts`

## Testing

 **Current Status:** Limited test coverage - needs improvement.

Tests are configured with Vitest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report (when implemented)
npm run test:coverage
```

### Test Configuration
- **Test Runner:** Vitest with jsdom environment
- **Testing Library:** React Testing Library for component testing
- **Setup:** `src/test/setup.ts` for test configuration
- **Timeout:** 5 seconds for tests and hooks

### Testing Recommendations
1. **Unit Tests:** Critical utilities and hooks
2. **Component Tests:** Key user interface components
3. **Integration Tests:** API service layer
4. **E2E Tests:** Critical user workflows
5. **Performance Tests:** Bundle size and loading times

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Output directory: dist/
```

The build process:
1. TypeScript compilation
2. Code splitting and tree shaking
3. Asset optimization
4. Source map generation

## Deployment

### Environment Setup
1. Set production environment variables
2. Update API URLs
3. Configure CDN for static assets

### Build and Deploy
```bash
# Build production bundle
npm run build

# Deploy dist/ directory to hosting service
# (Vercel, Netlify, AWS S3, etc.)
```

### Docker Deployment
```bash
# Build Docker image
docker build -t talenthive-client -f Dockerfile.prod .

# Run container
docker run -p 80:80 talenthive-client
```

## Performance Optimization

### Current Optimizations
- **Code Splitting:** Route-based and vendor library splitting
- **Lazy Loading:** Dynamic imports for non-critical components
- **Bundle Analysis:** Vite rollup configuration for optimal chunks
- **Query Caching:** TanStack Query with intelligent cache management
- **Image Optimization:** Cloudinary integration for responsive images

### Bundle Configuration
```javascript
// Vite manual chunks configuration
manualChunks: {
  vendor: ['react', 'react-dom'],
  mui: ['@mui/material', '@mui/icons-material'],
  router: ['react-router-dom'],
  redux: ['@reduxjs/toolkit', 'react-redux'],
}
```

### Performance Monitoring
- React DevTools Profiler integration
- Bundle size tracking with Vite
- Query performance monitoring with React Query DevTools

### Optimization Opportunities (See Bug Report)
- Further bundle size reduction
- Component re-render optimization
- Image lazy loading implementation
- Memory usage optimization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

**API Connection Errors:**
```bash
# Check if backend is running on port 5000
curl http://localhost:5000/api/health

# Verify environment variables
cat .env | grep VITE_API_BASE_URL
```

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- --port 3001
```

**Module Not Found Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build Errors:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

**TypeScript Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit
# Enable strict mode gradually
```

**Authentication Issues:**
- Check token expiration in browser DevTools
- Verify API base URL matches backend
- Clear localStorage/sessionStorage if needed

### Development Tips
- Use React DevTools for component debugging
- Use Redux DevTools for state inspection
- Use React Query DevTools for cache inspection
- Check Network tab for API request/response details

## Contributing

### Development Workflow
1. **Review Bug Report:** Check `FRONTEND_BUGS_AND_ISSUES_REPORT.md` before starting
2. **Follow Code Style:** ESLint configuration with TypeScript rules
3. **Write Tests:** Add tests for new features and bug fixes
4. **Update Documentation:** Keep README and comments current
5. **Submit Pull Request:** Include description of changes and testing

### Code Standards
- **TypeScript:** Use proper types, avoid `any`
- **Components:** Functional components with hooks
- **Styling:** Material-UI with custom theme
- **State:** Redux for global state, React Query for server state
- **Error Handling:** Consistent error boundaries and user feedback