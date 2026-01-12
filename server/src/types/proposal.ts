import { Document, ObjectId } from 'mongoose';

export interface IProposal extends Document {
  project: ObjectId;
  freelancer: ObjectId;
  coverLetter: string;
  bidAmount: number;
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  attachments: string[];
  milestones: IMilestone[];
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  clientFeedback?: string;
  isHighlighted: boolean;
  submittedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isExpired(): boolean;
  canBeModified(): boolean;
  canBeWithdrawn(): boolean;
  withdraw(): Promise<IProposal>;
  accept(feedback?: string): Promise<IProposal>;
  reject(feedback?: string): Promise<IProposal>;
}

export interface IMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  deliverables: string[];
}