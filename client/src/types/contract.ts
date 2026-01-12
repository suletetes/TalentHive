// Contract-related types

import { Project } from './project';
import { Proposal } from './proposal';
import { UserProfile } from './user';

export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type ContractSourceType = 'proposal' | 'hire_now' | 'service';

export interface ContractSignature {
  signedBy: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  signatureHash?: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  deliverables: Deliverable[];
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  clientFeedback?: string;
  freelancerNotes?: string;
}

export interface Deliverable {
  _id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  submittedAt: string;
}

export interface Contract {
  _id: string;
  project: Project | string;
  client: UserProfile | string;
  freelancer: UserProfile | string;
  proposal: Proposal | string;
  sourceType?: ContractSourceType;
  title: string;
  description: string;
  totalAmount: number;
  budget?: { 
    amount: number; 
    type: string; 
  };
  currency: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  milestones: Milestone[];
  terms: ContractTerms;
  deliverables: Deliverable[];
  amendments: ContractAmendment[];
  signatures: ContractSignature[];
  progress: number;
  totalPaid: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTerms {
  paymentTerms: string;
  deliveryTerms: string;
  revisionPolicy: string;
  cancellationPolicy: string;
  intellectualPropertyRights: string;
  confidentialityClause: string;
}

export interface ContractAmendment {
  _id: string;
  type: string;
  description: string;
  changes: Record<string, any>;
  reason: string;
  proposedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  proposedAt: string;
  respondedAt?: string;
  responseNotes?: string;
}

export interface CreateContractDto {
  projectId: string;
  proposalId: string;
  freelancerId: string;
  title: string;
  description: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  milestones: Omit<Milestone, '_id' | 'status' | 'deliverables'>[];
  terms: ContractTerms;
}

export interface UpdateContractDto extends Partial<CreateContractDto> {
  status?: ContractStatus;
}

export interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
  freelancerId?: string;
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubmitMilestoneDto {
  deliverables: Omit<Deliverable, '_id' | 'submittedAt'>[];
  freelancerNotes?: string;
}

export interface MilestoneResponseDto {
  clientFeedback?: string;
}

export interface ContractAmendmentDto {
  type: string;
  description: string;
  changes: Record<string, any>;
  reason: string;
}

export interface AmendmentResponseDto {
  status: 'accepted' | 'rejected';
  responseNotes?: string;
}