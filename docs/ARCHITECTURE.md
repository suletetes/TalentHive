# TalentHive System Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Real-Time Communication](#real-time-communication)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability](#scalability)

---

## System Overview

TalentHive is a full-stack freelancing platform built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript. The system connects clients with freelancers for project-based work, with secure payments, real-time communication, and comprehensive project management.

### Key Components

1. **Frontend**: React-based single-page application
2. **Backend**: Express.js REST API with WebSocket support
3. **Database**: MongoDB for data persistence
4. **Cache**: Redis for session and data caching
5. **File Storage**: Cloudinary for file uploads
6. **Payments**: Stripe for payment processing
7. **Email**: Resend for email notifications
8. **Real-time**: Socket.io for WebSocket communication

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  React 18 + TypeScript + Material-UI + Redux + React Query      │
│  ├── Components (UI, Pages, Layouts)                            │
│  ├── State Management (Redux Toolkit)                           │
│  ├── Server State (React Query)                                 │
│  ├── Services (API, Socket)                                     │
│  └── Hooks (Custom, API, Socket)                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────┴──────────────────────────────────────────┐
│                    API Gateway Layer                             │
│  Express.js + TypeScript + Socket.io                            │
│  ├── Routes (Auth, Projects, Proposals, etc.)                   │
│  ├── Controllers (Business Logic)                               │
│  ├── Middleware (Auth, Error, Rate Limit)                       │
│  ├── Services (Payment, Email, Upload)                          │
│  └── WebSocket (Real-time Events)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴────┐  ┌──────┴─────┐  ┌────┴──────┐
│  MongoDB   │  │   Redis    │  │  Stripe   │
│  Database  │  │   Cache    │  │  Payment  │
└────────────┘  └────────────┘  └───────────┘
        │              │              │
┌───────┴────┐  ┌──────┴─────┐  ┌────┴──────┐
│ Cloudinary │  │   Resend   │  │  Socket   │
│   Files    │  │   Email    │  │  Real-time│
└────────────┘  └────────────┘  └───────────┘
```

---

## Technology Stack

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript runtime |
| Framework | Express.js | Web framework |
| Language | TypeScript | Type safety |
| Database | MongoDB | NoSQL database |
| ODM | Mongoose | MongoDB object modeling |
| Cache | Redis | Session and data caching |
| Auth | JWT | Token-based authentication |
| Real-time | Socket.io | WebSocket communication |
| Payments | Stripe | Payment processing |
| Email | Resend | Email service |
| Files | Cloudinary | File storage and CDN |
| Testing | Jest | Unit and integration tests |
| Validation | express-validator | Input validation |

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | UI library |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast build tool |
| State Mgmt | Redux Toolkit | Global state |
| Server State | React Query | Server state management |
| UI Library | Material-UI v5 | Component library |
| Routing | React Router v6 | Client-side routing |
| Forms | Formik + Yup | Form management |
| HTTP | Axios | HTTP client |
| WebSocket | Socket.io-client | Real-time communication |
| Testing | Vitest | Unit tests |
| Testing | React Testing Library | Component tests |

### DevOps

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy and static serving |
| GitHub Actions | CI/CD pipeline |
| MongoDB Atlas | Managed MongoDB |
| Redis Cloud | Managed Redis |

---

## Backend Architecture

### Directory Structure

```
server/src/
├── config/                 # Configuration files
│   ├── database.ts        # MongoDB connection
│   ├── redis.ts           # Redis connection
│   ├── cloudinary.ts      # Cloudinary config
│   ├── stripe.ts          # Stripe config
│   └── socket.ts          # Socket.io config
├── controllers/            # Request handlers
│   ├── authController.ts
│   ├── projectController.ts
│   ├── proposalController.ts
│   ├── contractController.ts
│   ├── paymentController.ts
│   ├── messageController.ts
│   ├── notificationController.ts
│   ├── userController.ts
│   ├── reviewController.ts
│   ├── organizationController.ts
│   ├── analyticsController.ts
│   ├── adminController.ts
│   └── ...
├── middleware/             # Express middleware
│   ├── auth.ts            # Authentication
│   ├── roleAuth.ts        # Authorization
│   ├── errorHandler.ts    # Error handling
│   ├── rateLimiter.ts     # Rate limiting
│   ├── security.ts        # Security headers
│   └── performance.ts     # Performance monitoring
├── models/                 # Mongoose schemas
│   ├── User.ts
│   ├── Project.ts
│   ├── Proposal.ts
│   ├── Contract.ts
│   ├── Payment.ts
│   ├── Message.ts
│   ├── Notification.ts
│   ├── Review.ts
│   ├── Organization.ts
│   ├── Transaction.ts
│   └── ...
├── routes/                 # Express routes
│   ├── auth.ts
│   ├── projects.ts
│   ├── proposals.ts
│   ├── contracts.ts
│   ├── payments.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── users.ts
│   ├── reviews.ts
│   ├── organizations.ts
│   ├── admin.ts
│   ├── analytics.ts
│   └── index.ts
├── services/               # Business logic
│   ├── payment.service.ts
│   ├── notification.service.ts
│   ├── socket.service.ts
│   ├── email.service.ts
│   ├── upload.service.ts
│   └── analytics.service.ts
├── utils/                  # Utility functions
│   ├── jwt.ts             # JWT utilities
│   ├── email.ts           # Email utilities
│   ├── fileUpload.ts      # File upload utilities
│   ├── logger.ts          # Logging
│   ├── validation.ts      # Validation helpers
│   └── errorHandler.ts    # Error handling
├── types/                  # TypeScript types
│   ├── auth.ts
│   ├── user.ts
│   ├── project.ts
│   ├── proposal.ts
│   ├── contract.ts
│   ├── payment.ts
│   ├── message.ts
│   ├── notification.ts
│   └── ...
├── scripts/                # Database scripts
│   ├── seed.ts            # Seed data
│   └── migrate.ts         # Database migrations
├── test/                   # Test files
│   ├── auth.test.ts
│   ├── project.test.ts
│   ├── payment.test.ts
│   └── ...
└── index.ts               # Application entry point
```

### Request Flow

```
1. Client sends HTTP request
   ↓
