# TalentHive API Postman Collection

## Overview
This directory contains the Postman collection and environment for testing the TalentHive API.

## Collection Structure

### 1. Authentication (`/api/auth`)
- POST `/register` - Register new user
- POST `/login` - Login user
- POST `/refresh-token` - Refresh access token
- POST `/logout` - Logout user
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password with token

### 2. Users (`/api/users`)
- GET `/profile` - Get current user profile
- PUT `/profile` - Update profile
- PUT `/change-password` - Change password
- GET `/freelancers` - List freelancers
- GET `/freelancer/:id` - Get freelancer details
- GET `/client/:id` - Get client details
- POST `/upload-avatar` - Upload avatar
- POST `/upload-portfolio` - Upload portfolio images
- DELETE `/delete-portfolio-image` - Delete portfolio image

#### Profile Slugs
- GET `/slug/:slug` - Get user by slug
- POST `/slug/validate` - Validate slug
- PATCH `/profile/slug` - Update user slug
- GET `/slug/suggestions/:baseName` - Get slug suggestions
- GET `/slug/search?q=query` - Search by slug
- GET `/:userId/slug-history` - Get slug history

#### Profile Analytics
- GET `/:userId/stats` - Get user statistics
- POST `/:userId/profile-view` - Track profile view
- GET `/:userId/profile-views` - Get view analytics
- GET `/:userId/profile-viewers` - Get viewers list

### 3. Projects (`/api/projects`)
- POST `/` - Create project
- GET `/` - List projects
- GET `/:id` - Get project details
- PUT `/:id` - Update project
- DELETE `/:id` - Delete project
- GET `/my` - Get user's projects
- POST `/:id/close` - Close project

### 4. Proposals (`/api/proposals`)
- POST `/project/:projectId` - Submit proposal
- GET `/my` - Get freelancer's proposals
- GET `/project/:projectId` - Get proposals for project
- GET `/:id` - Get proposal details
- PUT `/:id` - Update proposal
- PATCH `/:id/withdraw` - Withdraw proposal
- POST `/:id/accept` - Accept proposal (client)
- POST `/:id/reject` - Reject proposal (client)

### 5. Contracts (`/api/contracts`)
- POST `/` - Create contract
- GET `/` - List contracts
- GET `/:id` - Get contract details
- PUT `/:id` - Update contract
- POST `/:id/sign` - Sign contract
- POST `/:id/milestones/:milestoneId/submit` - Submit milestone
- POST `/:id/milestones/:milestoneId/approve` - Approve milestone
- POST `/:id/milestones/:milestoneId/reject` - Reject milestone

### 6. Payments (`/api/payments`)
- POST `/create-payment-intent` - Create payment intent
- POST `/confirm-payment` - Confirm payment
- POST `/release/:milestoneId` - Release payment
- GET `/history` - Get payment history
- GET `/:id` - Get payment details

### 7. Transactions (`/api/transactions`)
- POST `/payment-intent` - Create payment intent
- POST `/confirm` - Confirm payment
- POST `/:transactionId/release` - Release escrow
- POST `/:transactionId/refund` - Refund payment
- GET `/history` - Get transaction history
- GET `/:transactionId` - Get transaction details
- POST `/calculate-fees` - Calculate fees

### 8. Messages (`/api/messages`)
- POST `/` - Send message
- GET `/conversations` - List conversations
- GET `/conversation/:userId` - Get conversation
- PATCH `/:messageId/read` - Mark as read

### 9. Reviews (`/api/reviews`)
- POST `/` - Create review
- GET `/user/:userId` - Get user reviews
- GET `/freelancer/:userId` - Get freelancer reviews
- GET `/client/:clientId` - Get client reviews
- POST `/:reviewId/respond` - Respond to review

### 10. Notifications (`/api/notifications`)
- GET `/` - List notifications
- PATCH `/:id/read` - Mark as read
- PATCH `/read-all` - Mark all as read
- DELETE `/:id` - Delete notification

### 11. Time Tracking (`/api/time-tracking`)
- GET `/sessions/active` - Get active session
- POST `/sessions/start` - Start work session
- POST `/sessions/:sessionId/stop` - Stop work session
- POST `/entries` - Create time entry
- GET `/entries` - Get time entries
- PATCH `/entries/:entryId` - Update time entry
- POST `/entries/submit` - Submit for approval
- POST `/entries/:entryId/review` - Review time entry
- GET `/report` - Get time report

### 12. Work Logs (`/api/work-logs`)
- POST `/` - Create work log
- GET `/` - Get work logs
- PATCH `/:id` - Update work log
- PATCH `/:id/complete` - Complete work log
- DELETE `/:id` - Delete work log
- GET `/report` - Get work log report

### 13. Organizations (`/api/organizations`)
- POST `/` - Create organization
- GET `/` - List organizations
- GET `/:id` - Get organization details
- PUT `/:id` - Update organization
- DELETE `/:id` - Delete organization
- POST `/:id/members` - Add member
- DELETE `/:id/members/:userId` - Remove member
- PATCH `/:id/members/:userId/role` - Update member role

### 14. Services (`/api/services`)
- POST `/packages` - Create service package
- GET `/packages` - List service packages
- GET `/packages/:packageId` - Get package details
- PATCH `/packages/:packageId` - Update package
- POST `/packages/:packageId/order` - Order package
- POST `/templates` - Create project template
- GET `/templates` - List templates
- POST `/templates/:templateId/create-project` - Create from template

