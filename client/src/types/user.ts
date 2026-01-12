// User-related types

export type UserRole = 'admin' | 'freelancer' | 'client';

export interface Rating {
  average: number;
  count: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  role: UserRole;
  isVerified: boolean;
  profileSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfile {
  title: string;
  hourlyRate: number;
  skills: string[];
  skillRates: SkillRate[];
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    hoursPerWeek?: number;
  };
  portfolio: PortfolioItem[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  rating: Rating;
  totalEarnings: number;
  completedProjects: number;
}

export interface ClientProfile {
  companyName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  totalSpent: number;
  projectsPosted: number;
  rating: Rating;
}

export interface SkillRate {
  skill: string;
  rate: number;
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description: string;
  images: string[];
  url?: string;
  technologies: string[];
  category: string;
  createdAt: string;
}

export interface WorkExperience {
  _id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
}

export interface Education {
  _id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Certification {
  _id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  _id: string;
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface Freelancer extends UserProfile {
  freelancerProfile: FreelancerProfile;
}

export interface Client extends UserProfile {
  clientProfile: ClientProfile;
}

export interface FreelancerFilters {
  skills?: string[];
  minRating?: number;
  maxRate?: number;
  availability?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface UserStats {
  profileViews: number;
  profileViewsThisMonth: number;
  searchAppearances: number;
  searchAppearancesThisMonth: number;
}