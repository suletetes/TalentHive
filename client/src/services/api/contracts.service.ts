import { apiCore } from './core';

export interface Contract {
  _id: string;
  project: string;
  proposal: string;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  budget: {
    amount: number;
    type: 'fixed' | 'hourly';
  };
  milestones: Array<{
    _id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
  }>;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  signatures: {
    client: { signed: boolean; signedAt?: Date };
    freelancer: { signed: boolean; signedAt?: Date };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractDto {
  title: string;
  description: string;
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
  }>;
}

export interface Amendment {
  _id: string;
  proposedBy: string;
  changes: any;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export class ContractsService {
  private basePath = '/contracts';

  async createContract(
    proposalId: string,
    data: CreateContractDto
  ): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(`${this.basePath}/proposal/${proposalId}`, data);
  }

  async getContract(id: string): Promise<{ data: Contract }> {
    return apiCore.get<{ data: Contract }>(`${this.basePath}/${id}`);
  }

  async getMyContracts(): Promise<{ data: Contract[] }> {
    const response = await apiCore.get<{ status: string; data: { contracts: Contract[]; pagination: any } }>(`${this.basePath}/my`);
    return { data: response.data.contracts };
  }

  async signContract(id: string): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(`${this.basePath}/${id}/sign`);
  }

  async cancelContract(id: string, reason: string): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(`${this.basePath}/${id}/cancel`, { reason });
  }

  async submitMilestone(
    contractId: string,
    milestoneId: string,
    data: { notes?: string; attachments?: string[] }
  ): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(
      `${this.basePath}/${contractId}/milestones/${milestoneId}/submit`,
      data
    );
  }

  async approveMilestone(
    contractId: string,
    milestoneId: string,
    data: { feedback?: string }
  ): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(
      `${this.basePath}/${contractId}/milestones/${milestoneId}/approve`,
      data
    );
  }

  async rejectMilestone(
    contractId: string,
    milestoneId: string,
    data: { reason: string }
  ): Promise<{ data: Contract }> {
    return apiCore.post<{ data: Contract }>(
      `${this.basePath}/${contractId}/milestones/${milestoneId}/reject`,
      data
    );
  }

  async proposeAmendment(
    contractId: string,
    data: { changes: any; reason: string }
  ): Promise<{ data: Amendment }> {
    return apiCore.post<{ data: Amendment }>(
      `${this.basePath}/${contractId}/amendments`,
      data
    );
  }

  async respondToAmendment(
    contractId: string,
    amendmentId: string,
    data: { accept: boolean; notes?: string }
  ): Promise<{ data: Amendment }> {
    return apiCore.post<{ data: Amendment }>(
      `${this.basePath}/${contractId}/amendments/${amendmentId}/respond`,
      data
    );
  }
}

export const contractsService = new ContractsService();
