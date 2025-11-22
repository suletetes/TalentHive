# TalentHive API - Postman Collection

## Overview

This directory contains the complete Postman collection for testing the TalentHive API. The collection includes all endpoints organized by user role (Client, Freelancer, Admin) and common endpoints.

## Files

- `TalentHive-Complete-API.postman_collection.json` - Complete API collection with 60+ endpoints
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

### 1. Authentication
- Register User
- Login
- Logout
- Refresh Token

### 2. Client Endpoints
- **Projects**: Create, Get My Projects, Get Proposals
- **Proposals**: Accept, Reject
- **Contracts**: Get Contracts, Approve Milestone
- **Payments**: Create Payment Intent, Release Escrow

### 3. Freelancer Endpoints
- **Projects**: Browse, Get Details
- **Proposals**: Submit, Get My Proposals
- **Contracts**: Submit Milestone
- **Profile**: Update Profile

### 4. Admin Endpoints
- **Analytics**: Dashboard, Revenue, User Growth, Projects, Payments
- **Settings**: Get/Update Platform Settings
- **Users**: Get All Users

### 5. Common Endpoints
- **Notifications**: Get, Mark as Read, Delete
- **Messages**: Get Conversations, Send Message, Edit, Delete
- **File Upload**: Upload Single/Multiple Files

## Environment Variables

The collection uses the following variables:

| Variable | Description | Auto-set |
|----------|-------------|----------|
| baseUrl | API base URL | No |
| accessToken | JWT access token | Yes (on login) |
| userId | Current user ID | Yes (on login) |
| projectId | Project ID for testing | Manual |
| proposalId | Proposal ID for testing | Manual |
| contractId | Contract ID for testing | Manual |
| conversationId | Conversation ID for testing | Manual |

## Testing Workflows

### Client Workflow

1. Login as client
2. Create a project
3. Wait for proposals (or use seed data)
4. Get project proposals
5. Accept a proposal
6. View contracts
7. Approve milestones
8. Make payments

### Freelancer Workflow

1. Login as freelancer
2. Browse projects
3. Get project details
4. Submit proposal
5. View my proposals
6. After acceptance, view contracts
7. Submit milestones
8. Get paid

### Admin Workflow

1. Login as admin
2. View dashboard overview
3. Check analytics (revenue, users, projects)
4. Update platform settings
5. View all users
6. Monitor platform activity

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
