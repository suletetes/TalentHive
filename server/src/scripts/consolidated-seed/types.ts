// Core types and interfaces for the consolidated seeding system

export type Environment = 'development' | 'testing' | 'demo';
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ProjectComplexity = 'simple' | 'moderate' | 'complex' | 'enterprise';
export type ProposalStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

// Logger interface
export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

// Seeding configuration
export interface SeedingConfig extends SeedConfiguration {
  // Additional properties for seeding configuration
}

// Configuration interfaces
export interface SeedConfiguration {
  environment: Environment;
  userCounts: UserCountConfig;
  projectCounts: ProjectCountConfig;
  enableModules: string[];
  batchSize: number;
  skipExisting: boolean;
}

export interface UserCountConfig {
  admins: number;
  clients: number;
  freelancers: number;
}

export interface ProjectCountConfig {
  draft: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

// Result and progress interfaces
export interface SeedResult {
  success: boolean;
  summary: EntityCounts;
  duration: number;
  errors: SeedError[];
}

export interface EntityCounts {
  users: number;
  projects: number;
  proposals: number;
  contracts: number;
  reviews: number;
  organizations: number;
  categories: number;
  skills: number;
}

export interface SeedProgress {
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  entitiesProcessed: number;
  estimatedTimeRemaining?: number;
}

export interface SeedError {
  step: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Data generation interfaces
export interface GenerationContext {
  existingData: Map<string, any[]>;
  configuration: SeedConfiguration;
  dependencies: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Data structures
export interface UserData {
  email: string;
  password: string;
  role: 'freelancer' | 'client' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    slug: string;
    bio: string;
    location: string;
    timezone?: string;
    avatar?: string;
    website?: string;
  };
  freelancerProfile?: FreelancerProfileData;
  rating: { average: number; count: number };
  isVerified: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
}

export interface FreelancerProfileData {
  title: string;
  hourlyRate: number;
  skills: string[];
  experience: string;
  availability: AvailabilityData;
  portfolio: PortfolioItem[];
  certifications: Certification[];
  workExperience: WorkExperience[];
  education: Education[];
  languages: Language[];
}

export interface AvailabilityData {
  status: 'available' | 'busy' | 'unavailable';
  hoursPerWeek?: number;
  timezone?: string;
  workingHours?: {
    start: string;
    end: string;
  };
}

export interface PortfolioItem {
  title: string;
  description: string;
  technologies: string[];
  completedAt: Date;
  metrics?: {
    performanceImprovement?: number;
    userEngagement?: number;
    loadTimeReduction?: number;
  };
  clientFeedback?: string;
  images: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  dateEarned: Date;
  credentialId?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date;
  description?: string;
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface ProjectData {
  title: string;
  description: string;
  category: any; // ObjectId
  budget: BudgetData;
  timeline: TimelineData;
  skills: any[]; // ObjectId[]
  requirements: string[];
  client: any; // ObjectId
  status: ProjectStatus;
  isDraft?: boolean;
  draftSavedAt?: Date;
  complexity: ProjectComplexity;
  estimatedHours: number;
  industryType?: string;
  specialRequirements?: string[];
}

export interface BudgetData {
  type: 'fixed' | 'hourly';
  min: number;
  max: number;
  currency: string;
}

export interface TimelineData {
  duration: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface ProposalData {
  project: any; // ObjectId
  freelancer: any; // ObjectId
  coverLetter: string;
  bidAmount: number;
  timeline: TimelineData;
  milestones: MilestoneData[];
  status: ProposalStatus;
}

export interface MilestoneData {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface ContractData {
  proposal: any; // ObjectId
  client: any; // ObjectId
  freelancer: any; // ObjectId
  project: any; // ObjectId
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  startDate: Date;
  endDate?: Date;
  totalAmount: number;
  milestones: ContractMilestone[];
  terms: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
  approvedAt?: Date;
}

// Market data interfaces
export interface MarketDataProvider {
  getHourlyRates(category: string, level: ExperienceLevel, location: string): number;
  getBudgetRange(complexity: ProjectComplexity, skills: string[]): BudgetRange;
  getSeasonalTrends(month: number): number;
  getSkillCombinations(title: string): SkillSet;
}

export interface BudgetRange {
  min: number;
  max: number;
  type: 'fixed' | 'hourly';
}

export interface SkillSet {
  core: string[];
  additional: string[];
  specialized: string[];
}

// Slug generation interfaces
export interface SlugGenerator {
  generateUserSlug(firstName: string, lastName: string): Promise<string>;
  ensureUniqueness(baseSlug: string, existingSlugs: Set<string>): string;
  validateSlugFormat(slug: string): boolean;
  reserveSlug(slug: string): Promise<boolean>;
}

export interface SlugReservation {
  slug: string;
  reservedAt: Date;
  expiresAt: Date;
  userId?: string;
}

// Data generator interfaces
export interface DataGenerator<T> {
  generate(count: number, context: GenerationContext): Promise<T[]>;
  validate(data: T[]): ValidationResult;
  getDependencies(): string[];
}

export interface UserGenerator extends DataGenerator<UserData> {
  generateFreelancers(count: number, context: GenerationContext): Promise<UserData[]>;
  generateClients(count: number, context: GenerationContext): Promise<UserData[]>;
  generateAdmins(count: number, context: GenerationContext): Promise<UserData[]>;
}

export interface ProjectGenerator extends DataGenerator<ProjectData> {
  generateByCategory(category: string, count: number, context: GenerationContext): Promise<ProjectData[]>;
  generateByStatus(status: ProjectStatus, count: number, context: GenerationContext): Promise<ProjectData[]>;
}