### 15. Support Tickets (`/api/support/tickets`)
- POST `/` - Create ticket
- GET `/` - List tickets
- GET `/stats` - Get ticket stats (admin)
- GET `/:ticketId` - Get ticket details
- POST `/:ticketId/messages` - Add message
- PATCH `/:ticketId/status` - Update status (admin)
- PATCH `/:ticketId/assign` - Assign ticket (admin)
- PATCH `/:ticketId/tags` - Update tags (admin)

### 16. Onboarding (`/api/onboarding`)
- GET `/status` - Get onboarding status
- PATCH `/step` - Update onboarding step
- POST `/complete` - Complete onboarding
- POST `/skip` - Skip onboarding
- GET `/analytics` - Get analytics (admin)
- GET `/analytics/:userId` - Get user analytics

### 17. Admin (`/api/admin`)
- GET `/dashboard/stats` - Dashboard statistics
- GET `/users` - List all users
- PUT `/users/:userId/status` - Update user status
- PUT `/users/:userId/role` - Update user role
- GET `/reports` - Get reports
- POST `/users/:userId/roles` - Assign role
- DELETE `/users/:userId/roles` - Remove role
- POST `/users/:userId/feature` - Feature freelancer
- POST `/users/:userId/unfeature` - Unfeature freelancer
- GET `/featured-freelancers` - List featured
- PUT `/featured-freelancers/reorder` - Reorder featured
- GET `/analytics` - Platform analytics
- GET `/transactions` - All transactions
- GET `/transactions/stats` - Transaction stats
- POST `/transactions/auto-release` - Trigger auto-release
- GET `/settings` - Get settings
- PUT `/settings` - Update settings
- GET `/settings/commission` - Get commission settings
- PUT `/settings/commission` - Update commission

### 18. RBAC (To Be Implemented - Task 8)
#### Roles
- POST `/api/admin/roles` - Create role
- GET `/api/admin/roles` - List roles
- PUT `/api/admin/roles/:roleId` - Update role
- DELETE `/api/admin/roles/:roleId` - Delete role

#### Permissions
- POST `/api/admin/users/:userId/roles` - Assign role
- DELETE `/api/admin/users/:userId/roles/:roleId` - Remove role
- POST `/api/admin/users/:userId/permissions` - Grant permission
- DELETE `/api/admin/users/:userId/permissions/:permissionId` - Revoke permission
- GET `/api/admin/users/:userId/permissions` - Get user permissions

#### Audit Logs
- GET `/api/admin/audit-logs` - Query audit logs

### 19. Analytics (`/api/analytics`)
- GET `/revenue` - Revenue analytics
- GET `/user-growth` - User growth analytics
- GET `/project-stats` - Project statistics
- GET `/payment-analytics` - Payment analytics
- GET `/dashboard-overview` - Dashboard overview

### 20. Search (`/api/search`)
- GET `/projects` - Search projects
- GET `/freelancers` - Search freelancers
- GET `/suggestions` - Get search suggestions
- GET `/recommendations` - Get recommendations

### 21. Categories & Skills
- GET `/api/categories` - List categories
- POST `/api/categories` - Create category (admin)
- PUT `/api/categories/:id` - Update category (admin)
- DELETE `/api/categories/:id` - Delete category (admin)
- GET `/api/skills` - List skills
- POST `/api/skills` - Create skill
- PUT `/api/skills/:id` - Update skill (admin)
- DELETE `/api/skills/:id` - Delete skill (admin)

### 22. Verification (`/api/verification`)
- POST `/verify-email` - Verify email
- POST `/send-verification` - Send verification
- POST `/resend-verification` - Resend verification
- GET `/status` - Check verification status

### 23. Hire Now (`/api/hire-now`)
- POST `/:freelancerId` - Send hire request
- GET `/sent` - Get sent requests
- GET `/received` - Get received requests
- PUT `/:requestId/accept` - Accept request
- PUT `/:requestId/reject` - Reject request

### 24. Disputes (`/api/disputes`)
- POST `/` - Create dispute
- GET `/` - List disputes
- GET `/:id` - Get dispute details
- POST `/:id/respond` - Respond to dispute
- PATCH `/:id/resolve` - Resolve dispute (admin)

### 25. Webhooks (`/api/webhooks`)
- POST `/stripe` - Stripe webhook handler

## Environment Variables

```json
{
  "API_URL": "http://localhost:5000/api",
  "ACCESS_TOKEN": "",
  "REFRESH_TOKEN": "",
  "USER_ID": "",
  "PROJECT_ID": "",
  "PROPOSAL_ID": "",
  "CONTRACT_ID": "",
  "MILESTONE_ID": "",
  "TRANSACTION_ID": "",
  "TICKET_ID": ""
}
```

## Testing Workflow

1. **Register/Login** - Get access token
2. **Create Profile** - Complete user profile
3. **Create Project** (Client) or **Browse Projects** (Freelancer)
4. **Submit Proposal** (Freelancer)
5. **Accept Proposal** (Client)
6. **Create Contract**
7. **Submit Milestone** (Freelancer)
8. **Approve & Release Payment** (Client)
9. **Leave Review**

## Notes

- All protected routes require `Authorization: Bearer <token>` header
- Admin routes require admin role
- File uploads use `multipart/form-data`
- Most endpoints return JSON responses
- Error responses follow standard format: `{ status: 'error', message: '...' }`
