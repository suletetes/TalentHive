import { logger } from '@/utils/logger';
import { ValidationResult, UserData, ProjectData } from './types';
import { ProposalData } from './RelationshipGenerator';
import { ContractData } from './ContractGenerator';
import { ReviewData } from './ReviewGenerator';

/**
 * Validation rule interface
 */
export interface ValidationRule<T> {
  name: string;
  description: string;
  validate: (data: T) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  category: string;
}

/**
 * Validation context for cross-entity validation
 */
export interface ValidationContext {
  users: UserData[];
  projects: ProjectData[];
  proposals: ProposalData[];
  contracts: ContractData[];
  reviews: ReviewData[];
  [key: string]: any[];
}

/**
 * Validation report
 */
export interface ValidationReport {
  entityType: string;
  totalEntities: number;
  validEntities: number;
  invalidEntities: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  validationTime: number;
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  entityIndex: number;
  entityId?: string;
  ruleName: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  context?: any;
}

/**
 * Comprehensive data validator with application-specific rules
 */
export class DataValidator {
  private userRules: ValidationRule<UserData>[] = [];
  private projectRules: ValidationRule<ProjectData>[] = [];
  private proposalRules: ValidationRule<ProposalData>[] = [];
  private contractRules: ValidationRule<ContractData>[] = [];
  private reviewRules: ValidationRule<ReviewData>[] = [];

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Validate user data with comprehensive rules
   */
  async validateUsers(users: UserData[]): Promise<ValidationReport> {
    const startTime = Date.now();
    logger.info(` Validating ${users.length} users...`);

    const issues: ValidationIssue[] = [];
    let validCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userIssues = this.validateEntity(user, this.userRules, i);
      issues.push(...userIssues);

      if (userIssues.filter(issue => issue.severity === 'error').length === 0) {
        validCount++;
      }
    }

    // Cross-validation checks
    const crossValidationIssues = this.validateUserCrossReferences(users);
    issues.push(...crossValidationIssues);

    const validationTime = Date.now() - startTime;
    logger.info(` User validation completed in ${validationTime}ms`);

