import { Document, ObjectId } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface IOrganizationMember {
  userId: ObjectId;
  role: 'admin' | 'project_manager' | 'member';
  permissions: string[];
  joinedAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  industry: string;
  owner: ObjectId;
  members: IOrganizationMember[];
  settings: {
    budgetApprovalThreshold: number;
    requiresApprovalWorkflow: boolean;
    defaultProjectVisibility: 'public' | 'private';
  };
  billing: {
    paymentMethods: string[];
    billingAddress: IAddress;
    taxId?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}