2. Express receives request
   ↓
3. Middleware processes request
   - Security headers
   - Rate limiting
   - Authentication
   - Validation
   ↓
4. Router matches route
   ↓
5. Controller handles request
   - Validate input
   - Call service
   - Format response
   ↓
6. Service executes business logic
   - Database queries
   - External API calls
   - Data processing
   ↓
7. Response sent to client
   ↓
8. Client processes response
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. Controller validates input
   ↓
3. Service queries database
   ↓
4. Password verified with bcrypt
   ↓
5. JWT tokens generated
   - Access token (7 days)
   - Refresh token (30 days)
   ↓
6. Tokens sent to client
   ↓
7. Client stores tokens
   ↓
8. Client includes access token in requests
   ↓
9. Middleware verifies token
   ↓
10. Request processed or rejected
```

---

## Frontend Architecture

### Directory Structure

```
client/src/
├── components/             # Reusable components
│   ├── auth/              # Auth components
│   ├── projects/          # Project components
│   ├── proposals/         # Proposal components
│   ├── contracts/         # Contract components
│   ├── payments/          # Payment components
│   ├── messages/          # Messaging components
│   ├── notifications/     # Notification components
│   ├── profile/           # Profile components
│   ├── organizations/     # Organization components
│   ├── admin/             # Admin components
│   ├── layout/            # Layout components
│   └── ui/                # Generic UI components
├── pages/                  # Route components
│   ├── auth/              # Auth pages
│   ├── admin/             # Admin pages
│   └── ...
├── store/                  # Redux store
│   ├── index.ts           # Store configuration
│   └── slices/            # Redux slices
│       ├── authSlice.ts
│       ├── userSlice.ts
│       └── uiSlice.ts
├── services/               # API services
│   ├── api/               # API service layer
│   │   ├── core.ts        # Axios instance
│   │   ├── auth.service.ts
│   │   ├── projects.service.ts
│   │   ├── proposals.service.ts
│   │   ├── contracts.service.ts
│   │   ├── payments.service.ts
│   │   ├── messages.service.ts
│   │   ├── notifications.service.ts
│   │   └── ...
│   └── socket/            # Socket.io service
│       └── socket.service.ts
├── hooks/                  # Custom hooks
│   ├── useAuth.ts         # Auth hook
│   ├── useSocket.ts       # Socket hook
│   ├── api/               # API hooks
│   │   ├── useProjects.ts
│   │   ├── useProposals.ts
│   │   ├── useContracts.ts
│   │   ├── usePayments.ts
│   │   ├── useMessages.ts
│   │   ├── useNotifications.ts
│   │   └── ...
│   └── ...
├── types/                  # TypeScript types
│   ├── user.ts
│   ├── project.ts
│   ├── proposal.ts
│   ├── contract.ts
│   ├── payment.ts
│   ├── message.ts
│   ├── notification.ts
│   └── ...
├── utils/                  # Utility functions
│   ├── errorHandler.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── ...
├── theme/                  # Material-UI theme
│   └── index.ts
├── config/                 # Configuration
│   └── queryClient.ts      # React Query config
├── test/                   # Test files
│   ├── auth.test.tsx
│   ├── project.test.tsx
│   └── ...
└── main.tsx               # Application entry point
```

### Component Architecture

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   ├── NotificationBell
│   │   └── UserMenu
│   ├── Sidebar
│   │   └── Navigation Links
│   ├── Main Content
│   │   └── Routes
│   │       ├── HomePage
│   │       ├── DashboardPage
│   │       ├── ProjectsPage
│   │       ├── ProposalsPage
│   │       ├── ContractsPage
│   │       ├── PaymentsPage
│   │       ├── MessagesPage
│   │       ├── ProfilePage
│   │       ├── AdminDashboard
│   │       └── ...
│   └── Footer
└── Modals/Dialogs
    ├── ConfirmationDialog
    ├── FormModal
    └── ...
```

