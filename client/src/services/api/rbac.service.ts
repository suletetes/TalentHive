import { apiCore } from './core';

export interface Role {
  _id: string;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  scope?: 'own' | 'any' | 'organization';
  conditions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  action: 'role_assigned' | 'role_removed' | 'permission_granted' | 'permission_revoked';
  performedBy: {
    _id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  targetUser: {
    _id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  resourceType: 'role' | 'permission';
  resourceId: string;
  resourceName: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserPermissionData {
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    roles: Role[];
    directPermissions: Permission[];
    deniedPermissions: Permission[];
  };
  aggregatedPermissions: Permission[];
}

export const rbacService = {
  // Role Management
  getRoles: async (params?: { 
    page?: number; 
    limit?: number; 
    isActive?: boolean;
    isSystem?: boolean;
  }) => {
    return await apiCore.get('/rbac/roles', { params });
  },

  getRole: async (roleId: string) => {
    return await apiCore.get(`/rbac/roles/${roleId}`);
  },

  createRole: async (data: { 
    name: string; 
    slug: string; 
    description: string; 
    permissions: string[];
    isSystem?: boolean;
  }) => {
    return await apiCore.post('/rbac/roles', data);
  },

  updateRole: async (
    roleId: string, 
    data: Partial<{ 
      name: string; 
      description: string; 
      permissions: string[]; 
      isActive: boolean;
    }>
  ) => {
    return await apiCore.put(`/rbac/roles/${roleId}`, data);
  },

  deleteRole: async (roleId: string) => {
    return await apiCore.delete(`/rbac/roles/${roleId}`);
  },

  // User Role Assignment
  assignRole: async (userId: string, roleId: string) => {
    return await apiCore.post(`/rbac/users/${userId}/roles`, { roleId });
  },

  removeRole: async (userId: string, roleId: string) => {
    return await apiCore.delete(`/rbac/users/${userId}/roles/${roleId}`);
  },

  // Permission Management
  getPermissions: async (params?: { 
    page?: number; 
    limit?: number; 
    resource?: string;
  }) => {
    return await apiCore.get('/rbac/permissions', { params });
  },

  createPermission: async (data: {
    name: string;
    resource: string;
    action: string;
    description: string;
    scope?: 'own' | 'any' | 'organization';
    conditions?: Record<string, any>;
  }) => {
    return await apiCore.post('/rbac/permissions', data);
  },

  getUserPermissions: async (userId: string): Promise<{ status: string; data: UserPermissionData }> => {
    return await apiCore.get(`/rbac/users/${userId}/permissions`);
  },

  grantPermission: async (userId: string, permissionId: string) => {
    return await apiCore.post(`/rbac/users/${userId}/permissions`, { permissionId });
  },

  revokePermission: async (userId: string, permissionId: string) => {
    return await apiCore.delete(`/rbac/users/${userId}/permissions/${permissionId}`);
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    targetUser?: string;
    performedBy?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return await apiCore.get('/rbac/audit-logs', { params });
  },
};

export default rbacService;
