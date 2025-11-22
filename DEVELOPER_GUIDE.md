# TalentHive Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Code Organization](#code-organization)
5. [Development Workflow](#development-workflow)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)

---

## Project Overview

### What is TalentHive?

TalentHive is a comprehensive freelancing platform built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript. It connects clients with freelancers for project-based work.

### Key Features

- **User Management**: Three roles (Admin, Client, Freelancer)
- **Project Management**: Complete lifecycle from posting to completion
- **Proposal System**: Freelancers submit proposals, clients review
- **Contract Management**: Milestones, deliverables, amendments
- **Payment System**: Stripe integration with escrow
- **Messaging**: Real-time chat with Socket.io
- **Notifications**: Real-time system-wide notifications
- **Analytics**: Admin dashboard with insights
- **File Upload**: Cloudinary integration

### Tech Stack

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Caching**: Redis
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Payments**: Stripe
- **Email**: Resend
- **File Storage**: Cloudinary

#### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit + React Query
- **Routing**: React Router v6
- **Forms**: Formik + Yup

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  React + TypeScript + Material-UI + Redux + React Query     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────┴──────────────────────────────────────┐
│                      API Gateway Layer                       │
│              Express.js + TypeScript + Socket.io            │
└──────────────────────┬──────────────────────────────────────┘
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

### Backend Architecture

```
server/src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   ├── redis.ts     # Redis connection
│   └── cloudinary.ts# Cloudinary config
├── controllers/     # Request handlers
│   ├── authController.ts
│   ├── projectController.ts
│   └── ...
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication
│   ├── roleAuth.ts  # Authorization
│   └── errorHandler.ts
├── models/          # Mongoose schemas
│   ├── User.ts
│   ├── Project.ts
│   └── ...
├── routes/          # API routes
│   ├── auth.ts
│   ├── projects.ts
│   └── ...
├── services/        # Business logic
│   ├── payment.service.ts
│   ├── notification.service.ts
│   └── socket.service.ts
├── utils/           # Utility functions
│   ├── email.ts
│   ├── fileUpload.ts
│   └── logger.ts
└── index.ts         # Application entry
```

### Frontend Architecture

```
client/src/
├── components/      # Reusable components
│   ├── auth/
│   ├── projects/
│   ├── notifications/
│   └── ui/
├── pages/           # Route components
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   └── ...
├── store/           # Redux store
│   └── slices/
├── services/        # API services
│   └── api/
├── hooks/           # Custom hooks
│   └── api/
├── theme/           # MUI theme
└── main.tsx         # Application entry
```

---

## Getting Started

### Prerequisites

```bash
Node.js >= 16.0.0
MongoDB >= 6.0.0
Redis >= 6.0.0
npm >= 8.0.0
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/talenthive.git
cd talenthive

# Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# Setup environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Configure environment variables (see below)

# Seed database
cd server
npm run seed

# Start development servers
cd ..
npm run dev
```

### Environment Variables

#### Server (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/talenthive
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (Resend)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@talenthive.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

---

## Code Organization

### Naming Conventions

#### Files
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `DashboardPage.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `api.ts`, `authService.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)

