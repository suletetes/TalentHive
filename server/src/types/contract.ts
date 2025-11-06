import { Document, ObjectId } from 'mongoose';

export interface IContract extends Document {
  project: ObjectId;
  client: ObjectId;
  freelancer: ObjectId;
  proposal: ObjectId;
  title: string;
  description: string;
  totalAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'disputed';
  milestones: IMilestone[];
  terms: IContractTerms;
  deliverables: IDeliverable[];
  amendments: IAmendment[];
  signatures: ISignature[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilestone extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid';
  deliverables: ObjectId[];
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  paidAt?: Date;
  clientFeedback?: string;
  freelancerNotes?: string;
}

export interface IDeliverable extends Document {
  _id: ObjectId;
  milestone: ObjectId;
  title: string;
  description: string;
  type: 'file' | 'link' | 'text' | 'code';
  content: string; // File URL, link, or text content
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  clientFeedback?: string;
  metadata?: {
    fileSize?: number;
    fileType?: string;
    originalName?: string;
  };
}

export interface IContractTerms {
  paymentTerms: string;
  cancellationPolicy: string;
  intellectualProperty: string;
  confidentiality: string;
  disputeResolution: string;
  additionalTerms?: string;
}

export interface IAmendment extends Document {
  _id: ObjectId;
  type: 'milestone_change' | 'timeline_change' | 'amount_change' | 'scope_change' | 'terms_change';
  description: string;
  proposedBy: ObjectId;
  proposedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  changes: any; // Flexible object for different types of changes
  reason: string;
  respondedAt?: Date;
  respondedBy?: ObjectId;
  responseNotes?: string;
}

export interface ISignature extends Document {
  _id: ObjectId;
  signedBy: ObjectId;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  signatureHash: string;
}

export interface IContractAnalytics {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalValue: number;
  averageProjectDuration: number;
  onTimeCompletionRate: number;
  clientSatisfactionRate: number;
}