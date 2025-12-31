// Proposal-related types

import { Project } from './project';
import { Freelancer } from './user';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Proposal {
  _id: string;
  project: Project | string;
  freelancer: Freelancer | string;
  coverLetter: string;
  proposedBudget: {
    amount: number;
    currency: string;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones: ProposalMilestone[];
  attachments: string[];
  status: ProposalStatus;
  submittedAt: Date;
  respondedAt?: Date;
  clientFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}

export interface CreateProposalDto {
  projectId: string;
  coverLetter: string;
  proposedBudget: {
    amount: number;
    currency: string;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones: Omit<ProposalMilestone, 'dueDate'> & { dueDate: string }[];
  attachments?: string[];
}

export interface UpdateProposalDto extends Partial<CreateProposalDto> {
  status?: ProposalStatus;
  clientFeedback?: string;
}

export interface ProposalFilters {
  status?: ProposalStatus;
  projectId?: string;
  freelancerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalStats {
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  averageResponseTime?: number;
}