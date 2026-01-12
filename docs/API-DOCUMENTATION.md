# TalentHive API Documentation

## Overview

TalentHive is a comprehensive freelancing platform API built with Node.js, Express, and MongoDB. This document provides complete API reference, authentication details, and usage examples.

**Base URL**: `http://localhost:5000/api/v1` (Development)  
**Production URL**: `https://api.talenthive.com/api/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
6. [Webhooks](#webhooks)
7. [WebSocket Events](#websocket-events)
8. [Best Practices](#best-practices)

---

## Authentication

### JWT Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Login

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "freelancer",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Register

**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "role": "freelancer",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

### Refresh Token

**Endpoint**: `POST /auth/refresh`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

**Endpoint**: `POST /auth/logout`

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `USER_NOT_FOUND` | User does not exist |
| `UNAUTHORIZED` | Token is missing or invalid |
| `FORBIDDEN` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `PAYMENT_FAILED` | Payment processing failed |
| `STRIPE_ERROR` | Stripe API error |
| `FILE_UPLOAD_ERROR` | File upload failed |

### Error Response Example

```json
{
  "status": "error",
  "message": "Validation failed",
  "error": "Email is required",
  "code": "VALIDATION_ERROR"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Payment endpoints**: 10 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## API Endpoints

### Authentication (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/refresh` | Refresh access token |

### Users (11 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get current user profile |
| PUT | `/users/profile` | Update user profile |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id/password` | Change password |
| GET | `/users/:id/skills` | Get user skills |
| POST | `/users/:id/skills` | Add skill to user |
| DELETE | `/users/:id/skills/:skillId` | Remove skill |
| GET | `/users/freelancers` | Get all freelancers |
| GET | `/users/freelancers/search` | Search freelancers |
| POST | `/users/:id/portfolio` | Add portfolio item |
| GET | `/users/:id/portfolio` | Get portfolio items |

### Projects (10 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects` | Get all projects |
| GET | `/projects/:id` | Get project by ID |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| GET | `/projects/search` | Search projects |
| PUT | `/projects/:id/status` | Update project status |
| GET | `/projects/:id/proposals` | Get project proposals |
| GET | `/projects/:id/stats` | Get project statistics |
| POST | `/projects/:id/toggle-status` | Toggle project status |

### Proposals (10 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/proposals` | Submit proposal |
| GET | `/proposals` | Get all proposals |
| GET | `/proposals/:id` | Get proposal by ID |
| PUT | `/proposals/:id` | Update proposal |
| DELETE | `/proposals/:id` | Withdraw proposal |
| PUT | `/proposals/:id/accept` | Accept proposal |
| PUT | `/proposals/:id/reject` | Reject proposal |
| PUT | `/proposals/:id/highlight` | Highlight proposal |
| GET | `/proposals/project/:projectId` | Get project proposals |
| GET | `/proposals/stats` | Get proposal statistics |

### Contracts (10 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contracts` | Create contract |
| GET | `/contracts` | Get all contracts |
| GET | `/contracts/:id` | Get contract by ID |
| PUT | `/contracts/:id` | Update contract |
| PUT | `/contracts/:id/status` | Update contract status |
| POST | `/contracts/:id/milestones/:milestoneId/submit` | Submit milestone |
| PUT | `/contracts/:id/milestones/:milestoneId/approve` | Approve milestone |
| PUT | `/contracts/:id/milestones/:milestoneId/reject` | Reject milestone |
| POST | `/contracts/:id/dispute` | Create dispute |
| POST | `/contracts/:id/amend` | Amend contract |

### Payments (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-intent` | Create payment intent |
| POST | `/payments/confirm` | Confirm payment |
| POST | `/payments/release` | Release escrow payment |
| POST | `/payments/refund` | Refund payment |
| GET | `/payments/transactions` | Get payment transactions |
| GET | `/payments/balance` | Get account balance |

### Messages (11 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages/conversations` | Get all conversations |
| POST | `/messages/conversations` | Create conversation |
| GET | `/messages/conversations/:id` | Get conversation messages |
| POST | `/messages` | Send message |
| PUT | `/messages/:id` | Edit message |
| DELETE | `/messages/:id` | Delete message |
| POST | `/messages/:id/reactions` | Add reaction to message |
| DELETE | `/messages/:id/reactions/:emoji` | Remove reaction |
| POST | `/messages/:id/read` | Mark message as read |
| POST | `/messages/typing` | Send typing indicator |
| GET | `/messages/search` | Search messages |

### Notifications (5 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get all notifications |
| GET | `/notifications/unread-count` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/mark-all-read` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

### Reviews (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Create review |
| GET | `/reviews` | Get all reviews |
| GET | `/reviews/:id` | Get review by ID |
| PUT | `/reviews/:id/response` | Respond to review |

### Organizations (9 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/organizations` | Create organization |
| GET | `/organizations` | Get all organizations |
| GET | `/organizations/:id` | Get organization by ID |
| PUT | `/organizations/:id` | Update organization |
| DELETE | `/organizations/:id` | Delete organization |
| POST | `/organizations/:id/members` | Add member |
| DELETE | `/organizations/:id/members/:userId` | Remove member |
| PUT | `/organizations/:id/budget` | Update budget |
| GET | `/organizations/:id/projects` | Get organization projects |

### Admin (10 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Get dashboard stats |
| GET | `/admin/users` | Get all users |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/projects` | Get all projects |
| PUT | `/admin/projects/:id/status` | Update project status |
| GET | `/admin/reports` | Get platform reports |
| POST | `/admin/featured-freelancers` | Feature freelancer |
| DELETE | `/admin/featured-freelancers/:id` | Unfeature freelancer |
| GET | `/admin/featured-freelancers` | Get featured freelancers |

### Analytics (5 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Get dashboard overview |
| GET | `/analytics/revenue` | Get revenue analytics |
| GET | `/analytics/users` | Get user growth analytics |
| GET | `/analytics/projects` | Get project analytics |
| GET | `/analytics/payments` | Get payment analytics |

### Settings (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/settings` | Get platform settings |
| PUT | `/admin/settings/commission` | Update commission |
| PUT | `/admin/settings/payment` | Update payment settings |
| GET | `/admin/settings/history` | Get settings history |

### Upload (3 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/single` | Upload single file |
| POST | `/upload/multiple` | Upload multiple files |
| DELETE | `/upload/:fileId` | Delete file |

### Verification (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verification/send-email` | Send verification email |
| POST | `/verification/verify-email` | Verify email |
| POST | `/verification/resend` | Resend verification |
| GET | `/verification/status` | Get verification status |

### Search (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/projects` | Search projects |
| GET | `/search/freelancers` | Search freelancers |
| GET | `/search/suggestions` | Get search suggestions |
| GET | `/search/recommendations` | Get recommendations |

### Time Tracking (8 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/time-tracking/start` | Start time entry |
| POST | `/time-tracking/stop` | Stop time entry |
| GET | `/time-tracking/entries` | Get time entries |
| POST | `/time-tracking/submit` | Submit time report |
| PUT | `/time-tracking/:id/approve` | Approve time entry |
| PUT | `/time-tracking/:id/reject` | Reject time entry |
| GET | `/time-tracking/reports` | Get time reports |
| POST | `/time-tracking/screenshot` | Upload screenshot |

---

## Webhooks

### Stripe Webhooks

The API handles the following Stripe webhook events:

#### Payment Intent Succeeded

**Event**: `payment_intent.succeeded`

```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 10000,
      "currency": "usd",
      "metadata": {
        "contractId": "contract_id",
        "milestoneId": "milestone_id"
      }
    }
  }
}
```

#### Payment Intent Failed

**Event**: `payment_intent.payment_failed`

```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "last_payment_error": {
        "message": "Your card was declined"
      }
    }
  }
}
```

### Webhook Endpoint

**URL**: `POST /webhooks/stripe`

**Headers**:
```
Stripe-Signature: t=timestamp,v1=signature
```

---

## WebSocket Events

Real-time communication is handled via Socket.io. Connect to the WebSocket server at the same base URL.

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken
  }
});
```

### Message Events

#### Send Message

```javascript
socket.emit('message:send', {
  conversationId: 'conv_id',
  content: 'Hello!',
  attachments: []
});
```

#### Receive Message

```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

