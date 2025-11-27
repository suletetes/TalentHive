import { apiCore } from './core';

export interface ContractSignature {
  signedBy: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  signatureHash?: string;
}

export interface Contract {
  _id: string;
  project: any;
  client: any;
  freelancer: any;
  proposal: string;
  sourceType?: 'proposal' | 'hire_now' | 'service';
  title: string;
  description: string;
  totalAmount: number;
  budget?: { amount: number; type: string };
  currency: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
  milestones: Milestone[];
  terms: any;
  deliverables: any[];
  amendments: any[];
  signatures: ContractSignature[];
  progress: number;
  totalPaid: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid';
  deliverables: any[];
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  clientFeedback?: string;
  freelancerNotes?: string;
}

export class ContractsService {
  private basePath = '/contracts';

  async getMyContracts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/my?${queryParams.toString()}`);
  }

  async getContractById(id: string) {
    return apiCore.get(`${this.basePath}/${id}`);
  }

  async signContract(id: string, data: { ipAddress: string; userAgent: string }) {
    return apiCore.post(`${this.basePath}/${id}/sign`, data);
  }

  async submitMilestone(
    contractId: string,
    milestoneId: string,
    data: { deliverables: any[]; freelancerNotes?: string }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/milestones/${milestoneId}/submit`, data);
  }

  async approveMilestone(
    contractId: string,
    milestoneId: string,
    data: { clientFeedback?: string }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/milestones/${milestoneId}/approve`, data);
  }

  async rejectMilestone(
    contractId: string,
    milestoneId: string,
    data: { clientFeedback: string }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/milestones/${milestoneId}/reject`, data);
  }

  async releasePayment(contractId: string, milestoneId: string) {
    return apiCore.post(`${this.basePath}/${contractId}/milestones/${milestoneId}/release-payment`, {});
  }

  async proposeAmendment(
    contractId: string,
    data: {
      type: string;
      description: string;
      changes: any;
      reason: string;
    }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/amendments`, data);
  }

  async respondToAmendment(
    contractId: string,
    amendmentId: string,
    data: { status: 'accepted' | 'rejected'; responseNotes?: string }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/amendments/${amendmentId}/respond`, data);
  }

  async cancelContract(contractId: string, data: { reason: string }) {
    return apiCore.post(`${this.basePath}/${contractId}/cancel`, data);
  }

  async pauseContract(contractId: string, data: { reason?: string }) {
    return apiCore.post(`${this.basePath}/${contractId}/pause`, data);
  }

  async resumeContract(contractId: string) {
    return apiCore.post(`${this.basePath}/${contractId}/resume`, {});
  }

  async createDispute(
    contractId: string,
    data: {
      reason: string;
      description: string;
      evidence?: string;
    }
  ) {
    return apiCore.post(`${this.basePath}/${contractId}/dispute`, data);
  }
}

export const contractsService = new ContractsService();
