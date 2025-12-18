# Implementation Plan

- [x] 1. Create Permission and Role models with schemas


  - Create Permission model with name, resource, action, description, scope fields
  - Create Role model with name, slug, description, permissions array, isSystem flag
  - Add indexes for performance (resource+action, slug, isActive)
  - Add validation for unique names and slugs
  - _Requirements: 5.1, 6.1_

- [x] 2. Create Audit Log model for permission tracking


  - Create AuditLog model with action, performedBy, targetUser, resourceType, resourceId fields
  - Add indexes on timestamp, targetUser, performedBy for efficient queries
  - Add metadata field for additional context
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 3. Update User model with permissions structure


  - Add permissions subdocument with roles, directPermissions, deniedPermissions arrays
  - Add lastPermissionUpdate timestamp field
  - Maintain backward compatibility with existing role and roles fields
  - Add indexes for permission queries
  - _Requirements: 5.2, 5.3, 6.2_

- [-] 4. Implement Permission Service core functionality

  - [x] 4.1 Implement hasPermission method with role and direct permission checking

    - Check direct permissions first
    - Check role-based permissions
    - Handle denied permissions
    - Cache results for performance
    - _Requirements: 5.4, 11.1_
  
  - [ ] 4.2 Write property test for permission checking
    - **Property 7: Permission Check Completeness**
    - **Validates: Requirements 5.4, 11.1**
  
  - [x] 4.3 Implement getUserPermissions method for aggregating all permissions

    - Fetch user's direct permissions
    - Fetch all roles and their permissions
    - Merge and deduplicate permissions
    - Filter out denied permissions
    - _Requirements: 5.5, 6.5_
  
  - [ ] 4.4 Write property test for permission inheritance
    - **Property 5: Permission Inheritance**
    - **Validates: Requirements 5.4, 6.2, 6.5**
  
  - [x] 4.5 Implement role assignment with audit logging

    - Validate role exists and is active
    - Add role to user's roles array
    - Create audit log entry
    - Clear permission cache
    - _Requirements: 6.2, 8.2, 12.1_
  
  - [ ] 4.6 Write property test for role assignment
    - **Property 6: Role Assignment Validity**
    - **Validates: Requirements 6.1, 6.2, 8.2**
  
  - [x] 4.7 Implement role removal with audit logging

    - Validate user has the role
    - Remove role from user's roles array
    - Create audit log entry
    - Clear permission cache
    - _Requirements: 6.4, 8.3, 12.2_
  
  - [x] 4.8 Implement direct permission grant/revoke with audit logging

    - Add/remove permission from user's directPermissions array
    - Create audit log entries
    - Clear permission cache
    - _Requirements: 5.2, 5.3, 8.4, 8.5, 12.3, 12.4_
  
  - [ ] 4.9 Write property test for audit log creation
    - **Property 8: Audit Log Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [-] 5. Implement Data Consistency Service

  - [x] 5.1 Implement syncUserRating method

    - Query all published reviews for user
    - Calculate average rating
    - Update user's rating.average and rating.count
    - Handle zero reviews case
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 5.2 Write property test for rating consistency
    - **Property 1: Rating Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  
  - [x] 5.3 Implement validateContractAmounts method

    - Sum all milestone amounts
    - Compare with contract totalAmount
    - Return validation result with issues
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [ ] 5.4 Write property test for contract amount integrity
    - **Property 2: Contract Amount Integrity**
    - **Validates: Requirements 3.1, 3.4**
  
  - [x] 5.5 Implement validateProjectReferences method

    - Check contract references valid project, client, freelancer, proposal
    - Verify client owns project
    - Verify freelancer owns proposal
    - Verify proposal is for project
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ] 5.6 Write property test for referential integrity
    - **Property 3: Referential Integrity**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [x] 5.7 Implement review count synchronization

    - Count published reviews for user
    - Update user's rating.count
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 5.8 Write property test for review count accuracy
    - **Property 4: Review Count Accuracy**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  
  - [x] 5.9 Implement runFullConsistencyCheck method

    - Check all user ratings
    - Check all contract amounts
    - Check all references
    - Generate comprehensive report
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 5.10 Implement fixInconsistencies method with auto-fix

    - Process each issue in report
    - Apply fixes based on issue type
    - Track success/failure for each fix
    - Return fix report
    - _Requirements: 10.5_
  
  - [ ] 5.11 Write property test for milestone payment consistency
    - **Property 10: Milestone Payment Consistency**
    - **Validates: Requirements 3.2**

