import { Document, ObjectId } from 'mongoose';

export interface ITimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface IWeeklySchedule {
  monday: ITimeSlot[];
  tuesday: ITimeSlot[];
  wednesday: ITimeSlot[];
  thursday: ITimeSlot[];
  friday: ITimeSlot[];
  saturday: ITimeSlot[];
  sunday: ITimeSlot[];
}

export interface IAvailabilitySlot {
  date: Date;
  isAvailable: boolean;
  note?: string;
}

export interface IServicePackage {
  _id: ObjectId;
  title: string;
  description: string;
  price: number;
  deliveryTime: number; // days
  revisions: number;
  features: string[];
  isActive: boolean;
}

export interface ITeamMember {
  userId: ObjectId;
  role: string;
  skills: string[];
  hourlyRate?: number;
}

export interface ICertification {
  name: string;
  issuer: string;
  dateEarned: Date;
  expiryDate?: Date;
  verificationUrl?: string;
}

export interface IPortfolioItem {
  _id: ObjectId;
  title: string;
  description: string;
  images: string[];
  projectUrl?: string;
  technologies: string[];
  completedAt: Date;
}

export interface IBudgetRange {
  type: 'fixed' | 'hourly';
  min: number;
  max: number;
}

export interface ITimeline {
  duration: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface IProjectTemplate {
  _id: ObjectId;
  name: string;
  description: string;
  category: string;
  skills: string[];
  budget: IBudgetRange;
  timeline: ITimeline;
  requirements: string[];
  attachments: string[];
}

export interface IAdminPermission {
  resource: string;
  actions: string[];
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'freelancer' | 'client';
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    location?: string;
    timezone?: string;
  };
  freelancerProfile?: {
    title: string;
    hourlyRate: number;
    skillRates: { skill: string; rate: number }[];
    skills: string[];
    experience: string;
    portfolio: IPortfolioItem[];
    availability: {
      status: 'available' | 'busy' | 'unavailable';
      schedule: IWeeklySchedule;
      calendar: IAvailabilitySlot[];
    };
    servicePackages: IServicePackage[];
    teamMembers?: ITeamMember[];
    certifications: ICertification[];
    timeTracking: {
      isEnabled: boolean;
      screenshotFrequency?: number; // minutes
      activityMonitoring?: boolean;
    };
  };
  clientProfile?: {
    companyName?: string;
    industry?: string;
    projectsPosted: number;
    organizationId?: ObjectId;
    teamRole?: 'owner' | 'admin' | 'member';
    budgetLimits?: {
      daily?: number;
      monthly?: number;
      requiresApproval?: boolean;
    };
    preferredVendors: ObjectId[];
    projectTemplates: IProjectTemplate[];
  };
  adminProfile?: {
    permissions: IAdminPermission[];
    lastLoginAt: Date;
    accessLevel: 'super_admin' | 'moderator' | 'support';
  };
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  isActive: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}