#### Code
- **Interfaces**: Prefix with `I` (e.g., `IUser`, `IProject`)
- **Types**: PascalCase (e.g., `UserRole`, `ProjectStatus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Functions**: camelCase (e.g., `getUserById`, `validateEmail`)
- **Variables**: camelCase (e.g., `userId`, `projectList`)

### Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (path aliases)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. Relative imports
import { helper } from './utils';
import styles from './styles.module.css';

// 4. Type-only imports
import type { User } from '@/types/user';
```

### Component Structure

```tsx
// Imports
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// Types
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// Component
export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Hooks
  const [state, setState] = useState('');
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  );
};
```

---

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Push to remote
git push origin feature/amazing-feature

# Create pull request on GitHub
```

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(auth): add email verification
fix(payments): resolve escrow release bug
docs(api): update endpoint documentation
```

### Development Commands

```bash
# Start development servers
npm run dev              # Both frontend and backend
npm run server:dev       # Backend only
npm run client:dev       # Frontend only

# Build for production
npm run build           # Both
npm run server:build    # Backend
npm run client:build    # Frontend

# Run tests
npm test               # All tests
npm run server:test    # Backend tests
npm run client:test    # Frontend tests

# Linting
npm run lint           # Check all
npm run lint:fix       # Fix issues

# Database
npm run seed           # Seed database
```

---

## API Documentation

### Authentication

All authenticated endpoints require Bearer token:

```
Authorization: Bearer <access_token>
```

### Standard Response Format

```json
{
  "status": "success",
  "data": { },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response Format

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

### Example API Call

```typescript
// Using the API service
import { projectsService } from '@/services/api/projects.service';

const createProject = async (data) => {
  try {
    const response = await projectsService.createProject(data);
    return response.data;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};
```

---

## Database Schema

### Key Models

#### User
```typescript
{
  email: string;
  password: string;
  role: 'admin' | 'freelancer' | 'client';
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  freelancerProfile?: {
    title: string;
    hourlyRate: number;
    skills: string[];
    // ...
  };
  isVerified: boolean;
  createdAt: Date;
}
```

#### Project
```typescript
{
  title: string;
  description: string;
  client: ObjectId;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
  };
  status: 'open' | 'in_progress' | 'completed';
  createdAt: Date;
}
```

#### Contract
```typescript
{
  project: ObjectId;
  client: ObjectId;
  freelancer: ObjectId;
  totalAmount: number;
  status: 'draft' | 'active' | 'completed';
  milestones: [{
    title: string;
    amount: number;
    status: string;
    dueDate: Date;
  }];
  createdAt: Date;
}
```

### Relationships

```
User (Client) ──1:N── Project
Project ──1:N── Proposal
Proposal ──1:1── Contract
Contract ──1:N── Milestone
User ──1:N── Message
User ──1:N── Notification
```

---

## Testing

### Backend Testing

```typescript
// Example Jest test
describe('User Controller', () => {
  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      role: 'freelancer'
    };
    
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(userData.email);
  });
});
```

### Frontend Testing

```typescript
// Example React Testing Library test
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## Deployment

### Production Build

```bash
# Build both applications
npm run build

# Or separately
npm run server:build
npm run client:build
```

### Environment Setup

1. Set production environment variables
2. Configure MongoDB Atlas
3. Setup Redis Cloud
4. Configure Cloudinary
5. Setup Stripe webhooks
6. Configure domain and SSL

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Redis configured
- [ ] Stripe webhooks setup
- [ ] Cloudinary configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

---

## Best Practices

### Code Quality

1. **TypeScript**: Use strict mode, avoid `any`
2. **ESLint**: Fix all linting errors
3. **Prettier**: Format code consistently
4. **Comments**: Document complex logic
5. **DRY**: Don't repeat yourself

### Security

1. **Never commit secrets**: Use environment variables
2. **Validate input**: Both frontend and backend
3. **Sanitize data**: Prevent XSS and injection
4. **Use HTTPS**: In production
5. **Keep dependencies updated**: Regular updates

### Performance

1. **Optimize queries**: Use indexes, pagination
2. **Cache data**: Use Redis for frequent queries
3. **Lazy load**: Components and images
4. **Code split**: By route
5. **Compress**: Images and responses

### Error Handling

1. **Try-catch**: All async operations
2. **User-friendly messages**: No technical jargon
3. **Log errors**: For debugging
4. **Graceful degradation**: Handle failures
5. **Error boundaries**: In React

---

## Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check MongoDB is running
mongod --version
# Start MongoDB
mongod
```

#### Port Already in Use
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

#### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Resources

### Documentation
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Material-UI Docs](https://mui.com/)
- [Stripe Docs](https://stripe.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [Redis Commander](https://github.com/joeferner/redis-commander) - Redis GUI

---

## Support

For questions or issues:
- Check this documentation
- Review code comments
- Test with seed data
- Check server logs
- Use Postman collection

---

**Happy Coding! 🚀**