### State Management

```
Redux Store
├── auth
│   ├── user
│   ├── token
│   ├── isAuthenticated
│   └── role
├── user
│   ├── profile
│   ├── preferences
│   └── settings
└── ui
    ├── theme
    ├── sidebarOpen
    ├── notifications
    └── modals
```

### Data Flow

```
1. User interaction (click, submit, etc.)
   ↓
2. Event handler triggered
   ↓
3. API call via service
   ↓
4. Request sent to backend
   ↓
5. Response received
   ↓
6. Redux action dispatched (if needed)
   ↓
7. State updated
   ↓
8. Component re-renders
   ↓
9. UI updated
```

---

## Database Design

### Core Collections

#### Users
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  role: 'admin' | 'client' | 'freelancer',
  profile: {
    firstName: string,
    lastName: string,
    avatar: string,
    bio: string,
    phone: string,
    location: string
  },
  freelancerProfile: {
    title: string,
    hourlyRate: number,
    skills: ObjectId[],
    portfolio: ObjectId[],
    experience: string,
    certifications: string[]
  },
  verification: {
    email: boolean,
    phone: boolean,
    identity: boolean,
    level: 'none' | 'email' | 'phone' | 'identity' | 'premium'
  },
  settings: {
    notifications: boolean,
    emailNotifications: boolean,
    privateProfile: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Projects
```typescript
{
  _id: ObjectId,
  title: string,
  description: string,
  client: ObjectId,
  category: ObjectId,
  skills: ObjectId[],
  budget: {
    type: 'fixed' | 'hourly',
    min: number,
    max: number,
    currency: string
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    duration: number
  },
  status: 'open' | 'in_progress' | 'completed' | 'cancelled',
  proposals: ObjectId[],
  contracts: ObjectId[],
  attachments: string[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Proposals
```typescript
{
  _id: ObjectId,
  project: ObjectId,
  freelancer: ObjectId,
  bidAmount: number,
  deliveryDays: number,
  coverLetter: string,
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn',
  highlighted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Contracts
```typescript
{
  _id: ObjectId,
  project: ObjectId,
  proposal: ObjectId,
  client: ObjectId,
  freelancer: ObjectId,
  totalAmount: number,
  status: 'draft' | 'active' | 'completed' | 'cancelled',
  milestones: [{
    _id: ObjectId,
    title: string,
    description: string,
    amount: number,
    dueDate: Date,
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid',
    deliverables: string[],
    submittedAt: Date,
    approvedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments/Transactions
```typescript
{
  _id: ObjectId,
  contract: ObjectId,
  milestone: ObjectId,
  client: ObjectId,
  freelancer: ObjectId,
  amount: number,
  platformCommission: number,
  freelancerAmount: number,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  stripePaymentIntentId: string,
  stripeTransferId: string,
  paidAt: Date,
  releasedAt: Date,
  createdAt: Date
}
```

### Relationships

```
User (Client) ──1:N── Project
Project ──1:N── Proposal
Proposal ──1:1── Contract
Contract ──1:N── Milestone
Milestone ──1:1── Payment
User (Freelancer) ──1:N── Proposal
User ──1:N── Message
User ──1:N── Notification
User ──1:N── Review
Organization ──1:N── User (members)
Organization ──1:N── Project
```

### Indexes

```typescript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: -1 })

