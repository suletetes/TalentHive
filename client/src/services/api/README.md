# TalentHive API Services

This directory contains the centralized API service layer for the TalentHive frontend application.

## Architecture

The API services are organized into feature-specific modules, each handling a specific domain of the application:

### Core (`core.ts`)
- Centralized Axios instance with base configuration
- Request interceptor for automatic token injection
- Response interceptor for automatic token refresh on 401 errors
- Generic HTTP methods (GET, POST, PUT, PATCH, DELETE)

### Services

1. **Auth Service** (`auth.service.ts`)
   - Login, registration, logout
   - Token refresh
   - Email verification

2. **Projects Service** (`projects.service.ts`)
   - CRUD operations for projects
   - Project search and filtering
   - Project statistics

3. **Proposals Service** (`proposals.service.ts`)
   - Create and manage proposals
   - Accept/reject proposals
   - Proposal statistics

4. **Contracts Service** (`contracts.service.ts`)
   - Contract creation and management
   - Milestone submission and approval
   - Contract amendments

5. **Payments Service** (`payments.service.ts`)
   - Payment processing with Stripe
   - Payment history
   - Escrow management
   - Payout requests

6. **Messages Service** (`messages.service.ts`)
   - Send and receive messages
   - Conversation management
   - Mark messages as read

7. **Reviews Service** (`reviews.service.ts`)
   - Create and view reviews
   - Respond to reviews

8. **Notifications Service** (`notifications.service.ts`)
   - Get notifications
   - Mark as read
   - Manage notification preferences

9. **Time Tracking Service** (`timeTracking.service.ts`)
   - Start/stop time entries
   - Time reports
   - Screenshot uploads

10. **Organizations Service** (`organizations.service.ts`)
    - Organization management
    - Team member invitations
    - Budget management and approvals

11. **Services Service** (`services.service.ts`)
    - Service package management
    - Project templates

12. **Search Service** (`search.service.ts`)
    - Global search
    - Advanced search with filters
    - Search suggestions

13. **Upload Service** (`upload.service.ts`)
    - File uploads with progress tracking
    - Multiple file uploads
    - File validation

## Usage

### Basic Usage

```typescript
import { projectsService } from '@/services/api';

// Get all projects
const projects = await projectsService.getProjects();

// Create a project
const newProject = await projectsService.createProject({
  title: 'My Project',
  description: 'Project description',
  // ... other fields
});
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/services/api';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsService.getProjects(),
  });

  // ... component logic
}
```

### Authentication

The API core automatically handles authentication:
- Adds Bearer token to all requests
- Automatically refreshes expired tokens
- Redirects to login on authentication failure

## Type Safety

All services are fully typed with TypeScript interfaces. Import types from the service modules:

```typescript
import type { Project, CreateProjectDto } from '@/services/api';
```

## Error Handling

All services throw errors that can be caught and handled:

```typescript
try {
  await projectsService.createProject(data);
} catch (error) {
  // Handle error
  console.error(error);
}
```

## Testing

Services are tested using Vitest. Run tests with:

```bash
npm test -- services.test.ts
```

## Environment Configuration

Configure the API base URL in your `.env` file:

```
VITE_API_BASE_URL=http://localhost:5000/api
```
