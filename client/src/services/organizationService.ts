import api from './api';

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: OrganizationMember[];
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  settings: {
    requireApproval: boolean;
    maxProjectBudget?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  user: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: string;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
  budget: {
    total: number;
  };
  settings?: {
    requireApproval?: boolean;
    maxProjectBudget?: number;
  };
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  budget?: {
    total?: number;
  };
  settings?: {
    requireApproval?: boolean;
    maxProjectBudget?: number;
  };
}

export interface AddMemberData {
  userId: string;
  role: 'admin' | 'member';
  permissions?: string[];
}

const organizationService = {
  // Get all organizations
  getOrganizations: async () => {
    const response = await api.get('/organizations');
    return response.data;
  },

  // Get organization by ID
  getOrganization: async (id: string) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  // Create organization
  createOrganization: async (data: CreateOrganizationData) => {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  // Update organization
  updateOrganization: async (id: string, data: UpdateOrganizationData) => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  // Delete organization
  deleteOrganization: async (id: string) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  // Add member
  addMember: async (id: string, data: AddMemberData) => {
    const response = await api.post(`/organizations/${id}/members`, data);
    return response.data;
  },

  // Remove member
  removeMember: async (id: string, userId: string) => {
    const response = await api.delete(`/organizations/${id}/members/${userId}`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (id: string, userId: string, role: string, permissions?: string[]) => {
    const response = await api.put(`/organizations/${id}/members/${userId}`, {
      role,
      permissions,
    });
    return response.data;
  },

  // Get organization projects
  getOrganizationProjects: async (id: string) => {
    const response = await api.get(`/organizations/${id}/projects`);
    return response.data;
  },

  // Get organization budget
  getOrganizationBudget: async (id: string) => {
    const response = await api.get(`/organizations/${id}/budget`);
    return response.data;
  },
};

export default organizationService;
