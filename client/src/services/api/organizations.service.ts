import { apiCore } from './core';
import { dataExtractor } from '@/utils/dataExtractor';

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
    const response = await apiCore.get<any>(`${this.basePath}/my`);
    
    // Extract organizations with robust data extraction
    const organizations = dataExtractor.extractArray<Organization>(response, [
      'data', 'data.organizations', 'organizations', 'data.data', 'data.data.organizations'
    ]);
    
    return { data: organizations };
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
    const response = await apiCore.get<any>(`${this.basePath}/${orgId}/members`);
    
    // Extract members with robust data extraction
    const members = dataExtractor.extractArray<any>(response, [
      'data', 'data.members', 'members', 'data.data', 'data.data.members'
    ]);
    
    return { data: members };
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
    const response = await apiCore.get<any>(
      `${this.basePath}/${orgId}/approvals`
    );
    
    // Extract approvals with robust data extraction
    const approvals = dataExtractor.extractArray<BudgetApproval>(response, [
      'data', 'data.approvals', 'approvals', 'data.data', 'data.data.approvals'
    ]);
    
    return { data: approvals };
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
