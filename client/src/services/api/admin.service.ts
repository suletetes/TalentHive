import { apiCore } from './core';

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalContracts: number;
  totalRevenue: number;
  activeProjects: number;
  completedProjects: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  role: 'admin' | 'freelancer' | 'client';
  accountStatus: 'active' | 'suspended' | 'deactivated';
  isEmailVerified: boolean;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: Date;
}

export interface ReportData {
  userGrowth: Array<{ _id: string; count: number }>;
  revenueData: Array<{ _id: string; revenue: number; count: number }>;
  projectStats: Array<{ _id: string; count: number }>;
}

export class AdminService {
  private basePath = '/admin';

  async getDashboardStats(): Promise<{ data: { stats: AdminStats } }> {
    return apiCore.get<{ data: { stats: AdminStats } }>(`${this.basePath}/dashboard/stats`);
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: { users: AdminUser[]; pagination: any } }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: { users: AdminUser[]; pagination: any } }>(
      `${this.basePath}/users?${queryParams.toString()}`
    );
  }

  async updateUserStatus(
    userId: string,
    accountStatus: 'active' | 'suspended' | 'deactivated'
  ): Promise<{ data: { user: AdminUser } }> {
    const response = await apiCore.put<{ status: string; data: { user: AdminUser } }>(
      `${this.basePath}/users/${userId}/status`,
      { accountStatus }
    );
    return { data: response.data };
  }

  async updateUserRole(
    userId: string,
    role: 'admin' | 'freelancer' | 'client'
  ): Promise<{ data: { user: AdminUser } }> {
    const response = await apiCore.put<{ status: string; data: { user: AdminUser } }>(
      `${this.basePath}/users/${userId}/role`,
      { role }
    );
    return { data: response.data };
  }

  async getReports(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: ReportData }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: ReportData }>(
      `${this.basePath}/reports?${queryParams.toString()}`
    );
  }
}

export const adminService = new AdminService();
