import { apiCore } from './core';
import { dataExtractor, extractProposals, extractProposal, COMMON_PATHS } from '@/utils/dataExtractor';

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
  bidAmount: number; // Primary field
  proposedBudget?: { // Legacy support
    amount: number;
    type: 'hourly' | 'fixed';
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
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProposalDto {
  coverLetter: string;
  bidAmount: number; // Primary field
  proposedBudget?: { // Legacy support
    amount: number;
    type: 'hourly' | 'fixed';
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

  async getProposals(filters?: any): Promise<{ data: Proposal[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    const response = await apiCore.get<any>(url);
    const proposals = extractProposals<Proposal>(response);
    return { data: proposals };
  }

  async createProposal(
    projectId: string,
    data: CreateProposalDto
  ): Promise<{ data: Proposal }> {
    const response = await apiCore.post<any>(`${this.basePath}/project/${projectId}`, data);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async getProposalsForProject(projectId: string): Promise<{ data: Proposal[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/project/${projectId}`);
    const proposals = extractProposals<Proposal>(response);
    return { data: proposals };
  }

  async getMyProposals(): Promise<{ data: Proposal[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/my`);
    // Try multiple extraction paths for my proposals
    const proposals = dataExtractor.extractArray<Proposal>(response, [
      'proposals', 'data.proposals', 'data', 'data.data', 'data.data.proposals'
    ]);
    return { data: proposals };
  }

  async getProposalById(id: string): Promise<{ data: Proposal }> {
    const response = await apiCore.get<any>(`${this.basePath}/${id}`);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async updateProposal(id: string, data: UpdateProposalDto): Promise<{ data: Proposal }> {
    const response = await apiCore.put<any>(`${this.basePath}/${id}`, data);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async withdrawProposal(id: string): Promise<{ message: string }> {
    return apiCore.patch<{ message: string }>(`${this.basePath}/${id}/withdraw`);
  }

  async acceptProposal(id: string): Promise<{ data: Proposal }> {
    const response = await apiCore.post<any>(`${this.basePath}/${id}/accept`);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async rejectProposal(id: string): Promise<{ data: Proposal }> {
    const response = await apiCore.post<any>(`${this.basePath}/${id}/reject`);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async highlightProposal(id: string): Promise<{ data: Proposal }> {
    const response = await apiCore.patch<any>(`${this.basePath}/${id}/highlight`);
    const proposal = extractProposal<Proposal>(response);
    return { data: proposal! };
  }

  async getProposalStats(): Promise<{ data: any }> {
    return apiCore.get<{ data: any }>(`${this.basePath}/stats`);
  }

  async deleteProposal(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}/delete`);
  }
}

export const proposalsService = new ProposalsService();
