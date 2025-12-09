import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Permission, IPermission } from '@/models/Permission';
import { Role, IRole } from '@/models/Role';
import { AuditLog } from '@/models/AuditLog';
import { getCache, setCache, deleteCache } from '@/config/redis';

export interface AuditLogFilters {
  targetUser?: mongoose.Types.ObjectId;
  performedBy?: mongoose.Types.ObjectId;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export class PermissionService {
  /**
   * Check if a user has a specific permission
   * Checks direct permissions, role-based permissions, and denied permissions
   */
  async hasPermission(userId: mongoose.Types.ObjectId, permissionName: string): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `user:${userId}:permission:${permissionName}`;
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }

      // Get user with permissions populated
      const user = await User.findById(userId)
        .populate('permissions.roles')
        .populate('permissions.directPermissions')
        .populate('permissions.deniedPermissions');

      if (!user) {
        return false;
      }

      // Check if permission is explicitly denied
      if (user.permissions?.deniedPermissions) {
        const deniedPermission = (user.permissions.deniedPermissions as any[]).find(
          (p: any) => p.name === permissionName
        );
        if (deniedPermission) {
          await setCache(cacheKey, 'false', 900); // Cache for 15 minutes
          return false;
        }
      }

      // Check direct permissions
      if (user.permissions?.directPermissions) {
        const directPermission = (user.permissions.directPermissions as any[]).find(
          (p: any) => p.name === permissionName
        );
        if (directPermission) {
          await setCache(cacheKey, 'true', 900);
          return true;
        }
      }

      // Check role-based permissions
      if (user.permissions?.roles) {
        for (const role of user.permissions.roles as any[]) {
          if (role.isActive && role.permissions) {
            const rolePermissions = await Permission.find({
              _id: { $in: role.permissions }
            });
            
            const hasRolePermission = rolePermissions.some(p => p.name === permissionName);
            if (hasRolePermission) {
              await setCache(cacheKey, 'true', 900);
              return true;
            }
          }
        }
      }

