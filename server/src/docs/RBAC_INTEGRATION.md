# RBAC Integration Guide

This document explains how to integrate the new RBAC (Role-Based Access Control) system into existing API endpoints.

## Overview

The RBAC system provides granular permission control through:
- **Permissions**: Specific actions users can perform (e.g., `users.update`, `projects.delete`)
- **Roles**: Collections of permissions (e.g., `Super Admin`, `Moderator`)
- **Middleware**: Functions to check permissions before allowing access

## Available Middleware

### 1. `requirePermission(permission: string)`
Requires a single specific permission.

```typescript
import { requirePermission } from '@/middleware/permissionMiddleware';

router.put('/users/:id', 
  authenticate, 
  requirePermission('users.update'),
  updateUser
);
```

### 2. `requireAnyPermission(...permissions: string[])`
Requires at least one of the specified permissions.

```typescript
router.get('/admin/dashboard', 
  authenticate, 
  requireAnyPermission('analytics.view', 'admin.dashboard'),
  getDashboard
);
```

### 3. `requireAllPermissions(...permissions: string[])`
Requires all specified permissions.

```typescript
router.delete('/users/:id', 
  authenticate, 
  requireAllPermissions('users.delete', 'users.manage'),
  deleteUser
);
```

### 4. `requireAdminPermission(permission?: string)`
Requires admin role or specific admin permission.

```typescript
// Just check for admin role
router.get('/admin/stats', 
  authenticate, 
  requireAdminPermission(),
  getStats
);

// Check for specific admin permission
router.post('/admin/settings', 
  authenticate, 
  requireAdminPermission('settings.update'),
  updateSettings
);
```

## Integration Examples

### User Management Routes

```typescript
import { authenticate } from '@/middleware/auth';
import { requirePermission, requireAdminPermission } from '@/middleware/permissionMiddleware';

// Public route - no permission needed
router.get('/users/:id', authenticate, getUser);

// Update own profile - no special permission
router.put('/users/me', authenticate, updateOwnProfile);

// Update any user - requires permission
router.put('/users/:id', 
  authenticate, 
  requirePermission('users.update'),
  updateUser
);

// Delete user - requires permission
router.delete('/users/:id', 
  authenticate, 
  requirePermission('users.delete'),
  deleteUser
);

// Suspend user - admin only
router.post('/users/:id/suspend', 
  authenticate, 
  requireAdminPermission('users.suspend'),
  suspendUser
);
```

### Project Management Routes

```typescript
// Create project - basic permission
router.post('/projects', 
  authenticate, 
  requirePermission('projects.create'),
  createProject
);

// Update own project - handled in controller
router.put('/projects/:id', 
  authenticate, 
  updateProject // Controller checks ownership
);

// Delete any project - moderator permission
router.delete('/projects/:id', 
  authenticate, 
  requirePermission('projects.moderate'),
  deleteProject
);
```

### Contract Management Routes

```typescript
// Approve milestone - requires permission
router.post('/contracts/:id/milestones/:milestoneId/approve', 
  authenticate, 
  requirePermission('contracts.approve'),
  approveMilestone
);

// Moderate contract - admin only
router.put('/contracts/:id/moderate', 
  authenticate, 
  requireAdminPermission('contracts.moderate'),
  moderateContract
);
```

## Permission Naming Convention

Permissions follow the pattern: `resource.action`

### Resources
- `users` - User management
- `projects` - Project management
- `contracts` - Contract management
- `payments` - Payment processing
- `transactions` - Transaction management
- `reviews` - Review management
- `messages` - Messaging
- `disputes` - Dispute resolution
- `support` - Support tickets
- `analytics` - Analytics and reporting
- `settings` - Platform settings
- `rbac` - Role and permission management

### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Modify resources
- `delete` - Remove resources
- `moderate` - Moderate content (admin action)
- `manage` - Full management access
- `approve` - Approve actions
- `resolve` - Resolve issues

### Scopes
- `own` - User can only access their own resources
- `any` - User can access any resource
- `organization` - User can access resources within their organization

## Backward Compatibility

The RBAC system maintains backward compatibility with the existing role-based system:

```typescript
// Old way (still works)
router.get('/admin/users', 
  authenticate, 
  authorize('admin'),
  getUsers
);

// New way (recommended)
router.get('/admin/users', 
  authenticate, 
  requireAdminPermission('users.read'),
  getUsers
);
```

## Checking Permissions in Controllers

Sometimes you need to check permissions within controller logic:

```typescript
import { permissionService } from '@/services/permissionService';

export const updateProject = async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id);
  
  // Check if user owns the project OR has moderate permission
  const canModerate = await permissionService.hasPermission(
    req.user._id,
    'projects.moderate'
  );
  
  const isOwner = project.client.toString() === req.user._id.toString();
  
  if (!isOwner && !canModerate) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  // Proceed with update...
};
```

## Testing Permissions

Use the RBAC API endpoints to manage permissions:

```bash
# Assign role to user
POST /api/rbac/users/:userId/roles
{
  "roleId": "role_id_here"
}

# Grant direct permission
POST /api/rbac/users/:userId/permissions
{
  "permissionId": "permission_id_here"
}

# View user permissions
GET /api/rbac/users/:userId/permissions
```

## Migration Checklist

When adding RBAC to existing routes:

1. ✅ Import permission middleware
2. ✅ Identify which permission is needed
3. ✅ Add middleware to route
4. ✅ Test with users who have/don't have permission
5. ✅ Update API documentation
6. ✅ Add permission to seed data if needed

## Common Patterns

### Admin-Only Routes
```typescript
router.use('/admin', authenticate, requireAdminPermission());
```

### Resource Ownership Check
```typescript
// In controller
const isOwner = resource.userId.toString() === req.user._id.toString();
const hasPermission = await permissionService.hasPermission(req.user._id, 'resource.moderate');

if (!isOwner && !hasPermission) {
  throw new AppError('Permission denied', 403);
}
```

### Optional Permission Enhancement
```typescript
// Basic users can see limited data
// Users with permission can see full data
const hasFullAccess = await permissionService.hasPermission(req.user._id, 'analytics.view');

const data = hasFullAccess 
  ? await getFullAnalytics() 
  : await getBasicAnalytics();
```
