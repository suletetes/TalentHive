# TalentHive Codebase Documentation

## Comprehensive Guide to Client and Server Architecture

**Project**: TalentHive - A Comprehensive Freelancing Platform  
**Technology Stack**: MERN (MongoDB, Express.js, React, Node.js) with TypeScript  
**Architecture**: Three-tier layered architecture with microservice-ready design

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Client-Side Architecture](#2-client-side-architecture)
3. [Server-Side Architecture](#3-server-side-architecture)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Security Implementation](#6-security-implementation)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Configuration](#8-deployment-configuration)

---

## 1. Project Overview

### 1.1 Architecture Pattern
**Three-Tier Layered Architecture:**
- **Presentation Layer**: React 18 with TypeScript (Client)
- **Business Logic Layer**: Node.js with Express.js (Server)
- **Data Access Layer**: MongoDB with Mongoose ODM

### 1.2 Technology Stack Summary
```
Frontend: React 18 + TypeScript + Material-UI + Redux Toolkit + Vite
Backend: Node.js 18+ + Express.js + TypeScript + Socket.io
Database: MongoDB 7.0+ + Redis 7.2+ (caching)
Testing: Jest (Backend) + Vitest (Frontend)
Deployment: Docker + Docker Compose
```

### 1.3 Key Features
- **User Management**: JWT authentication with role-based access control
- **Project Management**: Complete project lifecycle management
- **Real-time Communication**: Socket.io-powered messaging
- **Payment Processing**: Stripe integration with escrow services
- **File Management**: Cloudinary integration for file storage
- **Admin Dashboard**: Comprehensive platform management

---

## 2. Client-Side Architecture

### 2.1 Project Structure
```
client/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── manifest.json
│   └── sw.js              # Service worker
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route-level components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── store/            # Redux store configuration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── theme/            # Material-UI theme configuration
│   ├── config/           # Application configuration
│   ├── test/             # Test files
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
└── Dockerfile            # Docker configuration
```

### 2.2 Component Architecture

#### 2.2.1 Component Organization
```
components/
├── admin/                # Admin-specific components
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── PlatformAnalytics.tsx
│   └── CommissionSettings.tsx
├── auth/                 # Authentication components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── PasswordReset.tsx
│   └── EmailVerification.tsx
├── dashboard/            # Dashboard components
│   ├── FreelancerDashboard.tsx
│   ├── ClientDashboard.tsx
│   ├── StatsCard.tsx
│   └── RecentActivity.tsx
├── projects/             # Project-related components
│   ├── ProjectCard.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectDetails.tsx
│   └── ProjectSearch.tsx
├── proposals/            # Proposal components
│   ├── ProposalForm.tsx
│   ├── ProposalCard.tsx
│   └── ProposalList.tsx
├── contracts/            # Contract management
│   ├── ContractDetails.tsx
│   ├── MilestoneTracker.tsx
│   └── ContractActions.tsx
├── payments/             # Payment components
│   ├── PaymentForm.tsx
│   ├── PaymentHistory.tsx
│   └── EscrowStatus.tsx
├── messaging/            # Real-time messaging
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── ConversationList.tsx
│   └── FileUpload.tsx
├── profile/              # User profile components
│   ├── ProfileForm.tsx
│   ├── PortfolioManager.tsx
│   ├── SkillsEditor.tsx
│   └── ProfileViewer.tsx
├── layout/               # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
└── ui/                   # Reusable UI components
    ├── Button.tsx
    ├── Modal.tsx
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

#### 2.2.2 Key Component Explanations

**AdminDashboard.tsx**
```typescript
// Comprehensive admin interface for platform management
// Features: User oversight, analytics, dispute resolution
// Permissions: Admin role required
// Real-time updates via Socket.io
```

**ProjectCard.tsx**
```typescript
// Displays project information in card format
// Props: project data, user role, interaction handlers
// Features: Responsive design, action buttons, status indicators
```

**MessageList.tsx**
```typescript
// Real-time message display component
// Features: Auto-scroll, typing indicators, file attachments
// Integration: Socket.io for real-time updates
```

### 2.3 State Management

#### 2.3.1 Redux Store Structure
```
store/
├── index.ts              # Store configuration
├── persistConfig.ts      # Redux Persist configuration
└── slices/
    ├── authSlice.ts      # Authentication state
    ├── userSlice.ts      # User profile state
    ├── projectSlice.ts   # Project management state
    ├── contractSlice.ts  # Contract state
    ├── messageSlice.ts   # Messaging state
    ├── paymentSlice.ts   # Payment state
    └── uiSlice.ts        # UI state (modals, notifications)
```

#### 2.3.2 State Management Strategy
- **Redux Toolkit**: Global state management with RTK Query
- **TanStack Query**: Server state management and caching
- **Redux Persist**: State persistence across sessions
- **Local State**: Component-level state with useState/useReducer

### 2.4 Routing Architecture

#### 2.4.1 Route Structure
```typescript
// Protected routes with role-based access
const routes = {
  public: [
    '/',           // Home page
    '/login',      // Authentication
    '/register',   // User registration
    '/about',      // About page
  ],
  authenticated: [
    '/dashboard',  // Role-specific dashboard
    '/profile',    // User profile
    '/messages',   // Messaging interface
    '/projects',   // Project management
  ],
  freelancer: [
    '/proposals',  // Proposal management
    '/contracts',  // Active contracts
    '/earnings',   // Earnings tracking
  ],
  client: [
    '/post-project',     // Project posting
    '/hire-freelancers', // Freelancer search
    '/manage-projects',  // Project oversight
  ],
  admin: [
    '/admin/dashboard',  // Admin dashboard
    '/admin/users',      // User management
    '/admin/analytics',  // Platform analytics
  ]
};
```

### 2.5 API Integration

#### 2.5.1 Service Layer Structure
```
services/
├── api.ts                # Base API configuration
├── organizationService.ts # Organization management
└── api/
    ├── authApi.ts        # Authentication endpoints
    ├── userApi.ts        # User management endpoints
    ├── projectApi.ts     # Project CRUD operations
    ├── proposalApi.ts    # Proposal management
    ├── contractApi.ts    # Contract operations
    ├── paymentApi.ts     # Payment processing
    ├── messageApi.ts     # Messaging endpoints
    └── adminApi.ts       # Admin operations
```

#### 2.5.2 API Service Implementation
```typescript
// Example: projectApi.ts
export const projectApi = {
  // Get all projects with filtering and pagination
  getProjects: (params: ProjectFilters) => 
    api.get('/projects', { params }),
  
  // Create new project
  createProject: (data: CreateProjectData) => 
    api.post('/projects', data),
  
  // Update project
  updateProject: (id: string, data: UpdateProjectData) => 
    api.put(`/projects/${id}`, data),
  
  // Delete project
  deleteProject: (id: string) => 
    api.delete(`/projects/${id}`),
  
  // Get project details
  getProjectById: (id: string) => 
    api.get(`/projects/${id}`),
};
```

### 2.6 Custom Hooks

#### 2.6.1 Hook Organization
```
hooks/
├── useAuth.ts            # Authentication hook
├── useSocket.ts          # Socket.io integration
├── useDebounce.ts        # Debouncing utility
├── useResponsive.ts      # Responsive design hook
├── useLoadingState.ts    # Loading state management
├── useOnlineStatus.ts    # Network status detection
└── api/
    ├── index.ts          # Hook exports
    ├── useProjects.ts    # Project data hooks
    ├── useContracts.ts   # Contract data hooks
    ├── usePayments.ts    # Payment data hooks
    └── useMessages.ts    # Messaging hooks
```

#### 2.6.2 Key Hook Implementations

**useAuth.ts**
```typescript
// Authentication state and operations
// Features: Login/logout, token management, role checking
// Integration: Redux store, API calls, local storage
```

**useSocket.ts**
```typescript
// Socket.io connection management
// Features: Connection handling, event listeners, room management
// Real-time: Message delivery, notifications, status updates
```

---

## 3. Server-Side Architecture

### 3.1 Project Structure
```
server/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── test/             # Test files
│   ├── scripts/          # Database seeding scripts
│   └── index.ts          # Server entry point
├── coverage/             # Test coverage reports
├── dist/                 # Compiled JavaScript
├── logs/                 # Application logs
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest test configuration
└── Dockerfile            # Docker configuration
```

### 3.2 Controllers Layer

#### 3.2.1 Controller Organization
```
controllers/
├── adminController.ts         # Admin operations
├── contractController.ts      # Contract management
├── messageController.ts       # Messaging operations
├── organizationController.ts  # Organization management
├── paymentController.ts       # Payment processing
├── projectController.ts       # Project CRUD operations
├── proposalController.ts      # Proposal management
├── servicePackageController.ts # Service packages
├── supportTicketController.ts # Support ticket system
├── timeTrackingController.ts  # Time tracking
└── userController.ts          # User management
```

#### 3.2.2 Controller Implementation Pattern

**projectController.ts**
```typescript
// RESTful API endpoints for project management
// GET /projects - List projects with filtering/pagination
// POST /projects - Create new project
// GET /projects/:id - Get project details
// PUT /projects/:id - Update project
// DELETE /projects/:id - Delete project
// Validation, error handling, response formatting
```

**paymentController.ts**
```typescript
// Stripe payment integration
// Milestone-based payment processing
// Escrow account management
// Webhook handling for payment events
// Commission calculation (5% platform fee)
```

### 3.3 Models Layer

#### 3.3.1 Database Models
```
models/
├── User.ts               # User profiles and authentication
├── Project.ts            # Project information and requirements
├── Proposal.ts           # Freelancer proposals
├── Contract.ts           # Project contracts and milestones
├── Payment.ts            # Payment transactions
├── Message.ts            # Real-time messaging
├── Organization.ts       # Enterprise organizations
├── ServicePackage.ts     # Freelancer service packages
├── SupportTicket.ts      # Customer support system
└── TimeEntry.ts          # Time tracking entries
```

#### 3.3.2 Model Implementation Examples

**User.ts**
```typescript
// Comprehensive user model with role-based profiles
// Embedded documents: freelancer profile, client profile
// Authentication: email, password hash, verification status
// Profile: skills, experience, portfolio, ratings
// Relationships: projects, contracts, messages
```

**Project.ts**
```typescript
// Project lifecycle management
// Fields: title, description, requirements, budget, timeline
// Status: draft, open, in-progress, completed, cancelled
// Relationships: client, proposals, contracts
// Search: text indexes for title and description
```

**Contract.ts**
```typescript
// Milestone-based contract management
// Embedded milestones with deliverables and payments
// Status tracking: draft, active, completed, disputed
// Payment integration with Stripe
// Audit trail for all contract changes
```

### 3.4 Services Layer

#### 3.4.1 Service Organization
```
services/
├── analytics.service.ts   # Analytics and reporting
├── email.service.ts       # Email notifications
├── notification.service.ts # Push notifications
├── payment.service.ts     # Payment processing logic
├── socket.service.ts      # Real-time communication
└── upload.service.ts      # File upload management
```

#### 3.4.2 Service Implementations

**payment.service.ts**
```typescript
// Milestone-based payment processing
// Escrow account management
// Automatic commission calculation
// Payment dispute handling
// Integration with Stripe API
```

**socket.service.ts**
```typescript
// Real-time messaging implementation
// Room-based communication (project-specific)
// File sharing with Cloudinary integration
// Typing indicators and online status
// Message persistence and history
```

**email.service.ts**
```typescript
// Transactional email delivery
// Template-based email generation
// Email verification and password reset
// Notification emails for platform events
// Integration with Resend email service
```

### 3.5 Middleware Layer

#### 3.5.1 Middleware Organization
```
middleware/
├── auth.ts               # Authentication middleware
├── errorHandler.ts       # Global error handling
├── rateLimiter.ts        # API rate limiting
├── security.ts           # Security headers and CORS
└── performance.ts        # Performance monitoring
```

#### 3.5.2 Middleware Implementations

**auth.ts**
```typescript
// JWT token verification
// Role-based access control
// Route protection based on user roles
// Token refresh mechanism
```

**security.ts**
```typescript
// Helmet.js security headers
// CORS configuration with origin whitelist
// Request size limits (10MB max)
// XSS and CSRF protection
```

**rateLimiter.ts**
```typescript
// API rate limiting (100 requests per 15 minutes)
// IP-based and user-based limiting
// Different limits for different endpoints
// Redis-based rate limit storage
```

### 3.6 Configuration Layer

#### 3.6.1 Configuration Files
```
config/
├── database.ts           # MongoDB connection configuration
├── redis.ts              # Redis connection setup
├── socket.ts             # Socket.io configuration
└── stripe.ts             # Stripe API configuration
```

#### 3.6.2 Configuration Details

**database.ts**
```typescript
// MongoDB connection with Mongoose
// Connection pooling and retry logic
// Database indexing strategy
// Environment-specific configurations
```

**redis.ts**
```typescript
// Redis connection for caching and sessions
// Connection retry logic
// Environment-specific configurations
// Health check implementation
```

---

## 4. Database Design

### 4.1 MongoDB Schema Design

#### 4.1.1 Core Collections
```
Collections:
├── users                 # User profiles and authentication
├── projects              # Project postings and requirements
├── proposals             # Freelancer proposals
├── contracts             # Project contracts with milestones
├── payments              # Payment transactions and escrow
├── messages              # Real-time messaging
├── organizations         # Enterprise client accounts
├── servicepackages       # Freelancer service offerings
├── supporttickets        # Customer support system
└── timeentries           # Time tracking data
```

#### 4.1.2 Relationship Patterns

**One-to-Many Relationships:**
```typescript
// User to Projects (one client can have many projects)
user: ObjectId -> projects: [ObjectId]

// Project to Proposals (one project can have many proposals)
project: ObjectId -> proposals: [ObjectId]

// Contract to Milestones (embedded documents)
contract: { milestones: [MilestoneSchema] }
```

**Many-to-Many Relationships:**
```typescript
// Users to Skills (freelancers can have multiple skills)
user.freelancerProfile.skills: [String]

// Projects to Skills (projects can require multiple skills)
project.skills: [ObjectId] // References to Skill collection
```

### 4.2 Indexing Strategy

#### 4.2.1 Performance Indexes
```typescript
// User collection indexes
{ email: 1 }                    // Unique index for authentication
{ role: 1 }                     // Role-based queries
{ 'freelancerProfile.skills': 1 } // Skill-based searches
{ 'rating.average': -1 }        // Top-rated freelancers

// Project collection indexes
{ status: 1, createdAt: -1 }    // Active projects by date
{ 'budget.min': 1, 'budget.max': 1 } // Budget range queries
{ skills: 1 }                   // Skill-based project matching
```

#### 4.2.2 Search Indexes
```typescript
// Text search indexes
projects: { title: 'text', description: 'text' }
users: { 'profile.firstName': 'text', 'profile.lastName': 'text' }
```

---

## 5. API Design

### 5.1 RESTful API Structure

#### 5.1.1 API Endpoints Overview
```
Authentication:
POST   /api/auth/login           # User login
POST   /api/auth/register        # User registration
POST   /api/auth/refresh         # Token refresh
POST   /api/auth/logout          # User logout

Users:
GET    /api/users                # List users (admin)
GET    /api/users/:id            # Get user profile
PUT    /api/users/:id            # Update user profile
DELETE /api/users/:id            # Delete user (admin)

Projects:
GET    /api/projects             # List projects with filters
POST   /api/projects             # Create new project
GET    /api/projects/:id         # Get project details
PUT    /api/projects/:id         # Update project
DELETE /api/projects/:id         # Delete project

Proposals:
GET    /api/proposals            # List user proposals
POST   /api/proposals            # Submit proposal
GET    /api/proposals/:id        # Get proposal details
PUT    /api/proposals/:id        # Update proposal
DELETE /api/proposals/:id        # Withdraw proposal

Contracts:
GET    /api/contracts            # List user contracts
POST   /api/contracts            # Create contract
GET    /api/contracts/:id        # Get contract details
PUT    /api/contracts/:id        # Update contract
POST   /api/contracts/:id/milestones/:milestoneId/approve # Approve milestone

Payments:
GET    /api/payments             # Payment history
POST   /api/payments/process     # Process payment
POST   /api/payments/release     # Release milestone payment
GET    /api/payments/balance     # Get account balance

Messages:
GET    /api/messages/conversations # List conversations
GET    /api/messages/:conversationId # Get messages
POST   /api/messages             # Send message
PUT    /api/messages/:id         # Mark as read

Admin:
GET    /api/admin/dashboard      # Admin dashboard data
GET    /api/admin/users          # User management
GET    /api/admin/analytics      # Platform analytics
POST   /api/admin/settings       # Update platform settings
```

#### 5.1.2 Request/Response Patterns

**Standard Response Format:**
```typescript
{
  status: 'success' | 'error',
  message: string,
  data?: any,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number
  },
  errors?: ValidationError[]
}
```

**Error Response Format:**
```typescript
{
  status: 'error',
  message: 'Validation failed',
  errors: [
    {
      field: 'email',
      message: 'Email is required'
    }
  ]
}
```

### 5.2 WebSocket Events

#### 5.2.1 Real-time Events
```typescript
// Message events
'message:new'        // New message received
'message:read'       // Message marked as read
'message:typing'     // User is typing

// Notification events
'notification:new'   // New notification
'notification:read'  // Notification read

// Project events
'project:updated'    // Project status changed
'proposal:new'       // New proposal received
'contract:signed'    // Contract signed

// System events
'user:online'        // User came online
'user:offline'       // User went offline
```

---

## 6. Security Implementation

### 6.1 Authentication & Authorization

#### 6.1.1 JWT Implementation
```typescript
// Token structure
{
  access_token: {
    payload: { userId, role, email },
    expiry: '7 days'
  },
  refresh_token: {
    payload: { userId },
    expiry: '30 days'
  }
}
```

#### 6.1.2 Role-Based Access Control
```typescript
// Role hierarchy
admin > client | freelancer

// Permission matrix
const permissions = {
  admin: ['*'], // All permissions
  client: ['project:create', 'project:update', 'contract:create'],
  freelancer: ['proposal:create', 'contract:accept', 'time:track']
};
```

### 6.2 Data Protection

#### 6.2.1 Input Validation
```typescript
// Server-side validation with express-validator
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
body('hourlyRate').isNumeric().isFloat({ min: 0 })
```

#### 6.2.2 Data Sanitization
```typescript
// MongoDB injection prevention
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());

