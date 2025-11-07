import { Types } from 'mongoose';

export interface IOrganizationMember {
  user: Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  spendingLimit?: number;
  joinedAt: Date;
}

export interface IBudgetApproval {
  _id: Types.ObjectId;
  amount: number;
  description: string;
  requestedBy: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  project?: Types.ObjectId;
  createdAt: Date;
}

export interface IOrganization {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  owner: Types.ObjectId;
  members: IOrganizationMember[];
  budgetSettings: {
    monthlyBudget?: number;
    approvalThreshold: number;
    autoApproveBelow?: number;
  };
  billingInfo: {
    companyName?: string;
    taxId?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  subscription?: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate?: Date;
  };
  settings: {
    requireApproval: boolean;
    allowMemberInvites: boolean;
    defaultSpendingLimit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
