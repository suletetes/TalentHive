import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { Role } from '@/models/Role';
import { Permission } from '@/models/Permission';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { permissionService } from '@/services/permissionService';
import mongoose from 'mongoose';

// Role Management

export const createRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, slug, description, permissions, isSystem } = req.body;

  // Validate required fields
  if (!name || !slug || !description) {
    return next(new AppError('Name, slug, and description are required', 400));
  }

  // Check if role already exists
  const existingRole = await Role.findOne({ $or: [{ name }, { slug }] });
  if (existingRole) {
    return next(new AppError('Role with this name or slug already exists', 400));
  }

  // Validate permissions if provided
  if (permissions && permissions.length > 0) {
    const validPermissions = await Permission.find({ _id: { $in: permissions } });
    if (validPermissions.length !== permissions.length) {
      return next(new AppError('One or more invalid permission IDs', 400));
    }
  }

  const role = await Role.create({
    name,
    slug,
    description,
    permissions: permissions || [],
    isSystem: isSystem || false,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: { role },
  });
});

export const getRoles = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, isActive, isSystem } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isSystem !== undefined) query.isSystem = isSystem === 'true';

  const [roles, total] = await Promise.all([
    Role.find(query)
      .populate('permissions')
      .populate('createdBy', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Role.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      roles,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { roleId } = req.params;

  const role = await Role.findById(roleId)
    .populate('permissions')
    .populate('createdBy', 'email profile.firstName profile.lastName');

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.json({
    status: 'success',
    data: { role },
  });
});

export const updateRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { roleId } = req.params;
  const { name, description, permissions, isActive } = req.body;

  const role = await Role.findById(roleId);
  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  // Prevent modification of system roles
  if (role.isSystem) {
    return next(new AppError('Cannot modify system roles', 403));
  }

  // Update fields
  if (name) role.name = name;
  if (description) role.description = description;
  if (isActive !== undefined) role.isActive = isActive;
  
  if (permissions) {
    // Validate permissions
    const validPermissions = await Permission.find({ _id: { $in: permissions } });
    if (validPermissions.length !== permissions.length) {
      return next(new AppError('One or more invalid permission IDs', 400));
    }
    role.permissions = permissions;
  }

  await role.save();

  // Clear cache for all users with this role
  const usersWithRole = await User.find({ 'permissions.roles': roleId });
  for (const user of usersWithRole) {
    // Clear user cache (permission cache will be cleared automatically)
    await require('@/config/redis').deleteCache(`user:${user._id}`);
  }

  res.json({
    status: 'success',
    data: { role },
  });
});

export const deleteRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { roleId } = req.params;

  const role = await Role.findById(roleId);
  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  // Prevent deletion of system roles
  if (role.isSystem) {
    return next(new AppError('Cannot delete system roles', 403));
  }

  // Check if any users have this role
  const usersWithRole = await User.countDocuments({ 'permissions.roles': roleId });
  if (usersWithRole > 0) {
    return next(new AppError(`Cannot delete role: ${usersWithRole} users still have this role`, 400));
  }

  await role.deleteOne();

  res.json({
    status: 'success',
    message: 'Role deleted successfully',
  });
});

// User Role Assignment

export const assignRoleToUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    return next(new AppError('Role ID is required', 400));
  }

  const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.get('user-agent') || 'unknown';

  await permissionService.assignRole(
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(roleId),
    req.user._id,
    ipAddress,
    userAgent
  );

  const user = await User.findById(userId)
    .populate('permissions.roles')
    .select('-password');

  res.json({
    status: 'success',
    message: 'Role assigned successfully',
    data: { user },
  });
});

export const removeRoleFromUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId, roleId } = req.params;

  const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.get('user-agent') || 'unknown';

  await permissionService.removeRole(
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(roleId),
    req.user._id,
    ipAddress,
    userAgent
  );

  const user = await User.findById(userId)
    .populate('permissions.roles')
    .select('-password');

  res.json({
    status: 'success',
    message: 'Role removed successfully',
    data: { user },
  });
});

// Permission Management

export const grantPermissionToUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { permissionId } = req.body;

  if (!permissionId) {
    return next(new AppError('Permission ID is required', 400));
  }

  const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.get('user-agent') || 'unknown';

  await permissionService.grantPermission(
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(permissionId),
    req.user._id,
    ipAddress,
    userAgent
  );

  const user = await User.findById(userId)
    .populate('permissions.directPermissions')
    .select('-password');

  res.json({
    status: 'success',
    message: 'Permission granted successfully',
    data: { user },
  });
});

export const revokePermissionFromUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId, permissionId } = req.params;

  const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.get('user-agent') || 'unknown';

  await permissionService.revokePermission(
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(permissionId),
    req.user._id,
    ipAddress,
    userAgent
  );

  const user = await User.findById(userId)
    .populate('permissions.directPermissions')
    .select('-password');

  res.json({
    status: 'success',
    message: 'Permission revoked successfully',
    data: { user },
  });
});

export const getUserPermissions = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .populate('permissions.roles')
    .populate('permissions.directPermissions')
    .populate('permissions.deniedPermissions')
    .select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get aggregated permissions
  const allPermissions = await permissionService.getUserPermissions(
    new mongoose.Types.ObjectId(userId)
  );

  res.json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.permissions?.roles || [],
        directPermissions: user.permissions?.directPermissions || [],
        deniedPermissions: user.permissions?.deniedPermissions || [],
      },
      aggregatedPermissions: allPermissions,
    },
  });
});

// Audit Logs

export const getAuditLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 50, 
    targetUser, 
    performedBy, 
    action, 
    startDate, 
    endDate 
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const filters: any = {
    skip,
    limit: parseInt(limit as string),
  };

  if (targetUser) filters.targetUser = new mongoose.Types.ObjectId(targetUser as string);
  if (performedBy) filters.performedBy = new mongoose.Types.ObjectId(performedBy as string);
  if (action) filters.action = action as string;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const logs = await permissionService.getAuditLog(filters);

  // Get total count for pagination
  const query: any = {};
  if (targetUser) query.targetUser = filters.targetUser;
  if (performedBy) query.performedBy = filters.performedBy;
  if (action) query.action = action;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = filters.startDate;
    if (endDate) query.timestamp.$lte = filters.endDate;
  }

  const total = await AuditLog.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

// Permissions List

export const getPermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 100, resource } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = {};
  if (resource) query.resource = resource;

  const [permissions, total] = await Promise.all([
    Permission.find(query)
      .sort({ resource: 1, action: 1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Permission.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      permissions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const createPermission = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, resource, action, description, scope, conditions } = req.body;

  if (!name || !resource || !action || !description) {
    return next(new AppError('Name, resource, action, and description are required', 400));
  }

  // Check if permission already exists
  const existingPermission = await Permission.findOne({ name });
  if (existingPermission) {
    return next(new AppError('Permission with this name already exists', 400));
  }

  const permission = await Permission.create({
    name,
    resource,
    action,
    description,
    scope: scope || 'own',
    conditions,
  });

  res.status(201).json({
    status: 'success',
    data: { permission },
  });
});