// XSS prevention
import { body } from 'express-validator';
body('description').escape().trim()
```

### 6.3 Payment Security

#### 6.3.1 Stripe Integration
```typescript
// PCI DSS compliance through Stripe
// No card data stored on servers
// Webhook signature verification
// Secure payment processing
```

---

## 7. Testing Strategy

### 7.1 Frontend Testing

#### 7.1.1 Test Structure
```
client/src/test/
├── setup.ts              # Test configuration
├── auth.test.tsx          # Authentication tests
├── contract.test.tsx      # Contract functionality tests
├── payment.test.tsx       # Payment processing tests
├── profile.test.tsx       # Profile management tests
├── project.test.tsx       # Project CRUD tests
├── proposal.test.tsx      # Proposal tests
└── workLog.test.tsx       # Work logging tests
```

#### 7.1.2 Testing Tools
```typescript
// Vitest for unit testing
// React Testing Library for component testing
// MSW (Mock Service Worker) for API mocking
// Jest DOM for DOM assertions
```

### 7.2 Backend Testing

#### 7.2.1 Test Structure
```
server/src/test/
├── auth.test.ts           # Authentication tests
├── contract.test.ts       # Contract tests
├── middleware.test.ts     # Middleware tests
├── payment.test.ts        # Payment tests
├── profile.test.ts        # Profile tests
├── project.test.ts        # Project tests
├── proposal.test.ts       # Proposal tests
├── servicePackage.test.ts # Service package tests
└── timeTracking.test.ts   # Time tracking tests
```

#### 7.2.2 Testing Tools
```typescript
// Jest for unit and integration testing
// Supertest for API endpoint testing
// MongoDB Memory Server for database testing
// Sinon for mocking external services
```

---

## 8. Deployment Configuration

### 8.1 Docker Configuration

#### 8.1.1 Client Dockerfile
```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 8.1.2 Server Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### 8.2 Environment Configuration