// Projects
db.projects.createIndex({ client: 1 })
db.projects.createIndex({ status: 1 })
db.projects.createIndex({ category: 1 })
db.projects.createIndex({ createdAt: -1 })

// Proposals
db.proposals.createIndex({ project: 1 })
db.proposals.createIndex({ freelancer: 1 })
db.proposals.createIndex({ status: 1 })

// Contracts
db.contracts.createIndex({ client: 1 })
db.contracts.createIndex({ freelancer: 1 })
db.contracts.createIndex({ status: 1 })

// Payments
db.payments.createIndex({ contract: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ createdAt: -1 })
```

---

## API Design

### RESTful Principles

- **Resources**: Projects, Proposals, Contracts, Payments, etc.
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
- **Response Format**: JSON with consistent structure

### API Versioning

- Current version: `v1`
- Base URL: `/api/v1`
- Future versions: `/api/v2`, `/api/v3`, etc.

### Authentication

- **Method**: JWT Bearer tokens
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 7 days (access), 30 days (refresh)
- **Refresh Endpoint**: `POST /auth/refresh`

### Rate Limiting

- **General**: 100 requests per 15 minutes
- **Auth**: 5 requests per 15 minutes
- **Payments**: 10 requests per 15 minutes
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Pagination

- **Query Parameters**: `page`, `limit`
- **Default**: page=1, limit=20
- **Response**: Includes `pagination` object with `page`, `limit`, `total`, `pages`

### Filtering

- **Query Parameters**: Feature-specific filters
- **Examples**: `status=open`, `category=web-development`, `budget_min=1000`

### Sorting

- **Query Parameter**: `sort`
- **Format**: `field:asc` or `field:desc`
- **Example**: `sort=createdAt:desc`

---

## Real-Time Communication

### Socket.io Architecture

```
Client (Socket.io-client)
    ↓
WebSocket Connection
    ↓
Server (Socket.io)
    ↓
Event Handlers
    ↓
Database/Services
    ↓
Broadcast to Clients
```

### Event Types

#### Message Events
- `message:send` - Send message
- `message:new` - Receive new message
- `message:typing` - User typing
- `message:read` - Message read

#### Notification Events
- `notification:new` - New notification
- `notification:read` - Notification read

#### Proposal Events
- `proposal:update` - Proposal updated
- `proposal:status` - Status changed

#### Contract Events
- `contract:update` - Contract updated
- `milestone:update` - Milestone updated

#### Payment Events
- `payment:update` - Payment updated
- `payment:status` - Status changed

### Connection Management

```
1. User authenticates
   ↓
2. Socket connects with JWT token
   ↓
3. Server verifies token
   ↓
4. User joined to rooms
   - User room: `user:${userId}`
   - Project room: `project:${projectId}`
   - Conversation room: `conversation:${conversationId}`
   ↓