    return this.createValidationReport('users', users.length, validCount, issues, validationTime);
  }

  /**
   * Validate project data
   */
  async validateProjects(projects: ProjectData[], context?: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    logger.info(` Validating ${projects.length} projects...`);

    const issues: ValidationIssue[] = [];
    let validCount = 0;

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const projectIssues = this.validateEntity(project, this.projectRules, i);
      issues.push(...projectIssues);

      if (projectIssues.filter(issue => issue.severity === 'error').length === 0) {
        validCount++;
      }
    }

    // Cross-validation with context if provided
    if (context) {
      const crossValidationIssues = this.validateProjectCrossReferences(projects, context);
      issues.push(...crossValidationIssues);
    }

    const validationTime = Date.now() - startTime;
    logger.info(` Project validation completed in ${validationTime}ms`);

    return this.createValidationReport('projects', projects.length, validCount, issues, validationTime);
  }

  /**
   * Validate proposal data
   */
  async validateProposals(proposals: ProposalData[], context?: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    logger.info(` Validating ${proposals.length} proposals...`);

    const issues: ValidationIssue[] = [];
    let validCount = 0;

    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      const proposalIssues = this.validateEntity(proposal, this.proposalRules, i);
      issues.push(...proposalIssues);

      if (proposalIssues.filter(issue => issue.severity === 'error').length === 0) {
        validCount++;
      }
    }

    // Cross-validation
    if (context) {
      const crossValidationIssues = this.validateProposalCrossReferences(proposals, context);
      issues.push(...crossValidationIssues);
    }

    const validationTime = Date.now() - startTime;
    logger.info(` Proposal validation completed in ${validationTime}ms`);

    return this.createValidationReport('proposals', proposals.length, validCount, issues, validationTime);
  }

  /**
   * Validate contract data
   */
  async validateContracts(contracts: ContractData[], context?: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    logger.info(` Validating ${contracts.length} contracts...`);

    const issues: ValidationIssue[] = [];
    let validCount = 0;

    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      const contractIssues = this.validateEntity(contract, this.contractRules, i);
      issues.push(...contractIssues);

      if (contractIssues.filter(issue => issue.severity === 'error').length === 0) {
        validCount++;
      }
    }

    // Cross-validation
    if (context) {
      const crossValidationIssues = this.validateContractCrossReferences(contracts, context);
      issues.push(...crossValidationIssues);
    }

    const validationTime = Date.now() - startTime;
    logger.info(` Contract validation completed in ${validationTime}ms`);

    return this.createValidationReport('contracts', contracts.length, validCount, issues, validationTime);
  }

  /**
   * Validate review data
   */
  async validateReviews(reviews: ReviewData[], context?: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    logger.info(` Validating ${reviews.length} reviews...`);

    const issues: ValidationIssue[] = [];
    let validCount = 0;

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const reviewIssues = this.validateEntity(review, this.reviewRules, i);
      issues.push(...reviewIssues);

      if (reviewIssues.filter(issue => issue.severity === 'error').length === 0) {
        validCount++;
      }
    }

    // Cross-validation
    if (context) {
      const crossValidationIssues = this.validateReviewCrossReferences(reviews, context);
      issues.push(...crossValidationIssues);
    }

    const validationTime = Date.now() - startTime;
    logger.info(` Review validation completed in ${validationTime}ms`);

    return this.createValidationReport('reviews', reviews.length, validCount, issues, validationTime);
  }

  /**
   * Validate all entities in context
   */
  async validateAll(context: ValidationContext): Promise<ValidationReport[]> {
    logger.info(' Starting comprehensive validation of all entities...');
    
    const reports: ValidationReport[] = [];

    // Validate each entity type
    if (context.users?.length > 0) {
      reports.push(await this.validateUsers(context.users));
    }

    if (context.projects?.length > 0) {
      reports.push(await this.validateProjects(context.projects, context));
    }

    if (context.proposals?.length > 0) {
      reports.push(await this.validateProposals(context.proposals, context));
    }

    if (context.contracts?.length > 0) {
      reports.push(await this.validateContracts(context.contracts, context));
    }

    if (context.reviews?.length > 0) {
      reports.push(await this.validateReviews(context.reviews, context));
    }

    logger.info(' Comprehensive validation completed');
    return reports;
  }

  /**
   * Generate comprehensive validation summary
   */
  generateValidationSummary(reports: ValidationReport[]): string {
    let summary = '\n Validation Summary\n';
    summary += '='.repeat(50) + '\n\n';

    let totalEntities = 0;
    let totalValid = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const report of reports) {
      totalEntities += report.totalEntities;
      totalValid += report.validEntities;
      totalErrors += report.errors.length;
      totalWarnings += report.warnings.length;

      summary += `${report.entityType.toUpperCase()}:\n`;
      summary += `  Total: ${report.totalEntities}\n`;
      summary += `  Valid: ${report.validEntities}\n`;
      summary += `  Invalid: ${report.invalidEntities}\n`;
      summary += `  Errors: ${report.errors.length}\n`;
      summary += `  Warnings: ${report.warnings.length}\n`;
      summary += `  Validation Time: ${report.validationTime}ms\n\n`;
    }

    summary += `OVERALL:\n`;
    summary += `  Total Entities: ${totalEntities}\n`;
    summary += `  Valid Entities: ${totalValid}\n`;
    summary += `  Success Rate: ${totalEntities > 0 ? ((totalValid / totalEntities) * 100).toFixed(1) : 0}%\n`;
    summary += `  Total Errors: ${totalErrors}\n`;
    summary += `  Total Warnings: ${totalWarnings}\n`;

    return summary;
  }

  /**
   * Initialize validation rules for all entity types
   */
  private initializeValidationRules(): void {
    this.initializeUserRules();
    this.initializeProjectRules();
    this.initializeProposalRules();
    this.initializeContractRules();
    this.initializeReviewRules();
  }

  /**
   * Initialize user validation rules
   */
  private initializeUserRules(): void {
    // Email validation
    this.userRules.push({
      name: 'email_format',
      description: 'Email must be in valid format',
      severity: 'error',
      category: 'format',
      validate: (user) => ({
        isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email),
        errors: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ? [] : ['Invalid email format'],
        warnings: []
      })
    });

    // Password validation
    this.userRules.push({
      name: 'password_required',
      description: 'Password is required',
      severity: 'error',
      category: 'required',
      validate: (user) => ({
        isValid: !!user.password && user.password.length > 0,
        errors: !!user.password && user.password.length > 0 ? [] : ['Password is required'],
        warnings: []
      })
    });

    // Profile validation
    this.userRules.push({
      name: 'profile_completeness',
      description: 'Profile must have required fields',
      severity: 'error',
      category: 'required',
      validate: (user) => {
        const errors: string[] = [];
        if (!user.profile.firstName) errors.push('First name is required');
        if (!user.profile.lastName) errors.push('Last name is required');
        if (!user.profile.slug) errors.push('Slug is required');
        if (!user.profile.bio) errors.push('Bio is required');
        if (!user.profile.location) errors.push('Location is required');

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Freelancer profile validation
    this.userRules.push({
      name: 'freelancer_profile',
      description: 'Freelancers must have complete profiles',
      severity: 'error',
      category: 'business_logic',
      validate: (user) => {
        if (user.role !== 'freelancer') {
          return { isValid: true, errors: [], warnings: [] };
        }

        const errors: string[] = [];
        if (!user.freelancerProfile) {
          errors.push('Freelancer profile is required');
        } else {
          if (!user.freelancerProfile.title) errors.push('Freelancer title is required');
          if (!user.freelancerProfile.hourlyRate || user.freelancerProfile.hourlyRate <= 0) {
            errors.push('Valid hourly rate is required');
          }
          if (!user.freelancerProfile.skills || user.freelancerProfile.skills.length === 0) {
            errors.push('At least one skill is required');
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Slug format validation
    this.userRules.push({
      name: 'slug_format',
      description: 'Slug must be URL-friendly',
      severity: 'error',
      category: 'format',
      validate: (user) => {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return {
          isValid: slugRegex.test(user.profile.slug),
          errors: slugRegex.test(user.profile.slug) ? [] : ['Slug must be lowercase, alphanumeric with hyphens'],
          warnings: []
        };
      }
    });
  }

  /**
   * Initialize project validation rules
   */
  private initializeProjectRules(): void {
    // Required fields
    this.projectRules.push({
      name: 'project_required_fields',
      description: 'Project must have all required fields',
      severity: 'error',
      category: 'required',
      validate: (project) => {
        const errors: string[] = [];
        if (!project.title) errors.push('Title is required');
        if (!project.description) errors.push('Description is required');
        if (!project.budget) errors.push('Budget is required');
        if (!project.timeline) errors.push('Timeline is required');
        if (!project.status) errors.push('Status is required');

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Budget validation
    this.projectRules.push({
      name: 'budget_validation',
      description: 'Budget must be valid',
      severity: 'error',
      category: 'business_logic',
      validate: (project) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (project.budget) {
          if (project.budget.min <= 0) errors.push('Budget minimum must be positive');
          if (project.budget.max <= 0) errors.push('Budget maximum must be positive');
          if (project.budget.min > project.budget.max) errors.push('Budget minimum cannot exceed maximum');
          
          if (project.budget.max > 100000) warnings.push('Budget seems very high');
          if (project.budget.min < 50) warnings.push('Budget seems very low');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
    });

    // Timeline validation
    this.projectRules.push({
      name: 'timeline_validation',
      description: 'Timeline must be realistic',
      severity: 'warning',
      category: 'business_logic',
      validate: (project) => {
        const warnings: string[] = [];

        if (project.timeline) {
          const { duration, unit } = project.timeline;
          
          if (unit === 'days' && duration > 365) {
            warnings.push('Timeline seems very long (over 1 year)');
          }
          if (unit === 'weeks' && duration > 52) {
            warnings.push('Timeline seems very long (over 1 year)');
          }
          if (unit === 'months' && duration > 12) {
            warnings.push('Timeline seems very long (over 1 year)');
          }
          
          if (duration < 1) {
            warnings.push('Timeline seems too short');
          }
        }

        return {
          isValid: true,
          errors: [],
          warnings
        };
      }
    });
  }

  /**
   * Initialize proposal validation rules
   */
  private initializeProposalRules(): void {
    // Required fields
    this.proposalRules.push({
      name: 'proposal_required_fields',
      description: 'Proposal must have all required fields',
      severity: 'error',
      category: 'required',
      validate: (proposal) => {
        const errors: string[] = [];
        if (!proposal.project) errors.push('Project reference is required');
        if (!proposal.freelancer) errors.push('Freelancer reference is required');
        if (!proposal.coverLetter) errors.push('Cover letter is required');
        if (!proposal.bidAmount || proposal.bidAmount <= 0) errors.push('Valid bid amount is required');
        if (!proposal.timeline) errors.push('Timeline is required');

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Cover letter quality
    this.proposalRules.push({
      name: 'cover_letter_quality',
      description: 'Cover letter should be meaningful',
      severity: 'warning',
      category: 'quality',
      validate: (proposal) => {
        const warnings: string[] = [];
        
        if (proposal.coverLetter) {
          if (proposal.coverLetter.length < 50) {
            warnings.push('Cover letter seems too short');
          }
          if (proposal.coverLetter.length > 2000) {
            warnings.push('Cover letter seems too long');
          }
        }

        return {
          isValid: true,
          errors: [],
          warnings
        };
      }
    });
  }

  /**
   * Initialize contract validation rules
   */
  private initializeContractRules(): void {
    // Required fields
    this.contractRules.push({
      name: 'contract_required_fields',
      description: 'Contract must have all required fields',
      severity: 'error',
      category: 'required',
      validate: (contract) => {
        const errors: string[] = [];
        if (!contract.proposal) errors.push('Proposal reference is required');
        if (!contract.client) errors.push('Client reference is required');
        if (!contract.freelancer) errors.push('Freelancer reference is required');
        if (!contract.startDate) errors.push('Start date is required');
        if (!contract.totalAmount || contract.totalAmount <= 0) errors.push('Valid total amount is required');

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Date consistency
    this.contractRules.push({
      name: 'date_consistency',
      description: 'Contract dates must be consistent',
      severity: 'error',
      category: 'business_logic',
      validate: (contract) => {
        const errors: string[] = [];
        
        if (contract.endDate && contract.startDate && contract.endDate < contract.startDate) {
          errors.push('End date cannot be before start date');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });
  }

  /**
   * Initialize review validation rules
   */
  private initializeReviewRules(): void {
    // Required fields
    this.reviewRules.push({
      name: 'review_required_fields',
      description: 'Review must have all required fields',
      severity: 'error',
      category: 'required',
      validate: (review) => {
        const errors: string[] = [];
        if (!review.contract) errors.push('Contract reference is required');
        if (!review.reviewer) errors.push('Reviewer reference is required');
        if (!review.reviewee) errors.push('Reviewee reference is required');
        if (!review.rating || review.rating < 1 || review.rating > 5) {
          errors.push('Rating must be between 1 and 5');
        }
        if (!review.comment) errors.push('Comment is required');

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Review quality
    this.reviewRules.push({
      name: 'review_quality',
      description: 'Review should be meaningful',
      severity: 'warning',
      category: 'quality',
      validate: (review) => {
        const warnings: string[] = [];
        
        if (review.comment && review.comment.length < 20) {
          warnings.push('Review comment seems too short');
        }

        return {
          isValid: true,
          errors: [],
          warnings
        };
      }
    });
  }

  /**
   * Validate a single entity against its rules
   */
  private validateEntity<T>(
    entity: T,
    rules: ValidationRule<T>[],
    index: number
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const rule of rules) {
      try {
        const result = rule.validate(entity);
        
        // Add errors
        for (const error of result.errors) {
          issues.push({
            entityIndex: index,
            ruleName: rule.name,
            message: error,
            severity: 'error',
            category: rule.category
          });
        }

        // Add warnings
        for (const warning of result.warnings) {
          issues.push({
            entityIndex: index,
            ruleName: rule.name,
            message: warning,
            severity: 'warning',
            category: rule.category
          });
        }
      } catch (error) {
        issues.push({
          entityIndex: index,
          ruleName: rule.name,
          message: `Validation rule failed: ${error}`,
          severity: 'error',
          category: 'system'
        });
      }
    }

    return issues;
  }

  /**
   * Cross-validation for users (uniqueness checks)
   */
  private validateUserCrossReferences(users: UserData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const emails = new Set<string>();
    const slugs = new Set<string>();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Check email uniqueness
      if (emails.has(user.email)) {
        issues.push({
          entityIndex: i,
          ruleName: 'email_uniqueness',
          message: `Duplicate email: ${user.email}`,
          severity: 'error',
          category: 'uniqueness'
        });
      } else {
        emails.add(user.email);
      }

      // Check slug uniqueness
      if (slugs.has(user.profile.slug)) {
        issues.push({
          entityIndex: i,
          ruleName: 'slug_uniqueness',
          message: `Duplicate slug: ${user.profile.slug}`,
          severity: 'error',
          category: 'uniqueness'
        });
      } else {
        slugs.add(user.profile.slug);
      }
    }

    return issues;
  }

  /**
   * Cross-validation for projects
   */
  private validateProjectCrossReferences(projects: ProjectData[], context: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Validate client references exist
    const clientIds = new Set(context.users.filter(u => u.role === 'client').map(u => u as any));
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      
      if (!clientIds.has(project.client)) {
        issues.push({
          entityIndex: i,
          ruleName: 'client_reference',
          message: 'Referenced client does not exist',
          severity: 'error',
          category: 'reference'
        });
      }
    }

    return issues;
  }

  /**
   * Cross-validation for proposals
   */
  private validateProposalCrossReferences(proposals: ProposalData[], context: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const projectIds = new Set(context.projects.map(p => p as any));
    const freelancerIds = new Set(context.users.filter(u => u.role === 'freelancer').map(u => u as any));
    
    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      
      if (!projectIds.has(proposal.project)) {
        issues.push({
          entityIndex: i,
          ruleName: 'project_reference',
          message: 'Referenced project does not exist',
          severity: 'error',
          category: 'reference'
        });
      }
      
      if (!freelancerIds.has(proposal.freelancer)) {
        issues.push({
          entityIndex: i,
          ruleName: 'freelancer_reference',
          message: 'Referenced freelancer does not exist',
          severity: 'error',
          category: 'reference'
        });
      }
    }

    return issues;
  }

  /**
   * Cross-validation for contracts
   */
  private validateContractCrossReferences(contracts: ContractData[], context: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const proposalIds = new Set(context.proposals.map(p => p as any));
    
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      
      if (!proposalIds.has(contract.proposal)) {
        issues.push({
          entityIndex: i,
          ruleName: 'proposal_reference',
          message: 'Referenced proposal does not exist',
          severity: 'error',
          category: 'reference'
        });
      }
    }

    return issues;
  }

  /**
   * Cross-validation for reviews
   */
  private validateReviewCrossReferences(reviews: ReviewData[], context: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const contractIds = new Set(context.contracts.map(c => c as any));
    
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      
      if (!contractIds.has(review.contract)) {
        issues.push({
          entityIndex: i,
          ruleName: 'contract_reference',
          message: 'Referenced contract does not exist',
          severity: 'error',
          category: 'reference'
        });
      }
    }

    return issues;
  }

  /**
   * Create validation report
   */
  private createValidationReport(
    entityType: string,
    totalEntities: number,
    validEntities: number,
    issues: ValidationIssue[],
    validationTime: number
  ): ValidationReport {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    return {
      entityType,
      totalEntities,
      validEntities,
      invalidEntities: totalEntities - validEntities,
      errors,
      warnings,
      infos,
      validationTime
    };
  }
}