#### Typing Indicator

```javascript
socket.emit('message:typing', {
  conversationId: 'conv_id'
});

socket.on('message:typing', (data) => {
  console.log('User is typing:', data.userId);
});
```

### Notification Events

#### Receive Notification

```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

### Proposal Events

#### Proposal Updated

```javascript
socket.on('proposal:update', (proposal) => {
  console.log('Proposal updated:', proposal);
});
```

### Contract Events

#### Contract Updated

```javascript
socket.on('contract:update', (contract) => {
  console.log('Contract updated:', contract);
});
```

#### Milestone Updated

```javascript
socket.on('milestone:update', (milestone) => {
  console.log('Milestone updated:', milestone);
});
```

### Payment Events

#### Payment Updated

```javascript
socket.on('payment:update', (payment) => {
  console.log('Payment updated:', payment);
});
```

---

## Best Practices

### 1. Authentication

- Always include the Bearer token in the Authorization header
- Refresh tokens before they expire
- Store tokens securely (not in localStorage for sensitive apps)
- Implement token rotation for enhanced security

### 2. Error Handling

```javascript
try {
  const response = await fetch('/api/v1/projects', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.message);
  }
  
  const data = await response.json();
} catch (error) {
  console.error('Network error:', error);
}
```

### 3. Pagination

Always use pagination for list endpoints:

```
GET /api/v1/projects?page=1&limit=20
```

### 4. Filtering

Use query parameters for filtering:

```
GET /api/v1/projects?status=open&category=web-development
```

### 5. Rate Limiting

Implement exponential backoff for rate-limited requests:

```javascript
async function makeRequest(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => 
        setTimeout(resolve, (retryAfter || 2 ** retries) * 1000)
      );
      return makeRequest(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => 
        setTimeout(resolve, 2 ** (3 - retries) * 1000)
      );
      return makeRequest(url, options, retries - 1);
    }
    throw error;
  }
}
```

### 6. Validation

Validate all input before sending to the API:

```javascript
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8 && /[A-Z]/.test(password);
};
```

### 7. Caching

Implement client-side caching to reduce API calls:

```javascript
const cache = new Map();

