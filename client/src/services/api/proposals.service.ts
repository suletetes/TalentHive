import { apiCore } from './core';

export interface Proposal {
  _id: string;
  project: string;
  freelancer: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  coverLetter: string;
  proposedBudget: {
    amount: number;
    type: 'fixed' | 'hourly';
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones?: Array<{
    title: string;
    description: string;
    amount: number;
    duration: number;
  }>;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProposalDto {
  coverLetter: string;
  proposedBudget: {
    amount: number;
    type: 'fixed' | 'hourly';
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones?: Array<{
    title: string;
    description: string;
    amount: number;
    duration: number;
  }>;
}

export interface UpdateProposalDto extends Partial<CreateProposalDto> {}

export class ProposalsService {
  private basePath = '/proposals';

  async createProposal(
    projectId: string,
    data: CreateProposalDto
  ): Promise<{ data: Proposal }> {
    return apiCore.post<{ data: Proposal }>(`${this.basePath}/project/${projectId}`, data);
  }

  async getProposalsForProject(projectId: string): Promise<{ data: Proposal[] }> {
    return apiCore.get<{ data: Proposal[] }>(`${this.basePath}/project/${projectId}`);
  }

  async getMyProposals(): Promise<{ data: Proposal[] }> {
    return apiCore.get<{ data: Proposal[] }>(`${this.basePath}/my/proposals`);
  }

  async getProposalById(id: string): Promise<{ data: Proposal }> {
    return apiCore.get<{ data: Proposal }>(`${this.basePath}/${id}`);
  }

  async updateProposal(id: string, data: UpdateProposalDto): Promise<{ data: Proposal }> {
    return apiCore.put<{ data: Proposal }>(`${this.basePath}/${id}`, data);
  }

  async withdrawProposal(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  async acceptProposal(id: string): Promise<{ data: Proposal }> {
    return apiCore.post<{ data: Proposal }>(`${this.basePath}/${id}/accept`);
  }

  async rejectProposal(id: string): Promise<{ data: Proposal }> {
    return apiCore.post<{ data: Proposal }>(`${this.basePath}/${id}/reject`);
  }

  async highlightProposal(id: string): Promise<{ data: Proposal }> {
    return apiCore.patch<{ data: Proposal }>(`${this.basePath}/${id}/highlight`);
  }

  async getProposalStats(): Promise<{ data: any }> {
    return apiCore.get<{ data: any }>(`${this.basePath}/my/stats`);
  }
}

export const proposalsService = new ProposalsService();
