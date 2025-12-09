# RBAC System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Seed the Database
```bash
npm run seed
```

This creates:
- 50+ system permissions
- 4 system roles (Super Admin, Moderator, Support Agent, Financial Manager)
- Sample users with the admin having Super Admin role
- Consistent data with proper ratings and relationships

### Step 2: Login as Admin
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@talenthive.com",
  "password": "Password123!"
}
```

### Step 3: Test RBAC Endpoints

#### View All Roles
```bash
GET /api/rbac/roles
Authorization: Bearer <your_token>
```

#### View All Permissions
```bash
GET /api/rbac/permissions
Authorization: Bearer <your_token>
```

#### Assign Role to User
```bash
POST /api/rbac/users/:userId/roles
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "roleId": "role_id_from_step_3"
}
```

#### View User Permissions
```bash
GET /api/rbac/users/:userId/permissions
Authorization: Bearer <your_token>
```

## 🔒 Adding Permission Checks to Routes

### Basic Permission Check
```typescript
import { requirePermission } from '@/middleware/permissionMiddleware';

router.put('/users/:id', 
  authenticate, 
  requirePermission('users.update'),
  updateUser
);
```

### Multiple Permission Options (Any)
```typescript
import { requireAnyPermission } from '@/middleware/permissionMiddleware';

router.get('/admin/dashboard', 
  authenticate, 
  requireAnyPermission('analytics.view', 'admin.dashboard'),
  getDashboard
);
```

### Multiple Required Permissions (All)
```typescript
import { requireAllPermissions } from '@/middleware/permissionMiddleware';

router.delete('/users/:id', 
  authenticate, 
  requireAllPermissions('users.delete', 'users.manage'),
  deleteUser
);
```

### Admin-Only Routes
```typescript
import { requireAdminPermission } from '@/middleware/permissionMiddleware';

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

## 🛠️ Data Validation CLI

### Check for Data Issues
```bash
npm run validate-data check
```

### Check Specific Areas
```bash
npm run validate-data check --ratings
npm run validate-data check --contracts
npm run validate-data check --references
```

### Fix Issues Automatically
```bash
npm run validate-data fix
```

### Dry Run (See What Would Be Fixed)
```bash
npm run validate-data fix --dry-run
```

### Get Database Statistics
```bash
npm run validate-data stats
```

## 📋 Available System Permissions

### User Management
- `users.create`, `users.read`, `users.update`, `users.delete`
- `users.suspend`, `users.verify`

### Project Management
- `projects.create`, `projects.read`, `projects.update`, `projects.delete`
- `projects.moderate`

### Contract Management
- `contracts.create`, `contracts.read`, `contracts.update`, `contracts.delete`
- `contracts.approve`, `contracts.moderate`

### Payment Management
- `payments.create`, `payments.read`, `payments.refund`, `payments.manage`

### Review Management
- `reviews.create`, `reviews.read`, `reviews.update`, `reviews.delete`
- `reviews.moderate`

### Support Management
- `support.create`, `support.read`, `support.respond`, `support.close`

### Analytics
- `analytics.view`, `analytics.export`

### RBAC Management
- `rbac.roles.create`, `rbac.roles.update`, `rbac.roles.delete`
- `rbac.permissions.grant`, `rbac.permissions.revoke`
- `rbac.audit.view`

## 👥 System Roles

### Super Admin
- **All permissions** (50+)
- Cannot be deleted or modified
- Assigned to: admin@talenthive.com

### Moderator
- Content moderation
- User management (read, suspend, verify)
- Project/contract moderation
- Review moderation

### Support Agent
- Support ticket management
- User/project viewing
- Basic analytics

### Financial Manager
- Payment management
- Transaction viewing
- Financial analytics
- Refund processing

## 🔍 Checking Permissions in Controllers

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

## 📊 Viewing Audit Logs

```bash
GET /api/rbac/audit-logs
Authorization: Bearer <your_token>

# With filters
GET /api/rbac/audit-logs?targetUser=userId&action=role_assigned&startDate=2024-01-01
```

## 🎯 Common Use Cases

### 1. Create a Custom Role
```bash
POST /api/rbac/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Content Manager",
  "slug": "content-manager",
  "description": "Manages content and reviews",
  "permissions": ["reviews.moderate", "projects.read", "users.read"]
}
```

### 2. Grant Direct Permission to User
```bash
POST /api/rbac/users/:userId/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissionId": "permission_id_here"
}
```

### 3. View All User Permissions (Aggregated)
```bash
GET /api/rbac/users/:userId/permissions
Authorization: Bearer <admin_token>
```

Response includes:
- Roles assigned to user
- Direct permissions granted
- Denied permissions
- Aggregated list of all effective permissions

## 📚 Documentation

- **Integration Guide**: `server/src/docs/RBAC_INTEGRATION.md`
- **Implementation Summary**: `server/src/docs/RBAC_IMPLEMENTATION_SUMMARY.md`
- **Frontend Guide**: `client/src/docs/RBAC_FRONTEND_GUIDE.md`
- **Complete Summary**: `RBAC_COMPLETION_SUMMARY.md`

## ⚠️ Important Notes

1. **System Roles**: Cannot be deleted or modified (isSystem: true)
2. **Caching**: User permissions are cached for 15 minutes in Redis
3. **Audit Logs**: All permission changes are automatically logged
4. **Backward Compatibility**: Old role-based system still works alongside RBAC

## 🐛 Troubleshooting

### Permission Check Fails
1. Verify user has correct roles: `GET /api/rbac/users/:userId/permissions`
2. Check if permissions are in the role
3. Clear Redis cache if needed
4. Review audit logs for recent changes

### Data Consistency Issues
1. Run validation: `npm run validate-data check`
2. Review issues in the report
3. Auto-fix if possible: `npm run validate-data fix`
4. Manually fix critical issues

### Seed Data Fails
1. Ensure MongoDB is running
2. Clear database: Delete all collections
3. Check for port conflicts
4. Review seed script logs

## 🎉 You're Ready!

The RBAC system is now fully operational. Start by:
1. ✅ Testing the endpoints with Postman
2. ✅ Adding permission checks to your routes
3. ✅ Creating custom roles for your use case
4. ✅ Monitoring audit logs for security

For detailed examples and advanced usage, see the full documentation files listed above.
