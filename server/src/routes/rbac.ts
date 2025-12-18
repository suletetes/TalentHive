import express from 'express';
import { authenticate } from '@/middleware/auth';
import { requireAdminPermission } from '@/middleware/permissionMiddleware';
import * as rbacController from '@/controllers/rbacController';

const router = express.Router();

// All routes require authentication and admin permissions
router.use(authenticate);
router.use(requireAdminPermission());

// Role Management Routes
router.post('/roles', rbacController.createRole);
router.get('/roles', rbacController.getRoles);
router.get('/roles/:roleId', rbacController.getRole);
router.put('/roles/:roleId', rbacController.updateRole);
router.delete('/roles/:roleId', rbacController.deleteRole);

// User Role Assignment Routes
router.post('/users/:userId/roles', rbacController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', rbacController.removeRoleFromUser);

// Permission Management Routes
router.get('/permissions', rbacController.getPermissions);
router.post('/permissions', rbacController.createPermission);
router.post('/users/:userId/permissions', rbacController.grantPermissionToUser);
router.delete('/users/:userId/permissions/:permissionId', rbacController.revokePermissionFromUser);
router.get('/users/:userId/permissions', rbacController.getUserPermissions);

// Audit Log Routes
router.get('/audit-logs', rbacController.getAuditLogs);

export default router;
