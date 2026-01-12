import { Types } from 'mongoose';

export interface IServicePackage {
  _id: Types.ObjectId;
  freelancer: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'custom';
    amount?: number;
    hourlyRate?: number;
    tiers?: {
      name: string;
      price: number;
      deliveryTime: number;
      features: string[];
    }[];
  };
  deliveryTime: number; // in days
  revisions: number;
  features: string[];
  requirements: string[];
  skills: string[];
  portfolio: string[];
  isActive: boolean;
  views: number;
  orders: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectTemplate {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  organization?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
  };
  duration: number;
  skills: string[];
  requirements: string[];
  deliverables: string[];
  milestones?: {
    title: string;
    description: string;
    durationDays: number;
    percentage: number;
  }[];
  preferredVendors: Types.ObjectId[];
  isRecurring: boolean;
  recurringSchedule?: {
    frequency: 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    autoPost: boolean;
  };
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPreferredVendor {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  freelancer: Types.ObjectId;
  category?: string;
  rating: number;
  totalProjects: number;
  totalSpent: number;
  notes?: string;
  isPriority: boolean;
  createdAt: Date;
  updatedAt: Date;
}