async function getCachedData(key, fetcher) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return data;
}
```

### 8. Logging

Log important events for debugging:

```javascript
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data)
};
```

---

## Examples

### Complete Project Creation Flow

```javascript
// 1. Create project
const projectResponse = await fetch('/api/v1/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Build a Website',
    description: 'Need a responsive website',
    category: 'web-development',
    skills: ['React', 'Node.js'],
    budget: {
      type: 'fixed',
      min: 1000,
      max: 5000
    }
  })
});

const project = await projectResponse.json();

// 2. Get project proposals
const proposalsResponse = await fetch(
  `/api/v1/projects/${project.data._id}/proposals`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const proposals = await proposalsResponse.json();

// 3. Accept proposal
const acceptResponse = await fetch(
  `/api/v1/proposals/${proposals.data[0]._id}/accept`,
  {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

// 4. Contract auto-created, process payment
const paymentResponse = await fetch('/api/v1/payments/create-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contractId: contract._id,
    amount: 5000
  })
});
```

### Complete Freelancer Workflow

```javascript
// 1. Login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'freelancer@example.com',
    password: 'Password123!'
  })
});

const { data: { accessToken } } = await loginResponse.json();

// 2. Update profile
await fetch('/api/v1/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile: {
      firstName: 'John',
      lastName: 'Developer',
      bio: 'Full-stack developer'
    }
  })
});

// 3. Search projects
const projectsResponse = await fetch(
  '/api/v1/search/projects?skills=React&budget_min=1000',
  {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);

// 4. Submit proposal
const proposalResponse = await fetch('/api/v1/proposals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: project._id,
    bidAmount: 3000,
    deliveryDays: 14,
    coverLetter: 'I can build this website...'
  })
});
```

---

## Support

For API support:
- Check this documentation
- Review error messages and codes
- Test with Postman collection
- Check server logs for detailed errors
- Contact support@talenthive.com

---

**Last Updated**: November 2024  
**API Version**: v1  
**Status**: Production Ready