      await setCache(cacheKey, 'false', 900);
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: mongoose.Types.ObjectId, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all specified permissions
   */
  async hasAllPermissions(userId: mongoose.Types.ObjectId, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user (direct + role-based, minus denied)
   */
  async getUserPermissions(userId: mongoose.Types.ObjectId): Promise<IPermission[]> {
    try {
      const user = await User.findById(userId)
        .populate('permissions.roles')
        .populate('permissions.directPermissions')
        .populate('permissions.deniedPermissions');

      if (!user) {
        return [];
      }

      const permissionMap = new Map<string, IPermission>();

      // Add direct permissions
      if (user.permissions?.directPermissions) {
        for (const permission of user.permissions.directPermissions as any[]) {
          permissionMap.set(permission._id.toString(), permission);
        }
      }

      // Add role-based permissions
      if (user.permissions?.roles) {
        for (const role of user.permissions.roles as any[]) {
          if (role.isActive && role.permissions) {
            const rolePermissions = await Permission.find({
              _id: { $in: role.permissions }
            });
            
            for (const permission of rolePermissions) {
              permissionMap.set(permission._id.toString(), permission);
            }
          }
        }
      }

      // Remove denied permissions
      if (user.permissions?.deniedPermissions) {
        for (const permission of user.permissions.deniedPermissions as any[]) {
          permissionMap.delete(permission._id.toString());
        }
      }

      return Array.from(permissionMap.values());
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: mongoose.Types.ObjectId,
    roleId: mongoose.Types.ObjectId,
    assignedBy: mongoose.Types.ObjectId,
    ipAddress: string = '0.0.0.0',
    userAgent: string = 'system'
  ): Promise<void> {
    try {
      // Validate role exists and is active
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      if (!role.isActive) {
        throw new Error('Role is not active');
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize permissions if not exists
      if (!user.permissions) {
        user.permissions = {
          roles: [],
          directPermissions: [],
          deniedPermissions: []
        };
      }

      // Check if role already assigned
      const hasRole = user.permissions.roles.some(
        (r: any) => r.toString() === roleId.toString()
      );

      if (!hasRole) {
        user.permissions.roles.push(roleId);
        user.lastPermissionUpdate = new Date();
        await user.save();

        // Create audit log
        await AuditLog.create({
          action: 'role_assigned',
          performedBy: assignedBy,
          targetUser: userId,
          resourceType: 'role',
          resourceId: roleId,
          resourceName: role.name,
          ipAddress,
          userAgent,
        });

        // Clear permission cache
        await this.clearUserPermissionCache(userId);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(
    userId: mongoose.Types.ObjectId,
    roleId: mongoose.Types.ObjectId,
    removedBy: mongoose.Types.ObjectId,
    ipAddress: string = '0.0.0.0',
    userAgent: string = 'system'
  ): Promise<void> {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.permissions?.roles) {
        const initialLength = user.permissions.roles.length;
        user.permissions.roles = user.permissions.roles.filter(
          (r: any) => r.toString() !== roleId.toString()
        );

        if (user.permissions.roles.length < initialLength) {
          user.lastPermissionUpdate = new Date();
          await user.save();

          // Create audit log
          await AuditLog.create({
            action: 'role_removed',
            performedBy: removedBy,
            targetUser: userId,
            resourceType: 'role',
            resourceId: roleId,
            resourceName: role.name,
            ipAddress,
            userAgent,
          });

          // Clear permission cache
          await this.clearUserPermissionCache(userId);
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Grant a direct permission to a user
   */
  async grantPermission(
    userId: mongoose.Types.ObjectId,
    permissionId: mongoose.Types.ObjectId,
    grantedBy: mongoose.Types.ObjectId,
    ipAddress: string = '0.0.0.0',
    userAgent: string = 'system'
  ): Promise<void> {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('Permission not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize permissions if not exists
      if (!user.permissions) {
        user.permissions = {
          roles: [],
          directPermissions: [],
          deniedPermissions: []
        };
      }

      // Check if permission already granted
      const hasPermission = user.permissions.directPermissions.some(
        (p: any) => p.toString() === permissionId.toString()
      );

      if (!hasPermission) {
        user.permissions.directPermissions.push(permissionId);
        user.lastPermissionUpdate = new Date();
        await user.save();

        // Create audit log
        await AuditLog.create({
          action: 'permission_granted',
          performedBy: grantedBy,
          targetUser: userId,
          resourceType: 'permission',
          resourceId: permissionId,
          resourceName: permission.name,
          ipAddress,
          userAgent,
        });

        // Clear permission cache
        await this.clearUserPermissionCache(userId);
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke a direct permission from a user
   */
  async revokePermission(
    userId: mongoose.Types.ObjectId,
    permissionId: mongoose.Types.ObjectId,
    revokedBy: mongoose.Types.ObjectId,
    ipAddress: string = '0.0.0.0',
    userAgent: string = 'system'
  ): Promise<void> {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('Permission not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.permissions?.directPermissions) {
        const initialLength = user.permissions.directPermissions.length;
        user.permissions.directPermissions = user.permissions.directPermissions.filter(
          (p: any) => p.toString() !== permissionId.toString()
        );

        if (user.permissions.directPermissions.length < initialLength) {
          user.lastPermissionUpdate = new Date();
          await user.save();

          // Create audit log
          await AuditLog.create({
            action: 'permission_revoked',
            performedBy: revokedBy,
            targetUser: userId,
            resourceType: 'permission',
            resourceId: permissionId,
            resourceName: permission.name,
            ipAddress,
            userAgent,
          });

          // Clear permission cache
          await this.clearUserPermissionCache(userId);
        }
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: mongoose.Types.ObjectId): Promise<IRole[]> {
    try {
      const user = await User.findById(userId).populate('permissions.roles');
      if (!user || !user.permissions?.roles) {
        return [];
      }
      return user.permissions.roles as any[];
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLog(filters: AuditLogFilters): Promise<any[]> {
    try {
      const query: any = {};

      if (filters.targetUser) {
        query.targetUser = filters.targetUser;
      }
      if (filters.performedBy) {
        query.performedBy = filters.performedBy;
      }
      if (filters.action) {
        query.action = filters.action;
      }
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      const logs = await AuditLog.find(query)
        .populate('performedBy', 'email profile.firstName profile.lastName')
        .populate('targetUser', 'email profile.firstName profile.lastName')
        .sort({ timestamp: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0);

      return logs;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Clear all permission cache for a user
   */
  private async clearUserPermissionCache(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Clear all permission checks for this user
      // In a real implementation, you'd want to track all cached keys
      // For now, we'll just clear the user cache
      await deleteCache(`user:${userId}`);
    } catch (error) {
      console.error('Error clearing permission cache:', error);
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