#### 8.2.1 Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/talenthive
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# External Services
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_URL=cloudinary://...
RESEND_API_KEY=re_...

# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://talenthive.com
```

### 8.3 Production Optimizations

#### 8.3.1 Performance Optimizations
```typescript
// Code splitting and lazy loading
// Image optimization with Cloudinary
// CDN integration for static assets
// Database query optimization
// Redis caching implementation
// Gzip compression
```

#### 8.3.2 Monitoring & Logging
```typescript
// Winston for structured logging
// Error tracking with Sentry
// Performance monitoring
// Health check endpoints
// Metrics collection
```

---

## Conclusion

This comprehensive documentation covers the complete TalentHive codebase architecture, providing detailed explanations of both client and server implementations. The system demonstrates modern web development practices with a focus on scalability, security, and maintainability.

**Key Architectural Decisions:**
- **TypeScript**: Type safety across the entire stack
- **Component-based Architecture**: Reusable and maintainable UI components
- **Service Layer Pattern**: Clean separation of business logic
- **RESTful API Design**: Standard HTTP methods and status codes
- **Real-time Features**: Socket.io for instant communication
- **Secure Payment Processing**: Stripe integration with PCI DSS compliance
- **Comprehensive Testing**: Unit, integration, and end-to-end testing
- **Docker Containerization**: Consistent deployment across environments

This architecture supports the platform's core mission of providing a secure, efficient, and user-friendly freelancing experience while maintaining code quality and development velocity.