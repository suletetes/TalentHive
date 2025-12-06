# TalentHive API - Postman Collection

## Overview

This directory contains the complete Postman collection for testing the TalentHive API. The collection includes all 149 endpoints organized by feature and user role, with comprehensive documentation, examples, and test scripts.

## Files

- `TalentHive-Complete-API.postman_collection.json` - Complete API collection with 149+ endpoints across 23 feature folders
- `TalentHive-Environment.postman_environment.json` - Environment variables for development

## Setup

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `TalentHive-Complete-API.postman_collection.json`
4. Click "Import"

### 2. Import Environment

1. Click "Import" button
2. Select `TalentHive-Environment.postman_environment.json`
3. Click "Import"
4. Select "TalentHive Development" from environment dropdown

### 3. Start Server

```bash
cd server
npm run dev
```

Server should be running on `http://localhost:5000`

## Usage

### Authentication Flow

1. **Login** - Use one of the test accounts:
   - Admin: `admin@talenthive.com` / `Password123!`
   - Client: `john.client@example.com` / `Password123!`
   - Freelancer: `alice.dev@example.com` / `Password123!`

2. The login request automatically saves the `accessToken` to environment variables

3. All subsequent requests use the Bearer token authentication

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@talenthive.com | Password123! |
| Client | john.client@example.com | Password123! |
| Freelancer | alice.dev@example.com | Password123! |

## Collection Structure

The collection is organized into 23 feature-based folders with 149 total endpoints:

### Core Features
1. **Authentication** (4 endpoints)
   - Register, Login, Logout, Refresh Token

2. **Projects** (10 endpoints)
   - Create, Read, Update, Delete, Search, Toggle Status, Get Stats

3. **Proposals** (10 endpoints)
   - Submit, Get, Update, Withdraw, Accept, Reject, Highlight, Get Stats

4. **Contracts** (10 endpoints)
   - Create from Proposal, Sign, Submit/Approve/Reject Milestones, Amendments, Cancel

5. **Payments** (6 endpoints)
   - Create Intent, Confirm, Release, Refund, Get Transactions, Get Balance

6. **Transactions** (7 endpoints)
   - Payment Intent, Confirm, Release Escrow, Refund, History, Calculate Fees

### Communication & Notifications
7. **Messages** (11 endpoints)
   - Conversations, Send, Edit, Delete, Reactions, Typing Indicator, Admin Support

8. **Notifications** (5 endpoints)
   - Get, Mark as Read, Mark All Read, Delete, Unread Count

### User Management
9. **Users** (11 endpoints)
   - Profile, Password, Skills, Portfolio, Availability, Freelancer Discovery

10. **Reviews** (4 endpoints)
    - Create, Get, Respond to Reviews

11. **Verification** (4 endpoints)
    - Send, Verify, Resend, Check Status

### Organizations & Teams
12. **Organizations** (9 endpoints)
    - Create, Read, Update, Delete, Members, Budget, Projects

### Admin & Analytics
13. **Admin** (10 endpoints)
    - Dashboard Stats, User Management, Featured Freelancers, Reports

14. **Analytics** (5 endpoints)
    - Dashboard Overview, Revenue, User Growth, Projects, Payments

### Search & Discovery
15. **Search** (4 endpoints)
    - Projects, Freelancers, Suggestions, Recommendations

### Configuration
16. **Settings** (4 endpoints)
    - Get/Update Platform Settings, History, Calculate Commission

17. **Categories** (4 endpoints)
    - Get, Create, Update, Delete

18. **Skills** (4 endpoints)
    - Get, Create, Update, Delete

### Services & Packages
19. **Service Packages** (10 endpoints)
    - Packages, Project Templates, Preferred Vendors

20. **Hire Now** (5 endpoints)
    - Create Request, Get Sent/Received, Accept/Reject

### File Management
21. **Upload** (3 endpoints)
    - Single File, Multiple Files, Delete

### Time Tracking
22. **Time Tracking** (8 endpoints)
    - Work Sessions, Time Entries, Submit, Review, Reports

### Webhooks
23. **Webhooks** (1 endpoint)
    - Stripe Webhook Handler

