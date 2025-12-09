# Design Document

## Overview

This design addresses two critical platform needs: ensuring data consistency across all entities and implementing a comprehensive Role-Based Access Control (RBAC) system. The current platform has inconsistencies in ratings, project relationships, contract amounts, and review counts that undermine data integrity. Additionally, while basic roles exist, there is no granular permission system for fine-grained access control.

The solution consists of:
1. **Data Consistency Layer**: Automated validation and synchronization of related data
2. **RBAC System**: Granular permissions, custom roles, and audit logging
3. **Enhanced Seed Data**: Consistent, realistic test data generation
4. **Validation Utilities**: Tools to detect and fix data inconsistencies

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │  Middleware  │  Services  │  Utilities      │
└────────┬──────┴──────┬───────┴─────┬──────┴────────┬────────┘
         │             │             │               │
         ▼             ▼             ▼               ▼
┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Permission │  │   Auth   │  │  Data    │  │  Validation  │
│  Checker   │  │ Middleware│  │  Sync    │  │   Service    │
└────────────┘  └──────────┘  └──────────┘  └──────────────┘
         │             │             │               │
         └─────────────┴─────────────┴───────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │         Database Layer              │
         ├─────────────────────────────────────┤
         │  Users │ Roles │ Permissions │ Audit│
         │  Projects │ Contracts │ Reviews     │
         └─────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request
     │
     ▼
Authentication Middleware
     │
     ▼
Permission Check Middleware
     │
     ├─── Check Direct Permissions
     │
     ├─── Check Role Permissions
     │
     └─── Aggregate & Validate
          │
          ▼
     Controller Action
          │
          ▼
     Data Consistency Hooks
          │
          ├─── Pre-save Validation
          │
          ├─── Post-save Sync
          │
          └─── Cascade Updates
               │
               ▼
          Database
