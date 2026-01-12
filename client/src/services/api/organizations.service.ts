import { apiCore } from './core';

export interface Organization {
  _id: string;
  name: string;
  owner: string;
  members: Array<{
    user: string;
    role: 'owner' | 'admin' | 'member';
    budgetLimits?: {
      daily?: number;
      monthly?: number;
    };
  }>;
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  createdAt: Date;
}

export interface CreateOrganizationDto {
  name: string;
  industry?: string;
}

export interface BudgetApproval {
  _id: string;
  organization: string;
  requestedBy: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export class OrganizationsService {
  private basePath = '/organizations';

  async createOrganization(data: CreateOrganizationDto): Promise<{ data: Organization }> {
    return apiCore.post<{ data: Organization }>(this.basePath, data);
  }

  async getOrganization(id: string): Promise<{ data: Organization }> {
    return apiCore.get<{ data: Organization }>(`${this.basePath}/${id}`);
  }

  async getMyOrganizations(): Promise<{ data: Organization[] }> {
    return apiCore.get<{ data: Organization[] }>(`${this.basePath}/my`);
  }

  async inviteMember(
    orgId: string,
    data: { email: string; role: 'admin' | 'member' }
  ): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(
      `${this.basePath}/${orgId}/members/invite`,
      data
    );
  }

  async getMembers(orgId: string): Promise<{ data: any[] }> {
    return apiCore.get<{ data: any[] }>(`${this.basePath}/${orgId}/members`);
  }

  async removeMember(orgId: string, userId: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(
      `${this.basePath}/${orgId}/members/${userId}`
    );
  }

  async updateBudget(
    orgId: string,
    data: { total: number }
  ): Promise<{ data: Organization }> {
    return apiCore.put<{ data: Organization }>(`${this.basePath}/${orgId}/budget`, data);
  }

  async getBudgetApprovals(orgId: string): Promise<{ data: BudgetApproval[] }> {
    return apiCore.get<{ data: BudgetApproval[] }>(
      `${this.basePath}/${orgId}/approvals`
    );
  }

  async requestBudgetApproval(
    orgId: string,
    data: { amount: number; reason: string }
  ): Promise<{ data: BudgetApproval }> {
    return apiCore.post<{ data: BudgetApproval }>(
      `${this.basePath}/${orgId}/approvals`,
      data
    );
  }

  async respondToApproval(
    orgId: string,
    approvalId: string,
    data: { approve: boolean; notes?: string }
  ): Promise<{ data: BudgetApproval }> {
    return apiCore.post<{ data: BudgetApproval }>(
      `${this.basePath}/${orgId}/approvals/${approvalId}/respond`,
      data
    );
  }
}

export const organizationsService = new OrganizationsService();
