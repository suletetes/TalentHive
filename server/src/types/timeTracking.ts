import { Types } from 'mongoose';

export interface ITimeEntry {
  _id: Types.ObjectId;
  freelancer: Types.ObjectId;
  project: Types.ObjectId;
  contract: Types.ObjectId;
  milestone?: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description: string;
  activityLevel?: number; // 0-100
  screenshots?: string[];
  status: 'active' | 'paused' | 'stopped' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  reviewNotes?: string;
  billableAmount?: number;
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkSession {
  _id: Types.ObjectId;
  freelancer: Types.ObjectId;
  project: Types.ObjectId;
  contract: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  totalDuration: number; // in seconds
  timeEntries: Types.ObjectId[];
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeReport {
  freelancer: Types.ObjectId;
  project?: Types.ObjectId;
  contract?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  totalAmount: number;
  entries: ITimeEntry[];
}

export interface IActivitySnapshot {
  _id: Types.ObjectId;
  timeEntry: Types.ObjectId;
  timestamp: Date;
  activityLevel: number;
  screenshot?: string;
  mouseClicks?: number;
  keystrokes?: number;
  activeWindow?: string;
}
