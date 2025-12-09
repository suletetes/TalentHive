import api from './index';

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
    const response = await api.get('/rbac/roles', { params });
    return response.data;
  },

  getRole: async (roleId: string) => {
    const response = await api.get(`/rbac/roles/${roleId}`);
    return response.data;
  },

  createRole: async (data: { 
    name: string; 
    slug: string; 
    description: string; 
    permissions: string[];
    isSystem?: boolean;
  }) => {
    const response = await api.post('/rbac/roles', data);
    return response.data;
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
    const response = await api.put(`/rbac/roles/${roleId}`, data);
    return response.data;
  },

  deleteRole: async (roleId: string) => {
    const response = await api.delete(`/rbac/roles/${roleId}`);
    return response.data;
  },

  // User Role Assignment
  assignRole: async (userId: string, roleId: string) => {
    const response = await api.post(`/rbac/users/${userId}/roles`, { roleId });
    return response.data;
  },

  removeRole: async (userId: string, roleId: string) => {
    const response = await api.delete(`/rbac/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  // Permission Management
  getPermissions: async (params?: { 
    page?: number; 
    limit?: number; 
    resource?: string;
  }) => {
    const response = await api.get('/rbac/permissions', { params });
    return response.data;
  },

  createPermission: async (data: {
    name: string;
    resource: string;
    action: string;
    description: string;
    scope?: 'own' | 'any' | 'organization';
    conditions?: Record<string, any>;
  }) => {
    const response = await api.post('/rbac/permissions', data);
    return response.data;
  },

  getUserPermissions: async (userId: string): Promise<{ status: string; data: UserPermissionData }> => {
    const response = await api.get(`/rbac/users/${userId}/permissions`);
    return response.data;
  },

  grantPermission: async (userId: string, permissionId: string) => {
    const response = await api.post(`/rbac/users/${userId}/permissions`, { permissionId });
    return response.data;
  },

  revokePermission: async (userId: string, permissionId: string) => {
    const response = await api.delete(`/rbac/users/${userId}/permissions/${permissionId}`);
    return response.data;
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
    const response = await api.get('/rbac/audit-logs', { params });
    return response.data;
  },
};

export default rbacService;
