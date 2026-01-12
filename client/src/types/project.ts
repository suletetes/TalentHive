// Project-related types

export interface Money {
  amount: number;
  currency: string;
}

export interface UserProfile {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type BudgetType = 'fixed' | 'hourly';
export type TimelineUnit = 'days' | 'weeks' | 'months';

export interface ProjectBudget {
  type: BudgetType;
  min: number;
  max: number;
  currency: string;
}

export interface ProjectTimeline {
  duration: number;
  unit: TimelineUnit;
  startDate?: Date;
  endDate?: Date;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: ProjectBudget;
  timeline: ProjectTimeline;
  status: ProjectStatus;
  client: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  organization?: {
    _id: string;
    name: string;
    logo?: string;
    budget?: {
      total: number;
      spent: number;
      remaining: number;
    };
  };
  requirements: string[];
  attachments: string[];
  proposalCount: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
  acceptingProposals: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: BudgetType;
    min: number;
    max: number;
  };
  timeline: {
    duration: number;
    unit: TimelineUnit;
  };
  requirements: string[];
  attachments?: string[];
  organization?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: ProjectStatus;
  acceptingProposals?: boolean;
}

export interface ProjectFilters {
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: BudgetType;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isUrgent?: boolean;
  isFeatured?: boolean;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalSpent?: number;
  totalEarnings?: number;
  receivedProposals?: number;
  ongoingContracts?: number;
  rating?: {
    average: number;
    count: number;
  };
}

export interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
  skillSuggestions?: string[];
}