## Environment Variables

The collection uses the following variables:

| Variable | Description | Auto-set |
|----------|-------------|----------|
| baseUrl | API base URL (http://localhost:5000/api/v1) | No |
| accessToken | JWT access token | Yes (on login) |
| userId | Current user ID | Yes (on login) |
| projectId | Project ID for testing | Manual |
| proposalId | Proposal ID for testing | Manual |
| contractId | Contract ID for testing | Manual |
| conversationId | Conversation ID for testing | Manual |
| organizationId | Organization ID for testing | Manual |
| transactionId | Transaction ID for testing | Manual |
| notificationId | Notification ID for testing | Manual |
| milestoneId | Milestone ID for testing | Manual |
| messageId | Message ID for testing | Manual |
| reviewId | Review ID for testing | Manual |
| freelancerId | Freelancer ID for testing | Manual |

## Testing Workflows

### Complete Client Workflow

1. **Authentication**: Register/Login as client
2. **Project Management**: Create project with details
3. **Proposal Review**: Get project proposals, review freelancer profiles
4. **Proposal Selection**: Accept best proposal, reject others
5. **Contract Management**: View auto-generated contract, sign it
6. **Milestone Tracking**: Monitor milestone submissions and approvals
7. **Payment Processing**: Create payment intent, confirm payment
8. **Review & Feedback**: Leave review for completed work
9. **Organization**: Create organization, manage team members, track budget

### Complete Freelancer Workflow

1. **Authentication**: Register/Login as freelancer
2. **Profile Setup**: Update profile, add skills, portfolio items
3. **Project Discovery**: Browse projects, search by skills/budget
4. **Proposal Submission**: Submit proposals with custom pricing
5. **Proposal Management**: Track proposals, update/withdraw as needed
6. **Contract Acceptance**: Accept contract, sign it
7. **Work Submission**: Submit milestones with deliverables
8. **Payment Receipt**: Receive payment after approval
9. **Review Response**: Respond to client reviews

### Complete Admin Workflow

1. **Authentication**: Login as admin
2. **Dashboard**: View platform overview and key metrics
3. **Analytics**: Check revenue, user growth, project stats, payment analytics
4. **User Management**: View all users, update status/roles
5. **Platform Settings**: Configure commission rates, payment settings
6. **Featured Freelancers**: Feature/unfeature top freelancers, reorder
7. **Reports**: Generate and review platform reports
8. **Support**: Handle admin conversations with users

### Payment Flow

1. Create payment intent with contract/milestone details
2. Confirm payment with Stripe payment intent ID
3. Funds held in escrow
4. Release payment after milestone approval
5. Platform commission deducted automatically
6. Freelancer receives remaining amount

### Messaging & Support

1. Get conversations list
2. Send messages with optional attachments
3. Edit/delete messages as needed
4. Add reactions to messages
5. Mark conversations as read
6. Admin can create support conversations

## Tips

### Using Variables

- Use `{{variableName}}` in requests
- Variables are automatically populated from responses
- Manually set IDs from responses for testing

### Pre-request Scripts

The collection includes pre-request scripts that:
- Automatically add Bearer token to requests
- Set common headers

### Test Scripts

The collection includes test scripts that:
- Validate response status codes
- Extract and save tokens
- Save IDs for subsequent requests

### Testing File Upload

1. Select "Upload Single File" request
2. Go to Body tab
3. Select file in the "file" field
4. Send request

## Troubleshooting

### 401 Unauthorized

- Token expired - Login again
- Wrong credentials - Check test accounts
- Token not set - Check environment variables

### 404 Not Found

- Server not running - Start server
- Wrong URL - Check baseUrl variable
- Invalid ID - Use valid IDs from seed data

### 500 Server Error

- Check server logs
- Verify database connection
- Check request body format

## API Documentation

For detailed API documentation, see:
- `API-DOCUMENTATION.md` in project root
- Swagger UI at `http://localhost:5000/api-docs` (if configured)

## Support

For issues or questions:
- Check server logs
- Review API documentation
- Test with seed data first
- Verify environment variables