5. Events broadcast to relevant rooms
   ↓
6. User disconnects
   ↓
7. User removed from rooms
```

---

## Security Architecture

### Authentication

- **Password Hashing**: bcrypt with salt rounds 10
- **JWT Tokens**: HS256 algorithm
- **Token Storage**: Secure HTTP-only cookies (recommended)
- **Token Refresh**: Automatic refresh on 401 response

### Authorization

- **Role-Based Access Control (RBAC)**
  - Admin: Full access
  - Client: Project, proposal, contract, payment access
  - Freelancer: Proposal, contract, payment access

- **Resource-Level Authorization**
  - Users can only access their own resources
  - Clients can only manage their projects
  - Freelancers can only manage their proposals

### Data Protection

- **HTTPS**: All communication encrypted
- **CORS**: Configured for frontend domain
- **CSRF Protection**: Token-based protection
- **Input Validation**: All inputs validated
- **SQL Injection Prevention**: Parameterized queries (MongoDB)
- **XSS Prevention**: Output encoding, Content Security Policy

### Payment Security

- **PCI DSS Compliance**: Via Stripe
- **No Card Storage**: Cards handled by Stripe
- **Webhook Verification**: Stripe signature verification
- **Idempotency**: Prevent duplicate charges

### File Upload Security

- **File Type Validation**: Whitelist allowed types
- **File Size Limits**: Maximum 50MB per file
- **Virus Scanning**: Cloudinary scanning
- **Secure URLs**: Expiring URLs for sensitive files

---

## Deployment Architecture

### Development Environment

```
Local Machine
├── Frontend (Vite dev server on port 3000)
├── Backend (Express on port 5000)
├── MongoDB (local or Atlas)
└── Redis (local or Cloud)
```

### Production Environment

```
Docker Compose
├── Frontend Container (Nginx)
├── Backend Container (Node.js)
├── MongoDB Container
├── Redis Container
└── Volumes for persistence
```

### CI/CD Pipeline

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions triggered
   ↓
3. Run tests
   ↓
4. Build Docker images
   ↓
5. Push to registry
   ↓
6. Deploy to production
   ↓
7. Run health checks
   ↓
8. Notify team
```

---

## Scalability

### Horizontal Scaling

1. **Load Balancing**
   - Nginx load balancer
   - Round-robin distribution
   - Health checks

2. **Multiple Backend Instances**
   - Scale backend containers
   - Shared database
   - Shared Redis cache

3. **Database Scaling**
   - MongoDB Atlas for managed scaling
   - Sharding for large datasets
   - Read replicas for read-heavy workloads

### Vertical Scaling

1. **Increase Resources**
   - More CPU cores
   - More RAM
   - Faster storage

2. **Optimization**
   - Database query optimization
   - Caching strategies
   - Code optimization

### Caching Strategy

1. **Redis Cache**
   - Session storage
   - User data cache
   - Project listings cache
   - Analytics cache

2. **CDN**
   - Static assets
   - Images via Cloudinary
   - API responses (where applicable)

### Database Optimization

1. **Indexing**
   - Index frequently queried fields
   - Compound indexes for common queries
   - Regular index analysis

2. **Query Optimization**
   - Aggregation pipelines
   - Projection to limit fields
   - Pagination for large datasets

3. **Connection Pooling**
   - MongoDB connection pooling
   - Redis connection pooling
   - Stripe API connection management

---

## Monitoring and Observability

### Logging

- **Application Logs**: Winston logger
- **Access Logs**: Nginx access logs
- **Error Logs**: Centralized error tracking
- **Audit Logs**: Admin actions

### Metrics

- **Performance Metrics**
  - Response times
  - Request rates
  - Error rates
  - Database query times

- **Business Metrics**
  - User registrations
  - Projects posted
  - Transactions processed
  - Revenue

### Health Checks

- **Endpoint**: `/api/health`
- **Checks**: Database, Redis, Stripe, Email service
- **Frequency**: Every 30 seconds

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: Current