```

## Components and Interfaces

### 1. Permission Model

```typescript
interface IPermission {
  _id: ObjectId;
  name: string;                    // e.g., "users.create", "projects.delete"
  resource: string;                // e.g., "users", "projects", "contracts"
  action: string;                  // e.g., "create", "read", "update", "delete"
  description: string;
  scope?: 'own' | 'any' | 'organization';  // Scope of permission
  conditions?: Record<string, any>; // Additional conditions
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Role Model

```typescript
interface IRole {
  _id: ObjectId;
  name: string;                    // e.g., "Super Admin", "Moderator"
  slug: string;                    // e.g., "super-admin", "moderator"
  description: string;
  permissions: ObjectId[];         // References to Permission documents
  isSystem: boolean;               // System roles cannot be deleted
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Enhanced User Model

```typescript
interface IUserPermissions {
  roles: ObjectId[];               // References to Role documents
  directPermissions: ObjectId[];   // Direct permission assignments
  deniedPermissions: ObjectId[];   // Explicitly denied permissions
}

// Add to existing IUser interface
interface IUser {
  // ... existing fields ...
  permissions: IUserPermissions;
  lastPermissionUpdate: Date;
}
```

### 4. Audit Log Model

```typescript
interface IAuditLog {
  _id: ObjectId;
  action: 'role_assigned' | 'role_removed' | 'permission_granted' | 'permission_revoked';
  performedBy: ObjectId;           // Admin who made the change
  targetUser: ObjectId;            // User affected by the change
  resourceType: 'role' | 'permission';
  resourceId: ObjectId;
  resourceName: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### 5. Data Consistency Service

```typescript
interface IDataConsistencyService {
  // Rating synchronization
  syncUserRating(userId: ObjectId): Promise<void>;
  syncAllRatings(): Promise<ConsistencyReport>;
  
  // Contract validation
  validateContractAmounts(contractId: ObjectId): Promise<ValidationResult>;
  validateAllContracts(): Promise<ConsistencyReport>;
  
  // Referential integrity
  validateProjectReferences(projectId: ObjectId): Promise<ValidationResult>;
  validateAllReferences(): Promise<ConsistencyReport>;
  
  // Comprehensive check
  runFullConsistencyCheck(): Promise<ConsistencyReport>;
  fixInconsistencies(report: ConsistencyReport, autoFix: boolean): Promise<FixReport>;
}

interface ConsistencyReport {
  timestamp: Date;
  totalChecked: number;
  issuesFound: number;
  issues: ConsistencyIssue[];
}

interface ConsistencyIssue {
  type: 'rating_mismatch' | 'contract_amount' | 'missing_reference' | 'orphaned_record';
  severity: 'critical' | 'warning' | 'info';
  entity: string;
  entityId: ObjectId;
  description: string;
  expectedValue?: any;
  actualValue?: any;
  canAutoFix: boolean;
}

interface ValidationResult {
  isValid: boolean;
  issues: ConsistencyIssue[];
}

interface FixReport {
  timestamp: Date;
  issuesFixed: number;
  issuesFailed: number;
  details: FixDetail[];
}

interface FixDetail {
  issue: ConsistencyIssue;
  fixed: boolean;
  error?: string;
}
```

### 6. Permission Service

```typescript
interface IPermissionService {
  // Permission checks
  hasPermission(userId: ObjectId, permission: string): Promise<boolean>;
  hasAnyPermission(userId: ObjectId, permissions: string[]): Promise<boolean>;
  hasAllPermissions(userId: ObjectId, permissions: string[]): Promise<boolean>;
  
  // Role management
  assignRole(userId: ObjectId, roleId: ObjectId, assignedBy: ObjectId): Promise<void>;
  removeRole(userId: ObjectId, roleId: ObjectId, removedBy: ObjectId): Promise<void>;
  getUserRoles(userId: ObjectId): Promise<IRole[]>;
  
  // Direct permission management
  grantPermission(userId: ObjectId, permissionId: ObjectId, grantedBy: ObjectId): Promise<void>;
  revokePermission(userId: ObjectId, permissionId: ObjectId, revokedBy: ObjectId): Promise<void>;
  
  // Permission aggregation
  getUserPermissions(userId: ObjectId): Promise<IPermission[]>;
  
  // Audit
  getAuditLog(filters: AuditLogFilters): Promise<IAuditLog[]>;
}

interface AuditLogFilters {
  targetUser?: ObjectId;
  performedBy?: ObjectId;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}
```

## Data Models

### Permission Schema

```typescript
const permissionSchema = new Schema({
  name: { type: String, required: true, unique: true },
  resource: { type: String, required: true, index: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  scope: { type: String, enum: ['own', 'any', 'organization'], default: 'own' },
  conditions: { type: Schema.Types.Mixed },
}, { timestamps: true });

permissionSchema.index({ resource: 1, action: 1 });
```

### Role Schema

```typescript
const roleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

roleSchema.index({ slug: 1 });
roleSchema.index({ isActive: 1 });
```

### Audit Log Schema

```typescript
const auditLogSchema = new Schema({
  action: { 
    type: String, 
    required: true,
    enum: ['role_assigned', 'role_removed', 'permission_granted', 'permission_revoked'],
    index: true
  },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resourceType: { type: String, enum: ['role', 'permission'], required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  resourceName: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
```

### Enhanced User Schema Updates

```typescript
// Add to existing User schema
const userPermissionsSchema = new Schema({
  roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  directPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  deniedPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
}, { _id: false });

// Add to User schema
permissions: { type: userPermissionsSchema, default: () => ({}) },
lastPermissionUpdate: { type: Date },
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rating Consistency

*For any* user with published reviews, the user's average rating should equal the mean of all published review ratings for that user, and the rating count should equal the number of published reviews.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Contract Amount Integrity

*For any* contract with milestones, the sum of all milestone amounts must equal the contract's total amount within a tolerance of 0.01.

**Validates: Requirements 3.1, 3.4**

### Property 3: Referential Integrity

*For any* contract, the referenced project, client, freelancer, and proposal must exist in the database and maintain valid relationships (client owns project, freelancer owns proposal, proposal is for project).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Review Count Accuracy

*For any* user, the rating count field must equal the number of published reviews where that user is the reviewee.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Permission Inheritance

*For any* user with assigned roles, the user's effective permissions must include all permissions from all assigned roles, minus any explicitly denied permissions.

**Validates: Requirements 5.4, 6.2, 6.5**

### Property 6: Role Assignment Validity

*For any* role assignment operation, the role must exist, be active, and the target user must exist and be active.

**Validates: Requirements 6.1, 6.2, 8.2**

### Property 7: Permission Check Completeness

*For any* permission check, the system must evaluate both direct permissions and role-based permissions, returning true only if the permission is granted and not explicitly denied.

**Validates: Requirements 5.4, 11.1**

### Property 8: Audit Log Completeness

*For any* permission or role modification, an audit log entry must be created with all required fields (action, performedBy, targetUser, resourceType, resourceId, timestamp).

**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

### Property 9: Project Status Consistency

*For any* project with a completed contract, the project status must be "completed" or "in_progress", never "open".

**Validates: Requirements 2.4, 2.5**

### Property 10: Milestone Payment Consistency

*For any* milestone marked as "paid", a corresponding payment record must exist with matching amount and contract reference.

**Validates: Requirements 3.2**

### Property 11: Seed Data Referential Integrity

*For any* generated seed data, all foreign key references must point to existing records created earlier in the seed process.

**Validates: Requirements 9.2, 9.5**

### Property 12: System Role Immutability

*For any* system role (isSystem: true), deletion attempts must be rejected and core permissions must not be removable.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

### Error Types

```typescript
class PermissionDeniedError extends Error {
  constructor(permission: string, userId: string) {
    super(`User ${userId} does not have permission: ${permission}`);
    this.name = 'PermissionDeniedError';
  }
}

class DataInconsistencyError extends Error {
  constructor(message: string, public issues: ConsistencyIssue[]) {
    super(message);
    this.name = 'DataInconsistencyError';
  }
}

class RoleNotFoundError extends Error {
  constructor(roleId: string) {
    super(`Role not found: ${roleId}`);
    this.name = 'RoleNotFoundError';
  }
}

class InvalidRoleAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleAssignmentError';
  }
}
```

### Error Handling Strategy

1. **Permission Errors**: Return 403 Forbidden with clear message about missing permission
2. **Authentication Errors**: Return 401 Unauthorized
3. **Data Consistency Errors**: Log detailed report, optionally auto-fix, return 500 if critical
4. **Validation Errors**: Return 400 Bad Request with validation details
5. **Not Found Errors**: Return 404 Not Found

### Middleware Error Handling

```typescript
// Permission check middleware
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const hasPermission = await permissionService.hasPermission(
        req.user._id,
        permission
      );
      
      if (!hasPermission) {
        throw new PermissionDeniedError(permission, req.user._id.toString());
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Data consistency middleware
export const validateDataConsistency = (entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dataConsistencyService.validate(entityType, req.body);
      
      if (!result.isValid) {
        throw new DataInconsistencyError(
          'Data validation failed',
          result.issues
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Areas**:
1. Permission Service
   - Permission checking logic
   - Role assignment/removal
   - Permission aggregation
   - Audit log creation

2. Data Consistency Service
   - Rating calculation
   - Contract amount validation
   - Reference validation
   - Auto-fix logic

3. Middleware
   - Permission checking
   - Authentication
   - Error handling

4. Models
   - Schema validation
   - Virtual properties
   - Pre/post hooks

**Example Unit Tests**:
```typescript
describe('PermissionService', () => {
  describe('hasPermission', () => {
    it('should return true when user has direct permission', async () => {
      // Test direct permission
    });
    
    it('should return true when user has permission through role', async () => {
      // Test role-based permission
    });
    
    it('should return false when permission is explicitly denied', async () => {
      // Test denied permission
    });
  });
});

describe('DataConsistencyService', () => {
  describe('syncUserRating', () => {
    it('should calculate correct average from published reviews', async () => {
      // Test rating calculation
    });
    
    it('should set rating to 0 when no published reviews exist', async () => {
      // Test zero reviews case
    });
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Tests**:

1. **Property 1: Rating Consistency**
```typescript
/**
 * Feature: data-consistency-rbac, Property 1: Rating Consistency
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
it('should maintain rating consistency for any user with reviews', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 50 }),
      async (ratings) => {
        // Create user and reviews with given ratings
        const user = await createTestUser();
        await createReviewsForUser(user._id, ratings);
        
        // Sync rating
        await dataConsistencyService.syncUserRating(user._id);
        
        // Verify
        const updatedUser = await User.findById(user._id);
        const expectedAvg = ratings.reduce((a, b) => a + b) / ratings.length;
        
        expect(updatedUser.rating.average).toBeCloseTo(expectedAvg, 2);
        expect(updatedUser.rating.count).toBe(ratings.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

2. **Property 2: Contract Amount Integrity**
```typescript
/**
 * Feature: data-consistency-rbac, Property 2: Contract Amount Integrity
 * Validates: Requirements 3.1, 3.4
 */
it('should ensure milestone amounts sum to contract total', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.float({ min: 100, max: 5000 }), { minLength: 1, maxLength: 10 }),
      async (milestoneAmounts) => {
        const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0);
        
        // Create contract with milestones
        const contract = await createTestContract({
          totalAmount,
          milestones: milestoneAmounts.map(amount => ({ amount }))
        });
        
        // Validate
        const result = await dataConsistencyService.validateContractAmounts(contract._id);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

3. **Property 3: Referential Integrity**
```typescript
/**
 * Feature: data-consistency-rbac, Property 3: Referential Integrity
 * Validates: Requirements 2.1, 2.2, 2.3
 */
it('should maintain valid references for any contract', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        projectTitle: fc.string({ minLength: 5, maxLength: 50 }),
        proposalAmount: fc.float({ min: 100, max: 10000 }),
        contractDuration: fc.integer({ min: 1, max: 365 })
      }),
      async (data) => {
        // Create related entities in correct order
        const client = await createTestUser({ role: 'client' });
        const freelancer = await createTestUser({ role: 'freelancer' });
        const project = await createTestProject({ client: client._id, title: data.projectTitle });
        const proposal = await createTestProposal({ 
          project: project._id, 
          freelancer: freelancer._id,
          amount: data.proposalAmount
        });
        const contract = await createTestContract({
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          proposal: proposal._id
        });
        
        // Validate references
        const result = await dataConsistencyService.validateProjectReferences(project._id);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

4. **Property 5: Permission Inheritance**
```typescript
/**
 * Feature: data-consistency-rbac, Property 5: Permission Inheritance
 * Validates: Requirements 5.4, 6.2, 6.5
 */
it('should grant all role permissions to user', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
      async (permissionNames) => {
        // Create permissions and role
        const permissions = await Promise.all(
          permissionNames.map(name => createTestPermission({ name }))
        );
        const role = await createTestRole({ 
          permissions: permissions.map(p => p._id) 
        });
        const user = await createTestUser();
        
        // Assign role
        await permissionService.assignRole(user._id, role._id, adminUser._id);
        
        // Verify all permissions are granted
        const userPermissions = await permissionService.getUserPermissions(user._id);
        const userPermissionNames = userPermissions.map(p => p.name);
        
        permissionNames.forEach(name => {
          expect(userPermissionNames).toContain(name);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

5. **Property 7: Permission Check Completeness**
```typescript
/**
 * Feature: data-consistency-rbac, Property 7: Permission Check Completeness
 * Validates: Requirements 5.4, 11.1
 */
it('should correctly evaluate permission checks', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        hasDirectPermission: fc.boolean(),
        hasRolePermission: fc.boolean(),
        isDenied: fc.boolean()
      }),
      async (config) => {
        const permission = await createTestPermission();
        const user = await createTestUser();
        
        // Setup permissions based on config
        if (config.hasDirectPermission) {
          await permissionService.grantPermission(user._id, permission._id, adminUser._id);
        }
        if (config.hasRolePermission) {
          const role = await createTestRole({ permissions: [permission._id] });
          await permissionService.assignRole(user._id, role._id, adminUser._id);
        }
        if (config.isDenied) {
          await User.findByIdAndUpdate(user._id, {
            $push: { 'permissions.deniedPermissions': permission._id }
          });
        }
        
        // Check permission
        const hasPermission = await permissionService.hasPermission(user._id, permission.name);
        
        // Expected result: has permission if granted and not denied
        const expected = (config.hasDirectPermission || config.hasRolePermission) && !config.isDenied;
        expect(hasPermission).toBe(expected);
      }
    ),
    { numRuns: 100 }
  );
});
```

6. **Property 8: Audit Log Completeness**
```typescript
/**
 * Feature: data-consistency-rbac, Property 8: Audit Log Completeness
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */
it('should create audit log for any permission change', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('role_assigned', 'role_removed', 'permission_granted', 'permission_revoked'),
      async (action) => {
        const user = await createTestUser();
        const admin = await createTestUser({ role: 'admin' });
        
        // Perform action
        if (action === 'role_assigned') {
          const role = await createTestRole();
          await permissionService.assignRole(user._id, role._id, admin._id);
        } else if (action === 'permission_granted') {
          const permission = await createTestPermission();
          await permissionService.grantPermission(user._id, permission._id, admin._id);
        }
        // ... other actions
        
        // Verify audit log
        const logs = await AuditLog.find({ targetUser: user._id, action });
        expect(logs.length).toBeGreaterThan(0);
        
        const log = logs[0];
        expect(log.performedBy.toString()).toBe(admin._id.toString());
        expect(log.targetUser.toString()).toBe(user._id.toString());
        expect(log.action).toBe(action);
        expect(log.timestamp).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Coverage Areas**:
1. API endpoints with permission checks
2. Data consistency hooks during CRUD operations
3. Seed data generation and validation
4. End-to-end permission flows

**Example Integration Tests**:
```typescript
describe('Admin API with RBAC', () => {
  it('should allow super admin to assign roles', async () => {
    const superAdmin = await createSuperAdmin();
    const user = await createTestUser();
    const role = await createTestRole();
    
    const response = await request(app)
      .post(`/api/admin/users/${user._id}/roles`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ roleId: role._id });
    
    expect(response.status).toBe(200);
  });
  
  it('should deny non-admin from assigning roles', async () => {
    const regularUser = await createTestUser();
    const targetUser = await createTestUser();
    const role = await createTestRole();
    
    const response = await request(app)
      .post(`/api/admin/users/${targetUser._id}/roles`)
      .set('Authorization', `Bearer ${regularUser.token}`)
      .send({ roleId: role._id });
    
    expect(response.status).toBe(403);
  });
});
```

### Test Data Generators

```typescript
// Smart generators for property-based testing
const userGenerator = fc.record({
  email: fc.emailAddress(),
  role: fc.constantFrom('admin', 'freelancer', 'client'),
  rating: fc.record({
    average: fc.float({ min: 0, max: 5 }),
    count: fc.integer({ min: 0, max: 100 })
  })
});

const contractGenerator = fc.record({
  totalAmount: fc.float({ min: 100, max: 50000 }),
  milestoneCount: fc.integer({ min: 1, max: 10 })
}).chain(config => fc.record({
  totalAmount: fc.constant(config.totalAmount),
  milestones: fc.array(
    fc.float({ min: 10, max: config.totalAmount / config.milestoneCount * 2 }),
    { minLength: config.milestoneCount, maxLength: config.milestoneCount }
  ).filter(amounts => {
    const sum = amounts.reduce((a, b) => a + b, 0);
    return Math.abs(sum - config.totalAmount) < 0.01;
  })
}));
```

## Implementation Notes

### Database Migrations

1. Add Permission and Role collections
2. Add AuditLog collection
3. Update User schema with permissions field
4. Create indexes for performance
5. Seed system roles and permissions

### Performance Considerations

1. **Caching**: Cache user permissions for 15 minutes
2. **Indexes**: Add indexes on permission checks, role lookups, audit logs
3. **Batch Operations**: Use bulk operations for consistency checks
4. **Lazy Loading**: Load permissions only when needed
5. **Query Optimization**: Use aggregation pipelines for complex queries

### Security Considerations

1. **Permission Checks**: Always check permissions before sensitive operations
2. **Audit Logging**: Log all permission changes with IP and user agent
3. **Rate Limiting**: Limit permission check requests to prevent abuse
4. **Input Validation**: Validate all permission and role inputs
5. **Principle of Least Privilege**: Grant minimum necessary permissions

### Backward Compatibility

1. Maintain existing `role` and `roles` fields on User model
2. Migrate existing role-based checks to new permission system gradually
3. Provide fallback to old system if new system fails
4. Support both old and new API endpoints during transition