- [-] 6. Add database hooks for automatic consistency

  - [x] 6.1 Add Review post-save hook to update user rating

    - Trigger syncUserRating after review save
    - Handle both create and update
    - _Requirements: 1.1, 1.2_
  
  - [x] 6.2 Add Review post-remove hook to update user rating

    - Trigger syncUserRating after review deletion
    - _Requirements: 1.2, 4.3_
  
  - [x] 6.3 Add Contract pre-save hook to validate milestone amounts

    - Validate milestone sum equals total before save
    - Throw error if validation fails
    - _Requirements: 3.1, 3.5_
  
  - [x] 6.4 Add Contract post-save hook to update project status

    - Check if contract is completed
    - Update project status to completed
    - _Requirements: 2.5_
  
  - [ ] 6.5 Write property test for project status consistency
    - **Property 9: Project Status Consistency**
    - **Validates: Requirements 2.4, 2.5**

- [-] 7. Create permission check middleware

  - [x] 7.1 Implement requirePermission middleware

    - Extract user from request
    - Check if user has required permission
    - Return 403 if permission denied
    - Return 401 if not authenticated
    - Log unauthorized access attempts
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 7.2 Implement requireAnyPermission middleware

    - Check if user has any of the specified permissions
    - _Requirements: 11.1_
  
  - [x] 7.3 Implement requireAllPermissions middleware

    - Check if user has all specified permissions
    - _Requirements: 11.1_
  
  - [x] 7.4 Implement requireAdminPermission middleware


    - Check for admin role or specific admin permissions
    - _Requirements: 11.5_
  
  - [ ] 7.5 Write property test for permission middleware
    - **Property 7: Permission Check Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.4**

- [-] 8. Create admin API endpoints for RBAC management

  - [x] 8.1 Create POST /api/admin/roles endpoint

    - Create new role with permissions
    - Validate role data
    - Return created role
    - _Requirements: 6.1_
  
  - [x] 8.2 Create GET /api/admin/roles endpoint

    - List all roles with pagination
    - Support filtering by isActive, isSystem
    - _Requirements: 6.1_
  
  - [x] 8.3 Create PUT /api/admin/roles/:roleId endpoint

    - Update role permissions
    - Trigger permission cache clear for affected users
    - _Requirements: 6.3_
  
  - [x] 8.4 Create POST /api/admin/users/:userId/roles endpoint

    - Assign role to user
    - Create audit log
    - _Requirements: 6.2, 8.2, 12.1_
  
  - [x] 8.5 Create DELETE /api/admin/users/:userId/roles/:roleId endpoint

    - Remove role from user
    - Create audit log
    - _Requirements: 6.4, 8.3, 12.2_
  
  - [x] 8.6 Create POST /api/admin/users/:userId/permissions endpoint

    - Grant direct permission to user
    - Create audit log
    - _Requirements: 5.2, 8.4, 12.3_
  
  - [x] 8.7 Create DELETE /api/admin/users/:userId/permissions/:permissionId endpoint

    - Revoke direct permission from user
    - Create audit log
    - _Requirements: 5.3, 8.5, 12.4_
  
  - [x] 8.8 Create GET /api/admin/users/:userId/permissions endpoint

    - Get all user permissions (direct + role-based)
    - _Requirements: 5.5, 8.1_
  
  - [x] 8.9 Create GET /api/admin/audit-logs endpoint

    - Query audit logs with filters
    - Support pagination
    - Sort by timestamp descending
    - _Requirements: 12.5_

- [-] 9. Create system roles and permissions initialization

  - [x] 9.1 Create seed script for system permissions

    - Define all platform permissions (users.*, projects.*, contracts.*, etc.)
    - Create Permission documents
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 9.2 Create seed script for system roles

    - Create "Super Admin" role with all permissions
    - Create "Moderator" role with content moderation permissions
    - Create "Support Agent" role with user support permissions
    - Create "Financial Manager" role with payment permissions
    - Mark all as system roles (isSystem: true)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 9.3 Write tests for system role initialization
    - **Property 12: System Role Immutability**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [-] 10. Update seed data for consistency

  - [x] 10.1 Update user seed to calculate ratings from reviews

    - Generate reviews first
    - Calculate ratings based on generated reviews
    - Ensure rating.count matches review count
    - _Requirements: 1.5, 4.4, 9.1_
  
  - [x] 10.2 Update contract seed to ensure milestone amounts sum correctly

    - Generate milestone amounts that sum to total
    - Validate before saving
    - _Requirements: 3.4, 9.3_
  
  - [x] 10.3 Update seed to maintain referential integrity

    - Create entities in correct order (users → projects → proposals → contracts → reviews)
    - Validate all references before creating dependent entities
    - _Requirements: 2.3, 9.2, 9.5_
  
  - [x] 10.4 Add role assignments to admin users in seed

    - Assign Super Admin role to main admin
    - Assign other roles to additional admin users
    - _Requirements: 7.5_
  
  - [ ] 10.5 Write property test for seed data integrity
    - **Property 11: Seed Data Referential Integrity**
    - **Validates: Requirements 9.2, 9.5**

