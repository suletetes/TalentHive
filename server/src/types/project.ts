import { Document, ObjectId } from 'mongoose';

export interface IBudget {
  type: 'fixed' | 'hourly';
  min: number;
  max: number;
}

export interface ITimeline {
  duration: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface IProject extends Document {
  title: string;
  description: string;
  client: ObjectId;
  category: string;
  skills: string[];
  budget: IBudget;
  timeline: ITimeline;
  attachments: string[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  visibility: 'public' | 'invite_only';
  proposals: ObjectId[];
  selectedFreelancer?: ObjectId;
  tags: string[];
  requirements: string[];
  deliverables: string[];
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  viewCount: number;
  isUrgent: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementViewCount(): Promise<IProject>;
  isExpired(): boolean;
}

export interface IProjectModel {
  findActive(): any;
  searchProjects(query: string): any;
}