- [-] 11. Create data validation CLI utility

  - [x] 11.1 Create validation command structure

    - Setup CLI with commander or yargs
    - Add --check flag for validation only
    - Add --fix flag for auto-fix mode
    - Add --report flag for detailed report
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 11.2 Implement rating validation check

    - Compare user ratings with actual review data
    - Report mismatches
    - _Requirements: 10.1_
  
  - [x] 11.3 Implement contract validation check

    - Validate milestone amounts sum to totals
    - Report inconsistencies
    - _Requirements: 10.2_
  
  - [x] 11.4 Implement reference validation check

    - Check all foreign key references
    - Report orphaned or invalid references
    - _Requirements: 10.3_
  
  - [x] 11.5 Implement auto-fix functionality

    - Fix rating mismatches by recalculating
    - Fix orphaned references by cleanup or repair
    - Report what was fixed
    - _Requirements: 10.5_

- [-] 12. Update existing API endpoints with permission checks

  - [x] 12.1 Add permission checks to user management endpoints

    - Require "users.update" for user updates
    - Require "users.delete" for user deletion
    - Require "users.read" for viewing user details
    - _Requirements: 11.1, 11.5_
  

  - [ ] 12.2 Add permission checks to project management endpoints
    - Require "projects.create" for project creation
    - Require "projects.update" for project updates
    - Require "projects.delete" for project deletion
    - _Requirements: 11.1_
  
  - [x] 12.3 Add permission checks to contract management endpoints

    - Require "contracts.approve" for milestone approval
    - Require "contracts.update" for contract modifications
    - _Requirements: 11.1_
  
  - [x] 12.4 Add permission checks to admin endpoints

    - Require admin permissions for all admin routes
    - Use requireAdminPermission middleware
    - _Requirements: 11.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 14. Create frontend components for RBAC management

  - [x] 14.1 Create RoleManagement component

    - Display list of roles
    - Allow creating/editing roles
    - Show permissions for each role
    - _Requirements: 6.1, 6.3_
  
  - [x] 14.2 Create UserPermissions component

    - Display user's roles and permissions
    - Allow assigning/removing roles
    - Allow granting/revoking direct permissions
    - _Requirements: 5.2, 5.3, 6.2, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 14.3 Create AuditLogViewer component

    - Display audit logs in table format
    - Support filtering by user, action, date range
    - Show detailed information for each log entry
    - _Requirements: 12.5_
  
  - [x] 14.4 Create DataConsistencyDashboard component

    - Show consistency check results
    - Display issues found
    - Allow triggering validation
    - Show fix results
    - _Requirements: 10.4_

- [-] 15. Add API service methods for RBAC

  - [x] 15.1 Create roleService with CRUD methods

    - getRoles, createRole, updateRole, deleteRole
    - _Requirements: 6.1, 6.3_
  
  - [x] 15.2 Create permissionService with assignment methods

    - assignRole, removeRole, grantPermission, revokePermission
    - getUserPermissions
    - _Requirements: 5.2, 5.3, 5.5, 6.2, 6.4_
  
  - [x] 15.3 Create auditLogService with query methods

    - getAuditLogs with filtering
    - _Requirements: 12.5_

- [x] 16. Update admin routes with new RBAC endpoints


  - Add routes for role management
  - Add routes for permission management
  - Add routes for audit logs
  - Protect all routes with appropriate permission checks
  - _Requirements: 11.1, 11.5_

- [x] 17. Create documentation for RBAC system
  - Document permission naming conventions
  - Document system roles and their permissions
  - Document API endpoints for RBAC management
  - Document how to add new permissions
  - Document audit log structure
  - _Requirements: 5.1, 6.1, 7.1, 7.2, 7.3, 7.4_
  - **Completed**: `RBAC_INTEGRATION.md`, `RBAC_IMPLEMENTATION_SUMMARY.md`, `RBAC_FRONTEND_GUIDE.md`

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
